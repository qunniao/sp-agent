<template>
  <div class="page-container">
    <a-page-header title="数据看板" sub-title="跨平台数据一览" style="padding:0;margin-bottom:16px" />

    <a-spin :spinning="loading">
      <!-- 平台卡片 -->
      <a-row :gutter="16">
        <a-col :span="8" v-for="m in metrics" :key="m.accountId">
          <a-card :bordered="false" hoverable class="platform-card">
            <div class="platform-card__head">
              <a-avatar :src="m.avatar" :size="40" />
              <div>
                <div class="platform-card__name">
                  {{ m.nickname }}
                  <a-tag size="small">{{ PLATFORM_LABELS[m.platform] }}</a-tag>
                </div>
                <div class="platform-card__followers">
                  {{ formatNum(m.followers) }} 粉丝
                  <span :class="m.followersTrend > 0 ? 'trend-up' : 'trend-down'">
                    {{ m.followersTrend > 0 ? '↑' : '↓' }}{{ Math.abs(m.followersTrend) }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- 周数据 -->
            <a-divider style="margin:12px 0" />
            <a-row :gutter="8">
              <a-col :span="6" v-for="col in metricCols" :key="col.key">
                <div class="mini-stat">
                  <div class="mini-stat__value">{{ formatNum((m.thisWeek as any)[col.key]) }}</div>
                  <div class="mini-stat__label">{{ col.label }}</div>
                  <div :class="['mini-stat__delta', (m.thisWeek as any)[col.key] > (m.lastWeek as any)[col.key] ? 'trend-up' : 'trend-down']">
                    {{ (m.thisWeek as any)[col.key] > (m.lastWeek as any)[col.key] ? '↑' : '↓' }}{{ calcDelta((m.thisWeek as any)[col.key], (m.lastWeek as any)[col.key]) }}%
                  </div>
                </div>
              </a-col>
            </a-row>

            <!-- Top 3 内容 -->
            <a-divider style="margin:12px 0" />
            <div class="top-posts-title">📈 本周 TOP 3</div>
            <div class="top-post" v-for="(post, i) in m.topPosts.slice(0, 3)" :key="i">
              <span class="top-post__rank">#{{ i + 1 }}</span>
              <span class="top-post__title">{{ post.title.slice(0, 18) }}{{ post.title.length > 18 ? '...' : '' }}</span>
              <span class="top-post__stats">
                👁 {{ formatNum(post.views) }} ❤ {{ formatNum(post.likes) }}
              </span>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 汇总对比表 -->
      <a-card :bordered="false" title="📊 周环比汇总" style="margin-top:16px">
        <a-table :columns="summaryCols" :data-source="summaryData" :pagination="false" size="small" row-key="platform">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'platform'">
              {{ PLATFORM_LABELS[record.platform] }} {{ record.nickname }}
            </template>
            <template v-if="column.key !== 'platform' && column.key !== 'nickname'">
              <div class="summary-cell">
                <span>{{ formatNum(record.thisWeek[column.key]) }}</span>
                <span :class="record.deltas[column.key] > 0 ? 'trend-up' : 'trend-down'" style="font-size:11px">
                  {{ record.deltas[column.key] > 0 ? '↑' : '↓' }}{{ Math.abs(record.deltas[column.key]) }}%
                </span>
              </div>
            </template>
          </template>
        </a-table>
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getDashboardMetrics } from "../api/automation";
import type { PlatformMetrics } from "../types";
import { PLATFORM_LABELS } from "../types";

const metrics = ref<PlatformMetrics[]>([]);
const loading = ref(false);

const metricCols = [
  { key: "views", label: "阅读" },
  { key: "likes", label: "点赞" },
  { key: "comments", label: "评论" },
  { key: "shares", label: "分享" },
];

const summaryCols = [
  { title: "平台", key: "platform", width: 150 },
  { title: "阅读", key: "views", width: 100 },
  { title: "点赞", key: "likes", width: 100 },
  { title: "评论", key: "comments", width: 100 },
  { title: "分享", key: "shares", width: 100 },
  { title: "发布数", key: "posts", width: 80 },
];

const summaryData = computed(() =>
  metrics.value.map((m) => {
    const tw = m.thisWeek;
    const lw = m.lastWeek;
    return {
      platform: m.platform,
      nickname: m.nickname,
      thisWeek: tw,
      deltas: {
        views: lw.views ? Math.round(((tw.views - lw.views) / lw.views) * 100) : 0,
        likes: lw.likes ? Math.round(((tw.likes - lw.likes) / lw.likes) * 100) : 0,
        comments: lw.comments ? Math.round(((tw.comments - lw.comments) / lw.comments) * 100) : 0,
        shares: lw.shares ? Math.round(((tw.shares - lw.shares) / lw.shares) * 100) : 0,
        posts: lw.posts ? Math.round(((tw.posts - lw.posts) / lw.posts) * 100) : 0,
      },
    };
  })
);

function formatNum(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function calcDelta(current: number, last: number): string {
  if (!last) return "0";
  return String(Math.round(((current - last) / last) * 100));
}

onMounted(async () => {
  loading.value = true;
  try { metrics.value = await getDashboardMetrics(); }
  finally { loading.value = false; }
});
</script>

<style scoped>
.platform-card { transition: transform 0.2s; }
.platform-card:hover { transform: translateY(-2px); }
.platform-card__head { display: flex; align-items: center; gap: 12px; }
.platform-card__name { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 6px; }
.platform-card__followers { font-size: 13px; color: #666; margin-top: 2px; }
.trend-up { color: #52c41a; font-weight: 500; }
.trend-down { color: #ff4d4f; font-weight: 500; }
.mini-stat { text-align: center; }
.mini-stat__value { font-size: 16px; font-weight: 700; }
.mini-stat__label { font-size: 11px; color: #999; }
.mini-stat__delta { font-size: 11px; }
.top-posts-title { font-size: 12px; color: #999; margin-bottom: 8px; }
.top-post { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 3px 0; }
.top-post__rank { font-weight: 700; color: #999; width: 22px; }
.top-post__title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top-post__stats { flex-shrink: 0; color: #666; }
.summary-cell { display: flex; flex-direction: column; }
</style>
