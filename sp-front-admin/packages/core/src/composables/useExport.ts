import { message } from "ant-design-vue";

export interface ExportColumn {
  title: string;
  dataIndex: string;
  key?: string;
  /** 自定义格式化，默认取原始值 */
  format?: (value: unknown, record: Record<string, unknown>) => string;
}

export interface UseExportOptions {
  /** 导出文件名（不含扩展名），默认 `export_时间戳` */
  filename?: string;
}

/**
 * 通用 CSV 导出 composable
 *
 * @example
 * ```ts
 * const { exportCSV } = useExport({ filename: '操作日志' });
 * exportCSV(columns, dataSource);
 * ```
 */
export function useExport(options: UseExportOptions = {}) {
  /**
   * 导出数据为 CSV 文件
   */
  function exportCSV(columns: ExportColumn[], dataSource: Record<string, unknown>[]): void {
    if (!dataSource.length) {
      message.warning("没有可导出的数据");
      return;
    }

    // ---- 构建 CSV 内容 ----
    const headers = columns.map((col) => `"${col.title}"`).join(",");

    const rows = dataSource.map((record) =>
      columns
        .map((col) => {
          let value: string;
          if (col.format) {
            value = col.format(record[col.dataIndex], record);
          } else {
            value = record[col.dataIndex]?.toString() ?? "";
          }
          // 转义内部双引号并用双引号包裹
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    // 添加 BOM 头确保 Excel 正确识别中文
    const bom = "﻿";
    const csv = bom + [headers, ...rows].join("\n");

    // ---- 触发下载 ----
    const filename = options.filename || `export_${Date.now()}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    message.success(`已导出 ${dataSource.length} 条数据`);
  }

  return { exportCSV };
}
