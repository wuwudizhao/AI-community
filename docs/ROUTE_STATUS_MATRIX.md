# Liftoff 路由状态矩阵

| 路由                    | 状态             | Shell     | 数据与权限                          |
| ----------------------- | ---------------- | --------- | ----------------------------------- |
| `/`                     | 已实现           | Community | 公开；真实帖子 Feed、认证与通知状态 |
| `/posts/[slug]`         | 已实现           | Community | 公开；真实帖子、评论与二级回复      |
| `/posts/new`            | 已实现           | Community | 登录后发布；未登录跳转 `/login`     |
| `/posts/mine`           | 已实现           | Community | 登录后读取当前用户真实发布          |
| `/notifications`        | 已实现           | Community | 登录后读取真实站内通知              |
| `/login`                | 已实现           | Auth      | 公开；PostgreSQL Session 登录       |
| `/register`             | 已实现但上线受阻 | Auth      | 公开；正式邮件在线投递未验收        |
| `/verify-email`         | 已实现但上线受阻 | Auth      | 公开；依赖有效验证 Token            |
| `/verify-email/pending` | 已实现但上线受阻 | Auth      | 公开；依赖邮件服务                  |
| `/_not-found`           | 已实现           | System    | 品牌化 404                          |
| 全局 Error Boundary     | 已实现           | System    | 重试与返回首页                      |

热门、搜索、消息、收藏、点赞、浏览历史与设置尚未实现。Header/Sidebar 中只保留禁用占位或“即将开放”，不对应正式路由。
