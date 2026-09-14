/**
 * 自动化工作流类型定义
 */

// ==================== 触发器 ====================

export type TriggerType = "schedule" | "manual" | "webhook";

export interface TriggerConfig {
  type: TriggerType;
  /** 定时触发: cron 表达式 */
  cron?: string;
  /** webhook 触发: 外部 URL */
  webhookUrl?: string;
  /** 人类可读的描述 */
  label: string;
}

// ==================== 步骤节点 ====================

export type StepType =
  | "ai.chat"           // AI 对话（写文案/选题/分析）
  | "agent.team"        // 多智能体协作
  | "dify.workflow"     // Dify 工作流调用
  | "ai.generate_image" // AI 生图
  | "platform.post"     // 发布到平台
  | "http.request"      // HTTP 调用
  | "condition"         // 条件分支
  | "delay"             // 延时等待
  | "transform"         // 数据转换/模板渲染
  | "notification";     // 通知（站内/邮件/微信）

export interface StepNode {
  id: string;
  type: StepType;
  title: string;
  /** 步骤配置（根据 type 不同字段不同） */
  config: StepConfig;
  /** 是否启用 */
  enabled: boolean;
}

export type StepConfig =
  | AiChatConfig
  | AgentTeamConfig
  | DifyWorkflowConfig
  | AiImageConfig
  | PlatformPostConfig
  | HttpRequestConfig
  | ConditionConfig
  | DelayConfig
  | TransformConfig
  | NotificationConfig;

export interface AiChatConfig {
  model?: string;       // 默认 Claude
  temperature?: number; // 默认 0.8
  personaId?: string;   // 可选：引用智能体库中的角色
  prompt: string;       // 支持 {{step.1.output}} 引用上游
  outputKey: string;    // 输出变量名，供后续步骤引用
}

export interface AiImageConfig {
  prompt: string;
  size?: string;        // 1024x1024
  outputKey: string;
}

export interface PlatformPostConfig {
  /** 关联的平台连接 ID（不再是裸平台名） */
  accountId: string;
  content: string;       // 支持模板变量
  images?: string[];     // 图片 URL 或 {{step.N.output}}
  tags?: string[];
}

// ==================== 智能体 ====================

export type CollaborationMode = "serial_review" | "parallel" | "debate";

export interface AgentPersona {
  id: string;
  /** 角色名，如「小红书写手」 */
  name: string;
  /** 角色图标 emoji */
  avatar: string;
  /** 身份描述，如「资深小红书博主」 */
  role: string;
  /** 系统提示词 */
  systemPrompt: string;
  /** 擅长标签 */
  expertise: string[];
  createdAt: string;
}

export interface AgentTeamConfig {
  /** 选中的智能体 ID 列表（2~3个） */
  personaIds: string[];
  /** 协作模式 */
  mode: CollaborationMode;
  /** 团队任务描述 */
  task: string;
  /** 输出变量名 */
  outputKey: string;
}

export const COLLABORATION_MODE_LABELS: Record<CollaborationMode, string> = {
  serial_review: "串行审核",
  parallel: "并行生成",
  debate: "辩论裁决",
};

// ==================== 平台连接 ====================

export type PlatformType = "xiaohongshu" | "wechat_mp" | "douyin" | "weibo";

export interface PlatformAccount {
  id: string;
  platform: PlatformType;
  /** 账号昵称（如「SuperOne 科技号」） */
  nickname: string;
  /** 账号头像 URL */
  avatar: string;
  /** 连接状态 */
  status: "connected" | "disconnected" | "expired";
  /** 最近一次连接时间 */
  connectedAt?: string;
  /** 账号简介 */
  bio?: string;
}

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  xiaohongshu: "小红书",
  wechat_mp: "公众号",
  douyin: "抖音",
  weibo: "微博",
};

export interface HttpRequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT";
  headers?: Record<string, string>;
  body?: string;         // 支持模板变量
  outputKey: string;
}

export interface ConditionConfig {
  expression: string;    // 条件描述（先人工判断，后续 AI 理解）
  /** 分支 */
  branches: ConditionBranch[];
}

export interface ConditionBranch {
  label: string;         // "需要审核" / "直接发布"
  /** 跳转到步骤索引（从 0 开始）或 "next" / "end" */
  target: number | "next" | "end";
}

export interface DelayConfig {
  seconds: number;
}

export interface TransformConfig {
  template: string;      // 模板字符串，支持 {{...}} 变量
  outputKey: string;
}

export interface NotificationConfig {
  channel: "inapp" | "email" | "wechat";
  title: string;
  content: string;
}

// ==================== 自动化流程定义 ====================

export interface AutomationDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 分类标签 */
  category: "content" | "business" | "social" | "custom";
  trigger: TriggerConfig;
  steps: StepNode[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  /** 最近一次执行时间 */
  lastRunAt?: string;
  /** 总执行次数 */
  runCount: number;
}

// ==================== 执行实例 ====================

export type ExecutionStatus = "running" | "success" | "failed" | "cancelled";

export interface ExecutionRecord {
  id: string;
  automationId: string;
  automationName: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  /** 每个步骤的执行结果 */
  stepResults: StepResult[];
  /** 触发器信息 */
  triggeredBy: string;
}

export interface StepResult {
  stepId: string;
  stepTitle: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  startedAt?: string;
  finishedAt?: string;
  output?: string;
  error?: string;
  /** 耗时（毫秒） */
  duration?: number;
  /** 多智能体协作时的对话消息 */
  messages?: AgentMessage[];
}

export interface AgentMessage {
  from: string;    // "✍️ 小红书写手"
  role: string;    // "生成" | "审查" | "修订" | "确认" | "辩论"
  at: string;      // "14:00:01"
  text: string;
}

// ==================== 草稿箱 ====================

export interface DraftItem {
  id: string;
  title: string;
  platform: PlatformType;
  accountId: string;
  accountNickname: string;
  content: string;
  /** 来源工作流 */
  automationName?: string;
  /** 创建时间 */
  createdAt: string;
  /** 审核状态 */
  reviewStatus: "pending" | "approved" | "rejected";
  /** AI 生成时的原始 prompt */
  prompt?: string;
  tags?: string[];
}

// ==================== 一键分发 ====================

export interface DistributionJob {
  id: string;
  /** 原始内容 */
  sourceContent: string;
  sourcePlatform: PlatformType;
  /** 各平台适配版本 */
  versions: PlatformVersion[];
  createdAt: string;
}

export interface PlatformVersion {
  platform: PlatformType;
  content: string;
  status: "adapted" | "adapting" | "published" | "failed";
  accountId?: string;
  publishedAt?: string;
}

// ==================== 数据看板 ====================

export interface PlatformMetrics {
  platform: PlatformType;
  accountId: string;
  nickname: string;
  avatar: string;
  followers: number;
  followersTrend: number;  // 正数=增长
  thisWeek: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    posts: number;
  };
  lastWeek: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    posts: number;
  };
  topPosts: TopPost[];
}

export interface TopPost {
  title: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
}

// ==================== 灵感收藏 ====================

export interface Inspiration {
  id: string;
  /** 原文链接 */
  url: string;
  /** 标题 */
  title: string;
  /** 来源平台 */
  platform: PlatformType;
  /** 作者 */
  author: string;
  /** 收藏时间 */
  savedAt: string;
  /** 标签 */
  tags: string[];
  /** AI 拆解：为什么火 */
  aiAnalysis?: string;
  /** 可借鉴的点 */
  takeaways?: string[];
  /** 原文截图/缩略图 */
  thumbnailUrl?: string;
}

// ==================== 虚拟员工 ====================

export interface VirtualEmployee {
  id: string;
  name: string;
  avatar: string;
  /** 岗位，如 "财务专员" */
  role: string;
  /** 部门 */
  department: EmployeeDepartment;
  /** 工作说明 */
  systemPrompt: string;
  /** 技能标签 */
  skills: string[];
  /** 可直接执行的操作 */
  capabilities: string[];
  /** 关联的业务模块 */
  linkedModules: string[];
  usageCount: number;
  createdAt: string;
}

export type EmployeeDepartment = "finance" | "sales" | "operation" | "marketing" | "support" | "tech" | "legal";

export const DEPARTMENT_MAP: Record<EmployeeDepartment, { label: string; icon: string }> = {
  finance: { label: "财务部", icon: "💰" },
  sales: { label: "销售部", icon: "📈" },
  operation: { label: "运营部", icon: "⚙️" },
  marketing: { label: "市场部", icon: "📣" },
  support: { label: "客服部", icon: "🎧" },
  tech: { label: "技术部", icon: "💻" },
  legal: { label: "法务部", icon: "⚖️" },
};

// ==================== Dify 集成 ====================

export interface DifyConnection {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  status: "connected" | "disconnected" | "error";
  lastTestAt?: string;
  createdAt: string;
}

export interface DifyWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: { id: string; type: string; title: string }[];
  /** 节点连线 */
  edges: { from: string; to: string; label?: string }[];
  inputs: { name: string; type: string; label: string; required?: boolean }[];
  outputs: { name: string; type: string; label: string }[];
  tags: string[];
  runCount: number;
  createdAt: string;
}

export interface DifyNodeResult {
  nodeId: string;
  nodeTitle: string;
  type: string;
  status: "success" | "failed" | "running";
  startedAt: string;
  finishedAt?: string;
  duration: number;
  inputs?: Record<string, string>;
  outputs?: Record<string, string>;
  error?: string;
}

export interface DifyWorkflowConfig {
  connectionId: string;
  workflowId: string;
  /** 输入变量映射：SuperOne变量 → Dify输入变量 */
  inputMapping: Record<string, string>;
  /** 超时（秒） */
  timeout: number;
  outputKey: string;
}

// ==================== 智能体团队 ====================

export interface PersonaTeam {
  id: string;
  name: string;
  description: string;
  /** 成员智能体 ID 列表 */
  personaIds: string[];
  /** 默认协作模式 */
  defaultMode: CollaborationMode;
  createdAt: string;
}

// ==================== AI 工作台 ====================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  personaId?: string;
  personaName?: string;
  /** 引用的上下文 */
  contextRefs?: { type: "knowledge" | "dashboard" | "asset"; id: string; label: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messageCount: number;
}

// ==================== 知识库 ====================

export type DocCategory = "product" | "brand" | "customer" | "finance" | "legal" | "other";

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: DocCategory;
  content: string;
  format: "markdown" | "text" | "url";
  sourceUrl?: string;
  wordCount: number;
  /** 引用语法提示 */
  refSyntax: string;
  updatedAt: string;
}

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  product: "📦 产品",
  brand: "🎨 品牌",
  customer: "👥 客户",
  finance: "💰 财务",
  legal: "⚖️ 法务",
  other: "📁 其他",
};

// ==================== 模型配置 ====================

export type AIModel = "claude-opus" | "claude-sonnet" | "claude-haiku";

export interface ModelConfig {
  defaultModel: AIModel;
  taskRouting: { task: string; model: AIModel }[];
  budget: { monthlyLimit: number; alertThreshold: number; exceedAction: "switch_to_cheaper" | "stop" | "alert_only" };
  fallback: { enabled: boolean; fallbackModel: AIModel };
}

export interface ModelUsage {
  model: AIModel;
  label: string;
  calls: number;
  tokens: number;
  cost: number;
}

export const MODEL_LABELS: Record<AIModel, string> = {
  "claude-opus": "Claude Opus",
  "claude-sonnet": "Claude Sonnet",
  "claude-haiku": "Claude Haiku",
};

// ==================== Prompt 模板 ====================

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: "content" | "analysis" | "code" | "business" | "social";
  /** 适用的智能体 ID */
  personaId?: string;
  /** 模板内容，{{variable}} 为变量占位符 */
  template: string;
  /** 变量说明 */
  variables: { name: string; label: string; defaultValue?: string }[];
  usageCount: number;
  createdAt: string;
}

// ==================== 用量统计 ====================

export interface UsageStats {
  /** 本周总览 */
  thisWeek: {
    totalCalls: number;
    totalTokens: number;
    estimatedCost: number;   // 元
    costTrend: number;       // 环比百分比
  };
  /** 按工作流分布 */
  byWorkflow: {
    name: string;
    calls: number;
    percentage: number;
    cost: number;
  }[];
  /** 近 30 天每日用量 */
  dailyTrend: { date: string; calls: number; tokens: number }[];
}

// ==================== 智能复盘 ====================

export interface WeeklyReport {
  id: string;
  /** 周期标签，如 "2026-W26" */
  weekLabel: string;
  /** 日期范围 */
  dateRange: string;
  /** 总览数据 */
  overview: {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    followerGrowth: number;
  };
  /** 各平台表现 */
  platformBreakdown: {
    platform: PlatformType;
    nickname: string;
    posts: number;
    views: number;
    likes: number;
    topContent: string;
  }[];
  /** 最佳内容 */
  topContent: {
    title: string;
    platform: PlatformType;
    views: number;
    likes: number;
    saveRate: string;
    insight: string;
  };
  /** AI 分析 */
  aiAnalysis: string[];
  /** 标签效果分析 */
  tagAnalysis: {
    tag: string;
    posts: number;
    avgViews: number;
    externalTraffic: string;
  }[];
  /** 发布时间分析 */
  timingInsight: string;
  /** AI 推荐的选题 */
  suggestedTopics: string[];
  createdAt: string;
}

// ==================== 内容日历 ====================

export interface CalendarEntry {
  id: string;
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 平台 */
  platform: PlatformType;
  /** 关联账号 ID */
  accountId: string;
  /** 账号昵称 */
  accountNickname: string;
  /** 标题 / 内容摘要 */
  title: string;
  /** 类型 */
  type: "ai_auto" | "manual" | "draft";
  /** 状态 */
  status: "scheduled" | "generating" | "pending_review" | "published" | "failed";
  /** 关联的工作流 ID */
  automationId?: string;
  /** 关联的素材 ID */
  assetIds?: string[];
}

// ==================== 素材库 ====================

export type AssetType = "image" | "text" | "template" | "video";

export interface MediaAsset {
  id: string;
  /** 文件名 / 标题 */
  name: string;
  /** 素材类型 */
  type: AssetType;
  /** 平台 */
  platform?: PlatformType;
  /** 缩略图 / 预览 URL */
  thumbnailUrl: string;
  /** 完整内容（文本素材）或原始 URL（图片/视频） */
  content: string;
  /** 来源：AI生成 | 手动上传 */
  source: "ai_generated" | "manual_upload";
  /** 关联的工作流执行 ID */
  executionId?: string;
  /** 文件大小 */
  size?: string;
  createdAt: string;
}

// ==================== 客服中心 ====================

export type SupportChannel = "web" | "wechat" | "xiaohongshu" | "taobao" | "douyin" | "douyin_shop";

export interface ChannelAccount {
  id: string;
  channel: SupportChannel;
  name: string;
  avatar: string;
  status: "connected" | "disconnected";
  unreadCount: number;
  connectedAt?: string;
}

export const CHANNEL_META: Record<SupportChannel, { label: string; icon: string; color: string }> = {
  web: { label: "网页", icon: "🌐", color: "#1677ff" },
  wechat: { label: "微信", icon: "💬", color: "#07c160" },
  xiaohongshu: { label: "小红书", icon: "📕", color: "#ff2442" },
  taobao: { label: "淘宝", icon: "🛒", color: "#ff5000" },
  douyin: { label: "抖音", icon: "🎵", color: "#010101" },
  douyin_shop: { label: "抖店", icon: "🏪", color: "#ff4d4f" },
};

export type ConversationStatus = "ai_handling" | "pending_human" | "human_handling" | "resolved" | "closed";

export interface SupportSession {
  id: string;
  /** 来源渠道 */
  channel: SupportChannel;
  /** 渠道账号名（如 "SuperOne科技号"） */
  channelAccount: string;
  customer: { name: string; avatar: string; /** 渠道用户ID */ channelId?: string };
  title: string;
  status: ConversationStatus;
  messages: SupportMessage[];
  tags: string[];
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  rating?: number;
}

export interface SupportMessage {
  id: string;
  role: "customer" | "assistant" | "human";
  content: string;
  timestamp: string;
  msgType?: "text" | "image" | "product_card" | "order";
  attachment?: string;
  /** AI 回复的知识来源 */
  sourceRef?: { type: "kb" | "template" | "ai_generated"; label: string };
}

export interface SupportStats {
  today: { total: number; aiResolved: number; humanResolved: number; pending: number };
  thisWeek: { total: number; aiResolved: number; humanResolved: number; avgResponseTime: string };
  satisfaction: number; // %
  topIssues: { tag: string; count: number }[];
  responseTrend: { date: string; aiResolved: number; humanResolved: number }[];
}

// ==================== API 请求/响应 ====================

export interface AutomationQueryParams {
  page: number;
  pageSize: number;
  category?: string;
  keyword?: string;
}

export interface AiComposeRequest {
  description: string;    // 自然语言描述
}

export interface AiComposeResponse {
  def: Omit<AutomationDef, "id" | "createdAt" | "updatedAt" | "runCount" | "lastRunAt">;
  /** AI 解释 */
  explanation: string;
}
