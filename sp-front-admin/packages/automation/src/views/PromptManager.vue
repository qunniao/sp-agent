<template>
  <div class="page-container">
    <a-page-header title="Prompt 模板库" sub-title="经过验证的高质量 Prompt，在工作流中直接引用" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-button type="primary" @click="openEditor(null)"><PlusOutlined /> 新建模板</a-button>
      </template>
    </a-page-header>

    <!-- 筛选 -->
    <a-card :bordered="false" class="filter-bar">
      <a-space>
        <a-select v-model:value="filterCat" style="width:130px">
          <a-select-option value="all">全部分类</a-select-option>
          <a-select-option value="content">📝 内容创作</a-select-option>
          <a-select-option value="analysis">🔍 分析审查</a-select-option>
          <a-select-option value="business">💼 业务管理</a-select-option>
          <a-select-option value="social">📱 社交媒体</a-select-option>
        </a-select>
      </a-space>
    </a-card>

    <a-spin :spinning="loading">
      <div class="prompt-grid" v-if="filteredList.length > 0">
        <a-card v-for="tmpl in filteredList" :key="tmpl.id" :bordered="false" hoverable class="prompt-card">
          <template #extra>
            <a-dropdown :trigger="['click']">
              <a-button type="text" size="small"><EllipsisOutlined /></a-button>
              <template #overlay>
                <a-menu @click="(e:any) => handleMenu(e, tmpl)">
                  <a-menu-item key="edit">编辑</a-menu-item>
                  <a-menu-item key="duplicate">复制</a-menu-item>
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>

          <div class="prompt-card__head">
            <span class="prompt-card__name">{{ tmpl.name }}</span>
            <a-tag size="small">{{ CAT_LABELS[tmpl.category] }}</a-tag>
          </div>
          <p class="prompt-card__desc">{{ tmpl.description }}</p>

          <!-- 变量一览 -->
          <div class="prompt-card__vars" v-if="tmpl.variables.length > 0">
            <span class="prompt-card__vars-label">变量:</span>
            <a-tag v-for="v in tmpl.variables" :key="v.name" size="small" color="processing">&#123;&#123;{{ v.name }}&#125;&#125;</a-tag>
          </div>

          <div class="prompt-card__preview">
            <pre class="prompt-preview-text">{{ tmpl.template.slice(0, 150) }}{{ tmpl.template.length > 150 ? '...' : '' }}</pre>
          </div>

          <template #actions>
            <span>📎 使用 {{ tmpl.usageCount }} 次</span>
            <span @click="handleCopy(tmpl)"><CopyOutlined /> 复制 Prompt</span>
          </template>
        </a-card>
      </div>

      <a-empty v-else description="还没有模板" />
    </a-spin>

    <!-- 编辑 Drawer -->
    <a-drawer :title="editingId ? '编辑模板' : '新建模板'" :open="drawerVisible" width="520px" @close="drawerVisible = false">
      <a-form layout="vertical">
        <a-row :gutter="12">
          <a-col :span="14">
            <a-form-item label="名称" required>
              <a-input v-model:value="form.name" placeholder="如：小红书爆款笔记" :maxlength="20" />
            </a-form-item>
          </a-col>
          <a-col :span="10">
            <a-form-item label="分类">
              <a-select v-model:value="form.category">
                <a-select-option v-for="(label, key) in CAT_LABELS" :key="key" :value="key">{{ label }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="描述">
          <a-input v-model:value="form.description" :maxlength="100" />
        </a-form-item>
        <a-form-item label="模板内容">
          <a-textarea v-model:value="form.template" :rows="8" placeholder="用 {{变量名}} 表示可替换的变量..." />
        </a-form-item>
        <a-button type="primary" block :loading="saving" @click="handleSave">保存</a-button>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, EllipsisOutlined, CopyOutlined } from "@ant-design/icons-vue";
import { getPromptTemplates, savePromptTemplate, deletePromptTemplate } from "../api/automation";
import type { PromptTemplate } from "../types";

const templates = ref<PromptTemplate[]>([]);
const loading = ref(false);
const saving = ref(false);
const filterCat = ref("all");
const drawerVisible = ref(false);
const editingId = ref<string | null>(null);

const CAT_LABELS: Record<string, string> = {
  content: "📝 内容创作",
  analysis: "🔍 分析审查",
  business: "💼 业务管理",
  code: "💻 代码",
  social: "📱 社交媒体",
};

const EMPTY = (): Omit<PromptTemplate, "id" | "createdAt" | "usageCount"> => ({
  name: "", description: "", category: "content", template: "", variables: [],
});
const form = reactive(EMPTY());

const filteredList = computed(() =>
  filterCat.value === "all" ? templates.value : templates.value.filter((t) => t.category === filterCat.value)
);

async function load(): Promise<void> {
  loading.value = true;
  try { templates.value = await getPromptTemplates(); }
  finally { loading.value = false; }
}

function openEditor(tmpl: PromptTemplate | null): void {
  if (tmpl) { editingId.value = tmpl.id; Object.assign(form, tmpl); }
  else { editingId.value = null; Object.assign(form, EMPTY()); }
  drawerVisible.value = true;
}

async function handleSave(): Promise<void> {
  if (!form.name.trim()) { message.warning("请输入名称"); return; }
  saving.value = true;
  try {
    const saved = await savePromptTemplate({ ...form, id: editingId.value || undefined });
    if (editingId.value) {
      const idx = templates.value.findIndex((t) => t.id === editingId.value);
      if (idx >= 0) templates.value[idx] = saved;
    } else { templates.value.push(saved); }
    drawerVisible.value = false;
    message.success("保存成功");
  } catch { message.error("保存失败"); }
  finally { saving.value = false; }
}

function handleMenu(e: { key: string }, tmpl: PromptTemplate): void {
  switch (e.key) {
    case "edit": openEditor(tmpl); break;
    case "duplicate":
      savePromptTemplate({ ...tmpl, name: tmpl.name + " (副本)" }).then((s) => {
        templates.value.push(s); message.success("已复制");
      });
      break;
    case "delete":
      deletePromptTemplate(tmpl.id).then(() => {
        templates.value = templates.value.filter((t) => t.id !== tmpl.id);
        message.success("已删除");
      });
      break;
  }
}

function handleCopy(tmpl: PromptTemplate): void {
  navigator.clipboard?.writeText(tmpl.template).then(() => message.success("已复制"));
}

onMounted(load);
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.filter-bar .ant-card-body { padding: 10px 16px; }
.prompt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.prompt-card { transition: transform 0.2s; }
.prompt-card:hover { transform: translateY(-2px); }
.prompt-card__head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.prompt-card__name { font-weight: 600; font-size: 15px; }
.prompt-card__desc { font-size: 12px; color: #999; margin: 0 0 8px; }
.prompt-card__vars { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
.prompt-card__vars-label { font-size: 11px; color: #bbb; }
.prompt-card__preview { background: #fafafa; border-radius: 6px; padding: 8px 10px; }
.prompt-preview-text { margin: 0; font-size: 11px; line-height: 1.5; white-space: pre-wrap; color: #666; font-family: inherit; max-height: 72px; overflow: hidden; }
</style>
