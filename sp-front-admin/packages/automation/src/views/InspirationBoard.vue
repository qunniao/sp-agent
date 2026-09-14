<template>
  <div class="page-container">
    <a-page-header title="灵感收藏" sub-title="收藏好内容，AI 拆解为什么火" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-space>
          <a-select v-model:value="filterTag" style="width:140px" @change="fetchData">
            <a-select-option value="all">全部标签</a-select-option>
            <a-select-option value="AI">AI</a-select-option>
            <a-select-option value="涨粉">涨粉</a-select-option>
            <a-select-option value="一人公司">一人公司</a-select-option>
            <a-select-option value="对比评测">对比评测</a-select-option>
          </a-select>
          <a-button type="primary" @click="message.info('添加灵感（mock）')">
            <PlusOutlined /> 收藏链接
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <div class="inspiration-grid" v-if="inspirations.length > 0">
        <a-card
          v-for="insp in inspirations"
          :key="insp.id"
          :bordered="false"
          hoverable
          class="inspiration-card"
        >
          <!-- 缩略图 -->
          <div class="insp-thumb" v-if="insp.thumbnailUrl">
            <img :src="insp.thumbnailUrl" :alt="insp.title" />
          </div>

          <div class="insp-body">
            <div class="insp-title">{{ insp.title }}</div>
            <div class="insp-meta">
              <a-tag size="small">{{ PLATFORM_LABELS[insp.platform] }}</a-tag>
              <span>@{{ insp.author }}</span>
              <span class="insp-date">{{ insp.savedAt.slice(0, 10) }}</span>
            </div>

            <div class="insp-tags">
              <a-tag v-for="t in insp.tags" :key="t" size="small" color="purple">{{ t }}</a-tag>
            </div>

            <!-- AI 拆解 -->
            <div v-if="insp.aiAnalysis" class="insp-analysis">
              <div class="insp-analysis__title">🤖 AI 拆解：为什么火</div>
              <pre class="insp-analysis__text">{{ insp.aiAnalysis }}</pre>
            </div>

            <!-- 可借鉴 -->
            <div v-if="insp.takeaways?.length" class="insp-takeaways">
              <div class="insp-takeaways__title">💡 可借鉴</div>
              <div class="insp-takeaways__list">
                <span v-for="(t, i) in insp.takeaways" :key="i" class="takeaway-tag">{{ t }}</span>
              </div>
            </div>
          </div>

          <template #actions>
            <span @click="openUrl(insp.url)"><LinkOutlined /> 原文</span>
            <span @click="handleCopy(insp)"><CopyOutlined /> 复制</span>
            <span @click="handleDelete(insp)"><DeleteOutlined /> 删除</span>
          </template>
        </a-card>
      </div>

      <a-empty v-else description="还没有收藏灵感" />
    </a-spin>

    <div class="pagination-wrap" v-if="pagination.total > pagination.pageSize">
      <a-pagination v-model:current="pagination.current" :total="pagination.total" :page-size="pagination.pageSize" @change="fetchData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, LinkOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import { getInspirations, deleteInspiration } from "../api/automation";
import type { Inspiration } from "../types";
import { PLATFORM_LABELS } from "../types";

const inspirations = ref<Inspiration[]>([]);
const loading = ref(false);
const filterTag = ref("all");
const pagination = reactive({ current: 1, pageSize: 6, total: 0 });

async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    const res = await getInspirations({
      page: pagination.current,
      pageSize: pagination.pageSize,
      tag: filterTag.value === "all" ? undefined : filterTag.value,
    });
    inspirations.value = res.records;
    pagination.total = res.total;
  } finally { loading.value = false; }
}

function openUrl(url: string): void {
  window.open(url, "_blank");
}

function handleCopy(insp: Inspiration): void {
  const text = `${insp.title}\n\n${insp.aiAnalysis || ""}\n\n可借鉴：${insp.takeaways?.join("、") || ""}`;
  navigator.clipboard?.writeText(text).then(() => message.success("已复制分析内容"));
}

async function handleDelete(insp: Inspiration): Promise<void> {
  await deleteInspiration(insp.id);
  inspirations.value = inspirations.value.filter((x) => x.id !== insp.id);
  message.success("已删除");
}

onMounted(fetchData);
</script>

<style scoped>
.inspiration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}
.inspiration-card {
  transition: transform 0.2s;
}
.inspiration-card:hover {
  transform: translateY(-2px);
}
.insp-thumb {
  height: 140px;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
  margin: -16px -16px 12px;
}
.insp-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.insp-body {
  min-width: 0;
}
.insp-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.insp-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.insp-date {
  margin-left: auto;
  font-size: 11px;
  color: #bbb;
}
.insp-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.insp-analysis {
  background: #f9f0ff;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
}
.insp-analysis__title {
  font-size: 12px;
  font-weight: 600;
  color: #722ed1;
  margin-bottom: 4px;
}
.insp-analysis__text {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #555;
  font-family: inherit;
}
.insp-takeaways__title {
  font-size: 12px;
  font-weight: 600;
  color: #1677ff;
  margin-bottom: 4px;
}
.insp-takeaways__list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.takeaway-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #e6f7ff;
  color: #1677ff;
  border-radius: 12px;
  font-size: 11px;
}
.pagination-wrap {
  margin-top: 20px;
  text-align: right;
}
</style>
