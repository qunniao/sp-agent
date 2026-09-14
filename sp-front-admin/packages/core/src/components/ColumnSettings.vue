<template>
  <!--
    列设置下拉面板
    用于表格右上角，弹出 checkbox 列表管理列显隐
  -->
  <a-dropdown v-model:open="open" :trigger="['click']" placement="bottomRight">
    <a-tooltip title="列设置">
      <a-button size="small" type="text"><SettingOutlined /></a-button>
    </a-tooltip>
    <template #overlay>
      <div class="col-settings-panel">
        <div class="col-settings-panel__header">
          <span>列设置</span>
          <a-space size="small">
            <a @click="emit('selectAll')">全选</a>
            <a @click="emit('resetDefaults')">重置</a>
          </a-space>
        </div>
        <a-checkbox-group
          :value="checkedKeys"
          class="col-settings-panel__list"
          @change="onChange"
        >
          <div
            v-for="col in columnConfigs"
            :key="col.key"
            class="col-settings-item"
          >
            <a-checkbox :value="col.key" :disabled="col.disabled">
              {{ col.title }}
            </a-checkbox>
          </div>
        </a-checkbox-group>
      </div>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { SettingOutlined } from "@ant-design/icons-vue";
import type { ColumnSetting } from "../composables/useColumnSetting";

// ---- Props ----
const props = defineProps<{
  columnConfigs: (ColumnSetting & { visible: boolean; disabled: boolean })[];
}>();

// ---- Model ----
const open = defineModel<boolean>("open", { required: true });

// ---- Emits ----
const emit = defineEmits<{
  toggle: [key: string];
  selectAll: [];
  resetDefaults: [];
}>();

// ---- 已选中的 key 列表 ----
const checkedKeys = computed(() =>
  props.columnConfigs.filter((c) => c.visible).map((c) => c.key)
);

function onChange(keys: (string | number)[]): void {
  // a-checkbox-group 的 change 事件传回当前所有选中 key
  // 需要根据 checkedKeys 的差异判断被点击的是哪个
  const oldSet = new Set(checkedKeys.value.map(String));
  const newSet = new Set(keys.map(String));

  // 找新增或移除的 key
  for (const col of props.columnConfigs) {
    const wasChecked = oldSet.has(col.key);
    const isChecked = newSet.has(col.key);
    if (wasChecked !== isChecked) {
      emit("toggle", col.key);
      break; // 一次只处理一个变化
    }
  }
}
</script>

<style lang="less" scoped>
.col-settings-panel {
  width: 200px;
  padding: 8px 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px 8px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
    font-weight: 600;
  }

  &__list {
    display: flex;
    flex-direction: column;
    padding: 8px 12px 0;
  }
}

.col-settings-item {
  padding: 4px 0;
}
</style>
