import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { getToken, clearToken, getRefreshToken } from "../utils/token";
import { message } from "ant-design-vue";
import type { ApiResponse } from "./types";

/**
 * 创建 axios 实例
 * baseURL 使用 /api 前缀，Vite 开发服务器会代理到后端
 * timeout 默认 15 秒，可根据接口调整
 */
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 请求拦截器
 * 自动在请求头带上 JWT token
 */
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      // 使用 Authorization: Bearer xxx 标准格式
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * - 统一处理错误码
 * - 401 时自动清除登录态并跳转登录页
 * - 其他错误自动弹出提示
 */
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;

    // 后端返回非 200 状态码，视为业务错误
    if (res.code !== 200) {
      message.error(res.message || "请求失败");

      // 401 未授权，token 过期或无效
      if (res.code === 401) {
        clearToken();
        // 跳转到登录页，保留当前路径以便登录后回跳
        const currentPath = window.location.pathname;
        if (currentPath !== "/login") {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }

      return Promise.reject(new Error(res.message || "请求失败"));
    }

    return response;
  },
  (error) => {
    // HTTP 层面的错误（网络不通、超时等）
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          clearToken();
          window.location.href = "/login";
          break;
        case 403:
          message.error("没有权限访问");
          break;
        case 404:
          message.error("请求的资源不存在");
          break;
        case 500:
          message.error("服务器内部错误");
          break;
        default:
          message.error(`请求错误: ${status}`);
      }
    } else if (error.code === "ECONNABORTED") {
      message.error("请求超时，请稍后重试");
    } else {
      message.error("网络连接异常");
    }
    return Promise.reject(error);
  }
);

export { http };
