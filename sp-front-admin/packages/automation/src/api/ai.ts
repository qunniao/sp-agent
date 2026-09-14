/**
 * AI 编排 API 层（mock）
 */
import type { AiComposeResponse, AutomationDef } from "../types";

const MOCK_DELAY = 1500; // AI 生成给更长延迟模拟
function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 自然语言 → 工作流定义
 */
export async function aiComposeWorkflow(
  description: string
): Promise<AiComposeResponse> {
  await delay();

  // 关键词匹配 → 返回预设模板变体
  const lower = description.toLowerCase();

  if (lower.includes("小红书") || lower.includes("红书") || lower.includes("xhs")) {
    return {
      def: {
        name: "小红书自动发布",
        description: `根据描述自动生成：${description.slice(0, 30)}...`,
        icon: "SendOutlined",
        category: "content",
        trigger: { type: "schedule", cron: "0 9 * * *", label: "每天上午 9:00" },
        steps: [
          {
            id: "s1",
            type: "ai.chat",
            title: "AI 选题",
            enabled: true,
            config: { prompt: `根据"${description}"生成3个爆款选题`, outputKey: "topics" },
          },
          {
            id: "s2",
            type: "ai.chat",
            title: "AI 写正文",
            enabled: true,
            config: { prompt: "把选题展开写成300字笔记，口语化+emoji", outputKey: "content" },
          },
          {
            id: "s3",
            type: "condition",
            title: "发布确认",
            enabled: true,
            config: {
              expression: "需人工审核",
              branches: [
                { label: "审核后发布", target: "next" },
                { label: "直接发布", target: "next" },
              ],
            },
          },
          {
            id: "s4",
            type: "platform.post",
            title: "发布到小红书",
            enabled: true,
            config: { accountId: "acct_xhs_tech", content: "{{step.s2.output}}", tags: ["#科技", "#效率"] },
          },
        ],
        enabled: false,
      },
      explanation: `我为你生成了一个小红书内容自动发布流程：\n每天 9:00 自动选题 → AI 写文 → 可选的审核 → 发布。你可以调整 prompt 让风格更贴合你的账号定位，也可以加上 AI 生图步骤做封面配图。`,
    };
  }

  if (lower.includes("周报") || lower.includes("每周")) {
    return {
      def: {
        name: "每周自动周报",
        description: `根据描述自动生成：${description.slice(0, 30)}...`,
        icon: "FileTextOutlined",
        category: "business",
        trigger: { type: "schedule", cron: "0 9 * * 1", label: "每周一上午 9:00" },
        steps: [
          {
            id: "s1",
            type: "http.request",
            title: "拉取本周数据",
            enabled: true,
            config: { url: "https://api.example.com/data", method: "GET", outputKey: "data" },
          },
          {
            id: "s2",
            type: "ai.chat",
            title: "AI 生成周报",
            enabled: true,
            config: { prompt: "分析数据生成周报", outputKey: "report" },
          },
          {
            id: "s3",
            type: "notification",
            title: "发送邮件",
            enabled: true,
            config: { channel: "email", title: "周报", content: "{{step.s2.output}}" },
          },
        ],
        enabled: false,
      },
      explanation: "生成每周数据采集 → AI 分析 → 邮件发送的标准周报流程。你需要把第一步的 API 地址替换成实际的数据源。",
    };
  }

  // 通用兜底
  return {
    def: {
      name: "自定义工作流",
      description,
      icon: "ThunderboltOutlined",
      category: "custom",
      trigger: { type: "manual", label: "手动触发" },
      steps: [
        {
          id: "s1",
          type: "ai.chat",
          title: "AI 处理",
          enabled: true,
          config: { prompt: description, outputKey: "result" },
        },
        {
          id: "s2",
          type: "notification",
          title: "通知我",
          enabled: true,
          config: { channel: "inapp", title: "任务完成", content: "{{step.s1.output}}" },
        },
      ],
      enabled: false,
    },
    explanation: "根据你的描述，我拆解为 2 步：AI 处理 → 通知你。后续可以添加更多步骤（生图、发平台、定时器等）。",
  };
}
