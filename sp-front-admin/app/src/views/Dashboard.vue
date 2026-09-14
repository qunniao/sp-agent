<template>
  <!--
    Dashboard 首页
    登录后的默认页面，展示概览信息
  -->
  <div class="dashboard">
    <!-- 欢迎卡片 -->
    <a-row :gutter="16">
      <a-col :span="24">
        <a-card :bordered="false" class="welcome-card">
          <div class="welcome-card__content">
            <div>
              <h2 class="welcome-card__greeting">
                {{ greeting }}，{{ authStore.nickname }}！
              </h2>
              <p class="welcome-card__desc">
                欢迎使用 SuperOne 管理系统，今天是 {{ today }}
              </p>
            </div>
            <div class="welcome-card__stats">
              <div class="welcome-card__stat">
                <span class="welcome-card__stat-value">9</span>
                <span class="welcome-card__stat-label">通用模块</span>
              </div>
              <div class="welcome-card__stat">
                <span class="welcome-card__stat-value">P0</span>
                <span class="welcome-card__stat-label">优先开发</span>
              </div>
              <div class="welcome-card__stat">
                <span class="welcome-card__stat-value">0</span>
                <span class="welcome-card__stat-label">待办事项</span>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 功能快捷入口 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="8" v-for="item in quickLinks" :key="item.title">
        <a-card :bordered="false" hoverable class="quick-card" @click="goTo(item.path)">
          <div class="quick-card__icon" :style="{ background: item.color }">
            <component :is="item.icon" style="font-size: 28px; color: #fff" />
          </div>
          <div class="quick-card__info">
            <h4>{{ item.title }}</h4>
            <p>{{ item.desc }}</p>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 系统信息 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card :bordered="false" title="技术栈">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="前端框架">Vue 3.4 + TypeScript</a-descriptions-item>
            <a-descriptions-item label="构建工具">Vite 5</a-descriptions-item>
            <a-descriptions-item label="UI 组件库">Ant Design Vue 4</a-descriptions-item>
            <a-descriptions-item label="状态管理">Pinia 2</a-descriptions-item>
            <a-descriptions-item label="包管理">pnpm workspace</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card :bordered="false" title="模块状态">
          <a-timeline>
            <a-timeline-item color="green">认证授权模块 - 已完成基础登录页</a-timeline-item>
            <a-timeline-item color="green">系统管理模块 - 页面框架搭建完成</a-timeline-item>
            <a-timeline-item color="green">代码生成器模块 - 页面框架搭建完成</a-timeline-item>
            <a-timeline-item color="blue">数据字典模块 - 待开发</a-timeline-item>
            <a-timeline-item color="blue">文件管理模块 - 待开发</a-timeline-item>
            <a-timeline-item color="gray">通知中心 - 计划中</a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
/**
 * Dashboard 首页
 *
 * 职责：
 * 1. 展示欢迎信息和快捷入口
 * 2. 展示系统整体状态
 * 3. 不做任何业务逻辑
 */
import { computed, h } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@sp/core";
import {
  SettingOutlined,
  ThunderboltOutlined,
  TeamOutlined,
} from "@ant-design/icons-vue";
import dayjs from "dayjs";

const router = useRouter();
const authStore = useAuthStore();

// ---- 问候语 ----
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

// ---- 今日日期 ----
const today = dayjs().format("YYYY年MM月DD日 dddd");

// ---- 快捷入口 ----
const quickLinks = [
  {
    title: "系统管理",
    desc: "用户、角色、菜单管理",
    path: "/system/users",
    icon: SettingOutlined,
    color: "#1677ff",
  },
  {
    title: "代码生成器",
    desc: "一键生成 CRUD 代码",
    path: "/system/gen/tables",
    icon: ThunderboltOutlined,
    color: "#52c41a",
  },
  {
    title: "用户管理",
    desc: "管理系统用户",
    path: "/system/users",
    icon: TeamOutlined,
    color: "#faad14",
  },
];

function goTo(path: string): void {
  router.push(path);
}
</script>

<style lang="less" scoped>
.dashboard {
  // ---- 欢迎卡片 ----
  .welcome-card {
    &__content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &__greeting {
      font-size: 22px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    &__desc {
      color: #666;
      font-size: 14px;
    }

    &__stats {
      display: flex;
      gap: 40px;
    }

    &__stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    &__stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1677ff;
    }

    &__stat-label {
      font-size: 13px;
      color: #999;
      margin-top: 4px;
    }
  }

  // ---- 快捷卡片 ----
  .quick-card {
    cursor: pointer;

    :deep(.ant-card-body) {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    &__icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &__info {
      h4 {
        margin: 0 0 4px;
        font-size: 16px;
      }
      p {
        margin: 0;
        font-size: 13px;
        color: #999;
      }
    }

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
