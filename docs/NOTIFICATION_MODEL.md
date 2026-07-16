# 最小站内通知模型

Phase 5 只产生 `POST_COMMENTED` 与 `COMMENT_REPLIED`，`SYSTEM` 仅保留枚举，不在本阶段生成。

## 产生与一致性

- 评论他人帖子时通知帖子作者。
- 回复评论或回复时通知被回复用户。
- 接收人与操作者相同则不创建通知，因此自己的帖子评论、自己的评论回复都不会产生自通知。
- 每次评论最多创建一条通知；评论与通知在同一个 Prisma 交互事务内写入，任一写入失败则整体回滚。
- 删除评论不删除历史通知。通知目标仍指向帖子与软删除占位。

## 读取与安全

- 所有接口通过现有 `SessionAuthGuard`，只使用 Session 用户作为 `recipientId`，不接受客户端指定接收人。
- `actor` 只输出 `id`、`username`、`displayName`。
- `preview` 来自纯文本规范化后最多 100 字符；不包含完整帖子正文。
- `targetUrl` 由服务端生成且只使用编码后的站内相对路径：`/posts/:slug#comment-:id`。
- `readAt = null` 表示未读；单条已读与全部已读均为幂等数据库更新。列表按 `createdAt` 倒序。
- 不轮询、不实时推送；Header 首次加载和通知页明确加载时读取。

## API

- `GET /api/notifications?page=1&pageSize=20&unreadOnly=false`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

通知页 `/notifications` 为 `noindex`，支持全部/未读、分页、错误重试和全部已读。
