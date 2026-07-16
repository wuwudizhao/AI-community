# 页面、路由与权限

> 产品定位说明（2026-07-14）：路由和权限契约保持不变；后续首页导航的内容优先级改为 AI 创业 / AI 副业赚钱主题。分类变化不等于当前已经存在对应路由或后端筛选能力。

## 1. 约定

- 路径仅作为产品与前端路由基线，最终框架选型后可调整。
- `公开` 表示无需登录；公开内容仍受内容状态和治理规则约束。
- 所有写操作都必须在服务端重新鉴权。

## 2. 公共与账户页面

| 路由                    | 页面     | 访问权限 | 说明                                            |
| ----------------------- | -------- | -------- | ----------------------------------------------- |
| `/`                     | 社区首页 | 公开     | Hero、赚钱优先分类和真实内容流                  |
| `/opportunities`        | 赚钱机会 | 公开     | 精确 Tag 为“赚钱机会”的已发布帖子，使用真实分页 |
| `/latest`               | 最新内容 | 公开     | 按发布时间排序                                  |
| `/hot`                  | 热门内容 | 公开     | 公式待确认，可在 P1 启用                        |
| `/boards/:slug`         | 板块页   | 公开     | 仅展示启用且可见板块                            |
| `/posts/:idOrSlug`      | 帖子详情 | 公开     | ID、Slug 或二者组合待确认                       |
| `/tags/:slug`           | 标签页   | 公开     | 标签与关联帖子                                  |
| `/search`               | 搜索页   | 公开     | 仅返回有权查看的内容                            |
| `/users/:username`      | 用户主页 | 公开     | 隐私字段不可暴露                                |
| `/login`                | 邮箱登录 | 未登录   | Phase 3 已实现                                  |
| `/register`             | 邮箱注册 | 未登录   | Phase 3 已实现                                  |
| `/verify-email`         | 邮箱验证 | 公开     | 一次性验证 Token                                |
| `/verify-email/pending` | 等待验证 | 公开     | 脱敏邮箱与重发入口                              |
| `/forgot-password`      | 找回密码 | 未登录   | 是否首切片实现待确认                            |

## 3. 登录后页面

| 路由                   | 页面     | 权限                      |
| ---------------------- | -------- | ------------------------- |
| `/posts/new`           | 发布帖子 | 注册用户，且未被禁言/封禁 |
| `/posts/:id/edit`      | 编辑帖子 | 作者或有权管理者          |
| `/bookmarks`           | 我的收藏 | 本人                      |
| `/following`           | 我的关注 | 本人                      |
| `/history`             | 浏览历史 | 本人；P1                  |
| `/notifications`       | 通知中心 | 本人                      |
| `/settings/profile`    | 个人资料 | 本人                      |
| `/settings/account`    | 账户安全 | 本人                      |
| `/settings/appearance` | 主题设置 | 本人                      |

## 4. 管理页面

| 路由               | 页面     | 权限                     |
| ------------------ | -------- | ------------------------ |
| `/admin`           | 管理概览 | 管理员                   |
| `/admin/reports`   | 举报队列 | 版主（授权范围）或管理员 |
| `/admin/posts`     | 帖子管理 | 版主（授权范围）或管理员 |
| `/admin/comments`  | 评论管理 | 版主（授权范围）或管理员 |
| `/admin/users`     | 用户管理 | 管理员                   |
| `/admin/boards`    | 板块管理 | 管理员                   |
| `/admin/audit-log` | 审计日志 | 管理员；查看范围待确认   |

## 5. 关键操作权限

| 操作              | 访客 | 用户 |  版主  | 管理员 |
| ----------------- | :--: | :--: | :----: | :----: |
| 浏览公开内容      |  ✓   |  ✓   |   ✓    |   ✓    |
| 发帖、评论、互动  |  —   |  ✓   |   ✓    |   ✓    |
| 编辑/删除本人内容 |  —   |  ✓   |   ✓    |   ✓    |
| 举报              |  —   |  ✓   |   ✓    |   ✓    |
| 管理授权板块内容  |  —   |  —   |   ✓    |   ✓    |
| 管理板块          |  —   |  —   |   —    |   ✓    |
| 调整用户角色      |  —   |  —   |   —    |   ✓    |
| 封禁用户          |  —   |  —   | 待确认 |   ✓    |
| 查看审计日志      |  —   |  —   | 待确认 |   ✓    |

## 6. 导航响应式原则

- 桌面端使用顶部搜索栏与左侧导航；
- 中等屏幕可折叠左侧导航；
- 移动端使用顶部操作区和底部核心导航；
- 发布操作始终可达，但不得遮挡内容；
- 登录后个人入口与通知入口应保持一致位置。

# Phase 4 已实现路由

- `POST /api/posts`：ACTIVE Session；
- `GET /api/posts`：公开；
- `GET /api/posts?tag=赚钱机会`：公开；精确 Tag 筛选、仅 PUBLISHED、筛选后分页；
- `GET /api/posts/mine`：ACTIVE Session；
- `GET /api/posts/:slug`：公开，仅 PUBLISHED；
- `/posts/new`：发帖页，游客转到登录；
- `/posts/[slug]`：公开安全 Markdown 详情。

# Phase 5 已实现路由

- `POST /api/posts/:slug/comments`：ACTIVE Session；
- `GET /api/posts/:slug/comments`：公开，仅已发布帖子；
- `DELETE /api/comments/:id`：评论作者或 ADMIN；
- `GET /api/comments/mine`：当前 ACTIVE Session；
- `GET /api/notifications`、`unread-count`：只读当前 Session 用户；
- `PATCH /api/notifications/:id/read`、`read-all`：只更新当前 Session 用户；
- `/notifications`：登录用户通知中心，`noindex`；
- `/posts/[slug]#comment-:id`：公开帖子中的评论定位锚点。

未登录用户可读评论但不能发表评论。Phase 5 不扩大 MODERATOR 权限，也不提供管理员读取他人通知的普通接口。

# Beta 路由收口

`/posts/new`、`/posts/mine`、`/notifications` 与 `/opportunities` 已统一 Community Shell；`/posts/new?tag=赚钱机会` 只预填真实 Tag 与写作提示，不改变提交契约。`/login`、`/register` 和邮箱验证页继续使用 Auth Shell。热门、搜索、消息、收藏、点赞、历史和设置没有正式路由，界面不得将其伪装为可用能力。完整矩阵见 `docs/ROUTE_STATUS_MATRIX.md`。
