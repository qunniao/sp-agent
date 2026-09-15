# SP-Base Backend

## 技术栈

| 层 | 选型 | 说明 |
|---|------|------|
| 框架 | Spring Boot 3.3.13 | Java 21 |
| ORM | MyBatis-Plus 3.5.7 | 分页插件、Lambda Query |
| 数据库 | MySQL 8.3 | 单库 sp_base |
| 构建 | Maven 多模块 | 父子聚合 + 模块聚合器 |
| 工具 | Lombok | 减少样板代码 |

## 架构风格

**模块化单体 + DDD 轻量分层**：按业务领域拆分模块，每个模块内分 interface/application/domain/infrastructure 四层。

## 模块结构

```
sp-base/
├── pom.xml                          # 根 POM：聚合 4 个子模块 + dependencyManagement
├── sp-base-common/                 # 纯 POJO 层（零框架依赖）
│   ├── ApiResponse.java             # 统一响应{code,message,data}
│   ├── PageResult.java              # 分页结果{records,total,page,pageSize}
│   └── PageParams.java              # 分页参数基类{page,pageSize,sortField,sortOrder}
│
├── sp-base-framework/              # 基础设施层（全局配置/安全/异常）
│   ├── config/
│   │   ├── MyBatisPlusConfig.java   # MP 分页插件（全局一次配置）
│   │   └── AsyncConfig.java         # 异步线程池（logExecutor: core=2,max=4,queue=1000）
│   ├── security/
│   │   ├── OperatorProvider.java    # 操作人接口（auth 模块上线后自动替换）
│   │   └── DefaultOperatorProvider  # 默认返回 "anonymous"
│   └── web/
│       ├── GlobalExceptionHandler   # 全局异常 → ApiResponse
│       └── CorsConfig.java         # 跨域配置
│
├── sp-base-modules/                # 业务模块聚合器
│   ├── pom.xml                      # 统一管理业务模块 + 默认依赖 framework
│   └── sp-base-log/                # 审计日志领域
│       ├── annotation/OperationLog  # @OperationLog 注解（支持自动派生 method/path）
│       ├── aspect/LogAspect         # AOP 切面：环绕记录 + OperatorProvider 获取操作人
│       ├── controller/LogController # GET /log/operation, GET /log/login
│       ├── dto/LogQueryDTO          # 日志查询参数（本模块专用，不污染 common）
│       ├── entity/{Operation,Login}Log  # Entity = VO（日志无敏感字段，直接返回）
│       ├── mapper/                  # MyBatis Mapper + 动态 SQL 分页
│       └── service/                 # Service 接口 + @Async("logExecutor") 实现
│
└── sp-base-server/                 # 启动入口（薄层）
    ├── SpBaseApplication.java     # @SpringBootApplication
    └── application.yml              # 数据源/MP/日志/Actuator 配置
```

## 依赖方向（严格单向）

```
sp-base-server ──→ sp-base-modules ──→ sp-base-framework ──→ sp-base-common
       │                    │                    │
       └─ spring-boot ──────┴────────────────────┘
```

- `sp-base-common`：零框架依赖，纯 POJO
- `sp-base-framework`：依赖 common + Spring Boot + MyBatis-Plus，提供全局配置
- `sp-base-modules`：父 POM 统一依赖 framework，业务模块只需依赖 common
- `sp-base-server`：装配所有模块 + 运行期依赖（MySQL 驱动、Actuator）

## API 约定

### 统一响应

所有接口返回 `ApiResponse<T>`：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": { ... }
}
```

### 分页查询

请求参数继承 `PageParams`（page/pageSize/sortField/sortOrder），响应统一用 `PageResult<T>`。

### 现有端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/log/operation` | 操作日志分页（operator/action/method/status/timeRange） |
| GET | `/log/login` | 登录日志分页（username/status/timeRange） |
| GET | `/actuator/health` | 健康检查（Docker/K8s 探活） |

## 关键模式

### 1. AOP 操作日志

`@OperationLog` 注解标记 Controller 方法，`LogAspect` 自动记录：

```java
@OperationLog("用户管理")   // method/path 留空则自动从 @PostMapping 派生
@PostMapping("/users")
public ApiResponse<?> createUser(...) { ... }
```

特性：
- 自动派生 HTTP method（@GetMapping→"GET"）和 path
- `OperatorProvider` 获取操作人（auth 模块上线后自动替换默认实现）
- `@Async("logExecutor")` 异步写入，有限线程池防 OOM

### 2. 模块扩展

新增业务模块只需 3 步：

```bash
# 1. 创建模块目录 + pom.xml（继承 sp-base-modules）
mkdir -p sp-base-modules/sp-base-auth/src/main/java/com/sp_base/auth

# 2. 在 sp-base-modules/pom.xml 的 <modules> 中注册
# 3. 在根 pom.xml <dependencyManagement> 中声明版本

# 4. 可选的：在 sp-base-server/pom.xml 中添加运行时依赖
```

## 运行

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS sp_base DEFAULT CHARSET utf8mb4"

# 2. 建表
mysql -u root -p sp_base < docs/sql/log_tables.sql

# 3. 启动（监听 8080）
mvn spring-boot:run -pl sp-base-server

# 4. 健康检查
curl http://localhost:8080/actuator/health
```

## 当前状态

- [x] Maven 多模块骨架（common / framework / modules / server）
- [x] 基础设施层（MyBatisPlus 分页 / 线程池 / 全局异常 / CORS）
- [x] 操作人接口 + 默认实现（OperatorProvider）
- [x] 审计日志模块（操作日志 + 登录日志 CRUD）
- [x] AOP 自动操作日志记录（@OperationLog + 自动派生 method/path）
- [x] 异步日志写入（专用线程池 logExecutor）
- [x] Actuator 健康检查
- [ ] 认证授权模块（AuthService / JWT / SecurityContext OperatorProvider）
- [ ] 系统管理模块（用户/角色/菜单）
- [ ] 其他业务模块

## 包约定

- 基础包：`com.sp.base`
- 公共 POJO：`com.sp.base.common`（零框架依赖）
- 基础设施：`com.sp.base.framework.{config,security,web}`
- 业务模块：`com.sp.base.<module>.{annotation,aspect,controller,dto,entity,mapper,service}`
