import { http, type PageResult } from "@sp/core";
import type { OperationLogRecord, LogQueryParams } from "../types";

/**
 * 分页查询操作日志
 * 直接返回分页结果，ApiResponse 包装在 http 拦截器中已处理
 */
export async function getOperationLogs(
  params: LogQueryParams
): Promise<PageResult<OperationLogRecord>> {
  const res = await http.get("/log/operation", { params });
  return res.data.data;
}
