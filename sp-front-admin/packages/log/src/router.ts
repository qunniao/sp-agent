import type { RouteRecordRaw } from "vue-router";

const logRoutes: RouteRecordRaw[] = [
  {
    path: "/log",
    name: "Log",
    redirect: "/log/operation",
    meta: { title: "日志管理", icon: "ProfileOutlined", sort: 40 },
    children: [
      {
        path: "operation",
        name: "OperationLog",
        component: () => import("./views/OperationLog.vue"),
        meta: { title: "操作日志", icon: "FileSearchOutlined", keepAlive: true },
      },
      {
        path: "login",
        name: "LoginLog",
        component: () => import("./views/LoginLog.vue"),
        meta: { title: "登录日志", icon: "SafetyCertificateOutlined", keepAlive: true },
      },
    ],
  },
];

export default logRoutes;
