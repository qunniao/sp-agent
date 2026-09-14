/**
 * 全局路由配置
 *
 * 策略：先收集 → 再创建
 * 1. 各模块把路由 push 到 menuRegistry
 * 2. 调用 createAppRouter() 用完整的 menuRegistry 创建 router
 * 不依赖 addRoute()，避免 Vue Router 动态路由的坑
 */
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type Router,
} from "vue-router";
import { ProLayout, menuRegistry } from "@sp/core";

/**
 * 注册布局路由
 * 写入共享的 menuRegistry 数组
 */
export function registerModuleRoutes(
  routes: RouteRecordRaw[],
  target: "layout" | "standalone" = "layout"
): void {
  if (target === "layout") {
    menuRegistry.push(...routes);
  } else {
    // 独立路由暂存，创建 router 时一并加入
    standaloneRoutes.push(...routes);
  }
}

/** 独立路由（登录页等，不包在布局中） */
const standaloneRoutes: RouteRecordRaw[] = [];

/**
 * 创建应用路由实例
 * 必须在所有 registerModuleRoutes() 调用之后执行
 */
export function createAppRouter(): Router {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: "/",
        name: "Layout",
        component: ProLayout,
        redirect: "/dashboard",
        children: menuRegistry, // 此时 menuRegistry 已完整
      },
      ...standaloneRoutes,
      {
        path: "/:pathMatch(.*)*",
        redirect: "/login",
      },
    ],
    scrollBehavior() {
      return { top: 0 };
    },
  });

  console.log(
    "[Router] 创建完成，布局路由:",
    menuRegistry.length,
    "独立路由:",
    standaloneRoutes.length
  );

  return router;
}
