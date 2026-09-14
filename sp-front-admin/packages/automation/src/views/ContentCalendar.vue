<template>
  <div class="page-container">
    <a-page-header title="内容日历" sub-title="一览本月内容计划" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-space>
          <a-button-group>
            <a-button @click="prevMonth"><LeftOutlined /></a-button>
            <a-button disabled style="min-width:100px;font-weight:600">{{ year }}年{{ month }}月</a-button>
            <a-button @click="nextMonth"><RightOutlined /></a-button>
          </a-button-group>
          <a-button @click="goToday">今天</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <a-card :bordered="false" style="margin-bottom:16px">
        <!-- 图例 -->
        <div class="legend">
          <span class="legend-item"><span class="legend-dot legend-dot--published"></span>已发布</span>
          <span class="legend-item"><span class="legend-dot legend-dot--scheduled"></span>计划中</span>
          <span class="legend-item"><span class="legend-dot legend-dot--generating"></span>AI 生成中</span>
          <span class="legend-item"><span class="legend-dot legend-dot--draft"></span>草稿</span>
        </div>
      </a-card>

      <!-- 月历网格 -->
      <div class="calendar-grid">
        <!-- 星期头 -->
        <div class="calendar-header">
          <div v-for="d in weekDays" :key="d" class="calendar-header__cell">{{ d }}</div>
        </div>
        <!-- 日期格子 -->
        <div class="calendar-body">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            :class="['calendar-cell', {
              'calendar-cell--other': !cell.isCurrentMonth,
              'calendar-cell--today': cell.isToday,
            }]"
            @click="cell.date && selectDate(cell.date)"
          >
            <div class="calendar-cell__day">{{ cell.day }}</div>
            <div class="calendar-cell__items" v-if="cell.entries.length > 0">
              <div
                v-for="e in cell.entries.slice(0, 3)"
                :key="e.id"
                :class="['cell-entry', `cell-entry--${e.status}`]"
                :title="`${e.title} (${e.accountNickname})`"
              >
                <span class="cell-entry__platform">{{ PLATFORM_SHORT[e.platform] || e.platform }}</span>
                <span class="cell-entry__dot">·</span>
                <span class="cell-entry__title">{{ e.title.slice(0, 10) }}</span>
              </div>
              <div v-if="cell.entries.length > 3" class="cell-entry__more">
                +{{ cell.entries.length - 3 }} 条
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 选中日期详情 -->
      <a-card v-if="selectedDate" :bordered="false" :title="`📅 ${selectedDate}`" style="margin-top:16px">
        <a-table
          :columns="detailColumns"
          :data-source="selectedEntries"
          row-key="id"
          size="small"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag v-if="record.status === 'published'" color="green">已发布</a-tag>
              <a-tag v-else-if="record.status === 'scheduled'" color="blue">计划中</a-tag>
              <a-tag v-else-if="record.status === 'generating'" color="purple">AI 生成中</a-tag>
              <a-tag v-else-if="record.status === 'pending_review'" color="orange">待审核</a-tag>
              <a-tag v-else>草稿</a-tag>
            </template>
            <template v-if="column.key === 'type'">
              <a-tag v-if="record.type === 'ai_auto'" color="purple" size="small">🤖 AI 自动</a-tag>
              <a-tag v-else-if="record.type === 'manual'" color="blue" size="small">✍️ 手动</a-tag>
              <a-tag v-else size="small">📝 草稿</a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { LeftOutlined, RightOutlined } from "@ant-design/icons-vue";
import { getCalendarEntries } from "../api/automation";
import type { CalendarEntry } from "../types";

const PLATFORM_SHORT: Record<string, string> = {
  xiaohongshu: "🍠",
  wechat_mp: "🟢",
  douyin: "🎵",
  weibo: "🔴",
};

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

const now = new Date();
const year = ref(now.getFullYear());
const month = ref(now.getMonth() + 1);
const loading = ref(false);
const entries = ref<CalendarEntry[]>([]);
const selectedDate = ref<string | null>(null);

const selectedEntries = computed(() =>
  selectedDate.value
    ? entries.value.filter((e) => e.date === selectedDate.value)
    : []
);

const detailColumns = [
  { title: "平台", key: "platform", width: 60 },
  { title: "账号", dataIndex: "accountNickname", width: 140 },
  { title: "内容", dataIndex: "title" },
  { title: "类型", key: "type", width: 90 },
  { title: "状态", key: "status", width: 80 },
];

interface CalendarCell {
  day: number | null;
  date: string | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  entries: CalendarEntry[];
}

const calendarCells = computed((): CalendarCell[] => {
  const y = year.value;
  const m = month.value;
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);
  const daysInMonth = lastDay.getDate();
  // 周一=0, 周日=6
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1; // 转为周一起始

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: CalendarCell[] = [];

  // 上月填充
  const prevLastDay = new Date(y, m - 1, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevLastDay - i, date: null, isCurrentMonth: false, isToday: false, entries: [] });
  }

  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      day: d,
      date: dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      entries: entries.value.filter((e) => e.date === dateStr),
    });
  }

  // 下月填充（补齐到7的倍数）
  const remain = 7 - (cells.length % 7);
  if (remain < 7) {
    for (let i = 1; i <= remain; i++) {
      cells.push({ day: i, date: null, isCurrentMonth: false, isToday: false, entries: [] });
    }
  }

  return cells;
});

function selectDate(date: string): void {
  selectedDate.value = selectedDate.value === date ? null : date;
}

function prevMonth(): void {
  if (month.value === 1) { year.value--; month.value = 12; }
  else month.value--;
  selectedDate.value = null;
  load();
}
function nextMonth(): void {
  if (month.value === 12) { year.value++; month.value = 1; }
  else month.value++;
  selectedDate.value = null;
  load();
}
function goToday(): void {
  const now2 = new Date();
  year.value = now2.getFullYear();
  month.value = now2.getMonth() + 1;
  selectedDate.value = null;
  load();
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    entries.value = await getCalendarEntries(year.value, month.value);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend-dot--published { background: #52c41a; }
.legend-dot--scheduled { background: #1677ff; }
.legend-dot--generating { background: #722ed1; }
.legend-dot--draft { background: #d9d9d9; }

/* 日历网格 */
.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #fafafa;
  border-radius: 8px 8px 0 0;
}
.calendar-header__cell {
  padding: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}
.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid #f0f0f0;
}
.calendar-cell {
  min-height: 80px;
  padding: 6px;
  border-bottom: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;
}
.calendar-cell:hover { background: #fafafa; }
.calendar-cell--other { background: #fafafa; color: #ccc; cursor: default; }
.calendar-cell--today { background: #e6f7ff; }
.calendar-cell--today .calendar-cell__day { color: #1677ff; font-weight: 700; }
.calendar-cell__day {
  font-size: 13px;
  margin-bottom: 2px;
}
.calendar-cell__items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.cell-entry {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  padding: 1px 3px;
  border-radius: 3px;
  overflow: hidden;
  white-space: nowrap;
}
.cell-entry--published { background: #f6ffed; color: #52c41a; }
.cell-entry--scheduled { background: #e6f7ff; color: #1677ff; }
.cell-entry--generating { background: #f9f0ff; color: #722ed1; }
.cell-entry--pending_review { background: #fff7e6; color: #fa8c16; }
.cell-entry--draft, .cell-entry--failed { background: #f5f5f5; color: #999; }
.cell-entry__platform { flex-shrink: 0; }
.cell-entry__title { flex: 1; overflow: hidden; text-overflow: ellipsis; }
.cell-entry__more {
  font-size: 10px;
  color: #999;
  padding: 1px 3px;
}
</style>
