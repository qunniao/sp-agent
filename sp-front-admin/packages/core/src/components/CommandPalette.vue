<template>
  <!--
    命令面板 ⌘K
    搜索菜单项并快速跳转，支持键盘导航
  -->
  <Teleport to="body">
    <Transition name="cmd-fade">
      <div v-if="isOpen" class="cmd-overlay" @click.self="close">
        <div class="cmd-panel">
          <!-- 搜索输入 -->
          <div class="cmd-panel__input-wrap">
            <SearchOutlined class="cmd-panel__search-icon" />
            <input
              ref="inputRef"
              v-model="query"
              class="cmd-panel__input"
              placeholder="搜索菜单..."
              autocomplete="off"
              @keydown="onPanelKeyDown"
              @input="onInput"
            />
            <kbd class="cmd-panel__kbd">ESC</kbd>
          </div>

          <!-- 结果列表 -->
          <div v-if="filteredItems.length" class="cmd-panel__results">
            <div
              v-for="(item, idx) in filteredItems"
              :key="item.path"
              ref="itemRefs"
              class="cmd-item"
              :class="{ 'cmd-item--active': idx === activeIdx }"
              @click="selectItem(item)"
              @mouseenter="activeIdx = idx"
            >
              <div class="cmd-item__left">
                <span class="cmd-item__icon" v-if="item.icon">{{ getIconChar(item.icon) }}</span>
                <span class="cmd-item__title">{{ item.title }}</span>
                <span v-if="item.subtitle" class="cmd-item__subtitle">{{ item.subtitle }}</span>
              </div>
              <span class="cmd-item__path">{{ item.path }}</span>
            </div>
          </div>

          <!-- 无结果 -->
          <div v-else class="cmd-panel__empty">
            <a-empty :image="false" description="未找到匹配的菜单项" />
          </div>

          <!-- 底部提示 -->
          <div class="cmd-panel__footer">
            <span><kbd>↑↓</kbd> 导航</span>
            <span><kbd>↵</kbd> 跳转</span>
            <span><kbd>ESC</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, type PropType } from "vue";
import { SearchOutlined } from "@ant-design/icons-vue";
import type { CommandItem } from "../composables/useCommandPalette";

// ---- Props ----
const props = defineProps({
  isOpen: { type: Boolean, required: true },
  items: { type: Array as PropType<CommandItem[]>, required: true },
});

// ---- Emits ----
const emit = defineEmits<{
  close: [];
  select: [item: CommandItem];
  updateQuery: [value: string];
}>();

// ---- 内部状态 ----
const query = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const itemRefs = ref<HTMLElement[]>([]);
const activeIdx = ref(0);

// 过滤后的结果（外部传入 items 已过滤）
// 这里简化为直接使用外部过滤结果，内部 query 用于输入显示
const filteredItems = defineModel<CommandItem[]>("filteredItems", { required: true });

// ---- 自动聚焦 ----
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      activeIdx.value = 0;
      nextTick(() => inputRef.value?.focus());
    }
  }
);

// ---- 键盘导航 ----
function onPanelKeyDown(e: KeyboardEvent): void {
  const len = props.items.length;
  if (!len) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      activeIdx.value = (activeIdx.value + 1) % len;
      scrollToActive();
      break;
    case "ArrowUp":
      e.preventDefault();
      activeIdx.value = (activeIdx.value - 1 + len) % len;
      scrollToActive();
      break;
    case "Enter":
      e.preventDefault();
      if (props.items[activeIdx.value]) {
        selectItem(props.items[activeIdx.value]);
      }
      break;
  }
}

function onInput(): void {
  emit("updateQuery", query.value);
  activeIdx.value = 0;
}

function scrollToActive(): void {
  nextTick(() => {
    const el = itemRefs.value[activeIdx.value];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

// ---- 选择 ----
function selectItem(item: CommandItem): void {
  query.value = "";
  emit("select", item);
}

function close(): void {
  query.value = "";
  emit("close");
}

// ---- 图标映射（简化的 emoji 映射，非完整图标） ----
function getIconChar(icon: string): string {
  const map: Record<string, string> = {
    HomeOutlined: "🏠",
    SettingOutlined: "⚙️",
    TeamOutlined: "👥",
    SafetyOutlined: "🛡️",
    ThunderboltOutlined: "⚡",
    DatabaseOutlined: "📚",
    FileOutlined: "📁",
    FileTextOutlined: "📄",
    FileSearchOutlined: "🔍",
    ProfileOutlined: "📋",
    SafetyCertificateOutlined: "🔐",
    MenuOutlined: "📋",
    BarsOutlined: "📊",
    UnorderedListOutlined: "📝",
    ControlOutlined: "🎛️",
    ToolOutlined: "🔧",
  };
  return map[icon] || "📌";
}
</script>

<style lang="less" scoped>
.cmd-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  background: rgba(0, 0, 0, 0.45);
}

.cmd-panel {
  width: 560px;
  max-height: 460px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  // ---- 搜索输入 ----
  &__input-wrap {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    gap: 12px;
  }

  &__search-icon {
    font-size: 18px;
    color: #999;
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 16px;
    color: #333;
    background: transparent;

    &::placeholder {
      color: #bbb;
    }
  }

  &__kbd {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 6px;
    background: #f5f5f5;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 11px;
    color: #999;
    font-family: monospace;
    flex-shrink: 0;
  }

  // ---- 结果列表 ----
  &__results {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    min-height: 60px;
    max-height: 300px;
  }

  &__empty {
    padding: 32px 0;
    text-align: center;
  }

  // ---- 底部 ----
  &__footer {
    display: flex;
    gap: 16px;
    padding: 10px 20px;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
    font-size: 12px;
    color: #999;

    kbd {
      display: inline-flex;
      align-items: center;
      height: 18px;
      padding: 0 4px;
      background: #f5f5f5;
      border: 1px solid #d9d9d9;
      border-radius: 3px;
      font-size: 10px;
      font-family: monospace;
    }
  }
}

// ---- 单个命令项 ----
.cmd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;

  &--active {
    background: #e6f4ff;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
  }

  &__icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
  }

  &__subtitle {
    font-size: 12px;
    color: #999;
    white-space: nowrap;
  }

  &__path {
    font-size: 12px;
    color: #bbb;
    font-family: monospace;
    flex-shrink: 0;
    margin-left: 16px;
  }
}

// ---- 过渡动画 ----
.cmd-fade-enter-active,
.cmd-fade-leave-active {
  transition: opacity 0.15s ease;
}

.cmd-fade-enter-from,
.cmd-fade-leave-to {
  opacity: 0;
}
</style>
