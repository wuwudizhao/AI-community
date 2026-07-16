# Liftoff Production Deployment

This runbook covers the supported production topology:

- Web: Vercel at `https://woyaoqifei.club`
- API: Railway at `https://api.woyaoqifei.club`
- Database: Railway PostgreSQL
- Post images: Railway Volume

Do not store secrets in the repository. Configure them in the relevant platform dashboard.

## Vercel Web

Set the Vercel project **Root Directory** to `apps/web`.

Configure these environment variables for Production:

```dotenv
NEXT_PUBLIC_SITE_URL=https://woyaoqifei.club
NEXT_PUBLIC_API_URL=https://api.woyaoqifei.club/api
ALLOW_GUEST_POSTING=true
```

`NEXT_PUBLIC_SITE_URL` is an origin without a trailing slash. `NEXT_PUBLIC_API_URL` must include the `/api` path and must not have a trailing slash. Production builds fail explicitly when either public URL is missing.

## Railway API

Set the Railway service root to the repository root.

Build Command:

```sh
corepack pnpm --filter @liftoff/api exec prisma generate && corepack pnpm --filter @liftoff/api build
```

Pre-Deploy Command:

```sh
corepack pnpm --filter @liftoff/api exec prisma migrate deploy
```

Start Command:

```sh
corepack pnpm --filter @liftoff/api start
```

Health Check:

```text
/api/health
```

Railway supplies `PORT`; the API prefers it over the local `API_PORT` fallback and listens on `0.0.0.0`.

Configure these production variables:

```dotenv
NODE_ENV=production
DATABASE_URL=<Railway PostgreSQL connection URL>
API_PUBLIC_URL=https://api.woyaoqifei.club
WEB_ORIGIN=https://woyaoqifei.club
WEB_BASE_URL=https://woyaoqifei.club
POST_IMAGE_STORAGE_DIR=/data/post-images
MAIL_PROVIDER=resend
MAIL_API_KEY=<secret>
MAIL_FROM_ADDRESS=<verified sender address>
MAIL_FROM_NAME=Liftoff
```

`API_PUBLIC_URL`, `WEB_ORIGIN`, and `WEB_BASE_URL` are origins without trailing slashes. `API_PUBLIC_URL` does not include `/api`. `DATABASE_URL` accepts Railway PostgreSQL URLs using either the `postgresql://` or `postgres://` protocol.

## Cookie and CORS

The API allows the exact `WEB_ORIGIN` only and enables credentialed requests. The web client sends `credentials: 'include'` for API requests.

Session cookies remain `HttpOnly`, use `Secure` in production, use `SameSite=Lax`, and use `Path=/`. No cookie `Domain` is configured. Keep the web and API custom domains under `woyaoqifei.club`; do not change the cookie to `SameSite=None` for this deployment.

## Railway Volume

Attach a Railway Volume to the API service with:

```text
Mount Path: /data
POST_IMAGE_STORAGE_DIR=/data/post-images
```

The API creates the post-image directory when it starts if it does not exist. Public image URLs are generated from `API_PUBLIC_URL`; do not configure a local Windows path in production.

## Deployment Order

1. Create Railway PostgreSQL and attach it to the API service.
2. Attach the Railway Volume at `/data`.
3. Configure all Railway API variables and the custom API domain.
4. Deploy the API. Let the pre-deploy command apply migrations, then verify `/api/health`.
5. Configure the Vercel variables and web custom domain.
6. Deploy the web application.
7. Verify browser requests target `https://api.woyaoqifei.club/api`, carry credentials, and are accepted only from `https://woyaoqifei.club`.

The migration command is intentionally separate from the build and start commands. `prisma migrate deploy` applies existing migrations and does not create development migrations.
