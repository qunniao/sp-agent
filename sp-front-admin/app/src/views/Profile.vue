<template>
  <div class="profile-page">
    <a-row :gutter="24">
      <!-- 左侧：用户信息卡片 -->
      <a-col :span="6">
        <a-card :bordered="false" class="profile-card">
          <div class="profile-card__avatar">
            <a-avatar :size="80" :src="formData.avatar">
              {{ userInfo?.nickname?.charAt(0) || 'U' }}
            </a-avatar>
            <h3 class="profile-card__name">{{ userInfo?.nickname || userInfo?.username }}</h3>
            <a-tag color="blue">{{ userInfo?.roles?.join(' / ') || '未知角色' }}</a-tag>
          </div>
          <a-divider />
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="用户名">{{ userInfo?.username }}</a-descriptions-item>
            <a-descriptions-item label="邮箱">{{ userInfo?.email || '未设置' }}</a-descriptions-item>
            <a-descriptions-item label="手机">{{ userInfo?.phone || '未设置' }}</a-descriptions-item>
            <a-descriptions-item label="注册时间">{{ userInfo?.createTime || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <!-- 右侧：编辑 & 安全 -->
      <a-col :span="18">
        <a-card :bordered="false">
          <a-tabs v-model:activeKey="activeTab">
            <!-- ====== 基本设置 ====== -->
            <a-tab-pane key="basic" tab="基本设置">
              <a-form
                ref="basicFormRef"
                :model="formData"
                :rules="basicRules"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 12 }"
                style="max-width: 600px"
              >
                <a-form-item label="头像" name="avatar">
                  <a-avatar :size="64" :src="formData.avatar" style="margin-bottom: 8px; display: block" />
                  <a-input v-model:value="formData.avatar" placeholder="输入头像 URL" />
                </a-form-item>
                <a-form-item label="昵称" name="nickname">
                  <a-input v-model:value="formData.nickname" placeholder="请输入昵称" :maxlength="30" />
                </a-form-item>
                <a-form-item label="邮箱" name="email">
                  <a-input v-model:value="formData.email" placeholder="请输入邮箱" />
                </a-form-item>
                <a-form-item label="手机号" name="phone">
                  <a-input v-model:value="formData.phone" placeholder="请输入手机号" :maxlength="11" />
                </a-form-item>
                <a-form-item :wrapper-col="{ offset: 4, span: 12 }">
                  <a-button type="primary" :loading="basicLoading" @click="handleSaveBasic">
                    保存修改
                  </a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <!-- ====== 修改密码 ====== -->
            <a-tab-pane key="password" tab="修改密码">
              <a-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 12 }"
                style="max-width: 500px"
              >
                <a-form-item label="当前密码" name="oldPassword">
                  <a-input-password v-model:value="passwordForm.oldPassword" placeholder="请输入当前密码" />
                </a-form-item>
                <a-form-item label="新密码" name="newPassword">
                  <a-input-password v-model:value="passwordForm.newPassword" placeholder="至少6位" />
                </a-form-item>
                <a-form-item label="确认密码" name="confirmPassword">
                  <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="再次输入新密码" />
                </a-form-item>
                <a-form-item :wrapper-col="{ offset: 4, span: 12 }">
                  <a-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
                    修改密码
                  </a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <!-- ====== 登录历史 ====== -->
            <a-tab-pane key="history" tab="登录历史">
              <a-empty description="登录历史将在后端就绪后显示">
                <a-button type="link" @click="goToLoginLog">前往登录日志页面</a-button>
              </a-empty>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import { useAuthStore, setUserInfo } from "@sp/core";

const router = useRouter();
const authStore = useAuthStore();
const userInfo = authStore.userInfo;

// ==================== 当前 tab ====================
const activeTab = ref("basic");

// ==================== 基本设置 ====================
const basicFormRef = ref<FormInstance>();
const basicLoading = ref(false);

const formData = reactive({
  avatar: userInfo?.avatar || "",
  nickname: userInfo?.nickname || "",
  email: userInfo?.email || "",
  phone: userInfo?.phone || "",
});

const basicRules: Record<string, Rule[]> = {
  email: [{ type: "email", message: "邮箱格式不正确", trigger: "blur" }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: "手机号格式不正确", trigger: "blur" }],
};

async function handleSaveBasic(): Promise<void> {
  try {
    await basicFormRef.value?.validate();
    basicLoading.value = true;
    // 模拟延迟（后端就绪后替换为 API 调用）
    await new Promise((r) => setTimeout(r, 400));

    // 本地更新 userInfo
    if (userInfo) {
      userInfo.nickname = formData.nickname;
      userInfo.email = formData.email;
      userInfo.phone = formData.phone;
      userInfo.avatar = formData.avatar;
      // TODO: 后端就绪后调用 PUT /auth/profile 持久化
      setUserInfo(userInfo);
    }
    message.success("个人资料已更新");
  } catch {
    // 校验不通过
  } finally {
    basicLoading.value = false;
  }
}

// ==================== 修改密码 ====================
const passwordFormRef = ref<FormInstance>();
const passwordLoading = ref(false);

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const validateConfirmPassword = (_rule: Rule, value: string): Promise<void> => {
  if (value && value !== passwordForm.newPassword) {
    return Promise.reject("两次输入的密码不一致");
  }
  return Promise.resolve();
};

const passwordRules: Record<string, Rule[]> = {
  oldPassword: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "至少6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" },
  ],
};

async function handleChangePassword(): Promise<void> {
  try {
    await passwordFormRef.value?.validate();
    passwordLoading.value = true;
    // 模拟延迟（后端就绪后替换为 API 调用）
    await new Promise((r) => setTimeout(r, 400));

    message.success("密码修改成功，请重新登录");
    passwordForm.oldPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
    // TODO: 后端就绪后调用 PUT /auth/password，成功后强制重新登录
  } catch {
    // 校验不通过
  } finally {
    passwordLoading.value = false;
  }
}

// ==================== 登录历史 ====================
function goToLoginLog(): void {
  router.push("/log/login");
}
</script>

<style lang="less" scoped>
.profile-page {
  max-width: 1100px;

  .profile-card {
    &__avatar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px 0;
    }

    &__name {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
  }
}
</style>
