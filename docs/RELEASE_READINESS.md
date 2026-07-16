# Liftoff Release Readiness

## 当前结论

**状态：PARTIAL / Not ready for public Beta**。

Web 社区主链、帖子、评论与通知已经具备 Beta 基础；本地 PostgreSQL 在线验收已通过，正式邮箱在线投递仍是发布阻塞。

## 阶段状态

- Phase 1：PASS
- Phase 2：PASS
- Phase 3：PARTIAL（Resend 真实投递、收件、点击闭环未验收）
- Phase 4：PASS
- Phase 5：PASS

## 发布前阻塞

1. 配置真实 `MAIL_API_KEY`、已验证发件域名和受控收件邮箱，完成 Phase 3B 在线验收。
2. 为生产 PostgreSQL 选择托管方案，并完成备份与恢复检查。
3. 为生产 Web/API 注入真实环境变量并验证 CORS、Cookie Secure/SameSite 与 HTTPS。
4. 完成部署后的健康检查、日志与基础告警。

## 本地启动与生产式验证

```powershell
docker compose up -d postgres
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm dev:api
corepack pnpm dev:web
```

生产式 Web 验证必须先停止旧 Web，再执行 `corepack pnpm build`，最后执行 `corepack pnpm --filter @liftoff/web start`，避免旧进程继续提供过期产物。

API E2E、`db:validate` 与 `prisma migrate status` 必须在 PostgreSQL 在线时通过。浏览器控制台错误应为 0，且不允许 Mock 用户、帖子或互动数据进入发布包。
