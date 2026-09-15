import { ref, computed, watch } from "vue";

export interface ColumnSetting {
  key: string;
  title: string;
  /** 是否必选（不可隐藏） */
  required?: boolean;
  /** 默认可见 */
  defaultVisible?: boolean;
}

/**
 * 表格列自定义 composable
 *
 * 支持显示/隐藏列，偏好自动持久化到 localStorage。
 *
 * @param storageKey - 用于区分不同表格的存储 key（如 "operation_log_columns"）
 * @param allColumns - 完整列定义
 *
 * @example
 * ```ts
 * const { visibleColumns, settingsOpen, toggleSettings } = useColumnSetting("user_columns", [
 *   { key: "id", title: "ID", required: true },
 *   { key: "username", title: "用户名", defaultVisible: true },
 * ]);
 * // visibleColumns 是过滤后的配置数组，直接传给 a-table :columns
 * ```
 */
export function useColumnSetting(storageKey: string, allColumns: ColumnSetting[]) {
  /** 可见列 key 集合 */
  const visibleKeys = ref<Set<string>>(new Set(loadKeys()));

  function loadKeys(): string[] {
    try {
      const raw = localStorage.getItem(`sp_col_${storageKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    // 默认：排除 defaultVisible === false 的列
    return allColumns.filter((c) => c.defaultVisible !== false).map((c) => c.key);
  }

  function saveKeys(): void {
    try {
      localStorage.setItem(`sp_col_${storageKey}`, JSON.stringify([...visibleKeys.value]));
    } catch { /* ignore */ }
  }

  const settingsOpen = ref(false);

  /** 所有列的配置数组（含 visible 状态） */
  const columnConfigs = computed(() =>
    allColumns.map((c) => ({
      ...c,
      visible: c.required ? true : visibleKeys.value.has(c.key),
      disabled: !!c.required,
    }))
  );

  /** 过滤后可直接传给 a-table 的 columns（仅包含 visible 的列） */
  const visibleColumns = computed<ColumnSetting[]>(() =>
    allColumns.filter((c) => visibleKeys.value.has(c.key))
  );

  function toggleSettings(): void {
    settingsOpen.value = !settingsOpen.value;
  }

  function toggleColumn(key: string): void {
    const next = new Set(visibleKeys.value);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    visibleKeys.value = next;
  }

  function selectAll(): void {
    visibleKeys.value = new Set(allColumns.map((c) => c.key));
  }

  function resetDefaults(): void {
    visibleKeys.value = new Set(
      allColumns.filter((c) => c.defaultVisible !== false).map((c) => c.key)
    );
  }

  // 变化时持久化
  watch(visibleKeys, saveKeys, { deep: true });

  return {
    visibleColumns,
    columnConfigs,
    settingsOpen,
    toggleSettings,
    toggleColumn,
    selectAll,
    resetDefaults,
  };
}
