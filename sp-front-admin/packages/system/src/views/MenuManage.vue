<template>
  <!--
    菜单管理页面
    功能：树形菜单列表、新增/编辑菜单（目录、菜单、按钮）、拖拽排序（预留）
    TODO: 后端就绪后替换为真实 API
  -->
  <div class="page-container">
    <a-card :bordered="false">
      <template #title><span>菜单管理</span></template>
      <template #extra>
        <a-space>
          <a-button @click="handleExport"><DownloadOutlined /> 导出</a-button>
          <a-button type="primary" @click="openAddModal('D')">
            <PlusOutlined /> 新增目录
          </a-button>
          <a-button @click="handleExpandAll">
            {{ allExpanded ? "收起全部" : "展开全部" }}
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="menuData"
        row-key="id"
        :pagination="false"
        :expand-icon-as-cell="false"
        :default-expand-all-rows="allExpanded"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <span v-if="record.icon" style="font-size: 16px">
              {{ iconLabelMap[record.icon] || "" }}
            </span>
          </template>
          <template v-if="column.key === 'type'">
            <a-tag :color="typeColorMap[record.type]">
              {{ typeLabelMap[record.type] }}
            </a-tag>
          </template>
          <template v-if="column.key === 'visible'">
            <a-tag :color="record.visible === 1 ? 'green' : 'default'">
              {{ record.visible === 1 ? "显示" : "隐藏" }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <template v-if="record.type !== 'B'">
                <a-button type="link" size="small" @click="openAddChildModal(record)">
                  添加子菜单
                </a-button>
              </template>
              <a-button type="link" size="small" @click="openEditModal(record)">
                编辑
              </a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- ====== 新增/编辑弹窗 ====== -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="600px"
      @ok="handleSubmit"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 17 }"
      >
        <a-form-item label="上级菜单">
          <a-input :value="parentName" disabled />
        </a-form-item>
        <a-form-item label="菜单类型" name="type">
          <a-radio-group v-model:value="formData.type" :disabled="isEdit">
            <a-radio value="D">目录</a-radio>
            <a-radio value="M">菜单</a-radio>
            <a-radio value="B">按钮</a-radio>
          </a-radio-group>
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            目录：分组容器 | 菜单：对应页面路由 | 按钮：页面上的操作权限
          </div>
        </a-form-item>
        <a-form-item label="菜单名称" name="name">
          <a-input v-model:value="formData.name" placeholder="如：用户管理" />
        </a-form-item>
        <a-form-item v-if="formData.type !== 'B'" label="图标">
          <a-input v-model:value="formData.icon" placeholder="如：TeamOutlined">
            <template #addonAfter>
              <span style="font-size: 14px; width: 20px; display: inline-block">
                {{ iconLabelMap[formData.icon] || "" }}
              </span>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item v-if="formData.type === 'M'" label="路由路径" name="path">
          <a-input v-model:value="formData.path" placeholder="如：/system/users" />
        </a-form-item>
        <a-form-item v-if="formData.type === 'M'" label="组件路径" name="component">
          <a-input v-model:value="formData.component" placeholder="如：system/views/UserList" />
        </a-form-item>
        <a-form-item v-if="formData.type === 'B'" label="权限标识" name="permission">
          <a-input v-model:value="formData.permission" placeholder="如：system:user:add" />
        </a-form-item>
        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="formData.sort" :min="0" :max="999" style="width: 100%" />
        </a-form-item>
        <a-form-item label="可见" name="visible">
          <a-radio-group v-model:value="formData.visible">
            <a-radio :value="1">显示</a-radio>
            <a-radio :value="0">隐藏</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 菜单管理页面 - 树形 CRUD
 *
 * 三种菜单类型：
 * - D (目录): 仅作为侧边栏分组，无对应页面
 * - M (菜单): 对应一个 Vue 页面路由
 * - B (按钮): 对应页面上的操作按钮权限标识
 */
import { ref, reactive, computed } from "vue";
import { message } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import { useExport, type ExportColumn, useConfirm } from "@sp/core";

// ---- 类型 ----
interface MenuRecord {
  id: number;
  parentId: number;
  name: string;
  type: "D" | "M" | "B";
  icon: string;
  path: string;
  component: string;
  permission: string;
  sort: number;
  visible: number;
  children?: MenuRecord[];
}

// ---- 映射表 ----
const typeLabelMap: Record<string, string> = { D: "目录", M: "菜单", B: "按钮" };
const typeColorMap: Record<string, string> = { D: "blue", M: "green", B: "orange" };
const iconLabelMap: Record<string, string> = {
  HomeOutlined: "🏠", SettingOutlined: "⚙️", TeamOutlined: "👥",
  SafetyOutlined: "🛡️", MenuOutlined: "📋", ThunderboltOutlined: "⚡",
  CodeOutlined: "💻", FileOutlined: "📄", BellOutlined: "🔔",
  ClockCircleOutlined: "⏰", DatabaseOutlined: "🗄️",
};

// ---- 表格列 ----
const columns = [
  { title: "菜单名称", dataIndex: "name", key: "name" },
  { title: "图标", key: "icon", width: 60 },
  { title: "路由路径", dataIndex: "path", key: "path" },
  { title: "类型", key: "type", width: 70 },
  { title: "排序", dataIndex: "sort", key: "sort", width: 60 },
  { title: "可见", key: "visible", width: 70 },
  { title: "权限标识", dataIndex: "permission", key: "permission" },
  { title: "操作", key: "action", width: 260 },
];

// ---- 展开/收起 ----
const allExpanded = ref(true);
function handleExpandAll(): void {
  allExpanded.value = !allExpanded.value;
}

// ---- Mock 菜单数据 ----
const menuData = ref<MenuRecord[]>([
  {
    id: 1, parentId: 0, name: "首页", type: "M", icon: "HomeOutlined",
    path: "/dashboard", component: "views/Dashboard", permission: "", sort: 1, visible: 1,
  },
  {
    id: 2, parentId: 0, name: "系统管理", type: "D", icon: "SettingOutlined",
    path: "/system", component: "", permission: "", sort: 10, visible: 1,
    children: [
      { id: 21, parentId: 2, name: "用户管理", type: "M", icon: "TeamOutlined",
        path: "/system/users", component: "system/views/UserList", permission: "system:user:list", sort: 1, visible: 1 },
      { id: 22, parentId: 2, name: "角色管理", type: "M", icon: "SafetyOutlined",
        path: "/system/roles", component: "system/views/RoleList", permission: "system:role:list", sort: 2, visible: 1 },
      { id: 23, parentId: 2, name: "菜单管理", type: "M", icon: "MenuOutlined",
        path: "/system/menus", component: "system/views/MenuManage", permission: "system:menu:list", sort: 3, visible: 1 },
      { id: 24, parentId: 2, name: "新增用户", type: "B", icon: "",
        path: "", component: "", permission: "system:user:add", sort: 4, visible: 1 },
    ],
  },
  {
    id: 3, parentId: 0, name: "代码生成器", type: "D", icon: "ThunderboltOutlined",
    path: "/gen", component: "", permission: "", sort: 5, visible: 1,
    children: [
      { id: 31, parentId: 3, name: "代码生成", type: "M", icon: "CodeOutlined",
        path: "/gen/tables", component: "gen/views/GenPage", permission: "gen:list", sort: 1, visible: 1 },
    ],
  },
]);

// ---- 导出（展平树形数据） ----
const { exportCSV } = useExport({ filename: "菜单管理" });
const { confirm } = useConfirm();

function flatMenuData(list: MenuRecord[]): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  function walk(items: MenuRecord[], parentName: string) {
    for (const item of items) {
      result.push({
        id: item.id,
        name: item.name,
        type: typeLabelMap[item.type] || item.type,
        icon: item.icon,
        path: item.path,
        component: item.component,
        permission: item.permission,
        sort: item.sort,
        visible: item.visible === 1 ? "显示" : "隐藏",
        parentName,
      });
      if (item.children && item.children.length) {
        walk(item.children, item.name);
      }
    }
  }
  walk(list, "根目录");
  return result;
}

const exportColumns: ExportColumn[] = [
  { title: "ID", dataIndex: "id" },
  { title: "菜单名称", dataIndex: "name" },
  { title: "上级菜单", dataIndex: "parentName" },
  { title: "类型", dataIndex: "type" },
  { title: "路由路径", dataIndex: "path" },
  { title: "权限标识", dataIndex: "permission" },
  { title: "排序", dataIndex: "sort" },
  { title: "可见", dataIndex: "visible" },
];

function handleExport(): void {
  exportCSV(exportColumns, flatMenuData(menuData.value));
}

// ---- 新增/编辑 ----
const modalVisible = ref(false);
const isEdit = ref(false);
const editingId = ref<number | null>(null);
const parentName = ref("根目录");
const formRef = ref<FormInstance>();

const formData = reactive({
  type: "M" as "D" | "M" | "B",
  name: "",
  icon: "",
  path: "",
  component: "",
  permission: "",
  sort: 0,
  visible: 1,
});

const formRules: Record<string, Rule[]> = {
  name: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  path: [{ required: true, message: "请输入路由路径", trigger: "blur" }],
};

const modalTitle = computed(() => (isEdit.value ? "编辑菜单" : "新增菜单"));

function openAddModal(type: "D" | "M" | "B", parent?: MenuRecord): void {
  isEdit.value = false;
  editingId.value = null;
  parentName.value = parent ? parent.name : "根目录";
  formData.type = type;
  formData.name = "";
  formData.icon = "";
  formData.path = "";
  formData.component = "";
  formData.permission = "";
  formData.sort = 0;
  formData.visible = 1;
  modalVisible.value = true;
}

function openAddChildModal(parent: MenuRecord): void {
  // 在目录/菜单下添加子菜单
  const childType = parent.type === "D" ? "M" : "B";
  openAddModal(childType, parent);
}

function openEditModal(record: MenuRecord): void {
  isEdit.value = true;
  editingId.value = record.id;
  parentName.value = record.parentId === 0 ? "根目录" : "上级菜单";
  formData.type = record.type;
  formData.name = record.name;
  formData.icon = record.icon;
  formData.path = record.path;
  formData.component = record.component;
  formData.permission = record.permission;
  formData.sort = record.sort;
  formData.visible = record.visible;
  modalVisible.value = true;
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
    // TODO: 后端就绪后替换为真实 API
    message.success(isEdit.value ? "菜单更新成功" : "菜单创建成功");
    modalVisible.value = false;
  } catch { /* 表单校验不通过 */ }
}

// ---- 删除 ----
async function handleDelete(record: MenuRecord): Promise<void> {
  const ok = await confirm({
    title: `确认删除菜单「${record.name}」？`,
    content: "子菜单将一并删除",
    okText: "确认删除",
    danger: true,
  });
  if (!ok) return;
  // 递归删除菜单及其子菜单
  function removeById(list: MenuRecord[], id: number): MenuRecord[] {
    return list
      .filter((item) => item.id !== id)
      .map((item) => ({
        ...item,
        children: item.children ? removeById(item.children, id) : undefined,
      }));
  }
  menuData.value = removeById(menuData.value, record.id);
  message.success(`已删除菜单: ${record.name}`);
}
</script>
