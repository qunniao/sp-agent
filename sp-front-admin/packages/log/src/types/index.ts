/**
 * 操作日志记录
 * 字段名与后端 VO 及表格 column dataIndex 一一对应
 */
export interface OperationLogRecord {
  id: number;
  operator: string;
  action: string;
  method: string;
  path: string;
  ip: string;
  status: number;
  errorMsg?: string;
  costTime?: number;
  createTime: string;
}

/**
 * 登录日志记录
 */
export interface LoginLogRecord {
  id: number;
  username: string;
  ip: string;
  browser: string;
  os: string;
  status: number;
  errorMsg?: string;
  loginTime: string;
}

/**
 * 日志查询参数（操作日志 & 登录日志共用）
 */
export interface LogQueryParams {
  operator?: string;
  action?: string;
  username?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
  page: number;
  pageSize: number;
}
