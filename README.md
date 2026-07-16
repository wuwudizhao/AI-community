# Liftoff（起飞社区）

面向普通人、独立开发者与创业者的 AI 创业 / AI 副业赚钱社区。

> Find. Build. Earn. Repeat.

Liftoff 的目标不是讨论 AI，而是帮助普通人利用 AI 创造收入。Coding 是工具，赚钱才是最终目标。社区围绕“发现机会 → 验证项目 → 做出来 → 获得收入 → 分享经验”组织内容；Vibe Coding、Agent、RAG、MCP 和 FDE 作为第二层实现能力保留。

正式产品定位见 [产品愿景](docs/PRODUCT_VISION.md)。2026-07-14 的重新定位只更新文档，不表示现有 UI、API 或数据库已经完成相应调整。

## 当前状态

项目已完成 Phase 5：真实评论、二级回复与最小站内通知闭环。Phase 1、2、4、5 为 **PASS**；Phase 3 因 Resend 真实在线投递尚未验收，继续保持 **PARTIAL**。Hero 游戏及其他范围外能力未实现。

Phase 1 数据库在线补验收已于 2026-07-13 完成：Docker Compose PostgreSQL 17 容器健康、初始 Prisma migration 已真实应用，API 健康检查与 Swagger 均通过。Phase 1 状态为 **PASS**。

## 技术栈

- Node.js 24 LTS
- pnpm 11 workspace
- Next.js + React + TypeScript
- Tailwind CSS + shadcn/ui
- NestJS + Swagger / OpenAPI
- Prisma + PostgreSQL
- Docker Compose（本地 PostgreSQL）
- Vitest + React Testing Library（Web）
- Jest + Supertest（API）
- ESLint + Prettier

## 仓库结构

```text
apps/
  web/                 Next.js Web 与静态社区首页
  api/                 NestJS API、Swagger、健康检查与 Prisma
packages/
  shared-types/        跨应用的纯 TypeScript 契约
  validation/          Zod 环境和输入校验
  config/              共享 TypeScript 配置
docs/                  产品和工程文档
docker-compose.yml     本地 PostgreSQL
pnpm-workspace.yaml    workspace 与依赖构建白名单
```

依赖方向为 `apps → packages`。共享包不得依赖 `apps`；Web 不直接导入 Prisma 或数据库实现。

## 环境要求

1. 安装 Node.js 24 LTS；项目提供 `.nvmrc` 和 `.node-version`。
2. 使用随 Node 提供的 Corepack 运行 pnpm。
3. 安装 Docker Desktop 或其他支持 `docker compose` 的运行时。

如果当前终端已启用 Corepack shim，可直接把以下命令中的 `corepack pnpm` 写成 `pnpm`。在无管理员权限、无法执行 `corepack enable pnpm` 的 Windows 环境中，直接使用 `corepack pnpm` 即可。

## 首次安装

在仓库根目录执行：

```powershell
corepack pnpm install
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

示例密码仅用于本机开发。共享或生产环境必须替换密码，且不得提交 `.env`、`.env.local` 或真实密钥。

## 启动数据库与迁移

```powershell
corepack pnpm db:up
corepack pnpm db:generate
corepack pnpm db:migrate
```

首次执行 `db:migrate` 时，Prisma 会使用 `apps/api/prisma/schema.prisma` 和已提交的迁移目录。该文件是唯一正式 schema 真相源。

停止本地数据库：

```powershell
corepack pnpm db:down
```

## 启动应用

同时启动 Web 和 API：

```powershell
corepack pnpm dev
```

或分别启动：

```powershell
corepack pnpm dev:web
corepack pnpm dev:api
```

默认地址：

- Web Validation MVP 首页：<http://localhost:3000>
- API 健康检查：<http://localhost:4000/api/health>
- Swagger UI：<http://localhost:4000/api/docs>

健康接口会查询 PostgreSQL：数据库可用时返回 `200` 和 `status: ok`；数据库不可用时返回 `503`、`status: degraded` 与 `database.status: down`。

最近一次在线验收使用 API 端口 `4000`，返回 `database.status: up`。端口以 `API_PORT` 和本 README 为准。

## 质量与测试

```powershell
corepack pnpm lint
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm --filter @liftoff/api test:e2e
corepack pnpm build
```

Prisma schema 的离线校验：

```powershell
corepack pnpm db:validate
corepack pnpm --filter @liftoff/api exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
```

## 数据库命令

| 命令                        | 用途                      |
| --------------------------- | ------------------------- |
| `corepack pnpm db:up`       | 启动 PostgreSQL 容器      |
| `corepack pnpm db:down`     | 停止 Compose 服务         |
| `corepack pnpm db:generate` | 生成 Prisma Client        |
| `corepack pnpm db:validate` | 校验 Prisma schema        |
| `corepack pnpm db:migrate`  | 在开发数据库应用/创建迁移 |

## 文档索引

- [产品愿景（正式定位真相源）](docs/PRODUCT_VISION.md)
- [项目目的与范围](docs/PROJECT_PURPOSE.md)
- [MVP 产品需求](docs/MVP_PRODUCT_REQUIREMENTS.md)
- [Validation MVP](docs/VALIDATION_MVP.md)
- [认证模型](docs/AUTHENTICATION_MODEL.md)
- [UI Baseline](docs/UI_BASELINE.md)
- [页面、路由与权限](docs/ROUTES_AND_PERMISSIONS.md)
- [领域数据模型](docs/DATA_MODEL.md)
- [技术架构](docs/TECHNICAL_ARCHITECTURE.md)
- [实施路线图](docs/IMPLEMENTATION_ROADMAP.md)
- [决策记录](docs/DECISION_LOG.md)

# Phase 4 状态

帖子内容主链已经完成：真实 PostgreSQL Post/Tag/PostTag、创建、列表、详情、我的帖子、首页真实数据、发帖页和安全 Markdown 展示均已接通。Phase 3 仍因正式邮件服务未接入保持 PARTIAL。

# Phase 5 状态

评论与通知互动闭环已经完成：一级评论、归一化二级回复、软删除占位、我的评论、帖子真实评论数、帖子/回复通知、未读数、通知已读和安全评论锚点均使用 PostgreSQL。API 重启后的 Session、评论和通知保持有效。详见 [评论模型](docs/COMMENT_MODEL.md) 与 [通知模型](docs/NOTIFICATION_MODEL.md)。

Phase 5 验收除根级质量命令外，还执行真实 PostgreSQL E2E 与 Prisma 状态检查：

```powershell
$env:NODE_ENV='test'
$env:DATABASE_URL='postgresql://liftoff:liftoff_local_only@localhost:5432/liftoff?schema=public'
$env:WEB_ORIGIN='http://localhost:3000'
$env:WEB_BASE_URL='http://localhost:3000'
$env:MAIL_PROVIDER='resend'
corepack pnpm --filter @liftoff/api test:e2e
corepack pnpm --filter @liftoff/api exec prisma migrate status
```

# Phase 3B 邮件配置

正式邮件选择 Resend。生产环境必须通过秘密管理注入 `MAIL_PROVIDER`、`MAIL_API_KEY`、`MAIL_FROM_ADDRESS`、`MAIL_FROM_NAME` 和 `MAIL_TIMEOUT_MS`。开发环境仍使用受控预览；生产环境不会静默降级。真实在线投递尚未验收，因此 Phase 3 保持 PARTIAL。

受控在线 smoke（API 必须以生产邮件配置启动）：

```powershell
.\scripts\mail-smoke.ps1 -TestEmail "受控测试邮箱"
```

# Liftoff Community UI V1

桌面首页现采用固定 Header、固定 Sidebar、原创静态像素 Hero、等宽分类快捷入口、分类 Tabs 和真实帖子列表。首页只读取现有帖子、认证与通知接口；数据库为空时显示 Empty State，不生成 Mock 帖子或虚假互动数据。

2026-07-14 已完成 AI 赚钱社区定位切换的 Phase A：Hero、metadata、Header 搜索占位、Sidebar 分组、Tabs、Feed、发布页说明和帖子侧栏提示已改为机会、项目、收入与复盘导向。现有像素角色、Token、Bug、Portal、Light/Dark/System、认证、帖子、评论和通知主链保持不变。真实频道尚未接入，相关入口明确保持 disabled；本轮没有修改 API、Prisma 或 migration。

- 主要桌面基准：1280 × 800、1440 × 900、1920 × 1080；
- Feed：所有桌面尺寸均使用占满主内容宽度的单列高密度帖子行；
- `/posts/mine`：真实“我的发布”入口；
- 搜索、消息、收藏、点赞、历史和完整设置仍未实现，界面保持禁用或“即将开放”；
- Hero 当前仅为 CSS 原创静态互动视觉，不包含游戏状态或控制逻辑。

2026-07-14 完成 Opportunity Home UI V1：深浅主题共享同一 DOM 结构，Hero 保留原创 CSS 像素世界并增加金币、树木、日月和原创机会数据方块；帖子右侧不展示商业属性面板，快捷入口不展示虚假讨论数量。详细规格见 [Liftoff Opportunity Home UI V1](docs/LIFTOFF_OPPORTUNITY_HOME_UI_V1.md)。

# Opportunity Channel MVP

`/opportunities` 是首个真实频道，公开展示带有精确 `赚钱机会` Tag 的已发布帖子。它使用现有帖子、详情、评论、二级回复、通知、认证及主题主链，不新增数据表或商业字段。

- 频道 API：`GET /api/posts?tag=赚钱机会&page=1&pageSize=12&sort=latest`；服务端按规范 Tag 精确筛选，并基于筛选结果分页；
- 发布入口：`/posts/new?tag=赚钱机会`，仅预填 Tag 和提供非强制写作提示，提交契约不变；
- 没有 Tag 的 `GET /api/posts` 行为保持不变；
- 空频道不显示示例机会、收入、成本、评分或互动数据。

# Beta 收口状态

社区页现统一使用 Community Shell；认证页使用 Auth Shell；404 与全局错误页使用品牌化 System State。未实现的搜索、消息、热门、收藏、点赞、历史和设置继续保持禁用，不建立虚假路由或数据。

- [UI 组件标准](docs/UI_COMPONENT_STANDARD.md)
- [路由状态矩阵](docs/ROUTE_STATUS_MATRIX.md)
- [Release Readiness](docs/RELEASE_READINESS.md)
- [Beta Closure Report](docs/BETA_CLOSURE_REPORT.md)

当前阶段状态：Phase 1 PASS、Phase 2 PASS、Phase 3 PARTIAL、Phase 4 PASS、Phase 5 PASS。Phase 3 仍需正式 Resend 在线投递验证；数据库相关在线验收要求 Docker Desktop Engine 正在运行。
