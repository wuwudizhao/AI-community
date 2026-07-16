# Liftoff Community UI V1

> 2026-07-14：Opportunity Home UI V1 已取代本文早期的多列 Feed 和旧分类视觉，最新首页规范见 [LIFTOFF_OPPORTUNITY_HOME_UI_V1.md](LIFTOFF_OPPORTUNITY_HOME_UI_V1.md)。本文继续记录 Community Shell、真实数据和游戏边界的历史决策。

> 历史实现基线：本文第 1–14 节记录 2026-07-13 已完成 UI，不表示 2026-07-14 新定位已经在代码中实现。后续产品方向以 [PRODUCT_VISION.md](PRODUCT_VISION.md) 为准。

## 1. 目的与参考边界

本轮将 Liftoff 首页从偏 Landing Page 的结构调整为桌面端社区工作区。布局参考文件为：

`C:\Users\N\Desktop\AI论坛UI.jpg`

参考图只用于判断固定 Header、固定 Sidebar、横向 Hero、分类栏、卡片密度和桌面比例。实现没有复制 OPC Forum 品牌、Logo、人物、帖子、用户数据、像素图块、游戏关卡或具体文案。

## 2. 保留的布局特征

- 64px 固定顶部 Header；
- 240px 固定左侧 Sidebar，1280px 档收窄为 220px；
- Header 与 Sidebar 之外的主内容独立滚动；
- 300–340px 横向大 Hero；
- Hero 下方的紧凑胶囊分类；
- 1280px 三列、1440px 及以上四列的高密度 CSS Grid；
- 低阴影、细边框、清晰的信息层级。

## 3. Header 规格

Header 固定在顶部，包含 Liftoff 原创 CSS 标识、只读搜索占位、light/dark/system 主题切换、真实通知入口、禁用的消息占位、真实发布入口与真实登录状态。搜索业务尚未实现，因此搜索框不发送请求；消息按钮明确显示为“即将开放”。

未登录用户的发布入口前往 `/login`；已登录用户前往 `/posts/new`。未读数量来自现有 `/notifications/unread-count`，不显示假通知。

## 4. Sidebar 规格

社区导航包含：首页、热门、Vibe Coding、Agent、RAG、MCP、FDE、OPC、项目展示与踩坑复盘。个人区域中，“我的发布”连接 `/posts/mine`，“我的通知”连接 `/notifications`。

尚未实现的热门、收藏、点赞、浏览历史和设置均为不可点击状态，并带有“即将开放”说明。底部发布按钮复用真实认证状态。

## 5. Hero 规格

Hero 文案使用 Liftoff 品牌：`Build. Ship. Repeat.` 和 `Welcome to Liftoff`。两个按钮只滚动到真实帖子 Feed。

像素场景全部由项目内 DOM 与 CSS 原创绘制，包含通用 Builder、Token、Bug、Agent/RAG/MCP 路标和 Liftoff Portal。它不是游戏：没有键盘控制、碰撞、分数、关卡、Canvas、Phaser 或 Three.js。仅允许 Token 浮动、Portal 呼吸、角色 idle 和鼠标 hover 微反馈，并响应 `prefers-reduced-motion`。

场景不使用问号砖块、任天堂人物、管道、旗帜、音效或受版权保护的图块。

## 6. Category Tabs 规格

分类为推荐、Vibe Coding、Agent、Cursor、Claude Code、Codex、RAG、MCP、FDE、OPC 和 Projects。分类在已加载的真实帖子标题与真实标签上做本地筛选，不新增后端接口，也不生成内容。分页仅在“推荐”分类使用。

## 7. Feed 规格

首页继续请求现有 `/posts?page=...&pageSize=12&sort=latest`。PostCard 只展示 API 已存在的标签、标题、摘要、作者、发布时间和 `commentCount`。点赞尚未实现，因此不显示点赞图标或数字；封面字段不存在，因此不伪造图片。

加载状态使用八张与最终 Grid 一致的 Skeleton；错误状态隐藏内部错误并提供重试；空数据库显示“还没有帖子”和真实发布入口。页面不会用 Mock 帖子填满 Feed。

## 8. Light / Dark 变量

| 语义     | Light     | Dark      |
| -------- | --------- | --------- |
| 页面背景 | `#F6F7F9` | `#0B0F17` |
| 卡片背景 | `#FFFFFF` | `#121821` |
| 主文字   | 中性深灰  | 浅灰白    |
| 次文字   | 中性灰    | 灰色      |
| 边框     | 浅灰      | 深灰      |
| 主色     | 克制蓝色  | 蓝紫色    |

两种主题共享同一信息架构；Hero 在浅色模式使用蓝天、白云和浅绿色地面，在深色模式使用深蓝夜空、星点、深色地面与少量 Portal 光效。没有大面积渐变、玻璃拟态或赛博朋克霓虹。

## 9. 真实数据与 Mock 禁止规则

- 首页帖子、作者、标签、时间和评论数必须来自真实 API；
- 认证状态必须来自 `AuthProvider`；
- Header 未读 Badge 必须来自通知 API；
- 不创建假用户、假帖子、假点赞、假通知或假活跃数据；
- 本地分类只能过滤已返回的真实帖子；
- API 为空、错误或加载中时必须展示对应真实状态。

## 10. Hero 游戏后续接入边界

当前 Hero 是静态互动视觉容器。只有在 Validation MVP 证明社区主链后，才可另行评估完整游戏交互。后续实现也必须保持可跳过、离开视口暂停、低性能成本、支持减少动态效果，并不得阻塞帖子浏览、发帖、认证或通知主链。

## 11. 组件边界

- `components/layout`：Header、Sidebar、Shell、Footer 与认证感知的发布入口；
- `components/hero`：Hero 文案和原创 PixelScene；
- `components/forum`：分类、真实 Feed、Grid、PostCard 与状态组件；
- `app/page.tsx`：只负责组合，不承载业务细节；
- Web 只通过现有 API 客户端消费数据，不依赖 Prisma 或 NestJS 实现。

## 12. 桌面验收尺寸

- 1280 × 800：220px Sidebar，三列 Feed；
- 1440 × 900：240px Sidebar，四列 Feed；
- 1920 × 1080：240px Sidebar，主内容最大宽度 1440px，四列 Feed。

移动端现有代码保留，本轮不新增 MobileNavigation，也不把移动端专项视觉作为阻塞项。

## 13. 帖子详情页衔接

帖子详情页复用本文件定义的固定 Header、Sidebar、主题变量、认证状态和通知 Badge，不再使用早期独立验证布局。详情页的主辅栏、标题去重、评论层级和右侧真实数据边界由 `docs/POST_DETAIL_UI_V1.md` 约束；首页 Feed 与分类逻辑没有因此修改。

## 14. Beta Closure

发帖、我的发布与通知页已复用同一 Community Shell；Sidebar 改为根据真实 pathname 高亮。未实现的搜索、热门、消息、收藏、点赞、历史和设置继续保持禁用，不建立误导性路由。统一状态与组件规则见 `docs/UI_COMPONENT_STANDARD.md`。

## 15. AI 赚钱社区 Phase A（2026-07-14）

首页已在不改变固定 Header、Sidebar、Hero、真实 Feed 与双主题结构的前提下完成第一轮定位切换：

- Hero 使用 `Find. Build. Earn. Repeat.`、发现 AI 赚钱机会和把想法变成收入的正式表达；
- Sidebar 第一层为赚钱与项目，第二层为技术实现，个人区域继续保留真实入口；
- 像素场景保留全部现有主体，路牌语义调整为 IDEA、VERIFY、EARN；
- Feed 明确按最新发布时间展示，推荐和频道筛选没有伪装为已实现；
- 真实频道尚未接入，因此对应 Sidebar 与 Tabs 均保持 disabled/待开放；
- Header、发布页、EmptyState、Footer 与详情侧栏提示已同步新定位；
- API、Prisma、数据库、认证、帖子、评论和通知契约没有变化。

下一阶段使用现有 Tag 建立 `/channels/[channel]` 真实频道和服务器分页筛选；在该阶段完成前不得通过本地当前页筛选冒充完整频道。
