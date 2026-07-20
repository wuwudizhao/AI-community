# 帖子互动模型

## 范围

本阶段提供登录用户的帖子点赞、私人收藏和私人浏览历史。暂不提供点赞通知、公开收藏、公开浏览量、收藏夹或推荐权重。

## 数据模型

- `PostLike`：用户与帖子的唯一关系，帖子或用户删除时级联清理。
- `PostBookmark`：私人收藏关系，以 `createdAt` 倒序分页。
- `PostViewHistory`：用户与帖子的唯一关系；重复打开更新 `lastViewedAt` 并递增个人 `viewCount`。

个人浏览次数不等于帖子公开浏览量，当前不会对外展示，也不统计未登录访客。

## API

所有写入和私人列表接口均要求有效 Session：

- `PUT /api/posts/:slug/like`
- `DELETE /api/posts/:slug/like`
- `PUT /api/posts/:slug/bookmark`
- `DELETE /api/posts/:slug/bookmark`
- `GET /api/posts/bookmarks?page=1&pageSize=20`
- `POST /api/posts/:slug/view-history`
- `GET /api/posts/history?page=1&pageSize=20`
- `DELETE /api/posts/history/:postId`
- `DELETE /api/posts/history`

点赞和收藏使用显式目标状态接口，而不是非幂等 toggle 接口。数据库唯一约束防止重复记录；前端请求期间锁定同一按钮，并在请求失败时回滚乐观状态。

公开帖子列表和详情增加真实 `likeCount`。登录请求还会返回当前用户的 `viewerHasLiked`；详情额外返回 `viewerHasBookmarked`。收藏数量不公开。

## 浏览记录边界

详情数据成功返回并在浏览器中渲染后，客户端才会上报浏览记录。列表曝光、Next.js 预加载、匿名访问、404、草稿和无权限内容不会创建历史记录。

## 页面

- `/me/bookmarks`：当前用户的收藏，按收藏时间倒序分页。
- `/me/history`：当前用户的浏览历史，按最后浏览时间倒序分页，支持删除单条和二次确认后清空全部。

不可见或已删除帖子不会返回给普通用户；硬删除帖子时关系记录由数据库级联清理。
