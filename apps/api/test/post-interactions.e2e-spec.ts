/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { hashSecret } from '../src/auth/auth.crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanTestUsers } from './e2e-cleanup';

describe('Post interactions (e2e, PostgreSQL)', () => {
  const email = 'e2e-post-interactions@example.test';
  const protectedEmail = 'e2e-post-interactions-protected@example.test';
  const secret = 'post-interactions-session-secret-long-enough';
  let app: Awaited<ReturnType<typeof createApp>>;
  let prisma: PrismaService;
  let cookie: string;
  let slug: string;
  let postId: string;

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: 'test',
      API_PORT: '4000',
      WEB_ORIGIN: 'http://localhost:3000',
      WEB_BASE_URL: 'http://localhost:3000',
      AUTH_COOKIE_NAME: 'liftoff_session',
      SESSION_TTL_HOURS: '168',
      EMAIL_VERIFICATION_TTL_MINUTES: '60',
    });
    app = await createApp();
    prisma = app.get(PrismaService);
    await cleanTestUsers(prisma, [email]);
    const user = await prisma.user.create({
      data: {
        email,
        emailNormalized: email,
        username: 'e2epostinteractions',
        displayName: 'Interaction Tester',
        passwordHash: 'not-used',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: hashSecret(secret),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    cookie = `liftoff_session=${secret}`;
    const created = await request(app.getHttpServer())
      .post('/api/posts')
      .set('Cookie', cookie)
      .send({
        category: 'MONEY_OPPORTUNITY',
        contentMarkdown: 'E2E 帖子互动测试\n\n仅供自动化测试。',
        tags: ['e2e-interactions'],
      })
      .expect(201);
    slug = created.body.slug as string;
    postId = created.body.id as string;
  });

  afterAll(async () => {
    await cleanTestUsers(prisma, [email]);
    await app.close();
  });

  it('requires authentication for private interactions', async () => {
    await request(app.getHttpServer()).put(`/api/posts/${slug}/like`).expect(401);
    await request(app.getHttpServer()).put(`/api/posts/${slug}/bookmark`).expect(401);
    await request(app.getHttpServer()).post(`/api/posts/${slug}/view-history`).expect(401);
    await request(app.getHttpServer()).get('/api/posts/bookmarks').expect(401);
    await request(app.getHttpServer()).get('/api/posts/history').expect(401);
  });

  it('likes idempotently and exposes real count and viewer state', async () => {
    await request(app.getHttpServer())
      .put(`/api/posts/${slug}/like`)
      .set('Cookie', cookie)
      .expect(200)
      .expect({ liked: true, likeCount: 1 });
    await request(app.getHttpServer())
      .put(`/api/posts/${slug}/like`)
      .set('Cookie', cookie)
      .expect(200)
      .expect({ liked: true, likeCount: 1 });
    expect(await prisma.postLike.count({ where: { postId } })).toBe(1);
    const detail = await request(app.getHttpServer())
      .get(`/api/posts/${slug}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(detail.body).toMatchObject({ likeCount: 1, viewerHasLiked: true });
    const list = await request(app.getHttpServer())
      .get('/api/posts?pageSize=50')
      .set('Cookie', cookie)
      .expect(200);
    expect(list.body.items.find((item: { id: string }) => item.id === postId)).toMatchObject({
      likeCount: 1,
      viewerHasLiked: true,
    });
    await request(app.getHttpServer())
      .delete(`/api/posts/${slug}/like`)
      .set('Cookie', cookie)
      .expect(200)
      .expect({ liked: false, likeCount: 0 });
  });

  it('bookmarks idempotently and lists only visible posts by bookmark time', async () => {
    await request(app.getHttpServer())
      .put(`/api/posts/${slug}/bookmark`)
      .set('Cookie', cookie)
      .expect(200)
      .expect({ bookmarked: true });
    await request(app.getHttpServer())
      .put(`/api/posts/${slug}/bookmark`)
      .set('Cookie', cookie)
      .expect(200);
    expect(await prisma.postBookmark.count({ where: { postId } })).toBe(1);
    const page = await request(app.getHttpServer())
      .get('/api/posts/bookmarks?page=1&pageSize=20')
      .set('Cookie', cookie)
      .expect(200);
    expect(page.body.pagination.totalItems).toBe(1);
    expect(page.body.items[0]).toMatchObject({ id: postId, slug });
    expect(page.body.items[0].bookmarkedAt).toEqual(expect.any(String));
  });

  it('records successful detail views once and updates lastViewedAt and viewCount', async () => {
    await request(app.getHttpServer()).get(`/api/posts/${slug}`).set('Cookie', cookie).expect(200);
    expect(await prisma.postViewHistory.count({ where: { postId } })).toBe(0);
    await request(app.getHttpServer())
      .post(`/api/posts/${slug}/view-history`)
      .set('Cookie', cookie)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/posts/${slug}/view-history`)
      .set('Cookie', cookie)
      .expect(201);
    const record = await prisma.postViewHistory.findUniqueOrThrow({
      where: {
        userId_postId: {
          userId: (await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } })).id,
          postId,
        },
      },
    });
    expect(record.viewCount).toBe(2);
    const page = await request(app.getHttpServer())
      .get('/api/posts/history')
      .set('Cookie', cookie)
      .expect(200);
    expect(page.body.items[0]).toMatchObject({ id: postId, viewCount: 2 });
    expect(page.body.items[0].lastViewedAt).toEqual(expect.any(String));
    await request(app.getHttpServer())
      .delete(`/api/posts/history/${postId}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(await prisma.postViewHistory.count({ where: { postId } })).toBe(0);
  });

  it('does not record missing or draft posts and can clear all history', async () => {
    await request(app.getHttpServer())
      .post('/api/posts/missing/view-history')
      .set('Cookie', cookie)
      .expect(404);
    const author = await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } });
    const draft = await prisma.post.create({
      data: {
        title: 'Interaction draft',
        slug: 'e2e-interaction-draft',
        contentMarkdown: 'draft',
        category: 'AGENT',
        status: 'DRAFT',
        authorId: author.id,
      },
    });
    await request(app.getHttpServer())
      .post(`/api/posts/${draft.slug}/view-history`)
      .set('Cookie', cookie)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/api/posts/${slug}/view-history`)
      .set('Cookie', cookie)
      .expect(201);
    await request(app.getHttpServer())
      .delete('/api/posts/history')
      .set('Cookie', cookie)
      .expect(200)
      .expect(({ body }) => expect(body.deletedCount).toBe(1));
  });

  it('suite cleanup does not delete unrelated users', async () => {
    await prisma.user.deleteMany({ where: { emailNormalized: protectedEmail } });
    const protectedUser = await prisma.user.create({
      data: {
        email: protectedEmail,
        emailNormalized: protectedEmail,
        username: 'e2einteractionprotected',
        displayName: 'Protected',
        passwordHash: 'not-used',
      },
    });
    await cleanTestUsers(prisma, [email]);
    await expect(
      prisma.user.findUnique({ where: { id: protectedUser.id } }),
    ).resolves.not.toBeNull();
    await prisma.user.delete({ where: { id: protectedUser.id } });
  });
});

async function createApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
