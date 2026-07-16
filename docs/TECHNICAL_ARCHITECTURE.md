# Liftoff 技术架构基线

## 1. 架构目标

技术架构首先服务公开社区 MVP 主链，并为治理、安全和后续扩展保留清晰边界。产品层的唯一正式定位是 AI 创业 / AI 副业赚钱社区；技术架构不把 Vibe Coding、Agent 或 RAG 固化为顶层产品边界。Hero 小游戏、AI 搜索等增强能力不得进入核心领域依赖链。

重新定位不改变现有 Next.js、NestJS、Prisma、PostgreSQL 或 Session 架构。后续机会、验证、拆解、变现、收入案例和失败复盘能力应通过明确领域建模演进，不得把标签文案直接当作已完成业务模型。

## 2. 已确认技术栈

阶段 1 正式采用以下技术栈：

| 层           | 方案                           | 状态          |
| ------------ | ------------------------------ | ------------- |
| Web          | Next.js + React + TypeScript   | 已确认        |
| 样式与组件   | Tailwind CSS + shadcn/ui       | 已确认        |
| API          | NestJS + TypeScript            | 已确认        |
| ORM          | Prisma                         | 已确认        |
| 主数据库     | PostgreSQL                     | 已确认        |
| Monorepo     | pnpm workspace                 | 已确认        |
| 本地基础设施 | Docker Compose                 | 已确认        |
| Web 测试     | Vitest + React Testing Library | 已确认        |
| API 测试     | Jest + Supertest               | 已确认        |
| API 文档     | Swagger / OpenAPI              | 已确认        |
| 缓存/队列    | Redis                          | 阶段 1 不引入 |
| 搜索         | PostgreSQL 全文搜索            | 推荐 MVP      |
| 文件         | S3 兼容对象存储                | 待确认        |
| Node.js      | 24 LTS                         | 已确认        |

不在需求出现前引入 Elasticsearch、微服务、事件总线、Kubernetes 或复杂多仓库体系。

Next.js 取代原先待确认的 React + Vite 建议。公开论坛需要帖子、板块和用户主页的服务端渲染、metadata、Open Graph、robots 与 sitemap 能力，这些属于 Web 框架的基础职责。

## 3. 仓库形态建议

推荐使用轻量 monorepo，便于共享类型与校验，同时保留应用边界：

```text
apps/
  web/            Next.js Web
  api/            后端 API
packages/
  contracts/      API DTO、枚举和共享契约
  validation/     可共享的输入规则（不得替代服务端校验）
  config/         TypeScript、Lint 等公共配置
docs/
```

管理后台优先作为 Web 应用内的权限路由，只有在复杂度证明需要时再拆为独立应用。

## 4. 后端模块边界

```text
Auth
Users
Boards
Posts
Comments
Tags
Interactions
Notifications
Search
Files
Reports
Moderation
```

- 模块只能通过公开服务或事件契约协作，不跨模块直接修改数据；
- `Interactions` 可在规模增长后拆分，初期仍应保持点赞、收藏、关注的领域概念清晰；
- `HeroGame` 只属于前端展示层，通过普通导航进入社区，不调用论坛内部写接口；
- AI 能力未来作为独立适配层接入，不能让核心发帖流程依赖模型可用性。

未来与商业内容闭环相关的候选领域包括 `Opportunities`、`Validations`、`Monetization` 和 `CaseStudies`，但当前均未实现。只有在产品字段、权限、真实性、隐私和审核规则明确后才能进入正式数据模型；在此之前继续使用现有帖子与标签主链，不新增隐式耦合。

## 5. API 原则

- 使用版本化前缀，例如 `/api/v1`；
- 输入在边界校验，错误返回稳定错误码和可读信息；
- 列表统一采用游标或页码分页，具体方案待确认；
- 写操作在服务端鉴权，不信任客户端角色与计数；
- 对登录、注册、发帖、评论、搜索和举报设置差异化限流；
- 幂等或可重试操作需要唯一键或幂等键保护；
- API 契约应能生成或维护 OpenAPI 文档。

## 6. 认证与安全基线

- 密码使用成熟的内存困难哈希算法；参数在实现阶段按运行环境确定；
- 会话 Cookie 推荐使用 `HttpOnly`、`Secure`、适当的 `SameSite`；如采用 Token，也不得暴露长期令牌给普通脚本；
- 明确 CSRF 策略；
- 用户富文本必须经过允许列表清洗，渲染层默认转义；
- 上传通过类型、大小、内容与所有权校验；
- 数据库使用参数化查询/ORM，不拼接用户输入；
- 密钥只通过环境配置注入；仓库提供 `.env.example`，不提供真实值；
- 管理接口执行更严格的鉴权、审计和限流。

## 7. 数据与搜索

- PostgreSQL 是业务事实来源；
- 搜索索引只包含公开且可见内容，并能在状态变化后同步移除；
- MVP 使用数据库全文搜索，达到明确瓶颈后再评估专用搜索服务；
- 数据迁移必须纳入版本控制并具备回滚或前向修复策略；
- 上线前必须确定备份、恢复演练和保留策略。
- 收入、成本、周期和渠道等商业字段具有真实性与隐私风险；正式建模前必须先确定披露口径、审核、脱敏和删除策略；
- 排序优先级“收入案例 → 机会 → 项目验证 → 项目拆解 → 技术内容”是产品目标，不代表当前 API 已有推荐算法。

## 8. 前端架构

- 使用应用壳统一顶部栏、侧栏、主题和响应式导航；
- 信息架构中赚钱与商业实践为第一层，技术主题为第二层；该顺序不得通过复制静态假帖子实现；
- 页面按领域组织，不按“components/hooks/utils”无限平铺；
- 服务端状态与本地 UI 状态分离；具体数据请求库待确认；
- 主题支持浅色、深色、跟随系统和减少动态效果；
- Hero 游戏异步加载、可暂停、可降级，不能进入论坛首屏关键资源链；
- 用户内容渲染使用统一安全组件，禁止页面各自实现 HTML 注入。

## 9. 测试策略

- 单元测试：权限规则、状态转换、排序与计数逻辑；
- 集成测试：认证、数据库约束、帖子/评论、举报与通知；
- 端到端测试：注册登录、浏览、发帖、回复、通知、举报和管理处置；
- 安全测试：未授权访问、越权编辑、XSS 输入、重复互动和限流；
- Hero 游戏仅测试加载降级、暂停与导航，不得阻塞核心 E2E 套件。

## 10. 可观测性与运行

- 结构化日志包含请求标识和错误类别，不包含密码、会话令牌或完整敏感内容；
- 监控 API 错误率、延迟、数据库连接、后台任务失败和上传失败；
- 通知等异步任务应支持重试和死信观察（引入队列后）；
- 健康检查区分进程存活与依赖就绪；
- 环境至少区分本地、测试与生产。

## 11. 后续架构决策门

阶段 2 开始前仍需确认：

1. 邮箱找回密码与正式邮件供应商；
2. 内容编辑器原始格式；
3. 图片对象存储方案；
4. 部署目标与运行预算；
5. 分页方式与公开 URL 策略。

Redis 已明确不作为阶段 1 必需服务，只有出现缓存或异步任务的真实需求时再评估。

Phase 3 认证使用 PostgreSQL 服务端 Session、Argon2id 和 HttpOnly Cookie。Web 只通过 NestJS API 获取身份，不导入 Prisma，也不在 localStorage 保存敏感 Token。

# Phase 4 内容模块

`PostsModule` 独立于认证模块，通过导出的 `SessionAuthGuard` 复用 PostgreSQL Session。Web 只调用 NestJS API。公开列表在一次关联查询中加载作者和标签以避免 N+1；创建帖子与标签使用 Prisma 事务。

# Phase 3B 邮件适配层

`AuthService → MailService → DevelopmentMailService | ProductionMailService`。开发与测试使用受控预览，生产只允许 Resend HTTPS API。提供商错误在适配层转换为稳定 HTTP 异常；API Key 只来自启动环境，生产配置由 Zod 在启动时校验。

# Phase 5 互动模块

`CommentsModule` 与 `NotificationsModule` 只通过 Prisma 和公开 Auth guard 协作，不向 Web 暴露 Prisma。`CommentsService` 在单一交互事务中写 Comment 与最多一条 Notification；`NotificationsService` 始终从 Session 注入接收人。Next.js 帖子主体继续服务端渲染，评论区是隔离的 Client Component，因此不破坏帖子 metadata 与索引；通知页明确 `noindex`。本阶段不引入 Redis、队列、WebSocket、SSE 或轮询。

# Beta Web Shell 边界

Next.js 社区业务页统一组合 `ForumHeader → ForumShell → ForumSidebar + community-content`；认证页使用 `AuthShell`，系统异常页使用品牌化 route state。该收口只影响 Web 展示边界，不改变 API、Prisma 或 Session 依赖方向。
