<template>
  <!--
    多标签页 TabView
    在顶栏下方、内容区上方显示已打开的页面标签
    支持：点击切换、关闭、右键菜单、横向滚动
  -->
  <div v-if="tabs.length > 0" class="tab-view" @contextmenu.prevent>
    <!-- 左箭头 -->
    <span v-if="canScrollLeft" class="tab-view__arrow tab-view__arrow--left" @click="scrollLeft">
      <LeftOutlined />
    </span>

    <!-- 标签列表 -->
    <div ref="tabsRef" class="tab-view__list" @wheel.prevent="onWheel">
      <div
        v-for="tab in tabs"
        :key="tab.path"
        :ref="(el) => setTabRef(tab.path, el)"
        class="tab-item"
        :class="{ 'tab-item--active': tab.path === activePath }"
        @click="goTab(tab)"
        @contextmenu.prevent="onRightClick($event, tab)"
      >
        <span class="tab-item__icon" v-if="tab.icon">{{ getIconChar(tab.icon) }}</span>
        <span class="tab-item__title">{{ tab.title }}</span>
        <span
          v-if="tab.path !== '/dashboard'"
          class="tab-item__close"
          @click.stop="closeTab(tab.path)"
        >
          <CloseOutlined />
        </span>
      </div>
    </div>

    <!-- 右箭头 -->
    <span v-if="canScrollRight" class="tab-view__arrow tab-view__arrow--right" @click="scrollRight">
      <RightOutlined />
    </span>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="menuVisible"
        class="tab-menu"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
        @click.stop
      >
        <div class="tab-menu__item" @click="onMenuClose">关闭标签</div>
        <div class="tab-menu__item" @click="onMenuCloseOthers">关闭其他</div>
        <div class="tab-menu__item" @click="onMenuCloseLeft">关闭左侧</div>
        <div class="tab-menu__item" @click="onMenuCloseRight">关闭右侧</div>
        <div class="tab-menu__item tab-menu__item--danger" @click="onMenuCloseAll">关闭全部</div>
      </div>
    </Teleport>
  </div>

  <!-- 遮罩层：点击任意处关闭右键菜单 -->
  <div v-if="menuVisible" class="tab-menu-mask" @click="menuVisible = false" @contextmenu.prevent="menuVisible = false" />
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons-vue";
import { useTabsStore } from "../stores/tabs";
import type { TabItem } from "../stores/tabs";

const router = useRouter();
const tabsStore = useTabsStore();

const tabs = computed(() => tabsStore.tabs);
const activePath = computed(() => tabsStore.activePath);

// ---- 滚动 ----
const tabsRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function checkScroll(): void {
  const el = tabsRef.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 4;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
}

function scrollLeft(): void {
  tabsRef.value?.scrollBy({ left: -200, behavior: "smooth" });
}

function scrollRight(): void {
  tabsRef.value?.scrollBy({ left: 200, behavior: "smooth" });
}

function onWheel(e: WheelEvent): void {
  tabsRef.value?.scrollBy({ left: e.deltaY, behavior: "smooth" });
}

// 自动滚动到激活标签
const tabRefs: Record<string, HTMLElement | null> = {};
function setTabRef(path: string, el: unknown): void {
  tabRefs[path] = el as HTMLElement | null;
}

watch(activePath, (path) => {
  nextTick(() => {
    const el = tabRefs[path];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  });
});

// ---- 导航 ----
function goTab(tab: TabItem): void {
  tabsStore.setActivePath(tab.path);
  router.push(tab.path);
}

function closeTab(path: string): void {
  tabsStore.closeTab(path);
}

// ---- 右键菜单 ----
const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const menuTarget = ref<TabItem | null>(null);

function onRightClick(e: MouseEvent, tab: TabItem): void {
  menuTarget.value = tab;
  menuX.value = e.clientX;
  menuY.value = e.clientY;
  menuVisible.value = true;
}

function onMenuClose(): void {
  if (menuTarget.value) closeTab(menuTarget.value.path);
  menuVisible.value = false;
}

function onMenuCloseOthers(): void {
  if (menuTarget.value) tabsStore.closeOthers(menuTarget.value.path);
  menuVisible.value = false;
}

function onMenuCloseLeft(): void {
  if (menuTarget.value) tabsStore.closeLeft(menuTarget.value.path);
  menuVisible.value = false;
}

function onMenuCloseRight(): void {
  if (menuTarget.value) tabsStore.closeRight(menuTarget.value.path);
  menuVisible.value = false;
}

function onMenuCloseAll(): void {
  tabsStore.closeAll();
  menuVisible.value = false;
}

// ---- 图标映射 ----
function getIconChar(icon: string): string {
  const map: Record<string, string> = {
    HomeOutlined: "🏠", SettingOutlined: "⚙️", TeamOutlined: "👥",
    SafetyOutlined: "🛡️", ThunderboltOutlined: "⚡", DatabaseOutlined: "📚",
    FileOutlined: "📁", FileTextOutlined: "📄", FileSearchOutlined: "🔍",
    ProfileOutlined: "📋", SafetyCertificateOutlined: "🔐", MenuOutlined: "📋",
    BarsOutlined: "📊", UnorderedListOutlined: "📝",
  };
  return map[icon] || "📌";
}
</script>

<style lang="less" scoped>
.tab-view {
  position: relative;
  display: flex;
  align-items: center;
  height: 38px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 40px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  &__arrow {
    position: absolute;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 38px;
    cursor: pointer;
    font-size: 11px;
    color: #999;
    background: #fff;
    transition: color 0.2s;

    &:hover { color: #333; }

    &--left  { left: 0;  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.04); }
    &--right { right: 0; box-shadow: -2px 0 4px rgba(0, 0, 0, 0.04); }
  }

  &__list {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 2px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    height: 100%;

    &::-webkit-scrollbar { display: none; }
  }
}

// ---- 单个标签 ----
.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  user-select: none;
  transition: all 0.15s;
  border: 1px solid transparent;
  flex-shrink: 0;

  &:hover {
    background: #f0f0f0;
    color: #333;
  }

  &--active {
    background: #e6f4ff;
    color: #1677ff;
    border-color: #91caff;

    &:hover {
      background: #d6eeff;
    }
  }

  &__icon {
    font-size: 14px;
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    font-size: 9px;
    color: transparent;
    transition: all 0.15s;
    margin-left: 2px;
  }

  &:hover &__close {
    color: #999;
    &:hover {
      color: #333;
      background: #d9d9d9;
    }
  }

  &--active &__close {
    color: #91caff;
    &:hover {
      color: #fff;
      background: #1677ff;
    }
  }
}

// ---- 右键菜单 ----
.tab-menu {
  position: fixed;
  z-index: 1100;
  min-width: 120px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  font-size: 13px;

  &__item {
    padding: 8px 16px;
    cursor: pointer;
    color: #333;
    transition: background 0.15s;

    &:hover { background: #f5f5f5; }

    &--danger {
      color: #ff4d4f;
      &:hover { background: #fff1f0; }
    }
  }
}

.tab-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 1099;
}
</style>
