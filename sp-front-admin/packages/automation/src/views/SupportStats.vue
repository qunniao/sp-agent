<template>
  <div class="page-container">
    <a-page-header title="客服数据" sub-title="AI 客服阿服的工作数据" style="padding:0;margin-bottom:16px" />
    <a-spin :spinning="loading" v-if="stats">
      <!-- 概览 -->
      <a-row :gutter="16" style="margin-bottom:16px">
        <a-col :span="6" v-for="s in overview" :key="s.label">
          <a-card :bordered="false" size="small" class="stat-card">
            <div class="stat-card__value" :style="{ color: s.color }">{{ s.value }}</div>
            <div class="stat-card__label">{{ s.label }}</div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <!-- AI vs 人工 -->
        <a-col :span="12">
          <a-card :bordered="false" title="🤖 AI 处理 vs 👤 人工处理" size="small" style="margin-bottom:16px">
            <div style="margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
                <span>AI 自动解决 ({{ stats.thisWeek.aiResolved }})</span><span>{{ Math.round(stats.thisWeek.aiResolved/stats.thisWeek.total*100) }}%</span>
              </div>
              <div class="comp-bar"><div class="comp-bar__fill comp-bar__fill--ai" :style="{ width: (stats.thisWeek.aiResolved/stats.thisWeek.total*100)+'%' }"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
                <span>需要人工介入 ({{ stats.thisWeek.humanResolved }})</span><span>{{ Math.round(stats.thisWeek.humanResolved/stats.thisWeek.total*100) }}%</span>
              </div>
              <div class="comp-bar"><div class="comp-bar__fill comp-bar__fill--human" :style="{ width: (stats.thisWeek.humanResolved/stats.thisWeek.total*100)+'%' }"></div></div>
            </div>
            <a-divider style="margin:12px 0" />
            <div style="text-align:center">
              <span style="font-size:28px;font-weight:800;color:#52c41a">{{ stats.satisfaction }}%</span>
              <div style="font-size:12px;color:#999">客户满意度</div>
            </div>
          </a-card>
        </a-col>

        <!-- 常见问题 -->
        <a-col :span="12">
          <a-card :bordered="false" title="🏷️ 高频问题类型" size="small" style="margin-bottom:16px">
            <div class="issue-row" v-for="(iss, i) in stats.topIssues" :key="iss.tag">
              <span class="issue-row__rank">{{ i+1 }}</span>
              <span class="issue-row__tag">{{ iss.tag }}</span>
              <span class="issue-row__count">{{ iss.count }} 次</span>
              <div class="issue-row__bar"><div class="issue-row__fill" :style="{ width: (iss.count/maxIssue)*100+'%' }"></div></div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 周趋势 -->
      <a-card :bordered="false" title="📈 本周每日处理量" size="small">
        <div class="trend-chart">
          <div class="trend-group" v-for="d in stats.responseTrend" :key="d.date">
            <div class="trend-stack">
              <div class="trend-stack__ai" :style="{ height: Math.max(4,(d.aiResolved/maxDaily)*100)+'%' }"></div>
              <div class="trend-stack__human" :style="{ height: Math.max(4,(d.humanResolved/maxDaily)*100)+'%' }"></div>
            </div>
            <div class="trend-label">{{ d.date }}</div>
          </div>
        </div>
        <div style="display:flex;gap:20px;justify-content:center;margin-top:8px;font-size:12px;color:#999">
          <span>■ AI 自动</span><span>■ 人工</span>
        </div>
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getSupportStats } from "../api/support";
import type { SupportStats } from "../types";

const stats = ref<SupportStats | null>(null);
const loading = ref(false);
const maxIssue = computed(() => Math.max(1, ...(stats.value?.topIssues.map((i) => i.count) || [1])));
const maxDaily = computed(() => Math.max(1, ...(stats.value?.responseTrend.map((d) => d.aiResolved + d.humanResolved) || [1])));

const overview = computed(() => {
  if (!stats.value) return [];
  const s = stats.value;
  return [
    { label: "今日会话", value: String(s.today.total), color: "#1677ff" },
    { label: "AI 自动解决", value: String(s.today.aiResolved), color: "#52c41a" },
    { label: "待人工处理", value: String(s.today.pending), color: "#fa8c16" },
    { label: "平均响应", value: s.thisWeek.avgResponseTime, color: "#722ed1" },
  ];
});

onMounted(async () => { loading.value = true; try { stats.value = await getSupportStats(); } finally { loading.value = false; } });
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-card__value { font-size: 26px; font-weight: 800; }
.stat-card__label { font-size: 12px; color: #999; margin-top: 4px; }

.comp-bar { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.comp-bar__fill { height: 100%; border-radius: 4px; }
.comp-bar__fill--ai { background: #1677ff; }
.comp-bar__fill--human { background: #52c41a; }

.issue-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.issue-row__rank { font-weight: 700; color: #bbb; width: 16px; }
.issue-row__tag { width: 70px; }
.issue-row__count { color: #999; width: 36px; font-size: 12px; }
.issue-row__bar { flex: 1; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.issue-row__fill { height: 100%; background: #fa8c16; border-radius: 3px; }

.trend-chart { display: flex; align-items: flex-end; gap: 8px; height: 130px; }
.trend-group { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.trend-stack { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; width: 70%; }
.trend-stack__ai { background: #1677ff; border-radius: 2px 2px 0 0; min-height: 4px; }
.trend-stack__human { background: #52c41a; border-radius: 2px 2px 0 0; min-height: 4px; }
.trend-label { font-size: 10px; color: #bbb; margin-top: 4px; }
</style>
