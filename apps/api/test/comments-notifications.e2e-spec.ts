/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanTestUsers } from './e2e-cleanup';

describe('Comments and notifications (e2e, PostgreSQL)', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let prisma: PrismaService;
  let cookieA = '';
  let cookieB = '';
  let slug = '';
  let rootId = '';
  let replyId = '';
  let notificationA = '';
  const testEmails = ['phase5a@example.test', 'phase5b@example.test'] as const;
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
    await cleanTestUsers(prisma, testEmails);
    cookieA = await account('phase5a@example.test', 'phase5a');
    cookieB = await account('phase5b@example.test', 'phase5b');
    const post = await request(app.getHttpServer())
      .post('/api/posts')
      .set('Cookie', cookieA)
      .send({
        category: 'AGENT',
        title: 'Phase 5 interaction',
        contentMarkdown: 'Phase 5 interaction\n\nreal flow',
        tags: [],
      })
      .expect(201);
    slug = post.body.slug as string;
  });
  afterAll(async () => {
    await cleanTestUsers(prisma, testEmails);
    await app.close();
  });

  it('rejects anonymous comments and invalid content', async () => {
    await request(app.getHttpServer())
      .post(`/api/posts/${slug}/comments`)
      .send({ content: 'no auth' })
      .expect(401);
    await request(app.getHttpServer())
      .post(`/api/posts/${slug}/comments`)
      .set('Cookie', cookieB)
      .send({ content: '\u200b' })
      .expect(400);
  });
  it('creates a root comment and notifies the post author', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/posts/${slug}/comments`)
      .set('Cookie', cookieB)
      .send({ content: 'B comments on A post', authorId: 'forged' })
      .expect(201);
    rootId = response.body.id as string;
    const post = await prisma.post.findUniqueOrThrow({ where: { slug } });
    const author = await prisma.user.findUniqueOrThrow({
      where: { emailNormalized: 'phase5a@example.test' },
    });
    expect(await prisma.comment.count({ where: { postId: post.id } })).toBe(1);
    expect(
      await prisma.notification.count({ where: { postId: post.id, recipientId: author.id } }),
    ).toBe(1);
    const count = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set('Cookie', cookieA)
      .expect(200);
    expect(count.body.count).toBe(1);
    const list = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Cookie', cookieA)
      .expect(200);
    notificationA = list.body.items[0].id as string;
    expect(list.body.items[0].targetUrl).toBe(`/posts/${slug}#comment-${rootId}`);
    expect(list.body.items[0].actor).not.toHaveProperty('email');
  });
  it('creates a second-level reply and prevents a third-level tree', async () => {
    const reply = await request(app.getHttpServer())
      .post(`/api/posts/${slug}/comments`)
      .set('Cookie', cookieA)
      .send({ content: 'A replies to B', replyToCommentId: rootId })
      .expect(201);
    replyId = reply.body.id as string;
    const nested = await request(app.getHttpServer())
      .post(`/api/posts/${slug}/comments`)
      .set('Cookie', cookieB)
      .send({ content: 'B replies to reply', replyToCommentId: replyId })
      .expect(201);
    expect(nested.body.parentId).toBe(rootId);
    expect(await prisma.comment.count({ where: { parent: { parentId: { not: null } } } })).toBe(0);
    const bCount = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set('Cookie', cookieB)
      .expect(200);
    expect(bCount.body.count).toBe(1);
  });
  it('does not create self notifications and returns real comment counts', async () => {
    const post = await prisma.post.findUniqueOrThrow({ where: { slug } });
    const before = await prisma.notification.count({ where: { postId: post.id } });
    await request(app.getHttpServer())
      .post(`/api/posts/${slug}/comments`)
      .set('Cookie', cookieA)
      .send({ content: 'A comments own post' })
      .expect(201);
    expect(await prisma.notification.count({ where: { postId: post.id } })).toBe(before);
    const posts = await request(app.getHttpServer()).get('/api/posts').expect(200);
    const listedPost = posts.body.items.find((item: { slug: string }) => item.slug === slug);
    expect(listedPost.commentCount).toBe(4);
  });
  it('paginates root comments and rejects a mismatched reply target', async () => {
    await request(app.getHttpServer())
      .post(`/api/posts/${slug}/comments`)
      .set('Cookie', cookieB)
      .send({ content: 'another root' })
      .expect(201);
    const page = await request(app.getHttpServer())
      .get(`/api/posts/${slug}/comments?page=1&pageSize=1&sort=latest`)
      .expect(200);
    expect(page.body.items).toHaveLength(1);
    expect(page.body.pagination.totalPages).toBeGreaterThan(1);

    const otherPost = await request(app.getHttpServer())
      .post('/api/posts')
      .set('Cookie', cookieA)
      .send({
        category: 'AGENT',
        title: 'Other post for mismatch',
        contentMarkdown: 'Other post for mismatch\n\nbody',
        tags: [],
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/posts/${otherPost.body.slug}/comments`)
      .set('Cookie', cookieB)
      .send({ content: 'wrong parent', replyToCommentId: rootId })
      .expect(404);
  });
  it('isolates, reads and marks notifications idempotently', async () => {
    await request(app.getHttpServer())
      .patch(`/api/notifications/${notificationA}/read`)
      .set('Cookie', cookieB)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/notifications/${notificationA}/read`)
      .set('Cookie', cookieA)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/notifications/${notificationA}/read`)
      .set('Cookie', cookieA)
      .expect(200);
    await request(app.getHttpServer())
      .patch('/api/notifications/read-all')
      .set('Cookie', cookieA)
      .expect(200);
    const count = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set('Cookie', cookieA)
      .expect(200);
    expect(count.body.count).toBe(0);
  });
  it('soft deletes while preserving replies and enforces author/admin permissions', async () => {
    await request(app.getHttpServer())
      .delete(`/api/comments/${rootId}`)
      .set('Cookie', cookieA)
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/comments/${rootId}`)
      .set('Cookie', cookieB)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/comments/${rootId}`)
      .set('Cookie', cookieB)
      .expect(200);
    const list = await request(app.getHttpServer()).get(`/api/posts/${slug}/comments`).expect(200);
    const root = list.body.items.find((item: { id: string }) => item.id === rootId);
    expect(root.content).toBeNull();
    expect(root.replies.length).toBeGreaterThan(0);
    const userA = await prisma.user.findUniqueOrThrow({
      where: { emailNormalized: 'phase5a@example.test' },
    });
    await prisma.user.update({ where: { id: userA.id }, data: { role: 'ADMIN' } });
    await request(app.getHttpServer())
      .delete(`/api/comments/${replyId}`)
      .set('Cookie', cookieA)
      .expect(200);
  });
  it('returns only mine and survives API restart with PostgreSQL session', async () => {
    const mine = await request(app.getHttpServer())
      .get('/api/comments/mine')
      .set('Cookie', cookieB)
      .expect(200);
    expect(
      mine.body.items.every(
        (item: { author: { username: string } }) => item.author.username === 'phase5b',
      ),
    ).toBe(true);
    await app.close();
    app = await createApp();
    prisma = app.get(PrismaService);
    await request(app.getHttpServer()).get('/api/notifications').set('Cookie', cookieB).expect(200);
    await request(app.getHttpServer()).get(`/api/posts/${slug}/comments`).expect(200);
  });

  async function account(email: string, username: string) {
    const password = 'StrongPass123';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, username, displayName: username, password })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    return login.headers['set-cookie'][0].split(';')[0];
  }
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
