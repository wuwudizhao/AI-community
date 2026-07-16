# Liftoff 帖子模型

Phase 4 只实现帖子主链，不包含评论、点赞、收藏、通知、搜索或 AI/RAG 字段。Phase 3 仍为 PARTIAL，正式邮件服务仍是独立阻塞项。

## 数据与事务

- `Post`：标题、唯一 slug、Markdown 正文、作者、`DRAFT/PUBLISHED` 状态及时间字段。
- `Tag`：标准化名称、唯一 slug 和创建时间。
- `PostTag`：以 `(postId, tagId)` 为联合主键的多对多关系。
- 用户关系使用 `Restrict`，避免删除用户时意外删除全部帖子。

帖子、标签及关联在同一个 Prisma 事务中创建。当前创建接口固定发布为 `PUBLISHED`。

## Markdown 与权限

`contentMarkdown` 是正式正文格式，长度 1–50,000。Web 使用 `react-markdown` 和 `remark-gfm`，不启用原始 HTML，支持基础 Markdown、代码块、引用、列表和链接。

列表和详情公开；创建及 `/posts/mine` 需要有效 PostgreSQL Session 且用户必须为 `ACTIVE`。`authorId` 只从服务端 Session 推导。

## Slug 与标签

标题规范化后附 SHA-256 摘要及加密随机后缀，支持中文和相同标题。标签去除首尾空格、折叠空白、按不区分大小写去重；每帖最多 8 个，每个最多 30 字符。

## API 与分页

- `POST /api/posts`
- `GET /api/posts?page=1&pageSize=20&sort=latest`
- `GET /api/posts?tag=赚钱机会&page=1&pageSize=12&sort=latest`
- `GET /api/posts/mine`
- `GET /api/posts/:slug`

`pageSize` 最大 50，当前只支持 `latest`（`createdAt DESC`）。可选 `tag` 会先使用与发帖相同的标签规范化规则生成稳定 slug，再在数据库中按 `PostTag → Tag.slug` 精确筛选；筛选发生在分页前，`total` 与 `totalPages` 始终来自筛选后的已发布帖子。列表返回确定性 excerpt，不返回完整正文或敏感用户字段。

## Phase 5 评论关联与计数

Post 与 Comment 为一对多。列表和详情的 `commentCount` 使用 Prisma `_count` 并限定 `PUBLISHED`，不会逐帖查询，也不包含已删除/隐藏评论。帖子仍采用 Phase 4 软删除；删除后公开详情及评论入口均不可访问，数据库互动记录保留。
