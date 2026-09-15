/**
 * 自动化工作流 API 层
 * 当前为 mock 模式，返回固定数据并模拟网络延迟
 */
import type {
  AutomationDef,
  AutomationQueryParams,
  TriggerConfig,
  StepNode,
} from "../types";
import type { PageResult } from "@sp/core";

// ==================== Mock 数据 ====================

const MOCK_DELAY = 300; // 模拟网络延迟

function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** 生成唯一 ID */
function uid(): string {
  return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 内置模板 */
const BUILT_IN_TEMPLATES: AutomationDef[] = [
  {
    id: "tpl_xiaohongshu_daily",
    name: "小红书每日科普",
    description: "每天早上 9 点自动生成科技类内容并发布到小红书",
    icon: "SendOutlined",
    category: "content",
    trigger: {
      type: "schedule",
      cron: "0 9 * * *",
      label: "每天上午 9:00",
    },
    steps: [
      {
        id: "s1",
        type: "ai.chat",
        title: "AI 选题",
        enabled: true,
        config: {
          prompt: "给我 3 个今天小红书科技类爆款选题，一句话描述每个选题的核心卖点。要求：选题要包含具体数字或对比，适合科技爱好者。",
          outputKey: "topics",
        },
      },
      {
        id: "s2",
        type: "ai.chat",
        title: "AI 写正文",
        enabled: true,
        config: {
          prompt: '从 {{step.s1.output}} 中选第 1 个选题，写一篇 300 字以内的爆款笔记。要求：开头钩子要吸引人，正文分 3 点叙述，结尾引导互动。语气亲切口语化，多用 emoji。标签：#科技 #效率工具 #打工人',
          outputKey: "content",
        },
      },
      {
        id: "s3",
        type: "condition",
        title: "是否需人工审核？",
        enabled: true,
        config: {
          expression: "正式发布前需要人工确认",
          branches: [
            { label: "需要审核 → 存入草稿", target: "end" },
            { label: "直接发布", target: "next" },
          ],
        },
      },
      {
        id: "s4",
        type: "platform.post",
        title: "发布到小红书",
        enabled: true,
        config: {
          accountId: "acct_xhs_tech",
          content: "{{step.s2.output}}",
          tags: ["科技", "效率工具"],
        },
      },
    ],
    enabled: true,
    createdAt: "2026-06-20 10:00:00",
    updatedAt: "2026-06-25 09:00:00",
    lastRunAt: "2026-06-25 09:00:00",
    runCount: 12,
  },
  {
    id: "tpl_weekly_report",
    name: "周一自动发周报",
    description: "每周一上午汇总上周工作数据，AI 生成周报并邮件发出",
    icon: "FileTextOutlined",
    category: "business",
    trigger: {
      type: "schedule",
      cron: "0 9 * * 1",
      label: "每周一上午 9:00",
    },
    steps: [
      {
        id: "s1",
        type: "http.request",
        title: "拉取上周工作数据",
        enabled: true,
        config: {
          url: "https://api.example.com/reports/weekly",
          method: "GET",
          outputKey: "rawData",
        },
      },
      {
        id: "s2",
        type: "ai.chat",
        title: "AI 分析并生成周报",
        enabled: true,
        config: {
          prompt: '根据以下数据生成一份专业的周报摘要，包含：本周亮点、关键数据、下周计划。数据：{{step.s1.output}}',
          outputKey: "report",
        },
      },
      {
        id: "s3",
        type: "notification",
        title: "发邮件给老板（自己）",
        enabled: true,
        config: {
          channel: "email",
          title: "SuperOne 周报 - {{date:now}}",
          content: "{{step.s2.output}}",
        },
      },
    ],
    enabled: false,
    createdAt: "2026-06-18 14:00:00",
    updatedAt: "2026-06-24 18:00:00",
    runCount: 3,
  },
  {
    id: "tpl_customer_followup",
    name: "客户跟进提醒",
    description: "每 4 小时检查未回复客户，AI 生成跟进消息并通知",
    icon: "TeamOutlined",
    category: "business",
    trigger: {
      type: "schedule",
      cron: "0 */4 * * *",
      label: "每 4 小时",
    },
    steps: [
      {
        id: "s1",
        type: "http.request",
        title: "查询 24h 未回复客户",
        enabled: true,
        config: {
          url: "https://api.example.com/customers?lastContact=24h",
          method: "GET",
          outputKey: "customers",
        },
      },
      {
        id: "s2",
        type: "condition",
        title: "有需要跟进的客户？",
        enabled: true,
        config: {
          expression: "客户列表不为空",
          branches: [
            { label: "无 → 跳过", target: "end" },
            { label: "有 → 继续", target: "next" },
          ],
        },
      },
      {
        id: "s3",
        type: "ai.chat",
        title: "AI 生成跟进消息",
        enabled: true,
        config: {
          prompt: '为以下客户生成个性化跟进消息，语气真诚不推销：{{step.s1.output}}',
          outputKey: "messages",
        },
      },
      {
        id: "s4",
        type: "notification",
        title: "推送到站内消息",
        enabled: true,
        config: {
          channel: "inapp",
          title: "客户跟进提醒",
          content: "以下客户需要跟进：\n{{step.s3.output}}",
        },
      },
    ],
    enabled: true,
    createdAt: "2026-06-22 11:00:00",
    updatedAt: "2026-06-23 16:00:00",
    lastRunAt: "2026-06-25 22:00:00",
    runCount: 28,
  },
  {
    id: "tpl_invoice_monthly",
    name: "月度财务简报",
    description: "每月 1 日汇总收支数据，AI 分析趋势并生成图表报告",
    icon: "DollarOutlined",
    category: "business",
    trigger: {
      type: "schedule",
      cron: "0 8 1 * *",
      label: "每月 1 日上午 8:00",
    },
    steps: [
      {
        id: "s1",
        type: "http.request",
        title: "拉取上月收支数据",
        enabled: true,
        config: {
          url: "https://api.example.com/finance/summary?month=last",
          method: "GET",
          outputKey: "financeData",
        },
      },
      {
        id: "s2",
        type: "ai.chat",
        title: "AI 财务分析",
        enabled: true,
        config: {
          prompt: "分析以下财务数据，给出：收入趋势、支出结构、优化建议。数据：{{step.s1.output}}",
          outputKey: "analysis",
        },
      },
      {
        id: "s3",
        type: "notification",
        title: "发送财务简报",
        enabled: true,
        config: {
          channel: "email",
          title: "SuperOne 月度财务简报",
          content: "{{step.s2.output}}",
        },
      },
    ],
    enabled: false,
    createdAt: "2026-06-15 09:00:00",
    updatedAt: "2026-06-20 10:00:00",
    runCount: 0,
  },
];

// ==================== API 函数 ====================

/**
 * 分页查询工作流模板列表
 */
export async function getAutomationList(
  params: AutomationQueryParams
): Promise<PageResult<AutomationDef>> {
  await delay();
  let list = [...BUILT_IN_TEMPLATES];

  if (params.category && params.category !== "all") {
    list = list.filter((t) => t.category === params.category);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(kw) ||
        t.description.toLowerCase().includes(kw)
    );
  }

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
 * 获取单个工作流详情
 */
export async function getAutomationDetail(
  id: string
): Promise<AutomationDef | null> {
  await delay();
  return BUILT_IN_TEMPLATES.find((t) => t.id === id) ?? null;
}

/**
 * 保存工作流（新建/更新）
 */
export async function saveAutomation(
  def: Omit<AutomationDef, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<AutomationDef> {
  await delay(500);
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  if (def.id) {
    // 更新
    const idx = BUILT_IN_TEMPLATES.findIndex((t) => t.id === def.id);
    if (idx >= 0) {
      BUILT_IN_TEMPLATES[idx] = {
        ...BUILT_IN_TEMPLATES[idx],
        ...def,
        id: def.id,
        updatedAt: now,
      };
      return BUILT_IN_TEMPLATES[idx];
    }
  }
  // 新建
  const created: AutomationDef = {
    ...def,
    id: uid(),
    createdAt: now,
    updatedAt: now,
    runCount: 0,
  } as AutomationDef;
  BUILT_IN_TEMPLATES.push(created);
  return created;
}

/**
 * 删除工作流
 */
export async function deleteAutomation(id: string): Promise<void> {
  await delay();
  const idx = BUILT_IN_TEMPLATES.findIndex((t) => t.id === id);
  if (idx >= 0) BUILT_IN_TEMPLATES.splice(idx, 1);
}

/**
 * 切换启用状态
 */
export async function toggleAutomation(
  id: string,
  enabled: boolean
): Promise<void> {
  await delay();
  const tpl = BUILT_IN_TEMPLATES.find((t) => t.id === id);
  if (tpl) tpl.enabled = enabled;
}

// ==================== 平台连接 ====================

const MOCK_ACCOUNTS = [
  {
    id: "acct_xhs_tech",
    platform: "xiaohongshu" as const,
    nickname: "SuperOne 科技号",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=xhs",
    status: "connected" as const,
    connectedAt: "2026-06-10 14:30:00",
    bio: "分享 AI 工具和效率提升，1.2w 粉丝",
  },
  {
    id: "acct_xhs_life",
    platform: "xiaohongshu" as const,
    nickname: "一人公司日记",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=life",
    status: "connected" as const,
    connectedAt: "2026-06-15 09:00:00",
    bio: "记录独立开发日常，5.6k 粉丝",
  },
  {
    id: "acct_wechat_main",
    platform: "wechat_mp" as const,
    nickname: "SuperOne 官方号",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=wechat",
    status: "disconnected" as const,
    bio: "公众号，需重新授权",
  },
  {
    id: "acct_douyin_vlog",
    platform: "douyin" as const,
    nickname: "老王的效率工具",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dy",
    status: "connected" as const,
    connectedAt: "2026-05-20 11:00:00",
    bio: "短视频评测，2.8w 粉丝",
  },
];

export async function getPlatformAccounts(): Promise<typeof MOCK_ACCOUNTS> {
  await delay(200);
  return MOCK_ACCOUNTS;
}

export async function connectPlatform(
  platform: string,
  nickname: string
): Promise<typeof MOCK_ACCOUNTS[0]> {
  await delay(1200);
  const account = {
    id: `acct_${Date.now()}`,
    platform: platform as any,
    nickname,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
    status: "connected" as const,
    connectedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
    bio: "",
  };
  MOCK_ACCOUNTS.push(account);
  return account;
}

export async function disconnectPlatform(id: string): Promise<void> {
  await delay(500);
  const acct = MOCK_ACCOUNTS.find((a) => a.id === id);
  if (acct) acct.status = "disconnected";
}

/**
 * 手动触发一次执行
 */
export async function triggerAutomation(id: string): Promise<string> {
  await delay(500);
  return `exec_${Date.now()}`;
}

/**
 * 测试单个步骤（mock）
 */
import type { AgentPersona, VirtualEmployee, PersonaTeam, StepType, CalendarEntry, MediaAsset, DraftItem, DistributionJob, PlatformMetrics, Inspiration, WeeklyReport, PromptTemplate, UsageStats, ChatSession, ChatMessage, ModelConfig, ModelUsage, DifyConnection, DifyWorkflow } from "../types";

export async function testStep(
  type: StepType,
  config: Record<string, any>
): Promise<{ output: string; duration: number }> {
  await delay(800 + Math.random() * 1200);

  switch (type) {
    case "ai.chat": {
      const prompt = (config.prompt || "").slice(0, 60);
      return {
        output: `🤖 AI 模拟回复（基于: "${prompt}..."）\n\nAI 对话步骤的测试输出。正式执行时这里会是 Claude 生成的实际内容。\n\n你可以在 Prompt 中使用 {{step.xxx.output}} 引用前置步骤的输出变量。`,
        duration: Math.round(1500 + Math.random() * 3000),
      };
    }
    case "ai.generate_image": {
      return {
        output: `🎨 模拟生成图片\nURL: https://via.placeholder.com/1024x1024?text=AI+Generated\n\n正式执行时会调用 DALL-E / Midjourney API。`,
        duration: Math.round(2000 + Math.random() * 4000),
      };
    }
    case "platform.post": {
      return {
        output: `✅ 模拟发布到 ${config.platform || "平台"}\n内容: ${(config.content || "").slice(0, 80)}...\n发布时间: ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
        duration: 1200,
      };
    }
    case "http.request": {
      return {
        output: `🌐 HTTP ${config.method || "GET"} ${config.url || "/api"}\n状态码: 200 OK\n响应: { "data": [...], "total": 42, "status": "ok" }`,
        duration: Math.round(300 + Math.random() * 800),
      };
    }
    case "notification": {
      return {
        output: `📬 测试通知已通过 ${config.channel || "inapp"} 渠道发送\n标题: ${config.title || "(无标题)"}\n内容: ${(config.content || "").slice(0, 60)}...`,
        duration: 600,
      };
    }
    case "condition": {
      return {
        output: `🔀 条件判断测试\n表达式: "${config.expression || "(未设置)"}"\n模拟结果: 条件满足 → 选择「继续」分支`,
        duration: 50,
      };
    }
    case "delay": {
      return {
        output: `⏱️ 模拟延时 ${config.seconds || 0} 秒（测试模式跳过实际等待）`,
        duration: 100,
      };
    }
    case "transform": {
      return {
        output: `🔄 模板渲染结果\n输入: ${config.template || "(空)"}\n输出: 变量已替换为模拟值`,
        duration: 200,
      };
    }
    case "agent.team": {
      const personaIds = config.personaIds || [];
      const mode = config.mode || "serial_review";
      const lines: string[] = [];
      lines.push(`🤝 智能体团队协作（${mode} 模式）\n`);
      if (mode === "serial_review") {
        lines.push(`[✍️ 写手] 已生成初稿...`);
        lines.push(`[🔍 审查员] 发现 2 处问题已标记...`);
        lines.push(`[✍️ 写手] 修订完成，输出终稿。`);
      } else if (mode === "parallel") {
        lines.push(`3 个智能体并行生成中...`);
        lines.push(`[A] 版本一：侧重技术深度`);
        lines.push(`[B] 版本二：侧重通俗易懂`);
        lines.push(`[C] 版本三：侧重实操教程`);
      } else {
        lines.push(`[👍 正方] 观点已陈述`);
        lines.push(`[👎 反方] 反驳已提交`);
        lines.push(`[⚖️ 裁判] 综合裁决完成`);
      }
      return {
        output: lines.join("\n"),
        duration: Math.round(4000 + Math.random() * 6000),
      };
    }
    default: {
      return { output: "✅ 测试完成", duration: 100 };
    }
  }
}

// ==================== 智能体库 ====================

const BUILT_IN_PERSONAS: AgentPersona[] = [
  {
    id: "persona_writer_xhs",
    name: "小红书写手",
    avatar: "✍️",
    role: "资深小红书博主，10w+ 粉丝",
    systemPrompt: "你是一个资深的小红书内容创作者。你的写作风格：口语化、亲切自然、善于用 emoji 和分段让内容易读。你擅长用「钩子开头」抓住读者注意力，3 点结构组织主体内容，结尾引导互动。你精通科技、效率工具、个人成长领域的内容创作。",
    expertise: ["小红书", "爆款文案", "科技内容", "个人成长"],
    createdAt: "2026-06-10 10:00:00",
  },
  {
    id: "persona_checker",
    name: "事实核查员",
    avatar: "🔍",
    role: "严谨的资料审查专家",
    systemPrompt: "你是一个事实核查与质量审查专家。你的职责：逐条核对内容的准确性，标记任何存疑的数据、日期、价格、人名。你不负责创作，只负责找出问题。对每个发现标注严重程度：🔴 事实错误 / 🟡 存疑 / 🟢 建议优化。最后用一句话总结是否通过审查。",
    expertise: ["事实核查", "数据验证", "质量审查"],
    createdAt: "2026-06-10 10:00:00",
  },
  {
    id: "persona_title_optimizer",
    name: "标题优化师",
    avatar: "🎯",
    role: "营销专家，专攻点击率优化",
    systemPrompt: "你是一个标题和 hook 优化专家。你深谙各大平台的推荐算法和用户心理。你会为同一篇内容生成 3-5 个不同风格的标题/开头，并解释每个版本的适用场景。你的输出格式：版本名 → 标题 → 预估点击率 → 理由。",
    expertise: ["标题优化", "A/B测试", "营销心理学"],
    createdAt: "2026-06-10 10:00:00",
  },
  {
    id: "persona_coder",
    name: "技术顾问",
    avatar: "💻",
    role: "全栈工程师，10 年经验",
    systemPrompt: "你是一个资深全栈工程师。你擅长将复杂的技术概念用通俗的语言解释清楚。你审查代码时按：正确性 → 性能 → 安全性 → 可维护性的顺序。你给建议时总会附上代码示例。",
    expertise: ["代码审查", "架构设计", "技术写作"],
    createdAt: "2026-06-10 10:00:00",
  },
  {
    id: "persona_optimist",
    name: "乐观分析师",
    avatar: "🟢",
    role: "商业分析 - 乐观派",
    systemPrompt: "你是一个乐观主义的商业分析师。你看任何方案都先找优点和机会。你的思维框架：市场机会 → 竞争优势 → 增长路径 → 乐观预期收益。你说话的风格是「这个值得一试」。",
    expertise: ["商业分析", "机会评估", "市场分析"],
    createdAt: "2026-06-10 10:00:00",
  },
  {
    id: "persona_pessimist",
    name: "风险研判师",
    avatar: "🔴",
    role: "商业分析 - 悲观派",
    systemPrompt: "你是一个风险导向的商业分析师。你看任何方案都先找漏洞和风险。你的思维框架：假设检验 → 风险清单 → 最坏情况 → 应对预案。你说话的风格是「我们需要考虑如果……」。",
    expertise: ["风险分析", "假设检验", "商业策略"],
    createdAt: "2026-06-10 10:00:00",
  },
  {
    id: "persona_judge",
    name: "裁判长",
    avatar: "⚖️",
    role: "中立裁决者",
    systemPrompt: "你是一个中立的决策裁判。你接收多方的论点，按照：论据强度 → 逻辑严谨性 → 可执行性的标准评分。不偏向任何一方。最终输出包含：各方得分 → 综合结论 → 建议行动。",
    expertise: ["决策分析", "综合评判", "团队协调"],
    createdAt: "2026-06-10 10:00:00",
  },
];

export async function getPersonas(): Promise<AgentPersona[]> {
  await delay(200);
  return BUILT_IN_PERSONAS;
}

export async function getPersona(id: string): Promise<AgentPersona | null> {
  await delay(100);
  return BUILT_IN_PERSONAS.find((p) => p.id === id) ?? null;
}

export async function savePersona(
  data: Omit<AgentPersona, "id" | "createdAt"> & { id?: string }
): Promise<AgentPersona> {
  await delay(400);
  if (data.id) {
    const idx = BUILT_IN_PERSONAS.findIndex((p) => p.id === data.id);
    if (idx >= 0) {
      BUILT_IN_PERSONAS[idx] = { ...BUILT_IN_PERSONAS[idx], ...data, id: data.id };
      return BUILT_IN_PERSONAS[idx];
    }
  }
  const persona: AgentPersona = {
    ...data,
    id: `persona_${Date.now()}`,
    createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
  };
  BUILT_IN_PERSONAS.push(persona);
  return persona;
}

export async function deletePersona(id: string): Promise<void> {
  await delay(200);
  const idx = BUILT_IN_PERSONAS.findIndex((p) => p.id === id);
  if (idx >= 0) BUILT_IN_PERSONAS.splice(idx, 1);
}

// ==================== 虚拟员工 ====================

const BUILT_IN_EMPLOYEES: VirtualEmployee[] = [
  {
    id: "emp_finance", name: "阿财", avatar: "💰",
    role: "财务专员", department: "finance",
    systemPrompt: "你是 SuperOne 的财务专员阿财。你负责：记账、费用审核、财务分析、税务提醒。你说话简洁专业，喜欢用数据说话。",
    skills: ["记账", "费用审核", "财务报表", "税务计算"],
    capabilities: ["记录收支", "生成月度报表", "费用分类", "开票提醒", "预算分析"],
    linkedModules: ["财务模块"],
    usageCount: 15, createdAt: "2026-06-01 09:00:00",
  },
  {
    id: "emp_sales", name: "阿销", avatar: "📈",
    role: "销售助理", department: "sales",
    systemPrompt: "你是 SuperOne 的销售助理阿销。你负责：客户跟进、报价建议、销售漏斗管理。你沟通得体，善于把握客户心理。",
    skills: ["客户跟进", "报价策略", "谈判支持", "CRM管理"],
    capabilities: ["写跟进消息", "生成报价方案", "分析客户意向", "提醒跟进时机", "整理客户档案"],
    linkedModules: ["客户管理", "自动化工作流"],
    usageCount: 28, createdAt: "2026-06-01 09:00:00",
  },
  {
    id: "emp_ops", name: "阿运", avatar: "⚙️",
    role: "运营主管", department: "operation",
    systemPrompt: "你是 SuperOne 的运营主管阿运。你负责：项目推进、任务分配、流程优化。你是全公司最能推动事情的人。",
    skills: ["项目管理", "流程优化", "任务分配", "进度追踪"],
    capabilities: ["创建项目计划", "拆解任务", "跟踪里程碑", "生成进度报告", "发现流程瓶颈"],
    linkedModules: ["自动化工作流", "项目管理"],
    usageCount: 20, createdAt: "2026-06-01 09:00:00",
  },
  {
    id: "emp_marketing", name: "阿市", avatar: "📣",
    role: "市场专员", department: "marketing",
    systemPrompt: "你是 SuperOne 的市场专员阿市。你负责：内容创作、平台运营、数据分析、增长策略。你擅长小红书和公众号运营。",
    skills: ["内容创作", "社交媒体", "SEO", "数据分析"],
    capabilities: ["写爆款文案", "分析内容数据", "规划选题日历", "优化标签策略", "竞品分析"],
    linkedModules: ["自媒体中心", "AI能力"],
    usageCount: 89, createdAt: "2026-06-01 09:00:00",
  },
  {
    id: "emp_support", name: "阿服", avatar: "🎧",
    role: "客服专员", department: "support",
    systemPrompt: "你是 SuperOne 的客服专员阿服。你负责：客户咨询、问题处理、满意度跟进。你耐心细致，总能化解客户的不满。",
    skills: ["客户沟通", "问题排查", "满意度管理", "FAQ维护"],
    capabilities: ["回复客户咨询", "处理投诉", "更新FAQ", "客户满意度分析", "生成服务报告"],
    linkedModules: ["客户管理"],
    usageCount: 12, createdAt: "2026-06-01 09:00:00",
  },
  {
    id: "emp_tech", name: "阿技", avatar: "💻",
    role: "技术顾问", department: "tech",
    systemPrompt: "你是 SuperOne 的技术顾问阿技。你负责：代码审查、架构建议、技术选型、性能优化。你有 10 年全栈开发经验。",
    skills: ["代码审查", "架构设计", "性能优化", "技术选型"],
    capabilities: ["审查代码", "设计架构方案", "性能分析", "技术栈评估", "写技术文档"],
    linkedModules: ["代码生成器", "自动化工作流"],
    usageCount: 18, createdAt: "2026-06-01 09:00:00",
  },
  {
    id: "emp_legal", name: "阿法", avatar: "⚖️",
    role: "法务助理", department: "legal",
    systemPrompt: "你是 SuperOne 的法务助理阿法。你负责：合同审查、风险提示、合规检查。你严谨但不死板，总能找到平衡风险和效率的方案。",
    skills: ["合同审查", "风险评估", "合规检查", "知识产权"],
    capabilities: ["审查合同条款", "标记风险点", "生成合规清单", "知识产权提醒", "修改建议"],
    linkedModules: ["知识库"],
    usageCount: 6, createdAt: "2026-06-01 09:00:00",
  },
];

export async function getEmployees(): Promise<VirtualEmployee[]> {
  await delay(200);
  return BUILT_IN_EMPLOYEES;
}

export async function saveEmployee(
  data: Omit<VirtualEmployee, "id" | "createdAt" | "usageCount"> & { id?: string }
): Promise<VirtualEmployee> {
  await delay(400);
  if (data.id) {
    const idx = BUILT_IN_EMPLOYEES.findIndex((e) => e.id === data.id);
    if (idx >= 0) { BUILT_IN_EMPLOYEES[idx] = { ...BUILT_IN_EMPLOYEES[idx], ...data, id: data.id }; return BUILT_IN_EMPLOYEES[idx]; }
  }
  const emp: VirtualEmployee = { ...data, id: `emp_${Date.now()}`, usageCount: 0, createdAt: new Date().toISOString().replace("T", " ").slice(0, 19) };
  BUILT_IN_EMPLOYEES.push(emp);
  return emp;
}

export async function deleteEmployee(id: string): Promise<void> {
  await delay(200);
  const idx = BUILT_IN_EMPLOYEES.findIndex((e) => e.id === id);
  if (idx >= 0) BUILT_IN_EMPLOYEES.splice(idx, 1);
}

// ==================== 智能体团队 ====================

const BUILT_IN_TEAMS: PersonaTeam[] = [
  {
    id: "team_content",
    name: "内容发布组",
    description: "市场专员阿市创作内容 → 法务助理阿法审查合规 → 阿市修订发布。确保内容既有爆点又合规",
    personaIds: ["emp_marketing", "emp_legal"],
    defaultMode: "serial_review",
    createdAt: "2026-06-20 10:00:00",
  },
  {
    id: "team_deal",
    name: "成交小组",
    description: "销售助理阿销分析客户意向 → 财务专员阿财审核报价 → 输出最终方案",
    personaIds: ["emp_sales", "emp_finance"],
    defaultMode: "serial_review",
    createdAt: "2026-06-20 10:00:00",
  },
  {
    id: "team_project",
    name: "项目推进组",
    description: "运营主管阿运拆解任务 → 技术顾问阿技评估工时 → 客服专员阿服准备FAQ → 完整交付方案",
    personaIds: ["emp_ops", "emp_tech", "emp_support"],
    defaultMode: "serial_review",
    createdAt: "2026-06-20 10:00:00",
  },
];

export async function getTeams(): Promise<PersonaTeam[]> {
  await delay(200);
  return BUILT_IN_TEAMS;
}

export async function saveTeam(
  data: Omit<PersonaTeam, "id" | "createdAt"> & { id?: string }
): Promise<PersonaTeam> {
  await delay(400);
  if (data.id) {
    const idx = BUILT_IN_TEAMS.findIndex((t) => t.id === data.id);
    if (idx >= 0) {
      BUILT_IN_TEAMS[idx] = { ...BUILT_IN_TEAMS[idx], ...data, id: data.id };
      return BUILT_IN_TEAMS[idx];
    }
  }
  const team: PersonaTeam = {
    ...data,
    id: `team_${Date.now()}`,
    createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
  };
  BUILT_IN_TEAMS.push(team);
  return team;
}

export async function deleteTeam(id: string): Promise<void> {
  await delay(200);
  const idx = BUILT_IN_TEAMS.findIndex((t) => t.id === id);
  if (idx >= 0) BUILT_IN_TEAMS.splice(idx, 1);
}

// ==================== 内容日历 ====================

const MOCK_CALENDAR: CalendarEntry[] = [
  { id: "cal_01", date: "2026-06-26", platform: "xiaohongshu", accountId: "acct_xhs_tech", accountNickname: "SuperOne 科技号", title: "3个AI工具让效率翻倍", type: "ai_auto", status: "published", automationId: "tpl_xiaohongshu_daily" },
  { id: "cal_02", date: "2026-06-26", platform: "douyin", accountId: "acct_douyin_vlog", accountNickname: "老王的效率工具", title: "Cursor 新手入门教程（上）", type: "manual", status: "pending_review" },
  { id: "cal_03", date: "2026-06-27", platform: "xiaohongshu", accountId: "acct_xhs_tech", accountNickname: "SuperOne 科技号", title: "2026年最值得学的技术栈", type: "ai_auto", status: "scheduled", automationId: "tpl_xiaohongshu_daily" },
  { id: "cal_04", date: "2026-06-27", platform: "xiaohongshu", accountId: "acct_xhs_life", accountNickname: "一人公司日记", title: "独立开发者10K月收入复盘", type: "ai_auto", status: "scheduled", automationId: "tpl_xiaohongshu_daily" },
  { id: "cal_05", date: "2026-06-28", platform: "wechat_mp", accountId: "", accountNickname: "SuperOne 官方号", title: "AI 时代的一人公司生存指南", type: "manual", status: "draft" },
  { id: "cal_06", date: "2026-06-29", platform: "xiaohongshu", accountId: "acct_xhs_tech", accountNickname: "SuperOne 科技号", title: "Claude vs ChatGPT 实测对比", type: "ai_auto", status: "generating", automationId: "tpl_xiaohongshu_daily" },
  { id: "cal_07", date: "2026-06-30", platform: "douyin", accountId: "acct_douyin_vlog", accountNickname: "老王的效率工具", title: "Cursor 新手入门教程（下）", type: "manual", status: "scheduled" },
  { id: "cal_08", date: "2026-06-30", platform: "xiaohongshu", accountId: "acct_xhs_tech", accountNickname: "SuperOne 科技号", title: "一周效率工具合集", type: "ai_auto", status: "scheduled", automationId: "tpl_xiaohongshu_daily" },
  { id: "cal_09", date: "2026-06-26", platform: "wechat_mp", accountId: "", accountNickname: "SuperOne 官方号", title: "6月团队复盘：AI 如何改变了我们的工作流", type: "draft", status: "draft" },
  { id: "cal_10", date: "2026-07-01", platform: "xiaohongshu", accountId: "acct_xhs_tech", accountNickname: "SuperOne 科技号", title: "7月效率工具推荐", type: "ai_auto", status: "scheduled", automationId: "tpl_xiaohongshu_daily" },
];

export async function getCalendarEntries(year: number, month: number): Promise<CalendarEntry[]> {
  await delay(300);
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return MOCK_CALENDAR.filter((e) => e.date.startsWith(prefix));
}

export async function getCalendarDates(year: number, month: number): Promise<string[]> {
  const entries = await getCalendarEntries(year, month);
  return [...new Set(entries.map((e) => e.date))];
}

// ==================== 素材库 ====================

const MOCK_ASSETS: MediaAsset[] = [
  { id: "ast_01", name: "AI效率工具封面图", type: "image", platform: "xiaohongshu", thumbnailUrl: "https://via.placeholder.com/400x300/722ed1/fff?text=AI+效率工具", content: "https://via.placeholder.com/1024x768/722ed1/fff?text=AI+效率工具", source: "ai_generated", executionId: "exec_001", size: "1.2MB", createdAt: "2026-06-25 09:00:05" },
  { id: "ast_02", name: "科技感配图-蓝色", type: "image", platform: "xiaohongshu", thumbnailUrl: "https://via.placeholder.com/400x300/1677ff/fff?text=科技配图", content: "https://via.placeholder.com/1024x768/1677ff/fff?text=科技配图", source: "ai_generated", executionId: "exec_005", size: "980KB", createdAt: "2026-06-26 14:00:08" },
  { id: "ast_03", name: "小红书爆款文案模板", type: "template", platform: "xiaohongshu", thumbnailUrl: "https://via.placeholder.com/400x300/52c41a/fff?text=文案模板", content: "🔥 [钩子开头]\n\n[3点干货结构]\n\n💡 总结 + 互动引导\n\n#标签1 #标签2 #标签3", source: "manual_upload", size: "2KB", createdAt: "2026-06-20 15:00:00" },
  { id: "ast_04", name: "Cursor教程截图1", type: "image", platform: "douyin", thumbnailUrl: "https://via.placeholder.com/400x300/fa541c/fff?text=Cursor教程", content: "https://via.placeholder.com/1920x1080/fa541c/fff?text=Cursor教程", source: "manual_upload", size: "2.4MB", createdAt: "2026-06-24 11:00:00" },
  { id: "ast_05", name: "一人公司日记-封面", type: "image", platform: "xiaohongshu", thumbnailUrl: "https://via.placeholder.com/400x300/eb2f96/fff?text=一人公司日记", content: "https://via.placeholder.com/1024x768/eb2f96/fff?text=一人公司日记", source: "ai_generated", executionId: "exec_001", size: "1.5MB", createdAt: "2026-06-25 09:00:07" },
  { id: "ast_06", name: "公众号排版模板-科技风", type: "template", platform: "wechat_mp", thumbnailUrl: "https://via.placeholder.com/400x300/2f54eb/fff?text=排版模板", content: "# 标题\n\n## 副标题\n\n正文内容...\n\n---\n*推荐阅读*", source: "manual_upload", size: "1.5KB", createdAt: "2026-06-18 10:00:00" },
  { id: "ast_07", name: "效率工具对比表格", type: "text", platform: undefined, thumbnailUrl: "", content: "| 工具 | 优势 | 劣势 | 价格 |\n|------|------|------|------|\n| Cursor | 代码补全 | 需学习 | $20/月 |\n| Claude | 长文档 | 速度慢 | $20/月 |", source: "ai_generated", executionId: "exec_005", createdAt: "2026-06-26 14:00:12" },
  { id: "ast_08", name: "打工人表情包-摸鱼", type: "image", platform: "xiaohongshu", thumbnailUrl: "https://via.placeholder.com/400x300/13c2c2/fff?text=😎摸鱼", content: "https://via.placeholder.com/800x800/13c2c2/fff?text=😎", source: "manual_upload", size: "320KB", createdAt: "2026-06-22 17:00:00" },
];

export async function getAssets(params: {
  page: number;
  pageSize: number;
  type?: string;
  platform?: string;
}): Promise<PageResult<MediaAsset>> {
  await delay(300);
  let list = [...MOCK_ASSETS];
  if (params.type && params.type !== "all") {
    list = list.filter((a) => a.type === params.type);
  }
  if (params.platform && params.platform !== "all") {
    list = list.filter((a) => a.platform === params.platform);
  }
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (params.page - 1) * params.pageSize;
  return {
    records: list.slice(start, start + params.pageSize),
    total: list.length,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function deleteAsset(id: string): Promise<void> {
  await delay(200);
  const idx = MOCK_ASSETS.findIndex((a) => a.id === id);
  if (idx >= 0) MOCK_ASSETS.splice(idx, 1);
}

// ==================== 草稿箱 ====================

const MOCK_DRAFTS: DraftItem[] = [
  {
    id: "draft_01", title: "为什么AI工具是2026最大风口", platform: "xiaohongshu", accountId: "acct_xhs_tech", accountNickname: "SuperOne 科技号",
    content: "🔥 打工人必看！2026年最值得投资的就是学会用 AI 工具...\n\n上周跟几个创业的朋友聊，发现一个规律：会用 AI 的人，工作效率至少是普通人的 2-3 倍...",
    automationName: "小红书每日科普", createdAt: "2026-06-26 09:00:12", reviewStatus: "pending",
    prompt: "写一篇关于2026年AI工具投资价值的爆款笔记", tags: ["AI", "效率工具", "2026趋势"],
  },
  {
    id: "draft_02", title: "独立开发者10K月收入复盘", platform: "xiaohongshu", accountId: "acct_xhs_life", accountNickname: "一人公司日记",
    content: "记录独立开发的第 6 个月，终于突破月入 1 万...\n\n很多人问我怎么做到的，今天完整复盘：\n\n1️⃣ 产品选择：找到一个足够痛的小需求...",
    automationName: "小红书每日科普", createdAt: "2026-06-26 09:00:10", reviewStatus: "pending",
    tags: ["独立开发", "一人公司", "收入复盘"],
  },
  {
    id: "draft_03", title: "AI 时代的一人公司生存指南", platform: "wechat_mp", accountId: "acct_wechat_main", accountNickname: "SuperOne 官方号",
    content: "# AI 时代的一人公司生存指南\n\n## 引言\n2026年，一个人 + AI = 一个团队。这不是夸张，而是正在发生的现实...",
    createdAt: "2026-06-25 16:00:00", reviewStatus: "approved",
    tags: ["AI", "一人公司", "创业"],
  },
  {
    id: "draft_04", title: "Cursor 新手入门教程（完整版）", platform: "xiaohongshu", accountId: "acct_xhs_tech", accountNickname: "SuperOne 科技号",
    content: "🖥️ 零基础也能用的 AI 编程工具来了！\n\nCursor 是我今年用过最惊喜的工具。不需要会写代码，用中文告诉它你想做什么就行...",
    automationName: "小红书每日科普", createdAt: "2026-06-25 09:00:08", reviewStatus: "rejected",
    prompt: "写一篇Cursor新手入门教程", tags: ["Cursor", "AI编程", "教程"],
  },
  {
    id: "draft_05", title: "6月团队复盘：AI 如何改变了我们的工作流", platform: "wechat_mp", accountId: "acct_wechat_main", accountNickname: "SuperOne 官方号",
    content: "# 6月团队复盘\n\n## AI 带来的变化\n过去一个月，我们把 AI 深度融入了日常工作...",
    createdAt: "2026-06-24 14:00:00", reviewStatus: "pending",
    tags: ["复盘", "AI", "团队"],
  },
];

export async function getDrafts(params: {
  status?: string;
  page: number;
  pageSize: number;
}): Promise<PageResult<DraftItem>> {
  await delay(300);
  let list = [...MOCK_DRAFTS];
  if (params.status && params.status !== "all") {
    list = list.filter((d) => d.reviewStatus === params.status);
  }
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (params.page - 1) * params.pageSize;
  return {
    records: list.slice(start, start + params.pageSize),
    total: list.length,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function updateDraftStatus(id: string, status: string): Promise<void> {
  await delay(200);
  const d = MOCK_DRAFTS.find((x) => x.id === id);
  if (d) d.reviewStatus = status as any;
}

export async function deleteDraft(id: string): Promise<void> {
  await delay(200);
  const idx = MOCK_DRAFTS.findIndex((d) => d.id === id);
  if (idx >= 0) MOCK_DRAFTS.splice(idx, 1);
}

// ==================== 一键分发 ====================

const MOCK_DISTRIBUTIONS: DistributionJob[] = [
  {
    id: "dist_01",
    sourceContent: "🔥 打工人必看！3个AI工具让效率翻倍\n\n上周我用 3 个 AI 工具把工作量减了一半...\n\n💡 我的选型建议：\n- 程序员无脑入 Cursor\n- 非技术岗位优先 Claude\n- 团队协作再上 Notion AI\n\n#AI工具 #效率提升 #打工人必备",
    sourcePlatform: "xiaohongshu",
    createdAt: "2026-06-26 10:00:00",
    versions: [
      { platform: "xiaohongshu", content: "🔥 打工人必看！3个AI工具让效率翻倍\n\n...\n\n#AI工具 #效率提升 #打工人必备", status: "published", accountId: "acct_xhs_tech" },
      { platform: "wechat_mp", content: "# 3个让效率翻倍的AI工具（2026实测）\n\n## 引言\n作为一人公司的实践者，我每周都在测试新的效率工具。这篇文章分享最近三个月验证有效的3款AI工具...\n\n## 1. Cursor - AI编程助手\n\n### 适用场景\n- 快速原型开发\n- 代码审查\n- 脚本自动化\n\n...", status: "adapted", accountId: "acct_wechat_main" },
      { platform: "douyin", content: "【口播脚本】\n开头：你是不是还在手动写周报、改bug、整理笔记？今天分享3个AI神器\n正文：\n1. Cursor - 5秒生成一个功能...\n2. Claude - 自动写周报...\n3. Notion AI - 一键整理...\n结尾：评论区告诉我你最想试哪个", status: "adapting" },
      { platform: "weibo", content: "打工人效率翻倍！实测3个AI工具：Cursor写代码、Claude写文档、Notion AI整理信息。你最想试哪个？🤔 #AI工具 #效率", status: "adapted" },
    ],
  },
];

export async function getDistributions(): Promise<DistributionJob[]> {
  await delay(300);
  return MOCK_DISTRIBUTIONS;
}

export async function distributeToPlatforms(
  content: string,
  fromPlatform: string,
  toPlatforms: string[]
): Promise<DistributionJob> {
  await delay(2500);
  const job: DistributionJob = {
    id: `dist_${Date.now()}`,
    sourceContent: content,
    sourcePlatform: fromPlatform as any,
    createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
    versions: toPlatforms.map((p) => ({
      platform: p as any,
      content: content.slice(0, 100) + `\n\n(AI 正在将${fromPlatform}内容适配为${p}格式...)`,
      status: "adapting" as const,
    })),
  };
  MOCK_DISTRIBUTIONS.push(job);
  return job;
}

// ==================== 数据看板 ====================

const MOCK_METRICS: PlatformMetrics[] = [
  {
    platform: "xiaohongshu", accountId: "acct_xhs_tech", nickname: "SuperOne 科技号",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=xhs",
    followers: 12600, followersTrend: 14.5,
    thisWeek: { views: 45600, likes: 2850, comments: 387, shares: 642, posts: 5 },
    lastWeek: { views: 39800, likes: 2490, comments: 310, shares: 560, posts: 4 },
    topPosts: [
      { title: "3个AI工具让效率翻倍", date: "2026-06-26", views: 12300, likes: 856, comments: 142 },
      { title: "2026年最值得学的技术栈", date: "2026-06-25", views: 9800, likes: 720, comments: 98 },
      { title: "Cursor入门教程", date: "2026-06-24", views: 8500, likes: 610, comments: 75 },
    ],
  },
  {
    platform: "douyin", accountId: "acct_douyin_vlog", nickname: "老王的效率工具",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dy",
    followers: 28100, followersTrend: 32.0,
    thisWeek: { views: 89600, likes: 4120, comments: 580, shares: 1230, posts: 3 },
    lastWeek: { views: 67800, likes: 3120, comments: 420, shares: 980, posts: 2 },
    topPosts: [
      { title: "Cursor教程(上)", date: "2026-06-26", views: 25800, likes: 1420, comments: 210 },
      { title: "Cursor教程(下)", date: "2026-06-24", views: 18600, likes: 980, comments: 145 },
    ],
  },
  {
    platform: "wechat_mp", accountId: "acct_wechat_main", nickname: "SuperOne 官方号",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=wechat",
    followers: 4200, followersTrend: -8.3,
    thisWeek: { views: 12400, likes: 186, comments: 42, shares: 89, posts: 1 },
    lastWeek: { views: 13500, likes: 210, comments: 55, shares: 102, posts: 2 },
    topPosts: [
      { title: "AI一人公司生存指南", date: "2026-06-23", views: 4200, likes: 86, comments: 22 },
    ],
  },
];

export async function getDashboardMetrics(): Promise<PlatformMetrics[]> {
  await delay(400);
  return MOCK_METRICS;
}

// ==================== 灵感收藏 ====================

const MOCK_INSPIRATIONS: Inspiration[] = [
  {
    id: "insp_01", url: "https://www.xiaohongshu.com/explore/ref001", title: "我用AI自动生成小红书，一个月涨粉5000",
    platform: "xiaohongshu", author: "AI搞钱日记", savedAt: "2026-06-25 20:00:00",
    tags: ["AI", "涨粉", "自动化"],
    aiAnalysis: "爆款要素拆解：\n1. 标题含具体数字（5000）产生可信度\n2. 开头用个人故事建立共情\n3. 第三步给出可操作步骤（不是炫耀而是教程）\n4. 评论区主动引导互动\n\n可复用模式：个人结果 + 方法论 + 互动引导",
    takeaways: ["标题用数字背书", "教程型内容比炫耀型涨粉快", "结尾一定要引导评论"],
    thumbnailUrl: "https://via.placeholder.com/400x300/ff6b6b/fff?text=爆款1",
  },
  {
    id: "insp_02", url: "https://www.douyin.com/video/ref002", title: "30秒告诉你为什么Cursor是最好的AI编程工具",
    platform: "douyin", author: "程序员老王", savedAt: "2026-06-24 15:00:00",
    tags: ["Cursor", "编程", "短视频"],
    aiAnalysis: "短视频爆款公式：\n1. 前3秒用对比画面抓注意力\n2. 15秒演示一个完整功能\n3. 最后5秒总结 + 引导关注\n\n可复用：用Before/After对比开场的模式适用于所有工具教程。",
    takeaways: ["前3秒必须抓眼球", "一个视频只讲一个功能", "结尾要有CTA"],
    thumbnailUrl: "https://via.placeholder.com/400x300/4ecdc4/fff?text=爆款2",
  },
  {
    id: "insp_03", url: "https://www.xiaohongshu.com/explore/ref003", title: "一人公司月入3万，我的5个收入来源",
    platform: "xiaohongshu", author: "数字游民小林", savedAt: "2026-06-23 10:00:00",
    tags: ["一人公司", "收入", "商业模式"],
    aiAnalysis: "财务透明类内容的心理学：\n1. 公开收入建立信任\n2. 5个来源展示可持续性（不是运气）\n3. 每个来源给出投入产出比\n\n可复用：收入拆解 + 投入产出比是最高转化率的组合。",
    takeaways: ["收入透明建立信任", "多渠道=更可信", "给出投入产出比"],
    thumbnailUrl: "https://via.placeholder.com/400x300/45b7d1/fff?text=爆款3",
  },
  {
    id: "insp_04", url: "https://weibo.com/ref004", title: "2026上半年最值得关注的10个AI创业方向",
    platform: "weibo", author: "科技观察者", savedAt: "2026-06-22 09:00:00",
    tags: ["AI创业", "趋势", "2026"],
    aiAnalysis: "盘点类内容的传播逻辑：\n1. 数字（10个）给人信息密度感\n2. 每个方向配一句话核心逻辑\n3. 评论区变成讨论区\n\n可复用：盘点型标题 + 短评格式 = 高转发率。",
    takeaways: ["用数字提高信息密度感", "短评格式适合快速阅读", "留白给评论讨论"],
    thumbnailUrl: "https://via.placeholder.com/400x300/f19066/fff?text=爆款4",
  },
  {
    id: "insp_05", url: "https://www.xiaohongshu.com/explore/ref005", title: "Claude vs ChatGPT：写了100篇文章后的真实对比",
    platform: "xiaohongshu", author: "内容创作者阿杰", savedAt: "2026-06-20 18:00:00",
    tags: ["Claude", "ChatGPT", "对比评测"],
    aiAnalysis: "对比评测类内容的高转化公式：\n1. 用数量（100篇）建立权威\n2. 表格化对比让结论一目了然\n3. 给出明确的选型建议而非和稀泥\n\n可复用：大量实测 + 可视化对比 + 明确结论 = 高收藏率。",
    takeaways: ["实测数量建立权威", "表格化对比", "明确选型建议"],
    thumbnailUrl: "https://via.placeholder.com/400x300/6c5ce7/fff?text=爆款5",
  },
];

export async function getInspirations(params: {
  page: number;
  pageSize: number;
  tag?: string;
}): Promise<PageResult<Inspiration>> {
  await delay(300);
  let list = [...MOCK_INSPIRATIONS];
  const tag = params.tag;
  if (tag && tag !== "all") {
    list = list.filter((i) => i.tags.includes(tag));
  }
  list.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const start = (params.page - 1) * params.pageSize;
  return {
    records: list.slice(start, start + params.pageSize),
    total: list.length,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function deleteInspiration(id: string): Promise<void> {
  await delay(200);
  const idx = MOCK_INSPIRATIONS.findIndex((i) => i.id === id);
  if (idx >= 0) MOCK_INSPIRATIONS.splice(idx, 1);
}

// ==================== 智能复盘 ====================

const MOCK_REPORT: WeeklyReport = {
  id: "report_w26",
  weekLabel: "2026-W26",
  dateRange: "6月22日 - 6月28日",
  overview: {
    totalPosts: 8,
    totalViews: 89100,
    totalLikes: 5240,
    totalComments: 586,
    followerGrowth: 320,
  },
  platformBreakdown: [
    { platform: "xiaohongshu", nickname: "SuperOne 科技号", posts: 5, views: 45600, likes: 2850, topContent: "3个AI工具让效率翻倍" },
    { platform: "douyin", nickname: "老王的效率工具", posts: 2, views: 31100, likes: 2180, topContent: "Cursor教程（上）" },
    { platform: "wechat_mp", nickname: "SuperOne 官方号", posts: 1, views: 12400, likes: 210, topContent: "AI一人公司生存指南" },
  ],
  topContent: {
    title: "3个AI工具让效率翻倍",
    platform: "xiaohongshu",
    views: 12300,
    likes: 856,
    saveRate: "7.2%",
    insight: "工具对比+个人实测的数据组合让收藏率达到本周最高。用户在评论区大量追问具体操作细节，说明「实操教程」类内容有明确需求缺口。",
  },
  aiAnalysis: [
    "工具对比评测类内容本周收藏率均值 6.8%，比日常内容（3.2%）高出 1 倍。建议将此类内容频率从每周 1 篇提升到 2 篇。",
    "周末（周六/日）发布的笔记平均互动率比工作日高 38%，但本周六只发了 1 篇。建议把重点内容安排在周五晚或周六上午发布。",
    "#打工人必备 标签带来了 35% 的外部搜索流量。该标签在小红书搜索排名上升，建议本周继续使用并尝试 #效率提升 #独立开发者 两个关联标签。",
    "抖音短视频的完播率从上周的 42% 提升到了 56%，说明「教程型」内容比「观点型」更适合短视频平台。建议把小红书长文精简成 60 秒抖音脚本。",
  ],
  tagAnalysis: [
    { tag: "#AI工具", posts: 4, avgViews: 9800, externalTraffic: "28%" },
    { tag: "#打工人必备", posts: 3, avgViews: 11200, externalTraffic: "35%" },
    { tag: "#效率提升", posts: 5, avgViews: 8200, externalTraffic: "18%" },
    { tag: "#一人公司", posts: 2, avgViews: 7600, externalTraffic: "12%" },
  ],
  timingInsight: "本周数据表明：上午 8:00-9:00 发布的内容平均阅读量最高（1.1万），下午 18:00-20:00 的互动率最高（点赞/评论比 6.2%）。建议 AI 自动发布的时间窗口调整为：小红书 8:30，抖音 19:00。",
  suggestedTopics: [
    "实测 5 个 AI 工具的真实效率——用同一项任务对比（含计时数据）",
    "独立开发者如何用 AI 做客服——每天省下 2 小时（附对话模板）",
    "6月效率工具红黑榜：用了30天后我会留下哪些（长期测评）",
    "从 0 到 1 搭建一人公司的 AI 工具体系（完整架构图）",
    "为什么你的 AI 写不出爆款？Prompt 优化的 3 个层次",
  ],
  createdAt: "2026-06-29 08:00:00",
};

export async function getWeeklyReport(): Promise<WeeklyReport> {
  await delay(600);
  return MOCK_REPORT;
}

// ==================== Prompt 模板库 ====================

const MOCK_PROMPTS: PromptTemplate[] = [
  {
    id: "prompt_01",
    name: "小红书爆款笔记",
    description: "标准的小红书内容创作模板，含钩子开头+3点结构+互动引导",
    category: "content",
    personaId: "persona_writer_xhs",
    template: "你是资深小红书博主。根据以下选题生成一篇笔记：\n\n选题：{{topic}}\n语气：{{tone}}\n字数：{{wordCount}} 字左右\n\n要求：\n1. 开头用钩子抓住注意力\n2. 正文分 3 点，每点配 emoji\n3. 结尾引导互动（提问/投票）\n4. 标签：{{tags}}",
    variables: [
      { name: "topic", label: "选题", defaultValue: "AI工具推荐" },
      { name: "tone", label: "语气", defaultValue: "亲切口语化" },
      { name: "wordCount", label: "字数", defaultValue: "300" },
      { name: "tags", label: "标签", defaultValue: "#AI #效率" },
    ],
    usageCount: 23,
    createdAt: "2026-06-15 10:00:00",
  },
  {
    id: "prompt_02",
    name: "产品评测对比",
    description: "多产品对比评测模板，含表格化输出",
    category: "content",
    template: "请对以下 {{count}} 个产品进行对比评测：\n{{products}}\n\n评测维度：\n- 核心功能\n- 易用性\n- 价格\n- 适用人群\n\n用表格输出对比结果，最后给出选型建议。",
    variables: [
      { name: "count", label: "产品数量", defaultValue: "3" },
      { name: "products", label: "产品列表", defaultValue: "Claude, ChatGPT, Gemini" },
    ],
    usageCount: 15,
    createdAt: "2026-06-18 14:00:00",
  },
  {
    id: "prompt_03",
    name: "AI 事实核查",
    description: "对内容进行逐条事实核对和标注",
    category: "analysis",
    personaId: "persona_checker",
    template: "请对以下内容进行事实核查：\n\n内容：\n{{content}}\n\n核查要求：\n1. 逐条标记准确性\n2. 使用 🔴事实错误 / 🟡存疑 / 🟢准确的标注体系\n3. 对每个标记给出依据\n4. 最后给出是否建议发布的结论",
    variables: [
      { name: "content", label: "待核查内容", defaultValue: "" },
    ],
    usageCount: 8,
    createdAt: "2026-06-19 09:00:00",
  },
  {
    id: "prompt_04",
    name: "周报生成",
    description: "根据一周工作数据自动生成周报",
    category: "business",
    template: "请根据以下数据生成一份结构化的周报：\n\n原始数据：{{data}}\n\n结构：\n## 本周亮点\n## 关键数据\n## 遇到的问题\n## 下周计划\n## 需要的支持",
    variables: [
      { name: "data", label: "原始数据", defaultValue: "本周完成 5 项任务，3 项进行中" },
    ],
    usageCount: 12,
    createdAt: "2026-06-20 11:00:00",
  },
  {
    id: "prompt_05",
    name: "微信公众号长文",
    description: "公众号风格的深度长文模板",
    category: "content",
    template: "请以公众号深度文章的风格撰写一篇关于「{{topic}}」的文章。\n\n要求：\n- 字数 {{wordCount}} 左右\n- 开头用一个故事或数据引入\n- 分 3-4 个小标题展开\n- 每个观点配案例或数据支撑\n- 结尾给出可操作建议\n- 风格：{{tone}}",
    variables: [
      { name: "topic", label: "主题", defaultValue: "AI对独立开发者的影响" },
      { name: "wordCount", label: "字数", defaultValue: "1500" },
      { name: "tone", label: "风格", defaultValue: "专业但亲切" },
    ],
    usageCount: 6,
    createdAt: "2026-06-22 16:00:00",
  },
  {
    id: "prompt_06",
    name: "标题 A/B 变体",
    description: "为同一内容生成多个标题变体供选择",
    category: "content",
    personaId: "persona_title_optimizer",
    template: "请为以下内容生成 {{count}} 个不同风格的标题：\n\n内容摘要：{{summary}}\n\n风格要求：\n1. 一个数字驱动型（含具体数据）\n2. 一个好奇心驱动型（制造悬念）\n3. 一个结果驱动型（强调收益）\n4. 一个情绪驱动型（引发共鸣）\n\n每个标题后标注预估点击率（1-10）和理由。",
    variables: [
      { name: "count", label: "变体数量", defaultValue: "4" },
      { name: "summary", label: "内容摘要", defaultValue: "" },
    ],
    usageCount: 9,
    createdAt: "2026-06-23 10:00:00",
  },
];

export async function getPromptTemplates(): Promise<PromptTemplate[]> {
  await delay(300);
  return MOCK_PROMPTS;
}

export async function savePromptTemplate(
  data: Omit<PromptTemplate, "id" | "createdAt" | "usageCount"> & { id?: string }
): Promise<PromptTemplate> {
  await delay(400);
  if (data.id) {
    const idx = MOCK_PROMPTS.findIndex((p) => p.id === data.id);
    if (idx >= 0) { MOCK_PROMPTS[idx] = { ...MOCK_PROMPTS[idx], ...data, id: data.id } as PromptTemplate; return MOCK_PROMPTS[idx]; }
  }
  const tmpl: PromptTemplate = { ...data, id: `prompt_${Date.now()}`, usageCount: 0, createdAt: new Date().toISOString().replace("T", " ").slice(0, 19) };
  MOCK_PROMPTS.push(tmpl);
  return tmpl;
}

export async function deletePromptTemplate(id: string): Promise<void> {
  await delay(200);
  const idx = MOCK_PROMPTS.findIndex((p) => p.id === id);
  if (idx >= 0) MOCK_PROMPTS.splice(idx, 1);
}

// ==================== 用量统计 ====================

const MOCK_USAGE: UsageStats = {
  thisWeek: { totalCalls: 142, totalTokens: 385000, estimatedCost: 12.80, costTrend: 15 },
  byWorkflow: [
    { name: "小红书每日科普", calls: 89, percentage: 62, cost: 7.90 },
    { name: "客户跟进提醒", calls: 28, percentage: 20, cost: 2.50 },
    { name: "周一自动周报", calls: 15, percentage: 11, cost: 1.40 },
    { name: "手动测试", calls: 10, percentage: 7, cost: 1.00 },
  ],
  dailyTrend: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 5, 26 - 29 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { date: dateStr, calls: Math.round(10 + Math.random() * 30), tokens: Math.round(20000 + Math.random() * 80000) };
  }),
};

export async function getUsageStats(): Promise<UsageStats> {
  await delay(400);
  return MOCK_USAGE;
}

// ==================== Dify 集成 ====================

const MOCK_DIFY_CONNECTION: DifyConnection = {
  id: "dify_01", name: "SuperOne Dify 实例", baseUrl: "https://dify.superone.com/v1", apiKey: "app-****mock****",
  status: "connected", lastTestAt: "2026-06-28 14:00:00", createdAt: "2026-06-20 10:00:00",
};

const MOCK_DIFY_WORKFLOWS: DifyWorkflow[] = [
  {
    id: "dify_wf_01", name: "小红书内容生成流水线",
    description: "选题→写文→审核→输出，串联多个 LLM 节点的完整内容生产线",
    nodes: [
      { id: "start", type: "start", title: "开始" },
      { id: "llm_1", type: "llm", title: "AI 生成选题" },
      { id: "code_1", type: "code", title: "解析选题列表" },
      { id: "llm_2", type: "llm", title: "AI 写正文" },
      { id: "llm_3", type: "llm", title: "AI 审核" },
      { id: "template", type: "template", title: "格式化输出" },
      { id: "end", type: "end", title: "结束" },
    ],
    edges: [
      { from: "start", to: "llm_1" }, { from: "llm_1", to: "code_1" }, { from: "code_1", to: "llm_2" },
      { from: "llm_2", to: "llm_3" }, { from: "llm_3", to: "template", label: "通过" }, { from: "template", to: "end" },
    ],
    inputs: [{ name: "topic", type: "string", label: "选题方向", required: true }, { name: "style", type: "string", label: "风格" }, { name: "wordCount", type: "number", label: "字数" }],
    outputs: [{ name: "content", type: "string", label: "正文" }, { name: "title", type: "string", label: "标题" }, { name: "review_pass", type: "boolean", label: "审核通过" }],
    tags: ["内容创作", "小红书"], runCount: 156, createdAt: "2026-06-22 10:00:00",
  },
  {
    id: "dify_wf_02", name: "客户意图分析",
    description: "输入对话记录→LLM分析意图→输出分类和回复策略",
    nodes: [
      { id: "start", type: "start", title: "开始" },
      { id: "llm_1", type: "llm", title: "意图分类" },
      { id: "code_1", type: "code", title: "提取关键信息" },
      { id: "template", type: "template", title: "组装回复策略" },
      { id: "end", type: "end", title: "结束" },
    ],
    edges: [{ from: "start", to: "llm_1" }, { from: "llm_1", to: "code_1" }, { from: "code_1", to: "template" }, { from: "template", to: "end" }],
    inputs: [{ name: "conversation", type: "string", label: "对话文本", required: true }],
    outputs: [{ name: "intent", type: "string", label: "意图" }, { name: "strategy", type: "string", label: "回复策略" }, { name: "confidence", type: "number", label: "置信度" }],
    tags: ["客服", "分析"], runCount: 89, createdAt: "2026-06-24 14:00:00",
  },
  {
    id: "dify_wf_03", name: "合同条款提取",
    description: "上传合同→LLM解析→提取关键条款→标记风险点",
    nodes: [
      { id: "start", type: "start", title: "开始" },
      { id: "llm_1", type: "llm", title: "条款解析" },
      { id: "llm_2", type: "llm", title: "风险评估" },
      { id: "code_1", type: "code", title: "结构化输出" },
      { id: "end", type: "end", title: "结束" },
    ],
    edges: [{ from: "start", to: "llm_1" }, { from: "llm_1", to: "llm_2" }, { from: "llm_2", to: "code_1" }, { from: "code_1", to: "end" }],
    inputs: [{ name: "contract_text", type: "string", label: "合同文本", required: true }],
    outputs: [{ name: "clauses", type: "object", label: "条款摘要" }, { name: "risks", type: "array", label: "风险点" }, { name: "recommendations", type: "string", label: "修改建议" }],
    tags: ["法务", "分析"], runCount: 23, createdAt: "2026-06-26 09:00:00",
  },
  {
    id: "dify_wf_04", name: "数据报表生成器",
    description: "原始数据→Code节点清洗→LLM分析→模板渲染→Markdown报表",
    nodes: [
      { id: "start", type: "start", title: "开始" },
      { id: "code_1", type: "code", title: "数据清洗" },
      { id: "llm_1", type: "llm", title: "数据分析" },
      { id: "template", type: "template", title: "报表渲染" },
      { id: "end", type: "end", title: "结束" },
    ],
    edges: [{ from: "start", to: "code_1" }, { from: "code_1", to: "llm_1" }, { from: "llm_1", to: "template" }, { from: "template", to: "end" }],
    inputs: [{ name: "raw_data", type: "string", label: "原始数据", required: true }, { name: "report_type", type: "string", label: "报表类型" }],
    outputs: [{ name: "report", type: "string", label: "报表" }, { name: "summary", type: "string", label: "摘要" }],
    tags: ["数据分析", "报表"], runCount: 45, createdAt: "2026-06-25 16:00:00",
  },
];

export async function getDifyConnection(): Promise<DifyConnection | null> {
  await delay(300);
  return MOCK_DIFY_CONNECTION;
}

export async function saveDifyConnection(data: Partial<DifyConnection>): Promise<DifyConnection> {
  await delay(800);
  Object.assign(MOCK_DIFY_CONNECTION, data, { lastTestAt: new Date().toISOString().replace("T", " ").slice(0, 19) });
  if (data.apiKey || data.baseUrl) MOCK_DIFY_CONNECTION.status = "connected";
  return MOCK_DIFY_CONNECTION;
}

export async function testDifyConnection(): Promise<boolean> {
  await delay(1200);
  return true;
}

export async function getDifyWorkflows(): Promise<DifyWorkflow[]> {
  await delay(400);
  return MOCK_DIFY_WORKFLOWS;
}

export async function getDifyWorkflow(id: string): Promise<DifyWorkflow | null> {
  await delay(200);
  return MOCK_DIFY_WORKFLOWS.find((w) => w.id === id) || null;
}

// ==================== AI 工作台 ====================

const MOCK_SESSIONS: ChatSession[] = [
  { id: "chat_01", title: "分析上周小红书数据", lastMessage: "根据数据看板，'3个AI工具'话题表现最好，建议本周继续深挖这个方向", updatedAt: "2026-06-26 15:30:00", messageCount: 6 },
  { id: "chat_02", title: "客户张三的报价回复", lastMessage: "这是修改后的回复，语气更柔和，同时保持了价格底线", updatedAt: "2026-06-26 10:00:00", messageCount: 4 },
  { id: "chat_03", title: "新项目 SWAT 分析", lastMessage: "综合分析，建议先做 MVP 验证核心假设，预计 2 周可出结果", updatedAt: "2026-06-25 18:00:00", messageCount: 8 },
  { id: "chat_04", title: "合同条款风险审查", lastMessage: "第 5.2 条的排他性条款风险最高，建议修改为有限排他", updatedAt: "2026-06-24 11:00:00", messageCount: 5 },
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  chat_01: [
    { id: "m1", role: "user", content: "帮我分析一下上周小红书的数据，看看哪个话题表现最好", timestamp: "2026-06-26 15:28:00", personaId: "persona_writer_xhs", personaName: "小红书写手" },
    { id: "m2", role: "assistant", content: "好的，让我查看上周的数据看板...\n\n根据数据分析：\n\n🏆 表现最好的话题是**「AI 工具对比」**\n- 阅读 1.2w，收藏率 7.2%\n- 比平均值高出 125%\n\n📈 其次是**「效率工具教程」**\n- 阅读 9.8k，互动率 6.8%\n\n💡 建议本周继续深挖「工具对比」方向，可以考虑：\n- Claude vs ChatGPT 写文案实测\n- Cursor vs GitHub Copilot 编码效率对比\n- Notion AI vs 飞书智能伙伴功能对比", timestamp: "2026-06-26 15:28:15", contextRefs: [{ type: "dashboard", id: "dashboard", label: "上周数据看板" }] },
    { id: "m3", role: "user", content: "工具对比确实效果好。帮我想 3 个这周可以做的对比选题", timestamp: "2026-06-26 15:29:00", personaId: "persona_writer_xhs", personaName: "小红书写手" },
    { id: "m4", role: "assistant", content: "基于上周数据，推荐这 3 个对比选题：\n\n1. **「写了 100 篇小红书后，Claude vs ChatGPT 谁更懂爆款」**\n   - 预估阅读 1.5w+，收藏率有望破 8%\n   - 用真实数据说话，天然自带传播点\n\n2. **「Cursor vs GitHub Copilot：独立开发者的真实体验」**\n   - 预估阅读 1.2w+，程序员群体分享意愿强\n   - 可以同步发抖音做短视频版\n\n3. **「Notion AI vs 飞书：一人公司选哪个更划算」**\n   - 预估阅读 1w+，覆盖职场人群\n   - 价格对比表格自带收藏价值", timestamp: "2026-06-26 15:29:30" },
    { id: "m5", role: "user", content: "第一个选题很好，帮我写一版初稿", timestamp: "2026-06-26 15:30:00", personaId: "persona_writer_xhs", personaName: "小红书写手" },
    { id: "m6", role: "assistant", content: "我会用「小红书爆款笔记」Prompt 模板来写...\n\n🔥 写了100篇小红书后，我发现Claude才是真·爆款制造机\n\n先说结论：用 Claude 写的小红书笔记，平均互动率比 ChatGPT 高 40%。\n\n这不是感觉，是 100 篇笔记的数据对比👇\n\n1️⃣ 标题方面\nClaude 更懂中文网感，生成的标题自带钩子\nChatGPT 偏直译，少了那种「忍不住点进去」的感觉\n\n2️⃣ 排版方面\nClaude 自动分段 + emoji，小红书味十足\nChatGPT 需要手动调整，多花 15 分钟\n\n3️⃣ 数据说话\n我用同一批选题同时生成，结果是：\nClaude 版平均收藏率 6.8% vs ChatGPT 版 4.2%\n\n💡 但 ChatGPT 也有优势：对英文内容的理解更准\n\n你们用哪个写笔记？评论区告诉我 👇\n\n#AI工具 #内容创作 #小红书运营 #效率提升 #2026趋势", timestamp: "2026-06-26 15:30:20" },
  ],
  chat_02: [
    { id: "m7", role: "user", content: "客户张三说我们的报价太高了，他们的预算是 8 万。我们报价 12 万。帮我拟一段回复，既要保持价格底线，又不能失去客户。", timestamp: "2026-06-26 10:00:00" },
    { id: "m8", role: "assistant", content: "我查看了知识库中的定价策略和客户 FAQ，帮你拟了回复：\n\n---\n张总您好，\n\n感谢您的坦诚反馈。12 万的报价是基于以下交付范围：\n- [具体的功能模块清单]\n- [后续支持和维护]\n\n我理解预算压力。如果我们做一些调整——比如第一期只做核心模块，二期再扩展——成本可以控制在 9 万左右。\n\n或者您方便的话，我们约个 15 分钟线上沟通，我根据您的实际需求重新评估一个更精准的方案？\n\n期待您的回复。\n---\n\n这样既给了对方台阶（不是拒绝，是提供方案），又没降底线（9 万仍然高于对方 8 万预算，有谈判空间）。需要调整吗？", timestamp: "2026-06-26 10:00:20", contextRefs: [{ type: "knowledge", id: "kb_pricing", label: "定价策略" }, { type: "knowledge", id: "kb_faq", label: "客户FAQ" }] },
  ],
};

export async function getChatSessions(): Promise<ChatSession[]> {
  await delay(300);
  return MOCK_SESSIONS;
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  await delay(300);
  return MOCK_MESSAGES[sessionId] || [];
}

export async function sendChatMessage(
  sessionId: string,
  content: string,
  personaId?: string,
  contextRefs?: { type: string; id: string; label: string }[]
): Promise<ChatMessage> {
  await delay(1200 + Math.random() * 1500);
  const reply: ChatMessage = {
    id: `m_${Date.now()}`,
    role: "assistant",
    content: `🤖 模拟回复：\n\n已收到你的消息「${content.slice(0, 40)}...」\n\n${
      personaId ? `（以 ${personaId} 身份回复）\n\n` : ""
    }这是一个 mock 回复。正式接入 LLM API 后，这里会根据智能体角色、Prompt 模板和挂载的上下文生成真实回复。${
      contextRefs?.length ? `\n\n当前已挂载上下文：${contextRefs.map((c) => c.label).join("、")}` : ""
    }`,
    timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
    personaId,
    contextRefs,
  };
  if (MOCK_MESSAGES[sessionId]) {
    MOCK_MESSAGES[sessionId].push(reply);
  }
  return reply;
}

// ==================== 模型配置 ====================

const MOCK_MODEL_CONFIG: ModelConfig = {
  defaultModel: "claude-opus",
  taskRouting: [
    { task: "内容创作", model: "claude-sonnet" },
    { task: "代码审查", model: "claude-opus" },
    { task: "数据分析", model: "claude-haiku" },
    { task: "客户沟通", model: "claude-sonnet" },
  ],
  budget: { monthlyLimit: 200, alertThreshold: 80, exceedAction: "switch_to_cheaper" },
  fallback: { enabled: true, fallbackModel: "claude-haiku" },
};

const MOCK_MODEL_USAGE: ModelUsage[] = [
  { model: "claude-opus", label: "Claude Opus", calls: 45, tokens: 152000, cost: 48.20 },
  { model: "claude-sonnet", label: "Claude Sonnet", calls: 72, tokens: 195000, cost: 32.50 },
  { model: "claude-haiku", label: "Claude Haiku", calls: 25, tokens: 38000, cost: 8.10 },
];

export async function getModelConfig(): Promise<ModelConfig> {
  await delay(300);
  return MOCK_MODEL_CONFIG;
}

export async function saveModelConfig(config: ModelConfig): Promise<ModelConfig> {
  await delay(400);
  Object.assign(MOCK_MODEL_CONFIG, config);
  return MOCK_MODEL_CONFIG;
}

export async function getModelUsage(): Promise<ModelUsage[]> {
  await delay(300);
  return MOCK_MODEL_USAGE;
}
