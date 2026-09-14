import { http, type PageResult } from "@sp/core";
import type { LoginLogRecord, LogQueryParams } from "../types";

/**
 * 分页查询登录日志
 * 直接返回分页结果，ApiResponse 包装在 http 拦截器中已处理
 */
export async function getLoginLogs(
  params: LogQueryParams
): Promise<PageResult<LoginLogRecord>> {
  const res = await http.get("/log/login", { params });
  return res.data.data;
}
