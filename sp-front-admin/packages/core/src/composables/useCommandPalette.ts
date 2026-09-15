import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

export interface CommandItem {
  /** 显示标题 */
  title: string;
  /** 副标题（父级菜单名） */
  subtitle?: string;
  /** 完整跳转路径 */
  path: string;
  /** 图标名 */
  icon?: string;
}

/**
 * 命令面板 composable
 *
 * 从 Vue Router 已注册路由中提取所有可导航菜单项，构建可搜索的命令列表。
 * 注册 ⌘K / Ctrl+K 快捷键唤起面板。
 *
 * 必须在 setup 中调用（内部使用了 useRouter）。
 *
 * @example
 * ```ts
 * const { isOpen, filteredItems, query, search, selectItem, toggle, close } = useCommandPalette();
 * ```
 */
export function useCommandPalette() {
  const router = useRouter();
  const isOpen = ref(false);
  const query = ref("");

  /**
   * 从已注册路由中递归收集所有有 title meta 的路由
   */
  function collectCommands(): CommandItem[] {
    const routes = router.getRoutes();
    const result: CommandItem[] = [];
    const seen = new Set<string>();

    for (const route of routes) {
      const title = route.meta?.title as string | undefined;
      if (!title) continue;
      // 跳过隐藏页
      if (route.meta?.hidden) continue;
      // 去重（同一 path 只保留一次）
      if (seen.has(route.path)) continue;
      seen.add(route.path);

      result.push({
        title,
        path: route.path,
        icon: (route.meta?.icon as string) || undefined,
      });
    }

    return result;
  }

  const allItems = computed(() => collectCommands());

  /**
   * 按搜索词过滤命令
   */
  const filteredItems = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return allItems.value;

    // 模糊匹配：标题 > 副标题 > 路径
    const starts = allItems.value.filter((item) => item.title.toLowerCase().startsWith(q));
    const contains = allItems.value.filter(
      (item) =>
        !starts.includes(item) &&
        (item.title.toLowerCase().includes(q) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
          item.path.toLowerCase().includes(q))
    );
    return [...starts, ...contains];
  });

  // ==================== 操作方法 ====================

  function open(): void {
    query.value = "";
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
    query.value = "";
  }

  function toggle(): void {
    isOpen.value ? close() : open();
  }

  function search(val: string): void {
    query.value = val;
  }

  function selectItem(item: CommandItem): void {
    close();
    router.push(item.path);
  }

  // ==================== 快捷键 ====================
  function onKeyDown(e: KeyboardEvent): void {
    // ⌘K (Mac) or Ctrl+K (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      toggle();
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", onKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", onKeyDown);
  });

  return {
    isOpen,
    query,
    allItems,
    filteredItems,
    open,
    close,
    toggle,
    search,
    selectItem,
  };
}
