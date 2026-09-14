<template>
  <div class="page-container">
    <a-page-header title="模型配置" sub-title="管理 AI 模型选择、任务路由和成本控制" style="padding:0;margin-bottom:16px" />

    <a-spin :spinning="loading" v-if="config">
      <a-row :gutter="16">
        <!-- 默认模型 -->
        <a-col :span="8">
          <a-card :bordered="false" title="🔧 默认模型" style="margin-bottom:16px">
            <a-form layout="vertical">
              <a-form-item label="全局默认模型">
                <a-select v-model:value="config.defaultModel" @change="markDirty">
                  <a-select-option v-for="(label, key) in MODEL_LABELS" :key="key" :value="key">{{ label }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>

        <!-- 任务路由 -->
        <a-col :span="8">
          <a-card :bordered="false" title="🔀 任务路由" style="margin-bottom:16px">
            <div class="task-routing">
              <div class="task-row" v-for="(rt, i) in config.taskRouting" :key="i">
                <span class="task-row__name">{{ rt.task }}</span>
                <a-select v-model:value="rt.model" size="small" style="width:140px" @change="markDirty">
                  <a-select-option v-for="(label, key) in MODEL_LABELS" :key="key" :value="key">{{ label }}</a-select-option>
                </a-select>
              </div>
            </div>
          </a-card>
        </a-col>

        <!-- 月度用量 -->
        <a-col :span="8">
          <a-card :bordered="false" title="📊 当月用量" style="margin-bottom:16px">
            <div class="usage-per-model">
              <div class="model-bar" v-for="mu in modelUsage" :key="mu.model">
                <div class="model-bar__head">
                  <span>{{ mu.label }}</span>
                  <span>¥{{ mu.cost.toFixed(2) }}</span>
                </div>
                <div class="model-bar__stats">
                  <span>{{ mu.calls }} 次</span>
                  <span>{{ formatTokens(mu.tokens) }} Token</span>
                </div>
                <div class="model-bar__wrap">
                  <div class="model-bar__fill" :style="{ width: barPct(mu.cost) + '%', background: modelColor(mu.model) }"></div>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 预算控制 -->
      <a-card :bordered="false" title="💰 预算控制" style="margin-bottom:16px">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="月度预算上限 (元)">
              <a-input-number v-model:value="config.budget.monthlyLimit" :min="10" :max="10000" style="width:100%" @change="markDirty" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="预警阈值 (%)">
              <a-input-number v-model:value="config.budget.alertThreshold" :min="10" :max="100" style="width:100%" @change="markDirty" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="超限策略">
              <a-select v-model:value="config.budget.exceedAction" @change="markDirty">
                <a-select-option value="switch_to_cheaper">切换降级模型</a-select-option>
                <a-select-option value="alert_only">仅预警</a-select-option>
                <a-select-option value="stop">停止调用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="当前进度">
              <a-progress :percent="Math.min(100, budgetPercent)" :status="budgetPercent > (config.budget.alertThreshold || 80) ? 'exception' : 'active'" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <!-- Fallback -->
      <a-card :bordered="false" title="🔄 容灾策略" style="margin-bottom:16px">
        <a-form layout="inline">
          <a-form-item label="启用 Fallback">
            <a-switch v-model:checked="config.fallback.enabled" @change="markDirty" />
          </a-form-item>
          <a-form-item label="备用模型" v-if="config.fallback.enabled">
            <a-select v-model:value="config.fallback.fallbackModel" style="width:150px" @change="markDirty">
              <a-select-option v-for="(label, key) in MODEL_LABELS" :key="key" :value="key">{{ label }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <span style="font-size:12px;color:#999">当主模型不可用时，自动切换到备用模型</span>
          </a-form-item>
        </a-form>
      </a-card>

      <a-button type="primary" :loading="saving" @click="handleSave" :disabled="!dirty">保存配置</a-button>
      <span v-if="!dirty" style="margin-left:8px;color:#52c41a">✓ 配置已保存</span>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { getModelConfig, saveModelConfig, getModelUsage } from "../api/automation";
import type { ModelConfig, ModelUsage } from "../types";
import { MODEL_LABELS } from "../types";

const config = ref<ModelConfig | null>(null);
const modelUsage = ref<ModelUsage[]>([]);
const loading = ref(false);
const saving = ref(false);
const dirty = ref(false);

const budgetPercent = computed(() => {
  if (!config.value) return 0;
  const total = modelUsage.value.reduce((s, m) => s + m.cost, 0);
  return Math.round((total / config.value.budget.monthlyLimit) * 100);
});

function barPct(cost: number): number {
  const total = modelUsage.value.reduce((s, m) => s + m.cost, 1);
  return Math.round((cost / total) * 100);
}
function modelColor(model: string): string {
  const map: Record<string, string> = { "claude-opus": "#722ed1", "claude-sonnet": "#1677ff", "claude-haiku": "#52c41a" };
  return map[model] || "#999";
}
function formatTokens(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}
function markDirty(): void { dirty.value = true; }

async function handleSave(): Promise<void> {
  if (!config.value) return;
  saving.value = true;
  try {
    await saveModelConfig(config.value);
    dirty.value = false;
    message.success("配置已保存");
  } catch { message.error("保存失败"); }
  finally { saving.value = false; }
}

onMounted(async () => {
  loading.value = true;
  try {
    [config.value, modelUsage.value] = await Promise.all([getModelConfig(), getModelUsage()]);
  } finally { loading.value = false; }
});
</script>

<style scoped>
.task-routing { display: flex; flex-direction: column; gap: 8px; }
.task-row { display: flex; align-items: center; justify-content: space-between; }
.task-row__name { font-size: 13px; }

.usage-per-model { display: flex; flex-direction: column; gap: 12px; }
.model-bar__head { display: flex; justify-content: space-between; font-size: 13px; font-weight: 500; }
.model-bar__stats { font-size: 11px; color: #999; display: flex; gap: 12px; margin: 2px 0 4px; }
.model-bar__wrap { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.model-bar__fill { height: 100%; border-radius: 3px; transition: width 0.6s; }
</style>
