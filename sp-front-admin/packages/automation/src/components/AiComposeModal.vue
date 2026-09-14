<template>
  <a-modal
    title="🤖 AI 生成工作流"
    :open="visible"
    :confirm-loading="loading"
    width="640px"
    @ok="handleGenerate"
    @cancel="emit('close')"
    ok-text="生成"
    cancel-text="取消"
  >
    <a-space direction="vertical" style="width: 100%" :size="16">
      <a-typography-text type="secondary">
        用自然语言描述你想自动化的事情，AI 会自动拆解成步骤。例如：
      </a-typography-text>

      <div class="ai-examples">
        <a-tag
          v-for="ex in examples"
          :key="ex"
          class="ai-example-tag"
          @click="description = ex"
        >{{ ex }}</a-tag>
      </div>

      <a-textarea
        v-model:value="description"
        placeholder="描述你的自动化需求..."
        :auto-size="{ minRows: 3, maxRows: 6 }"
        :disabled="loading"
      />

      <!-- 生成结果预览 -->
      <template v-if="result">
        <a-divider>生成结果</a-divider>
        <a-alert type="success" :message="result.explanation" show-icon />

        <div class="result-preview">
          <a-descriptions :column="2" size="small" bordered>
            <a-descriptions-item label="名称">{{ result.def.name }}</a-descriptions-item>
            <a-descriptions-item label="触发方式">
              <a-tag>{{ result.def.trigger.label }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="步骤数" :span="2">
              {{ result.def.steps.length }} 个步骤
            </a-descriptions-item>
          </a-descriptions>

          <div class="result-steps">
            <div v-for="(step, i) in result.def.steps" :key="step.id" class="result-step-item">
              <span class="result-step-index">{{ i + 1 }}</span>
              <span>{{ step.title }}</span>
              <a-tag size="small" color="purple">{{ step.type }}</a-tag>
            </div>
          </div>
        </div>
      </template>
    </a-space>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "ant-design-vue";
import { aiComposeWorkflow } from "../api/ai";
import type { AiComposeResponse } from "../types";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  close: [];
  applied: [data: AiComposeResponse["def"]];
}>();

const description = ref("");
const loading = ref(false);
const result = ref<AiComposeResponse | null>(null);

const examples = [
  "每天发一篇小红书科技类内容",
  "每周一生成工作周报发邮件",
  "每小时检查新订单并通知我",
];

async function handleGenerate(): void {
  if (!description.value.trim()) {
    message.warning("请描述你想自动化的事情");
    return;
  }
  loading.value = true;
  try {
    const res = await aiComposeWorkflow(description.value.trim());
    result.value = res;
  } catch {
    message.error("AI 生成失败，请重试");
  } finally {
    loading.value = false;
  }
}

/** 应用生成结果到编辑器 */
function applyResult(): void {
  if (result.value) {
    emit("applied", result.value.def);
    emit("close");
  }
}
</script>

<style scoped>
.ai-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ai-example-tag {
  cursor: pointer;
  transition: opacity 0.2s;
}
.ai-example-tag:hover {
  opacity: 0.7;
}
.result-preview {
  margin-top: 8px;
}
.result-steps {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.result-step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #fafafa;
  border-radius: 6px;
}
.result-step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #722ed1;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
</style>
