<template>
  <!--
    代码生成器页面（占位）
    一人公司的效率核心，后续实现：
    - 左侧：数据源 & 数据库表列表
    - 右侧：生成配置（作者、包名、模块名、模板选择）
    - 预览生成结果
    - 一键生成或复制代码
  -->
  <div class="page-container">
    <a-card :bordered="false" title="代码生成器">
      <template #extra>
        <a-space>
          <a-button>
            <ReloadOutlined /> 刷新表列表
          </a-button>
          <a-button type="primary">
            <ThunderboltOutlined /> 生成代码
          </a-button>
        </a-space>
      </template>

      <!-- 提示信息 -->
      <a-alert
        message="代码生成器说明"
        description="选择数据库表 → 配置生成选项 → 一键生成前后端 CRUD 代码。支持生成：Model、Mapper、Service、Controller 以及 Vue 页面。"
        type="info"
        show-icon
        closable
        style="margin-bottom: 16px"
      />

      <!-- 表列表 -->
      <a-row :gutter="16">
        <a-col :span="8">
          <a-card title="数据库表" size="small">
            <a-empty description="暂未连接数据库" />
            <p style="color: #999; font-size: 13px; text-align: center; margin-top: 8px">
              后续开启时自动展示数据库中的所有表
            </p>
          </a-card>
        </a-col>
        <a-col :span="16">
          <a-card title="生成配置" size="small">
            <a-form :model="genConfig" layout="vertical">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="作者">
                    <a-input v-model:value="genConfig.author" placeholder="如：juno" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="模块名">
                    <a-input v-model:value="genConfig.moduleName" placeholder="如：user" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="包名">
                    <a-input v-model:value="genConfig.basePackage" placeholder="com.sp.base" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="表前缀（自动去除）">
                    <a-input v-model:value="genConfig.tablePrefix" placeholder="如：sys_" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="前端路径">
                    <a-input v-model:value="genConfig.frontendPath" placeholder="packages/" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="启用功能">
                    <a-checkbox-group v-model:value="genConfig.features">
                      <a-row>
                        <a-col :span="8"><a-checkbox value="add">新增</a-checkbox></a-col>
                        <a-col :span="8"><a-checkbox value="delete">删除</a-checkbox></a-col>
                        <a-col :span="8"><a-checkbox value="edit">编辑</a-checkbox></a-col>
                        <a-col :span="8"><a-checkbox value="query">查询</a-checkbox></a-col>
                        <a-col :span="8"><a-checkbox value="export">导出</a-checkbox></a-col>
                        <a-col :span="8"><a-checkbox value="import">导入</a-checkbox></a-col>
                      </a-row>
                    </a-checkbox-group>
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 代码生成器页面
 *
 * TODO: 后端就绪后对接真实数据源
 */
import { reactive } from "vue";
import { ThunderboltOutlined, ReloadOutlined } from "@ant-design/icons-vue";

const genConfig = reactive({
  author: "juno",
  moduleName: "",
  basePackage: "com.sp.base",
  tablePrefix: "",
  frontendPath: "packages/",
  features: ["add", "delete", "edit", "query", "export"],
});
</script>
