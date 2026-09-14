<template>
  <div class="page-container">
    <a-page-header title="一键分发" sub-title="一次创作，同步发布到多平台" style="padding:0;margin-bottom:16px" />

    <!-- 输入区 -->
    <a-card :bordered="false" title="📝 原始内容" style="margin-bottom:16px">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="来源平台">
              <a-select v-model:value="sourcePlatform">
                <a-select-option value="xiaohongshu">小红书</a-select-option>
                <a-select-option value="wechat_mp">公众号</a-select-option>
                <a-select-option value="douyin">抖音</a-select-option>
                <a-select-option value="weibo">微博</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="18">
            <a-form-item label="目标平台">
              <a-checkbox-group v-model:value="targetPlatforms">
                <a-checkbox v-for="(label, key) in PLATFORM_LABELS" :key="key" :value="key" :disabled="key === sourcePlatform">
                  {{ label }}
                </a-checkbox>
              </a-checkbox-group>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item>
          <a-textarea
            v-model:value="content"
            :rows="6"
            placeholder="粘贴或输入要分发的内容..."
          />
        </a-form-item>
        <a-button type="primary" :loading="adapting" @click="handleDistribute">
          🚀 AI 适配分发
        </a-button>
      </a-form>
    </a-card>

    <!-- 适配结果 -->
    <template v-if="currentJob">
      <a-card :bordered="false" title="📋 适配结果" style="margin-bottom:16px">
        <a-row :gutter="16">
          <a-col :span="12" v-for="v in currentJob.versions" :key="v.platform">
            <a-card :bordered="true" size="small" class="version-card">
              <template #title>
                <span>{{ PLATFORM_LABELS[v.platform] }}</span>
                <a-tag v-if="v.status === 'adapted'" color="green" size="small">已适配</a-tag>
                <a-tag v-else-if="v.status === 'adapting'" color="purple" size="small">
                  <a-spin size="small" /> 适配中
                </a-tag>
                <a-tag v-else-if="v.status === 'published'" color="blue" size="small">已发布</a-tag>
                <a-tag v-else color="red" size="small">失败</a-tag>
              </template>
              <pre class="version-content">{{ v.content }}</pre>
              <template #extra v-if="v.status === 'adapted'">
                <a-button type="link" size="small" @click="handlePublish(v)">发布</a-button>
              </template>
            </a-card>
          </a-col>
        </a-row>
      </a-card>

      <!-- 历史分发记录 -->
      <a-card :bordered="false" title="📜 历史分发" size="small">
        <a-timeline>
          <a-timeline-item v-for="job in historyJobs" :key="job.id" :color="'blue'">
            <div>从 {{ PLATFORM_LABELS[job.sourcePlatform] || job.sourcePlatform }} 分发到
              <template v-for="v in job.versions" :key="v.platform">
                <a-tag size="small">{{ PLATFORM_LABELS[v.platform] }}</a-tag>
              </template>
            </div>
            <div class="history-time">{{ job.createdAt }}</div>
          </a-timeline-item>
        </a-timeline>
      </a-card>
    </template>

    <a-empty v-else description="输入内容并选择目标平台，AI 将自动适配各平台格式" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "ant-design-vue";
import { distributeToPlatforms, getDistributions } from "../api/automation";
import type { DistributionJob, PlatformVersion, PlatformType } from "../types";
import { PLATFORM_LABELS } from "../types";

const sourcePlatform = ref<PlatformType>("xiaohongshu");
const targetPlatforms = ref<PlatformType[]>(["wechat_mp", "douyin"]);
const content = ref("");
const adapting = ref(false);
const currentJob = ref<DistributionJob | null>(null);
const historyJobs = ref<DistributionJob[]>([]);

async function handleDistribute(): Promise<void> {
  if (!content.value.trim()) { message.warning("请输入内容"); return; }
  if (targetPlatforms.value.length === 0) { message.warning("请选择至少一个目标平台"); return; }
  adapting.value = true;
  try {
    const job = await distributeToPlatforms(content.value, sourcePlatform.value, targetPlatforms.value);
    currentJob.value = job;
    message.success("AI 适配完成，可在下方预览各平台版本");
  } catch {
    message.error("适配失败");
  } finally { adapting.value = false; }
}

function handlePublish(v: PlatformVersion): void {
  v.status = "published";
  v.publishedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
  message.success(`已发布到 ${PLATFORM_LABELS[v.platform]}`);
}

onMounted(async () => {
  historyJobs.value = await getDistributions();
});
</script>

<style scoped>
.version-card { min-height: 180px; }
.version-content {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: #555;
  font-family: inherit;
  max-height: 240px;
  overflow-y: auto;
}
.history-time { font-size: 11px; color: #bbb; }
</style>
