import type { RouteRecordRaw } from "vue-router";

/**
 * 系统管理模块路由
 *
 * 这些路由注册到 ProLayout 下，会出现在侧边栏菜单中
 * meta.sort 控制菜单排序，越小越靠前
 * meta.icon 控制菜单图标
 */
const systemRoutes: RouteRecordRaw[] = [
  {
    path: "/system",
    name: "System",
    redirect: "/system/users",
    meta: {
      title: "系统管理",
      icon: "SettingOutlined",
      sort: 99,
    },
    children: [
      {
        path: "users",
        name: "UserList",
        component: () => import("./views/UserList.vue"),
        meta: {
          title: "用户管理",
          icon: "TeamOutlined",
          keepAlive: true,
        },
      },
      {
        path: "roles",
        name: "RoleList",
        component: () => import("./views/RoleList.vue"),
        meta: {
          title: "角色管理",
          icon: "SafetyOutlined",
          keepAlive: true,
        },
      },
      {
        path: "menus",
        name: "MenuManage",
        component: () => import("./views/MenuManage.vue"),
        meta: {
          title: "菜单管理",
          icon: "MenuOutlined",
          keepAlive: true,
        },
      },
    ],
  },
];

export default systemRoutes;
