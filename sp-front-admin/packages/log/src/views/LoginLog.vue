<template>
  <div class="page-container">
    <!-- ====== 搜索区域 ====== -->
    <a-card :bordered="false" class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="用户名">
          <a-input v-model:value="searchForm.username" placeholder="请输入" allow-clear
            @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="登录状态">
          <a-select v-model:value="searchForm.status" placeholder="全部" allow-clear style="width:120px">
            <a-select-option :value="1">成功</a-select-option>
            <a-select-option :value="0">失败</a-select-option>
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
    <a-card :bordered="false" title="登录日志">
      <template #extra>
        <a-button @click="handleExport"><DownloadOutlined /> 导出</a-button>
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
import { getLoginLogs } from "../api/loginLog";
import type { LoginLogRecord } from "../types";
import { useExport, type ExportColumn } from "@sp/core";

// ==================== 表格列 ====================
const columns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "用户名", dataIndex: "username", key: "username" },
  { title: "IP地址", dataIndex: "ip", key: "ip", width: 130 },
  { title: "浏览器", dataIndex: "browser", key: "browser" },
  { title: "操作系统", dataIndex: "os", key: "os" },
  { title: "状态", key: "status", width: 70 },
  { title: "登录时间", dataIndex: "loginTime", key: "loginTime", width: 170 },
];

// ==================== 搜索 ====================
const searchForm = reactive({
  username: "",
  status: undefined as number | undefined,
  timeRange: undefined as [Dayjs, Dayjs] | undefined,
});

function handleSearch(): void {
  pagination.current = 1;
  fetchData();
}

function handleReset(): void {
  searchForm.username = "";
  searchForm.status = undefined;
  searchForm.timeRange = undefined;
  pagination.current = 1;
  fetchData();
}

// ==================== 数据 ====================
const data = ref<LoginLogRecord[]>([]);
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
    const result = await getLoginLogs({
      username: searchForm.username || undefined,
      status: searchForm.status,
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
const { exportCSV } = useExport({ filename: "登录日志" });

const exportColumns: ExportColumn[] = [
  { title: "ID", dataIndex: "id" },
  { title: "用户名", dataIndex: "username" },
  { title: "IP地址", dataIndex: "ip" },
  { title: "浏览器", dataIndex: "browser" },
  { title: "操作系统", dataIndex: "os" },
  { title: "状态", dataIndex: "status", format: (v) => (v === 1 ? "成功" : "失败") },
  { title: "登录时间", dataIndex: "loginTime" },
];

function handleExport(): void {
  exportCSV(exportColumns, data.value as unknown as Record<string, unknown>[]);
}

onMounted(() => {
  fetchData();
});
</script>
