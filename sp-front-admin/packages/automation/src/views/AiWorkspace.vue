<template>
  <div class="workspace">
    <!-- 左侧会话列表 -->
    <div class="workspace-sidebar">
      <div class="sidebar-head">
        <a-button type="primary" block @click="newChat"><PlusOutlined /> 新对话</a-button>
      </div>
      <div class="sidebar-search" v-if="sessions.length > 2">
        <a-input v-model:value="sessionSearch" size="small" placeholder="搜索对话..." allow-clear />
      </div>
      <div class="sidebar-list">
        <div
          v-for="s in filteredSessions"
          :key="s.id"
          :class="['session-item', { 'session-item--active': s.id === activeSession }]"
          @click="switchSession(s.id)"
        >
          <div class="session-item__title">{{ s.title }}</div>
          <div class="session-item__meta">
            <span>{{ s.messageCount }} 条</span>
            <span>{{ s.updatedAt.slice(5, 16) }}</span>
            <a-popconfirm title="删除此对话？" @confirm="deleteSession(s.id)" @click.stop>
              <a-button type="link" size="small" danger style="padding:0;font-size:11px">删除</a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间对话区 -->
    <div class="workspace-main">
      <div class="chat-area" v-if="activeSession">
        <!-- 顶栏 -->
        <div class="chat-topbar">
          <a-select v-model:value="selectedPersona" placeholder="通用 AI" allow-clear style="width:180px" size="small">
            <a-select-option v-for="p in personas" :key="p.id" :value="p.id">{{ p.avatar }} {{ p.name }}</a-select-option>
          </a-select>
          <a-space :size="4">
            <a-button size="small" @click="showContextPanel = !showContextPanel">📎 上下文 {{ contextRefs.length ? `(${contextRefs.length})` : '' }}</a-button>
            <a-button size="small" @click="handleExportAsWorkflow" :disabled="messages.length === 0">🔄 转工作流</a-button>
          </a-space>
        </div>

        <!-- 消息列表 -->
        <div class="chat-messages" ref="msgContainer">
          <!-- 空态推荐 -->
          <div v-if="messages.length === 0 && !sending" class="chat-empty">
            <div class="chat-empty__icon">🤖</div>
            <h3>SuperOne AI 工作台</h3>
            <p>选择一个智能体，或用自然语言直接提问</p>
            <div class="suggested-prompts">
              <div class="suggested-prompt" v-for="sp in suggestedPrompts" :key="sp" @click="sendText(sp)">
                {{ sp }}
              </div>
            </div>
          </div>

          <div v-for="(msg, i) in messages" :key="msg.id" :class="['chat-msg', `chat-msg--${msg.role}`]">
            <div class="chat-msg__avatar">
              <span v-if="msg.role === 'assistant'">🤖</span>
              <span v-else>👤</span>
            </div>
            <div class="chat-msg__body">
              <div class="chat-msg__meta">
                <span v-if="msg.personaName" class="chat-msg__persona">{{ msg.personaName }}</span>
                <span class="chat-msg__time">{{ msg.timestamp.slice(11, 16) }}</span>
              </div>
              <!-- Markdown 渲染 -->
              <div :class="['chat-msg__content', { 'chat-msg__content--streaming': msg === streamingMsg }]" v-html="renderMd(msg.content)"></div>
              <div class="chat-msg__refs" v-if="msg.contextRefs?.length">
                <a-tag v-for="c in msg.contextRefs" :key="c.id" size="small" color="purple">📎 {{ c.label }}</a-tag>
              </div>
              <div class="chat-msg__actions" v-if="msg.role === 'assistant'">
                <a-button type="link" size="small" @click="copyText(msg.content)"><CopyOutlined /> 复制</a-button>
                <a-button type="link" size="small" @click="regenerate(i)"><RedoOutlined /> 重新生成</a-button>
              </div>
            </div>
          </div>
          <!-- 流式输出中 -->
          <div v-if="sending && !streamingMsg" class="chat-msg chat-msg--assistant">
            <div class="chat-msg__avatar">🤖</div>
            <div class="chat-msg__body"><a-spin size="small" /> AI 正在思考...</div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-input">
          <!-- 斜杠命令下拉 -->
          <div class="slash-menu" v-if="showSlash">
            <div v-for="cmd in filteredCommands" :key="cmd.key" class="slash-item" @click="selectCommand(cmd)">
              <span class="slash-item__key">/{{ cmd.key }}</span>
              <span class="slash-item__desc">{{ cmd.desc }}</span>
            </div>
          </div>
          <a-textarea
            ref="inputRef"
            v-model:value="inputText"
            :rows="2"
            placeholder="输入消息 Enter 发送，Shift+Enter 换行，输入 / 查看命令"
            @pressEnter="handleSend"
            @input="onInput"
            @keydown="onKeydown"
            :disabled="sending"
          />
          <div class="chat-input__hint">
            <span v-for="cmd in quickCommands" :key="cmd.key" class="hint-cmd" @click="selectCommand(cmd)">/{{ cmd.key }}</span>
          </div>
        </div>
      </div>

      <a-empty v-else description="选择或新建一个对话" style="margin-top:120px" />
    </div>

    <!-- 右侧上下文面板 -->
    <div class="workspace-context" v-if="showContextPanel">
      <div class="context-head">
        <span>📎 上下文</span>
        <a-button type="link" size="small" @click="showContextPanel = false">关闭</a-button>
      </div>
      <a-card size="small" title="知识库" style="margin-bottom:8px">
        <a-checkbox v-for="d in knowledgeDocs" :key="d.id" :checked="hasCtx('knowledge', d.id)" @change="toggleCtx('knowledge', d.id, d.title)" style="display:block;margin-bottom:4px">
          {{ d.title }}
        </a-checkbox>
      </a-card>
      <a-card size="small" title="数据" style="margin-bottom:8px">
        <a-checkbox :checked="hasCtx('dashboard', 'dashboard')" @change="toggleCtx('dashboard', 'dashboard', '上周数据看板')" style="display:block">上周数据看板</a-checkbox>
      </a-card>
      <a-card size="small" title="素材库">
        <a-checkbox :checked="hasCtx('asset', 'ast_01')" @change="toggleCtx('asset', 'ast_01', 'AI效率工具封面图')" style="display:block;margin-bottom:4px">AI效率工具封面图</a-checkbox>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { PlusOutlined, CopyOutlined, RedoOutlined } from "@ant-design/icons-vue";
import { getChatSessions, getChatMessages, sendChatMessage, getPersonas, getKnowledgeDocs } from "../api/automation";
import type { ChatSession, ChatMessage, AgentPersona, KnowledgeDoc } from "../types";

const router = useRouter();
const sessions = ref<ChatSession[]>([]);
const messages = ref<ChatMessage[]>([]);
const personas = ref<AgentPersona[]>([]);
const knowledgeDocs = ref<KnowledgeDoc[]>([]);
const activeSession = ref<string | null>(null);
const selectedPersona = ref<string | undefined>(undefined);
const inputText = ref("");
const sending = ref(false);
const showContextPanel = ref(false);
const contextRefs = ref<{ type: string; id: string; label: string }[]>([]);
const msgContainer = ref<HTMLElement | null>(null);
const inputRef = ref<any>(null);
const sessionSearch = ref("");
const showSlash = ref(false);
const streamingMsg = ref<ChatMessage | null>(null);
const streamingContent = ref("");

// 斜杠命令
const commands = [
  { key: "analyze", desc: "分析数据或内容", placeholder: "分析上周小红书数据表现" },
  { key: "write", desc: "创作内容", placeholder: "写一篇关于AI工具的小红书笔记" },
  { key: "review", desc: "审查/检查内容", placeholder: "审查这个合同条款的风险" },
  { key: "summarize", desc: "总结提炼", placeholder: "总结今日本周的关键事项" },
  { key: "reply", desc: "回复消息/邮件", placeholder: "帮客户张三回复报价邮件" },
  { key: "ideate", desc: "头脑风暴/选题", placeholder: "帮我想5个这周的选题方向" },
];
const quickCommands = commands.slice(0, 4);
const filteredCommands = computed(() => {
  const q = inputText.value.replace(/^\//, "").toLowerCase();
  if (!q) return commands;
  return commands.filter((c) => c.key.includes(q));
});

// 推荐提示
const suggestedPrompts = [
  "分析上周小红书数据，哪个话题表现最好？",
  "帮我想 5 个这周的内容选题",
  "客户说报价太贵，帮我拟一段得体的回复",
  "帮我做一个新产品思路的 SWOT 分析",
];

const filteredSessions = computed(() => {
  if (!sessionSearch.value) return sessions.value;
  const q = sessionSearch.value.toLowerCase();
  return sessions.value.filter((s) => s.title.toLowerCase().includes(q));
});

// === Markdown 简易渲染 ===
function renderMd(text: string): string {
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // 代码块 ```
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="md-code"><code>$2</code></pre>')
    // 行内代码 `code`
    .replace(/`([^`]+)`/g, '<code class="md-inline">$1</code>')
    // 粗体 **bold**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 斜体 *italic*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 标题 ### / ## / #
    .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    // 无序列表 - item
    .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
    // 有序列表 1. item
    .replace(/^\d+\. (.+)$/gm, '<li class="md-li">$1</li>')
    // 分隔线 ---
    .replace(/^---$/gm, '<hr class="md-hr">')
    // emoji 短码
    .replace(/:check:/g, '✅').replace(/:x:/g, '❌').replace(/:warning:/g, '⚠️')
    // 换行
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
  return html;
}

// === 流式输出 ===
async function streamReply(content: string): Promise<void> {
  const msg: ChatMessage = {
    id: `m_${Date.now()}`,
    role: "assistant",
    content: "",
    timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
  };
  streamingMsg.value = msg;
  streamingContent.value = "";
  const chars = content.split("");
  for (let i = 0; i < chars.length; i++) {
    streamingContent.value += chars[i];
    msg.content = streamingContent.value;
    await new Promise((r) => setTimeout(r, 15 + Math.random() * 20));
    scrollBottom();
  }
  messages.value.push({ ...msg, content });
  streamingMsg.value = null;
  streamingContent.value = "";
}

// === 操作 ===
function hasCtx(type: string, id: string): boolean {
  return contextRefs.value.some((c) => c.type === type && c.id === id);
}
function toggleCtx(type: string, id: string, label: string): void {
  if (hasCtx(type, id)) contextRefs.value = contextRefs.value.filter((c) => !(c.type === type && c.id === id));
  else contextRefs.value.push({ type, id, label });
}

function onInput(): void {
  showSlash.value = inputText.value.startsWith("/");
}
function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") showSlash.value = false;
}
function selectCommand(cmd: typeof commands[0]): void {
  inputText.value = `/${cmd.key} `;
  showSlash.value = false;
  nextTick(() => inputRef.value?.focus());
}
function sendText(text: string): void {
  inputText.value = text;
  handleSend({ shiftKey: false, preventDefault: () => {} } as KeyboardEvent);
}

async function load(): Promise<void> {
  [sessions.value, personas.value, knowledgeDocs.value] = await Promise.all([
    getChatSessions(), getPersonas(), getKnowledgeDocs(),
  ]);
  if (sessions.value.length > 0) switchSession(sessions.value[0].id);
}
async function switchSession(id: string): Promise<void> {
  activeSession.value = id;
  messages.value = await getChatMessages(id);
  scrollBottom();
}
function newChat(): void {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const session: ChatSession = { id: `chat_${Date.now()}`, title: "新对话", lastMessage: "", updatedAt: now, messageCount: 0 };
  sessions.value.unshift(session);
  activeSession.value = session.id;
  messages.value = [];
  contextRefs.value = [];
  selectedPersona.value = undefined;
}
function deleteSession(id: string): void {
  sessions.value = sessions.value.filter((s) => s.id !== id);
  if (activeSession.value === id) {
    activeSession.value = sessions.value[0]?.id || null;
    messages.value = [];
  }
}

async function handleSend(e: KeyboardEvent): Promise<void> {
  if (e.shiftKey) return;
  e.preventDefault();
  const text = inputText.value.trim();
  if (!text || !activeSession.value || sending.value) return;
  showSlash.value = false;
  const userMsg: ChatMessage = {
    id: `mu_${Date.now()}`, role: "user", content: text,
    timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
    personaId: selectedPersona.value,
  };
  messages.value.push(userMsg);
  inputText.value = "";
  sending.value = true;
  scrollBottom();
  try {
    const reply = await sendChatMessage(activeSession.value, text, selectedPersona.value, contextRefs.value);
    await streamReply(reply.content);
    const s = sessions.value.find((x) => x.id === activeSession.value);
    if (s) {
      s.title = s.title === "新对话" ? text.slice(0, 20) : s.title;
      s.lastMessage = reply.content.slice(0, 60);
      s.messageCount = messages.value.length;
      s.updatedAt = reply.timestamp;
    }
  } catch { message.error("发送失败"); }
  finally { sending.value = false; }
}

async function regenerate(index: number): Promise<void> {
  const userMsg = messages.value[index - 1];
  if (!userMsg || userMsg.role !== "user") return;
  messages.value.splice(index + 1); // remove from AI reply onward
  sending.value = true;
  try {
    const reply = await sendChatMessage(activeSession.value!, userMsg.content, selectedPersona.value, contextRefs.value);
    await streamReply(reply.content);
  } catch { message.error("重新生成失败"); }
  finally { sending.value = false; }
}

function scrollBottom(): void {
  nextTick(() => {
    if (msgContainer.value) msgContainer.value.scrollTop = msgContainer.value.scrollHeight;
  });
}
function copyText(text: string): void {
  navigator.clipboard?.writeText(text).then(() => message.success("已复制"));
}
function handleExportAsWorkflow(): void {
  router.push("/automation/editor");
  message.info("对话内容已转为工作流（mock）");
}

onMounted(load);
</script>

<style scoped>
.workspace { display: flex; height: calc(100vh - 120px); gap: 0; }
.workspace-sidebar { width: 260px; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; background: #fafafa; }
.sidebar-head { padding: 12px; }
.sidebar-search { padding: 0 12px 8px; }
.sidebar-list { flex: 1; overflow-y: auto; }
.session-item { padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.15s; }
.session-item:hover { background: #f0f5ff; }
.session-item--active { background: #e6f7ff; border-left: 3px solid #1677ff; }
.session-item__title { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.session-item__meta { font-size: 11px; color: #bbb; display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }

.workspace-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.chat-area { flex: 1; display: flex; flex-direction: column; }
.chat-topbar { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; border-bottom: 1px solid #f0f0f0; background: #fff; flex-shrink: 0; }
.chat-messages { flex: 1; overflow-y: auto; padding: 16px; }

/* 空态 */
.chat-empty { text-align: center; padding: 40px 20px; }
.chat-empty__icon { font-size: 48px; margin-bottom: 12px; }
.chat-empty h3 { font-size: 18px; margin-bottom: 4px; }
.chat-empty p { color: #999; font-size: 13px; margin-bottom: 20px; }
.suggested-prompts { display: flex; flex-direction: column; gap: 8px; max-width: 420px; margin: 0 auto; }
.suggested-prompt {
  padding: 10px 14px; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer;
  font-size: 13px; color: #555; text-align: left; transition: border-color 0.15s, background 0.15s;
}
.suggested-prompt:hover { border-color: #1677ff; background: #f0f5ff; }

/* 消息 */
.chat-msg { display: flex; gap: 10px; margin-bottom: 18px; }
.chat-msg--user { flex-direction: row-reverse; }
.chat-msg__avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; background: #f5f5f5; flex-shrink: 0; }
.chat-msg__body { max-width: 78%; }
.chat-msg--user .chat-msg__body { text-align: right; }
.chat-msg__meta { font-size: 11px; color: #999; margin-bottom: 2px; display: flex; gap: 8px; }
.chat-msg--user .chat-msg__meta { justify-content: flex-end; }
.chat-msg__content {
  font-size: 13px; line-height: 1.75; padding: 10px 14px; border-radius: 10px;
  background: #f5f5f5; display: inline-block; text-align: left; word-break: break-word;
}
.chat-msg--user .chat-msg__content { background: #1677ff; color: #fff; }
.chat-msg__content--streaming { border-right: 2px solid #1677ff; animation: blink 0.8s infinite; }

/* Markdown 样式 */
.chat-msg__content :deep(.md-h2) { font-size: 16px; font-weight: 700; margin: 8px 0 4px; }
.chat-msg__content :deep(.md-h3) { font-size: 14px; font-weight: 700; margin: 6px 0 4px; }
.chat-msg__content :deep(.md-h4) { font-size: 13px; font-weight: 600; margin: 4px 0 2px; }
.chat-msg__content :deep(.md-li) { margin-left: 16px; display: list-item; }
.chat-msg__content :deep(.md-code) { background: #1e1e1e; color: #d4d4d4; padding: 8px 12px; border-radius: 6px; font-size: 12px; overflow-x: auto; margin: 6px 0; font-family: "SF Mono", Menlo, monospace; }
.chat-msg__content :deep(.md-inline) { background: #e8e8e8; padding: 1px 5px; border-radius: 3px; font-size: 12px; font-family: "SF Mono", Menlo, monospace; }
.chat-msg__content :deep(.md-hr) { border: none; border-top: 1px solid #e8e8e8; margin: 10px 0; }
.chat-msg__content :deep(strong) { font-weight: 600; }
.chat-msg--user .chat-msg__content :deep(.md-code) { background: rgba(255,255,255,0.2); color: #fff; }
.chat-msg--user .chat-msg__content :deep(.md-inline) { background: rgba(255,255,255,0.2); }

.chat-msg__refs { margin-top: 4px; }
.chat-msg__actions { margin-top: 4px; }

/* 输入区 */
.chat-input { padding: 12px 16px; border-top: 1px solid #f0f0f0; position: relative; flex-shrink: 0; }
.chat-input__hint { margin-top: 6px; display: flex; gap: 8px; }
.hint-cmd { font-size: 11px; color: #999; cursor: pointer; padding: 1px 6px; border-radius: 4px; background: #f5f5f5; transition: color 0.15s; }
.hint-cmd:hover { color: #1677ff; }

/* 斜杠命令 */
.slash-menu {
  position: absolute; bottom: calc(100% + 4px); left: 16px; right: 16px;
  background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  max-height: 200px; overflow-y: auto; z-index: 10;
}
.slash-item { padding: 8px 14px; cursor: pointer; display: flex; gap: 12px; align-items: center; transition: background 0.1s; }
.slash-item:hover { background: #f0f5ff; }
.slash-item__key { font-weight: 600; font-size: 13px; color: #722ed1; min-width: 80px; }
.slash-item__desc { font-size: 12px; color: #999; }

.workspace-context { width: 240px; border-left: 1px solid #f0f0f0; padding: 12px; overflow-y: auto; background: #fafafa; flex-shrink: 0; }
.context-head { display: flex; justify-content: space-between; align-items: center; font-weight: 600; margin-bottom: 8px; }

@keyframes blink { 50% { border-color: transparent; } }
</style>
