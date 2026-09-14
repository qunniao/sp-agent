import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

const STORAGE_KEY = "sp_tabs";

export interface TabItem {
  path: string;
  title: string;
  icon?: string;
}

function loadTabs(): TabItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [{ path: "/dashboard", title: "首页", icon: "HomeOutlined" }];
}

function saveTabs(tabs: TabItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch { /* ignore */ }
}

/**
 * 多标签页 Store
 *
 * 管理顶部标签栏的打开、关闭、切换。
 * 首页标签始终存在且不可关闭，偏好持久化到 localStorage。
 */
export const useTabsStore = defineStore("tabs", () => {
  const tabs = ref<TabItem[]>(loadTabs());
  const activePath = ref("/dashboard");

  let router: ReturnType<typeof useRouter> | null = null;

  function initRouter(r: ReturnType<typeof useRouter>): void {
    router = r;
  }

  /** 打开或激活标签 */
  function openTab(tab: TabItem): void {
    activePath.value = tab.path;
    const exists = tabs.value.find((t) => t.path === tab.path);
    if (!exists) {
      tabs.value.push(tab);
    }
  }

  /** 关闭标签 */
  function closeTab(path: string): void {
    const idx = tabs.value.findIndex((t) => t.path === path);
    if (idx === -1) return;
    // 首页不可关
    if (tabs.value[idx].path === "/dashboard") return;

    tabs.value.splice(idx, 1);

    // 如果关的是当前激活页，切换到相邻标签
    if (activePath.value === path) {
      const next = tabs.value[Math.min(idx, tabs.value.length - 1)];
      if (next && router) {
        activePath.value = next.path;
        router.push(next.path);
      }
    }
  }

  /** 关闭其他标签 */
  function closeOthers(path: string): void {
    const current = tabs.value.find((t) => t.path === path);
    tabs.value = [tabs.value.find((t) => t.path === "/dashboard")!];
    if (current && current.path !== "/dashboard") {
      tabs.value.push(current);
    }
    activePath.value = path;
  }

  /** 关闭左侧 */
  function closeLeft(path: string): void {
    const idx = tabs.value.findIndex((t) => t.path === path);
    if (idx <= 0) return;
    tabs.value = tabs.value.slice(idx);
  }

  /** 关闭右侧 */
  function closeRight(path: string): void {
    const idx = tabs.value.findIndex((t) => t.path === path);
    if (idx === -1) return;
    // 首页在第一个，保留首页
    const home = tabs.value.find((t) => t.path === "/dashboard");
    tabs.value = tabs.value.slice(0, idx + 1);
    // 确保首页在第一个
    if (home && !tabs.value.some((t) => t.path === "/dashboard")) {
      tabs.value.unshift(home);
    }
  }

  /** 关闭全部（除首页） */
  function closeAll(): void {
    const home = tabs.value.find((t) => t.path === "/dashboard");
    tabs.value = home ? [home] : [];
    activePath.value = "/dashboard";
    if (router) router.push("/dashboard");
  }

  /** 设置激活路径（路由变化时同步） */
  function setActivePath(path: string): void {
    activePath.value = path;
  }

  // 持久化
  watch(tabs, (val) => saveTabs(val), { deep: true });

  return {
    tabs,
    activePath,
    initRouter,
    openTab,
    closeTab,
    closeOthers,
    closeLeft,
    closeRight,
    closeAll,
    setActivePath,
  };
});
