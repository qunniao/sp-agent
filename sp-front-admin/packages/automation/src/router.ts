import type { RouteRecordRaw } from "vue-router";

/** 自动化工作流（引擎） */
export const automationRoutes: RouteRecordRaw[] = [
  {
    path: "/automation",
    name: "Automation",
    redirect: "/automation/list",
    meta: { title: "自动化工作流", icon: "ThunderboltOutlined", sort: 25 },
    children: [
      {
        path: "list",
        name: "AutomationList",
        component: () => import("./views/AutomationList.vue"),
        meta: { title: "工作流列表", icon: "UnorderedListOutlined", keepAlive: true },
      },
      {
        path: "editor/:id?",
        name: "AutomationEditor",
        component: () => import("./views/AutomationEditor.vue"),
        meta: { title: "流程编辑", icon: "ApartmentOutlined", hidden: true },
      },
      {
        path: "history",
        name: "ExecutionHistory",
        component: () => import("./views/ExecutionHistory.vue"),
        meta: { title: "执行记录", icon: "HistoryOutlined", keepAlive: true },
      },
    ],
  },
];

/** AI 能力（智能体 / Prompt / 用量） */
export const aiRoutes: RouteRecordRaw[] = [
  {
    path: "/ai",
    name: "AI",
    redirect: "/ai/workspace",
    meta: { title: "AI 能力", icon: "RobotOutlined", sort: 27 },
    children: [
      {
        path: "workspace",
        name: "AiWorkspace",
        component: () => import("./views/AiWorkspace.vue"),
        meta: { title: "AI 工作台", icon: "CommentOutlined", keepAlive: true },
      },
      {
        path: "prompts",
        name: "PromptManager",
        component: () => import("./views/PromptManager.vue"),
        meta: { title: "Prompt 模板", icon: "FileTextOutlined", keepAlive: true },
      },
      {
        path: "knowledge",
        name: "KnowledgeBase",
        component: () => import("./views/KnowledgeBase.vue"),
        meta: { title: "知识库", icon: "FolderOpenOutlined", keepAlive: true },
      },
      {
        path: "models",
        name: "ModelSettings",
        component: () => import("./views/ModelSettings.vue"),
        meta: { title: "模型配置", icon: "ControlOutlined", keepAlive: true },
      },
      {
        path: "dify",
        name: "DifySettings",
        component: () => import("./views/DifySettings.vue"),
        meta: { title: "Dify 连接", icon: "ApiOutlined", keepAlive: true },
      },
      {
        path: "usage",
        name: "UsageStats",
        component: () => import("./views/UsageStats.vue"),
        meta: { title: "用量统计", icon: "BarChartOutlined", keepAlive: true },
      },
    ],
  },
];

/** 自媒体中心（平台账号 / 素材 / 日历） */
export const mediaRoutes: RouteRecordRaw[] = [
  {
    path: "/media",
    name: "Media",
    redirect: "/media/calendar",
    meta: { title: "自媒体中心", icon: "SendOutlined", sort: 29 },
    children: [
      {
        path: "calendar",
        name: "ContentCalendar",
        component: () => import("./views/ContentCalendar.vue"),
        meta: { title: "内容日历", icon: "CalendarOutlined", keepAlive: true },
      },
      {
        path: "assets",
        name: "AssetLibrary",
        component: () => import("./views/AssetLibrary.vue"),
        meta: { title: "素材库", icon: "FolderOpenOutlined", keepAlive: true },
      },
      {
        path: "drafts",
        name: "DraftBox",
        component: () => import("./views/DraftBox.vue"),
        meta: { title: "草稿箱", icon: "EditOutlined", keepAlive: true },
      },
      {
        path: "distribute",
        name: "QuickDistribute",
        component: () => import("./views/QuickDistribute.vue"),
        meta: { title: "一键分发", icon: "SendOutlined", keepAlive: true },
      },
      {
        path: "dashboard",
        name: "DataDashboard",
        component: () => import("./views/DataDashboard.vue"),
        meta: { title: "数据看板", icon: "DashboardOutlined", keepAlive: true },
      },
      {
        path: "inspirations",
        name: "InspirationBoard",
        component: () => import("./views/InspirationBoard.vue"),
        meta: { title: "灵感收藏", icon: "BulbOutlined", keepAlive: true },
      },
      {
        path: "review",
        name: "SmartReview",
        component: () => import("./views/SmartReview.vue"),
        meta: { title: "智能复盘", icon: "BarChartOutlined", keepAlive: true },
      },
      {
        path: "accounts",
        name: "AccountManager",
        component: () => import("./views/AccountManager.vue"),
        meta: { title: "平台账号", icon: "LinkOutlined", keepAlive: true },
      },
    ],
  },
];

/** 虚拟团队 */
export const teamRoutes: RouteRecordRaw[] = [
  {
    path: "/team",
    name: "Team",
    redirect: "/team/dashboard",
    meta: { title: "虚拟团队", icon: "TeamOutlined", sort: 26 },
    children: [
      {
        path: "dashboard",
        name: "TeamDashboard",
        component: () => import("./views/TeamDashboard.vue"),
        meta: { title: "数据看板", icon: "DashboardOutlined", keepAlive: true },
      },
      {
        path: "employees",
        name: "VirtualEmployees",
        component: () => import("./views/VirtualEmployees.vue"),
        meta: { title: "虚拟员工", icon: "IdcardOutlined", keepAlive: true },
      },
    ],
  },
];

/** 客服中心 */
export const supportRoutes: RouteRecordRaw[] = [
  {
    path: "/support",
    name: "Support",
    redirect: "/support/inbox",
    meta: { title: "客服中心", icon: "CustomerServiceOutlined", sort: 28 },
    children: [
      {
        path: "inbox",
        name: "SupportInbox",
        component: () => import("./views/SupportInbox.vue"),
        meta: { title: "会话 Inbox", icon: "InboxOutlined", keepAlive: true },
      },
      {
        path: "stats",
        name: "SupportStats",
        component: () => import("./views/SupportStats.vue"),
        meta: { title: "客服数据", icon: "DashboardOutlined", keepAlive: true },
      },
      {
        path: "settings",
        name: "SupportSettings",
        component: () => import("./views/SupportSettings.vue"),
        meta: { title: "客服设置", icon: "ControlOutlined", keepAlive: true },
      },
    ],
  },
];

/** 向后兼容：聚合导出 */
const allRoutes = [...automationRoutes, ...teamRoutes, ...supportRoutes, ...aiRoutes, ...mediaRoutes];
export default allRoutes;
