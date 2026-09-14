<template>
  <div class="page-container">
    <!-- ====== 搜索区域 ====== -->
    <a-card :bordered="false" class="search-form">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="用户名">
          <a-input v-model:value="searchForm.username" placeholder="请输入" allow-clear
            @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="searchForm.phone" placeholder="请输入" allow-clear
            @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="全部" style="width:100px" allow-clear>
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch"><SearchOutlined /> 搜索</a-button>
            <a-button @click="handleReset"><ReloadOutlined /> 重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- ====== 表格区域 ====== -->
    <a-card :bordered="false">
      <template #title>
        <span>用户列表</span>
        <a-badge :count="pagination.total" :number-style="{ background: '#1677ff' }"
          style="margin-left:8px" />
      </template>
      <template #extra>
        <a-space>
          <a-button v-if="selectedRowKeys.length > 0" danger @click="handleBatchDelete">
            批量删除 ({{ selectedRowKeys.length }})
          </a-button>
          <a-button @click="handleExport"><DownloadOutlined /> 导出</a-button>
          <a-button @click="handleRefresh"><ReloadOutlined /> 刷新</a-button>
          <a-button type="primary" @click="openAddModal"><PlusOutlined /> 新增用户</a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="pagination"
        :row-selection="rowSelection"
        row-key="id"
        :loading="loading"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + record._index + 1 }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'roles'">
            <a-tag v-for="rid in record.roleIds" :key="rid" color="blue" style="margin-right:2px">
              {{ getRoleName(rid) }}
            </a-tag>
            <span v-if="!record.roleIds.length" style="color:#999">未分配</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="openEditModal(record)"><EditOutlined /> 编辑</a>
              <a @click="openRoleModal(record)"><SafetyOutlined /> 角色</a>
              <a-dropdown>
                <a class="ant-dropdown-link"><EllipsisOutlined /></a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="handleResetPassword(record)"><KeyOutlined /> 重置密码</a-menu-item>
                    <a-menu-divider />
                    <a-menu-item danger @click="handleDelete(record)"><DeleteOutlined /> 删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- ====== 新增/编辑弹窗 ====== -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="submitLoading"
      width="520px"
      @ok="handleSubmit"
      @cancel="handleModalCancel"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules"
        :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formData.username" placeholder="请输入用户名"
            :disabled="isEdit" :maxlength="20" />
        </a-form-item>
        <a-form-item v-if="!isEdit" label="密码" name="password">
          <a-input-password v-model:value="formData.password" placeholder="至少6位" />
        </a-form-item>
        <a-form-item label="昵称" name="nickname">
          <a-input v-model:value="formData.nickname" placeholder="请输入昵称" :maxlength="30" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="formData.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="formData.phone" placeholder="请输入手机号" :maxlength="11" />
        </a-form-item>
        <a-form-item label="角色" name="roleIds">
          <a-select v-model:value="formData.roleIds" mode="multiple" placeholder="请选择角色">
            <a-select-option v-for="r in availableRoles" :key="r.id" :value="r.id">
              {{ r.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- ====== 角色分配弹窗 ====== -->
    <a-modal v-model:open="roleModalVisible" title="分配角色" @ok="handleRoleSubmit">
      <a-checkbox-group v-model:value="selectedRoles"
        style="display:flex;flex-direction:column;gap:12px">
        <a-checkbox v-for="role in availableRoles" :key="role.id" :value="role.id">
          <span style="font-weight:500">{{ role.name }}</span>
          <span style="color:#999;font-size:12px;margin-left:4px">{{ role.code }}</span>
        </a-checkbox>
      </a-checkbox-group>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { message } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { TablePaginationConfig } from "ant-design-vue";
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, SafetyOutlined,
  EllipsisOutlined, KeyOutlined, DownloadOutlined,
} from "@ant-design/icons-vue";
import { useExport, type ExportColumn, useConfirm } from "@sp/core";

// ==================== 类型 ====================
interface UserRecord {
  id: number;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  status: number;
  roleIds: number[];
  createTime: string;
}
interface RoleOption { id: number; name: string; code: string }

// ==================== 表格列 ====================
const columns = [
  { title: "#", key: "index", width: 50 },
  { title: "用户名", dataIndex: "username", key: "username" },
  { title: "昵称", dataIndex: "nickname", key: "nickname" },
  { title: "邮箱", dataIndex: "email", key: "email", ellipsis: true },
  { title: "手机号", dataIndex: "phone", key: "phone", width: 130 },
  { title: "角色", key: "roles", width: 140 },
  { title: "状态", key: "status", width: 80 },
  { title: "创建时间", dataIndex: "createTime", key: "createTime", width: 170 },
  { title: "操作", key: "action", width: 150, fixed: "right" as const },
];

// ==================== 搜索 ====================
const searchForm = reactive({ username: "", phone: "", status: undefined as number | undefined });

function handleSearch(): void { pagination.current = 1 }
function handleReset(): void {
  searchForm.username = "";
  searchForm.phone = "";
  searchForm.status = undefined;
  pagination.current = 1;
}

// ==================== Mock 数据 ====================
const mockData = ref<UserRecord[]>([
  { id: 1, username: "admin", nickname: "超级管理员", email: "admin@superone.com", phone: "13800000000", status: 1, roleIds: [1], createTime: "2024-01-01 10:00:00" },
  { id: 2, username: "demo", nickname: "演示用户", email: "demo@superone.com", phone: "13800000001", status: 1, roleIds: [2], createTime: "2024-03-15 14:30:00" },
  { id: 3, username: "zhangsan", nickname: "张三", email: "zhangsan@qq.com", phone: "13900001111", status: 0, roleIds: [2], createTime: "2024-06-20 09:00:00" },
  { id: 4, username: "lisi", nickname: "李四", email: "lisi@163.com", phone: "13900002222", status: 1, roleIds: [3], createTime: "2024-08-01 11:00:00" },
  { id: 5, username: "wangwu", nickname: "王五", email: "wangwu@gmail.com", phone: "13900003333", status: 1, roleIds: [2, 3], createTime: "2024-10-10 16:00:00" },
  { id: 6, username: "zhaoliu", nickname: "赵六", email: "zhaoliu@superone.com", phone: "13900004444", status: 0, roleIds: [], createTime: "2024-12-01 08:30:00" },
  { id: 7, username: "sunqi", nickname: "孙七", email: "sunqi@superone.com", phone: "13900005555", status: 1, roleIds: [3], createTime: "2025-01-15 13:00:00" },
  { id: 8, username: "zhouba", nickname: "周八", email: "zhouba@qq.com", phone: "13900006666", status: 1, roleIds: [2], createTime: "2025-02-20 10:30:00" },
  { id: 9, username: "wujiu", nickname: "吴九", email: "wujiu@163.com", phone: "13900007777", status: 0, roleIds: [], createTime: "2025-03-10 15:00:00" },
  { id: 10, username: "zhengshi", nickname: "郑十", email: "zhengshi@superone.com", phone: "13900008888", status: 1, roleIds: [2, 3], createTime: "2025-04-05 09:20:00" },
  { id: 11, username: "liuyi", nickname: "刘一", email: "liuyi@qq.com", phone: "13900009999", status: 1, roleIds: [3], createTime: "2025-05-18 14:00:00" },
  { id: 12, username: "chener", nickname: "陈二", email: "chener@superone.com", phone: "13900001112", status: 0, roleIds: [], createTime: "2025-06-01 11:11:00" },
]);

// ==================== 筛选 + 分页 ====================
const filteredData = computed(() => {
  let list = mockData.value;
  if (searchForm.username) list = list.filter(u => u.username.includes(searchForm.username));
  if (searchForm.phone) list = list.filter(u => u.phone.includes(searchForm.phone));
  if (searchForm.status !== undefined) list = list.filter(u => u.status === searchForm.status);
  return list;
});

const pagination = reactive<TablePaginationConfig>({
  current: 1, pageSize: 10, total: 0,
  showSizeChanger: true, showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
  pageSizeOptions: ["10", "20", "50"],
});

// 当前页数据（前端切片）
const pagedData = computed(() => {
  const start = (pagination.current! - 1) * pagination.pageSize!;
  const end = start + pagination.pageSize!;
  pagination.total = filteredData.value.length;
  return filteredData.value.slice(start, end).map((item, i) => ({ ...item, _index: i }));
});

const loading = ref(false);

// ---- 导出（导出所有筛选数据，非仅当前页） ----
const { exportCSV } = useExport({ filename: "用户列表" });
const { confirm } = useConfirm();

const exportColumns: ExportColumn[] = [
  { title: "用户名", dataIndex: "username" },
  { title: "昵称", dataIndex: "nickname" },
  { title: "邮箱", dataIndex: "email" },
  { title: "手机号", dataIndex: "phone" },
  { title: "状态", dataIndex: "status", format: (v) => (v === 1 ? "启用" : "禁用") },
  { title: "创建时间", dataIndex: "createTime" },
];

function handleExport(): void {
  exportCSV(exportColumns, filteredData.value as unknown as Record<string, unknown>[]);
}

function handleTableChange(pag: TablePaginationConfig): void {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
}

function handleRefresh(): void {
  loading.value = true;
  setTimeout(() => { loading.value = false; message.success("刷新成功"); }, 400);
}

// ==================== 多选 ====================
const selectedRowKeys = ref<number[]>([]);
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: number[]) => { selectedRowKeys.value = keys; },
}));

async function handleBatchDelete(): Promise<void> {
  const ok = await confirm({
    title: `确认删除 ${selectedRowKeys.value.length} 个用户？`,
    content: "删除后不可恢复",
    okText: "确认删除",
    danger: true,
  });
  if (ok) {
    mockData.value = mockData.value.filter(u => !selectedRowKeys.value.includes(u.id));
    selectedRowKeys.value = [];
    message.success("已批量删除");
  }
}

// ==================== 新增/编辑弹窗 ====================
const modalVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const modalTitle = computed(() => isEdit.value ? "编辑用户" : "新增用户");

const formData = reactive({
  username: "", password: "", nickname: "", email: "", phone: "", status: 1, roleIds: [] as number[],
});

const formRules: Record<string, Rule[]> = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 2, max: 20, message: "2-20个字符", trigger: "blur" },
    { pattern: /^[a-zA-Z0-9_]+$/, message: "只能包含字母数字下划线", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "至少6位", trigger: "blur" },
  ],
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  email: [{ type: "email", message: "邮箱格式不正确", trigger: "blur" }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: "手机号格式不正确", trigger: "blur" }],
};

function openAddModal(): void {
  isEdit.value = false; editingId.value = null;
  formRef.value?.resetFields();
  formData.roleIds = [];
  modalVisible.value = true;
}
function openEditModal(record: UserRecord): void {
  isEdit.value = true; editingId.value = record.id;
  formRef.value?.resetFields();
  formData.username = record.username;
  formData.password = "";
  formData.nickname = record.nickname;
  formData.email = record.email;
  formData.phone = record.phone;
  formData.status = record.status;
  formData.roleIds = [...record.roleIds];
  (formRules.password[0] as Rule).required = false;
  modalVisible.value = true;
}
function handleModalCancel(): void {
  modalVisible.value = false;
  (formRules.password[0] as Rule).required = true;
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
    submitLoading.value = true;
    // 模拟延迟（后端就绪后替换为 API 调用）
    await new Promise(r => setTimeout(r, 300));

    if (isEdit.value) {
      const u = mockData.value.find(u => u.id === editingId.value);
      if (u) Object.assign(u, {
        nickname: formData.nickname, email: formData.email,
        phone: formData.phone, status: formData.status, roleIds: [...formData.roleIds],
      });
      message.success("更新成功");
    } else {
      mockData.value.unshift({
        id: Date.now(), username: formData.username, nickname: formData.nickname,
        email: formData.email, phone: formData.phone, status: formData.status,
        roleIds: [...formData.roleIds], createTime: new Date().toLocaleString("zh-CN"),
      });
      message.success("创建成功");
    }
    modalVisible.value = false;
    (formRules.password[0] as Rule).required = true;
  } catch { /* 校验不通过 */ }
  finally { submitLoading.value = false; }
}

// ==================== 删除 ====================
async function handleDelete(record: UserRecord): Promise<void> {
  const ok = await confirm({
    title: `确认删除用户「${record.username}」？`,
    content: "删除后不可恢复",
    okText: "确认删除",
    danger: true,
  });
  if (ok) {
    mockData.value = mockData.value.filter(u => u.id !== record.id);
    message.success("已删除");
  }
}

// ==================== 重置密码 ====================
async function handleResetPassword(record: UserRecord): Promise<void> {
  const ok = await confirm({
    title: `重置「${record.username}」的密码？`,
    content: "密码将重置为 123456",
    okText: "确认重置",
  });
  if (ok) message.success("密码已重置为 123456");
}

// ==================== 角色 ====================
const roleModalVisible = ref(false);
const selectedRoles = ref<number[]>([]);
const currentUser = ref<UserRecord | null>(null);
const availableRoles: RoleOption[] = [
  { id: 1, name: "超级管理员", code: "admin" },
  { id: 2, name: "普通用户", code: "user" },
  { id: 3, name: "编辑员", code: "editor" },
];

function getRoleName(roleId: number): string {
  return availableRoles.find(r => r.id === roleId)?.name || "未知";
}
function openRoleModal(record: UserRecord): void {
  currentUser.value = record;
  selectedRoles.value = [...record.roleIds];
  roleModalVisible.value = true;
}
function handleRoleSubmit(): void {
  if (currentUser.value) {
    currentUser.value.roleIds = [...selectedRoles.value];
    message.success("角色已更新");
  }
  roleModalVisible.value = false;
}
</script>
