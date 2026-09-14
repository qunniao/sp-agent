<template>
  <div class="page-container ve-page">
    <a-page-header title="虚拟员工" sub-title="7 名 AI 员工覆盖 7 个部门，点击分配任务自动执行" style="padding:0;margin-bottom:12px">
      <template #extra>
        <a-button type="primary" @click="openEditor(null)"><PlusOutlined /> 招聘</a-button>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <a-tabs v-model:activeKey="activeTab" type="card" size="small" v-if="employees.length > 0">
        <!-- ====== 每个员工 Tab ====== -->
        <a-tab-pane v-for="e in employees" :key="e.id" :tab="`${e.avatar} ${e.name}`">
          <a-row :gutter="16">
            <!-- 左：身份 + 操作 -->
            <a-col :span="10">
              <a-card :bordered="false" size="small" class="emp-profile">
                <div class="emp-profile__head">
                  <span class="emp-profile__avatar">{{ e.avatar }}</span>
                  <div>
                    <div class="emp-profile__name">{{ e.name }}</div>
                    <div class="emp-profile__role">{{ e.role }}</div>
                    <a-tag size="small">{{ DEPARTMENT_MAP[e.department]?.label }}</a-tag>
                    <div class="emp-profile__skills">
                      <a-tag v-for="s in e.skills" :key="s" size="small" color="purple">{{ s }}</a-tag>
                    </div>
                  </div>
                </div>
                <a-divider style="margin:12px 0" />
                <div class="emp-profile__prompt">{{ e.systemPrompt }}</div>
              </a-card>

              <a-card :bordered="false" size="small" title="📋 可执行操作" style="margin-top:12px">
                <div class="cap-list">
                  <div
                    v-for="c in e.capabilities"
                    :key="c"
                    :class="['cap-item', { 'cap-item--running': runningTask === c }]"
                    @click="executeTask(e, c)"
                  >
                    <span class="cap-item__icon">{{ runningTask === c ? '⏳' : '▶️' }}</span>
                    {{ c }}
                  </div>
                </div>
              </a-card>
            </a-col>

            <!-- 右：执行结果 + 工作历史 -->
            <a-col :span="14">
              <!-- 执行结果 -->
              <div v-if="activeResult.empId === e.id && activeResult.output" class="result-card">
                <div class="result-card__head">
                  <span>✅ 任务完成: {{ activeResult.task }}</span>
                  <span class="result-card__time">{{ activeResult.time }}</span>
                  <a-button type="link" size="small" @click="copyText(activeResult.output)">复制</a-button>
                </div>
                <pre class="result-card__body">{{ activeResult.output }}</pre>
              </div>
              <a-empty v-else description="点击左侧操作，查看员工执行结果" :image="false" style="padding:40px 0;background:#fafafa;border-radius:10px" />

              <!-- 最近工作 -->
              <a-card :bordered="false" size="small" title="📋 最近完成的工作" style="margin-top:12px" v-if="mockHistory[e.id]?.length">
                <div class="history-list">
                  <div class="history-row" v-for="h in mockHistory[e.id]" :key="h.time">
                    <span class="history-row__task">✅ {{ h.task }}</span>
                    <span class="history-row__time">{{ h.time }}</span>
                  </div>
                </div>
              </a-card>

              <!-- 快捷对话 -->
              <a-card :bordered="false" size="small" title="💬 快速提问" style="margin-top:12px">
                <div class="quick-chat">
                  <a-textarea v-model:value="chatInputs[e.id]" :rows="2" :placeholder="`直接跟 ${e.name} 说...`" @pressEnter="(ev: KeyboardEvent) => { if(!ev.shiftKey){ ev.preventDefault(); quickChat(e); } }" :disabled="chatSending" />
                  <div class="quick-chat__res" v-if="chatRes[e.id]">{{ chatRes[e.id] }}</div>
                </div>
              </a-card>
            </a-col>
          </a-row>

          <!-- 底部：编辑/解雇 -->
          <div style="margin-top:16px;text-align:right">
            <a-space>
              <a-button size="small" @click="openEditor(e)">编辑资料</a-button>
              <a-popconfirm title="解雇？" @confirm="handleFire(e.id)">
                <a-button size="small" danger>解雇</a-button>
              </a-popconfirm>
            </a-space>
          </div>
        </a-tab-pane>
      </a-tabs>
      <a-empty v-else description="还没有虚拟员工" />
    </a-spin>

    <!-- 编辑 -->
    <a-drawer :title="editingId ? '编辑资料' : '招聘新员工'" :open="drawerVisible" width="520px" @close="drawerVisible = false">
      <a-form layout="vertical">
        <a-row :gutter="12">
          <a-col :span="4"><a-form-item label="头像"><a-input v-model:value="form.avatar" :maxlength="2" style="text-align:center;font-size:24px" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="姓名" required><a-input v-model:value="form.name" :maxlength="8" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="岗位" required><a-input v-model:value="form.role" :maxlength="12" /></a-form-item></a-col>
        </a-row>
        <a-form-item label="部门" required>
          <a-select v-model:value="form.department">
            <a-select-option v-for="(d, k) in DEPARTMENT_MAP" :key="k" :value="k">{{ d.icon }} {{ d.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="技能"><a-select v-model:value="form.skills" mode="tags" placeholder="输入后回车" style="width:100%" /></a-form-item>
        <a-form-item label="可执行操作"><a-select v-model:value="form.capabilities" mode="tags" placeholder="如：生成报表、回复客户" style="width:100%" /></a-form-item>
        <a-form-item label="工作说明" required><a-textarea v-model:value="form.systemPrompt" :rows="5" /></a-form-item>
        <a-button type="primary" block :loading="saving" @click="handleSave">保存</a-button>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import { getEmployees, saveEmployee, deleteEmployee } from "../api/automation";
import type { VirtualEmployee, EmployeeDepartment } from "../types";
import { DEPARTMENT_MAP } from "../types";

const employees = ref<VirtualEmployee[]>([]);
const loading = ref(false);
const activeTab = ref("");

// 编辑
const saving = ref(false); const drawerVisible = ref(false); const editingId = ref<string | null>(null);
const EMPTY = () => ({ name: "", avatar: "🧑", role: "", department: "operation" as EmployeeDepartment, systemPrompt: "", skills: [] as string[], capabilities: [] as string[], linkedModules: [] as string[] });
const form = reactive(EMPTY());
function openEditor(e: VirtualEmployee | null): void {
  if (e) { editingId.value = e.id; Object.assign(form, e); }
  else { editingId.value = null; Object.assign(form, EMPTY()); }
  drawerVisible.value = true;
}
async function handleSave(): Promise<void> {
  if (!form.name.trim() || !form.role.trim()) { message.warning("姓名和岗位不能为空"); return; }
  saving.value = true;
  try {
    const saved = await saveEmployee({ ...form, id: editingId.value || undefined });
    if (editingId.value) { const i = employees.value.findIndex((x) => x.id === editingId.value); if (i >= 0) employees.value[i] = saved; }
    else { employees.value.push(saved); activeTab.value = saved.id; }
    drawerVisible.value = false; message.success("保存成功");
  } catch { message.error("保存失败"); }
  finally { saving.value = false; }
}
async function handleFire(id: string): Promise<void> {
  await deleteEmployee(id); employees.value = employees.value.filter((x) => x.id !== id);
  activeTab.value = "overview"; message.success("已解雇");
}

// Mock 历史
const mockHistory: Record<string, { task: string; time: string }[]> = {
  emp_marketing: [{ task: "生成小红书选题「AI工具对比」", time: "今天 09:00" },{ task: "分析上周内容数据并给出优化建议", time: "昨天 14:30" },{ task: "撰写产品发布公告初稿", time: "6/24 10:00" }],
  emp_sales: [{ task: "生成客户张三的跟进消息", time: "今天 11:00" },{ task: "分析销售漏斗，发现 3 个高意向客户", time: "昨天 16:00" }],
  emp_finance: [{ task: "生成 6 月收支报表", time: "昨天 09:00" },{ task: "分类本月费用并标记异常支出", time: "6/25 14:00" }],
  emp_ops: [{ task: "拆解新功能开发任务为 5 个子任务", time: "今天 10:00" }],
  emp_tech: [{ task: "审查用户管理模块代码", time: "昨天 15:00" }],
  emp_support: [{ task: "回复客户李四的技术咨询", time: "今天 08:30" }],
  emp_legal: [{ task: "审查服务合同第 5.2 条款", time: "6/25 11:00" }],
};

// 任务执行
const runningTask = ref<string | null>(null);
const activeResult = reactive({ empId: "", task: "", output: "", time: "" });
const taskOutputs: Record<string, string> = {
  "记录收支": "📊 收支记录\n\n| 日期 | 类别 | 金额 | 备注 |\n|------|------|------|------|\n| 6/26 | 收入 | ¥12,000 | 项目款 |\n| 6/25 | 支出 | ¥2,300 | 服务器 |\n| 6/24 | 支出 | ¥580 | 软件订阅 |\n\n本月结余: ¥9,120",
  "生成月度报表": "📊 6月财务简报\n\n收入总计: ¥52,000\n支出总计: ¥18,500\n利润: ¥33,500\n\n主要收入: 项目开发 ¥35,000 / AI咨询 ¥15,000\n主要支出: 服务器 ¥5,200 / 外包 ¥8,000 / 税费 ¥3,500\n\n建议: 利润率64%，AI咨询收入增长40%，值得加大投入。",
  "费用分类": "📋 费用分类完成\n\n已为23笔支出打标签:\n🖥️ 基础设施: 6笔 ¥5,200\n🤝 外包: 3笔 ¥8,000\n📚 学习: 4笔 ¥1,200\n☕ 日常: 10笔 ¥4,100\n\n⚠️ 异常: \"软件订阅\"环比增长180%，建议核查。",
  "写跟进消息": "✉️ 致张三:\n\n张总您好！上次方案根据您的反馈做了调整：\n1. 第一期只做核心模块，预算可控制在9万\n2. 附上更新后的方案对比表\n\n方便本周四或五约个15分钟沟通？",
  "生成报价方案": "📄 报价方案\n\n方案A 标准版: ¥80,000 (核心+2个月+3个月维护)\n方案B 精简版: ¥50,000 (MVP+1个月+1个月维护)\n\n建议: 先推方案A留谈判空间，方案B作底牌。",
  "分析客户意向": "📈 本周12位活跃客户\n\n🔴高意向: 3位 (张三/李四/王五)\n🟡中意向: 5位\n🟢低意向: 4位\n\n建议: 优先跟进张三李四，预计本月可转化2单。",
  "创建项目计划": "📋 项目计划 (4周)\n\nW1: 需求确认+技术方案\nW2: 核心功能开发\nW3: 联调+测试\nW4: 客户验收+上线\n\n风险: 第三方API审批周期不可控。",
  "拆解任务": "📋 任务拆解\n\n1.需求文档 (阿运,1天)\n2.技术方案 (阿技,0.5天)\n3.数据库设计 (阿技,1天)\n4.API开发 (阿技,3天)\n5.前端开发 (3天)\n6.联调测试 (1天)\n7.上线 (0.5天)",
  "跟踪里程碑": "📊 W2 核心开发 进度60%\n✅ W1 已完成(+1天延期)\n🔄 W2 进行中(预计按时)\n⏳ W3 未开始\n⏳ W4 未开始\n无新增风险。",
  "写爆款文案": "🔥 为什么AI工具是2026最大的效率杠杆\n\n上周把8小时工作压缩到了3小时:\n1️⃣ 写文档: 2h→15min\n2️⃣ 回邮件: 1h→自动草拟\n3️⃣ 做方案: 3h→AI框架+润色\n\n💡 省下的5小时你会做什么？\n#AI工具 #效率提升 #2026趋势",
  "分析内容数据": "📊 本周总阅读8.9万(↑15%) 互动5,240(↑22%)\n\n🏆最佳: 「3个AI工具」阅读1.2w 收藏率7.2%\n📈洞察: 工具对比收藏率最高6.8%，周末互动高38%\n💡建议: 本周加1篇对比，调至周六上午发布。",
  "规划选题日历": "📅 本周选题\n周一: AI工具对比(数据型)\n周三: 收入复盘(故事型)\n周五: 效率教程(教程型)\n周六: 行业趋势(观点型)\n\n基于上周数据调整了发布时间。",
  "回复客户咨询": "✉️ 回复:\n您好！SuperOne支持绑定自定义域名。\n在「系统管理→系统配置」填入域名，DNS加CNAME即可。\n详细步骤已整理好，需要的话发给您。",
  "审查代码": "🔍 审查: UserController.java\n\n🔴 L87: SQL未参数化，注入风险\n🟡 L112: 循环内DB查询建议外移\n🟡 L180: 缺少输入校验\n🟢 L200: 日志级别debug→info\n\n结论: 逻辑清晰，安全需加强。先修🔴再上线。",
  "设计架构方案": "🏗️ 推荐架构: Vue3+SpringBoot+PG+Redis+K8s\n关键决策:\n- PG优于MySQL: JSON查询和全文搜索\n- 加Redis: 会话缓存和热点数据\n预计: 4-6周(2人)",
  "审查合同条款": "⚖️ 合同审查: 服务合同v3.2\n\n🔴 5.2条: 排他条款过宽\n🟡 8.1条: 违约金30%偏高(行规10-20%)\n🟡 12条: 知识产权归属模糊\n🟢 其余无重大风险\n\n建议: 5.2改为\"合作期间不得为直接竞品提供同类服务\"",
  "标记风险点": "⚠️ 风险评估\n🔴高: 付款周期90天影响现金流\n🟡中: 范围宽泛可能蔓延\n🟡中: 技术栈不匹配\n🟢低: 竞品可控\n建议: 签前明确首付50%+变更控制流程",
};

async function executeTask(e: VirtualEmployee, capability: string): Promise<void> {
  runningTask.value = capability;
  activeResult.empId = ""; activeResult.output = "";
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
  runningTask.value = null;
  const output = taskOutputs[capability] || `✅ 已完成「${capability}」`;
  activeResult.empId = e.id; activeResult.task = capability;
  activeResult.output = output;
  activeResult.time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (!mockHistory[e.id]) mockHistory[e.id] = [];
  mockHistory[e.id].unshift({ task: capability, time: "刚刚" });
}

// 快捷聊天
const chatInputs = ref<Record<string, string>>({});
const chatRes = ref<Record<string, string>>({});
const chatSending = ref(false);
async function quickChat(e: VirtualEmployee): Promise<void> {
  const t = chatInputs.value[e.id]?.trim(); if (!t) return;
  chatRes.value[e.id] = ""; chatSending.value = true;
  await new Promise((r) => setTimeout(r, 1000));
  chatRes.value[e.id] = `🤖 收到「${t.slice(0, 25)}...」。接入LLM后我会基于岗位职责回复。`;
  chatInputs.value[e.id] = ""; chatSending.value = false;
}

function copyText(t: string) { navigator.clipboard?.writeText(t).then(() => message.success("已复制")); }

onMounted(async () => { loading.value = true; try { employees.value = await getEmployees(); if (employees.value[0]) activeTab.value = employees.value[0].id; } finally { loading.value = false; } });
</script>

<style scoped>
.ve-page { max-width: 1000px; margin: 0 auto; }

/* 员工资料 */
.emp-profile__head { display: flex; gap: 12px; align-items: flex-start; }
.emp-profile__avatar { font-size: 44px; }
.emp-profile__name { font-weight: 700; font-size: 18px; }
.emp-profile__role { font-size: 13px; color: #999; }
.emp-profile__skills { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 6px; }
.emp-profile__prompt { font-size: 12px; color: #999; line-height: 1.6; }

/* 操作列表 */
.cap-list { display: flex; flex-direction: column; gap: 6px; }
.cap-item {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f5f5f5;
  border-radius: 10px; cursor: pointer; font-size: 13px; transition: all 0.15s;
}
.cap-item:hover { background: #e6f7ff; }
.cap-item--running { background: #fff7e6; }
.cap-item__icon { font-size: 14px; }

/* 执行结果 */
.result-card { background: #f6ffed; border: 1px solid #d9f7be; border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
.result-card__head { display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 13px; font-weight: 500; background: #f6ffed; }
.result-card__time { color: #999; font-size: 11px; margin-left: auto; }
.result-card__body { margin: 0; padding: 12px 14px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; font-family: inherit; max-height: 400px; overflow-y: auto; background: #fff; }

/* 历史 */
.history-list { display: flex; flex-direction: column; gap: 6px; }
.history-row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; }
.history-row__task { color: #333; }
.history-row__time { color: #bbb; }

/* 快捷聊天 */
.quick-chat__res { margin-top: 8px; padding: 8px 12px; background: #f5f5f5; border-radius: 8px; font-size: 13px; color: #555; }
</style>
