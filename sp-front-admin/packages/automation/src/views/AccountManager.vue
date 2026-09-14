<template>
  <div class="page-container">
    <a-page-header title="平台账号" sub-title="管理已连接的社交媒体账号" style="padding: 0; margin-bottom: 16px">
      <template #extra>
        <a-button type="primary" @click="openAdd = true"><PlusOutlined /> 添加账号</a-button>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <div class="account-grid" v-if="accounts.length > 0">
        <a-card
          v-for="acct in accounts"
          :key="acct.id"
          :bordered="false"
          hoverable
          :class="['account-card', { 'account-card--disconnected': acct.status !== 'connected' }]"
        >
          <template #extra>
            <a-dropdown :trigger="['click']">
              <a-button type="text" size="small"><EllipsisOutlined /></a-button>
              <template #overlay>
                <a-menu @click="(e: any) => handleMenu(e, acct)">
                  <a-menu-item v-if="acct.status !== 'connected'" key="reconnect">
                    重新连接
                  </a-menu-item>
                  <a-menu-item v-if="acct.status === 'connected'" key="disconnect" danger>
                    断开连接
                  </a-menu-item>
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>

          <div class="account-card__body">
            <a-avatar :src="acct.avatar" :size="48" />
            <div class="account-card__info">
              <div class="account-card__name">
                {{ acct.nickname }}
                <a-tag
                  :color="acct.status === 'connected' ? 'green' : acct.status === 'expired' ? 'orange' : 'default'"
                  size="small"
                >
                  {{ acct.status === 'connected' ? '已连接' : acct.status === 'expired' ? '已过期' : '未连接' }}
                </a-tag>
              </div>
              <div class="account-card__platform">
                <span class="platform-badge">{{ PLATFORM_LABELS[acct.platform] }}</span>
                <span v-if="acct.bio" class="account-card__bio">{{ acct.bio }}</span>
              </div>
              <div v-if="acct.connectedAt" class="account-card__time">
                连接时间：{{ acct.connectedAt }}
              </div>
            </div>
          </div>
        </a-card>
      </div>

      <a-empty v-else description="还没有连接任何平台账号">
        <a-button type="primary" @click="openAdd = true"><PlusOutlined /> 添加第一个账号</a-button>
      </a-empty>
    </a-spin>

    <!-- 添加账号 Drawer -->
    <a-drawer
      title="添加平台账号"
      :open="openAdd"
      width="420px"
      @close="openAdd = false"
    >
      <a-form layout="vertical">
        <a-form-item label="平台" required>
          <a-select v-model:value="addForm.platform">
            <a-select-option v-for="(label, key) in PLATFORM_LABELS" :key="key" :value="key">
              {{ label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="账号昵称" required>
          <a-input v-model:value="addForm.nickname" placeholder="如：SuperOne 科技号" :maxlength="30" />
        </a-form-item>
        <a-form-item label="简介">
          <a-input v-model:value="addForm.bio" placeholder="如：分享 AI 工具和效率提升" :maxlength="50" />
        </a-form-item>
        <a-alert
          message="模拟模式：点击「授权连接」将模拟 OAuth 授权过程。正式上线后跳转到平台授权页。"
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />
        <a-button type="primary" block :loading="addLoading" @click="handleAdd">
          🔗 授权连接
        </a-button>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined, EllipsisOutlined } from "@ant-design/icons-vue";
import { getPlatformAccounts, connectPlatform, disconnectPlatform } from "../api/automation";
import type { PlatformAccount, PlatformType } from "../types";
import { PLATFORM_LABELS } from "../types";

const accounts = ref<PlatformAccount[]>([]);
const loading = ref(false);
const openAdd = ref(false);
const addLoading = ref(false);
const addForm = reactive({
  platform: "xiaohongshu" as PlatformType,
  nickname: "",
  bio: "",
});

async function load(): Promise<void> {
  loading.value = true;
  try {
    accounts.value = await getPlatformAccounts();
  } finally {
    loading.value = false;
  }
}

async function handleAdd(): Promise<void> {
  if (!addForm.nickname.trim()) {
    message.warning("请输入账号昵称");
    return;
  }
  addLoading.value = true;
  try {
    const acct = await connectPlatform(addForm.platform, addForm.nickname);
    if (addForm.bio) acct.bio = addForm.bio;
    accounts.value.push(acct);
    openAdd.value = false;
    message.success(`已连接「${acct.nickname}」`);
  } catch {
    message.error("连接失败");
  } finally {
    addLoading.value = false;
  }
}

function handleMenu(e: { key: string }, acct: PlatformAccount): void {
  switch (e.key) {
    case "reconnect":
      connectPlatform(acct.platform, acct.nickname).then(() => load());
      break;
    case "disconnect":
      disconnectPlatform(acct.id).then(() => {
        acct.status = "disconnected";
        message.success("已断开");
      });
      break;
    case "delete":
      const idx = accounts.value.indexOf(acct);
      if (idx >= 0) accounts.value.splice(idx, 1);
      message.success("已删除");
      break;
  }
}

onMounted(load);
</script>

<style scoped>
.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}
.account-card--disconnected {
  opacity: 0.55;
}
.account-card__body {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.account-card__info {
  flex: 1;
  min-width: 0;
}
.account-card__name {
  font-weight: 500;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.account-card__platform {
  color: #666;
  font-size: 13px;
  margin-top: 2px;
}
.account-card__bio {
  color: #999;
}
.platform-badge {
  display: inline-block;
  padding: 0 6px;
  border-radius: 4px;
  background: #f0f0f0;
  font-size: 12px;
  margin-right: 6px;
  color: #666;
}
.account-card__time {
  font-size: 12px;
  color: #bbb;
  margin-top: 4px;
}
</style>
