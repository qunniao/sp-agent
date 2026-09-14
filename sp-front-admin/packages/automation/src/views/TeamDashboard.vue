<template>
  <div class="page-container">
    <a-page-header title="虚拟团队" sub-title="AI 员工的工作数据一览" style="padding:0;margin-bottom:16px" />

    <a-spin :spinning="loading">
      <!-- 概览卡（含环比） -->
      <a-row :gutter="16" style="margin-bottom:16px">
        <a-col :span="6" v-for="s in stats" :key="s.label">
          <a-card :bordered="false" size="small" class="stat-card">
            <div class="stat-card__value" :style="{ color: s.color }">{{ s.thisWeek }}</div>
            <div class="stat-card__label">{{ s.label }}</div>
            <div class="stat-card__compare">
              上周 {{ s.lastWeek }}
              <span :class="s.trend > 0 ? 'trend-up' : 'trend-down'" v-if="s.trend">
                {{ s.trend > 0 ? '↑' : '↓' }}{{ Math.abs(s.trend) }}%
              </span>
              <span v-else style="color:#999">→持平</span>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <!-- 员工任务分布 -->
        <a-col :span="14">
          <a-card :bordered="false" title="📊 本周任务分布" size="small" style="margin-bottom:16px">
            <div class="task-dist" v-for="e in employees" :key="e.id">
              <div class="task-dist__head">
                <span>{{ e.avatar }} {{ e.name }}</span>
                <span class="task-dist__dept">{{ DEPARTMENT_MAP[e.department]?.label }}</span>
                <span class="task-dist__count">{{ e.usageCount }} 次</span>
              </div>
              <div class="task-dist__bar">
                <div class="task-dist__fill" :style="{ width: (e.usageCount / maxUsage) * 100 + '%', background: deptColor(e.department) }"></div>
              </div>
            </div>
          </a-card>
        </a-col>

        <!-- 部门分布 + 活跃度 -->
        <a-col :span="10">
          <a-card :bordered="false" title="🏢 部门分布" size="small" style="margin-bottom:16px">
            <div class="dept-row" v-for="(d, k) in deptBreakdown" :key="k">
              <span>{{ DEPARTMENT_MAP[k]?.icon }}</span>
              <span>{{ DEPARTMENT_MAP[k]?.label }}</span>
              <span class="dept-row__count">{{ d.count }}人</span>
              <span class="dept-row__tasks">{{ d.tasks }} 次任务</span>
            </div>
          </a-card>

          <a-card :bordered="false" title="⚡ 活跃度排名" size="small">
            <div class="rank-list">
              <div class="rank-item" v-for="(e, i) in rankedEmployees" :key="e.id">
                <span class="rank-item__pos" :style="{ color: i === 0 ? '#faad14' : i === 1 ? '#a0a0a0' : i === 2 ? '#cd7f32' : '#999' }">
                  {{ i + 1 }}
                </span>
                <span>{{ e.avatar }}</span>
                <span class="rank-item__name">{{ e.name }}</span>
                <span class="rank-item__role">{{ e.role }}</span>
                <span class="rank-item__count">{{ e.usageCount }}次</span>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 7日趋势 -->
      <a-card :bordered="false" title="📈 近 7 天任务完成趋势" size="small" style="margin-bottom:16px">
        <div class="trend-chart">
          <div class="trend-bar-group" v-for="d in dailyTrend" :key="d.date">
            <div class="trend-bar-label">{{ d.count }}</div>
            <div class="trend-bar-col">
              <div class="trend-bar" :style="{ height: Math.max(4, (d.count / maxDaily) * 100) + '%' }" :title="`${d.date}: ${d.count} 个任务`"></div>
            </div>
            <div class="trend-date">{{ d.date.slice(5) }}</div>
          </div>
        </div>
      </a-card>

      <!-- 最近完成 -->
      <a-card :bordered="false" title="📋 最近完成的任务" size="small">
        <a-table :columns="taskCols" :data-source="recentTasks" :pagination="false" size="small" row-key="id" />
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getEmployees } from "../api/automation";
import type { VirtualEmployee, EmployeeDepartment } from "../types";
import { DEPARTMENT_MAP } from "../types";

const employees = ref<VirtualEmployee[]>([]);
const loading = ref(false);
const maxUsage = computed(() => Math.max(1, ...employees.value.map((e) => e.usageCount)));

const stats = computed(() => {
  const total = employees.value.reduce((s, e) => s + e.usageCount, 0);
  const active = employees.value.filter((e) => e.usageCount > 5).length;
  return [
    { label: "员工总数", thisWeek: "7", lastWeek: "7", color: "#1677ff", trend: 0 },
    { label: "本周任务", thisWeek: String(total), lastWeek: "168", color: "#52c41a", trend: 12 },
    { label: "活跃员工", thisWeek: `${active}/${employees.value.length}`, lastWeek: "6/7", color: "#fa8c16", trend: 0 },
    { label: "部门数", thisWeek: "7", lastWeek: "7", color: "#722ed1", trend: 0 },
  ];
});

// Mock 7 天趋势
const dailyTrend = [
  { date: "06/22", count: 18 }, { date: "06/23", count: 24 }, { date: "06/24", count: 21 },
  { date: "06/25", count: 29 }, { date: "06/26", count: 35 }, { date: "06/27", count: 32 },
  { date: "06/28", count: 29 },
];
const maxDaily = Math.max(...dailyTrend.map((d) => d.count));

const deptBreakdown = computed(() => {
  const map: Record<string, { count: number; tasks: number }> = {};
  for (const e of employees.value) {
    if (!map[e.department]) map[e.department] = { count: 0, tasks: 0 };
    map[e.department].count++;
    map[e.department].tasks += e.usageCount;
  }
  return map;
});

const rankedEmployees = computed(() => [...employees.value].sort((a, b) => b.usageCount - a.usageCount));

const taskCols = [
  { title: "员工", key: "emp", width: 100, customRender: ({ record }: any) => `${record.avatar} ${record.name}` },
  { title: "任务", dataIndex: "task", ellipsis: true },
  { title: "时间", dataIndex: "time", width: 100 },
];

const mockTasks = [
  { id: "1", avatar: "📣", name: "阿市", task: "生成小红书选题「AI工具对比」", time: "今天 09:00" },
  { id: "2", avatar: "📈", name: "阿销", task: "生成客户张三的跟进消息", time: "今天 11:00" },
  { id: "3", avatar: "⚙️", name: "阿运", task: "拆解新功能开发任务为 5 个子任务", time: "今天 10:00" },
  { id: "4", avatar: "💰", name: "阿财", task: "生成 6 月收支报表", time: "昨天 09:00" },
  { id: "5", avatar: "💻", name: "阿技", task: "审查用户管理模块代码，发现 1 个严重问题", time: "昨天 15:00" },
  { id: "6", avatar: "📣", name: "阿市", task: "分析上周内容数据并给出优化建议", time: "昨天 14:30" },
  { id: "7", avatar: "⚖️", name: "阿法", task: "审查服务合同第 5.2 条款", time: "6/25 11:00" },
  { id: "8", avatar: "🎧", name: "阿服", task: "回复客户李四的技术咨询", time: "今天 08:30" },
];

const recentTasks = ref(mockTasks);

function deptColor(dept: EmployeeDepartment): string {
  const map: Record<string, string> = {
    finance: "#f5222d", sales: "#fa8c16", operation: "#1677ff",
    marketing: "#52c41a", support: "#13c2c2", tech: "#722ed1", legal: "#eb2f96",
  };
  return map[dept] || "#999";
}

onMounted(async () => { loading.value = true; try { employees.value = await getEmployees(); } finally { loading.value = false; } });
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-card__value { font-size: 26px; font-weight: 800; }
.stat-card__label { font-size: 12px; color: #999; margin-top: 4px; }
.stat-card__compare { font-size: 11px; color: #bbb; margin-top: 6px; padding-top: 6px; border-top: 1px solid #f5f5f5; }

.task-dist { margin-bottom: 10px; }
.task-dist__head { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 3px; }
.task-dist__dept { font-size: 11px; color: #bbb; }
.task-dist__count { margin-left: auto; font-size: 12px; color: #666; }
.task-dist__bar { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.task-dist__fill { height: 100%; border-radius: 3px; transition: width 0.6s; }

.dept-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
.dept-row:last-child { border: none; }
.dept-row__count { margin-left: auto; color: #999; }
.dept-row__tasks { color: #666; min-width: 60px; text-align: right; }

.rank-list { display: flex; flex-direction: column; gap: 6px; }
.rank-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.rank-item__pos { font-weight: 700; width: 16px; text-align: center; }
.rank-item__name { font-weight: 500; width: 40px; }
.rank-item__role { color: #999; font-size: 12px; flex: 1; }
.rank-item__count { color: #666; font-size: 12px; }

.trend-up { color: #52c41a; font-size: 11px; }
.trend-down { color: #ff4d4f; font-size: 11px; }

/* 趋势图 */
.trend-chart { display: flex; align-items: flex-end; gap: 8px; height: 140px; padding: 8px 0 0; }
.trend-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.trend-bar-col { flex: 1; display: flex; align-items: flex-end; width: 100%; justify-content: center; }
.trend-bar-label { font-size: 11px; font-weight: 600; color: #1677ff; margin-bottom: 4px; }
.trend-bar { width: 60%; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, #1677ff, #69b1ff); min-height: 4px; transition: height 0.6s; }
.trend-date { font-size: 10px; color: #bbb; margin-top: 4px; }
</style>
