/**
 * SuperOne 应用入口
 *
 * 启动顺序：先收集路由 → 再创建 Router → 再挂载
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

import App from "./App.vue";
import { registerModuleRoutes, createAppRouter } from "./router";
import { setupRouterGuard } from "./router/guard";
import "./styles/global.less";

console.log("[SuperOne] 开始加载...");

// ========== 1. 先收集所有模块路由到 menuRegistry ==========

// 首页
import Dashboard from "./views/Dashboard.vue";
registerModuleRoutes([
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { title: "首页", icon: "HomeOutlined", sort: 1 },
  },
], "layout");

// 个人中心（侧边栏隐藏，通过顶栏用户下拉进入）
import Profile from "./views/Profile.vue";
registerModuleRoutes([
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { title: "个人中心", hidden: true },
  },
], "layout");

// 认证模块（独立路由）
import { authRoutes } from "@sp/auth";
registerModuleRoutes(authRoutes, "standalone");

// 系统管理（含 gen / dict / file 子路由）
import { systemRoutes } from "@sp/system";
import { genRoutes } from "@sp/gen";
import { dictRoutes } from "@sp/dict";
import { fileRoutes } from "@sp/file";
systemRoutes[0].children?.push(...genRoutes, ...dictRoutes, ...fileRoutes);
registerModuleRoutes(systemRoutes, "layout");

// 日志管理
import { logRoutes } from "@sp/log";
registerModuleRoutes(logRoutes, "layout");

// 自动化工作流 / 虚拟团队 / AI 能力 / 自媒体中心
import { automationRoutes, teamRoutes, supportRoutes, aiRoutes, mediaRoutes } from "@sp/automation";
registerModuleRoutes(automationRoutes, "layout");
registerModuleRoutes(teamRoutes, "layout");
registerModuleRoutes(supportRoutes, "layout");
registerModuleRoutes(aiRoutes, "layout");
registerModuleRoutes(mediaRoutes, "layout");

console.log("[SuperOne] 所有模块路由已收集");

// ========== 2. 用完整路由表创建 Router ==========
const router = createAppRouter();

// ========== 3. 创建应用 & 挂载插件 ==========
const app = createApp(App);
app.use(createPinia());
app.use(Antd);
app.use(router);

// ========== 4. 路由守卫 ==========
setupRouterGuard(router);

// ========== 5. 错误处理 ==========
app.config.errorHandler = (err, instance, info) => {
  console.error("[SuperOne 错误]", err, info);
};

// ========== 6. 挂载 ==========
app.mount("#app");
console.log("[SuperOne] ✅ 启动完成");
