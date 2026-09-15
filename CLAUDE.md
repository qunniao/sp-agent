# CLAUDE.md - AI代理项目规约
> 本文件定义Agent权限、读取范围、编码规范、输出规则，本次会话全程生效。
项目：SuperOne超级一人公司平台，包含SpringAI智能客服RAG系统，Java后端 + Vue3前端

## 📁 文件访问范围
✅ 允许读写目录
- src/main/java/**
- src/main/resources/**
- pom.xml、README.md、docker-compose.yml
- docs/项目文档、vault/下Obsidian知识库MOC笔记
- sp-front-admin/packages/**、sp-front-admin/app/**

❌ 禁止读取/扫描（永远忽略）
- target/、.git/、.vscode-server/
- node_modules/、dist/、.pnpm/
- *.log、*.jar、*.war、二进制文件、图片
- 包含密钥、真实API凭证、隐私信息的配置文件

规则：不要无差别递归遍历全部文件夹，只访问我指定路径；减少重复ls、cat操作，节约Token。

## ⚙️ Shell命令 & 文件操作权限
1. 执行任何shell命令（mvn、git、docker、删除文件）**必须先向我确认，收到许可再执行**
2. 禁止直接执行高危指令：rm -rf、数据库drop/truncate、覆盖核心配置
3. 不擅自后台启动长时间任务，执行耗时操作前先告知风险
4. 尽量复用当前上下文已读取内容，避免反复读取同一文件

## 💻 编码&架构规范
1. Java遵循SpringBoot、SpringCloudAlibaba编码规范，单一职责原则，代码简洁
2. RAG架构约定：离线向量化管线 和 在线检索服务分离；业务数据存MySQL，向量数据存PostgreSQL(pgvector)
3. 修改代码前评估影响模块，多文件改动先输出变更摘要和风险评估，等待审核
4. 保持接口兼容，除非明确要求，不擅自改动原有对外接口
5. 注释只写业务逻辑说明，不要冗余注释
6. sp-base 和 sp-agent 为两套独立后端，禁止跨模块混入不属于本服务的业务逻辑。sp-base负责基础权限/日志；sp-agent负责AI、知识库、RAG。

## 📝 输出规范（控制成本核心）
1. 输出精简，去掉开场白、客套话、多余空行
2. 代码修改优先输出diff，**除非我明确要求，不要输出完整大文件**
3. 架构分析推荐使用Mermaid图 / 大纲列表，避免大段文字
4. 生成Obsidian MOC笔记使用 `[[概念名称]]` 双向链接语法，存放至vault目录

## 🧠 任务与模型选择
- 简单任务：查看文件、格式化代码、小bug修复、git操作、sp-base基础开发 → deepseek-v4-flash
- 复杂任务：架构重构、RAG链路优化、跨模块分析、MOC知识地图生成 → deepseek-v4-pro

## 🚩 会话边界规则
1. 当上下文过长，主动提醒我拆分任务或重启会话，降低Token消耗
2. 不要擅自扩大需求范围，不能新增我没有要求的功能
3. 遇到不确定风险立刻停止，向我提问确认
4. Token管控规则：当前会话输入+输出总token预估超过30k时，立刻停止继续执行任务，主动提醒我。由我决定：继续、拆分任务或者重启新会话。不允许继续读取更多文件、不继续执行工具调用。
5. 模型路由规则：
单纯服务器软件安装、docker启停、git提交、日志查看、简单文件操作、简单编译调试任务，使用deepseek-flash；
跨模块大规模代码重构、RAG核心逻辑修改、复杂业务架构设计、深度疑难bug排查，切换deepseek-v4-pro。

---
> 【项目架构参考区】仅需要理解项目全貌时查阅，不要每次对话反复通读本节，节约token。
# SuperOne - 超级一人公司
## 项目定位
个人经营者的数字化平台，先搭通用底座，后加业务模块（财务、客户、项目等）。

## 技术选型
| 层 | 选型 | 说明 |
|---|------|------|
| 前端框架 | Vue 3 + Composition API + TypeScript | 组件化模块化，pnpm workspace monorepo |
| 构建 | Vite 5 | 开发秒级热更新 |
| UI 库 | Ant Design Vue 4 | 后台管理组件最全 |
| 状态管理 | Pinia 2 | 按模块拆分 store |
| 路由 | Vue Router 4 | 每个模块自带路由，统一注册 |
| 后端 | Java 21 + Spring Boot 3.3 + Maven 多模块 | sp-base/ |
| 后端（AI） | Java 21 + Spring Boot + Spring AI + PGVector | sp-agent/ |
| 部署 | 阿里云 Linux + Docker | 单机部署 |

## 前端架构
sp-front-admin/
├── packages/
│   ├── core/        # 公共核心：axios、工具函数、ProLayout、SubMenuRenderer
│   ├── auth/        # 登录认证模块
│   ├── system/      # 系统管理：用户 / 角色 / 菜单
│   ├── gen/         # 代码生成器
│   ├── dict/        # 数据字典
│   ├── file/        # 文件管理（预留 OSS）
│   └── log/         # 日志管理：操作日志 / 登录日志
├── app/             # 主应用壳：路由装配、布局、入口
├── pnpm-workspace.yaml
└── vite.config.ts

**模块隔离原则**：每个包只导出路由配置，模块间不互相引用，通讯走 `@sp/core`。
**路由机制**：先收集所有模块路由到 `menuRegistry` → 再创建 Router（children 指向完整数组）。

## 通用模块清单
### P0（已完成前端页面）
- [x] **认证授权** — 登录页、JWT token、RBAC 权限、刷新自动登录（localStorage 缓存）
- [x] **系统管理** — 用户管理 CRUD、角色管理+权限树、菜单管理（树形表格）
- [x] **代码生成器** — 表选择+生成配置表单（待对接后端）

### P1（前端页面已完成，待后端）
- [x] **数据字典** — 字典类型管理、字典数据管理（页面框架完成）
- [ ] **系统配置** — 参数配置、值类型校验、缓存刷新（待开发）
- [x] **文件管理** — 文件列表、上传/下载/预览、对接阿里云 OSS（页面框架完成）
- [x] **操作日志** — 操作日志、登录日志（页面框架完成）

### P2（待开发）
- [ ] **通知中心** — 站内消息、预留邮件/短信通道
- [ ] **定时任务** — 任务管理、Cron 配置、执行日志

## 菜单结构（sort 排序）

🏠 首页              /dashboard          sort: 1
⚡ 代码生成器         /gen                sort: 10
└─ 💻 代码生成     /gen/tables
📚 数据字典           /dict               sort: 20
├─ 📝 字典类型     /dict/type
└─ 📄 字典数据     /dict/data
📁 文件管理           /file               sort: 30
└─ 📂 文件列表     /file/list
📋 日志管理           /log                sort: 40
├─ 📃 操作日志     /log/operation
└─ 🔐 登录日志     /log/login
⚙️ 系统管理           /system             sort: 99
├─ 👥 用户管理     /system/users
├─ 🛡️ 角色管理     /system/roles
└─ 📋 菜单管理     /system/menus



## 当前状态
- 前端架构：完成，可运行 `cd sp-front-admin && pnpm dev` → http://localhost:3000
- 登录方式：admin / admin123（开发模拟模式，token+用户信息存 localStorage）

## 后端架构（双后端独立部署）
SuperOne 拆成两个独立后端，各管一摊，互不依赖：
| 后端 | 端口 | 技术栈 | 数据库 | 职责 |
|------|------|--------|--------|------|
| **sp-base/** | 8080 | Java 21 + Spring Boot 3.3 + MySQL + MyBatis-Plus | MySQL 8 | 传统业务：用户/角色/菜单权限、日志、自动化等 |
| **sp-agent/** | 8081 | Java 21 + Spring Boot 3.3 + Spring AI + PGVector + MyBatis-Plus | PostgreSQL (含 pgvector) | AI 客服 + 知识库：RAG 问答、意图识别、订单查询、风险预警 |

前端 sp-front-admin 后续通过网关/反向代理分别对接两个后端。

### sp-base/ — 传统业务后端


sp-base/
├── sp-base-common/        # ApiResponse、PageResult、PageParams
├── sp-base-framework/     # MyBatisPlusConfig、GlobalExceptionHandler、CorsConfig、OperatorProvider
├── sp-base-modules/       # sp-base-log (日志)、sp-base-automation (自动化) 等业务模块
└── sp-base-server/        # SpBaseApplication 启动入口



### sp-agent/ — AI 客服后端

sp-agent/
├── src/main/java/com/spagent/
│   ├── SpAgentApplication.java
│   ├── common/       # 统一响应、异常处理
│   ├── kb/           # 知识库：文档 CRUD + 向量化入库
│   ├── chat/         # 智能问答：RAG 检索 + 多轮对话
│   ├── intent/       # 意图分类
│   ├── customer/     # 客户识别
│   ├── order/        # 订单查询
│   └── risk/         # 风险预警 + 转人工
└── src/main/resources/application.yml


核心闭环范围：02 智能问答+知识库、05 意图分类/客户识别、03 订单查询、08 风险预警转人工。
