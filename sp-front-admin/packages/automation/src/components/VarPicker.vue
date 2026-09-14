<template>
  <a-dropdown :trigger="['click']" v-if="vars.length > 0">
    <a-button type="link" size="small">
      <LinkOutlined /> 插入变量
    </a-button>
    <template #overlay>
      <div class="var-picker-dropdown">
        <div class="var-picker__title">选择前置步骤的输出变量</div>
        <a-menu @click="onPick">
          <a-menu-item v-for="v in vars" :key="v.key">
            <div class="var-item">
              <span class="var-item__ref">{{ v.ref }}</span>
              <span class="var-item__desc">来自「{{ v.title }}」的 {{ v.outputKey }}</span>
            </div>
          </a-menu-item>
        </a-menu>
        <div class="var-picker__hint">
          提示：引用语法为 &#123;&#123;step.<em>id</em>.<em>outputKey</em>&#125;&#125;
        </div>
      </div>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { LinkOutlined } from "@ant-design/icons-vue";
import type { StepNode } from "../types";

export interface VarItem {
  ref: string;        // 完整引用字符串，如 "{{step.s1.content}}"
  title: string;      // 来源步骤名称
  outputKey: string;  // 输出变量名
  key: string;        // 唯一键
}

const props = defineProps<{ steps: StepNode[]; currentIndex: number }>();
const emit = defineEmits<{ pick: [ref: string] }>();

const vars = computed(() => {
  const result: VarItem[] = [];
  for (let i = 0; i < props.currentIndex; i++) {
    const s = props.steps[i];
    if (!s.enabled) continue;
    const config = s.config as any;
    const outputKey = config?.outputKey;
    if (!outputKey) continue;
    const ref = `{{step.${s.id}.${outputKey}}}`;
    result.push({
      ref,
      title: s.title || s.id,
      outputKey,
      key: s.id,
    });
  }
  return result;
});

function onPick(e: { key: string }): void {
  const v = vars.value.find((v) => v.key === e.key);
  if (v) emit("pick", v.ref);
}
</script>

<script lang="ts">
import { computed } from "vue";
export default { name: "VarPicker" };
</script>

<style scoped>
.var-picker-dropdown {
  max-width: 360px;
  padding: 4px 0;
}
.var-picker__title {
  padding: 6px 12px;
  font-size: 12px;
  color: #999;
  border-bottom: 1px solid #f0f0f0;
}
.var-item {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}
.var-item__ref {
  font-family: "SF Mono", Menlo, monospace;
  font-size: 13px;
  color: #722ed1;
  font-weight: 500;
}
.var-item__desc {
  font-size: 11px;
  color: #999;
}
.var-picker__hint {
  padding: 6px 12px;
  font-size: 11px;
  color: #bbb;
  border-top: 1px solid #f0f0f0;
}
.var-picker__hint em {
  font-style: normal;
  color: #999;
}
</style>
