<template>
  <!--
    角色管理页面
    功能：角色列表、新增/编辑角色、权限分配、删除
    TODO: 后端就绪后替换为真实 API
  -->
  <div class="page-container">
    <a-card :bordered="false">
      <template #title><span>角色列表</span></template>
      <template #extra>
        <a-space>
          <a-button @click="handleExport"><DownloadOutlined /> 导出</a-button>
          <a-button type="primary" @click="openAddModal">
            <PlusOutlined /> 新增角色
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="mockData"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? "启用" : "禁用" }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEditModal(record)">
                <EditOutlined /> 编辑
              </a-button>
              <a-button type="link" size="small" @click="openPermissionModal(record)">
                <SafetyOutlined /> 权限
              </a-button>
              <a-button
                type="link"
                size="small"
                danger
                :disabled="record.code === 'admin'"
                @click="handleDelete(record)"
              >
                <DeleteOutlined /> 删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- ====== 新增/编辑弹窗 ====== -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="角色名称" name="name">
          <a-input v-model:value="formData.name" placeholder="如：编辑员" />
        </a-form-item>
        <a-form-item label="角色编码" name="code">
          <a-input
            v-model:value="formData.code"
            placeholder="如：editor"
            :disabled="isEdit"
          />
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            编码用于权限判断，创建后不可修改
          </div>
        </a-form-item>
        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="formData.sort" :min="0" :max="999" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- ====== 权限分配弹窗 ====== -->
    <a-modal
      v-model:open="permModalVisible"
      title="权限分配"
      width="560px"
      @ok="handlePermSubmit"
    >
      <a-tree
        v-model:checkedKeys="checkedKeys"
        v-model:expandedKeys="expandedKeys"
        :tree-data="permTree"
        checkable
        check-strictly
        default-expand-all
        :field-names="{ key: 'id', title: 'name', children: 'children' }"
      >
        <template #title="{ name, permission }">
          <span style="margin-left: 4px">{{ name }}</span>
          <a-tag v-if="permission" color="processing" style="margin-left: 8px; font-size: 11px">
            {{ permission }}
          </a-tag>
        </template>
      </a-tree>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 角色管理页面 - 完整 CRUD + 权限树分配
 *
 * 权限树结构：每个菜单/按钮对应一个权限节点
 * 角色通过勾选权限节点来获得对应的访问权限
 */
import { ref, reactive, computed } from "vue";
import { message } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  DownloadOutlined,
} from "@ant-design/icons-vue";
import { useExport, type ExportColumn, useConfirm } from "@sp/core";

// ---- 类型 ----
interface RoleRecord {
  id: number;
  name: string;
  code: string;
  sort: number;
  status: number;
  createTime: string;
  permissionIds: number[];
}

interface PermNode {
  id: number;
  name: string;
  permission: string;
  children?: PermNode[];
}

// ---- 表格列 ----
const columns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "角色名称", dataIndex: "name", key: "name" },
  { title: "角色编码", dataIndex: "code", key: "code" },
  { title: "排序", dataIndex: "sort", key: "sort", width: 60 },
  { title: "状态", key: "status", width: 80 },
  { title: "创建时间", dataIndex: "createTime", key: "createTime" },
  { title: "操作", key: "action", width: 240 },
];

// ---- Mock 数据 ----
const mockData = ref<RoleRecord[]>([
  { id: 1, name: "超级管理员", code: "admin", sort: 1, status: 1, createTime: "2024-01-01 10:00:00", permissionIds: [] },
  { id: 2, name: "普通用户", code: "user", sort: 2, status: 1, createTime: "2024-01-02 10:00:00", permissionIds: [11, 12] },
]);

// ---- 导出 ----
const { exportCSV } = useExport({ filename: "角色列表" });
const { confirm } = useConfirm();

const exportColumns: ExportColumn[] = [
  { title: "ID", dataIndex: "id" },
  { title: "角色名称", dataIndex: "name" },
  { title: "角色编码", dataIndex: "code" },
  { title: "排序", dataIndex: "sort" },
  { title: "状态", dataIndex: "status", format: (v) => (v === 1 ? "启用" : "禁用") },
  { title: "创建时间", dataIndex: "createTime" },
];

function handleExport(): void {
  exportCSV(exportColumns, mockData.value as unknown as Record<string, unknown>[]);
}

// ---- 新增/编辑 ----
const modalVisible = ref(false);
const isEdit = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const formData = reactive({
  name: "",
  code: "",
  sort: 1,
  status: 1,
});

const formRules: Record<string, Rule[]> = {
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  code: [
    { required: true, message: "请输入角色编码", trigger: "blur" },
    { pattern: /^[a-z_]+$/, message: "只能使用小写字母和下划线", trigger: "blur" },
  ],
};

const modalTitle = computed(() => (isEdit.value ? "编辑角色" : "新增角色"));

function openAddModal(): void {
  isEdit.value = false;
  editingId.value = null;
  formData.name = "";
  formData.code = "";
  formData.sort = 1;
  formData.status = 1;
  modalVisible.value = true;
}

function openEditModal(record: RoleRecord): void {
  isEdit.value = true;
  editingId.value = record.id;
  formData.name = record.name;
  formData.code = record.code;
  formData.sort = record.sort;
  formData.status = record.status;
  modalVisible.value = true;
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
    if (isEdit.value) {
      const idx = mockData.value.findIndex((r) => r.id === editingId.value);
      if (idx > -1) Object.assign(mockData.value[idx], { name: formData.name, sort: formData.sort, status: formData.status });
      message.success("角色更新成功");
    } else {
      mockData.value.push({
        id: Date.now(),
        name: formData.name,
        code: formData.code,
        sort: formData.sort,
        status: formData.status,
        createTime: new Date().toLocaleString("zh-CN"),
        permissionIds: [],
      });
      message.success("角色创建成功");
    }
    modalVisible.value = false;
  } catch { /* 表单校验不通过 */ }
}

// ---- 删除 ----
async function handleDelete(record: RoleRecord): Promise<void> {
  const ok = await confirm({
    title: `确认删除角色「${record.name}」？`,
    okText: "确认删除",
    danger: true,
  });
  if (ok) {
    mockData.value = mockData.value.filter((r) => r.id !== record.id);
    message.success(`已删除角色: ${record.name}`);
  }
}

// ---- 权限分配 ----
const permModalVisible = ref(false);
const currentRole = ref<RoleRecord | null>(null);
const checkedKeys = ref<number[]>([]);
const expandedKeys = ref<number[]>([1, 7]);

// 权限树：模拟系统所有可分配的权限节点
const permTree: PermNode[] = [
  {
    id: 1, name: "系统管理", permission: "",
    children: [
      { id: 11, name: "用户管理-查看", permission: "system:user:list" },
      { id: 12, name: "用户管理-新增", permission: "system:user:add" },
      { id: 13, name: "用户管理-编辑", permission: "system:user:edit" },
      { id: 14, name: "用户管理-删除", permission: "system:user:delete" },
      { id: 21, name: "角色管理-查看", permission: "system:role:list" },
      { id: 22, name: "角色管理-编辑", permission: "system:role:edit" },
      { id: 31, name: "菜单管理-查看", permission: "system:menu:list" },
      { id: 32, name: "菜单管理-编辑", permission: "system:menu:edit" },
    ],
  },
  {
    id: 7, name: "代码生成器", permission: "",
    children: [
      { id: 71, name: "代码生成-查看", permission: "gen:list" },
      { id: 72, name: "代码生成-执行", permission: "gen:execute" },
    ],
  },
];

function openPermissionModal(record: RoleRecord): void {
  currentRole.value = record;
  checkedKeys.value = [...record.permissionIds];
  permModalVisible.value = true;
}

function handlePermSubmit(): void {
  if (currentRole.value) {
    currentRole.value.permissionIds = [...checkedKeys.value];
    message.success(`已更新 ${currentRole.value.name} 的权限`);
  }
  permModalVisible.value = false;
}
</script>
