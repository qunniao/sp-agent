<template>
  <!--
    ProLayout 主布局组件
    三段式结构：顶部导航栏 + 左侧菜单 + 右侧内容区
    支持侧边栏折叠，适配各种屏幕尺寸
  -->
  <a-layout class="pro-layout">
    <!-- ====== 侧边栏 ====== -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      :width="220"
      class="pro-layout__sider"
    >
      <!-- Logo 区域 -->
      <div class="pro-layout__logo">
        <img src="@/assets/logo.svg" alt="logo" class="pro-layout__logo-img" />
        <span v-show="!collapsed" class="pro-layout__logo-text">SuperOne</span>
      </div>

      <!-- 菜单导航 - 递归渲染，支持无限层级 -->
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        theme="dark"
        :inline-collapsed="collapsed"
        @click="handleMenuClick"
      >
        <SubMenuRenderer
          :routes="menuTree"
          :icon-resolver="getIconComp"
        />
      </a-menu>
    </a-layout-sider>

    <!-- ====== 右侧主体 ====== -->
    <a-layout
      class="pro-layout__main"
      :class="{ 'pro-layout__main--collapsed': collapsed }"
    >
      <!-- 顶部导航栏 -->
      <a-layout-header class="pro-layout__header">
        <div class="pro-layout__header-left">
          <!-- 折叠/展开按钮 -->
          <component
            :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
            class="pro-layout__trigger"
            @click="toggleCollapsed"
          />
          <!-- 面包屑导航 -->
          <a-breadcrumb class="pro-layout__breadcrumb">
            <a-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>

        <div class="pro-layout__header-right">
          <!-- 命令面板入口 -->
          <a-tooltip title="搜索菜单 (⌘K)">
            <span class="pro-layout__cmd-btn" @click="openCmdPalette">
              <SearchOutlined class="pro-layout__cmd-icon" />
              <kbd class="pro-layout__cmd-kbd">⌘K</kbd>
            </span>
          </a-tooltip>

          <!-- 用户头像下拉菜单 -->
          <a-dropdown>
            <span class="pro-layout__user">
              <a-avatar :size="32" :src="authStore.avatar">
                {{ authStore.nickname.charAt(0) }}
              </a-avatar>
              <span class="pro-layout__nickname">{{ authStore.nickname }}</span>
            </span>
            <template #overlay>
              <a-menu @click="handleUserMenu">
                <a-menu-item key="profile">个人中心</a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" danger>退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- ====== 多标签页 ====== -->
      <TabView />

      <!-- 内容区域 -->
      <a-layout-content class="pro-layout__content">
        <router-view v-slot="{ Component }">
          <keep-alive :include="cachedViewNames">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </a-layout-content>
    </a-layout>

    <!-- ====== 命令面板 ====== -->
    <CommandPalette
      :is-open="cmdPalette.isOpen.value"
      v-model:filtered-items="cmdPalette.filteredItems.value"
      :items="cmdPalette.filteredItems.value"
      @close="cmdPalette.close"
      @select="cmdPalette.selectItem"
      @update-query="cmdPalette.search"
    />
  </a-layout>
</template>

<script setup lang="ts">
/**
 * ProLayout 主布局
 *
 * 职责：
 * 1. 提供统一的侧边栏 + 顶栏 + 内容区布局
 * 2. 根据路由动态生成菜单和面包屑
 * 3. 管理侧边栏折叠状态
 *
 * 模块只需要关注自己的页面内容，布局由本组件统一处理
 */
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import type { RouteRecordRaw, RouteRecordNormalized } from "vue-router";
import { useAppStore } from "../stores/app";
import { useAuthStore } from "../stores/auth";
import SubMenuRenderer from "./SubMenuRenderer.vue";
import CommandPalette from "./CommandPalette.vue";
import TabView from "./TabView.vue";
import { menuRegistry } from "../utils/menuRegistry";
import { useCommandPalette } from "../composables/useCommandPalette";
import { useTabsStore } from "../stores/tabs";
import {
  HomeOutlined,
  SettingOutlined,
  TeamOutlined,
  SafetyOutlined,
  MenuOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DatabaseOutlined,
  BarsOutlined,
  UnorderedListOutlined,
  FileOutlined,
  FileTextOutlined,
  ProfileOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
  ControlOutlined,
  ToolOutlined,
  SearchOutlined,
  SendOutlined,
  HistoryOutlined,
  RobotOutlined,
  ApartmentOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  LeftOutlined,
  RightOutlined,
  DashboardOutlined,
  BulbOutlined,
  BarChartOutlined,
  CommentOutlined,
  UsergroupAddOutlined,
  IdcardOutlined,
  CustomerServiceOutlined,
  InboxOutlined,
  ApiOutlined,
} from "@ant-design/icons-vue";
import type { FunctionalComponent, HTMLAttributes, VNodeProps } from "vue";

type IconType = FunctionalComponent<HTMLAttributes & VNodeProps>;

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();
const tabsStore = useTabsStore();

// ---- 多标签页：监听路由自动打开标签 ----
tabsStore.initRouter(router);

watch(
  () => route.path,
  (path) => {
    if (!path || path === "/") return;
    const title = (route.meta?.title as string) || path;
    const icon = (route.meta?.icon as string) || undefined;
    tabsStore.openTab({ path, title, icon });
    tabsStore.setActivePath(path);
  },
  { immediate: true }
);

// ---- 命令面板 ----
const cmdPalette = useCommandPalette();

function openCmdPalette(): void {
  cmdPalette.open();
}

// ---- 侧边栏折叠 ----
const collapsed = computed(() => appStore.sidebarCollapsed);

function toggleCollapsed(): void {
  appStore.toggleSidebar();
}

// ---- 图标映射表 ----
// 字符串到真实图标组件的映射，新增图标在此注册即可
const iconMap: Record<string, IconType> = {
  HomeOutlined,
  SettingOutlined,
  TeamOutlined,
  SafetyOutlined,
  MenuOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  // 新增模块图标
  DatabaseOutlined,
  BarsOutlined,
  UnorderedListOutlined,
  FileOutlined,
  FileTextOutlined,
  ProfileOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
  ControlOutlined,
  ToolOutlined,
  SendOutlined,
  HistoryOutlined,
  RobotOutlined,
  ApartmentOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  LeftOutlined,
  RightOutlined,
  DashboardOutlined,
  BulbOutlined,
  BarChartOutlined,
  CommentOutlined,
  UsergroupAddOutlined,
  IdcardOutlined,
  CustomerServiceOutlined,
  InboxOutlined,
  ApiOutlined,
};

/**
 * 根据图标名称字符串获取对应的图标组件
 * 如果找不到对应图标，返回 null（不显示图标）
 */
function getIconComp(iconName?: string): IconType | null {
  if (!iconName) return null;
  return iconMap[iconName] || null;
}

// ---- 菜单树 ----
const selectedKeys = ref<string[]>([route.path]);
const openKeys = ref<string[]>([]);

/**
 * 从路由表构建菜单树
 *
 * 读取 DefaultLayout (path="/") 下的所有子路由
 * 过滤掉 hidden:true 的页面，按 sort 排序
 * 使用 router.getRoutes() 获取动态注册后的路由
 */
const menuTree = computed(() => {
  // 直接从共享的 menuRegistry 读取，不依赖 router.getRoutes()
  if (!menuRegistry.length) {
    console.warn("[ProLayout] menuRegistry 为空，菜单不显示");
    return [];
  }

  const menu = menuRegistry
    .filter((child) => child.path !== "" && child.meta?.hidden !== true)
    .sort((a, b) => {
      const sortA = (a.meta?.sort as number) || 99;
      const sortB = (b.meta?.sort as number) || 99;
      return sortA - sortB;
    });

  console.log("[ProLayout] 菜单项:", menu.map((m) => `${m.meta?.sort} ${m.meta?.title || m.path}`));
  return menu;
});

// ---- 面包屑 ----
const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta?.title);
  return matched.map((item) => ({
    path: item.path,
    title: item.meta?.title as string,
  }));
});

// ---- 缓存页面 ----
const cachedViewNames = computed(() => {
  const allRoutes = router.getRoutes();
  const names: string[] = [];
  function collect(routeList: readonly (RouteRecordRaw | RouteRecordNormalized)[]): void {
    routeList.forEach((r) => {
      if (r.meta?.keepAlive && r.name) {
        names.push(r.name as string);
      }
      if (r.children) {
        collect(r.children);
      }
    });
  }
  collect(allRoutes);
  return names;
});

// ---- 菜单点击 ----
// SubMenuRenderer emit 的是 path 字符串，a-menu @click 传的是 { key } 对象，兼容两者
function handleMenuClick(keyOrEvent: string | { key: string }): void {
  const path = typeof keyOrEvent === "string" ? keyOrEvent : keyOrEvent.key;
  if (path) router.push(path);
}

// ---- 用户下拉菜单 ----
function handleUserMenu({ key }: { key: string }): void {
  switch (key) {
    case "profile":
      router.push("/profile");
      break;
    case "logout":
      authStore.logout();
      break;
  }
}

// ---- 同步当前路由到菜单选中状态 ----
watch(
  () => route.path,
  (path) => {
    selectedKeys.value = [path];
    // 自动展开父菜单
    const matched = route.matched;
    if (matched.length > 1) {
      const parentPath = matched[matched.length - 2]?.path;
      if (parentPath && !openKeys.value.includes(parentPath)) {
        openKeys.value = [...openKeys.value, parentPath];
      }
    }
  },
  { immediate: true }
);
</script>

<style lang="less" scoped>
.pro-layout {
  height: 100vh;
  overflow: hidden;

  // ---- 侧边栏 ----
  &__sider {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
    overflow-y: auto;
    overflow-x: hidden;
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    white-space: nowrap;
  }

  &__logo-img {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  &__logo-text {
    margin-left: 12px;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }

  // ---- 主体区域 ----
  &__main {
    margin-left: 220px;
    transition: margin-left 0.2s ease;

    // 侧边栏折叠时缩小左边距
    &--collapsed {
      margin-left: 80px;
    }
  }

  // ---- 顶部导航栏 ----
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 24px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    position: sticky;
    top: 0;
    z-index: 9;
    line-height: 64px;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__trigger {
    font-size: 18px;
    cursor: pointer;
    transition: color 0.3s;
    color: #333;

    &:hover {
      color: #1677ff;
    }
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  // ---- 命令面板入口 ----
  &__cmd-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #ebebeb;
      border-color: #d0d0d0;
    }
  }

  &__cmd-icon {
    font-size: 14px;
    color: #666;
  }

  &__cmd-kbd {
    display: inline-flex;
    align-items: center;
    height: 18px;
    padding: 0 4px;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 3px;
    font-size: 10px;
    color: #999;
    font-family: monospace;
    line-height: 1;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.2s;

    &:hover {
      background: #f5f5f5;
    }
  }

  &__nickname {
    font-size: 14px;
    color: #333;
  }

  // ---- 内容区 ----
  &__content {
    min-height: calc(100vh - 64px);
    padding: 24px;
    background: #f0f2f5;
    overflow-y: auto;
  }
}

// 菜单标题样式（非 scope，用于 sub-menu title）
.menu-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
