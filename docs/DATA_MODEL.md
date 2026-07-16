# Liftoff 领域数据模型

## 1. 建模原则

- 使用稳定的内部 ID，公开标识与展示名分离；
- 业务删除默认采用软删除或状态变更，管理审计不可随业务对象删除；
- 计数为可重建缓存，关系表才是事实来源；
- 时间统一存储为 UTC，界面按用户时区展示；
- 用户内容保留可迁移的原始格式，并在输出时安全渲染；
- 数据库、API 和文档中的枚举含义保持一致。

## 2. 核心关系

```text
User ──< Post >── Board
  │        │
  │        ├──< Comment
  │        ├──< PostTag >── Tag
  │        ├──< PostLike
  │        ├──< Bookmark
  │        └──< Report
  │
  ├──< UserFollow >── User
  ├──< Notification
  └──< ModerationAction
```

## 3. 核心实体

### 3.1 User

关键字段：`id`、`username`、`displayName`、`email`（如采用邮箱注册）、`passwordHash`（如采用密码登录）、`avatarUrl`、`bio`、`role`、`status`、`createdAt`、`updatedAt`。

- `username` 与登录标识需唯一且规范化；
- 密码哈希算法与参数在技术设计中确定；
- 邮箱、会话和管理备注不得出现在公开用户接口；
- 用户注销、匿名化和内容归属策略待确认。

### 3.2 Session / RefreshToken

关键字段：`id`、`userId`、`tokenHash` 或会话标识、`expiresAt`、`revokedAt`、`createdAt`、设备摘要（可选）。

Phase 3 已确认使用 PostgreSQL 服务端 `UserSession`。Cookie 保存随机 Secret，数据库只保存 SHA-256 哈希、过期、撤销和最后活动时间。

### 3.2.1 EmailVerificationToken

保存用户关联、验证 Token 哈希、过期时间、使用时间和创建时间。原始 Token 只出现在邮件链接中，不进入数据库或生产日志。

### 3.3 Board

关键字段：`id`、`name`、`slug`、`description`、`icon`、`sortOrder`、`status`、`createdAt`、`updatedAt`。

板块版主关系建议使用 `BoardModerator(boardId, userId, createdAt)`，而不是把单一版主 ID 写入板块。

### 3.4 Post

关键字段：`id`、`publicId/slug`、`authorId`、`boardId`、`title`、`contentRaw`、`contentFormat`、`contentRendered`（可选缓存）、`type`、`status`、`isPinned`、`isFeatured`、`isLocked`、`publishedAt`、`createdAt`、`updatedAt`、`deletedAt`。

建议状态：`DRAFT`、`PUBLISHED`、`HIDDEN`、`DELETED`、`PENDING_REVIEW`。帖子类型是否区分讨论、问题、文章、项目和复盘待确认。

### 3.5 Comment

关键字段：`id`、`postId`、`authorId`、`parentId`、`replyToUserId`、`contentRaw`、`contentFormat`、`status`、`createdAt`、`updatedAt`、`deletedAt`。

- `parentId = null` 表示一级评论；
- UI 最多展示两层，不代表允许无约束深层树；
- 删除父评论时保留必要占位，避免破坏讨论上下文。

### 3.6 Tag / PostTag

`Tag` 关键字段：`id`、`name`、`slug`、`description`、`status`。  
`PostTag` 使用 `(postId, tagId)` 唯一约束。

标签创建权限、合并与别名机制待确认。

### 3.7 互动关系

- `PostLike(userId, postId, createdAt)`，唯一约束 `(userId, postId)`；
- `CommentLike(userId, commentId, createdAt)`，唯一约束 `(userId, commentId)`；
- `Bookmark(userId, postId, createdAt)`，唯一约束 `(userId, postId)`；
- `UserFollow(followerId, followingId, createdAt)`，唯一约束 `(followerId, followingId)`，禁止关注自己；
- `BoardFollow`、`TagFollow` 为 P1 候选关系。

### 3.8 Notification

关键字段：`id`、`recipientId`、`actorId`（可空）、`type`、`postId`（可空）、`commentId`（可空）、`payload`（最小必要快照）、`readAt`、`createdAt`。

通知类型至少覆盖帖子回复、评论回复、用户关注、系统和管理动作。删除来源对象后，通知应安全降级而非报错。

### 3.9 Report

关键字段：`id`、`reporterId`、`targetType`、`targetId`、`reason`、`details`、`status`、`assigneeId`、`resolution`、`resolvedAt`、`createdAt`。

举报对象的多态关联如何保证引用完整性需在数据库设计时确定。

### 3.10 ModerationAction

关键字段：`id`、`actorId`、`actionType`、`targetType`、`targetId`、`reason`、`beforeSnapshot`（必要字段）、`afterSnapshot`（必要字段）、`createdAt`。

审计记录应追加写入；敏感内容快照必须最小化并限制访问。

### 3.11 FileAsset

关键字段：`id`、`ownerId`、`storageKey`、`mimeType`、`size`、`width`、`height`、`status`、`createdAt`。

MVP 总范围只考虑受控图片类型。对象存储供应商、大小限制、病毒扫描和内容安全策略待确认。

## 4. 关键一致性规则

1. 点赞、收藏和关注写入必须具备数据库唯一约束；
2. 回复创建与通知投递至少保证最终一致，并可安全重试；
3. 已隐藏、已删除或未发布内容不能进入公共搜索结果；
4. 被封禁用户的既有内容如何处理待确认，不默认级联删除；
5. 所有管理动作必须能追溯到操作者与原因；
6. 帖子、评论计数必须能够从事实表重算；
7. Slug 变更不得导致历史链接不可恢复，具体策略待确认。

# Phase 4 已实现模型

正式数据库现已包含 `Post`、`Tag`、`PostTag`。字段、约束与范围以 [POST_MODEL.md](./POST_MODEL.md) 和 Prisma schema 为准。

# Phase 5 已实现模型

正式数据库新增 `Comment` 与 `Notification`。评论采用一级分页、二级归一结构和软删除占位；通知以 `recipientId/readAt/createdAt` 为事实来源。评论与对应通知在同一交互事务中创建。外键均使用显式 `Restrict` 或 `SetNull`，不因用户、帖子或评论误删互动历史。完整契约见 [COMMENT_MODEL.md](./COMMENT_MODEL.md) 与 [NOTIFICATION_MODEL.md](./NOTIFICATION_MODEL.md)。
