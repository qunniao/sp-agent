<template>
  <div class="page-container">
    <a-card :bordered="false" title="文件列表">
      <template #extra>
        <a-space>
          <a-button @click="handleExport"><DownloadOutlined /> 导出</a-button>
          <a-upload>
            <a-button type="primary"><UploadOutlined /> 上传文件</a-button>
          </a-upload>
        </a-space>
      </template>
      <a-table :columns="columns" :data-source="mockData" row-key="id" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'size'">
            {{ formatSize(record.size) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small">预览</a-button>
              <a-button type="link" size="small">下载</a-button>
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
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import { useExport, type ExportColumn } from "@sp/core";

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const columns = [
  { title: "文件名", dataIndex: "name", key: "name" },
  { title: "大小", key: "size", width: 100 },
  { title: "类型", dataIndex: "type", key: "type", width: 100 },
  { title: "上传时间", dataIndex: "uploadTime", key: "uploadTime" },
  { title: "操作", key: "action", width: 200 },
];

const mockData = ref([
  { id: 1, name: "产品需求文档.pdf", size: 2048576, type: "PDF", uploadTime: "2024-06-15 10:00:00" },
  { id: 2, name: "logo.png", size: 51200, type: "PNG", uploadTime: "2024-06-14 14:30:00" },
]);

// ---- 导出 ----
const { exportCSV } = useExport({ filename: "文件列表" });

const exportColumns: ExportColumn[] = [
  { title: "文件名", dataIndex: "name" },
  { title: "大小", dataIndex: "size", format: (v) => formatSize(v as number) },
  { title: "类型", dataIndex: "type" },
  { title: "上传时间", dataIndex: "uploadTime" },
];

function handleExport(): void {
  exportCSV(exportColumns, mockData.value as unknown as Record<string, unknown>[]);
}
</script>
