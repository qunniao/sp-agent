<template>
  <div class="page-container">
    <a-page-header title="Dify 连接" sub-title="连接 Dify 实例，导入和调用 Dify 工作流" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-space>
          <a-button><UploadOutlined /> 导入 YAML</a-button>
          <a-button type="primary" @click="handleSave" :loading="saving">保存连接</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="16">
      <!-- 左侧：连接 -->
      <a-col :span="8">
        <a-card :bordered="false" title="🔌 连接" size="small" style="margin-bottom:16px">
          <a-form layout="vertical" size="small">
            <a-form-item label="Dify 服务地址"><a-input v-model:value="conn.baseUrl" placeholder="https://cloud.dify.ai/v1" /></a-form-item>
            <a-form-item label="API Key"><a-input-password v-model:value="conn.apiKey" placeholder="app-xxxxxxxx" /></a-form-item>
            <a-space>
              <a-button :loading="testing" @click="handleTest">测试连接</a-button>
              <a-tag v-if="testResult !== null" :color="testResult ? 'green' : 'red'">{{ testResult ? '✅' : '❌' }}</a-tag>
            </a-space>
          </a-form>
          <a-divider style="margin:12px 0" />
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="连接状态"><a-tag :color="conn.status === 'connected' ? 'green' : 'default'">{{ conn.status === 'connected' ? '已连接' : '未连接' }}</a-tag></a-descriptions-item>
            <a-descriptions-item label="最后测试">{{ conn.lastTestAt || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card :bordered="false" title="📖 使用方式" size="small">
          <p style="font-size:12px;color:#666;line-height:1.8">
            1. 在 Dify 中创建并<strong>发布</strong>工作流<br/>
            2. 获取工作流的 <strong>API Key</strong><br/>
            3. 在下方工作流列表中 <strong>导入 YAML</strong> 或手动添加<br/>
            4. 在自动化编辑器中添加 <strong>🔌 Dify 工作流</strong>步骤，映射变量后调用
          </p>
          <a-divider style="margin:8px 0" />
          <p style="font-size:12px;color:#999;line-height:1.6">
            API 端点格式：<br/>
            <code style="background:#f5f5f5;padding:2px 6px">POST /v1/workflows/run</code><br/>
            <code style="background:#f5f5f5;padding:2px 6px">POST /v1/chat-messages</code> (Chatflow)
          </p>
        </a-card>
      </a-col>

      <!-- 右侧：工作流列表 -->
      <a-col :span="16">
        <a-card :bordered="false" title="📋 Dify 工作流" size="small" style="margin-bottom:0">
          <div v-for="w in workflows" :key="w.id" class="wf-panel">
            <div class="wf-panel__head">
              <div>
                <span class="wf-panel__name">{{ w.name }}</span>
                <a-tag v-for="t in w.tags" :key="t" size="small" style="margin-left:4px">{{ t }}</a-tag>
                <span class="wf-panel__runs">{{ w.runCount }} 次运行</span>
              </div>
              <a-space :size="4">
                <a-button size="small" @click="toggleWf(w.id)">{{ expandedWf === w.id ? '收起' : '详情' }}</a-button>
                <a-button size="small" type="primary" @click="handleTestRun(w)" :loading="testRunning === w.id">▶ 测试运行</a-button>
              </a-space>
            </div>
            <div class="wf-panel__body" v-if="expandedWf === w.id">
              <a-row :gutter="20">
                <a-col :span="12">
                  <div class="wf-section-title">🔀 流程节点</div>
                  <DifyFlow :workflow="w" />
                </a-col>
                <a-col :span="12">
                  <div class="wf-section-title">📥 输入 / 📤 输出</div>
                  <div v-for="inp in w.inputs" :key="inp.name" class="wf-io-item">
                    <span class="wf-io-dir">→</span>
                    <span>{{ inp.label }} <code>{{ inp.name }}</code> <span class="wf-io-type">{{ inp.type }}</span></span>
                  </div>
                  <div v-for="out in w.outputs" :key="out.name" class="wf-io-item wf-io-item--out">
                    <span class="wf-io-dir">←</span>
                    <span>{{ out.label }} <code>{{ out.name }}</code> <span class="wf-io-type">{{ out.type }}</span></span>
                  </div>

                  <div class="wf-section-title" style="margin-top:12px">🔗 API 端点</div>
                  <div class="wf-api-card">
                    <div class="wf-api-card__method">POST</div>
                    <div class="wf-api-card__url">{{ conn.baseUrl || 'https://cloud.dify.ai' }}/v1/workflows/run</div>
                  </div>
                  <div class="wf-section-caption">
                    Authorization: Bearer {{ conn.apiKey ? conn.apiKey.slice(0,8)+'****' : 'app-****' }}
                  </div>

                  <div class="wf-section-title" style="margin-top:12px">📝 DSL (YAML)</div>
                  <pre class="wf-dsl">{{ generateDSL(w) }}</pre>
                  <a-button size="small" @click="copyDSL(w)"><CopyOutlined /> 复制 DSL</a-button>
                </a-col>
              </a-row>

              <!-- 测试运行结果 -->
              <div v-if="testRunResult[w.id]" class="wf-test-result">
                <div class="wf-test-result__head">
                  {{ testRunResult[w.id]?.success ? '✅' : '❌' }} 测试运行结果
                  <span style="color:#999;font-size:11px">{{ testRunResult[w.id]?.duration }}ms</span>
                </div>
                <pre class="wf-test-result__body">{{ JSON.stringify(testRunResult[w.id]?.response, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import { UploadOutlined, CopyOutlined } from "@ant-design/icons-vue";
import { getDifyConnection, saveDifyConnection, testDifyConnection, getDifyWorkflows } from "../api/automation";
import DifyFlow from "../components/DifyFlow.vue";
import type { DifyConnection, DifyWorkflow } from "../types";

const conn = reactive<Partial<DifyConnection>>({ baseUrl: "https://cloud.dify.ai/v1", apiKey: "app-****mock****", status: "disconnected" });
const workflows = ref<DifyWorkflow[]>([]);
const testing = ref(false); const saving = ref(false);
const testResult = ref<boolean | null>(null);
const expandedWf = ref<string | null>(null);
const testRunning = ref<string | null>(null);
const testRunResult = ref<Record<string, { success: boolean; duration: number; response: any }>>({});

function toggleWf(id: string) { expandedWf.value = expandedWf.value === id ? null : id; }

function generateDSL(w: DifyWorkflow): string {
  const nodes = w.nodes.map((n) => `    - id: ${n.id}\n      type: ${n.type}\n      title: ${n.title}`).join("\n");
  return `version: 1.0\ntype: workflow\nname: ${w.name}\ndescription: ${w.description}\nnodes:\n${nodes}\nedges:\n${w.edges.map((e) => `  - from: ${e.from}\n    to: ${e.to}${e.label ? `\n    label: ${e.label}` : ""}`).join("\n")}`;
}

function copyDSL(w: DifyWorkflow) { navigator.clipboard?.writeText(generateDSL(w)).then(() => message.success("DSL 已复制")); }

async function handleTest(): Promise<void> {
  testing.value = true;
  try { testResult.value = await testDifyConnection(); message.success(testResult.value ? "连接成功" : "连接失败"); }
  catch { testResult.value = false; message.error("连接失败"); }
  finally { testing.value = false; }
}

async function handleSave(): Promise<void> {
  saving.value = true;
  try { await saveDifyConnection(conn); message.success("已保存"); }
  catch { message.error("保存失败"); }
  finally { saving.value = false; }
}

async function handleTestRun(w: DifyWorkflow): Promise<void> {
  testRunning.value = w.id;
  await new Promise((r) => setTimeout(r, 1200));
  testRunning.value = null;
  const outputs: Record<string, any> = {};
  w.outputs.forEach((o) => {
    if (o.type === "string") outputs[o.name] = `Mock ${o.label} 输出`;
    else if (o.type === "number") outputs[o.name] = 0.95;
    else if (o.type === "boolean") outputs[o.name] = true;
    else outputs[o.name] = {};
  });
  testRunResult.value[w.id] = {
    success: true, duration: 1200,
    response: {
      task_id: `task_${Date.now()}`,
      workflow_run_id: `run_${Date.now()}`,
      data: { id: w.id, workflow_id: w.id, status: "succeeded", outputs, elapsed_time: 1.2, total_tokens: 1500, total_steps: w.nodes.length, created_at: Date.now() },
    },
  };
  message.success(`测试运行完成`);
}

onMounted(async () => {
  const [c, wfs] = await Promise.all([getDifyConnection(), getDifyWorkflows()]);
  if (c) Object.assign(conn, c);
  workflows.value = wfs;
});
</script>

<style scoped>
.wf-panel { border: 1px solid #f0f0f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; transition: border-color 0.15s; }
.wf-panel:hover { border-color: #d9d9d9; }
.wf-panel__head { display: flex; justify-content: space-between; align-items: center; }
.wf-panel__name { font-weight: 600; font-size: 14px; }
.wf-panel__runs { font-size: 11px; color: #bbb; margin-left: 8px; }
.wf-panel__body { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }

.wf-section-title { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 6px; }
.wf-io-item { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 2px 0; }
.wf-io-item--out { color: #52c41a; }
.wf-io-dir { color: #bbb; font-weight: 700; }
.wf-io-type { font-size: 10px; color: #bbb; }

.wf-api-card { display: flex; align-items: center; gap: 10px; padding: 6px 10px; background: #1e1e1e; border-radius: 6px; font-family: "SF Mono", Menlo, monospace; font-size: 12px; }
.wf-api-card__method { color: #52c41a; font-weight: 700; }
.wf-api-card__url { color: #d4d4d4; }
.wf-section-caption { font-size: 11px; color: #bbb; margin-top: 4px; padding-left: 4px; }

.wf-dsl { margin: 4px 0 8px; padding: 10px 14px; background: #fafafa; border: 1px solid #e8e8e8; border-radius: 6px; font-size: 11px; line-height: 1.5; max-height: 200px; overflow-y: auto; white-space: pre; font-family: "SF Mono", Menlo, monospace; color: #333; }

.wf-test-result { margin-top: 14px; border: 1px solid #d9f7be; border-radius: 8px; overflow: hidden; }
.wf-test-result__head { padding: 8px 12px; background: #f6ffed; font-size: 13px; font-weight: 500; display: flex; justify-content: space-between; }
.wf-test-result__body { margin: 0; padding: 10px 14px; font-size: 11px; line-height: 1.4; background: #fff; max-height: 200px; overflow-y: auto; font-family: "SF Mono", Menlo, monospace; white-space: pre; }
</style>
