<template>
  <div class="page-container">
    <a-page-header title="素材库" sub-title="AI 生成和手动上传的素材统一管理" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-upload :before-upload="() => false" show-upload-list="false">
          <a-button><UploadOutlined /> 上传素材</a-button>
        </a-upload>
      </template>
    </a-page-header>

    <!-- 筛选 -->
    <a-card :bordered="false" class="filter-bar">
      <a-space>
        <a-select v-model:value="filter.type" style="width:120px" @change="fetchData">
          <a-select-option value="all">全部类型</a-select-option>
          <a-select-option value="image">🖼️ 图片</a-select-option>
          <a-select-option value="text">📄 文本</a-select-option>
          <a-select-option value="template">📋 模板</a-select-option>
          <a-select-option value="video">🎬 视频</a-select-option>
        </a-select>
        <a-select v-model:value="filter.platform" style="width:130px" @change="fetchData">
          <a-select-option value="all">全部平台</a-select-option>
          <a-select-option value="xiaohongshu">小红书</a-select-option>
          <a-select-option value="douyin">抖音</a-select-option>
          <a-select-option value="wechat_mp">公众号</a-select-option>
        </a-select>
        <a-input-search v-model:value="filter.keyword" placeholder="搜索素材..." style="width:240px" @search="fetchData" />
      </a-space>
    </a-card>

    <!-- 统计卡片 -->
    <a-row :gutter="16" style="margin-bottom:16px">
      <a-col :span="6" v-for="stat in stats" :key="stat.label">
        <a-card :bordered="false" size="small" class="stat-card">
          <div class="stat-card__value">{{ stat.value }}</div>
          <div class="stat-card__label">{{ stat.label }}</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 素材网格 -->
    <a-spin :spinning="loading">
      <div class="asset-grid" v-if="assets.length > 0">
        <a-card
          v-for="asset in assets"
          :key="asset.id"
          :bordered="false"
          hoverable
          class="asset-card"
        >
          <template #extra>
            <a-dropdown :trigger="['click']">
              <a-button type="text" size="small"><EllipsisOutlined /></a-button>
              <template #overlay>
                <a-menu @click="(e: any) => handleMenu(e, asset)">
                  <a-menu-item key="copy">复制链接</a-menu-item>
                  <a-menu-item key="download">下载</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>

          <!-- 预览 -->
          <div :class="['asset-preview', `asset-preview--${asset.type}`]">
            <!-- 图片 -->
            <img v-if="asset.type === 'image'" :src="asset.thumbnailUrl" :alt="asset.name" class="asset-img" />
            <!-- 模板 / 文本 -->
            <div v-else class="asset-text-preview">
              <span class="asset-text-icon">{{ asset.type === 'template' ? '📋' : '📄' }}</span>
              <pre class="asset-text-content">{{ asset.content.slice(0, 120) }}{{ asset.content.length > 120 ? '...' : '' }}</pre>
            </div>
          </div>

          <div class="asset-info">
            <div class="asset-name">{{ asset.name }}</div>
            <div class="asset-meta">
              <a-tag v-if="asset.source === 'ai_generated'" color="purple" size="small">🤖 AI 生成</a-tag>
              <a-tag v-else color="blue" size="small">📤 手动上传</a-tag>
              <a-tag v-if="asset.platform" size="small">{{ PLATFORM_LABELS[asset.platform] || asset.platform }}</a-tag>
              <span class="asset-size" v-if="asset.size">{{ asset.size }}</span>
              <span class="asset-date">{{ asset.createdAt.slice(0, 10) }}</span>
            </div>
          </div>
        </a-card>
      </div>

      <a-empty v-else description="素材库为空">
        <a-button type="primary">上传第一个素材</a-button>
      </a-empty>

      <div class="pagination-wrap" v-if="pagination.total > pagination.pageSize">
        <a-pagination
          v-model:current="pagination.current"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          @change="fetchData"
        />
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { UploadOutlined, EllipsisOutlined } from "@ant-design/icons-vue";
import { getAssets, deleteAsset } from "../api/automation";
import type { MediaAsset } from "../types";
import { PLATFORM_LABELS } from "../types";

const assets = ref<MediaAsset[]>([]);
const loading = ref(false);
const filter = reactive({ type: "all", platform: "all", keyword: "" });

const pagination = reactive({ current: 1, pageSize: 12, total: 0 });

const stats = computed(() => [
  { label: "图片", value: assets.value.filter((a) => a.type === "image").length },
  { label: "文本", value: assets.value.filter((a) => a.type === "text").length },
  { label: "模板", value: assets.value.filter((a) => a.type === "template").length },
  { label: "AI 生成", value: assets.value.filter((a) => a.source === "ai_generated").length },
]);

async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    const res = await getAssets({
      page: pagination.current,
      pageSize: pagination.pageSize,
      type: filter.type === "all" ? undefined : filter.type,
      platform: filter.platform === "all" ? undefined : filter.platform,
    });
    assets.value = res.records;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

function handleMenu(e: { key: string }, asset: MediaAsset): void {
  switch (e.key) {
    case "copy":
      navigator.clipboard?.writeText(asset.content).then(() => message.success("已复制"));
      break;
    case "delete":
      deleteAsset(asset.id).then(() => {
        assets.value = assets.value.filter((a) => a.id !== asset.id);
        message.success("已删除");
      });
      break;
    case "download":
      message.info("下载功能（mock）");
      break;
  }
}

onMounted(fetchData);
</script>

<style scoped>
.filter-bar {
  margin-bottom: 16px;
}
.filter-bar .ant-card-body {
  padding: 12px 16px;
}
.stat-card {
  text-align: center;
}
.stat-card__value {
  font-size: 24px;
  font-weight: 700;
  color: #1677ff;
}
.stat-card__label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
.asset-card {
  transition: transform 0.2s;
}
.asset-card:hover {
  transform: translateY(-2px);
}
.asset-preview {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  background: #fafafa;
}
.asset-preview--image {
  background: #f0f0f0;
}
.asset-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.asset-text-preview {
  padding: 12px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f9f0ff;
}
.asset-text-icon {
  font-size: 28px;
}
.asset-text-content {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  max-height: 100px;
  overflow: hidden;
}
.asset-info {
  min-width: 0;
}
.asset-name {
  font-weight: 500;
  font-size: 13px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.asset-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.asset-size,
.asset-date {
  font-size: 11px;
  color: #bbb;
}
.pagination-wrap {
  margin-top: 24px;
  text-align: right;
}
</style>
