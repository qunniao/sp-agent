<template>
  <div class="page-container">
    <a-page-header title="虚拟团队" sub-title="由多个智能体组成的虚拟团队，输入任务即刻启动协作" style="padding:0;margin-bottom:16px">
      <template #extra>
        <a-button type="primary" @click="openEditor(null)"><PlusOutlined /> 创建团队</a-button>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <div class="team-room-list" v-if="teams.length > 0">
        <div class="team-room" v-for="t in teams" :key="t.id">
          <!-- 左侧：团队身份 -->
          <div class="team-room__identity">
            <div class="team-room__members">
              <div
                v-for="pid in t.personaIds"
                :key="pid"
                class="team-room__member"
                :title="getPersonaById(pid)?.role"
              >
                <span class="team-room__member-avatar">{{ getPersonaById(pid)?.avatar || '🤖' }}</span>
                <span class="team-room__member-name">{{ getPersonaById(pid)?.name || pid }}</span>
              </div>
            </div>
            <div class="team-room__meta">
              <h3 class="team-room__name">{{ t.name }}</h3>
              <a-tag :color="t.defaultMode === 'serial_review' ? '#1677ff' : t.defaultMode === 'parallel' ? '#52c41a' : '#fa8c16'">
                {{ t.defaultMode === 'serial_review' ? '串行审核' : t.defaultMode === 'parallel' ? '并行生成' : '辩论裁决' }}
              </a-tag>
              <p class="team-room__desc">{{ t.description }}</p>
            </div>
          </div>

          <!-- 中间：任务入口 -->
          <div class="team-room__task">
            <div class="team-room__task-label">💬 给团队派个任务</div>
            <div class="team-room__task-input-row">
              <a-textarea
                v-model:value="teamTasks[t.id]"
                :rows="2"
                :placeholder="taskPlaceholders[t.defaultMode]"
                @pressEnter="(e: KeyboardEvent) => { if (!e.shiftKey) { e.preventDefault(); launchTeam(t.id); } }"
              />
              <a-button type="primary" @click="launchTeam(t.id)" :loading="launching === t.id">
                <SendOutlined /> 启动
              </a-button>
            </div>
            <div class="team-room__quick-tasks">
              <span
                v-for="qt in getQuickTasks(t.defaultMode)"
                :key="qt"
                class="quick-task-chip"
                @click="teamTasks[t.id] = qt; launchTeam(t.id)"
              >{{ qt.slice(0, 24) }}{{ qt.length > 24 ? '...' : '' }}</span>
            </div>
          </div>

          <!-- 右侧：操作 -->
          <div class="team-room__actions">
            <a-button size="small" @click="openEditor(t)"><EditOutlined /></a-button>
            <a-popconfirm title="删除此团队？" @confirm="handleDelete(t.id)">
              <a-button size="small" danger><DeleteOutlined /></a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>

      <a-empty v-else description="还没有虚拟团队，创建一个吧">
        <a-button type="primary" @click="openEditor(null)">创建第一个团队</a-button>
      </a-empty>
    </a-spin>

    <!-- 编辑 Drawer -->
    <a-drawer :title="editingId ? '编辑团队' : '创建团队'" :open="drawerVisible" width="480px" @close="drawerVisible = false">
      <a-form layout="vertical">
        <a-form-item label="团队名称" required>
          <a-input v-model:value="form.name" placeholder="如：内容创作组" :maxlength="15" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="2" placeholder="描述团队的协作方式..." />
        </a-form-item>
        <a-form-item label="默认协作模式">
          <a-radio-group v-model:value="form.defaultMode" button-style="solid" size="small">
            <a-radio-button value="serial_review">🔗 串行审核</a-radio-button>
            <a-radio-button value="parallel">⚡ 并行生成</a-radio-button>
            <a-radio-button value="debate">⚔️ 辩论裁决</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="选择成员" required>
          <a-checkbox-group v-model:value="form.personaIds" style="width:100%">
            <a-row :gutter="[8,8]">
              <a-col :span="12" v-for="p in personas" :key="p.id">
                <a-checkbox :value="p.id">{{ p.avatar }} {{ p.name }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-button type="primary" block :loading="saving" @click="handleSave">保存</a-button>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { PlusOutlined, SendOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import { getTeams, saveTeam, deleteTeam, getPersonas } from "../api/automation";
import type { AgentPersona, PersonaTeam } from "../types";

const router = useRouter();
const teams = ref<PersonaTeam[]>([]);
const personas = ref<AgentPersona[]>([]);
const loading = ref(false);
const saving = ref(false);
const drawerVisible = ref(false);
const editingId = ref<string | null>(null);
const teamTasks = ref<Record<string, string>>({});
const launching = ref<string | null>(null);

const EMPTY = (): Omit<PersonaTeam, "id" | "createdAt"> => ({
  name: "", description: "", personaIds: [], defaultMode: "serial_review",
});
const form = reactive(EMPTY());

const taskPlaceholders: Record<string, string> = {
  serial_review: "输入任务，团队会先创作、再审查、修订后输出最终结果...",
  parallel: "输入任务，团队成员会并行生成多个版本供你选择...",
  debate: "输入议题，正方和反方辩论后由裁判给出综合裁决...",
};

function getPersonaById(id: string): AgentPersona | undefined {
  return personas.value.find((p) => p.id === id);
}

function getQuickTasks(mode: string): string[] {
  if (mode === "serial_review") return ["帮我写一篇产品发布公告", "审查这篇文案的准确性和语气", "生成一份客户方案的初稿"];
  if (mode === "parallel") return ["生成 3 个不同风格的营销标题", "产品介绍 3 种写法：正式/口语/极简"];
  if (mode === "debate") return ["我应该提价 20% 还是保持现有定价？", "这个新功能要不要优先开发？"];
  return [];
}

async function launchTeam(teamId: string): Promise<void> {
  const task = teamTasks.value[teamId]?.trim();
  if (!task) return;
  launching.value = teamId;
  await new Promise((r) => setTimeout(r, 600));
  launching.value = null;
  teamTasks.value[teamId] = "";
  message.success(`团队「${teams.value.find(t => t.id === teamId)?.name}」已启动`);
  router.push("/ai/workspace");
}

async function load(): Promise<void> {
  loading.value = true;
  try { [teams.value, personas.value] = await Promise.all([getTeams(), getPersonas()]); }
  finally { loading.value = false; }
}

function openEditor(t: PersonaTeam | null): void {
  if (t) { editingId.value = t.id; Object.assign(form, t); }
  else { editingId.value = null; Object.assign(form, EMPTY()); }
  drawerVisible.value = true;
}

async function handleSave(): Promise<void> {
  if (!form.name.trim()) { message.warning("请输入团队名称"); return; }
  if (form.personaIds.length < 2) { message.warning("至少选择 2 个成员"); return; }
  saving.value = true;
  try {
    const saved = await saveTeam({ ...form, id: editingId.value || undefined });
    if (editingId.value) {
      const idx = teams.value.findIndex((t) => t.id === editingId.value);
      if (idx >= 0) teams.value[idx] = saved;
    } else { teams.value.push(saved); }
    drawerVisible.value = false;
    message.success("保存成功");
  } catch { message.error("保存失败"); }
  finally { saving.value = false; }
}

async function handleDelete(id: string): Promise<void> {
  await deleteTeam(id);
  teams.value = teams.value.filter((x) => x.id !== id);
  message.success("已删除");
}

onMounted(load);
</script>

<style scoped>
.team-room-list { display: flex; flex-direction: column; gap: 16px; }
.team-room {
  display: flex; align-items: flex-start; gap: 20px;
  padding: 20px 24px; background: #fff; border-radius: 14px;
  border: 1px solid #f0f0f0; transition: border-color 0.2s, box-shadow 0.2s;
}
.team-room:hover { border-color: #d9d9d9; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }
.team-room__identity { display: flex; gap: 16px; min-width: 260px; max-width: 320px; }
.team-room__members {
  display: flex; flex-direction: column; gap: 2px;
  padding: 6px 10px; background: #fafafa; border-radius: 10px; min-width: 70px;
}
.team-room__member { display: flex; align-items: center; gap: 6px; padding: 2px 0; }
.team-room__member-avatar { font-size: 18px; }
.team-room__member-name { font-size: 12px; font-weight: 500; color: #555; white-space: nowrap; }
.team-room__meta { display: flex; flex-direction: column; gap: 4px; }
.team-room__name { font-size: 16px; font-weight: 700; margin: 0; }
.team-room__desc { font-size: 12px; color: #888; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.team-room__task { flex: 1; min-width: 0; }
.team-room__task-label { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 6px; }
.team-room__task-input-row { display: flex; gap: 8px; align-items: flex-start; }
.team-room__quick-tasks { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.quick-task-chip {
  font-size: 11px; color: #999; cursor: pointer; padding: 2px 8px;
  background: #f5f5f5; border-radius: 10px; transition: color 0.15s, background 0.15s;
  white-space: nowrap;
}
.quick-task-chip:hover { color: #1677ff; background: #f0f5ff; }
.team-room__actions { display: flex; gap: 4px; flex-shrink: 0; padding-top: 2px; }
</style>
