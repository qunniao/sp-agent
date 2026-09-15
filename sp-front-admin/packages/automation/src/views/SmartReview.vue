<template>
  <div class="page-container review-page">
    <a-page-header title="智能复盘" :sub-title="`${report?.dateRange} · ${report?.weekLabel}`" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-button @click="load" :loading="loading"><ReloadOutlined /> 刷新</a-button>
      </template>
    </a-page-header>

    <a-spin :spinning="loading" v-if="report">
      <!-- 总览卡片 -->
      <a-row :gutter="16" style="margin-bottom:16px">
        <a-col :span="4" v-for="s in overviewStats" :key="s.label" style="margin-bottom:16px">
          <a-card :bordered="false" size="small" class="stat-card">
            <div class="stat-card__value" :style="{ color: s.color }">{{ s.value }}</div>
            <div class="stat-card__label">{{ s.label }}</div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <!-- 左栏 -->
        <a-col :span="16">
          <!-- AI 分析 -->
          <a-card :bordered="false" title="🤖 AI 分析" style="margin-bottom:16px">
            <div class="analysis-list">
              <div class="analysis-item" v-for="(a, i) in report.aiAnalysis" :key="i">
                <span class="analysis-item__num">{{ i + 1 }}</span>
                <span class="analysis-item__text">{{ a }}</span>
              </div>
            </div>
          </a-card>

          <!-- 最佳内容 -->
          <a-card :bordered="false" title="🏆 最佳内容" style="margin-bottom:16px">
            <div class="top-content">
              <div class="top-content__title">
                <a-tag color="orange">{{ PLATFORM_LABELS[report.topContent.platform] }}</a-tag>
                {{ report.topContent.title }}
              </div>
              <a-row :gutter="24" style="margin-top:12px">
                <a-col :span="6"><span class="metric-label">阅读</span><span class="metric-value">{{ formatNum(report.topContent.views) }}</span></a-col>
                <a-col :span="6"><span class="metric-label">点赞</span><span class="metric-value">{{ formatNum(report.topContent.likes) }}</span></a-col>
                <a-col :span="6"><span class="metric-label">收藏率</span><span class="metric-value" style="color:#52c41a">{{ report.topContent.saveRate }}</span></a-col>
              </a-row>
              <div class="insight-box">
                <BulbOutlined style="color:#faad14" /> {{ report.topContent.insight }}
              </div>
            </div>
          </a-card>

          <!-- 平台表现 -->
          <a-card :bordered="false" title="📊 各平台表现" style="margin-bottom:16px">
            <a-table :columns="platformCols" :data-source="report.platformBreakdown" :pagination="false" size="small" row-key="platform">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'platform'">
                  {{ (PLATFORM_LABELS as Record<string, string>)[record.platform] }} · {{ record.nickname }}
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>

        <!-- 右栏 -->
        <a-col :span="8">
          <!-- 选题推荐 -->
          <a-card :bordered="false" title="💡 AI 推荐本周选题" style="margin-bottom:16px" class="topic-card">
            <div class="topic-list">
              <div class="topic-item" v-for="(t, i) in report.suggestedTopics" :key="i">
                <span class="topic-item__num">{{ i + 1 }}</span>
                <span class="topic-item__text">{{ t }}</span>
              </div>
            </div>
            <a-space direction="vertical" style="width:100%;margin-top:12px">
              <a-button type="primary" block @click="handleCreateTopics">一键创建选题 →</a-button>
              <a-button block @click="handleCopyAll">复制全部选题</a-button>
            </a-space>
          </a-card>

          <!-- 标签效果 -->
          <a-card :bordered="false" title="🏷️ 标签效果" size="small" style="margin-bottom:16px">
            <div v-for="t in report.tagAnalysis" :key="t.tag" class="tag-row">
              <span class="tag-row__tag">{{ t.tag }}</span>
              <span class="tag-row__posts">{{ t.posts }} 篇</span>
              <span class="tag-row__views">均 {{ formatNum(t.avgViews) }} 阅读</span>
              <span class="tag-row__traffic">🔍 {{ t.externalTraffic }} 搜索</span>
            </div>
          </a-card>

          <!-- 发布时间建议 -->
          <a-card :bordered="false" title="⏰ 发布时间建议" size="small">
            <ClockCircleOutlined style="color:#1677ff;margin-right:6px" />
            <span style="font-size:13px;color:#555">{{ report.timingInsight }}</span>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>

    <a-empty v-else description="暂无复盘数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { ReloadOutlined, BulbOutlined, ClockCircleOutlined } from "@ant-design/icons-vue";
import { getWeeklyReport } from "../api/automation";
import type { WeeklyReport } from "../types";
import { PLATFORM_LABELS } from "../types";

const report = ref<WeeklyReport | null>(null);
const loading = ref(false);

const overviewStats = computed(() => {
  if (!report.value) return [];
  const o = report.value.overview;
  return [
    { label: "发布数", value: String(o.totalPosts), color: "#1677ff" },
    { label: "总阅读", value: formatNum(o.totalViews), color: "#52c41a" },
    { label: "总点赞", value: formatNum(o.totalLikes), color: "#fa8c16" },
    { label: "总评论", value: String(o.totalComments), color: "#722ed1" },
    { label: "涨粉", value: `+${o.followerGrowth}`, color: "#eb2f96" },
  ];
});

const platformCols = [
  { title: "平台", key: "platform", width: 170 },
  { title: "发布", dataIndex: "posts", width: 60 },
  { title: "阅读", dataIndex: "views", width: 80, customRender: ({ text }: any) => formatNum(text) },
  { title: "点赞", dataIndex: "likes", width: 80, customRender: ({ text }: any) => formatNum(text) },
  { title: "最佳内容", dataIndex: "topContent", ellipsis: true },
];

function formatNum(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function handleCreateTopics(): void {
  message.success("选题已添加到草稿箱（mock）");
}

function handleCopyAll(): void {
  const text = report.value?.suggestedTopics.map((t, i) => `${i + 1}. ${t}`).join("\n") || "";
  navigator.clipboard?.writeText(text).then(() => message.success("已复制"));
}

async function load(): Promise<void> {
  loading.value = true;
  try { report.value = await getWeeklyReport(); }
  finally { loading.value = false; }
}

onMounted(load);
</script>

<style scoped>
.review-page { max-width: 1100px; margin: 0 auto; }
.stat-card { text-align: center; }
.stat-card__value { font-size: 26px; font-weight: 800; }
.stat-card__label { font-size: 12px; color: #999; margin-top: 4px; }

.analysis-list { display: flex; flex-direction: column; gap: 12px; }
.analysis-item { display: flex; gap: 10px; align-items: flex-start; }
.analysis-item__num {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; border-radius: 50%;
  background: #f0f5ff; color: #1677ff; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
}
.analysis-item__text { font-size: 13px; line-height: 1.7; color: #333; }

.top-content__title { font-size: 16px; font-weight: 600; }
.metric-label { font-size: 12px; color: #999; margin-right: 6px; }
.metric-value { font-size: 18px; font-weight: 700; color: #333; }
.insight-box { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 8px; padding: 10px 14px; margin-top: 12px; font-size: 13px; color: #8c6900; line-height: 1.6; display: flex; gap: 8px; align-items: flex-start; }

.topic-card { background: linear-gradient(135deg, #f9f0ff, #f0f5ff); }
.topic-list { display: flex; flex-direction: column; gap: 10px; }
.topic-item { display: flex; gap: 8px; align-items: flex-start; }
.topic-item__num {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; border-radius: 50%;
  background: #722ed1; color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
}
.topic-item__text { font-size: 13px; line-height: 1.5; color: #333; }

.tag-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 12px; }
.tag-row:last-child { border-bottom: none; }
.tag-row__tag { font-weight: 600; color: #1677ff; width: 100px; }
.tag-row__posts { color: #999; width: 40px; }
.tag-row__views { color: #666; flex: 1; }
.tag-row__traffic { color: #52c41a; flex-shrink: 0; }
</style>
