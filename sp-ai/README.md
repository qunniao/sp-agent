# SP-AI（超级客服智能体）

AI 客服 + 知识库系统。基于大模型 RAG 的智能客服，统一承接咨询、问答、订单查询、风险预警与转人工。

## 功能

| 模块 | 说明 |
|------|------|
| 智能问答 | 基于知识库的 RAG 检索增强问答，支持多轮对话 |
| 知识库 | 文档录入、分类管理、向量化入库与检索 |
| 客户识别 | 新老客户识别、标签生成、咨询意图分类 |
| 订单查询 | 订单状态、物流进度、退换货进度查询 |
| 风险预警 | 敏感词识别、投诉预警、高风险会话转人工 |

## 技术栈

- Java 21 / Spring Boot 3.3 / Spring AI / Spring AI Alibaba（阿里百炼 DashScope）
- PostgreSQL + pgvector（业务数据与向量存储共用一库）
- MyBatis-Plus

## 架构

```
com.spai
├── common/     # 统一返回、异常、常量
├── config/     # LLM、向量库配置
├── chat/       # 智能问答（多轮对话 + RAG）
├── kb/         # 知识库（文档、分类、向量化）
├── intent/     # 意图分类
├── customer/   # 客户识别与标签
├── order/      # 订单/物流/售后查询
└── risk/       # 风险预警与转人工
```

## 快速开始

前置：JDK 21、Maven、PostgreSQL（含 `pgvector` 扩展）、阿里百炼 DashScope API Key。

```sql
-- 建库并启用向量扩展
CREATE DATABASE sp_ai;
CREATE EXTENSION IF NOT EXISTS vector;
```

```bash
export DASHSCOPE_API_KEY=你的key
export PG_PASSWORD=你的密码
mvn spring-boot:run
```

启动后自动执行 `db/schema.sql` 建业务表并写入种子数据；pgvector 向量表由框架自动创建。服务端口 `8081`。

## API 一览

| 模块 | 方法与路径 | 说明 |
|------|-----------|------|
| 知识分类 | `GET/POST/PUT/DELETE /api/kb/categories` | 分类 CRUD |
| 知识文档 | `GET/POST/PUT/DELETE /api/kb/documents` | 文档 CRUD |
| 向量化 | `POST /api/kb/documents/{id}/vectorize` | 文档切块写入 PGVector |
| 智能问答 | `POST /api/chat/message` | RAG 检索增强 + 多轮对话 |
| 意图分类 | `POST /api/intent/classify` | 大模型意图归类 |
| 客户识别 | `POST /api/customer/identify` | 新老客户识别 + 标签生成 |
| 订单查询 | `GET /api/orders/{orderNo}` / `GET /api/orders?customerId=` | 订单/物流/售后查询 |
| 风险预警 | `POST /api/risk/check` | 敏感词识别，高风险自动转人工 |

## 路线图

- [x] 项目骨架
- [x] 知识库模块（文档 CRUD + 向量化入库）
- [x] 智能问答（RAG + 多轮对话）
- [x] 客户识别 / 意图分类
- [x] 订单查询
- [x] 风险预警 / 转人工
- [ ] 会话记忆持久化（Redis / DB）
- [ ] 对接前端 superoneweb
