<template>
  <div class="dify-flow">
    <div v-for="(node, i) in props.workflow?.nodes || []" :key="node.id" class="dify-flow__row">
      <div class="dify-flow__node-wrap">
        <div :class="['dify-node', `dify-node--${node.type}`]">
          <span class="dify-node__icon">{{ nodeIcon(node.type) }}</span>
          <span class="dify-node__title">{{ node.title }}</span>
        </div>
      </div>
      <!-- 连线 -->
      <div v-if="i < (props.workflow?.nodes.length || 0) - 1" class="dify-flow__edge">
        <div class="dify-flow__line"></div>
        <div class="dify-flow__arrow">▼</div>
        <div v-if="edgeLabel(i)" class="dify-flow__label">{{ edgeLabel(i) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DifyWorkflow } from "../types";

const props = defineProps<{ workflow: DifyWorkflow | null | undefined }>();

const ICONS: Record<string, string> = {
  start: "▶️", llm: "🤖", code: "💻", template: "📋", end: "🏁", knowledge: "📚", http: "🌐",
  condition: "🔀", answer: "💬", variable: "🔄",
};

function nodeIcon(type: string): string {
  return ICONS[type] || "⚙️";
}

function edgeLabel(index: number): string | null {
  if (!props.workflow) return null;
  const fromId = props.workflow.nodes[index]?.id;
  const edge = props.workflow.edges?.find((e) => e.from === fromId);
  return edge?.label || null;
}
</script>

<style scoped>
.dify-flow { display: flex; flex-direction: column; align-items: center; padding: 4px 0; }
.dify-flow__row { display: flex; flex-direction: column; align-items: center; }
.dify-flow__node-wrap { position: relative; }

.dify-node {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 10px; border: 2px solid #e8e8e8;
  background: #fff; font-size: 12px; font-weight: 500;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04); min-width: 120px;
}
.dify-node--start { border-color: #52c41a; background: #f6ffed; }
.dify-node--llm { border-color: #722ed1; background: #f9f0ff; }
.dify-node--code { border-color: #1677ff; background: #f0f5ff; }
.dify-node--template { border-color: #fa8c16; background: #fff7e6; }
.dify-node--end { border-color: #ff4d4f; background: #fff2f0; }
.dify-node__icon { font-size: 16px; }
.dify-node__title { white-space: nowrap; }

.dify-flow__edge { display: flex; flex-direction: column; align-items: center; padding: 2px 0; }
.dify-flow__line { width: 2px; height: 16px; background: #d9d9d9; }
.dify-flow__arrow { color: #bbb; font-size: 10px; line-height: 1; }
.dify-flow__label { font-size: 10px; color: #999; margin-top: 1px; background: #fff; padding: 1px 6px; border-radius: 4px; }
</style>
