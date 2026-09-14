<template>
  <div class="page-container">
    <a-card :bordered="false" title="字典数据管理">
      <template #extra>
        <a-space>
          <a-button @click="handleExport"><DownloadOutlined /> 导出</a-button>
          <a-button type="primary"><PlusOutlined /> 新增数据</a-button>
        </a-space>
      </template>
      <a-table :columns="columns" :data-source="mockData" row-key="id" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? "启用" : "禁用" }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small">编辑</a-button>
              <a-button type="link" size="small" danger>删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import { useExport, type ExportColumn } from "@sp/core";

const columns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "字典标签", dataIndex: "label", key: "label" },
  { title: "字典值", dataIndex: "value", key: "value" },
  { title: "排序", dataIndex: "sort", key: "sort", width: 60 },
  { title: "状态", key: "status", width: 80 },
  { title: "备注", dataIndex: "remark", key: "remark" },
  { title: "操作", key: "action", width: 160 },
];

const mockData = ref([
  { id: 1, label: "男", value: "0", sort: 1, status: 1, remark: "" },
  { id: 2, label: "女", value: "1", sort: 2, status: 1, remark: "" },
  { id: 3, label: "未知", value: "2", sort: 3, status: 1, remark: "" },
]);

// ---- 导出 ----
const { exportCSV } = useExport({ filename: "字典数据" });

const exportColumns: ExportColumn[] = [
  { title: "ID", dataIndex: "id" },
  { title: "字典标签", dataIndex: "label" },
  { title: "字典值", dataIndex: "value" },
  { title: "排序", dataIndex: "sort" },
  { title: "状态", dataIndex: "status", format: (v) => (v === 1 ? "启用" : "禁用") },
  { title: "备注", dataIndex: "remark" },
];

function handleExport(): void {
  exportCSV(exportColumns, mockData.value as unknown as Record<string, unknown>[]);
}
</script>
