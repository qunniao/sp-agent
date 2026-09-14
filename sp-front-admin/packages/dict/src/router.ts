import type { RouteRecordRaw } from "vue-router";

/** 数据字典子路由（挂载在 /system 下） */
const dictRoutes: RouteRecordRaw[] = [
  {
    path: "dict",
    name: "Dict",
    redirect: "/system/dict/type",
    meta: { title: "数据字典", icon: "DatabaseOutlined" },
    children: [
      {
        path: "type",
        name: "DictType",
        component: () => import("./views/DictType.vue"),
        meta: { title: "字典类型", icon: "BarsOutlined", keepAlive: true },
      },
      {
        path: "data",
        name: "DictData",
        component: () => import("./views/DictData.vue"),
        meta: { title: "字典数据", icon: "UnorderedListOutlined", keepAlive: true },
      },
    ],
  },
];

export default dictRoutes;
