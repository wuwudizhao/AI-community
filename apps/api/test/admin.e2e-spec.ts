/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { hashSecret } from '../src/auth/auth.crypto';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Admin API permissions (e2e)', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let prisma: PrismaService;
  const prefix = 'admin-e2e-';
  const userSecret = `${prefix}user-secret-with-sufficient-length`;
  const adminSecret = `${prefix}admin-secret-with-sufficient-length`;
  let userId: string;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    await cleanup(prisma);
    const [user] = await Promise.all([
      createUser(prisma, 'user', 'USER', userSecret),
      createUser(prisma, 'admin', 'ADMIN', adminSecret),
    ]);
    userId = user.id;
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it('returns 401 without a session, 403 for USER, and 200 for ADMIN', async () => {
    await request(app.getHttpServer()).get('/api/admin/dashboard').expect(401);
    await adminRequest('get', '/api/admin/dashboard', userSecret).expect(403);
    const response = await adminRequest('get', '/api/admin/dashboard', adminSecret).expect(200);
    expect(response.body).toEqual({
      users: expect.any(Number),
      posts: expect.any(Number),
      usersToday: expect.any(Number),
      postsToday: expect.any(Number),
    });
  });

  it('allows ADMIN to delete a post while USER is rejected', async () => {
    const post = await prisma.post.create({
      data: {
        slug: `${prefix}delete`,
        title: 'Admin deletion test',
        contentMarkdown: 'Body',
        category: 'AGENT',
        authorId: userId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await adminRequest('delete', `/api/admin/posts/${post.id}`, userSecret).expect(403);
    await adminRequest('delete', `/api/admin/posts/${post.id}`, adminSecret)
      .expect(200)
      .expect({ success: true, deletedId: post.id });
    expect(await prisma.post.findUnique({ where: { id: post.id } })).toBeNull();
  });

  it('allows ADMIN to change a role while USER is rejected', async () => {
    await adminRequest('patch', `/api/admin/users/${userId}/role`, userSecret)
      .send({ role: 'ADMIN' })
      .expect(403);
    await adminRequest('patch', `/api/admin/users/${userId}/role`, adminSecret)
      .send({ role: 'ADMIN' })
      .expect(200)
      .expect({ id: userId, role: 'ADMIN' });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).role).toBe('ADMIN');
  });

  it('allows ADMIN to pin a post and rejects invalid values', async () => {
    const post = await prisma.post.create({
      data: {
        slug: `${prefix}pin`,
        title: 'Admin pin test',
        contentMarkdown: 'Body',
        category: 'AGENT',
        authorId: userId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await adminRequest('patch', `/api/admin/posts/${post.id}/pinned`, adminSecret)
      .send({ pinned: 'yes' })
      .expect(400);
    await adminRequest('patch', `/api/admin/posts/${post.id}/pinned`, adminSecret)
      .send({ pinned: true })
      .expect(200)
      .expect({ id: post.id, pinned: true });
    expect((await prisma.post.findUniqueOrThrow({ where: { id: post.id } })).pinned).toBe(true);
  });

  function adminRequest(method: 'get' | 'delete' | 'patch', path: string, secret: string) {
    return request(app.getHttpServer())[method](path).set('Cookie', `liftoff_session=${secret}`);
  }
});

async function createUser(
  prisma: PrismaService,
  suffix: string,
  role: 'USER' | 'ADMIN',
  secret: string,
) {
  const email = `admin-e2e-${suffix}@example.test`;
  const user = await prisma.user.create({
    data: {
      email,
      emailNormalized: email,
      username: `admin-e2e-${suffix}`,
      displayName: `Admin E2E ${suffix}`,
      passwordHash: 'not-used',
      role,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: hashSecret(secret),
      expiresAt: new Date(Date.now() + 3_600_000),
      adminVerifiedAt: role === 'ADMIN' ? new Date() : null,
    },
  });
  return user;
}

async function cleanup(prisma: PrismaService) {
  await prisma.post.deleteMany({ where: { slug: { startsWith: 'admin-e2e-' } } });
  await prisma.user.deleteMany({ where: { emailNormalized: { startsWith: 'admin-e2e-' } } });
}

async function createApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
