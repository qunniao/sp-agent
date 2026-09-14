<template>
  <div class="trigger-selector">
    <a-form layout="vertical">
      <a-form-item label="触发方式">
        <a-radio-group v-model:value="localType" @change="onTypeChange" button-style="solid">
          <a-radio-button value="schedule">
            <ClockCircleOutlined /> 定时触发
          </a-radio-button>
          <a-radio-button value="manual">
            <PlayCircleOutlined /> 手动触发
          </a-radio-button>
          <a-radio-button value="webhook">
            <LinkOutlined /> Webhook
          </a-radio-button>
        </a-radio-group>
      </a-form-item>

      <!-- 定时触发配置 -->
      <template v-if="localType === 'schedule'">
        <a-form-item label="执行频率">
          <a-select v-model:value="schedulePreset" @change="onPresetChange" style="width: 100%">
            <a-select-option value="0 */4 * * *">每 4 小时</a-select-option>
            <a-select-option value="0 9 * * *">每天上午 9:00</a-select-option>
            <a-select-option value="0 9 * * 1-5">工作日上午 9:00</a-select-option>
            <a-select-option value="0 9 * * 1">每周一上午 9:00</a-select-option>
            <a-select-option value="0 8 1 * *">每月 1 日上午 8:00</a-select-option>
            <a-select-option value="custom">自定义 Cron</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="schedulePreset === 'custom'" label="Cron 表达式">
          <a-input v-model:value="localCron" placeholder="0 9 * * *" @change="emitChange">
            <template #suffix>
              <a-tooltip title="格式: 分 时 日 月 周 (5位)">
                <QuestionCircleOutlined style="color: #999" />
              </a-tooltip>
            </template>
          </a-input>
        </a-form-item>
      </template>

      <!-- 手动触发 -->
      <template v-if="localType === 'manual'">
        <a-alert message="手动触发模式下，需在列表中点击「立即运行」来启动" type="info" show-icon />
      </template>

      <!-- Webhook -->
      <template v-if="localType === 'webhook'">
        <a-form-item label="Webhook URL">
          <a-input v-model:value="localWebhook" placeholder="https://..." @change="emitChange" />
        </a-form-item>
      </template>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ClockCircleOutlined, PlayCircleOutlined, LinkOutlined, QuestionCircleOutlined } from "@ant-design/icons-vue";
import type { TriggerConfig, TriggerType } from "../types";

const props = defineProps<{ modelValue: TriggerConfig }>();
const emit = defineEmits<{ "update:modelValue": [value: TriggerConfig] }>();

const localType = ref<TriggerType>(props.modelValue?.type || "manual");
const localCron = ref(props.modelValue?.cron || "0 9 * * *");
const localWebhook = ref(props.modelValue?.webhookUrl || "");
const schedulePreset = ref(props.modelValue?.cron || "0 9 * * *");

function getLabel(): string {
  if (localType.value === "schedule") {
    const map: Record<string, string> = {
      "0 */4 * * *": "每 4 小时",
      "0 9 * * *": "每天上午 9:00",
      "0 9 * * 1-5": "工作日上午 9:00",
      "0 9 * * 1": "每周一上午 9:00",
      "0 8 1 * *": "每月 1 日上午 8:00",
    };
    return map[localCron.value] || `Cron: ${localCron.value}`;
  }
  if (localType.value === "webhook") return `Webhook: ${localWebhook.value}`;
  return "手动触发";
}

function emitChange(): void {
  emit("update:modelValue", {
    type: localType.value,
    cron: localType.value === "schedule" ? localCron.value : undefined,
    webhookUrl: localType.value === "webhook" ? localWebhook.value : undefined,
    label: getLabel(),
  });
}

function onTypeChange(): void {
  if (localType.value === "schedule") {
    localCron.value = "0 9 * * *";
    schedulePreset.value = "0 9 * * *";
  }
  emitChange();
}

function onPresetChange(val: string): void {
  if (val !== "custom") {
    localCron.value = val;
  }
  emitChange();
}

watch(() => props.modelValue, (v) => {
  if (v) {
    localType.value = v.type;
    if (v.cron) localCron.value = v.cron;
    if (v.webhookUrl) localWebhook.value = v.webhookUrl;
  }
}, { immediate: true, deep: true });
</script>
