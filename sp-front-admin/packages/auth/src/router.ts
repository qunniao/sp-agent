import type { RouteRecordRaw } from "vue-router";

/**
 * 认证模块路由
 *
 * 登录页是独立路由，不包裹在 ProLayout 中
 * 使用 registerModuleRoutes(routes, "standalone") 注册
 */
const authRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("./views/LoginPage.vue"),
    meta: {
      title: "登录",
      hidden: true, // 不在菜单中显示
    },
  },
];

export default authRoutes;
