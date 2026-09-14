import type { RouteRecordRaw } from "vue-router";

/** 文件管理子路由（挂载在 /system 下） */
const fileRoutes: RouteRecordRaw[] = [
  {
    path: "file",
    name: "File",
    redirect: "/system/file/list",
    meta: { title: "文件管理", icon: "FileOutlined" },
    children: [
      {
        path: "list",
        name: "FileList",
        component: () => import("./views/FileList.vue"),
        meta: { title: "文件列表", icon: "FileTextOutlined", keepAlive: true },
      },
    ],
  },
];

export default fileRoutes;
