<template>
  <div class="page-container">
    <!-- ====== 搜索区域 ====== -->
    <a-card :bordered="false" class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="操作人">
          <a-input v-model:value="searchForm.operator" placeholder="请输入" allow-clear
            @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="操作类型">
          <a-select v-model:value="searchForm.action" placeholder="全部" allow-clear style="width:150px">
            <a-select-option value="用户管理">用户管理</a-select-option>
            <a-select-option value="角色管理">角色管理</a-select-option>
            <a-select-option value="菜单管理">菜单管理</a-select-option>
            <a-select-option value="系统配置">系统配置</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="时间范围">
          <a-range-picker v-model:value="searchForm.timeRange" />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch"><SearchOutlined /> 搜索</a-button>
            <a-button @click="handleReset"><ReloadOutlined /> 重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- ====== 表格区域 ====== -->
    <a-card :bordered="false" title="操作日志">
      <template #extra>
        <a-space>
          <a-button @click="handleExport"><DownloadOutlined /> 导出</a-button>
          <ColumnSettings
            v-model:open="colSettingsOpen"
            :column-configs="colConfigs"
            @toggle="toggleCol"
            @select-all="selectAllCols"
            @reset-defaults="resetColDefaults"
          />
        </a-space>
      </template>
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
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? "成功" : "失败" }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import type { Dayjs } from "dayjs";
import type { TablePaginationConfig } from "ant-design-vue";
import { getOperationLogs } from "../api/operationLog";
import type { OperationLogRecord } from "../types";
import { computed } from "vue";
import { useExport, type ExportColumn, useColumnSetting, ColumnSettings } from "@sp/core";

// ==================== 表格列 ====================
const allColumns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "操作人", dataIndex: "operator", key: "operator" },
  { title: "操作类型", dataIndex: "action", key: "action" },
  { title: "请求方法", dataIndex: "method", key: "method", width: 80 },
  { title: "请求路径", dataIndex: "path", key: "path" },
  { title: "IP地址", dataIndex: "ip", key: "ip", width: 130 },
  { title: "状态", key: "status", width: 70 },
  { title: "操作时间", dataIndex: "createTime", key: "createTime", width: 170 },
];

// 列自定义
const {
  visibleColumns: colVisibility,
  columnConfigs: colConfigs,
  settingsOpen: colSettingsOpen,
  toggleColumn: toggleCol,
  selectAll: selectAllCols,
  resetDefaults: resetColDefaults,
} = useColumnSetting("operation_log", allColumns.map((c) => ({
  key: c.key,
  title: typeof c.title === "string" ? c.title : c.key,
  required: c.key === "id",
})));

const columns = computed(() =>
  allColumns.filter((c) => colVisibility.value.some((v) => v.key === c.key))
);

// ==================== 搜索 ====================
const searchForm = reactive({
  operator: "",
  action: undefined as string | undefined,
  timeRange: undefined as [Dayjs, Dayjs] | undefined,
});

function handleSearch(): void {
  pagination.current = 1;
  fetchData();
}

function handleReset(): void {
  searchForm.operator = "";
  searchForm.action = undefined;
  searchForm.timeRange = undefined;
  pagination.current = 1;
  fetchData();
}

// ==================== 数据 ====================
const data = ref<OperationLogRecord[]>([]);
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
    const result = await getOperationLogs({
      operator: searchForm.operator || undefined,
      action: searchForm.action,
      startTime: searchForm.timeRange?.[0]?.format("YYYY-MM-DD HH:mm:ss"),
      endTime: searchForm.timeRange?.[1]?.format("YYYY-MM-DD HH:mm:ss"),
      page: pagination.current as number,
      pageSize: pagination.pageSize as number,
    });
    data.value = result.records;
    pagination.total = result.total;
  } catch {
    data.value = [];
  } finally {
    loading.value = false;
  }
}

// ==================== 导出 ====================
const { exportCSV } = useExport({ filename: "操作日志" });

const exportColumns: ExportColumn[] = [
  { title: "ID", dataIndex: "id" },
  { title: "操作人", dataIndex: "operator" },
  { title: "操作类型", dataIndex: "action" },
  { title: "请求方法", dataIndex: "method" },
  { title: "请求路径", dataIndex: "path" },
  { title: "IP地址", dataIndex: "ip" },
  { title: "状态", dataIndex: "status", format: (v) => (v === 1 ? "成功" : "失败") },
  { title: "操作时间", dataIndex: "createTime" },
];

function handleExport(): void {
  exportCSV(exportColumns, data.value as unknown as Record<string, unknown>[]);
}

onMounted(() => {
  fetchData();
});
</script>
