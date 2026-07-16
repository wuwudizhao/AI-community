# Liftoff UI Baseline

> 2026-07-14 定位说明：本文前述章节保留历史 Phase 2 / Community UI 实施事实。下一版 UI 的产品信息层级以 [PRODUCT_VISION.md](PRODUCT_VISION.md) 为准，当前代码尚未调整。

## 1. 目标

Phase 2 UI 用于验证社区首页的信息结构、主题和响应式体验，不代表认证、帖子、评论或搜索功能已经可用。

## 2. 首页结构

```text
Header
├── Liftoff Logo
├── 搜索占位入口
├── 主题切换
├── 登录
└── 注册

Page Shell
├── Sidebar / Mobile Navigation
└── Main
    ├── Static Hero
    ├── Category Tabs
    └── Mock Post Feed
```

## 3. 视觉原则

- 浅色主题是主要视觉基线；
- 深色主题保持相同信息架构与对比层级；
- 使用中性背景、白色/深色表面、细边框和单一蓝色主操作色；
- 不使用赛博朋克、复杂渐变、高成本动画或游戏视觉；
- 通过间距、字重、边框和少量色彩区分信息层级；
- 截图效果不能优先于语义、响应式和组件可维护性。

## 4. 主题系统

- 支持 `light`、`dark`、`system` 三种偏好；
- 偏好保存在 `localStorage` 的 `liftoff-theme`；
- `system` 根据 `prefers-color-scheme` 解析实际主题；
- 系统主题变化时，选择 `system` 的页面同步更新；
- 页面加载前执行短小初始化脚本，减少错误主题闪烁；
- 主题通过根元素的 `data-theme` 属性和 CSS 变量实现。

## 5. 响应式基线

- **桌面端：**完整顶部栏、220px 左侧导航、两列帖子卡片；
- **平板端：**左侧导航收缩为图标栏，内容保持完整；
- **移动端：**隐藏侧栏，使用固定底部导航，帖子改为单列，Hero 上下排列；
- 横向分类允许触摸滚动；
- 主要按钮在窄屏改为整行宽度。

## 6. 内容真实性

Phase 2 帖子只来自本地 Mock 数据。每张卡片必须显示“官方示例 · Mock”，信息流顶部必须说明内容不代表真实用户或真实讨论。禁止用拟造用户身份制造社区活跃感。

## 7. 交互边界

- 搜索输入在 Phase 2 禁用并显示“即将开放”；
- 登录和注册指向页面内 Phase 3 说明，不伪装为已实现；
- 发布帖子指向 Phase 4 说明，不发送写请求；
- 分类标签只呈现信息架构，不执行真实筛选；
- 本轮没有 API 数据请求、认证状态或论坛业务操作。

## 8. 可访问性基线

- 使用语义化 `header`、`nav`、`main`、`section` 和 `article`；
- 图标按钮提供可读标签和 `aria-pressed` 状态；
- 主题、分类和导航可通过键盘访问；
- 支持 `prefers-reduced-motion`；
- 文本与交互元素应保持明显的前景/背景对比。

## 9. Community UI V1 更新（2026-07-13）

首页正式切换为桌面社区工作区基线：64px 固定 Header、220–240px 固定 Sidebar、300–340px 原创静态像素 Hero、紧凑分类栏与真实 API Feed。此前 Phase 2 的 Mock 卡片已从首页主链移除；当前空数据、错误与加载状态均如实展示。

1440px 与更宽视口采用四列 Grid，1280px 采用三列。Light/Dark/System 主题继续使用既有 `liftoff-theme` 偏好，不改变主题持久化机制。完整规范见 `docs/LIFTOFF_COMMUNITY_UI_V1.md`。

## 10. Post Detail UI V1 更新（2026-07-13）

`/posts/[slug]` 复用首页固定 Header、Sidebar、主题、真实认证与通知入口。详情内容采用最大 1240px 的主栏 + 300px 辅助栏，主栏依次展示真实标签、唯一标题、作者、Markdown 正文和真实评论。辅助栏只展示现有 API 字段和静态社区规则，不显示点赞、收藏、浏览量、等级或粉丝等未实现数据。完整规则见 `docs/POST_DETAIL_UI_V1.md`。

## 11. Beta Closure 更新（2026-07-13）

`/posts/new`、`/posts/mine`、`/notifications` 已统一使用 Community Shell；登录、注册与邮箱验证继续使用 Auth Shell；404 与 Error Boundary 使用品牌化 System State。状态、Token、表单和禁用入口规范见 `docs/UI_COMPONENT_STANDARD.md`，正式路由边界见 `docs/ROUTE_STATUS_MATRIX.md`。

## 12. 产品定位更新（2026-07-14）

后续 UI 不再以技术论坛为首页中心。视觉组件保持不变的前提下，信息层级应优先表达发现赚钱机会、项目验证、项目拆解、获客变现、收入案例、失败复盘和一人公司；Vibe Coding、Agent、RAG、MCP 与 FDE 降为第二层。该更新仅为文档基线，未授权修改现有 UI。

## 13. Phase A 实施结果（2026-07-14）

定位切换已经应用到现有 Web UI，原布局、尺寸、主题、像素主体和真实业务状态保持不变。默认 Feed 明确为“最新”；推荐及尚未接入服务器查询的频道入口保持 disabled。Phase A 不包含真实频道、PostType、商业结构化字段、外部内容导入或游戏逻辑。

## 14. Opportunity Home UI V1（2026-07-14）

本版本取代第 9 节中多列 Grid 的首页视觉基线。1280、1440 和 1920 桌面宽度统一采用全宽单列帖子行；Hero 下新增六个等宽快捷入口，未实现频道明确 disabled 且不显示虚假统计。Light 与 Dark 使用同一组件树及独立主题变量，像素元素只用于 Logo、Hero、快捷入口图标和帖子视觉容器。完整规范见 [LIFTOFF_OPPORTUNITY_HOME_UI_V1.md](LIFTOFF_OPPORTUNITY_HOME_UI_V1.md)。

## 15. Opportunity Home UI V2（2026-07-14）

产品负责人已授权将提供的浅色、深色参考图裁切为首页 Hero 与火箭图标的视觉资源。首页仍复用相同的 Header、Sidebar、认证、通知、真实帖子 Feed 和主题组件树；该更新只提高视觉对齐度，不改变 API、数据库或论坛业务主链。完整边界见 `docs/LIFTOFF_OPPORTUNITY_HOME_UI_V2.md`。
