/**
 * 认证持久化工具
 *
 * 业界主流做法：
 * 1. Token 存 localStorage（刷新不丢失）
 * 2. 用户信息也存 localStorage（避免每次刷新都调接口）
 * 3. 退出时全部清除
 */
import type { UserInfo } from "../stores/auth";

const ACCESS_TOKEN_KEY = "sp_token";
const REFRESH_TOKEN_KEY = "sp_refresh_token";
const USER_INFO_KEY = "sp_user";

// ========== Token ==========

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

// ========== 用户信息 ==========

/** 从 localStorage 恢复用户信息（刷新页面后无需重新请求后端） */
export function getUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 持久化用户信息到 localStorage */
export function setUserInfo(user: UserInfo): void {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
}

// ========== 清除 ==========

export function clearToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
}

export function hasToken(): boolean {
  return !!getToken();
}
