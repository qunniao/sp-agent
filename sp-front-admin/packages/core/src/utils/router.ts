import type { RouteRecordRaw } from "vue-router";

/**
 * 模块路由配置类型
 * 每个业务模块导出一个路由数组，由 app 主壳统一注册
 *
 * @example
 * // 在 auth 模块中:
 * const authRoutes = defineModuleRoutes([
 *   { path: "/login", component: LoginPage, meta: { title: "登录" } }
 * ])
 * export default authRoutes
 */
export function defineModuleRoutes(
  routes: RouteRecordRaw[],
  basePath?: string
): RouteRecordRaw[] {
  // 如果指定了 basePath，为所有路由加上前缀
  if (basePath) {
    return routes.map((route) => ({
      ...route,
      path: `${basePath}${route.path}`,
    }));
  }
  return routes;
}

/**
 * 路由 meta 类型定义
 */
export interface RouteMeta {
  /** 页面标题，显示在浏览器标签和面包屑 */
  title: string;
  /** 图标名称（Ant Design 图标） */
  icon?: string;
  /** 是否在侧边栏中隐藏 */
  hidden?: boolean;
  /** 是否缓存页面（keep-alive） */
  keepAlive?: boolean;
  /** 所需权限标识，空数组表示无需权限 */
  permissions?: string[];
  /** 排序号，越小越靠前 */
  sort?: number;
}
