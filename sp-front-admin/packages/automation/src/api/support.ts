import type { SupportSession, SupportStats, ChannelAccount, SupportChannel } from "../types";

function delay(ms = 300) { return new Promise((r) => setTimeout(r, ms)); }

// ==================== 渠道账号 ====================

const MOCK_CHANNELS: ChannelAccount[] = [
  { id: "ch_web", channel: "web", name: "SuperOne 官网", avatar: "🌐", status: "connected", unreadCount: 0, connectedAt: "2026-06-01" },
  { id: "ch_wechat", channel: "wechat", name: "SuperOne服务号", avatar: "💬", status: "connected", unreadCount: 3, connectedAt: "2026-06-10" },
  { id: "ch_xhs", channel: "xiaohongshu", name: "SuperOne科技号", avatar: "📕", status: "connected", unreadCount: 5, connectedAt: "2026-06-15" },
  { id: "ch_taobao", channel: "taobao", name: "SuperOne官方店", avatar: "🛒", status: "disconnected", unreadCount: 0 },
  { id: "ch_douyin", channel: "douyin", name: "老王效率工具", avatar: "🎵", status: "connected", unreadCount: 2, connectedAt: "2026-06-20" },
  { id: "ch_douyin_shop", channel: "douyin_shop", name: "老王的小店", avatar: "🏪", status: "disconnected", unreadCount: 0 },
];

// ==================== Mock 会话 ====================

const MOCK_SESSIONS: SupportSession[] = [
  // 微信
  {
    id: "sup_wx01", channel: "wechat", channelAccount: "SuperOne服务号",
    customer: { name: "陈总-科技公司", avatar: "👨‍💼", channelId: "wx_openid_chen" },
    title: "你们的AI客服能接微信吗？",
    status: "ai_handling",
    messages: [
      { id: "m1", role: "customer", content: "你好，想问下你们的系统能接微信客服吗？我们公司主要用微信跟客户沟通", timestamp: "2026-06-28 09:15:00" },
      { id: "m2", role: "assistant", content: "您好陈总！SuperOne 支持接入微信公众号客服。授权绑定后，微信用户发来的消息会统一汇聚到客服中心，AI 优先自动回复，复杂问题可转人工。\n\n目前支持：\n✅ 微信公众号消息接入\n✅ 小程序客服消息接入\n✅ 自动回复 + 人工接管\n\n需要我帮您配置吗？", timestamp: "2026-06-28 09:15:08", sourceRef: { type: "kb", label: "知识库: 产品介绍" } },
    ],
    tags: ["产品咨询", "微信"], priority: "normal", createdAt: "2026-06-28 09:15:00", updatedAt: "2026-06-28 09:15:08", assignedTo: "阿服",
  },
  {
    id: "sup_wx02", channel: "wechat", channelAccount: "SuperOne服务号",
    customer: { name: "周姐-零售", avatar: "👩‍💼", channelId: "wx_openid_zhou" },
    title: "数据看板不显示昨天的数据",
    status: "pending_human",
    messages: [
      { id: "m3", role: "customer", content: "我的数据看板从昨天开始就不更新了，怎么回事？", timestamp: "2026-06-28 10:30:00" },
      { id: "m4", role: "customer", content: "[图片]", timestamp: "2026-06-28 10:30:05", msgType: "image", attachment: "截图：数据看板空白" },
      { id: "m5", role: "assistant", content: "收到您的问题和截图。我来排查一下可能的原因：\n\n1. 数据同步任务是否正常运行？\n2. 是否有近期的系统升级？\n\n正在通知技术顾问阿技进行排查，请稍等。", timestamp: "2026-06-28 10:30:10", sourceRef: { type: "template", label: "快捷模板: 技术支持" } },
    ],
    tags: ["技术问题", "Bug"], priority: "high", createdAt: "2026-06-28 10:30:00", updatedAt: "2026-06-28 10:30:10", assignedTo: "阿服 → 阿技",
  },
  // 小红书
  {
    id: "sup_xhs01", channel: "xiaohongshu", channelAccount: "SuperOne科技号",
    customer: { name: "小红薯_ai爱好者", avatar: "🍠", channelId: "xhs_001" },
    title: "怎么用AI写爆款文案？",
    status: "ai_handling",
    messages: [
      { id: "m6", role: "customer", content: "看了你们的笔记！想问下用AI写文案真的有效吗？我是做美妆的", timestamp: "2026-06-28 08:00:00" },
      { id: "m7", role: "assistant", content: "当然有效！🎉 我们很多用户用AI辅助写作后，笔记互动率提升了40%以上。\n\n美妆赛道的话，AI可以帮你：\n1. 生成不同风格的文案初稿（干货型/种草型/教程型）\n2. 根据热门标签自动推荐选题\n3. 分析竞品爆款的结构并参考\n\n要不试试我们的Prompt模板？有针对小红书美妆的预设模板~", timestamp: "2026-06-28 08:00:10", sourceRef: { type: "kb", label: "知识库: 产品介绍 + Prompt模板" } },
    ],
    tags: ["产品咨询", "内容创作"], priority: "normal", createdAt: "2026-06-28 08:00:00", updatedAt: "2026-06-28 08:00:10", assignedTo: "阿服",
  },
  {
    id: "sup_xhs02", channel: "xiaohongshu", channelAccount: "SuperOne科技号",
    customer: { name: "美妆博主小鹿", avatar: "🦌", channelId: "xhs_002" },
    title: "能不能用AI帮我回复粉丝评论",
    status: "pending_human",
    messages: [
      { id: "m8", role: "customer", content: "我每天有几十条评论要回复，太累了。你们能不能帮我自动回复评论？", timestamp: "2026-06-28 13:00:00" },
      { id: "m9", role: "assistant", content: "完全理解你的痛点！💪\n\n我们支持：\n✅ AI自动回复常见问题类评论\n✅ 敏感/负面评论自动标记，人工审核后再发\n✅ 可设置品牌调性，回复风格统一\n\n不过这个功能属于高级版，需要单独开通。需要我帮你升级吗？", timestamp: "2026-06-28 13:00:08" },
      { id: "m10", role: "customer", content: "升级多少钱？", timestamp: "2026-06-28 13:01:00" },
    ],
    tags: ["功能咨询", "报价"], priority: "high", createdAt: "2026-06-28 13:00:00", updatedAt: "2026-06-28 13:01:00", assignedTo: "阿服 → 阿销",
  },
  // 淘宝
  {
    id: "sup_tb01", channel: "taobao", channelAccount: "SuperOne官方店",
    customer: { name: "tb_user_8891", avatar: "🛍️", channelId: "tb_8891" },
    title: "已下单3天为什么还没发货",
    status: "resolved",
    messages: [
      { id: "m11", role: "customer", content: "我3天前下的单，怎么还没发货？？？", timestamp: "2026-06-27 11:00:00" },
      { id: "m12", role: "assistant", content: "亲，非常抱歉给您带来不好的体验！我来查一下订单状态...\n\n查到您的订单 #TB20260625001：\n📦 商品：SuperOne Pro 年度版\n⏰ 下单时间：6月25日 14:30\n📍 当前状态：已打包，等待物流揽收\n\n预计今天下午发出，物流单号会同步更新。作为补偿，已为您申请了一张50元优惠券。再次为延误致歉！", timestamp: "2026-06-27 11:00:10", sourceRef: { type: "kb", label: "知识库: 客户FAQ + 订单系统查询" } },
      { id: "m13", role: "customer", content: "好吧，那尽快发货", timestamp: "2026-06-27 11:05:00" },
      { id: "m14", role: "assistant", content: "已催促仓库优先处理。发货后我会第一时间通知您。有任何问题随时找我。⭐⭐⭐⭐⭐ 问题解决后方便给个好评吗？", timestamp: "2026-06-27 11:05:06" },
    ],
    tags: ["物流", "投诉"], priority: "urgent", createdAt: "2026-06-27 11:00:00", updatedAt: "2026-06-27 11:05:06", assignedTo: "阿服", rating: 5,
  },
  // 抖音
  {
    id: "sup_dy01", channel: "douyin", channelAccount: "老王效率工具",
    customer: { name: "抖友_效率控", avatar: "🎬", channelId: "dy_001" },
    title: "你们的Cursor教程能出一个入门版吗",
    status: "human_handling",
    messages: [
      { id: "m15", role: "customer", content: "看了你们的Cursor教程，但是我是完全零基础的，有点跟不上", timestamp: "2026-06-28 12:00:00" },
      { id: "m16", role: "assistant", content: "感谢反馈！你说得对，目前的教程偏中高级。\n\n我已经把需求反馈给内容团队阿市，他说会在本周内出一个「零基础入门版」，从安装开始一步步教。\n\n你可以先关注我们的抖音号，更新后会第一时间推送。另外我们的小红书也有图文版的入门教程~", timestamp: "2026-06-28 12:00:08" },
      { id: "m17", role: "human", content: "你好！我是老王。刚看到你的留言。\n\n你提的建议特别好——我下周专门录一期零基础入门。你能不能告诉我具体哪些地方觉得难？这样我可以针对性地讲。\n\n另外送你一个我们知识库里的《Cursor新手常见问题.pdf》，私信发你。", timestamp: "2026-06-28 12:15:00" },
    ],
    tags: ["内容反馈", "教程"], priority: "normal", createdAt: "2026-06-28 12:00:00", updatedAt: "2026-06-28 12:15:00", assignedTo: "阿服 → 老王",
  },
  // 抖店
  {
    id: "sup_ds01", channel: "douyin_shop", channelAccount: "老王的小店",
    customer: { name: "抖店买家_7723", avatar: "🛒", channelId: "ds_7723" },
    title: "买的基础版能升级到Pro吗补差价",
    status: "ai_handling",
    messages: [
      { id: "m18", role: "customer", content: "我买的是基础版，现在想升级到Pro版，能补差价吗？", timestamp: "2026-06-28 14:00:00" },
      { id: "m19", role: "assistant", content: "可以的！✅\n\n升级补差价规则：\nPro版价格 ¥599 - 基础版价格 ¥299 = 补差价 ¥300\n\n在抖店订单页面点击「升级服务」，选择Pro版即可自动计算差价。升级后原有数据无缝迁移。\n\n需要我帮你操作吗？", timestamp: "2026-06-28 14:00:06" },
    ],
    tags: ["订单", "升级"], priority: "normal", createdAt: "2026-06-28 14:00:00", updatedAt: "2026-06-28 14:00:06", assignedTo: "阿服",
  },
  // 官网
  {
    id: "sup_web01", channel: "web", channelAccount: "SuperOne 官网",
    customer: { name: "访客_20260628_01", avatar: "🌐", channelId: "web_session_001" },
    title: "想了解一下价格",
    status: "ai_handling",
    messages: [
      { id: "m20", role: "customer", content: "你好，想问一下你们是怎么收费的？", timestamp: "2026-06-28 16:00:00" },
      { id: "m21", role: "assistant", content: "您好！SuperOne 提供三种套餐：\n\n🆓 免费版：基础功能，适合体验\n💼 专业版 ¥299/月：全功能，适合一人公司\n🏢 企业版 ¥999/月：团队协作+专属支持\n\n年付享 8 折优惠。需要我帮您推荐适合的套餐吗？", timestamp: "2026-06-28 16:00:06", sourceRef: { type: "ai_generated", label: "AI 基于定价策略生成" } },
    ],
    tags: ["价格咨询"], priority: "normal", createdAt: "2026-06-28 16:00:00", updatedAt: "2026-06-28 16:00:06", assignedTo: "阿服",
  },
];

const MOCK_STATS: SupportStats = {
  today: { total: 12, aiResolved: 7, humanResolved: 3, pending: 2 },
  thisWeek: { total: 64, aiResolved: 42, humanResolved: 16, avgResponseTime: "1.2s" },
  satisfaction: 94.2,
  topIssues: [
    { tag: "产品咨询", count: 18 }, { tag: "报价/价格", count: 14 }, { tag: "技术问题", count: 12 },
    { tag: "物流/订单", count: 8 }, { tag: "内容反馈", count: 7 },
  ],
  responseTrend: [
    { date: "06/22", aiResolved: 8, humanResolved: 2 }, { date: "06/23", aiResolved: 9, humanResolved: 3 },
    { date: "06/24", aiResolved: 10, humanResolved: 4 }, { date: "06/25", aiResolved: 12, humanResolved: 3 },
    { date: "06/26", aiResolved: 13, humanResolved: 2 }, { date: "06/27", aiResolved: 11, humanResolved: 5 },
    { date: "06/28", aiResolved: 7, humanResolved: 3 },
  ],
};

// ==================== API ====================

export async function getChannels(): Promise<ChannelAccount[]> { await delay(200); return MOCK_CHANNELS; }

export async function getSessions(params?: {
  channel?: string; status?: string; page?: number; pageSize?: number;
}): Promise<{ records: SupportSession[]; total: number }> {
  await delay();
  let list = [...MOCK_SESSIONS];
  if (params?.channel && params.channel !== "all") list = list.filter((s) => s.channel === params.channel);
  if (params?.status && params.status !== "all") list = list.filter((s) => s.status === params.status);
  list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const page = params?.page || 1; const pageSize = params?.pageSize || 20;
  const start = (page - 1) * pageSize;
  return { records: list.slice(start, start + pageSize), total: list.length };
}

export async function getSession(id: string): Promise<SupportSession | null> {
  await delay(200);
  return MOCK_SESSIONS.find((s) => s.id === id) || null;
}

export async function sendReply(sessionId: string, content: string): Promise<void> {
  await delay(400);
  const s = MOCK_SESSIONS.find((x) => x.id === sessionId);
  if (s) {
    s.messages.push({ id: `m_${Date.now()}`, role: "human", content, timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) });
    s.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
    s.status = "human_handling";
  }
}

export async function resolveSession(id: string, rating?: number): Promise<void> {
  await delay(200);
  const s = MOCK_SESSIONS.find((x) => x.id === id);
  if (s) { s.status = "resolved"; if (rating) s.rating = rating; }
}

export async function getSupportStats(): Promise<SupportStats> { await delay(400); return MOCK_STATS; }
