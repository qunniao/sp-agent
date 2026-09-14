/**
 * 执行记录 API 层（mock）
 */
import type { ExecutionRecord } from "../types";
import type { PageResult } from "@sp/core";

const MOCK_DELAY = 300;
function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const MOCK_EXECUTIONS: ExecutionRecord[] = [
  {
    id: "exec_001",
    automationId: "tpl_xiaohongshu_daily",
    automationName: "小红书每日科普",
    status: "success",
    startedAt: "2026-06-25 09:00:00",
    finishedAt: "2026-06-25 09:00:12",
    triggeredBy: "定时触发",
    stepResults: [
      { stepId: "s1", stepTitle: "AI 选题", status: "success", startedAt: "2026-06-25 09:00:00", finishedAt: "2026-06-25 09:00:03", duration: 3000, output: '1. "3个让你效率翻倍的AI工具（附真实体验）"\n   💡 卖点：实测对比 Notion AI vs Cursor vs Claude 的 3 个典型场景，给出选型建议\n\n2. "2026年最值得学的技术栈，不是 Python"\n   💡 卖点：全栈开发者用真实数据告诉你，投入时间学什么回报最高\n\n3. "独立开发者的 10K 月收入复盘（第 6 个月）"\n   💡 卖点：从 0 到稳定变现的完整路径，含踩坑记录' },
      { stepId: "s2", stepTitle: "AI 写正文", status: "success", startedAt: "2026-06-25 09:00:03", finishedAt: "2026-06-25 09:00:08", duration: 5000, output: '🔥 打工人必看！3个AI工具让效率翻倍\n\n上周我用 3 个 AI 工具把工作量减了一半，今天必须分享给大家👇\n\n1️⃣ Cursor - 写代码\n以前写一个模块要半天，现在用 AI 对话直接生成，改改就能用。效率提升至少 3 倍！\n\n2️⃣ Claude - 写文档\n周报、方案、邮件全部交给它。最绝的是它能读懂你整个项目，给出的建议特别精准。\n\n3️⃣ Notion AI - 整理信息\n会议纪要、知识库、项目管理三合一。搜索功能完爆传统文件夹。\n\n💡 我的选型建议：\n- 程序员无脑入 Cursor\n- 非技术岗位优先 Claude\n- 团队协作再上 Notion AI\n\n你们在用什么 AI 工具？评论区聊聊 ⬇️\n\n#AI工具 #效率提升 #打工人必备 #科技改变生活 #2026效率指南' },
      { stepId: "s3", stepTitle: "是否需人工审核？", status: "success", startedAt: "2026-06-25 09:00:08", finishedAt: "2026-06-25 09:00:08", duration: 0, output: "自动判断结果：选择「直接发布」分支（内容质量评分 8.5/10，无需人工审核）" },
      { stepId: "s4", stepTitle: "发布到小红书", status: "success", startedAt: "2026-06-25 09:00:08", finishedAt: "2026-06-25 09:00:12", duration: 4000, output: '✅ 发布成功\n📎 链接: https://www.xiaohongshu.com/explore/abc123\n📊 初始数据: 曝光 0 | 点赞 0 | 收藏 0\n⏰ 发布时间: 2026-06-25 09:00:12' },
    ],
  },
  {
    id: "exec_002",
    automationId: "tpl_customer_followup",
    automationName: "客户跟进提醒",
    status: "success",
    startedAt: "2026-06-25 22:00:00",
    finishedAt: "2026-06-25 22:00:08",
    triggeredBy: "定时触发",
    stepResults: [
      { stepId: "s1", stepTitle: "查询 24h 未回复客户", status: "success", startedAt: "2026-06-25 22:00:00", finishedAt: "2026-06-25 22:00:02", duration: 2000, output: '查询完成，找到 2 位待跟进客户：\n1. 张三（最后联系: 2026-06-23 15:30）- 项目报价阶段\n2. 李四（最后联系: 2026-06-24 10:15）- 需求确认阶段' },
      { stepId: "s2", stepTitle: "有需要跟进的客户？", status: "success", startedAt: "2026-06-25 22:00:02", finishedAt: "2026-06-25 22:00:02", duration: 0, output: "条件判断：「客户列表不为空」→ 结果为 true，选择「有 → 继续」分支，进入 AI 生成步骤" },
      { stepId: "s3", stepTitle: "AI 生成跟进消息", status: "success", startedAt: "2026-06-25 22:00:02", finishedAt: "2026-06-25 22:00:07", duration: 5000, output: '【张三 - 项目报价跟进】\n张总您好！距离上次发给您的项目报价已经过了 2 天，想确认一下您是否有时间看过方案？如果有任何疑问或需要调整的地方，随时告诉我。我可以在本周内安排一次 15 分钟的线上沟通，帮您快速了解方案核心。期待您的回复！\n\n【李四 - 需求确认跟进】\n李总好！上次沟通的需求清单我已经整理完毕，想跟您最终确认几个细节：1）交付时间是否按原定 7 月中旬？2）是否需要增加管理后台模块？方便的话回复一下，我就可以启动下一步了。' },
      { stepId: "s4", stepTitle: "推送到站内消息", status: "success", startedAt: "2026-06-25 22:00:07", finishedAt: "2026-06-25 22:00:08", duration: 1000, output: '✅ 通知推送成功\n📬 2 条跟进消息已发送到 SuperOne 站内消息中心\n📧 同步发送邮件提醒到 juno@superone.com' },
    ],
  },
  {
    id: "exec_005",
    automationId: "tpl_agent_demo",
    automationName: "内容创作组 · 串行审核",
    status: "success",
    startedAt: "2026-06-26 14:00:00",
    finishedAt: "2026-06-26 14:00:18",
    triggeredBy: "手动触发",
    stepResults: [
      {
        stepId: "s1", stepTitle: "内容创作组（写手 → 核查 → 修订 → 确认）", status: "success",
        startedAt: "2026-06-26 14:00:00", finishedAt: "2026-06-26 14:00:17", duration: 17000,
        output: '✅ 智能体团队协作完成，终稿已通过审查',
        messages: [
          { from: "✍️ 小红书写手", role: "生成初稿", at: "14:00:01", text: "我完成了一篇关于「2026年最值得学的 AI 技能」的初稿。\n\n结构：开场钩子 + 3 个技能详解 + 学习路径建议 + 结尾互动。\n\n初稿摘要：\n1. AI Prompt 工程 - 未来的基本素养\n2. AI 辅助编程 - 非程序员也能写代码\n3. AI 数据分析 - 用自然语言做 BI\n\n预计阅读时长 3 分钟，emoji 密度适中。" },
          { from: "🔍 事实核查员", role: "审查", at: "14:00:06", text: "审查完毕。发现以下问题：\n\n🟡 第 2 个技能「学习时长 2 周」偏乐观，建议改为「2-4 周」并加注「因个人基础而异」\n🟢 建议在结尾增加「推荐免费学习资源」板块，提高收藏率\n✅「Prompt 工程」部分数据准确，引用的调查报告中立可信\n✅「AI 数据分析」部分案例真实\n\n总体评价：内容质量高，修订后建议发布。" },
          { from: "✍️ 小红书写手", role: "修订", at: "14:00:14", text: "已根据审查意见完成修订：\n\n1. 学习时长已改为「2-4 周（根据个人编程基础而定）」\n2. 结尾新增「🎁 免费资源推荐」板块，包含 3 个优质免费课程链接\n3. 原文未发现需修正的事实错误\n\n修订后总字数 346，符合小红书笔记规范。" },
          { from: "🔍 事实核查员", role: "确认", at: "14:00:17", text: "修订已确认，两处修改均正确执行。✅ 通过审查，建议发布。" },
        ],
      },
    ],
  },
  {
    id: "exec_003",
    automationId: "tpl_xiaohongshu_daily",
    automationName: "小红书每日科普",
    status: "failed",
    startedAt: "2026-06-24 09:00:00",
    finishedAt: "2026-06-24 09:00:08",
    triggeredBy: "定时触发",
    stepResults: [
      { stepId: "s1", stepTitle: "AI 选题", status: "success", startedAt: "2026-06-24 09:00:00", finishedAt: "2026-06-24 09:00:03", duration: 3000 },
      { stepId: "s2", stepTitle: "AI 写正文", status: "success", startedAt: "2026-06-24 09:00:03", finishedAt: "2026-06-24 09:00:08", duration: 5000 },
      { stepId: "s3", stepTitle: "是否需人工审核？", status: "success", startedAt: "2026-06-24 09:00:08", finishedAt: "2026-06-24 09:00:08", duration: 0 },
      { stepId: "s4", stepTitle: "发布到小红书", status: "failed", startedAt: "2026-06-24 09:00:08", finishedAt: "2026-06-24 09:00:08", duration: 350, error: '❌ 发布失败\n\n错误码: 429 Too Many Requests\n错误信息: 今日发布次数已达上限（5/5），请明天再试\n建议: \n  1. 调低发布频率为每天 1 篇\n  2. 升级小红书创作者等级提升限额\n  3. 切换到「先存草稿」模式，手动分批发布\n\n步骤 1-3 已正常完成，仅发布环节失败。' },
    ],
  },
  {
    id: "exec_004",
    automationId: "tpl_xiaohongshu_daily",
    automationName: "小红书每日科普",
    status: "running",
    startedAt: "2026-06-25 23:00:00",
    triggeredBy: "手动触发",
    stepResults: [
      { stepId: "s1", stepTitle: "AI 选题", status: "success", startedAt: "2026-06-25 23:00:00", finishedAt: "2026-06-25 23:00:03", duration: 3000 },
      { stepId: "s2", stepTitle: "AI 写正文", status: "running", startedAt: "2026-06-25 23:00:03" },
      { stepId: "s3", stepTitle: "是否需人工审核？", status: "pending" },
      { stepId: "s4", stepTitle: "发布到小红书", status: "pending" },
    ],
  },
];

/**
 * 分页查询执行记录
 */
export async function getExecutions(params: {
  page: number;
  pageSize: number;
  automationId?: string;
  status?: string;
}): Promise<PageResult<ExecutionRecord>> {
  await delay();
  let list = [...MOCK_EXECUTIONS];
  if (params.automationId) {
    list = list.filter((e) => e.automationId === params.automationId);
  }
  if (params.status && params.status !== "all") {
    list = list.filter((e) => e.status === params.status);
  }
  list.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const { page = 1, pageSize = 10 } = params;
  const start = (page - 1) * pageSize;
  return {
    records: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  };
}

/**
 * 获取单次执行详情
 */
export async function getExecutionDetail(
  id: string
): Promise<ExecutionRecord | null> {
  await delay();
  return MOCK_EXECUTIONS.find((e) => e.id === id) ?? null;
}

/**
 * 取消正在运行的任务
 */
export async function cancelExecution(id: string): Promise<void> {
  await delay();
  const exec = MOCK_EXECUTIONS.find((e) => e.id === id);
  if (exec) exec.status = "cancelled";
}
