/**
 * API 响应类型定义
 * 后端统一返回格式，所有接口调用都遵循此结构
 */
export interface ApiResponse<T = unknown> {
  /** 状态码，200 表示成功 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
}

/**
 * 分页请求参数
 */
export interface PageParams {
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 排序字段 */
  sortField?: string;
  /** 排序方向 */
  sortOrder?: "ascend" | "descend";
}

/**
 * 分页查询结果
 */
export interface PageResult<T> {
  /** 数据列表 */
  records: T[];
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
}
