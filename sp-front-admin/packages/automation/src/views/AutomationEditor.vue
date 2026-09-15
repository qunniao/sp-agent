<template>
  <div class="page-container editor-page">
    <!-- 顶部标题栏 -->
    <a-card :bordered="false" class="editor-header">
      <a-page-header
        :title="isNew ? '新建工作流' : '编辑工作流'"
        @back="goBack"
      >
        <template #extra>
          <a-space>
            <a-radio-group v-model:value="editorMode" size="small" button-style="solid" v-if="form.steps.length > 0">
              <a-radio-button value="list">📋 列表</a-radio-button>
              <a-radio-button value="canvas">🎨 画布</a-radio-button>
            </a-radio-group>
            <a-button @click="openAiModal = true">
              <RobotOutlined /> AI 编排
            </a-button>
            <a-button type="primary" @click="handleSave" :loading="saving">
              保存
            </a-button>
          </a-space>
        </template>
      </a-page-header>
    </a-card>

    <!-- 基本信息 -->
    <a-card :bordered="false" title="📋 基本信息" style="margin-bottom: 16px">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="工作流名称" required>
              <a-input v-model:value="form.name" placeholder="如：小红书每日科普" :maxlength="50" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="分类">
              <a-select v-model:value="form.category">
                <a-select-option value="content">📝 内容创作</a-select-option>
                <a-select-option value="business">💼 业务管理</a-select-option>
                <a-select-option value="social">📱 社交媒体</a-select-option>
                <a-select-option value="custom">⚡ 自定义</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="2" placeholder="简要描述这个自动化流程做什么" :maxlength="200" />
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 触发器 -->
    <a-card :bordered="false" title="⚡ 触发器" style="margin-bottom: 16px">
      <TriggerSelector v-model="form.trigger" />
    </a-card>

    <!-- 步骤列表 —— 列表模式 -->
    <a-card :bordered="false" style="margin-bottom: 16px" v-if="editorMode === 'list'">
      <template #title>
        <span>🔗 执行步骤</span>
        <a-tag style="margin-left: 8px">{{ form.steps.length }} 步</a-tag>
      </template>
      <template #extra>
        <a-dropdown :trigger="['click']">
          <a-button type="dashed">
            <PlusOutlined /> 添加步骤
          </a-button>
          <template #overlay>
            <a-menu @click="addStep">
              <a-menu-item key="ai.chat">🤖 AI 对话</a-menu-item>
              <a-menu-item key="agent.team">🤝 智能体团队</a-menu-item>
              <a-menu-item key="dify.workflow">🔌 Dify 工作流</a-menu-item>
              <a-menu-item key="ai.generate_image">🎨 AI 生图</a-menu-item>
              <a-menu-item key="platform.post">📮 发布平台</a-menu-item>
              <a-menu-item key="http.request">🌐 HTTP 请求</a-menu-item>
              <a-menu-item key="condition">🔀 条件分支</a-menu-item>
              <a-menu-item key="delay">⏱️ 延时等待</a-menu-item>
              <a-menu-item key="notification">📬 通知</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </template>

      <div v-if="form.steps.length === 0" class="empty-steps">
        <a-empty description="还没有步骤，点击上方「添加步骤」开始编排">
          <template #image>
            <ThunderboltOutlined style="font-size: 48px; color: #d9d9d9" />
          </template>
        </a-empty>
      </div>

      <div v-else class="step-list">
        <div
          v-for="(step, index) in form.steps"
          :key="step.id"
          class="step-chain"
        >
          <!-- 连线 -->
          <div v-if="index > 0" class="step-connector">
            <div class="connector-line"></div>
          </div>

          <!-- 步骤卡片 -->
          <div
            :class="['step-wrapper', { 'step-wrapper--editing': editingIndex === index }]"
            @click="startEdit(index)"
          >
            <!-- 折叠态 -->
            <template v-if="editingIndex !== index">
              <StepCard
                :step="step"
                :index="index"
                @edit="startEdit"
                @delete="removeStep"
                @update="(s: StepNode) => updateStep(index, s)"
              />
            </template>

            <!-- 展开编辑态 -->
            <template v-else>
              <a-card size="small" :bordered="true" class="step-edit-card">
                <template #title>
                  <span>{{ STEP_META[step.type]?.icon }} {{ STEP_META[step.type]?.label }}</span>
                </template>
                <template #extra>
                  <a-space :size="4">
                    <a-button
                      type="link"
                      size="small"
                      :loading="testingIndex === index"
                      @click.stop="handleTestStep(index)"
                    >🧪 测试</a-button>
                    <a-button type="link" size="small" @click="editingIndex = -1">收起</a-button>
                  </a-space>
                </template>

                <a-form layout="vertical">
                  <a-form-item label="步骤名称">
                    <a-input v-model:value="step.title" :maxlength="30" />
                  </a-form-item>

                  <!-- AI 对话配置 -->
                  <template v-if="step.type === 'ai.chat'">
                    <a-form-item label="智能体角色">
                      <a-select
                        v-model:value="aiConfig.personaId"
                        placeholder="通用 AI（不限角色）"
                        allow-clear
                      >
                        <a-select-option
                          v-for="p in personas"
                          :key="p.id"
                          :value="p.id"
                        >
                          {{ p.avatar }} {{ p.name }} · {{ p.role }}
                        </a-select-option>
                      </a-select>
                      <div class="form-extra-link">
                        <router-link to="/team/employees">管理智能体库 →</router-link>
                      </div>
                    </a-form-item>
                    <a-form-item>
                      <template #label>
                        输出变量名
                        <a-tooltip title="后续步骤用 {{step.变量名}} 引用此输出">
                          <span style="color:#999;font-size:12px;margin-left:4px">供 &#123;&#123;step.xxx&#125;&#125; 引用</span>
                        </a-tooltip>
                      </template>
                      <a-input v-model:value="aiConfig.outputKey" placeholder="content" style="width: 200px" />
                    </a-form-item>
                    <a-form-item label="Prompt">
                      <a-textarea
                        v-model:value="aiConfig.prompt"
                        :rows="4"
                        placeholder="告诉 AI 要做什么..."
                      />
                      <VarPicker
                        v-if="index > 0"
                        :steps="form.steps"
                        :currentIndex="index"
                        @pick="(ref: string) => aiConfig.prompt += ' ' + ref"
                      />
                    </a-form-item>
                  </template>

                  <!-- 智能体团队配置 -->
                  <template v-if="step.type === 'agent.team'">
                    <a-form-item label="协作模式" required>
                      <a-radio-group v-model:value="(step.config as any).mode" button-style="solid" size="small">
                        <a-radio-button value="serial_review">🔗 串行审核</a-radio-button>
                        <a-radio-button value="parallel">⚡ 并行生成</a-radio-button>
                        <a-radio-button value="debate">⚔️ 辩论裁决</a-radio-button>
                      </a-radio-group>
                      <div style="margin-top:4px;font-size:12px;color:#999">
                        <template v-if="(step.config as any).mode === 'serial_review'">
                          智能体 A 生成 → B 审查 → A 修订 → 输出
                        </template>
                        <template v-else-if="(step.config as any).mode === 'parallel'">
                          多个智能体同时生成 → 汇总所有结果
                        </template>
                        <template v-else-if="(step.config as any).mode === 'debate'">
                          正方 vs 反方辩论 → 裁判综合裁决
                        </template>
                      </div>
                    </a-form-item>
                    <a-form-item label="选择成员" required>
                      <a-checkbox-group
                        v-model:value="(step.config as any).personaIds"
                        style="width:100%"
                      >
                        <a-row :gutter="[8, 8]">
                          <a-col :span="12" v-for="p in personas" :key="p.id">
                            <a-checkbox :value="p.id">
                              <span class="persona-check-item">
                                {{ p.avatar }} {{ p.name }}
                              </span>
                            </a-checkbox>
                          </a-col>
                        </a-row>
                      </a-checkbox-group>
                      <a-typography-text v-if="(step.config as any).personaIds?.length < 2" type="danger" style="font-size:12px">
                        至少选择 2 个智能体
                      </a-typography-text>
                      <div class="form-extra-link">
                        <router-link to="/team/employees">管理智能体库 →</router-link>
                      </div>
                    </a-form-item>
                    <a-form-item label="任务描述">
                      <a-textarea
                        v-model:value="(step.config as any).task"
                        :rows="3"
                        placeholder="描述这个智能体团队要完成的任务..."
                      />
                      <VarPicker
                        v-if="index > 0"
                        :steps="form.steps"
                        :currentIndex="index"
                        @pick="(ref: string) => { const c = step.config as any; c.task = (c.task || '') + ' ' + ref; }"
                      />
                    </a-form-item>
                    <a-form-item label="输出变量名">
                      <a-input v-model:value="(step.config as any).outputKey" placeholder="result" style="width: 200px" />
                    </a-form-item>
                  </template>

                  <!-- Dify 工作流配置 -->
                  <template v-if="step.type === 'dify.workflow'">
                    <a-form-item label="Dify 工作流">
                      <a-select v-model:value="(step.config as any).workflowId" placeholder="选择 Dify 工作流" @change="onDifyWfChange(step)">
                        <a-select-option v-for="w in difyWorkflows" :key="w.id" :value="w.id">
                          {{ w.name }}
                        </a-select-option>
                      </a-select>
                      <div class="form-extra-link">
                        <router-link to="/ai/dify">管理 Dify 连接 →</router-link>
                      </div>
                    </a-form-item>

                    <!-- 选中的工作流内部节点预览 -->
                    <div v-if="getDifyWf((step.config as any).workflowId)" class="dify-preview">
                      <div class="dify-preview__title">🔀 工作流节点 ({{ getDifyWf((step.config as any).workflowId)?.nodes.length }} 个)</div>
                      <DifyFlow :workflow="getDifyWf((step.config as any).workflowId)" />
                    </div>

                    <!-- 输入变量映射 -->
                    <div v-if="getDifyWf((step.config as any).workflowId)" class="dify-mapping">
                      <div class="dify-mapping__title">📥 输入变量映射</div>
                      <div class="dify-mapping__row" v-for="inp in getDifyWf((step.config as any).workflowId)?.inputs" :key="inp.name">
                        <span class="dify-mapping__var">
                          {{ inp.label }}
                          <code>{{ inp.name }}</code>
                          <span v-if="inp.required" style="color:#ff4d4f">*</span>
                        </span>
                        <span class="dify-mapping__arrow">←</span>
                        <a-input
                          size="small"
                          :value="(step.config as any).inputMapping?.[inp.name] || ''"
                          :placeholder="inp.name"
                          style="flex:1"
                          @change="(e: any) => { if (!(step.config as any).inputMapping) (step.config as any).inputMapping = {}; (step.config as any).inputMapping[inp.name] = e.target.value; }"
                        />
                        <VarPicker
                          :steps="form.steps"
                          :currentIndex="index"
                          @pick="(ref: string) => { const c = step.config as any; if (!c.inputMapping) c.inputMapping = {}; c.inputMapping[inp.name] = (c.inputMapping[inp.name] || '') + ref; }"
                        />
                      </div>
                    </div>

                    <!-- 输出变量 -->
                    <div v-if="getDifyWf((step.config as any).workflowId)" class="dify-outputs">
                      <div class="dify-outputs__title">📤 输出变量（可在后续步骤引用）</div>
                      <span v-for="o in getDifyWf((step.config as any).workflowId)?.outputs" :key="o.name" class="dify-output-tag">
                        {{ o.label }} <code>{{ o.name }}</code>
                      </span>
                    </div>

                    <a-form-item label="超时（秒）">
                      <a-input-number v-model:value="(step.config as any).timeout" :min="10" :max="600" style="width:100px" />
                    </a-form-item>
                    <a-form-item label="输出变量名">
                      <a-input v-model:value="(step.config as any).outputKey" placeholder="result" style="width: 200px" />
                    </a-form-item>
                  </template>

                  <!-- AI 生图配置 -->
                  <template v-if="step.type === 'ai.generate_image'">
                    <a-form-item label="输出变量名">
                      <a-input v-model:value="(step.config as any).outputKey" placeholder="image" style="width: 200px" />
                    </a-form-item>
                    <a-form-item label="图片描述 Prompt">
                      <a-textarea v-model:value="(step.config as any).prompt" :rows="3" />
                    </a-form-item>
                  </template>

                  <!-- 发布平台配置 -->
                  <template v-if="step.type === 'platform.post'">
                    <a-form-item label="发布账号">
                      <a-select
                        v-model:value="(step.config as any).accountId"
                        placeholder="选择已连接的平台账号"
                        allow-clear
                      >
                        <a-select-option
                          v-for="acct in connectedPlatforms"
                          :key="acct.id"
                          :value="acct.id"
                          :disabled="acct.status !== 'connected'"
                        >
                          <span class="select-account-item">
                            <a-avatar :src="acct.avatar" :size="20" />
                            <span class="select-account-name">{{ acct.nickname }}</span>
                            <a-tag :color="acct.status === 'connected' ? 'green' : 'default'" size="small">
                              {{ acct.status === 'connected' ? '已连接' : '未连接' }}
                            </a-tag>
                            <span class="select-account-platform">{{ PLATFORM_LABELS[acct.platform] }}</span>
                          </span>
                        </a-select-option>
                      </a-select>
                      <div class="form-extra-link">
                        <router-link to="/media/accounts">管理平台账号 →</router-link>
                      </div>
                    </a-form-item>
                    <a-form-item label="内容">
                      <a-textarea v-model:value="(step.config as any).content" :rows="3" />
                      <VarPicker
                        v-if="index > 0"
                        :steps="form.steps"
                        :currentIndex="index"
                        @pick="(ref: string) => { const c = step.config as any; c.content = (c.content || '') + ' ' + ref; }"
                      />
                    </a-form-item>
                  </template>

                  <!-- HTTP 请求配置 -->
                  <template v-if="step.type === 'http.request'">
                    <a-row :gutter="12">
                      <a-col :span="6">
                        <a-form-item label="方法">
                          <a-select v-model:value="(step.config as any).method">
                            <a-select-option value="GET">GET</a-select-option>
                            <a-select-option value="POST">POST</a-select-option>
                          </a-select>
                        </a-form-item>
                      </a-col>
                      <a-col :span="18">
                        <a-form-item label="URL">
                          <a-input v-model:value="(step.config as any).url" placeholder="https://api.example.com/data" />
                        </a-form-item>
                      </a-col>
                    </a-row>
                    <a-form-item label="输出变量名">
                      <a-input v-model:value="(step.config as any).outputKey" placeholder="data" style="width: 200px" />
                    </a-form-item>
                  </template>

                  <!-- 条件分支配置 -->
                  <template v-if="step.type === 'condition'">
                    <a-form-item label="条件描述">
                      <a-input v-model:value="(step.config as any).expression" placeholder="如：'客户列表不为空'" />
                    </a-form-item>
                    <a-form-item label="分支">
                      <div v-for="(branch, bi) in (step.config as any).branches" :key="bi" style="margin-bottom:8px">
                        <a-input-group compact>
                          <a-input v-model:value="branch.label" style="width:40%" placeholder="分支名" />
                          <a-select v-model:value="branch.target" style="width:30%">
                            <a-select-option value="next">→ 下一步</a-select-option>
                            <a-select-option value="end">→ 结束</a-select-option>
                          </a-select>
                          <a-button @click="(step.config as any).branches.splice(bi, 1)" danger>-</a-button>
                        </a-input-group>
                      </div>
                      <a-button size="small" @click="(step.config as any).branches.push({label:'', target:'next'})">+ 添加分支</a-button>
                    </a-form-item>
                  </template>

                  <!-- 通知配置 -->
                  <template v-if="step.type === 'notification'">
                    <a-form-item label="渠道">
                      <a-radio-group v-model:value="(step.config as any).channel">
                        <a-radio value="inapp">站内消息</a-radio>
                        <a-radio value="email">邮件</a-radio>
                        <a-radio value="wechat">微信</a-radio>
                      </a-radio-group>
                    </a-form-item>
                    <a-form-item label="标题">
                      <a-input v-model:value="(step.config as any).title" />
                    </a-form-item>
                    <a-form-item label="内容">
                      <a-textarea v-model:value="(step.config as any).content" :rows="3" />
                      <VarPicker
                        v-if="index > 0"
                        :steps="form.steps"
                        :currentIndex="index"
                        @pick="(ref: string) => { const c = step.config as any; c.content = (c.content || '') + ' ' + ref; }"
                      />
                    </a-form-item>
                  </template>

                  <!-- 延时配置 -->
                  <template v-if="step.type === 'delay'">
                    <a-form-item label="等待时长（秒）">
                      <a-input-number v-model:value="(step.config as any).seconds" :min="1" :max="86400" />
                    </a-form-item>
                  </template>
                </a-form>

                <!-- 测试结果 -->
                <div v-if="testResults[index]" :class="['test-result', { 'test-result--error': testResults[index].error }]">
                  <div class="test-result__head">
                    <template v-if="testResults[index].error">
                      ❌ 测试失败
                    </template>
                    <template v-else>
                      ✅ 测试成功 <span class="test-result__dur">{{ testResults[index].duration }}ms</span>
                    </template>
                    <a-button type="link" size="small" @click="delete testResults[index]">清除</a-button>
                  </div>
                  <pre class="test-result__output">{{ testResults[index].output || testResults[index].error }}</pre>
                </div>
              </a-card>
            </template>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 画布模式 -->
    <a-card :bordered="false" style="margin-bottom: 16px" v-if="editorMode === 'canvas'">
      <template #title>
        <span>🎨 可视化编排</span>
        <a-tag style="margin-left: 8px">{{ form.steps.length }} 节点</a-tag>
      </template>
      <template #extra>
        <a-dropdown :trigger="['click']">
          <a-button type="dashed" size="small"><PlusOutlined /> 添加节点</a-button>
          <template #overlay>
            <a-menu @click="addStep">
              <a-menu-item key="ai.chat">🤖 AI 对话</a-menu-item>
              <a-menu-item key="agent.team">🤝 智能体团队</a-menu-item>
              <a-menu-item key="dify.workflow">🔌 Dify 工作流</a-menu-item>
              <a-menu-item key="condition">🔀 条件分支</a-menu-item>
              <a-menu-item key="http.request">🌐 HTTP 请求</a-menu-item>
              <a-menu-item key="notification">📬 通知</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <span style="font-size:11px;color:#999">拖拽右侧圆点连线 · 拖拽节点移动位置</span>
      </template>
      <FlowCanvas
        :nodes="canvasNodes"
        :edges="canvasEdges"
        @selectNode="onCanvasSelect"
        @addEdge="onCanvasAddEdge"
        @moveNode="onCanvasMoveNode"
      />
      <!-- 选中节点配置面板 -->
      <div v-if="selectedCanvasNode" class="canvas-config" style="margin-top:12px">
        <a-alert :message="`已选中节点: ${selectedCanvasTitle}`" type="info" show-icon style="margin-bottom:8px">
          <template #action>
            <a-button size="small" type="link" @click="editCanvasNode">编辑配置</a-button>
            <a-button size="small" type="link" danger @click="removeCanvasNode">删除</a-button>
          </template>
        </a-alert>
      </div>
    </a-card>

    <!-- AI 编排弹窗 -->
    <AiComposeModal
      :visible="openAiModal"
      @close="openAiModal = false"
      @applied="onAiApplied"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import { RobotOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons-vue";
import { getAutomationDetail, saveAutomation, testStep, getPlatformAccounts, getPersonas, getDifyWorkflows } from "../api/automation";
import type { AutomationDef, StepNode, StepType, AiComposeResponse, PlatformAccount, AgentPersona, DifyWorkflow } from "../types";
import { PLATFORM_LABELS } from "../types";
import TriggerSelector from "../components/TriggerSelector.vue";
import StepCard from "../components/StepCard.vue";
import VarPicker from "../components/VarPicker.vue";
import DifyFlow from "../components/DifyFlow.vue";
import FlowCanvas from "../components/FlowCanvas.vue";
import type { FlowNode, FlowEdge } from "../components/FlowCanvas.vue";
import AiComposeModal from "../components/AiComposeModal.vue";

const router = useRouter();
const route = useRoute();

// ==================== 状态 ====================
const isNew = computed(() => !route.params.id);
const editingIndex = ref(-1);
const saving = ref(false);
const openAiModal = ref(false);
const editorMode = ref<"list" | "canvas">("list");
const nodePositions = ref<Record<string, { x: number; y: number }>>({});
const testingIndex = ref(-1);
const testResults = ref<Record<number, { output: string; duration: number; error?: string }>>({});
const connectedPlatforms = ref<PlatformAccount[]>([]);
const personas = ref<AgentPersona[]>([]);
const difyWorkflows = ref<DifyWorkflow[]>([]);

const EMPTY_FORM = (): Omit<AutomationDef, "id" | "createdAt" | "updatedAt" | "runCount"> => ({
  name: "",
  description: "",
  icon: "ThunderboltOutlined",
  category: "custom" as const,
  trigger: { type: "manual", label: "手动触发" },
  steps: [],
  enabled: false,
});

const form = reactive(EMPTY_FORM());

// ==================== 步骤添加 ====================
const STEP_META: Record<StepType, { icon: string; label: string }> = {
  "ai.chat": { icon: "🤖", label: "AI 对话" },
  "agent.team": { icon: "🤝", label: "智能体团队" },
  "dify.workflow": { icon: "🔌", label: "Dify 工作流" },
  "ai.generate_image": { icon: "🎨", label: "AI 生图" },
  "platform.post": { icon: "📮", label: "发布平台" },
  "http.request": { icon: "🌐", label: "HTTP 请求" },
  condition: { icon: "🔀", label: "条件分支" },
  delay: { icon: "⏱️", label: "延时等待" },
  transform: { icon: "🔄", label: "数据转换" },
  notification: { icon: "📬", label: "通知" },
};

function addStep(e: { key: string }): void {
  const type = e.key as StepType;
  const id = `s${form.steps.length + 1}_${Date.now()}`;
  const defaultConfig = getDefaultConfig(type);

  const step: StepNode = {
    id,
    type,
    title: STEP_META[type]?.label || type,
    config: defaultConfig,
    enabled: true,
  };

  form.steps.push(step);
  editingIndex.value = form.steps.length - 1;
}

function getDefaultConfig(type: StepType): any {
  switch (type) {
    case "ai.chat": return { personaId: "", prompt: "", outputKey: "output" };
    case "agent.team": return { personaIds: [], mode: "serial_review" as const, task: "", outputKey: "result" };
    case "dify.workflow": return { connectionId: "dify_01", workflowId: "", inputMapping: {}, timeout: 120, outputKey: "result" };
    case "ai.generate_image": return { prompt: "", outputKey: "image" };
    case "platform.post": return { accountId: "", content: "", tags: [] };
    case "http.request": return { url: "", method: "GET", outputKey: "data" };
    case "condition": return { expression: "", branches: [{ label: "继续", target: "next" }, { label: "结束", target: "end" }] };
    case "delay": return { seconds: 60 };
    case "notification": return { channel: "inapp", title: "", content: "" };
    case "transform": return { template: "", outputKey: "result" };
    default: return {};
  }
}

const aiConfig = computed(() => form.steps[editingIndex.value]?.config as any);

function startEdit(index: number): void {
  editingIndex.value = index;
}

async function handleTestStep(index: number): Promise<void> {
  const step = form.steps[index];
  testingIndex.value = index;
  delete testResults.value[index];
  try {
    const result = await testStep(step.type, step.config as Record<string, any>);
    testResults.value[index] = result;
  } catch (e: any) {
    testResults.value[index] = { output: "", duration: 0, error: e?.message || "测试失败" };
  } finally {
    testingIndex.value = -1;
  }
}

function removeStep(index: number): void {
  form.steps.splice(index, 1);
  if (editingIndex.value >= form.steps.length) editingIndex.value = -1;
}

// ==================== 画布模式 ====================
const selectedCanvasNode = ref<string | null>(null);
const selectedCanvasTitle = computed(() => form.steps.find((s) => s.id === selectedCanvasNode.value)?.title ?? "");

const canvasNodes = computed<FlowNode[]>(() =>
  form.steps.map((s, i) => ({
    id: s.id,
    type: s.type,
    title: s.title || s.type,
    x: nodePositions.value[s.id]?.x ?? 60 + (i % 3) * 200,
    y: nodePositions.value[s.id]?.y ?? 60 + Math.floor(i / 3) * 120,
  }))
);

const canvasEdges = computed<FlowEdge[]>(() => {
  const edges: FlowEdge[] = [];
  for (let i = 0; i < form.steps.length - 1; i++) {
    edges.push({ id: `e_${form.steps[i].id}_${form.steps[i+1].id}`, from: form.steps[i].id, to: form.steps[i + 1].id });
  }
  return edges;
});

function onCanvasSelect(nodeId: string) {
  selectedCanvasNode.value = selectedCanvasNode.value === nodeId ? null : nodeId;
  const idx = form.steps.findIndex((s) => s.id === nodeId);
  if (idx >= 0) editingIndex.value = idx;
}

function onCanvasAddEdge(fromId: string, toId: string) {
  const fromIdx = form.steps.findIndex((s) => s.id === fromId);
  const toIdx = form.steps.findIndex((s) => s.id === toId);
  if (fromIdx >= 0 && toIdx >= 0) {
    message.success(`已创建连接: ${form.steps[fromIdx].title} → ${form.steps[toIdx].title}`);
  }
}

function onCanvasMoveNode(nodeId: string, x: number, y: number) {
  nodePositions.value[nodeId] = { x, y };
}

function editCanvasNode() {
  if (selectedCanvasNode.value) {
    const idx = form.steps.findIndex((s) => s.id === selectedCanvasNode.value);
    if (idx >= 0) editingIndex.value = idx;
    editorMode.value = "list"; // 切回列表模式编辑配置
  }
}

function removeCanvasNode() {
  if (selectedCanvasNode.value) {
    form.steps = form.steps.filter((s) => s.id !== selectedCanvasNode.value);
    selectedCanvasNode.value = null;
  }
}

function updateStep(index: number, step: StepNode): void {
  form.steps[index] = { ...step };
}

// ==================== 保存 ====================
async function handleSave(): Promise<void> {
  if (!form.name.trim()) {
    message.warning("请输入工作流名称");
    return;
  }
  saving.value = true;
  try {
    await saveAutomation({
      ...form,
      runCount: 0,
      id: (route.params.id as string) || undefined,
    });
    message.success("保存成功");
    router.push("/automation/list");
  } catch {
    message.error("保存失败");
  } finally {
    saving.value = false;
  }
}

function goBack(): void {
  router.push("/automation/list");
}

// ==================== AI 编排应用 ====================
function onAiApplied(def: AiComposeResponse["def"]): void {
  Object.assign(form, def);
  message.success("AI 生成的流程已载入，可继续调整");
}

// ==================== 平台连接 & 智能体 ====================
async function loadPlatformAccounts(): Promise<void> {
  connectedPlatforms.value = await getPlatformAccounts();
}
async function loadPersonas(): Promise<void> {
  personas.value = await getPersonas();
}
async function loadDifyWorkflows(): Promise<void> {
  difyWorkflows.value = await getDifyWorkflows();
}

function getDifyWf(id: string): DifyWorkflow | undefined {
  return difyWorkflows.value.find((w) => w.id === id);
}
function onDifyWfChange(step: StepNode): void {
  const wf = getDifyWf((step.config as any).workflowId);
  if (wf && !(step.config as any).inputMapping) {
    (step.config as any).inputMapping = {};
  }
}

// ==================== 加载 ====================
onMounted(async () => {
  await Promise.all([loadPlatformAccounts(), loadPersonas(), loadDifyWorkflows()]);
  const preset = history.state?.preset as AiComposeResponse["def"] | undefined;
  if (preset) {
    Object.assign(form, preset);
    history.replaceState({}, "");
    return;
  }
  if (!isNew.value) {
    const detail = await getAutomationDetail(route.params.id as string);
    if (detail) {
      Object.assign(form, detail);
    }
  }
});
</script>

<style scoped>
.editor-page {
  max-width: 900px;
  margin: 0 auto;
}
.editor-header {
  margin-bottom: 16px;
}
.step-list {
  position: relative;
}
.step-chain {
  position: relative;
}
.step-connector {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}
.connector-line {
  width: 2px;
  height: 24px;
  background: #d9d9d9;
  border-radius: 1px;
}
.step-wrapper {
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
}
.step-wrapper:hover {
  background: #fafafa;
}
.step-wrapper--editing {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  padding: 4px;
}
.step-edit-card {
  border: none;
}
.empty-steps {
  padding: 48px 0;
  text-align: center;
}

/* 测试结果 */
.test-result {
  margin-top: 12px;
  border-radius: 6px;
  border: 1px solid #d9f7be;
  overflow: hidden;
}
.test-result--error {
  border-color: #ffccc7;
}
.test-result__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  background: #f6ffed;
}
.test-result--error .test-result__head {
  background: #fff2f0;
}
.test-result__dur {
  color: #999;
  font-weight: 400;
}
.test-result__output {
  margin: 0;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
  color: #333;
  font-family: inherit;
}
.test-result--error .test-result__output {
  color: #cf1322;
}

/* 下拉选项内的账号样式 */
.select-account-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.select-account-name {
  font-weight: 500;
}
.select-account-platform {
  font-size: 11px;
  color: #999;
  margin-left: 2px;
}
.form-extra-link {
  margin-top: 4px;
  font-size: 12px;
}
.form-extra-link a {
  color: #1677ff;
}
.persona-check-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Dify 工作流配置 */
.dify-preview { background: #fafafa; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
.dify-preview__title { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 6px; }
.dify-preview__nodes { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; font-size: 11px; }
.dify-node-tag { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; background: #fff; border-radius: 4px; border: 1px solid #e8e8e8; white-space: nowrap; }
.dify-node-tag__dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.dify-node-arrow { color: #bbb; margin: 0 2px; }

.dify-mapping { background: #f0f5ff; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; }
.dify-mapping__title { font-size: 12px; font-weight: 600; color: #1677ff; margin-bottom: 8px; }
.dify-mapping__row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.dify-mapping__var { font-size: 12px; min-width: 100px; color: #333; }
.dify-mapping__var code { font-size: 10px; color: #999; margin-left: 4px; }
.dify-mapping__arrow { color: #bbb; font-size: 14px; }

.dify-outputs { background: #f6ffed; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
.dify-outputs__title { font-size: 12px; font-weight: 600; color: #52c41a; margin-bottom: 4px; }
.dify-output-tag { display: inline-block; padding: 2px 8px; background: #fff; border-radius: 4px; font-size: 11px; margin: 2px 4px 0 0; }
.dify-output-tag code { font-size: 10px; color: #999; }
</style>
