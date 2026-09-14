<template>
  <div class="page-container">
    <a-page-header title="知识库" sub-title="AI 的公司记忆，让智能体了解你的业务" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-button type="primary" @click="openEditor(null)"><PlusOutlined /> 添加文档</a-button>
      </template>
    </a-page-header>

    <a-card :bordered="false" class="filter-bar">
      <a-space>
        <a-select v-model:value="filterCat" style="width:130px" @change="load">
          <a-select-option value="all">全部分类</a-select-option>
          <a-select-option v-for="(label, key) in DOC_CATEGORY_LABELS" :key="key" :value="key">{{ label }}</a-select-option>
        </a-select>
        <a-input-search v-model:value="filterKeyword" placeholder="搜索文档..." style="width:260px" @search="load" />
      </a-space>
    </a-card>

    <a-spin :spinning="loading">
      <div class="kb-grid" v-if="docs.length > 0">
        <a-card v-for="doc in docs" :key="doc.id" :bordered="false" hoverable class="kb-card">
          <template #extra>
            <a-dropdown :trigger="['click']">
              <a-button type="text" size="small"><EllipsisOutlined /></a-button>
              <template #overlay>
                <a-menu @click="(e:any) => handleMenu(e, doc)">
                  <a-menu-item key="edit">编辑</a-menu-item>
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>

          <div class="kb-card__head">
            <span class="kb-card__icon">{{ DOC_CATEGORY_LABELS[doc.category].split(' ')[0] }}</span>
            <div>
              <div class="kb-card__title">{{ doc.title }}</div>
              <div class="kb-card__meta">
                <a-tag size="small">{{ DOC_CATEGORY_LABELS[doc.category] }}</a-tag>
                <span>{{ doc.wordCount }} 字</span>
                <span>{{ doc.format }}</span>
              </div>
            </div>
          </div>

          <div class="kb-card__preview">
            {{ doc.content.slice(0, 120) }}{{ doc.content.length > 120 ? '...' : '' }}
          </div>

          <div class="kb-card__ref">
            引用语法：<code>{{ doc.refSyntax }}</code>
            <a-button type="link" size="small" @click="copyRef(doc.refSyntax)">复制</a-button>
          </div>
        </a-card>
      </div>

      <a-empty v-else description="知识库为空，添加产品介绍、定价策略、FAQ 等文档" />
    </a-spin>

    <!-- 编辑 Drawer -->
    <a-drawer :title="editingId ? '编辑文档' : '添加文档'" :open="drawerVisible" width="520px" @close="drawerVisible = false">
      <a-form layout="vertical">
        <a-row :gutter="12">
          <a-col :span="14">
            <a-form-item label="标题" required>
              <a-input v-model:value="form.title" :maxlength="50" />
            </a-form-item>
          </a-col>
          <a-col :span="10">
            <a-form-item label="分类">
              <a-select v-model:value="form.category">
                <a-select-option v-for="(label, key) in DOC_CATEGORY_LABELS" :key="key" :value="key">{{ label }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="格式">
          <a-radio-group v-model:value="form.format">
            <a-radio value="markdown">Markdown</a-radio>
            <a-radio value="text">纯文本</a-radio>
            <a-radio value="url">URL 链接</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="form.format === 'url'" label="URL">
          <a-input v-model:value="form.sourceUrl" placeholder="https://..." />
        </a-form-item>
        <a-form-item label="内容" required>
          <a-textarea v-model:value="form.content" :rows="10" placeholder="Markdown 或纯文本内容..." />
        </a-form-item>
        <a-button type="primary" block :loading="saving" @click="handleSave">保存</a-button>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, EllipsisOutlined } from "@ant-design/icons-vue";
import { getKnowledgeDocs, saveKnowledgeDoc, deleteKnowledgeDoc } from "../api/automation";
import type { KnowledgeDoc, DocCategory } from "../types";
import { DOC_CATEGORY_LABELS } from "../types";

const docs = ref<KnowledgeDoc[]>([]);
const loading = ref(false);
const saving = ref(false);
const filterCat = ref("all");
const filterKeyword = ref("");
const drawerVisible = ref(false);
const editingId = ref<string | null>(null);

const EMPTY = (): Omit<KnowledgeDoc, "id" | "updatedAt" | "refSyntax" | "wordCount"> => ({
  title: "", category: "product", content: "", format: "markdown",
});
const form = reactive(EMPTY());

async function load(): Promise<void> {
  loading.value = true;
  try {
    docs.value = await getKnowledgeDocs({
      category: filterCat.value === "all" ? undefined : filterCat.value,
      keyword: filterKeyword.value || undefined,
    });
  } finally { loading.value = false; }
}

function openEditor(doc: KnowledgeDoc | null): void {
  if (doc) { editingId.value = doc.id; Object.assign(form, doc); }
  else { editingId.value = null; Object.assign(form, EMPTY()); }
  drawerVisible.value = true;
}

async function handleSave(): Promise<void> {
  if (!form.title.trim() || !form.content.trim()) { message.warning("标题和内容不能为空"); return; }
  saving.value = true;
  try {
    const saved = await saveKnowledgeDoc({ ...form, id: editingId.value || undefined });
    if (editingId.value) {
      const idx = docs.value.findIndex((d) => d.id === editingId.value);
      if (idx >= 0) docs.value[idx] = saved;
    } else { docs.value.push(saved); }
    drawerVisible.value = false;
    message.success("保存成功");
  } catch { message.error("保存失败"); }
  finally { saving.value = false; }
}

function handleMenu(e: { key: string }, doc: KnowledgeDoc): void {
  if (e.key === "edit") openEditor(doc);
  if (e.key === "delete") {
    deleteKnowledgeDoc(doc.id).then(() => {
      docs.value = docs.value.filter((d) => d.id !== doc.id);
      message.success("已删除");
    });
  }
}

function copyRef(ref: string): void {
  navigator.clipboard?.writeText(ref).then(() => message.success("已复制引用语法"));
}

onMounted(load);
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.filter-bar .ant-card-body { padding: 10px 16px; }
.kb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.kb-card { transition: transform 0.2s; }
.kb-card:hover { transform: translateY(-2px); }
.kb-card__head { display: flex; gap: 12px; align-items: flex-start; }
.kb-card__icon { font-size: 28px; }
.kb-card__title { font-weight: 600; font-size: 15px; }
.kb-card__meta { font-size: 11px; color: #999; display: flex; gap: 8px; margin-top: 2px; }
.kb-card__preview { font-size: 12px; color: #666; line-height: 1.5; margin: 10px 0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
.kb-card__ref { font-size: 12px; color: #999; display: flex; align-items: center; gap: 4px; }
.kb-card__ref code { background: #f5f5f5; padding: 1px 6px; border-radius: 3px; font-size: 11px; color: #722ed1; }
</style>
