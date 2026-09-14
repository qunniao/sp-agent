import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 应用全局 Store
 * 管理侧边栏、全局加载等应用级状态
 */
export const useAppStore = defineStore("app", () => {
  // ---- 状态 ----

  /** 侧边栏是否折叠 */
  const sidebarCollapsed = ref(false);

  /** 全局加载状态 */
  const globalLoading = ref(false);

  /** 页面标题 */
  const pageTitle = ref("SuperOne");

  // ---- 方法 ----

  /** 切换侧边栏折叠状态 */
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  /** 设置侧边栏折叠 */
  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed;
  }

  /** 设置全局加载 */
  function setGlobalLoading(loading: boolean): void {
    globalLoading.value = loading;
  }

  /** 设置页面标题 */
  function setPageTitle(title: string): void {
    pageTitle.value = title;
    document.title = `${title} - SuperOne`;
  }

  return {
    sidebarCollapsed,
    globalLoading,
    pageTitle,
    toggleSidebar,
    setSidebarCollapsed,
    setGlobalLoading,
    setPageTitle,
  };
});
