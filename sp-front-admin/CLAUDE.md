# SP-Front-Admin

## 技术栈

| 层 | 选型 | 说明 |
|---|------|------|
| 框架 | Vue 3 + Composition API + TypeScript | `<script setup lang="ts">` |
| 构建 | Vite 5 | 开发秒级热更新 |
| UI 库 | Ant Design Vue 4 | 表格/表单/弹窗组件 |
| 状态管理 | Pinia 2 | 按模块拆分 store |
| 路由 | Vue Router 4 | 模块自带路由，统一注册 |
| 包管理 | pnpm workspace monorepo | 模块隔离，`workspace:*` 引用 |
| HTTP | Axios | `/api` 前缀，Vite 代理到后端 |

## 项目结构

```
sp-front-admin/
├── packages/
│   ├── core/            # @sp/core：公共核心
│   │   └── src/
│   │       ├── api/         # axios 实例 + ApiResponse/PageResult 类型
│   │       ├── stores/      # useAuthStore、useAppStore
│   │       ├── utils/       # token、menuRegistry、路由工具
│   │       └── components/  # ProLayout、SubMenuRenderer、IconFont
│   ├── auth/            # @sp/auth：登录认证
│   ├── system/          # @sp/system：用户/角色/菜单管理
│   ├── gen/             # @sp/gen：代码生成器
│   ├── dict/            # @sp/dict：数据字典
│   ├── file/            # @sp/file：文件管理
│   └── log/             # @sp/log：日志管理
│       └── src/
│           ├── types/       # TypeScript 类型定义
│           ├── api/         # API 服务函数
│           ├── views/       # 页面组件（OperationLog / LoginLog）
│           ├── router.ts    # 模块路由配置
│           └── index.ts     # 统一导出
├── app/                 # 主应用壳：入口、路由装配、布局
├── pnpm-workspace.yaml
└── vite.config.ts
```

## 模块隔离原则

- 每个包只通过 `index.ts` 导出路由配置（和可选的 types/api）
- 模块间**不互相引用**，通讯走 `@sp/core`
- 路由是唯一的跨模块契约

## 路由机制

1. 各模块定义 `RouteRecordRaw[]`，通过 `index.ts` 导出
2. 主应用 `app/src/main.ts` 中调用 `registerModuleRoutes(logRoutes, "layout")`
3. 所有模块路由收集到 `menuRegistry`
4. 再创建 Router，children 指向完整路由数组
5. ProLayout 读取路由 meta 渲染侧边栏菜单

### 路由 meta

```typescript
meta: {
  title: "操作日志",           // 菜单名称
  icon: "FileSearchOutlined",  // 图标（需在 ProLayout iconMap 中注册）
  sort: 40,                    // 排序，越小越靠前
  keepAlive: true,             // 页面缓存
}
```

## API 层模式

### http 实例 (`@sp/core`)

- baseURL: `/api`（Vite 代理到后端 8080）
- 请求拦截器：自动注入 `Authorization: Bearer <token>`
- 响应拦截器：自动处理 401 跳转登录、业务错误提示

### API 服务函数

每个模块在 `src/api/` 下组织，函数直接返回业务数据（ApiResponse 已在拦截器层处理）：

```typescript
import { http, type PageResult } from "@sp/core";
import type { OperationLogRecord, LogQueryParams } from "../types";

export async function getOperationLogs(params: LogQueryParams): Promise<PageResult<OperationLogRecord>> {
  const res = await http.get("/log/operation", { params });
  return res.data.data;
}
```

### 组件中的使用

```typescript
import { ref, reactive, onMounted } from "vue";
import { getOperationLogs } from "../api/operationLog";

const data = ref<OperationLogRecord[]>([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, ... });

async function fetchData() {
  loading.value = true;
  try {
    const result = await getOperationLogs({ page: pagination.current, pageSize: pagination.pageSize });
    data.value = result.records;
    pagination.total = result.total;
  } finally {
    loading.value = false;
  }
}

onMounted(() => fetchData());
```

## 开发

```bash
cd sp-front-admin
pnpm install
pnpm dev          # http://localhost:3000
```

开发登录：admin / admin123（devLogin 模拟模式，token + 用户信息存 localStorage）

## 当前状态

- [x] 前端架构（pnpm monorepo + 路由注册 + ProLayout）
- [x] 认证授权（登录页、JWT token、RBAC、刷新自动登录）
- [x] 系统管理（用户管理 CRUD、角色管理+权限树、菜单管理）
- [x] 代码生成器（表选择+配置表单）
- [x] 数据字典（字典类型/字典数据页面）
- [x] 文件管理（文件列表页面）
- [x] 日志管理（操作日志 + 登录日志，已对接 API 层）
- [ ] 系统配置
- [ ] 通知中心
- [ ] 定时任务
