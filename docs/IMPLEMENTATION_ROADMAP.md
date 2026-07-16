# Liftoff Validation MVP 实施路线图

## 1. 路线原则

从 Phase 2 起，开发只服务以下验证链：

```text
访问首页 → 浏览帖子 → 注册 → 发帖 → 回复 → 通知 → 回访
```

路线图按依赖与验证价值排序，不代表开发周期或上线日期。

从 2026-07-14 起，后续产品阶段同时服务以下商业内容闭环：

```text
赚钱机会 → 项目验证 → 项目拆解 → AI Coding → 技术优化
→ 获客与变现 → 商业复盘 → 新的赚钱机会
```

技术能力仍被支持，但不能再次成为首页和 Roadmap 的唯一中心。

## 2. Phase 1：工程骨架

**状态：PASS**

已完成：

- Next.js Web、NestJS API 和 pnpm workspace；
- Prisma 与 PostgreSQL Docker Compose 配置；
- Swagger、健康检查、共享类型和环境校验；
- lint、typecheck、tests、build 与 README。
- Docker Desktop Engine、Docker Compose 与 PostgreSQL 17 容器在线验证；
- `20260712000000_initialize_system_probe` migration 真实应用；
- PostgreSQL 容器健康状态为 `healthy`；
- API `/api/health` 返回 HTTP 200、应用 `ok`、数据库 `up`；
- Swagger `/api/docs` 返回 HTTP 200。

不得删除或回退 Phase 1 基础设施。

## 3. Phase 2：静态首页 UI（当前）

- [x] Header；
- [x] 桌面 Sidebar、平板折叠导航和移动底部导航；
- [x] 简单静态 Hero；
- [x] 分类标签；
- [x] 明确标注为官方 Mock 的帖子列表；
- [x] 浅色、深色和跟随系统主题；
- [x] 主题偏好本地保存；
- [x] 响应式基线；
- [x] 完成本轮格式、lint、类型、测试、构建与桌面运行验收；
- [ ] 在真实移动设备或可用的移动视口环境复核视觉细节。

退出条件：首页可访问，主题与响应式可用，Mock 内容标识清楚，自动化检查通过。

## 4. Phase 3：用户认证

当前状态：**PARTIAL（2026-07-13）**。开发环境认证闭环、真实 PostgreSQL E2E、API 重启后的 Session 持久性、Resend 适配代码及全部质量门禁已通过；正式邮件真实在线投递尚未验证，因此不能标记为 PASS。

- [x] 邮箱注册；
- [x] 一次性邮箱验证；
- [x] 邮箱登录；
- [x] PostgreSQL Session 保持与撤销；
- [x] 退出与当前用户；
- [x] Header 真实身份状态；
- [x] 认证页面和自动化测试。

退出条件：用户可安全建立和恢复会话，认证状态在 Web 与 API 间一致。

## 5. Phase 4：帖子主链

- 帖子列表和帖子详情接入真实数据；
- 创建帖子与我的帖子；
- 安全 Markdown 展示；
- 权限和输入校验。

退出条件：真实账户可完成发布、列表、详情和再次访问闭环。

## 6. Phase 5：评论、二级回复与最小站内通知

- 一级评论与归一化二级回复；
- 帖子评论和评论回复通知；
- 未读数、通知列表与已读状态；
- 作者及 ADMIN 评论软删除；
- 评论锚点与 Header Badge。

退出条件：两个真实账户可完成评论、回复、通知、定位、已读和删除占位闭环。

## 7. Phase 6：部署与小范围验证

- 真实 PostgreSQL；
- 在线 migration；
- 部署与基础日志；
- 数据备份与恢复检查；
- 邀请 10–50 名目标用户测试；
- 记录 Validation MVP 指标。
- 优先邀请想利用 AI 做副业的人，其次是独立开发者、AI 创业者和 AI 工程师；
- 验证赚钱机会、项目验证、项目拆解、变现和失败复盘内容是否形成真实互动；
- 建立收入案例的披露与审核规则，禁止收益保证和虚假收入证明。

退出条件：获得继续投资、调整或停止的真实行为证据。

## 8. 验证成功之后

后续候选能力优先围绕：赚钱机会收集、项目验证模板、项目拆解、收入案例、失败复盘、获客渠道、定价与变现、Prompt、AI Coding 和工具资源。任何收入相关功能都必须先确定真实性、隐私、审核和风险提示边界。

Hero 游戏、点赞、收藏、关注、私信、积分、徽章、第三方登录、AI 能力、Redis、对象存储增强、复杂编辑器和高级 SEO 仍需在验证成功之后重新评估。RAG、Agent 等不再作为独立产品方向，而是技术支撑内容。

# Phase 4 状态补充

**PASS（2026-07-13，帖子主链）**：Post/Tag/PostTag migration，创建、列表、详情、mine API，首页真实数据、发帖页、安全 Markdown 详情页、真实 PostgreSQL E2E、API 重启 Session 验证及生产构建均已完成。本轮按正式范围不实现评论。Phase 3 仍为 PARTIAL。

# Phase 3B 状态

**PARTIAL（2026-07-13）**：Resend 正式适配、配置校验、HTML/纯文本模板、错误映射、幂等键、重发恢复和离线测试已完成。由于尚未提供真实 API Key、已验证发件域名和受控收件邮箱，真实到达、点击及完整在线闭环未验收，Phase 3 不能更新为 PASS。

# Phase 5 状态

**PASS（2026-07-13）**：Comment/Notification migration、一级评论、二级回复归一、软删除、我的评论、真实评论计数、帖子/回复通知、未读数、通知列表/已读、Header Badge、评论锚点、PostgreSQL E2E、API 重启及真实 HTTP/浏览器闭环均已完成。Phase 3 保持 PARTIAL，Phase 4 保持 PASS。

# Community UI V1 状态（2026-07-13）

桌面首页社区化改造已完成：固定 Header/Sidebar、Liftoff 原创静态像素 Hero、分类本地筛选、真实帖子 Grid、真实认证与通知状态、Loading/Error/Empty 状态和 `/posts/mine` 真实入口。未新增后端接口、数据表、migration、点赞、收藏、搜索或 Hero 游戏。Phase 3 的邮件在线投递阻塞状态不受本轮影响。

# Post Detail UI V1 状态（2026-07-13）

帖子详情页已接入 Community UI V1 固定 Header/Sidebar 与 Light/Dark/System 主题，建立正文 + 评论主栏和真实信息辅助栏。历史正文首个同名 H1 仅在展示层有限去重；Markdown 安全渲染、真实评论、二级回复、删除占位、通知锚点和认证入口保持原有契约。未新增后端接口、migration、点赞、收藏、关注、浏览量、作者等级、相关推荐或 Mock 数据。

# Beta Closure 状态（2026-07-13）

**PARTIAL**：Community/Auth/System Shell、跨页状态、路由高亮、发布表单、通知页、404/Error、UI Token、旧组件清理及工程门禁已收口。PostgreSQL healthy、API health 200、migration status 最新、API E2E 25/25 通过；Phase 3 正式邮件投递仍为公开 Beta 阻塞。各 Phase 状态保持：1 PASS、2 PASS、3 PARTIAL、4 PASS、5 PASS。

# Documentation Refactor（2026-07-14）

Liftoff 已正式从“AI Builder / AI 开发者社区”重新定位为“AI 创业 / AI 副业赚钱社区”。本轮只更新文档；已完成 Phase 状态、代码、UI、API、数据库与业务契约全部保持不变。下一轮 UI 或业务改造必须单独立项。

# AI 赚钱社区改造 Phase A（2026-07-14）

**PASS**：现有 Community UI 已完成无数据库定位切换。更新范围包括 metadata、Header 搜索占位、Sidebar 两层信息架构、Hero 文案与 CTA、像素路牌、Primary Tabs、Feed/EmptyState、发布页说明和详情侧栏提示。尚无真实频道的 Sidebar 与 Tab 入口明确保持 disabled，不再全部伪装为 `/#feed`。本轮未修改 NestJS API、Prisma、migration、Session、帖子、评论或通知契约。下一阶段为基于现有 Tag 的真实频道与服务器分页筛选。

# Opportunity Home UI V1（2026-07-14）

**PASS**：在 Phase A 业务边界内完成最终双主题首页视觉。新增等宽分类快捷入口，Feed 改为全宽单列帖子行，Hero 补齐原创金币、树木、日月、机会数据方块、Builder、IDEA 路牌和 Portal。推荐、频道统计、商业属性、独立小游戏面板和右侧栏均未引入。下一实施阶段仍为真实频道，不在本轮提前修改 API 或 Prisma。

# Opportunity Channel MVP（2026-07-14）

**PASS**：首个真实商业频道 `/opportunities` 已上线。它复用 Community Shell、现有 PostCard、Loading/Error/Empty State、Light/Dark/System、帖子详情、评论、二级回复、通知与认证主链。`GET /api/posts` 新增可选 `tag` 查询参数，服务端用规范化 Tag slug 精确筛选已发布帖子，并在分页前计算真实 `total` 与 `totalPages`。发布入口 `/posts/new?tag=赚钱机会` 仅预填 Tag、标题和非强制写作提示；既有 `title`、`contentMarkdown`、`tags` 提交契约、Prisma schema 和 migration 保持不变。其他频道、PostType、商业字段、搜索、推荐与抓取系统仍未实施。
