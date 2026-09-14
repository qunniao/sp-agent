<template>
  <div class="page-container">
    <a-card :bordered="false" title="字典类型管理">
      <template #extra>
        <a-space>
          <a-button @click="handleExport"><DownloadOutlined /> 导出</a-button>
          <a-button type="primary"><PlusOutlined /> 新增字典</a-button>
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
              <a-button type="link" size="small">字典数据</a-button>
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
  { title: "字典名称", dataIndex: "name", key: "name" },
  { title: "字典编码", dataIndex: "code", key: "code" },
  { title: "状态", key: "status", width: 80 },
  { title: "备注", dataIndex: "remark", key: "remark" },
  { title: "创建时间", dataIndex: "createTime", key: "createTime" },
  { title: "操作", key: "action", width: 240 },
];

const mockData = ref([
  { id: 1, name: "性别", code: "gender", status: 1, remark: "用户性别", createTime: "2024-01-01 10:00:00" },
  { id: 2, name: "订单状态", code: "order_status", status: 1, remark: "订单状态枚举", createTime: "2024-01-02 10:00:00" },
]);

// ---- 导出 ----
const { exportCSV } = useExport({ filename: "字典类型" });

const exportColumns: ExportColumn[] = [
  { title: "ID", dataIndex: "id" },
  { title: "字典名称", dataIndex: "name" },
  { title: "字典编码", dataIndex: "code" },
  { title: "状态", dataIndex: "status", format: (v) => (v === 1 ? "启用" : "禁用") },
  { title: "备注", dataIndex: "remark" },
  { title: "创建时间", dataIndex: "createTime" },
];

function handleExport(): void {
  exportCSV(exportColumns, mockData.value as unknown as Record<string, unknown>[]);
}
</script>
