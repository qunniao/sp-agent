<template>
  <div class="page-container">
    <!-- 搜索 -->
    <a-card :bordered="false" class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" style="width: 130px" @change="handleSearch">
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="success">✅ 成功</a-select-option>
            <a-select-option value="failed">❌ 失败</a-select-option>
            <a-select-option value="running">⏳ 运行中</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="工作流">
          <a-select
            v-model:value="searchForm.automationId"
            style="width: 200px"
            allow-clear
            placeholder="全部"
            @change="handleSearch"
          >
            <a-select-option value="tpl_xiaohongshu_daily">小红书每日科普</a-select-option>
            <a-select-option value="tpl_customer_followup">客户跟进提醒</a-select-option>
            <a-select-option value="tpl_weekly_report">周一自动发周报</a-select-option>
            <a-select-option value="tpl_invoice_monthly">月度财务简报</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch"><SearchOutlined /> 搜索</a-button>
            <a-button @click="handleReset"><ReloadOutlined /> 重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 表格 -->
    <a-card :bordered="false" title="执行记录">
      <a-table
        :columns="columns"
        :data-source="data"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag v-if="record.status === 'success'" color="green">成功</a-tag>
            <a-tag v-else-if="record.status === 'failed'" color="red">失败</a-tag>
            <a-tag v-else-if="record.status === 'running'" color="blue">运行中</a-tag>
            <a-tag v-else>已取消</a-tag>
          </template>
          <template v-if="column.key === 'duration'">
            <span v-if="record.finishedAt">{{ calcDuration(record.startedAt, record.finishedAt) }}</span>
            <a-tag v-else color="processing">进行中</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="showDetail(record)">详情</a-button>
              <a-button
                v-if="record.status === 'running'"
                size="small"
                danger
                @click="handleCancel(record)"
              >取消</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      :title="`执行详情 - ${selectedRecord?.automationName}`"
      width="720px"
      :footer="null"
      @cancel="detailVisible = false"
    >
      <template v-if="selectedRecord">
        <!-- 总览 -->
        <a-descriptions :column="2" size="small" bordered style="margin-bottom: 16px">
          <a-descriptions-item label="状态">
            <a-tag v-if="selectedRecord.status === 'success'" color="green">成功</a-tag>
            <a-tag v-else-if="selectedRecord.status === 'failed'" color="red">失败</a-tag>
            <a-tag v-else-if="selectedRecord.status === 'running'" color="blue">运行中</a-tag>
            <a-tag v-else>已取消</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="触发方式">{{ selectedRecord.triggeredBy }}</a-descriptions-item>
          <a-descriptions-item label="开始时间">{{ selectedRecord.startedAt }}</a-descriptions-item>
          <a-descriptions-item label="结束时间">{{ selectedRecord.finishedAt || '进行中' }}</a-descriptions-item>
          <a-descriptions-item label="总耗时" :span="2">
            {{ selectedRecord.finishedAt ? calcDuration(selectedRecord.startedAt, selectedRecord.finishedAt) : '进行中' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 步骤时间线 -->
        <div class="modal-section-title">执行步骤</div>
        <div class="step-timeline">
          <div
            v-for="(sr, si) in selectedRecord.stepResults"
            :key="sr.stepId"
            :class="['step-card', `step-card--${sr.status}`]"
          >
            <!-- 左边：序号 + 状态 + 连线 -->
            <div class="step-card__gutter">
              <div :class="['step-dot', `step-dot--${sr.status}`]">
                <template v-if="sr.status === 'success'">✓</template>
                <template v-else-if="sr.status === 'failed'">✗</template>
                <template v-else-if="sr.status === 'running'">⟳</template>
                <template v-else-if="sr.status === 'skipped'">−</template>
                <template v-else>{{ si + 1 }}</template>
              </div>
              <div v-if="si < selectedRecord.stepResults.length - 1" class="step-line"></div>
            </div>

            <!-- 右边：内容 -->
            <div class="step-card__body">
              <div class="step-card__header">
                <span class="step-card__index">{{ si + 1 }}.</span>
                <span class="step-card__title">{{ sr.stepTitle }}</span>
                <span class="step-card__meta">
                  {{ sr.startedAt ? sr.startedAt.slice(11, 19) : '--:--:--' }}
                  <template v-if="sr.duration != null">
                    · {{ sr.duration >= 1000 ? (sr.duration / 1000).toFixed(1) + 's' : sr.duration + 'ms' }}
                  </template>
                </span>
              </div>

              <!-- 多智能体对话 -->
              <div v-if="sr.messages && sr.messages.length > 0" class="agent-chat">
                <div class="agent-chat__title">🤝 智能体协作过程</div>
                <div class="agent-chat__bubbles">
                  <div
                    v-for="(msg, mi) in sr.messages"
                    :key="mi"
                    :class="['agent-bubble', `agent-bubble--${msg.role.includes('审查') || msg.role.includes('确认') ? 'review' : msg.role.includes('修订') ? 'revise' : 'create'}`]"
                  >
                    <div class="agent-bubble__head">
                      <span class="agent-bubble__from">{{ msg.from }}</span>
                      <a-tag size="small" :color="msg.role.includes('审查')||msg.role.includes('确认')?'orange':msg.role.includes('修订')?'purple':'blue'">
                        {{ msg.role }}
                      </a-tag>
                      <span class="agent-bubble__time">{{ msg.at }}</span>
                    </div>
                    <pre class="agent-bubble__text">{{ msg.text }}</pre>
                  </div>
                </div>
              </div>

              <!-- 输出 -->
              <div v-if="sr.status === 'success' && sr.output" :class="['step-card__output', { 'step-card__output--ai': isAiContent(sr.output) }]">
                <div class="step-card__output-head">
                  <FileTextOutlined /> 输出内容
                  <a-button type="link" size="small" @click="copyText(sr.output)">复制</a-button>
                </div>
                <pre class="step-card__output-text">{{ sr.output }}</pre>
              </div>

              <!-- 错误 -->
              <div v-if="sr.status === 'failed' && sr.error" class="step-card__error">
                <div class="step-card__error-head">
                  <WarningOutlined /> 错误信息
                  <a-button type="link" size="small" @click="copyText(sr.error)">复制</a-button>
                </div>
                <pre class="step-card__error-text">{{ sr.error }}</pre>
              </div>

              <!-- 运行中 -->
              <div v-if="sr.status === 'running'" class="step-card__running">
                <a-spin size="small" /> 正在执行...
              </div>

              <!-- 跳过 -->
              <div v-if="sr.status === 'skipped'" class="step-card__skipped">已跳过</div>
            </div>
          </div>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { SearchOutlined, ReloadOutlined, FileTextOutlined, WarningOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import type { TablePaginationConfig } from "ant-design-vue";
import { getExecutions, cancelExecution } from "../api/execution";
import type { ExecutionRecord } from "../types";

// ==================== 列定义 ====================
const columns = [
  { title: "工作流", dataIndex: "automationName", key: "name", width: 180 },
  { title: "触发方式", dataIndex: "triggeredBy", key: "trigger", width: 90 },
  { title: "状态", key: "status", width: 80 },
  { title: "耗时", key: "duration", width: 100 },
  { title: "开始时间", dataIndex: "startedAt", key: "startedAt", width: 170 },
  { title: "操作", key: "action", width: 120 },
];

// ==================== 搜索 ====================
const searchForm = reactive({ status: "all", automationId: undefined as string | undefined });
function handleSearch(): void {
  pagination.current = 1;
  fetchData();
}
function handleReset(): void {
  searchForm.status = "all";
  searchForm.automationId = undefined;
  pagination.current = 1;
  fetchData();
}

// ==================== 数据 ====================
const data = ref<ExecutionRecord[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ["10", "20", "50"],
  showTotal: (total: number) => `共 ${total} 条`,
});

function handleTableChange(pag: TablePaginationConfig): void {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    const res = await getExecutions({
      page: pagination.current as number,
      pageSize: pagination.pageSize as number,
      status: searchForm.status === "all" ? undefined : searchForm.status,
      automationId: searchForm.automationId,
    });
    data.value = res.records;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

// ==================== 详情弹窗 ====================
const detailVisible = ref(false);
const selectedRecord = ref<ExecutionRecord | null>(null);

function showDetail(record: ExecutionRecord): void {
  selectedRecord.value = record;
  detailVisible.value = true;
}

// ==================== 工具函数 ====================
function calcDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (diff < 1000) return `${diff}ms`;
  return `${(diff / 1000).toFixed(1)}s`;
}

function isAiContent(output: string): boolean {
  return output.length > 60;
}

function copyText(text: string): void {
  navigator.clipboard?.writeText(text).then(() => message.success("已复制")).catch(() => message.info("请手动复制"));
}

async function handleCancel(record: ExecutionRecord): Promise<void> {
  try {
    await cancelExecution(record.id);
    message.success("已取消");
    fetchData();
  } catch {
    message.error("取消失败");
  }
}

onMounted(fetchData);
</script>

<style scoped>
.search-form {
  margin-bottom: 16px;
}

/* ====== 弹窗内 ====== */
.modal-section-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
  color: #333;
}

/* ====== 步骤时间线 ====== */
.step-timeline {
  position: relative;
}

.step-card {
  display: flex;
  gap: 0;
}

/* 左侧装订线 */
.step-card__gutter {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32px;
  flex-shrink: 0;
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  z-index: 1;
}
.step-dot--success { background: #52c41a; }
.step-dot--failed  { background: #ff4d4f; }
.step-dot--running { background: #1677ff; animation: pulse 1.5s infinite; }
.step-dot--skipped { background: #d9d9d9; color: #999; }
.step-dot--pending { background: #f0f0f0; color: #999; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(22, 119, 255, 0.4); }
  50%      { box-shadow: 0 0 0 6px rgba(22, 119, 255, 0); }
}

.step-line {
  width: 2px;
  flex: 1;
  min-height: 20px;
  background: #e8e8e8;
  margin: 4px 0;
}

/* 右侧卡片 */
.step-card__body {
  flex: 1;
  margin-left: 12px;
  margin-bottom: 16px;
}

.step-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
}
.step-card__index {
  font-weight: 600;
  color: #999;
  font-size: 13px;
}
.step-card__title {
  font-weight: 500;
  font-size: 14px;
}
.step-card__meta {
  margin-left: auto;
  font-size: 12px;
  color: #999;
  font-variant-numeric: tabular-nums;
}

/* 输出 */
.step-card__output,
.step-card__error {
  border-radius: 6px;
  overflow: hidden;
}
.step-card__output {
  border: 1px solid #d9f7be;
}
.step-card__output--ai {
  border-color: #efdbff;
}
.step-card__output-head,
.step-card__error-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  background: #f6ffed;
}
.step-card__output--ai .step-card__output-head {
  background: #f9f0ff;
}
.step-card__output-head { color: #52c41a; }
.step-card__error-head { color: #ff4d4f; background: #fff2f0; }

.step-card__output-text,
.step-card__error-text {
  margin: 0;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 320px;
  overflow-y: auto;
  font-family: inherit;
}
.step-card__output-text {
  color: #333;
  background: #fff;
}
.step-card__error-text {
  color: #cf1322;
  background: #fff;
}

.step-card__error {
  border: 1px solid #ffccc7;
}

.step-card__running {
  padding: 8px 0;
  color: #1677ff;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.step-card__skipped {
  padding: 8px 0;
  color: #999;
  font-size: 13px;
}

/* 智能体对话 */
.agent-chat {
  margin-bottom: 10px;
}
.agent-chat__title {
  font-weight: 600;
  font-size: 13px;
  color: #722ed1;
  margin-bottom: 8px;
}
.agent-chat__bubbles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.agent-bubble {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}
.agent-bubble--create {
  border-left: 3px solid #1677ff;
}
.agent-bubble--review {
  border-left: 3px solid #fa8c16;
}
.agent-bubble--revise {
  border-left: 3px solid #722ed1;
}
.agent-bubble__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fafafa;
  font-size: 12px;
}
.agent-bubble__from {
  font-weight: 500;
}
.agent-bubble__time {
  margin-left: auto;
  color: #999;
  font-size: 11px;
}
.agent-bubble__text {
  margin: 0;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: #333;
  font-family: inherit;
  background: #fff;
}
</style>
