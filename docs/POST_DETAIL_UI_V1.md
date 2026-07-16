# Liftoff Post Detail UI V1

## 1. 目的与参考边界

帖子详情页从早期功能验证页升级为 Community UI V1 的正式桌面页面。需求中记录的参考路径为 `/mnt/data/a_clean_desktop_web_ui_screenshot_of_a_forum_artic.png`；本轮只采用其文字说明所定义的信息架构、主辅栏比例、评论层级、卡片密度和视觉节奏，不复制品牌、头像、帖子内容、图标或任何互动统计。

## 2. 信息架构

页面复用首页的 64px 固定 `ForumHeader`、220–240px 固定 `ForumSidebar`、`ThemeSwitcher`、`AuthProvider`、真实未读通知 Badge 和认证感知发布入口。

桌面内容容器最大宽度 1240px，采用 `minmax(0, 1fr) + 300px` 双栏和 24px 栏间距。1280px 基线将右栏收紧至 280px、间距 20px；页面使用浏览器主滚动，不建立独立正文滚动区。

主栏顺序为：返回最新讨论、真实标签、唯一页面标题、真实作者和发布时间、Markdown 正文、真实评论区。右栏包含帖子信息、作者、静态社区提示和真实路由操作。

## 3. 标题去重策略

页面标题只由 `post.title` 渲染，正文只来自 `post.contentMarkdown`。历史内容如第一个非空行是一级 Markdown 标题，且其规范化文本与 `post.title` 完全相同，展示层删除该行和紧随其后的一个空行。其他一级标题、后续同名标题、格式不完全一致的标题均保留。

该规则不使用 CSS 隐藏，不修改 API 契约，不改写数据库或历史正文。规则由 `dedupeLeadingTitleHeading` 实现并有组件测试覆盖。

## 4. 正文与安全边界

正文继续复用 `MarkdownContent`、`react-markdown` 和 `remark-gfm`，保持 `skipHtml`，不执行 raw HTML。页面统一标题、段落、列表、引用、代码、表格和链接样式，正文最大阅读宽度 760px，行高约 1.78。

## 5. 评论 UI

评论仍请求现有真实 Comments API，并保留：

- 登录态输入与未登录登录引导；
- 发布失败保留输入；
- 发布中按钮禁用；
- 一级评论、归一化二级回复和 `replyToUser`；
- 真实删除权限和删除占位；
- `comment-{id}` 锚点及 `is-targeted` 高亮；
- 分页、加载 Skeleton、空状态和可重试错误状态。

展示层明确只生成两层评论结构，不生成第三级 UI。未实现点赞、图片、@ 工具栏或富文本上传。

## 6. 右侧栏真实数据边界

帖子信息只展示 API 已有的发布时间、真实更新时间、`commentCount` 和标签数量。作者卡只展示真实 `displayName`、`username`、首字母头像和存在时的 `bio`。

不展示浏览量、点赞、收藏、分享、作者等级、粉丝、作者内容统计或关注按钮，也不为这些数据新增接口。相关操作只使用 `/`、`/posts/new`、`/posts/mine` 和 `/notifications` 真实路由。

## 7. 主题与视觉

Light 使用 `#F6F7F9` 附近页面背景和白色表面；Dark 使用 `#0B0F17` 附近背景和 `#121821` 附近表面。两种主题共享同一结构，主要依靠边框、间距和轻微背景层级，不使用重阴影、玻璃拟态、赛博朋克或霓虹效果。

## 8. 未实现能力

本轮不新增点赞、收藏、关注、浏览量、作者等级、粉丝统计、相关推荐、举报、搜索、Hero 游戏或 Mock 数据，也不修改后端、Prisma、migration、Session、帖子、评论或通知契约。

## 9. 桌面验收尺寸

- 1280 × 800：220px Sidebar，主栏与 280px 辅助栏；
- 1440 × 900：240px Sidebar，主栏约 828px、辅助栏 300px；
- 1920 × 1080：内容最大 1240px，维持主辅栏阅读比例。

移动端保留现有行为，本轮不新增专项组件。

## 10. Beta Closure

详情页结构、真实数据与评论主链本轮无业务改动，并作为 Community Shell 回归基线保留。发布准备状态与数据库、邮件阻塞分别记录在 `docs/RELEASE_READINESS.md` 和 `docs/BETA_CLOSURE_REPORT.md`。
