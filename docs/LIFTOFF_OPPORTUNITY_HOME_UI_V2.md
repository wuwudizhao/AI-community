# Liftoff Opportunity Home UI V2

日期：2026-07-14

## 目的

在不改变论坛业务主链的前提下，将首页的桌面端视觉与用户提供的浅色、深色参考图直接对齐。

## 参考素材与授权边界

本版本按产品负责人明确授权，直接使用其提供的两张参考图中的视觉素材作为首页 Hero 和品牌火箭图标来源：

- 浅色 Hero：`apps/web/public/images/hero/liftoff-hero-reference-light.png`
- 深色 Hero：`apps/web/public/images/hero/liftoff-hero-reference-dark.png`
- 浅色火箭图标：`apps/web/public/images/brand/liftoff-rocket-reference-light.png`
- 深色火箭图标：`apps/web/public/images/brand/liftoff-rocket-reference-dark.png`

这些资源仅用于当前 Liftoff 本地项目。它们随现有 Light / Dark 主题切换，不复制出第二套页面组件。

## 实现

- Header 高度为 80px，Sidebar 从 Header 下方固定开始。
- 首页主内容在宽屏最大为 1280px，避免在 1920px 视口无限拉宽。
- Hero 使用对应主题的参考裁切图，保持图中标题、按钮与像素场景的比例；DOM 内仍保留可访问的标题、说明和两个真实链接。
- Hero 的“发现赚钱机会”可点击区域连接首个真实频道 `/opportunities`；“发布项目想法”继续连接现有 `/posts/new`，未引入游戏逻辑。
- Sidebar 继续保留真实的首页、我的发布和我的通知路由；未实现频道仍是不可点击状态，但视觉不再在每行重复显示“整理中”。
- Feed 继续请求真实 `/api/posts`，数据库为空时保留真实 Empty State，不填充示例帖子或互动数据。

## 不变的业务边界

本版本没有修改 NestJS API、Prisma、migration、Post/Comment/Notification 数据模型、Session、Cookie、认证、发帖契约、评论或通知逻辑。

没有新增搜索、推荐、赚钱机会频道、PostType、商业字段、假收入、假成本、假点赞、假用户或游戏状态。

## 验收基线

- 浅色 / 深色 / 跟随系统共用一套页面结构。
- Hero 与 Logo 使用对应参考素材；主题切换后立即切换视觉资源。
- Header、Sidebar、快捷入口、Tabs 和真实 Feed 维持同一内容栅格。
- 目标桌面尺寸：1280×800、1440×900、1920×1080。
