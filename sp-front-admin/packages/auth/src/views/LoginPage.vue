<template>
  <!--
    登录页面
    全屏居中布局：左侧品牌区域 + 右侧登录表单
  -->
  <div class="login-page">
    <div class="login-card">
      <!-- 左侧品牌区 -->
      <div class="login-card__brand">
        <img src="@/assets/logo.svg" alt="logo" class="login-card__logo" />
        <h1 class="login-card__title">SuperOne</h1>
        <p class="login-card__desc">超级一人公司 · 后台管理系统</p>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-card__form">
        <h2 class="login-card__form-title">账号登录</h2>

        <a-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
        >
          <!-- 用户名 -->
          <a-form-item name="username">
            <a-input
              v-model:value="form.username"
              placeholder="请输入用户名"
              autocomplete="username"
              @pressEnter="focusPassword"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </a-input>
          </a-form-item>

          <!-- 密码 -->
          <a-form-item name="password">
            <a-input-password
              ref="passwordRef"
              v-model:value="form.password"
              placeholder="请输入密码"
              autocomplete="current-password"
              @pressEnter="handleLoginClick"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>

          <!-- 登录按钮 -->
          <a-form-item>
            <a-button
              type="primary"
              :loading="loading"
              block
              size="large"
              @click="handleLoginClick"
            >
              {{ loading ? "登录中..." : "登 录" }}
            </a-button>
          </a-form-item>
        </a-form>

        <!-- 底部提示 -->
        <p class="login-card__tip">首次使用？请使用管理员账号登录</p>
      </div>
    </div>

    <!-- 页脚版权 -->
    <footer class="login-page__footer">
      SuperOne ©{{ new Date().getFullYear() }} · 一人公司数字化平台
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录页面组件
 *
 * 功能：
 * 1. 用户名密码表单校验
 * 2. 调用 authStore.login() 完成登录
 * 3. 登录成功后跳转到 redirect 参数指定的页面（或默认首页）
 *
 * 当前状态：后端未就绪，使用模拟登录
 */
import { ref, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import { useAuthStore } from "@sp/core";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// ---- 表单引用 ----
const formRef = ref<FormInstance>();
const passwordRef = ref();

// ---- 表单数据 ----
const form = reactive({
  username: "admin",
  password: "admin123",
});

// ---- 加载状态 ----
const loading = ref(false);

// ---- 校验规则 ----
const rules: Record<string, Rule[]> = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 2, max: 50, message: "用户名长度为 2-50 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 50, message: "密码长度为 6-50 个字符", trigger: "blur" },
  ],
};

/** 回车时焦点跳到密码框 */
function focusPassword(): void {
  passwordRef.value?.focus();
}

/**
 * 登录按钮点击 / 密码框回车
 * 手动触发表单验证，通过后执行登录
 */
async function handleLoginClick(): Promise<void> {
  console.log("[Login] 点击登录按钮");
  try {
    // 1. 手动验证表单
    const values = await formRef.value?.validate();
    console.log("[Login] 表单验证通过:", values);

    loading.value = true;

    // 2. 模拟登录（自动持久化 token + 用户信息到 localStorage）
    authStore.devLogin(form.username);

    console.log("[Login] 登录成功，Token + 用户信息已缓存到 localStorage");
    console.log("[Login] isLoggedIn:", authStore.isLoggedIn);

    message.success("登录成功");

    // 3. 跳转
    const redirect = (route.query.redirect as string) || "/dashboard";
    console.log("[Login] 准备跳转到:", redirect);
    await router.push(redirect);
    console.log("[Login] 跳转完成，当前路径:", router.currentRoute.value.path);
  } catch (error) {
    console.error("[Login] 登录失败:", error);
    if (error && typeof error === "object" && "errorFields" in error) {
      // 表单验证失败，不做额外提示（Ant Design 会自动高亮错误字段）
      console.log("[Login] 表单验证未通过");
    } else {
      message.error("登录失败，请检查用户名和密码");
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="less" scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;

  &__footer {
    margin-top: 32px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
  }
}

.login-card {
  display: flex;
  width: 800px;
  max-width: 100%;
  min-height: 480px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

  // ---- 左侧品牌区 ----
  &__brand {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    background: linear-gradient(180deg, #1677ff 0%, #0958d9 100%);
    color: #fff;
  }

  &__logo {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  &__desc {
    font-size: 14px;
    opacity: 0.85;
  }

  // ---- 右侧表单区 ----
  &__form {
    flex: 1;
    padding: 48px 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &__form-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 32px;
    text-align: center;
  }

  &__tip {
    text-align: center;
    color: #999;
    font-size: 13px;
    margin-top: 16px;
  }
}

// 小屏幕适配
@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
    min-height: auto;
    width: 100%;

    &__brand {
      padding: 32px;
    }

    &__form {
      padding: 32px 24px;
    }
  }
}
</style>
