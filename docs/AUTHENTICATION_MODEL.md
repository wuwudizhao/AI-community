# Liftoff Authentication Model

## 1. 认证方案

Phase 3 采用 NestJS 管理的 PostgreSQL 服务端 Session。浏览器只持有随机 Session Secret 的 HttpOnly Cookie；数据库只保存其 SHA-256 哈希。当前不使用 JWT、Refresh Token、Redis 或 localStorage Token。

选择理由：Liftoff 当前只有一个 Web 客户端，服务端 Session 边界更清晰、撤销直接、API 重启后仍能保持状态，也避免双 Token 轮换复杂度。若未来出现移动端或第三方 API，再重新评估 Token 方案。

## 2. 注册流程

```text
DTO 校验 → 邮箱标准化 → Argon2id 密码哈希
→ 创建 PENDING_VERIFICATION 用户
→ 创建随机验证 Token，仅保存 SHA-256 哈希
→ MailService 发送验证链接
```

邮箱和用户名由数据库唯一约束保证。响应不包含密码哈希。

## 3. 邮箱验证流程

验证链接包含一次性随机 Token。API 哈希 Token 后查库，检查存在、未使用和未过期，再在事务中标记 Token 已使用、写入 `emailVerifiedAt` 并将用户状态改为 `ACTIVE`。

开发环境使用 `DevelopmentMailService`，只在开发响应中返回 `developmentPreviewUrl`，不写普通日志。生产环境必须替换为正式邮件提供商；未配置时明确失败。测试环境使用受控开发/Fake 行为。

## 4. 登录流程

```text
标准化邮箱 → 统一凭据检查 → 检查邮箱验证和用户状态
→ 创建随机 Session Secret → 数据库保存哈希与过期时间
→ HttpOnly Cookie 返回浏览器 → 更新 lastLoginAt
```

不存在邮箱和密码错误使用同一错误信息，避免账号枚举。

## 5. Cookie 与 Session 模型

- Cookie 名：`AUTH_COOKIE_NAME`，默认 `liftoff_session`；
- `HttpOnly: true`；
- `SameSite: Lax`；
- 生产环境 `Secure: true`；
- `Path: /`；
- 默认有效期 168 小时；
- 数据库存储 `tokenHash`、`expiresAt`、`revokedAt` 和 `lastSeenAt`；
- API CORS 只允许配置的 `WEB_ORIGIN`，并启用 credentials。

## 6. Session 撤销

退出时使用 Cookie Secret 的哈希查找 Session，写入 `revokedAt` 并清除 Cookie。`/auth/me` 拒绝不存在、过期、已撤销的 Session，以及被暂停或封禁的用户。Session 存在 PostgreSQL，因此 API 重启不会自动丢失。

## 7. 用户状态

- `PENDING_VERIFICATION`：只能完成邮箱验证，不能登录；
- `ACTIVE`：允许登录；
- `SUSPENDED`：拒绝登录和已有 Session；
- `BANNED`：拒绝登录和已有 Session。

角色为 `USER`、`MODERATOR`、`ADMIN`。Phase 3 不实现复杂授权。

## 8. 数据模型

- `User`：邮箱、标准化邮箱、密码哈希、用户名、显示名、角色、状态及验证/登录时间；
- `EmailVerificationToken`：用户、Token 哈希、过期和使用时间；
- `UserSession`：用户、Session 哈希、过期、撤销和最后活动时间。

原始验证 Token 和 Session Secret 均不入库。

## 9. 安全边界

- Argon2id 密码哈希；
- 随机 256-bit Secret；
- DTO 长度、格式和密码强度校验；
- 注册、登录、验证和重发接口限流；
- 统一登录失败；
- 不记录密码、Token 或 Cookie；
- API 从 Session 推导用户身份，不接收前端用户 ID；
- Cookie 不可被前端脚本读取；
- 生产邮件未配置时不静默降级。

## 10. 环境变量

- `DATABASE_URL`
- `WEB_ORIGIN`
- `WEB_BASE_URL`
- `AUTH_COOKIE_NAME`
- `SESSION_TTL_HOURS`
- `EMAIL_VERIFICATION_TTL_MINUTES`
- `NODE_ENV`

## 11. 错误策略

- DTO 错误：400；
- 邮箱或用户名冲突：409；
- 凭据失败：401，统一文本；
- 未验证、暂停或封禁：403；
- Token 无效、已使用或过期：400；
- 未登录 `/me`：401；
- 生产邮件未配置：503。

## 12. 测试策略

- 单元测试密码、Secret、标准化和状态规则；
- API E2E 使用真实 PostgreSQL，覆盖注册、重复、验证、登录、`/me`、退出和状态限制；
- Web 测试表单错误、验证状态、待验证页和 Header 身份状态；
- 手工闭环使用开发邮件预览完成真实注册到退出。

2026-07-13 实测结果：注册 201、未验证登录 403、验证 201、登录 200、API 重启前后 `/me` 均为 200、退出 200、退出后 `/me` 为 401；Swagger 与健康检查均为 200。验收账号已清理。正式邮件投递仍待邮件提供商接入后验证。

## 13. 当前未实现

忘记/重置/修改密码、第三方 OAuth、手机号、头像上传、2FA、设备管理、全 Session 管理和复杂权限均未实现。

# Phase 3B 正式邮件设计（2026-07-13）

正式提供商选择 Resend，通过 HTTPS `POST /emails` 接入，不在 AuthService 中使用提供商 SDK。生产环境必须配置 `MAIL_PROVIDER=resend`、`MAIL_API_KEY`、`MAIL_FROM_ADDRESS`、`MAIL_FROM_NAME` 和 `MAIL_TIMEOUT_MS`；配置缺失时应用启动失败，不降级到开发预览。

验证邮件同时发送 HTML 与纯文本，发件人名称为 Liftoff。每个验证 URL 的 SHA-256 摘要形成 Resend Idempotency-Key，原始 Token 不进入该键、普通日志或数据库。

首次发送失败时用户记录保持 `PENDING_VERIFICATION`，前端应引导调用 resend。重复注册返回冲突并提示使用重发。重发会在事务中把该用户全部未使用旧 Token 标记为已使用，再创建一个新 Token；发送失败后可再次安全重发。已验证用户重发返回不泄露账号状态的通用响应。

Resend 的 429 映射为明确限流响应，5xx/网络/超时映射为 503，地址或域名拒绝映射为可执行的 422。正式在线收件验收尚未执行，因此 Phase 3 仍为 PARTIAL。
