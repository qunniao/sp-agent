/**
 * 菜单路由注册表
 *
 * 所有需要显示在侧边栏的模块路由都注册到此数组
 * - ProLayout 直接读取此数组渲染菜单
 * - app router 的 registerModuleRoutes 负责写入
 *
 * 使用方式：
 * import { menuRegistry } from "@sp/core";
 * menuRegistry.push(...routes);
 */
import type { RouteRecordRaw } from "vue-router";

export const menuRegistry: RouteRecordRaw[] = [];
