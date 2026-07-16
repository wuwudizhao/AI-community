# Liftoff UI 组件标准

## 页面 Shell

- 社区业务页统一使用 `ForumHeader + ForumShell + ForumSidebar`。
- 登录、注册、验证邮箱统一使用 `AuthShell`。
- 404 与全局错误页使用品牌化 `route-state`，提供主题切换、重试或返回首页。
- 组件不得自行复制 Header、Sidebar、主题或认证状态逻辑。

## 页面状态

- Loading：使用与最终布局同尺寸的 Skeleton，或短时 `community-status-card`。
- Empty：使用 `EmptyState`，说明当前没有真实数据，并给出可执行动作。
- Error：使用 `community-error-state`，不暴露 API 内部错误，并提供重试。
- Disabled：未实现功能使用 `aria-disabled="true"` 与“即将开放”，不得渲染成可用链接。
- Success：写操作成功后优先跳转到真实结果页；留在原页时使用明确的内联反馈。

## 视觉 Token

主题使用 `globals.css` 的语义变量：`background`、`surface/card`、`foreground`、`muted`、`border`、`primary`、`ring`、`destructive`。Light、Dark、System 共享同一信息架构，不在组件内硬编码主题背景。

## 表单与真实性

输入焦点使用统一 `ring`，提交中禁用按钮。页面只展示真实 API 字段；未实现的点赞、收藏、关注、浏览量、搜索、消息与排名不得展示虚假数字或可用状态。
