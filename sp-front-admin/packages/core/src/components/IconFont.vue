<template>
  <!--
    IconFont 图标组件
    统一封装的图标渲染组件，支持 Ant Design 图标和自定义 SVG
  -->
  <component :is="iconComponent" v-if="iconComponent" :style="iconStyle" />
</template>

<script setup lang="ts">
/**
 * 图标组件
 * 封装图标的统一渲染方式
 *
 * 使用方式：
 * <IconFont icon="UserOutlined" :size="16" color="#1677ff" />
 *
 * 预留：后续可扩展到自定义 SVG 图标库
 */
import { computed, shallowRef, onMounted } from "vue";
import * as Icons from "@ant-design/icons-vue";
import type { CSSProperties } from "vue";

const props = defineProps({
  /** 图标名称，对应 Ant Design 图标库的导出名 */
  icon: {
    type: String,
    required: true,
  },
  /** 图标大小 (px) */
  size: {
    type: Number,
    default: 16,
  },
  /** 图标颜色 */
  color: {
    type: String,
    default: "",
  },
});

const iconComponent = shallowRef<unknown>(null);

// 动态查找图标组件
onMounted(() => {
  const iconMap = Icons as Record<string, unknown>;
  iconComponent.value = iconMap[props.icon] || null;
});

// 图标样式
const iconStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.size}px`,
  color: props.color || undefined,
}));
</script>
