<template>
  <a-card
    :bordered="true"
    :class="['step-card', { 'step-card--disabled': !step.enabled }]"
    size="small"
    :body-style="{ padding: '12px 16px' }"
  >
    <div class="step-card__header">
      <div class="step-card__left">
        <DragHandle class="step-card__drag" />
        <a-badge :count="index + 1" :number-style="{ backgroundColor: color }" />
        <span class="step-card__icon">{{ icon }}</span>
        <span class="step-card__title">{{ step.title }}</span>
        <a-tag :color="color" size="small">{{ typeLabel }}</a-tag>
      </div>
      <div class="step-card__right">
        <a-switch v-model:checked="step.enabled" size="small" @change="emit('update', step)" />
        <a-button type="link" size="small" @click="emit('edit', index)">
          <EditOutlined />
        </a-button>
        <a-popconfirm title="确定删除此步骤？" @confirm="emit('delete', index)">
          <a-button type="link" size="small" danger>
            <DeleteOutlined />
          </a-button>
        </a-popconfirm>
      </div>
    </div>

    <!-- 展开：显示配置摘要 -->
    <div class="step-card__summary" v-if="summary">
      <a-typography-text type="secondary" :ellipsis="{ rows: 2 }">{{ summary }}</a-typography-text>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import type { StepNode, StepType } from "../types";

const props = defineProps<{
  step: StepNode;
  index: number;
}>();

const emit = defineEmits<{
  edit: [index: number];
  delete: [index: number];
  update: [step: StepNode];
}>();

const TYPE_MAP: Record<StepType, { icon: string; label: string; color: string }> = {
  "ai.chat": { icon: "🤖", label: "AI 对话", color: "#722ed1" },
  "ai.generate_image": { icon: "🎨", label: "AI 生图", color: "#eb2f96" },
  "platform.post": { icon: "📮", label: "发布平台", color: "#fa541c" },
  "http.request": { icon: "🌐", label: "HTTP 请求", color: "#1677ff" },
  condition: { icon: "🔀", label: "条件分支", color: "#faad14" },
  delay: { icon: "⏱️", label: "延时", color: "#52c41a" },
  transform: { icon: "🔄", label: "数据转换", color: "#13c2c2" },
  notification: { icon: "📬", label: "通知", color: "#2f54eb" },
};

const typeInfo = computed(() => TYPE_MAP[props.step.type]);
const icon = computed(() => typeInfo.value?.icon || "❓");
const typeLabel = computed(() => typeInfo.value?.label || props.step.type);
const color = computed(() => typeInfo.value?.color || "#999");

const summary = computed(() => {
  const c = props.step.config as any;
  if (!c) return "";
  if (c.prompt) return c.prompt.slice(0, 100) + (c.prompt.length > 100 ? "..." : "");
  if (c.url) return `${c.method || "GET"} ${c.url}`;
  if (c.accountId) return `发布到已连接账号 (${c.accountId})`;
  if (c.expression) return `条件: ${c.expression}`;
  if (c.channel) return `通知渠道: ${c.channel}`;
  if (c.seconds) return `等待 ${c.seconds} 秒`;
  return "";
});

/** 拖拽手柄（纯视觉占位） */
function DragHandle(_props: any) {
  return null;
}
DragHandle.displayName = "DragHandle";
</script>

<style scoped>
.step-card {
  margin-bottom: 8px;
  transition: box-shadow 0.2s;
}
.step-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}
.step-card--disabled {
  opacity: 0.5;
}
.step-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.step-card__left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.step-card__right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.step-card__drag {
  cursor: grab;
  color: #bbb;
  user-select: none;
}
.step-card__icon {
  font-size: 18px;
}
.step-card__title {
  font-weight: 500;
}
.step-card__summary {
  margin-top: 8px;
  padding-left: 28px;
}
</style>
