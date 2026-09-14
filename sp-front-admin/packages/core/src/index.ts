/**
 * core 模块统一导出
 * 所有业务模块通过 import from "@sp/core" 使用公共能力
 */
export { http } from "./api/http";
export type { ApiResponse, PageResult, PageParams } from "./api/types";
export { useAuthStore } from "./stores/auth";
export { useAppStore } from "./stores/app";
export { useTabsStore } from "./stores/tabs";
export { default as IconFont } from "./components/IconFont.vue";
export { menuRegistry } from "./utils/menuRegistry";
export * from "./utils/token";
export * from "./utils/router";

// Composables
export { useExport } from "./composables/useExport";
export type { ExportColumn } from "./composables/useExport";
export { useConfirm } from "./composables/useConfirm";
export { useColumnSetting } from "./composables/useColumnSetting";
export type { ColumnSetting } from "./composables/useColumnSetting";

// Components
export { default as ColumnSettings } from "./components/ColumnSettings.vue";

// ProLayout 单独导入再导出，避免 .vue barrel 解析问题
import ProLayoutComponent from "./components/ProLayout.vue";
export const ProLayout = ProLayoutComponent;
