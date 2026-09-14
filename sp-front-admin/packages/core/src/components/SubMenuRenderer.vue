<template>
  <!--
    SubMenuRenderer 递归菜单组件
    parentPath 从上层传入，拼出完整路径作为 menu-item 的 key
  -->
  <template v-for="item in visibleRoutes" :key="fullPath(item)">
    <!-- 有可见子路由：渲染为 sub-menu -->
    <a-sub-menu v-if="hasVisibleChildren(item)" :key="fullPath(item)">
      <template #title>
        <span class="menu-title">
          <component :is="getIcon(item.meta?.icon)" v-if="item.meta?.icon" />
          <span>{{ item.meta?.title || item.name }}</span>
        </span>
      </template>
      <SubMenuRenderer
        :routes="item.children || []"
        :parent-path="fullPath(item)"
        :icon-resolver="iconResolver"
      />
    </a-sub-menu>

    <!-- 叶子菜单项：key 用完整路径，点击时 a-menu @click 传 { key: '/system/users' } -->
    <a-menu-item v-else :key="fullPath(item)">
      <component :is="getIcon(item.meta?.icon)" v-if="item.meta?.icon" />
      <span>{{ item.meta?.title || item.name }}</span>
    </a-menu-item>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RouteRecordRaw } from "vue-router";
import type { FunctionalComponent, HTMLAttributes, VNodeProps } from "vue";

type IconType = FunctionalComponent<HTMLAttributes & VNodeProps>;

const props = defineProps<{
  routes: RouteRecordRaw[];
  /** 上级路径，用于拼出完整路径。根级传空字符串 */
  parentPath?: string;
  iconResolver: (name?: string) => IconType | null;
}>();

/** 计算完整路径：绝对路径直接返回，相对路径拼上 parent */
function fullPath(item: RouteRecordRaw): string {
  const p = item.path;
  if (p.startsWith("/")) return p;
  return props.parentPath ? `${props.parentPath}/${p}` : `/${p}`;
}

const visibleRoutes = computed(() =>
  props.routes.filter((r) => r.path !== "" && r.meta?.hidden !== true)
);

function getIcon(iconName?: unknown): IconType | null {
  if (typeof iconName === "string") return props.iconResolver(iconName);
  return null;
}

function hasVisibleChildren(item: RouteRecordRaw): boolean {
  if (!item.children?.length) return false;
  return item.children.some(
    (child) => child.path !== "" && child.meta?.hidden !== true
  );
}
</script>

<script lang="ts">
export default { name: "SubMenuRenderer" };
</script>
