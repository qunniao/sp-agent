import type { RouteRecordRaw } from "vue-router";

/** 代码生成器子路由（挂载在 /system 下） */
const genRoutes: RouteRecordRaw[] = [
  {
    path: "gen",
    name: "Gen",
    redirect: "/system/gen/tables",
    meta: { title: "代码生成器", icon: "ThunderboltOutlined" },
    children: [
      {
        path: "tables",
        name: "GenTables",
        component: () => import("./views/GenPage.vue"),
        meta: { title: "代码生成", icon: "CodeOutlined", keepAlive: true },
      },
    ],
  },
];

export default genRoutes;
