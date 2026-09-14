import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getToken,
  setToken,
  clearToken,
  getUserInfo,
  setUserInfo,
} from "../utils/token";
import { http } from "../api/http";

/**
 * 用户信息
 */
export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  roles: string[];
  permissions: string[];
}

/**
 * 登录表单
 */
export interface LoginForm {
  username: string;
  password: string;
  remember?: boolean;
}

/**
 * 认证 Store
 *
 * 持久化策略（业界主流做法）：
 * - Token → localStorage（刷新不丢）
 * - 用户信息 → localStorage（避免每次刷新调后端 /auth/user-info）
 * - 退出 → 全部清除
 */
export const useAuthStore = defineStore("auth", () => {
  // ---- 状态（从 localStorage 恢复，实现刷新自动登录） ----
  const token = ref<string | null>(getToken());
  const userInfo = ref<UserInfo | null>(getUserInfo());
  const permissions = ref<string[]>(getUserInfo()?.permissions || []);

  // ---- 计算属性 ----
  const isLoggedIn = computed(() => !!token.value);
  const nickname = computed(
    () => userInfo.value?.nickname || userInfo.value?.username || "未登录"
  );
  const avatar = computed(() => userInfo.value?.avatar || "");

  // ---- 方法 ----

  /**
   * 持久化登录态到 localStorage
   */
  function persistState(): void {
    if (token.value) setToken(token.value);
    if (userInfo.value) setUserInfo(userInfo.value);
  }

  /**
   * 登录（真实后端调用）
   */
  async function login(form: LoginForm): Promise<void> {
    const res = await http.post("/auth/login", form);
    const { accessToken, refreshToken, user } = res.data.data;

    // 落入 Store（响应式）
    token.value = accessToken;
    userInfo.value = user;
    permissions.value = user.permissions || [];

    // 落入 localStorage（持久化）
    setToken(accessToken);
    if (refreshToken) {
      const { setRefreshToken } = await import("../utils/token");
      setRefreshToken(refreshToken);
    }
    setUserInfo(user);
  }

  /**
   * 模拟登录（开发阶段使用，后端就绪后删除）
   */
  function devLogin(username: string): void {
    const mockToken = "mock_jwt_" + Date.now();
    const mockUser: UserInfo = {
      id: 1,
      username,
      nickname: "管理员",
      avatar: "",
      email: "admin@superone.com",
      roles: ["admin"],
      permissions: ["*"],
    };

    token.value = mockToken;
    userInfo.value = mockUser;
    permissions.value = ["*"];

    // 持久化
    setToken(mockToken);
    setUserInfo(mockUser);
  }

  /**
   * 从后端刷新用户信息（仅在有 token 但无本地缓存时使用）
   */
  async function fetchUserInfo(): Promise<void> {
    const res = await http.get("/auth/user-info");
    const user = res.data.data;
    userInfo.value = user;
    permissions.value = user.permissions || [];
    setUserInfo(user);
  }

  /**
   * 退出登录
   */
  function logout(): void {
    http.post("/auth/logout").catch(() => {});
    clearToken();
    token.value = null;
    userInfo.value = null;
    permissions.value = [];
    window.location.href = "/login";
  }

  /**
   * 检查是否拥有指定权限
   */
  function hasPermission(permission: string): boolean {
    if (userInfo.value?.roles.includes("admin")) return true;
    return permissions.value.includes(permission);
  }

  /**
   * 检查是否拥有任一权限
   */
  function hasAnyPermission(permList: string[]): boolean {
    if (permList.length === 0) return true;
    return permList.some((p) => hasPermission(p));
  }

  return {
    token,
    userInfo,
    permissions,
    isLoggedIn,
    nickname,
    avatar,
    login,
    devLogin,
    fetchUserInfo,
    logout,
    hasPermission,
    hasAnyPermission,
  };
});
