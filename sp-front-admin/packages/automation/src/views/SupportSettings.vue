<template>
  <div class="page-container">
    <a-page-header title="客服设置" sub-title="配置 AI 从哪里获取回复内容，以及通过哪个渠道发送" style="padding:0;margin-bottom:16px" />

    <a-spin :spinning="loading">
      <!-- 数据流说明 -->
      <a-alert type="info" show-icon style="margin-bottom:16px">
        <template #message>
          <div class="data-flow">
            <span>📥 客户消息</span> <span style="color:#bbb">→</span>
            <span>🔍 AI 匹配 <strong>知识库</strong> / <strong>快捷模板</strong> / <strong>AI 生成</strong></span> <span style="color:#bbb">→</span>
            <span>✍️ 生成回复</span> <span style="color:#bbb">→</span>
            <span>📤 通过 <strong>渠道连接</strong> 发送</span>
          </div>
        </template>
      </a-alert>

      <!-- 渠道连接 - 可展开配置 -->
      <a-card :bordered="false" title="📡 渠道连接" size="small" style="margin-bottom:16px">
        <a-collapse :bordered="false" :active-key="expandedCh">
          <a-collapse-panel v-for="ch in channels" :key="ch.id">
            <template #header>
              <div class="ch-header">
                <span class="ch-header__icon">{{ CHANNEL_META[ch.channel]?.icon }}</span>
                <span class="ch-header__name">{{ ch.name }}</span>
                <a-tag :color="ch.status === 'connected' ? 'green' : 'default'" size="small">
                  {{ ch.status === 'connected' ? '已连接' : '未连接' }}
                </a-tag>
                <span class="ch-header__label">{{ CHANNEL_META[ch.channel]?.label }}</span>
                <a-switch :checked="ch.status === 'connected'" size="small" @click.stop @change="(v: boolean) => ch.status = v ? 'connected' : 'disconnected'" />
              </div>
            </template>
            <div class="ch-config" v-if="ch.status === 'connected'">
              <a-form layout="vertical" size="small">
                <!-- 网页渠道 -->
                <template v-if="ch.channel === 'web'">
                  <a-form-item label="挂载页面"><a-input value="https://superone.com" /></a-form-item>
                  <a-row :gutter="12">
                    <a-col :span="8"><a-form-item label="气泡颜色"><a-input value="#1677ff" type="color" /></a-form-item></a-col>
                    <a-col :span="8"><a-form-item label="位置"><a-select default-value="bottom-right"><a-select-option value="bottom-right">右下角</a-select-option><a-select-option value="bottom-left">左下角</a-select-option></a-select></a-form-item></a-col>
                    <a-col :span="8"><a-form-item label="离线时隐藏"><a-switch default-checked size="small" /></a-form-item></a-col>
                  </a-row>
                </template>
                <!-- 微信渠道 -->
                <template v-if="ch.channel === 'wechat'">
                  <a-form-item label="公众号 AppID"><a-input value="wx_app_****mock****" /></a-form-item>
                  <a-form-item label="消息加密方式"><a-select default-value="plain"><a-select-option value="plain">明文模式</a-select-option><a-select-option value="compatible">兼容模式</a-select-option><a-select-option value="safe">安全模式</a-select-option></a-select></a-form-item>
                </template>
                <!-- 小红书渠道 -->
                <template v-if="ch.channel === 'xiaohongshu'">
                  <a-form-item label="绑定账号"><a-input value="SuperOne科技号" disabled /></a-form-item>
                  <a-form-item label="私信自动回复"><a-switch default-checked size="small" /></a-form-item>
                  <a-form-item label="评论自动回复"><a-switch size="small" /></a-form-item>
                </template>
                <!-- 淘宝渠道 -->
                <template v-if="ch.channel === 'taobao'">
                  <a-form-item label="店铺 ID"><a-input placeholder="tb_shop_***" /></a-form-item>
                  <a-form-item label="AppKey"><a-input placeholder="***mock***" /></a-form-item>
                  <a-alert message="淘宝渠道未连接，请先授权千牛开放平台" type="warning" show-icon />
                </template>
                <!-- 抖音 -->
                <template v-if="ch.channel === 'douyin'">
                  <a-form-item label="绑定抖音号"><a-input value="老王效率工具" disabled /></a-form-item>
                  <a-form-item label="自动回复私信"><a-switch default-checked size="small" /></a-form-item>
                </template>
                <!-- 抖店 -->
                <template v-if="ch.channel === 'douyin_shop'">
                  <a-form-item label="店铺 ID"><a-input placeholder="ds_shop_***" /></a-form-item>
                  <a-form-item label="售后自动处理"><a-switch size="small" /></a-form-item>
                  <a-alert message="抖店未连接，请先在抖店后台授权" type="warning" show-icon />
                </template>
              </a-form>
            </div>
          </a-collapse-panel>
        </a-collapse>
      </a-card>

      <a-row :gutter="16">
        <!-- 快捷回复模板 -->
        <a-col :span="12">
          <a-card :bordered="false" title="📋 快捷回复模板" size="small" style="margin-bottom:16px">
            <div class="tmpl-item" v-for="(t, i) in templates" :key="i">
              <div class="tmpl-item__name">{{ t.name }}</div>
              <div class="tmpl-item__content">{{ t.content }}</div>
              <div class="tmpl-item__actions">
                <a-button type="link" size="small">插入</a-button>
                <a-button type="link" size="small">编辑</a-button>
              </div>
            </div>
            <a-button type="dashed" block size="small" style="margin-top:8px">+ 添加快捷回复</a-button>
          </a-card>
        </a-col>

        <!-- 工作时间 + 规则 -->
        <a-col :span="12">
          <a-card :bordered="false" title="⏰ 工作时间" size="small" style="margin-bottom:16px">
            <a-form layout="vertical" size="small">
              <a-form-item label="人工在线时段">
                <a-time-range-picker v-model:value="workTime" format="HH:mm" style="width:100%" />
              </a-form-item>
              <a-form-item label="工作日">
                <a-checkbox-group v-model:value="workDays" :options="['一','二','三','四','五','六','日'].map((d,i) => ({label:d,value:i}))" />
              </a-form-item>
              <a-form-item label="非工作时间模式">
                <a-radio-group v-model:value="offMode">
                  <a-radio value="ai_only">仅AI自动回复</a-radio>
                  <a-radio value="ai_urgent">AI回复 + 紧急转通知</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-form>
          </a-card>

          <a-card :bordered="false" title="🎯 智能策略" size="small">
            <div class="rule-item" v-for="(r, i) in strategies" :key="i">
              <a-switch v-model:checked="r.enabled" size="small" />
              <div style="flex:1;margin-left:10px">
                <div class="rule-item__name">{{ r.name }}</div>
                <div class="rule-item__desc">{{ r.desc }}</div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-alert message="以上为 mock 配置界面。正式上线后渠道连接需真实 OAuth 授权，规则由后端引擎驱动。" type="info" show-icon style="margin-top:16px" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getChannels } from "../api/support";
import type { ChannelAccount } from "../types";
import { CHANNEL_META } from "../types";

const channels = ref<ChannelAccount[]>([]);
const loading = ref(false);
const expandedCh = ref<string[]>([]);

const workTime = ref<[any, any] | null>(null);
const workDays = ref([0, 1, 2, 3, 4]);
const offMode = ref("ai_urgent");

const templates = ref([
  { name: "欢迎语", content: "您好！我是 SuperOne AI 客服阿服。有什么可以帮您的？" },
  { name: "价格咨询", content: "SuperOne 提供免费版/专业版¥299/月/企业版¥999/月三种套餐，年付8折。" },
  { name: "技术支持", content: "收到您的问题，我来排查。请问您用的是什么浏览器/设备？" },
  { name: "结束语", content: "问题解决了很高兴！方便的话给这次服务评个分？⭐⭐⭐⭐⭐ 有任何问题随时找我。" },
]);

const strategies = ref([
  { name: "情绪检测转人工", desc: "检测到客户愤怒/不满时自动转入人工队列", enabled: true },
  { name: "2轮未解决转人工", desc: "AI回复2轮后仍不满意转人工", enabled: true },
  { name: "敏感词自动升级", desc: "退款/投诉/律师函 → 高优先级 + 通知人工", enabled: true },
  { name: "满意度自动收集", desc: "会话关闭24h后自动发送满意度问卷", enabled: true },
  { name: "知识库匹配优化", desc: "优先匹配最近更新的知识库文档", enabled: true },
]);

onMounted(async () => { loading.value = true; try { channels.value = await getChannels(); } finally { loading.value = false; } });
</script>

<style scoped>
.data-flow { display: flex; align-items: center; gap: 8px; font-size: 13px; flex-wrap: wrap; }
.data-flow strong { color: #1677ff; }

/* 渠道头部 */
.ch-header { display: flex; align-items: center; gap: 8px; width: 100%; }
.ch-header__icon { font-size: 18px; }
.ch-header__name { font-weight: 500; font-size: 14px; }
.ch-header__label { font-size: 11px; color: #bbb; margin-left: auto; margin-right: 8px; }
.ch-config { padding: 8px 0 0; }

/* 快捷回复 */
.tmpl-item { padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.tmpl-item:last-child { border: none; }
.tmpl-item__name { font-weight: 500; font-size: 13px; }
.tmpl-item__content { font-size: 12px; color: #666; margin: 2px 0; line-height: 1.5; }
.tmpl-item__actions { display: flex; gap: 4px; }

/* 策略 */
.rule-item { display: flex; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.rule-item:last-child { border: none; }
.rule-item__name { font-weight: 500; font-size: 13px; }
.rule-item__desc { font-size: 11px; color: #999; margin-top: 1px; }
</style>
