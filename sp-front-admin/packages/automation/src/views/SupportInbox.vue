<template>
  <div class="support-inbox">
    <!-- 左侧会话列表 -->
    <div class="inbox-sidebar">
      <div class="inbox-sidebar__head">
        <a-select v-model:value="filterChannel" size="small" style="width:100%;margin-bottom:6px" @change="load">
          <a-select-option value="all">📥 全部渠道 ({{ totalCount }})</a-select-option>
          <a-select-option v-for="ch in channels" :key="ch.channel" :value="ch.channel">
            {{ CHANNEL_META[ch.channel]?.icon }} {{ CHANNEL_META[ch.channel]?.label }}
            <span v-if="ch.unreadCount" style="color:red">({{ ch.unreadCount }})</span>
          </a-select-option>
        </a-select>
        <a-radio-group v-model:value="filterStatus" size="small" button-style="solid" @change="load">
          <a-radio-button value="all">全部</a-radio-button>
          <a-radio-button value="ai_handling">AI</a-radio-button>
          <a-radio-button value="pending_human">待人工</a-radio-button>
          <a-radio-button value="resolved">已解决</a-radio-button>
        </a-radio-group>
      </div>
      <div class="inbox-sidebar__list">
        <div
          v-for="s in sessions" :key="s.id"
          :class="['conv-item', { 'conv-item--active': s.id === activeId }]"
          @click="selectConv(s)"
        >
          <div class="conv-item__head">
            <span class="conv-item__ch-icon">{{ CHANNEL_META[s.channel]?.icon }}</span>
            <span class="conv-item__avatar">{{ s.customer.avatar }}</span>
            <span class="conv-item__name">{{ s.customer.name }}</span>
            <span v-if="s.priority === 'urgent'" style="font-size:10px">🔴</span>
          </div>
          <div class="conv-item__title">{{ s.title }}</div>
          <div class="conv-item__foot">
            <span class="conv-item__channel">{{ CHANNEL_META[s.channel]?.label }}</span>
            <span :class="['conv-item__status', `conv-item__status--${s.status}`]">
              {{ s.status === 'ai_handling' ? '🤖AI' : s.status === 'pending_human' ? '🟡待处理' : s.status === 'resolved' ? '✅已解决' : '👤人工' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧对话详情 -->
    <div class="inbox-main" v-if="activeConv">
      <div class="inbox-main__head">
        <div>
          <span class="inbox-chn-badge" :style="{ background: CHANNEL_META[activeConv.channel]?.color }">
            {{ CHANNEL_META[activeConv.channel]?.icon }} {{ CHANNEL_META[activeConv.channel]?.label }}
          </span>
          <strong>{{ activeConv.customer.name }}</strong>
          <span style="color:#999;font-size:12px;margin-left:6px">{{ activeConv.channelAccount }}</span>
          <a-tag v-for="t in activeConv.tags" :key="t" size="small" color="blue" style="margin-left:4px">{{ t }}</a-tag>
        </div>
        <a-space>
          <a-button size="small" v-if="activeConv.status !== 'resolved'" type="primary" @click="handleResolve">标记已解决</a-button>
        </a-space>
      </div>

      <div class="inbox-main__messages" ref="msgBox">
        <div v-for="m in activeConv.messages" :key="m.id" :class="['inbox-msg', `inbox-msg--${m.role}`]">
          <div class="inbox-msg__meta">
            <template v-if="m.role === 'customer'">{{ activeConv.customer.name }}</template>
            <template v-else-if="m.role === 'assistant'">🤖 阿服 (AI)</template>
            <template v-else>👤 人工客服</template>
            <span class="inbox-msg__time">{{ m.timestamp.slice(11, 16) }}</span>
          </div>
          <div class="inbox-msg__bubble">{{ m.content }}</div>
          <div v-if="m.attachment" class="inbox-msg__attach">{{ m.attachment }}</div>
          <div v-if="m.sourceRef" class="inbox-msg__source">
            <span class="source-dot" :class="`source-dot--${m.sourceRef.type}`"></span>
            {{ m.sourceRef.label }}
          </div>
        </div>
      </div>

      <div class="inbox-main__input" v-if="activeConv.status !== 'resolved' && activeConv.status !== 'closed'">
        <div style="font-size:11px;color:#bbb;margin-bottom:4px">
          回复将通过 {{ CHANNEL_META[activeConv.channel]?.label }} 发送给 {{ activeConv.customer.name }}
        </div>
        <a-textarea v-model:value="replyText" :rows="2" placeholder="输入回复..." @pressEnter="handleReply" :disabled="replying" />
        <a-button type="primary" size="small" @click="handleReply" :loading="replying" style="margin-top:4px">发送回复</a-button>
      </div>

      <div class="inbox-main__rating" v-if="activeConv.status === 'resolved' && activeConv.rating">
        客户评分: {{ '⭐'.repeat(activeConv.rating) }}
      </div>
    </div>

    <a-empty v-else description="选择会话查看详情" style="margin-top:120px" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { message } from "ant-design-vue";
import { getSessions, getSession, sendReply, resolveSession, getChannels } from "../api/support";
import type { SupportSession, SupportMessage, ChannelAccount } from "../types";
import { CHANNEL_META } from "../types";

const sessions = ref<SupportSession[]>([]);
const channels = ref<ChannelAccount[]>([]);
const totalCount = ref(0);
const activeId = ref<string | null>(null);
const activeConv = ref<SupportSession | null>(null);
const filterChannel = ref("all");
const filterStatus = ref("all");
const replyText = ref("");
const replying = ref(false);
const msgBox = ref<HTMLElement | null>(null);

function lastMsg(s: SupportSession): SupportMessage | undefined { return s.messages[s.messages.length - 1]; }

async function load(): Promise<void> {
  const [res, chs] = await Promise.all([
    getSessions({ channel: filterChannel.value === "all" ? undefined : filterChannel.value, status: filterStatus.value === "all" ? undefined : filterStatus.value }),
    getChannels(),
  ]);
  sessions.value = res.records; totalCount.value = res.total; channels.value = chs;
}

async function selectConv(s: SupportSession): Promise<void> {
  activeId.value = s.id; activeConv.value = await getSession(s.id);
  nextTick(() => { if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight; });
}

async function handleReply(e?: KeyboardEvent): Promise<void> {
  if (e && e.shiftKey) return; if (e) e.preventDefault();
  const t = replyText.value.trim(); if (!t || !activeConv.value) return;
  replying.value = true;
  try {
    await sendReply(activeConv.value.id, t);
    activeConv.value = await getSession(activeConv.value.id)!;
    replyText.value = "";
    nextTick(() => { if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight; });
  } catch { message.error("发送失败"); }
  finally { replying.value = false; }
}

async function handleResolve(): Promise<void> {
  if (!activeConv.value) return;
  await resolveSession(activeConv.value.id);
  activeConv.value.status = "resolved"; message.success("已标记为已解决");
}

onMounted(load);
</script>

<style scoped>
.support-inbox { display: flex; height: calc(100vh - 130px); border: 1px solid #f0f0f0; border-radius: 10px; overflow: hidden; background: #fff; }
.inbox-sidebar { width: 340px; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; overflow: hidden; }
.inbox-sidebar__head { padding: 10px; border-bottom: 1px solid #f0f0f0; background: #fafafa; flex-shrink: 0; }
.inbox-sidebar__list { flex: 1; overflow-y: auto; min-height: 0; }
.conv-item { padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f5f5f5; transition: background 0.1s; }
.conv-item:hover { background: #fafafa; }
.conv-item--active { background: #e6f7ff; border-left: 3px solid #1677ff; }
.conv-item__head { display: flex; align-items: center; gap: 5px; margin-bottom: 2px; }
.conv-item__ch-icon { font-size: 12px; }
.conv-item__avatar { font-size: 16px; }
.conv-item__name { font-weight: 500; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.conv-item__title { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-item__foot { display: flex; justify-content: space-between; margin-top: 2px; font-size: 11px; }
.conv-item__channel { color: #1677ff; }
.conv-item__status { color: #999; }

.inbox-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.inbox-main__head { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f0f0f0; background: #fafafa; flex-wrap: wrap; gap: 6px; flex-shrink: 0; min-height: 0; }
.inbox-chn-badge { display: inline-block; padding: 1px 8px; border-radius: 10px; color: #fff; font-size: 11px; margin-right: 8px; }
.inbox-main__messages { flex: 1; overflow-y: auto; padding: 16px; min-height: 0; }
.inbox-main__input { padding: 10px 16px; border-top: 1px solid #f0f0f0; flex-shrink: 0; }
.inbox-msg { margin-bottom: 14px; }
.inbox-msg--customer { text-align: left; }
.inbox-msg--assistant, .inbox-msg--human { padding-left: 8px; border-left: 3px solid #1677ff; }
.inbox-msg--human { border-left-color: #52c41a; }
.inbox-msg__meta { font-size: 11px; color: #999; margin-bottom: 2px; }
.inbox-msg__time { margin-left: 6px; color: #bbb; }
.inbox-msg__bubble { font-size: 13px; line-height: 1.7; padding: 8px 12px; background: #f5f5f5; border-radius: 8px; display: inline-block; max-width: 80%; white-space: pre-wrap; }
.inbox-msg__attach { margin-top: 4px; padding: 4px 10px; background: #fafafa; border-radius: 6px; font-size: 11px; color: #999; }
.inbox-msg__source { margin-top: 4px; font-size: 10px; color: #bbb; display: flex; align-items: center; gap: 4px; }
.source-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.source-dot--kb { background: #722ed1; }
.source-dot--template { background: #1677ff; }
.source-dot--ai_generated { background: #52c41a; }

.inbox-main__rating { padding: 10px 16px; background: #f6ffed; text-align: center; font-size: 14px; }
</style>
