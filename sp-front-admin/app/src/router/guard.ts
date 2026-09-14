/**
 * 全局路由守卫
 *
 * 职责：
 * 1. 登录校验：通过 localStorage 缓存的 token 判断登录态
 * 2. 权限校验：已登录用户检查页面权限
 * 3. 自动恢复：刷新页面后从 localStorage 恢复用户信息，无需请求后端
 */
import type { Router } from "vue-router";
import { useAuthStore } from "@sp/core";

/** 免登录白名单 */
const WHITE_LIST = ["/login", "/404"];

export function setupRouterGuard(router: Router): void {
  router.beforeEach(async (to, _from, next) => {
    console.log("[Guard] 导航到:", to.path, "| matched:", to.matched.length);

    // 1. 设置页面标题
    const title = to.meta?.title as string;
    if (title) {
      document.title = `${title} - SuperOne`;
    }

    // 2. 未匹配路由 → 跳转登录页
    if (to.matched.length === 0) {
      console.warn("[Guard] 路由未匹配，跳转登录");
      return next("/login");
    }

    // 3. 白名单直接放行
    if (WHITE_LIST.includes(to.path)) {
      console.log("[Guard] 白名单，放行");
      return next();
    }

    // 4. 登录校验
    const authStore = useAuthStore();
    console.log("[Guard] token:", authStore.token ? "有" : "无");
    console.log("[Guard] userInfo:", authStore.userInfo ? "有" : "无");
    console.log("[Guard] isLoggedIn:", authStore.isLoggedIn);

    if (authStore.isLoggedIn) {
      if (!authStore.userInfo) {
        console.warn("[Guard] 有 token 但无用户信息，尝试获取...");
        try {
          await authStore.fetchUserInfo();
        } catch {
          console.warn("[Guard] 获取失败，检查是否仍登录...");
          if (!authStore.isLoggedIn) {
            authStore.logout();
            return next(`/login?redirect=${encodeURIComponent(to.path)}`);
          }
        }
      }

      const requiredPermissions = (to.meta?.permissions as string[]) || [];
      if (requiredPermissions.length > 0) {
        if (!authStore.hasAnyPermission(requiredPermissions)) {
          console.warn("[Guard] 权限不足");
          return next("/login");
        }
      }

      console.log("[Guard] ✅ 放行");
      return next();
    }

    // 5. 未登录 → 跳转登录页
    console.warn("[Guard] 未登录，跳转 /login");
    return next(`/login?redirect=${encodeURIComponent(to.path)}`);
  });
}
