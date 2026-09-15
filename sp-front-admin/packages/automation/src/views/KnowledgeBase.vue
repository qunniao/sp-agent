<template>
  <div class="page-container">
    <a-page-header title="知识库" sub-title="AI 的公司记忆，让智能体了解你的业务" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-button type="primary" @click="openEditor(null)"><PlusOutlined /> 添加文档</a-button>
      </template>
    </a-page-header>

    <a-card :bordered="false" class="filter-bar">
      <a-space>
        <a-select v-model:value="filterCategoryId" style="width:160px" allow-clear placeholder="全部分类" @change="load">
          <a-select-option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</a-select-option>
        </a-select>
        <a-input-search v-model:value="filterKeyword" placeholder="搜索文档..." style="width:260px" />
      </a-space>
    </a-card>

    <a-spin :spinning="loading">
      <div class="kb-grid" v-if="filteredDocs.length > 0">
        <a-card v-for="doc in filteredDocs" :key="doc.id" :bordered="false" hoverable class="kb-card">
          <template #extra>
            <a-dropdown :trigger="['click']">
              <a-button type="text" size="small"><EllipsisOutlined /></a-button>
              <template #overlay>
                <a-menu @click="(e:any) => handleMenu(e, doc)">
                  <a-menu-item key="edit">编辑</a-menu-item>
                  <a-menu-item key="vectorize">重新向量化</a-menu-item>
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>

          <div class="kb-card__head">
            <div>
              <div class="kb-card__title">{{ doc.title }}</div>
              <div class="kb-card__meta">
                <a-tag size="small">{{ categoryName(doc.categoryId) }}</a-tag>
                <a-tag size="small" :color="doc.status === 1 ? 'green' : 'orange'">{{ doc.status === 1 ? '已向量化' : '待向量化' }}</a-tag>
                <span>{{ doc.content.length }} 字</span>
              </div>
            </div>
          </div>

          <div class="kb-card__preview">{{ doc.content.slice(0, 120) }}{{ doc.content.length > 120 ? '...' : '' }}</div>
        </a-card>
      </div>

      <a-empty v-else description="知识库为空，添加产品介绍、定价策略、FAQ 等文档" />
    </a-spin>

    <!-- 编辑 Drawer -->
    <a-drawer :title="editingId !== null ? '编辑文档' : '添加文档'" :open="drawerVisible" width="520px" @close="drawerVisible = false">
      <a-form layout="vertical">
        <a-form-item label="标题" required>
          <a-input v-model:value="form.title" :maxlength="200" />
        </a-form-item>
        <a-form-item label="分类">
          <a-select v-model:value="form.categoryId" placeholder="选择分类（可不选）">
            <a-select-option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="内容" required>
          <a-textarea v-model:value="form.content" :rows="10" placeholder="文档正文内容..." />
        </a-form-item>
        <a-button type="primary" block :loading="saving" @click="handleSave">保存</a-button>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, EllipsisOutlined } from "@ant-design/icons-vue";
import {
  getKnowledgeDocs, createKnowledgeDoc, updateKnowledgeDoc,
  deleteKnowledgeDoc, vectorizeDocument, getKnowledgeCategories,
} from "../api/kb";
import type { KnowledgeDoc, KnowledgeCategory } from "../types";

const docs = ref<KnowledgeDoc[]>([]);
const categories = ref<KnowledgeCategory[]>([]);
const loading = ref(false);
const saving = ref(false);
const filterCategoryId = ref<number | undefined>(undefined);
const filterKeyword = ref("");
const drawerVisible = ref(false);
const editingId = ref<number | null>(null);

const EMPTY = (): { title: string; categoryId: number | null; content: string } => ({
  title: "", categoryId: null, content: "",
});
const form = reactive(EMPTY());

const filteredDocs = computed(() => {
  const kw = filterKeyword.value.trim().toLowerCase();
  if (!kw) return docs.value;
  return docs.value.filter((d) => d.title.toLowerCase().includes(kw) || d.content.toLowerCase().includes(kw));
});

function categoryName(id: number | null): string {
  if (id === null) return "未分类";
  return categories.value.find((c) => c.id === id)?.name ?? "未分类";
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    docs.value = await getKnowledgeDocs(filterCategoryId.value);
  } finally { loading.value = false; }
}

function openEditor(doc: KnowledgeDoc | null): void {
  if (doc) {
    editingId.value = doc.id;
    Object.assign(form, { title: doc.title, categoryId: doc.categoryId, content: doc.content });
  } else {
    editingId.value = null;
    Object.assign(form, EMPTY());
  }
  drawerVisible.value = true;
}

async function handleSave(): Promise<void> {
  if (!form.title.trim() || !form.content.trim()) { message.warning("标题和内容不能为空"); return; }
  saving.value = true;
  try {
    const payload = { title: form.title, categoryId: form.categoryId, content: form.content };
    if (editingId.value !== null) {
      await updateKnowledgeDoc(editingId.value, payload);
    } else {
      await createKnowledgeDoc(payload);
    }
    drawerVisible.value = false;
    message.success("保存成功");
    await load();
  } catch { message.error("保存失败"); }
  finally { saving.value = false; }
}

async function handleMenu(e: { key: string }, doc: KnowledgeDoc): Promise<void> {
  if (e.key === "edit") openEditor(doc);
  if (e.key === "vectorize") {
    const hide = message.loading("向量化中...", 0);
    try {
      const n = await vectorizeDocument(doc.id);
      hide();
      message.success(`已向量化，写入 ${n} 条`);
      await load();
    } catch {
      hide();
      message.error("向量化失败");
    }
  }
  if (e.key === "delete") {
    try {
      await deleteKnowledgeDoc(doc.id);
      message.success("已删除");
      await load();
    } catch { message.error("删除失败"); }
  }
}

onMounted(async () => {
  try { categories.value = await getKnowledgeCategories(); } catch { /* 分类加载失败不阻塞文档列表 */ }
  await load();
});
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.filter-bar .ant-card-body { padding: 10px 16px; }
.kb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.kb-card { transition: transform 0.2s; }
.kb-card:hover { transform: translateY(-2px); }
.kb-card__head { display: flex; gap: 12px; align-items: flex-start; }
.kb-card__title { font-weight: 600; font-size: 15px; }
.kb-card__meta { font-size: 11px; color: #999; display: flex; gap: 8px; margin-top: 2px; }
.kb-card__preview { font-size: 12px; color: #666; line-height: 1.5; margin: 10px 0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
</style>
