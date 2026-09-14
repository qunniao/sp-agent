<template>
  <div class="page-container">
    <a-page-header title="智能体库" sub-title="定义可复用的 AI 角色，在工作流和对话中直接调用" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-button type="primary" @click="openEditor(null)"><PlusOutlined /> 创建智能体</a-button>
      </template>
    </a-page-header>

    <a-card :bordered="false" class="filter-bar">
      <a-space>
        <a-select v-model:value="filterGroup" style="width:130px">
          <a-select-option value="all">全部分类</a-select-option>
          <a-select-option value="content">✍️ 内容创作</a-select-option>
          <a-select-option value="review">🔍 审查分析</a-select-option>
          <a-select-option value="business">💼 商业策略</a-select-option>
          <a-select-option value="tech">💻 技术</a-select-option>
        </a-select>
        <span style="font-size:12px;color:#999">共 {{ personas.length }} 个智能体 · 本周调用 {{ totalUsage }} 次</span>
      </a-space>
    </a-card>

    <a-spin :spinning="loading">
      <div class="persona-grid" v-if="filteredPersonas.length > 0">
        <a-card v-for="p in filteredPersonas" :key="p.id" :bordered="false" hoverable class="persona-card">
          <template #extra>
            <a-dropdown :trigger="['click']">
              <a-button type="text" size="small"><EllipsisOutlined /></a-button>
              <template #overlay>
                <a-menu @click="(e: any) => handleMenu(e, p)">
                  <a-menu-item key="edit">编辑</a-menu-item>
                  <a-menu-item key="duplicate">复制</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>

          <div class="persona-card__head">
            <span class="persona-avatar">{{ p.avatar }}</span>
            <div>
              <div class="persona-name">{{ p.name }}</div>
              <div class="persona-role">{{ p.role }}</div>
            </div>
          </div>

          <div class="persona-tags">
            <a-tag v-for="tag in p.expertise" :key="tag" color="purple" size="small">{{ tag }}</a-tag>
          </div>

          <div class="persona-prompt-preview">
            {{ p.systemPrompt.slice(0, 100) }}{{ p.systemPrompt.length > 100 ? '...' : '' }}
          </div>

          <div class="persona-linked" v-if="getLinkedPrompts(p.id).length > 0">
            <div class="linked-title">📋 关联 Prompt 模板:</div>
            <a-tag v-for="lp in getLinkedPrompts(p.id)" :key="lp" size="small" color="blue">{{ lp }}</a-tag>
          </div>

          <template #actions>
            <span @click="openTestChat(p)"><CommentOutlined /> 测试</span>
            <span>📊 调用 {{ getUsage(p.id) }} 次</span>
            <span @click="openEditor(p)"><EditOutlined /> 编辑</span>
          </template>
        </a-card>
      </div>

      <a-empty v-else description="还没有智能体">
        <a-button type="primary" @click="openEditor(null)">创建第一个智能体</a-button>
      </a-empty>
    </a-spin>

    <!-- 编辑 Drawer -->
    <a-drawer :title="editingId ? '编辑智能体' : '创建智能体'" :open="drawerVisible" width="520px" @close="drawerVisible = false">
      <a-form layout="vertical">
        <a-row :gutter="12">
          <a-col :span="4">
            <a-form-item label="头像"><a-input v-model:value="form.avatar" placeholder="✍️" :maxlength="2" style="text-align:center;font-size:24px" /></a-form-item>
          </a-col>
          <a-col :span="10">
            <a-form-item label="名称" required><a-input v-model:value="form.name" placeholder="如：小红书写手" :maxlength="12" /></a-form-item>
          </a-col>
          <a-col :span="10">
            <a-form-item label="身份描述" required><a-input v-model:value="form.role" placeholder="如：资深小红书博主" :maxlength="20" /></a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="擅长领域">
          <a-select v-model:value="form.expertise" mode="tags" placeholder="输入标签后回车" style="width:100%">
            <a-select-option value="小红书">小红书</a-select-option>
            <a-select-option value="爆款文案">爆款文案</a-select-option>
            <a-select-option value="代码审查">代码审查</a-select-option>
            <a-select-option value="商业分析">商业分析</a-select-option>
            <a-select-option value="标题优化">标题优化</a-select-option>
            <a-select-option value="事实核查">事实核查</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="系统提示词" required>
          <a-textarea v-model:value="form.systemPrompt" :rows="6" placeholder="定义这个智能体的性格、专业背景、工作方式..." />
        </a-form-item>
        <a-button type="primary" block :loading="saving" @click="handleSave">保存</a-button>
      </a-form>
    </a-drawer>

    <!-- 测试对话 -->
    <a-drawer :title="`测试: ${testPersona?.name || ''}`" :open="testVisible" width="500px" @close="testVisible = false">
      <div class="test-chat">
        <div class="test-chat__messages">
          <div v-for="(msg, i) in testMessages" :key="i" :class="['test-msg', `test-msg--${msg.role}`]">
            <div class="test-msg__content" v-html="renderMd(msg.content)"></div>
          </div>
          <div v-if="testSending" class="test-msg test-msg--assistant"><a-spin size="small" /> 思考中...</div>
        </div>
        <div class="test-chat__input">
          <a-textarea v-model:value="testInput" :rows="2" placeholder="测试这个智能体的回复效果..." @pressEnter="handleTestSend" :disabled="testSending" />
          <div style="font-size:11px;color:#bbb;margin-top:4px">常用测试语: "你好请做自我介绍" · "帮我写一段文案"</div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, EllipsisOutlined, EditOutlined, CommentOutlined } from "@ant-design/icons-vue";
import { getPersonas, savePersona, deletePersona, getPromptTemplates } from "../api/automation";
import type { AgentPersona, PromptTemplate } from "../types";

const GROUP_MAP: Record<string, string[]> = {
  content: ["小红书", "爆款文案", "标题优化", "内容创作", "技术写作"],
  review: ["事实核查", "数据验证", "质量审查", "代码审查", "架构设计"],
  business: ["商业分析", "机会评估", "市场分析", "风险分析", "决策分析", "团队协调", "营销心理学", "假设检验", "商业策略"],
  tech: ["代码审查", "架构设计", "技术写作"],
};

function inferGroup(p: AgentPersona): string {
  for (const [group, tags] of Object.entries(GROUP_MAP)) {
    if (p.expertise.some((t) => tags.includes(t))) return group;
  }
  return "content";
}

const personas = ref<AgentPersona[]>([]);
const promptTemplates = ref<PromptTemplate[]>([]);
const loading = ref(false);
const saving = ref(false);
const drawerVisible = ref(false);
const editingId = ref<string | null>(null);
const filterGroup = ref("all");

const EMPTY_FORM = (): Omit<AgentPersona, "id" | "createdAt"> => ({
  name: "", avatar: "🤖", role: "", systemPrompt: "", expertise: [],
});
const form = reactive(EMPTY_FORM());

const filteredPersonas = computed(() => {
  if (filterGroup.value === "all") return personas.value;
  return personas.value.filter((p) => inferGroup(p) === filterGroup.value);
});
const totalUsage = computed(() => personas.value.reduce((s, p) => s + getUsage(p.id), 0));

function getUsage(id: string): number {
  const map: Record<string, number> = {
    persona_writer_xhs: 89, persona_checker: 42, persona_title_optimizer: 28,
    persona_coder: 15, persona_optimist: 8, persona_pessimist: 8, persona_judge: 6,
  };
  return map[id] || 0;
}

function getLinkedPrompts(id: string): string[] {
  return promptTemplates.value.filter((pt) => pt.personaId === id).map((pt) => pt.name);
}

function renderMd(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}

async function load(): Promise<void> {
  loading.value = true;
  try { [personas.value, promptTemplates.value] = await Promise.all([getPersonas(), getPromptTemplates()]); }
  finally { loading.value = false; }
}

function openEditor(p: AgentPersona | null): void {
  if (p) { editingId.value = p.id; Object.assign(form, p); }
  else { editingId.value = null; Object.assign(form, EMPTY_FORM()); }
  drawerVisible.value = true;
}

async function handleSave(): Promise<void> {
  if (!form.name.trim()) { message.warning("请输入名称"); return; }
  if (!form.systemPrompt.trim()) { message.warning("请输入系统提示词"); return; }
  saving.value = true;
  try {
    const saved = await savePersona({ ...form, id: editingId.value || undefined });
    if (editingId.value) { const idx = personas.value.findIndex((p) => p.id === editingId.value); if (idx >= 0) personas.value[idx] = saved; }
    else { personas.value.push(saved); }
    drawerVisible.value = false; message.success("保存成功");
  } catch { message.error("保存失败"); }
  finally { saving.value = false; }
}

function handleMenu(e: { key: string }, p: AgentPersona): void {
  switch (e.key) {
    case "edit": openEditor(p); break;
    case "duplicate":
      savePersona({ ...p, name: p.name + " (副本)" }).then((saved) => { personas.value.push(saved); message.success("已复制"); });
      break;
    case "delete": deletePersona(p.id).then(() => { personas.value = personas.value.filter((x) => x.id !== p.id); message.success("已删除"); }); break;
  }
}

// 测试对话
const testVisible = ref(false);
const testPersona = ref<AgentPersona | null>(null);
const testMessages = ref<{ role: string; content: string }[]>([]);
const testInput = ref("");
const testSending = ref(false);

function openTestChat(p: AgentPersona): void {
  testPersona.value = p;
  testMessages.value = [{
    role: "assistant",
    content: `你好！我是 **${p.name}**——${p.role}。\n\n我擅长的领域是：${p.expertise.join("、")}。\n\n试试问我："帮我写一篇文案" · "审查这段内容"`,
  }];
  testInput.value = "";
  testVisible.value = true;
}

async function handleTestSend(e: KeyboardEvent): Promise<void> {
  if (e.shiftKey) return;
  e.preventDefault();
  const text = testInput.value.trim();
  if (!text) return;
  testMessages.value.push({ role: "user", content: text });
  testInput.value = "";
  testSending.value = true;
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1000));
  testMessages.value.push({
    role: "assistant",
    content: `🤖 **${testPersona.value?.name}** 的模拟回复：\n\n这是基于系统提示词的回复效果预览。正式使用时会是完整的 AI 生成内容。`,
  });
  testSending.value = false;
}

onMounted(load);
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.filter-bar .ant-card-body { padding: 10px 16px; }
.persona-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.persona-card { transition: transform 0.2s, box-shadow 0.2s; }
.persona-card:hover { transform: translateY(-2px); }
.persona-card__head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.persona-avatar { font-size: 32px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 12px; }
.persona-name { font-weight: 600; font-size: 16px; }
.persona-role { font-size: 12px; color: #999; }
.persona-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.persona-prompt-preview { font-size: 12px; color: #999; line-height: 1.5; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; margin-bottom: 8px; }
.persona-linked { margin: 8px 0; }
.linked-title { font-size: 11px; color: #999; margin-bottom: 4px; }
.test-chat { display: flex; flex-direction: column; height: calc(100vh - 120px); }
.test-chat__messages { flex: 1; overflow-y: auto; padding: 12px 0; }
.test-msg { margin-bottom: 14px; }
.test-msg--assistant { padding-left: 8px; border-left: 3px solid #1677ff; }
.test-msg--user { text-align: right; }
.test-msg__content { font-size: 13px; line-height: 1.7; padding: 8px 12px; border-radius: 8px; background: #f5f5f5; display: inline-block; text-align: left; max-width: 90%; }
.test-msg--user .test-msg__content { background: #1677ff; color: #fff; }
.test-chat__input { padding-top: 12px; border-top: 1px solid #f0f0f0; }
</style>
