<template>
  <div class="flow-canvas" ref="canvasRef" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp">
    <!-- SVG 连线层 -->
    <svg class="flow-canvas__svg">
      <path
        v-for="edge in edges"
        :key="edge.id"
        :d="edgePath(edge)"
        class="flow-edge"
        :class="{ 'flow-edge--dragging': draggingEdge?.id === edge.id }"
      />
      <!-- 拖拽中的临时线 -->
      <line
        v-if="draggingEdge"
        :x1="draggingEdge.x1" :y1="draggingEdge.y1"
        :x2="draggingEdge.x2" :y2="draggingEdge.y2"
        class="flow-edge flow-edge--temp"
      />
    </svg>

    <!-- 节点层 -->
    <div
      v-for="node in layoutNodes"
      :key="node.id"
      :class="['flow-node', `flow-node--${node.type}`]"
      :style="{ left: node.x + 'px', top: node.y + 'px' }"
      @mousedown="onNodeDrag($event, node)"
      @click.stop="selectNode(node)"
    >
      <!-- 输入连接点 -->
      <div class="flow-node__port flow-node__port--in" @mousedown.stop="onPortDrag($event, node, 'in')"></div>

      <div class="flow-node__body">
        <span class="flow-node__icon">{{ typeIcon(node.type) }}</span>
        <span class="flow-node__title">{{ node.title }}</span>
      </div>

      <!-- 输出连接点 -->
      <div class="flow-node__port flow-node__port--out" @mousedown.stop="onPortDrag($event, node, 'out')"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";

export interface FlowNode {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  fromPort?: "out";
  toPort?: "in";
}

const props = defineProps<{ nodes: FlowNode[]; edges: FlowEdge[] }>();
const emit = defineEmits<{
  selectNode: [nodeId: string];
  addEdge: [from: string, to: string];
  moveNode: [nodeId: string, x: number, y: number];
}>();

const canvasRef = ref<HTMLElement | null>(null);

// 节点布局（带默认位置）
const layoutNodes = computed(() =>
  props.nodes.map((n, i) => ({
    ...n,
    x: n.x || 60,
    y: n.y || 60 + i * 100,
  }))
);

function typeIcon(type: string): string {
  const m: Record<string, string> = {
    start: "▶️", end: "🏁", "ai.chat": "🤖", "agent.team": "🤝", "dify.workflow": "🔌",
    "platform.post": "📮", "http.request": "🌐", condition: "🔀", delay: "⏱️",
    notification: "📬", transform: "🔄",
  };
  return m[type] || "❓";
}

// 拖拽节点
const draggingNode = ref<string | null>(null);
const dragOffset = { x: 0, y: 0 };

function onNodeDrag(e: MouseEvent, node: FlowNode) {
  draggingNode.value = node.id;
  dragOffset.x = e.clientX - node.x;
  dragOffset.y = e.clientY - node.y;
}

function onMouseMove(e: MouseEvent) {
  if (draggingNode.value) {
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    emit("moveNode", draggingNode.value, Math.max(0, x), Math.max(0, y));
  }
  if (draggingEdge.value) {
    draggingEdge.value.x2 = e.clientX - (canvasRef.value?.getBoundingClientRect().left || 0);
    draggingEdge.value.y2 = e.clientY - (canvasRef.value?.getBoundingClientRect().top || 0);
  }
}

function onMouseUp(e: MouseEvent) {
  if (draggingEdge.value) {
    // 检测是否落在某个节点的输入端口上
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const portEl = target?.closest?.(".flow-node__port--in");
    if (portEl) {
      const nodeEl = portEl.closest(".flow-node");
      const targetId = nodeEl?.getAttribute("data-node-id");
      if (targetId && targetId !== draggingEdge.value.from) {
        emit("addEdge", draggingEdge.value.from, targetId);
      }
    }
    draggingEdge.value = null;
  }
  draggingNode.value = null;
}

// 连线拖拽
const draggingEdge = ref<{ id?: string; from: string; x1: number; y1: number; x2: number; y2: number } | null>(null);

function onPortDrag(e: MouseEvent, node: FlowNode, port: "in" | "out") {
  if (port !== "out") return;
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const x1 = node.x + 140; // 节点右边缘
  const y1 = node.y + 30;  // 节点垂直中心
  draggingEdge.value = { from: node.id, x1, y1, x2: x1, y2: y1 };
}

function edgePath(edge: FlowEdge): string {
  const from = layoutNodes.value.find((n) => n.id === edge.from);
  const to = layoutNodes.value.find((n) => n.id === edge.to);
  if (!from || !to) return "";
  const x1 = from.x + 140;
  const y1 = from.y + 30;
  const x2 = to.x;
  const y2 = to.y + 30;
  const cx1 = x1 + (x2 - x1) * 0.5;
  const cx2 = x1 + (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${cx1} ${y1} ${cx2} ${y2} ${x2} ${y2}`;
}

function selectNode(node: FlowNode) {
  emit("selectNode", node.id);
}
</script>

<style scoped>
.flow-canvas {
  position: relative;
  min-height: 500px;
  background: #fafbfc;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  overflow: auto;
  background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
  background-size: 20px 20px;
}
.flow-canvas__svg {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 连线 */
.flow-edge {
  fill: none; stroke: #b3d4ff; stroke-width: 2;
  marker-end: url(#arrowhead);
}
.flow-edge--dragging { stroke: #722ed1; stroke-width: 3; }
.flow-edge--temp { stroke: #722ed1; stroke-width: 2; stroke-dasharray: 6 3; pointer-events: auto; }

/* 节点 */
.flow-node {
  position: absolute; z-index: 2;
  width: 140px; padding: 10px 12px;
  background: #fff; border: 2px solid #e8e8e8;
  border-radius: 10px; cursor: grab; user-select: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: box-shadow 0.15s;
}
.flow-node:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); border-color: #1677ff; }
.flow-node--start { border-color: #52c41a; background: #f6ffed; }
.flow-node--end { border-color: #ff4d4f; background: #fff2f0; }
.flow-node--ai\.chat, .flow-node--agent\.team { border-color: #722ed1; background: #f9f0ff; }
.flow-node--condition { border-color: #faad14; background: #fffbe6; }
.flow-node--dify\.workflow { border-color: #1677ff; background: #f0f5ff; }

.flow-node__body { display: flex; align-items: center; gap: 6px; }
.flow-node__icon { font-size: 18px; }
.flow-node__title { font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 连接端口 */
.flow-node__port {
  position: absolute; width: 12px; height: 12px;
  border-radius: 50%; background: #fff; border: 2px solid #1677ff;
  cursor: crosshair; z-index: 3;
}
.flow-node__port--in { left: -6px; top: 50%; transform: translateY(-50%); }
.flow-node__port--out { right: -6px; top: 50%; transform: translateY(-50%); }
.flow-node__port:hover { background: #1677ff; transform: translateY(-50%) scale(1.3); }
</style>
