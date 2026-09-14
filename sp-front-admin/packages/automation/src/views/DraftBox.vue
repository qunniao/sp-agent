<template>
  <div class="page-container">
    <a-page-header title="草稿箱" sub-title="AI 生成或手动创建的待审核内容" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-space>
          <a-select v-model:value="filterStatus" style="width:120px" @change="fetchData">
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="pending">⏳ 待审核</a-select-option>
            <a-select-option value="approved">✅ 已通过</a-select-option>
            <a-select-option value="rejected">❌ 已驳回</a-select-option>
          </a-select>
          <a-button v-if="selectedIds.length > 0" type="primary" @click="batchApprove">
            批量通过 ({{ selectedIds.length }})
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <div v-if="drafts.length === 0" class="empty-wrap">
        <a-empty description="草稿箱为空，AI 生成的内容在发布前会先存在这里" />
      </div>

      <div class="draft-list">
        <a-card
          v-for="d in drafts"
          :key="d.id"
          :bordered="false"
          :class="['draft-card', { 'draft-card--selected': selectedIds.includes(d.id) }]"
        >
          <template #extra>
            <a-checkbox :checked="selectedIds.includes(d.id)" @change="toggleSelect(d.id)" />
          </template>

          <div class="draft-head">
            <div class="draft-title">
              {{ d.title }}
              <a-tag v-if="d.reviewStatus === 'pending'" color="orange">待审核</a-tag>
              <a-tag v-else-if="d.reviewStatus === 'approved'" color="green">已通过</a-tag>
              <a-tag v-else color="red">已驳回</a-tag>
            </div>
            <div class="draft-meta">
              <a-tag size="small">{{ PLATFORM_LABELS[d.platform] }}</a-tag>
              <span>{{ d.accountNickname }}</span>
              <span v-if="d.automationName">· 来自「{{ d.automationName }}」</span>
              <span class="draft-time">{{ d.createdAt }}</span>
            </div>
          </div>

          <div class="draft-content">
            <pre class="draft-text">{{ d.content.slice(0, 200) }}{{ d.content.length > 200 ? '\n... (展开查看全部)' : '' }}</pre>
          </div>

          <div class="draft-tags" v-if="d.tags?.length">
            <a-tag v-for="t in d.tags" :key="t" size="small">{{ t }}</a-tag>
          </div>

          <template #actions>
            <span @click="handleAction(d, 'approve')"><CheckOutlined /> 通过</span>
            <span @click="handleAction(d, 'reject')"><CloseOutlined /> 驳回</span>
            <span @click="handleAction(d, 'edit')"><EditOutlined /> 编辑</span>
            <a-dropdown :trigger="['click']">
              <span><EllipsisOutlined /></span>
              <template #overlay>
                <a-menu @click="(e: any) => handleMenu(e, d)">
                  <a-menu-item key="publish">立即发布</a-menu-item>
                  <a-menu-item key="distribute">一键分发</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </a-card>
      </div>
    </a-spin>

    <div class="pagination-wrap" v-if="pagination.total > pagination.pageSize">
      <a-pagination v-model:current="pagination.current" :total="pagination.total" :page-size="pagination.pageSize" @change="fetchData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { CheckOutlined, CloseOutlined, EditOutlined, EllipsisOutlined } from "@ant-design/icons-vue";
import { getDrafts, updateDraftStatus, deleteDraft } from "../api/automation";
import type { DraftItem } from "../types";
import { PLATFORM_LABELS } from "../types";

const drafts = ref<DraftItem[]>([]);
const loading = ref(false);
const filterStatus = ref("all");
const selectedIds = ref<string[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });

function toggleSelect(id: string): void {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
}

async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    const res = await getDrafts({
      status: filterStatus.value === "all" ? undefined : filterStatus.value,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
    drafts.value = res.records;
    pagination.total = res.total;
  } finally { loading.value = false; }
}

async function handleAction(d: DraftItem, action: string): Promise<void> {
  if (action === "approve") {
    await updateDraftStatus(d.id, "approved");
    d.reviewStatus = "approved";
    message.success("已通过，等待发布");
  } else if (action === "reject") {
    await updateDraftStatus(d.id, "rejected");
    d.reviewStatus = "rejected";
    message.info("已驳回");
  } else if (action === "edit") {
    message.info("编辑功能（mock）");
  }
}

async function batchApprove(): Promise<void> {
  for (const id of selectedIds.value) {
    await updateDraftStatus(id, "approved");
    const d = drafts.value.find((x) => x.id === id);
    if (d) d.reviewStatus = "approved";
  }
  message.success(`已通过 ${selectedIds.value.length} 篇`);
  selectedIds.value = [];
}

function handleMenu(e: { key: string }, d: DraftItem): void {
  switch (e.key) {
    case "delete":
      deleteDraft(d.id).then(() => {
        drafts.value = drafts.value.filter((x) => x.id !== d.id);
        message.success("已删除");
      });
      break;
    default:
      message.info(`${e.key}（mock）`);
  }
}

onMounted(fetchData);
</script>

<style scoped>
.empty-wrap { padding: 60px 0; }
.draft-list { display: flex; flex-direction: column; gap: 12px; }
.draft-card--selected { border: 1px solid #1677ff; }
.draft-head { margin-bottom: 8px; }
.draft-title { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.draft-meta { font-size: 12px; color: #999; display: flex; align-items: center; gap: 6px; }
.draft-time { margin-left: auto; font-size: 11px; color: #bbb; }
.draft-content { background: #fafafa; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
.draft-text { margin: 0; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; color: #333; font-family: inherit; }
.draft-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.pagination-wrap { margin-top: 20px; text-align: right; }
</style>
