# 评论模型

Phase 5 的评论是真实 PostgreSQL 数据，采用纯文本、两层展示结构。

## 结构与回复归一

- `parentId = null` 是一级评论。
- 二级回复的 `parentId` 永远指向一级评论。
- 回复二级回复时，服务端把新回复归一到同一个一级 `parentId`，并以 `replyToUserId` 记录被回复用户，因此不会形成第三级数据树。
- `postId`、`authorId` 均由服务端解析；回复目标必须是同一篇已发布帖子的 `PUBLISHED` 评论。
- 一级评论分页，默认 `oldest`，每页 20、最大 50；每个一级评论最多内联 100 条按时间正序的回复。

## 内容与权限

- 本阶段只保存纯文本，trim 后必须包含 1–5,000 个可见字符；拒绝纯空白和仅零宽字符。
- 只有 `ACTIVE` Session 用户可创建评论。读取已发布帖子的评论不要求登录。
- 普通用户只能删除自己的评论；`ADMIN` 可删除任意评论；`MODERATOR` 权限本阶段不扩大。
- 删除为幂等软删除，记录 `deletedAt` 与 `deletedById`。正文不再公开，作者仍显示，UI 使用“该评论已删除”占位。
- 删除一级评论不会级联删除回复；`HIDDEN` 评论对普通列表完全隐藏。
- 删除帖子沿用 Phase 4 的软删除策略，评论保留在数据库但不再通过公开帖子路由访问。

## API

- `POST /api/posts/:slug/comments`
- `GET /api/posts/:slug/comments?page=1&pageSize=20&sort=oldest`
- `DELETE /api/comments/:id`
- `GET /api/comments/mine?page=1&pageSize=20`

客户端禁用重复提交，但本阶段未实现持久化 Idempotency-Key；网络超时后人工重试仍可能形成重复评论，这是已记录的后续风险。
