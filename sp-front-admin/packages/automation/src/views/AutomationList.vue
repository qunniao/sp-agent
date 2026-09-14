<template>
  <div class="page-container">
    <!-- 顶栏操作 -->
    <a-card :bordered="false" class="toolbar">
      <a-space>
        <a-select
          v-model:value="searchForm.category"
          style="width: 140px"
          @change="handleSearch"
        >
          <a-select-option value="all">全部分类</a-select-option>
          <a-select-option value="content">📝 内容创作</a-select-option>
          <a-select-option value="business">💼 业务管理</a-select-option>
          <a-select-option value="social">📱 社交媒体</a-select-option>
          <a-select-option value="custom">⚡ 自定义</a-select-option>
        </a-select>
        <a-input-search
          v-model:value="searchForm.keyword"
          placeholder="搜索工作流..."
          style="width: 280px"
          @search="handleSearch"
        />
        <a-button type="primary" @click="goCreate">
          <PlusOutlined /> 新建工作流
        </a-button>
        <a-button @click="openAiModal = true">
          <RobotOutlined /> AI 生成
        </a-button>
      </a-space>
    </a-card>

    <!-- 卡片列表 -->
    <a-spin :spinning="loading">
      <div class="card-grid" v-if="list.length > 0">
        <a-card
          v-for="item in list"
          :key="item.id"
          :bordered="false"
          hoverable
          class="automation-card"
          @click="goEdit(item.id)"
        >
          <template #title>
            <div class="card-title">
              <span class="card-icon">{{ CATEGORY_ICON[item.category] || "⚡" }}</span>
              <span>{{ item.name }}</span>
            </div>
          </template>
          <template #extra>
            <a-switch
              v-model:checked="item.enabled"
              size="small"
              @click.stop
              @change="onToggle(item)"
            />
          </template>

          <p class="card-desc">{{ item.description }}</p>

          <div class="card-meta">
            <a-tag :color="item.trigger.type === 'schedule' ? 'blue' : 'default'">
              {{ item.trigger.label }}
            </a-tag>
            <span class="card-steps">{{ item.steps.length }} 个步骤</span>
          </div>

          <template #actions>
            <span @click.stop>
              <PlayCircleOutlined /> 运行 {{ item.runCount }} 次
            </span>
            <span @click.stop="goEdit(item.id)">
              <EditOutlined /> 编辑
            </span>
            <a-dropdown :trigger="['click']" @click.stop>
              <span><EllipsisOutlined /></span>
              <template #overlay>
                <a-menu @click="(e: any) => handleMenu(e, item)">
                  <a-menu-item key="run"><CaretRightOutlined /> 立即运行</a-menu-item>
                  <a-menu-item key="duplicate"><CopyOutlined /> 复制</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" danger><DeleteOutlined /> 删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </a-card>
      </div>

      <a-empty v-else description="暂无工作流，点击「AI 生成」快速创建" />
    </a-spin>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="pagination.total > pagination.pageSize">
      <a-pagination
        v-model:current="pagination.current"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        show-size-changer
        @change="fetchData"
        @showSizeChange="fetchData"
      />
    </div>

    <!-- AI 生成弹窗 -->
    <AiComposeModal
      :visible="openAiModal"
      @close="openAiModal = false"
      @applied="onAiApplied"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message, notification } from "ant-design-vue";
import { h } from "vue";
import {
  PlusOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  EditOutlined,
  EllipsisOutlined,
  CaretRightOutlined,
  CopyOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";
import {
  getAutomationList,
  deleteAutomation,
  toggleAutomation,
  triggerAutomation,
  saveAutomation,
} from "../api/automation";
import type { AutomationDef, AiComposeResponse } from "../types";
import AiComposeModal from "../components/AiComposeModal.vue";

const router = useRouter();

const CATEGORY_ICON: Record<string, string> = {
  content: "📝",
  business: "💼",
  social: "📱",
  custom: "⚡",
};

// ==================== 搜索 ====================
const searchForm = reactive({ category: "all", keyword: "" });
function handleSearch(): void {
  pagination.current = 1;
  fetchData();
}

// ==================== 数据 ====================
const list = ref<AutomationDef[]>([]);
const loading = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
});

async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    const res = await getAutomationList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      category: searchForm.category === "all" ? undefined : searchForm.category,
      keyword: searchForm.keyword || undefined,
    });
    list.value = res.records;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

// ==================== 操作 ====================
function goCreate(): void {
  router.push("/automation/editor");
}

function goEdit(id: string): void {
  router.push(`/automation/editor/${id}`);
}

async function onToggle(item: AutomationDef): Promise<void> {
  try {
    await toggleAutomation(item.id, item.enabled);
    message.success(item.enabled ? "已启用" : "已停用");
  } catch {
    item.enabled = !item.enabled; // 回滚
    message.error("操作失败");
  }
}

function handleMenu(e: { key: string }, item: AutomationDef): void {
  switch (e.key) {
    case "run":
      handleTrigger(item);
      break;
    case "duplicate":
      handleDuplicate(item);
      break;
    case "delete":
      handleDelete(item);
      break;
  }
}

async function handleTrigger(item: AutomationDef): Promise<void> {
  try {
    const execId = await triggerAutomation(item.id);
    notification.success({
      message: `「${item.name}」已触发执行`,
      description: `流程正在后台运行，预计 ${Math.ceil(item.steps.length * 1.5)} 秒内完成`,
      duration: 6,
      btn: h(
        "a",
        {
          style: { cursor: "pointer", color: "#1677ff", fontWeight: 500 },
          onClick: () => router.push("/automation/history"),
        },
        "查看执行记录 →"
      ),
    });
  } catch {
    message.error("触发失败");
  }
}

async function handleDuplicate(item: AutomationDef): Promise<void> {
  try {
    await saveAutomation({
      ...item,
      name: `${item.name} (副本)`,
      enabled: false,
    });
    message.success("已复制");
    fetchData();
  } catch {
    message.error("复制失败");
  }
}

async function handleDelete(item: AutomationDef): Promise<void> {
  try {
    await deleteAutomation(item.id);
    message.success("已删除");
    fetchData();
  } catch {
    message.error("删除失败");
  }
}

// ==================== AI 生成结果应用 ====================
const openAiModal = ref(false);
function onAiApplied(def: AiComposeResponse["def"]): void {
  router.push("/automation/editor", { state: { preset: def } });
}

onMounted(fetchData);
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}
.automation-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.automation-card:hover {
  transform: translateY(-2px);
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
.card-icon {
  font-size: 20px;
}
.card-desc {
  color: #666;
  font-size: 13px;
  margin: 0 0 12px;
  min-height: 36px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}
.card-steps {
  color: #999;
  font-size: 12px;
}
.pagination-wrap {
  margin-top: 24px;
  text-align: right;
}
</style>
