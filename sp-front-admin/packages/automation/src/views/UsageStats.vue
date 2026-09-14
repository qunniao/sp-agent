<template>
  <div class="page-container">
    <a-page-header title="用量统计" sub-title="AI API 调用情况一览" style="padding:0;margin-bottom:16px" />

    <a-spin :spinning="loading" v-if="stats">
      <!-- 总览 -->
      <a-row :gutter="16" style="margin-bottom:16px">
        <a-col :span="6">
          <a-card :bordered="false" size="small" class="stat-card">
            <div class="stat-card__value">{{ stats.thisWeek.totalCalls }}</div>
            <div class="stat-card__label">本周调用次数</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card :bordered="false" size="small" class="stat-card">
            <div class="stat-card__value">{{ formatTokens(stats.thisWeek.totalTokens) }}</div>
            <div class="stat-card__label">本周 Token</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card :bordered="false" size="small" class="stat-card">
            <div class="stat-card__value">¥{{ stats.thisWeek.estimatedCost.toFixed(2) }}</div>
            <div class="stat-card__label">
              预估费用
              <span :class="stats.thisWeek.costTrend > 0 ? 'trend-up' : 'trend-down'">
                {{ stats.thisWeek.costTrend > 0 ? '↑' : '↓' }}{{ Math.abs(stats.thisWeek.costTrend) }}%
              </span>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card :bordered="false" size="small" class="stat-card">
            <div class="stat-card__value">{{ (stats.thisWeek.totalTokens / stats.thisWeek.totalCalls / 1000).toFixed(1) }}k</div>
            <div class="stat-card__label">平均 Token/次</div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <!-- 按工作流分布 -->
        <a-col :span="12">
          <a-card :bordered="false" title="📊 按工作流分布" style="margin-bottom:16px">
            <div class="wf-item" v-for="(wf, i) in stats.byWorkflow" :key="i">
              <div class="wf-item__head">
                <span class="wf-item__name">{{ wf.name }}</span>
                <span class="wf-item__pct">{{ wf.percentage }}%</span>
              </div>
              <div class="wf-item__bar-wrap">
                <div class="wf-item__bar" :style="{ width: wf.percentage + '%', background: BAR_COLORS[i % BAR_COLORS.length] }"></div>
              </div>
              <div class="wf-item__foot">
                <span>{{ wf.calls }} 次调用</span>
                <span>¥{{ wf.cost.toFixed(2) }}</span>
              </div>
            </div>
          </a-card>
        </a-col>

        <!-- 趋势图 -->
        <a-col :span="12">
          <a-card :bordered="false" title="📈 近 30 天趋势" style="margin-bottom:16px">
            <div class="trend-chart">
              <div class="trend-bar-group" v-for="(d, i) in visibleTrend" :key="i">
                <div class="trend-bar-col">
                  <div
                    class="trend-bar"
                    :style="{ height: Math.max(4, (d.calls / maxCalls) * 100) + '%' }"
                    :title="`${d.date}: ${d.calls} 次`"
                  ></div>
                </div>
                <div class="trend-date" v-if="i % 5 === 0">{{ d.date.slice(5) }}</div>
              </div>
            </div>
            <div class="trend-summary">
              过去 30 天合计 {{ trendTotalCalls }} 次调用，{{ formatTokens(trendTotalTokens) }} Token
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 费用估算说明 -->
      <a-card :bordered="false" size="small">
        <a-alert
          message="以上费用基于 Claude API 标准定价估算（$15/百万 input token, $75/百万 output token）。实际费用以 API 账单为准。当前为模拟数据。"
          type="info"
          show-icon
        />
      </a-card>
    </a-spin>

    <a-empty v-else description="暂无数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getUsageStats } from "../api/automation";
import type { UsageStats } from "../types";

const stats = ref<UsageStats | null>(null);
const loading = ref(false);

const BAR_COLORS = ["#1677ff", "#52c41a", "#fa8c16", "#722ed1", "#eb2f96"];

const maxCalls = computed(() => Math.max(...(stats.value?.dailyTrend.map((d) => d.calls) || [1]), 1));
const visibleTrend = computed(() => stats.value?.dailyTrend || []);
const trendTotalCalls = computed(() => stats.value?.dailyTrend.reduce((s, d) => s + d.calls, 0) || 0);
const trendTotalTokens = computed(() => stats.value?.dailyTrend.reduce((s, d) => s + d.tokens, 0) || 0);

function formatTokens(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}

onMounted(async () => {
  loading.value = true;
  try { stats.value = await getUsageStats(); }
  finally { loading.value = false; }
});
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-card__value { font-size: 24px; font-weight: 800; color: #1677ff; }
.stat-card__label { font-size: 12px; color: #999; margin-top: 2px; }
.trend-up { color: #ff4d4f; }
.trend-down { color: #52c41a; }

.wf-item { margin-bottom: 14px; }
.wf-item:last-child { margin-bottom: 0; }
.wf-item__head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
.wf-item__name { font-weight: 500; }
.wf-item__pct { color: #999; }
.wf-item__bar-wrap { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.wf-item__bar { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.wf-item__foot { display: flex; justify-content: space-between; font-size: 11px; color: #bbb; margin-top: 2px; }

.trend-chart { display: flex; align-items: flex-end; gap: 2px; height: 140px; padding-top: 10px; }
.trend-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.trend-bar-col { flex: 1; display: flex; align-items: flex-end; width: 100%; }
.trend-bar { width: 80%; border-radius: 2px 2px 0 0; background: #1677ff; min-width: 3px; transition: height 0.4s; }
.trend-date { font-size: 9px; color: #bbb; margin-top: 4px; white-space: nowrap; }
.trend-summary { text-align: center; font-size: 12px; color: #999; margin-top: 8px; }
</style>
