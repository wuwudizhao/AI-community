/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { hashSecret } from '../src/auth/auth.crypto';
import { hashAnonymousToken } from '../src/posts/anonymous-identity.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Post deletion permissions (e2e)', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let prisma: PrismaService;
  const origin = 'http://localhost:3000';
  const prefix = 'delete-e2e-';
  const userSecret = 'delete-user-secret-with-sufficient-length';
  const otherSecret = 'delete-other-secret-with-sufficient-length';
  const adminSecret = 'delete-admin-secret-with-sufficient-length';
  const anonymousTokenA = 'a'.repeat(43);
  const anonymousTokenB = 'b'.repeat(43);
  let userId: string;
  let otherId: string;
  let anonymousAId: string;
  let anonymousBId: string;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    await cleanup(prisma, prefix);
    const users = await Promise.all([
      createUser(prisma, `${prefix}user@example.test`, `${prefix}user`, 'USER', userSecret),
      createUser(prisma, `${prefix}other@example.test`, `${prefix}other`, 'USER', otherSecret),
      createUser(prisma, `${prefix}admin@example.test`, `${prefix}admin`, 'ADMIN', adminSecret),
    ]);
    [userId, otherId] = users.map(({ id }) => id);
    const identities = await Promise.all([
      prisma.anonymousIdentity.create({ data: { tokenHash: hashAnonymousToken(anonymousTokenA) } }),
      prisma.anonymousIdentity.create({ data: { tokenHash: hashAnonymousToken(anonymousTokenB) } }),
    ]);
    [anonymousAId, anonymousBId] = identities.map(({ id }) => id);
  });

  afterAll(async () => {
    await cleanup(prisma, prefix);
    await app.close();
  });

  it('keeps registration role server-controlled and owner promoted by migration', async () => {
    const owner = await prisma.user.findUniqueOrThrow({ where: { username: 'liftoff_owner' } });
    expect(owner.role).toBe('ADMIN');
    const registration = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `${prefix}register@example.test`,
        username: 'deletee2eregister',
        displayName: 'Role Test',
        password: 'StrongPass123',
        role: 'ADMIN',
      })
      .expect(201);
    expect(registration.body).not.toHaveProperty('role');
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { username: 'deletee2eregister' } })).role,
    ).toBe('USER');
  });

  it('lets a user delete their own post and cascades related data', async () => {
    const post = await createPost(prisma, `${prefix}own`, { authorId: userId }, true);
    await request(app.getHttpServer())
      .delete(`/api/posts/${post.slug}`)
      .set('Origin', origin)
      .set('Cookie', `liftoff_session=${userSecret}`)
      .expect(200)
      .expect({ success: true, deletedSlug: post.slug });
    expect(await prisma.postTag.count({ where: { postId: post.id } })).toBe(0);
    await request(app.getHttpServer())
      .delete(`/api/posts/${post.slug}`)
      .set('Origin', origin)
      .set('Cookie', `liftoff_session=${userSecret}`)
      .expect(404);
  });

  it('enforces user and anonymous ownership boundaries', async () => {
    const userPost = await createPost(prisma, `${prefix}user-boundary`, { authorId: otherId });
    const guestPost = await createPost(prisma, `${prefix}guest-boundary`, {
      anonymousAuthorId: anonymousAId,
    });
    const guestCookieA = `liftoff_anonymous_token=${anonymousTokenA}`;
    const guestCookieB = `liftoff_anonymous_token=${anonymousTokenB}`;

    await del(app, userPost.slug, userSecret).expect(403);
    await del(app, guestPost.slug, userSecret).expect(403);
    await del(app, userPost.slug, undefined, guestCookieA).expect(403);
    await del(app, guestPost.slug, undefined, guestCookieB).expect(403);
    await del(app, guestPost.slug).expect(403);

    await del(app, guestPost.slug, undefined, guestCookieA)
      .expect(200)
      .expect({ success: true, deletedSlug: guestPost.slug });
  });

  it('lets an admin delete user and anonymous posts', async () => {
    const userPost = await createPost(prisma, `${prefix}admin-user`, { authorId: otherId });
    const guestPost = await createPost(prisma, `${prefix}admin-guest`, {
      anonymousAuthorId: anonymousBId,
    });
    await del(app, userPost.slug, adminSecret).expect(200);
    await del(app, guestPost.slug, adminSecret).expect(200);
  });

  it('returns canDelete safely without exposing internal anonymous ownership', async () => {
    const post = await createPost(prisma, `${prefix}safe-detail`, {
      anonymousAuthorId: anonymousAId,
    });
    const own = await request(app.getHttpServer())
      .get(`/api/posts/${post.slug}`)
      .set('Cookie', `liftoff_anonymous_token=${anonymousTokenA}`)
      .expect(200);
    expect(own.body.canDelete).toBe(true);
    expect(own.body).not.toHaveProperty('anonymousAuthorId');
    expect(own.body.author).not.toHaveProperty('id');
    const other = await request(app.getHttpServer())
      .get(`/api/posts/${post.slug}`)
      .set('Cookie', `liftoff_anonymous_token=${anonymousTokenB}`)
      .expect(200);
    expect(other.body.canDelete).toBe(false);
  });

  it('rejects foreign or missing origins and rate limits deletion attempts', async () => {
    const post = await createPost(prisma, `${prefix}csrf`, { authorId: userId });
    await request(app.getHttpServer())
      .delete(`/api/posts/${post.slug}`)
      .set('Origin', 'https://evil.example')
      .set('Cookie', `liftoff_session=${userSecret}`)
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/api/posts/${post.slug}`)
      .set('Cookie', `liftoff_session=${userSecret}`)
      .expect(403);

    for (let index = 0; index < 10; index += 1) {
      await del(app, `${prefix}missing-${index}`, otherSecret).expect(404);
    }
    await del(app, `${prefix}missing-rate`, otherSecret).expect(429);
  });
});

function del(
  app: Awaited<ReturnType<typeof createApp>>,
  slug: string,
  session?: string,
  anonymousCookie?: string,
) {
  const call = request(app.getHttpServer())
    .delete(`/api/posts/${slug}`)
    .set('Origin', 'http://localhost:3000');
  const cookies = [session ? `liftoff_session=${session}` : '', anonymousCookie ?? ''].filter(
    Boolean,
  );
  return cookies.length ? call.set('Cookie', cookies) : call;
}

async function createUser(
  prisma: PrismaService,
  email: string,
  username: string,
  role: 'USER' | 'ADMIN',
  secret: string,
) {
  const user = await prisma.user.create({
    data: {
      email,
      emailNormalized: email,
      username,
      displayName: username,
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
    },
  });
  return user;
}

async function createPost(
  prisma: PrismaService,
  slug: string,
  owner: { authorId: string } | { anonymousAuthorId: string },
  withTag = false,
) {
  return prisma.post.create({
    data: {
      slug,
      title: slug,
      contentMarkdown: 'deletion e2e body',
      category: 'AGENT',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      ...owner,
      ...(withTag
        ? {
            tags: {
              create: {
                tag: {
                  connectOrCreate: {
                    where: { slug: `${slug}-tag` },
                    create: { slug: `${slug}-tag`, name: `${slug}-tag` },
                  },
                },
              },
            },
          }
        : {}),
    },
  });
}

async function cleanup(prisma: PrismaService, prefix: string) {
  await prisma.post.deleteMany({ where: { slug: { startsWith: prefix } } });
  await prisma.tag.deleteMany({ where: { slug: { startsWith: prefix }, posts: { none: {} } } });
  await prisma.anonymousIdentity.deleteMany({
    where: {
      tokenHash: { in: [hashAnonymousToken('a'.repeat(43)), hashAnonymousToken('b'.repeat(43))] },
      posts: { none: {} },
    },
  });
  await prisma.user.deleteMany({ where: { emailNormalized: { startsWith: prefix } } });
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
