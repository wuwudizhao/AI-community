# Liftoff Opportunity Home UI V1

## 1. 目标与参考

本轮以以下两张最终参考图为视觉方向：

- `C:\Users\N\Desktop\论坛UI 1.0.jpg`：浅色像素风首页；
- `C:\Users\N\Desktop\论坛UI 2.0.jpg`：深色像素风首页。

只参考页面结构、比例、密度和主题氛围，不复制参考图中的帖子、用户、数字、人物或图块。Liftoff 继续使用项目内原创 DOM/CSS 像素元素和真实 API 数据。

## 2. 页面结构

```text
Fixed Header
├── Liftoff pixel rocket
├── read-only search placeholder
└── theme / notification / publish / auth

Fixed Sidebar
├── 赚钱与项目
├── 技术实现
├── 个人空间
└── 发布帖子

Main
├── Pixel Hero
├── Opportunity Shortcuts
└── Feed Surface
    ├── Tabs
    ├── Latest heading
    └── Full-width post rows / loading / error / empty
```

首页没有右侧 Sidebar、独立小游戏卡片、榜单、Dashboard 或商业属性面板。

## 3. Header 与 Sidebar

Header 保留真实认证、通知未读数、发布入口与三态主题。搜索框只作为只读占位，文案为“搜索赚钱机会、项目、工具、用户…”，不发送搜索请求。

Sidebar 第一层为赚钱与项目，第二层为技术实现；我的发布和我的通知继续使用真实路由。未实现栏目为不可点击状态并显示“整理中”，不把多个入口指向同一个锚点。

## 4. Pixel Hero

Hero 标题为“发现 AI 赚钱机会，把想法变成收入”，机会使用紫色或金币黄，收入使用粉红色。场景包含原创像素火箭 Logo、Builder、金币、树木、云朵、日月、草地、土地方块、原创绿色机会数据方块、IDEA 路牌、Bug 和 Liftoff Portal。

绿色机会数据方块只使用通用问号语义，不使用任天堂黄色问号砖块、人物、管道、旗帜、地图、音效或第三方素材。Hero 仍是静态 DOM/CSS 场景，只有金币浮动、Portal 呼吸、角色 idle 和 hover 反馈；没有跑跳、碰撞、键盘控制、分数、Canvas 或游戏引擎。

## 5. 快捷入口与 Tabs

Hero 下方显示六个等宽快捷入口：最新、赚钱机会、副业项目、收入案例、项目拆解和技术讨论。只有“最新”连接当前真实 Feed，其余显示“整理中”。没有真实统计时不显示讨论数量。

Feed Tabs 为：最新、赚钱机会、收入案例、项目拆解、失败复盘和技术讨论。推荐已移除；只有最新可用，其余在真实服务器筛选上线前保持 disabled。

## 6. Feed 与真实数据边界

首页继续请求 `/posts?page=...&pageSize=12&sort=latest`。每条帖子占满 Feed 主区域宽度，只展示：

- 主题色视觉容器；
- 真实 Tag；
- 标题和 excerpt；
- 作者；
- 发布时间；
- 真实 `commentCount`。

不得显示假点赞、浏览量、收入、成本、机会评分、增长趋势、验证状态或可复制性。数据库为空时展示真实 Empty State；加载和错误状态与正式列表使用同一单列结构。

## 7. 主题

Light 使用暖白页面、白色 Surface、浅灰紫边框、浅蓝天空、绿色草地和棕色土地。Dark 使用深蓝黑页面、深蓝灰 Surface、低对比蓝紫边框、深紫夜空、月亮和克制 Portal 蓝光。

Light、Dark、System 共享完全相同的 DOM 和组件。主题偏好继续保存在 `liftoff-theme`，根布局中的初始化脚本在 React 加载前应用主题，以降低首次加载闪烁。

## 8. 桌面验收

正式桌面尺寸：1280 × 800、1440 × 900、1920 × 1080。Header 和 Sidebar 固定；主内容最大宽度受控；Hero 不溢出；快捷入口保持单行；Feed 使用完整宽度。

截图输出目录：`artifacts/opportunity-home-ui-v1/`。

## 9. 未修改范围

本轮不修改 NestJS API、Prisma、migration、数据库、Session、Cookie、Post/Comment/Notification 模型、发帖契约、权限、帖子详情、评论或通知逻辑，也不实现频道、搜索、推荐、PostType 或小游戏。
