/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { hashSecret } from '../src/auth/auth.crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanTestUsers } from './e2e-cleanup';

describe('Posts API (e2e, PostgreSQL)', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let prisma: PrismaService;
  const email = 'phase4@example.test';
  const testEmails = [email] as const;
  const protectedEmail = 'e2e-protected-posts@example.test';
  const password = 'StrongPass123';
  const opportunityTagName = 'e2e-phase4-赚钱机会';
  const guestTitlePrefix = 'E2E 游客发帖';
  const anonymousIdentityIds = new Set<string>();
  const preexistingAnonymousIds = new Set<string>();

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: 'test',
      API_PORT: '4000',
      WEB_ORIGIN: 'http://localhost:3000',
      WEB_BASE_URL: 'http://localhost:3000',
      AUTH_COOKIE_NAME: 'liftoff_session',
      ALLOW_GUEST_POSTING: 'true',
      SESSION_TTL_HOURS: '168',
      EMAIL_VERIFICATION_TTL_MINUTES: '60',
    });
    app = await createApp();
    prisma = app.get(PrismaService);
    (await prisma.anonymousIdentity.findMany({ select: { id: true } })).forEach(({ id }) =>
      preexistingAnonymousIds.add(id),
    );
    await prisma.post.deleteMany({ where: { title: { startsWith: guestTitlePrefix } } });
    await prisma.user.deleteMany({ where: { emailNormalized: protectedEmail } });
    await cleanTestUsers(prisma, testEmails);
  });
  afterAll(async () => {
    await prisma.post.deleteMany({ where: { title: { startsWith: guestTitlePrefix } } });
    await prisma.anonymousIdentity.deleteMany({
      where: { id: { notIn: [...preexistingAnonymousIds] }, posts: { none: {} } },
    });
    await cleanTestUsers(prisma, testEmails);
    await prisma.user.deleteMany({ where: { emailNormalized: protectedEmail } });
    await app.close();
  });

  it('does not delete records outside this suite cleanup boundary', async () => {
    const protectedUser = await prisma.user.create({
      data: {
        email: protectedEmail,
        emailNormalized: protectedEmail,
        username: 'e2eprotectedposts',
        displayName: 'Protected E2E Record',
        passwordHash: 'not-used-by-this-test',
      },
    });

    await cleanTestUsers(prisma, testEmails);

    await expect(
      prisma.user.findUnique({ where: { id: protectedUser.id } }),
    ).resolves.not.toBeNull();
  });

  it('creates and reuses isolated anonymous identities without leaking secrets', async () => {
    const browserA = request.agent(app.getHttpServer());
    const browserB = request.agent(app.getHttpServer());
    const forged = {
      authorId: 'forged-user',
      anonymousAuthorId: 'forged-anonymous',
      anonymousToken: 'forged-token',
      tokenHash: 'forged-hash',
    };

    const a1 = await browserA
      .post('/api/posts')
      .send({
        category: 'MONEY_OPPORTUNITY',
        contentMarkdown: `${guestTitlePrefix} A1\n\nFirst post from browser A.`,
        tags: ['anonymous-e2e'],
        ...forged,
      })
      .expect(201);
    const setCookie = a1.headers['set-cookie'] as unknown as string[];
    expect(setCookie[0]).toContain('liftoff_anonymous_token=');
    expect(setCookie[0]).toContain('HttpOnly');
    expect(setCookie[0]).toContain('SameSite=Lax');
    expect(setCookie[0]).toContain('Path=/');
    expect(setCookie[0]).toContain('Max-Age=15552000');
    expect(setCookie[0]).not.toContain('Secure');

    const a2 = await browserA
      .post('/api/posts')
      .send({
        category: 'MONEY_OPPORTUNITY',
        title: `${guestTitlePrefix} A2`,
        contentMarkdown: `${guestTitlePrefix} A2\n\nSecond post from browser A.`,
      })
      .expect(201);
    const b1 = await browserB
      .post('/api/posts')
      .send({
        category: 'FAILURE_REVIEW',
        contentMarkdown: `${guestTitlePrefix} B1\n\nFirst post from browser B.`,
      })
      .expect(201);

    for (const response of [a1, a2, b1]) {
      expect(response.body.author).toMatchObject({
        type: 'anonymous',
        displayName: 'Liftoff 访客',
      });
      expect(String(response.body.author.anonymousLabel)).toMatch(/^[0-9A-F]{4}$/);
      for (const field of ['id', 'email', 'passwordHash', 'token', 'tokenHash', 'ip']) {
        expect(response.body.author).not.toHaveProperty(field);
      }
    }
    expect(a1.body.author.anonymousLabel).toBe(a2.body.author.anonymousLabel);
    expect(a1.body.author.anonymousLabel).not.toBe(b1.body.author.anonymousLabel);

    const posts = await prisma.post.findMany({
      where: { slug: { in: [a1.body.slug, a2.body.slug, b1.body.slug] } },
      orderBy: { title: 'asc' },
    });
    expect(posts).toHaveLength(3);
    expect(posts.every((post) => post.authorId === null && post.anonymousAuthorId !== null)).toBe(
      true,
    );
    expect(posts[0].anonymousAuthorId).toBe(posts[1].anonymousAuthorId);
    expect(posts[0].anonymousAuthorId).not.toBe(posts[2].anonymousAuthorId);
    expect(posts.map(({ category }) => category)).toEqual([
      'MONEY_OPPORTUNITY',
      'MONEY_OPPORTUNITY',
      'FAILURE_REVIEW',
    ]);
    expect(a1.body.category).toEqual({ key: 'money-opportunity', label: '赚钱机会' });
    expect(b1.body.category).toEqual({ key: 'failure-review', label: '失败复盘' });
    posts.forEach((post) => anonymousIdentityIds.add(post.anonymousAuthorId!));

    const systemGuest = await prisma.user.findUnique({
      where: { emailNormalized: 'guest@liftoff.local' },
    });
    expect(posts.some((post) => post.authorId === systemGuest?.id)).toBe(false);
  });

  it('restores the anonymous 401 response when guest posting is disabled', async () => {
    const config = app.get(ConfigService);
    config.set('ALLOW_GUEST_POSTING', false);

    await request(app.getHttpServer())
      .post('/api/posts')
      .send({
        category: 'AGENT',
        title: `${guestTitlePrefix}关闭开关`,
        contentMarkdown: `${guestTitlePrefix}关闭开关\n\nbody`,
      })
      .expect(401);

    config.set('ALLOW_GUEST_POSTING', true);
  });

  it('does not allow the system guest account to use normal email login', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'guest@liftoff.local', password: 'SYSTEM_ACCOUNT_LOGIN_DISABLED' })
      .expect(401);
  });

  it('registers, verifies, logs in and creates/query posts with real relations', async () => {
    const registration = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, username: 'phase4builder', displayName: 'Phase 4 Builder', password })
      .expect(201);
    const token = new URL(registration.body.developmentPreviewUrl as string).searchParams.get(
      'token',
    );
    await request(app.getHttpServer()).post('/api/auth/verify-email').send({ token }).expect(201);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    const body = {
      category: 'RAG',
      title: '如何设计可靠的 RAG 召回链路',
      contentMarkdown:
        '## 如何设计可靠的 RAG 召回链路\n\n# 正文\n\n<script>alert(1)</script>\n\n```ts\nconst safe = true\n```',
      tags: ['RAG', ' rag ', '检索增强生成'],
    };
    const first = await request(app.getHttpServer())
      .post('/api/posts')
      .set('Cookie', cookie)
      .send({ ...body, authorId: 'forged' })
      .expect(201);
    const secondTitle = `${body.title}（第二版）`;
    const second = await request(app.getHttpServer())
      .post('/api/posts')
      .set('Cookie', cookie)
      .send({
        ...body,
        title: secondTitle,
        contentMarkdown: body.contentMarkdown.replace(body.title, secondTitle),
      })
      .expect(201);
    expect(first.body.slug).not.toBe(second.body.slug);
    expect(first.body.author.type).toBe('user');
    expect(first.body.author.username).toBe('phase4builder');
    expect(first.body.title).toBe(body.title);
    expect(first.body.category).toEqual({ key: 'rag', label: 'RAG' });
    const author = await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } });
    expect(await prisma.post.count({ where: { authorId: author.id } })).toBe(2);
    expect(
      await prisma.post.count({ where: { authorId: author.id, anonymousAuthorId: null } }),
    ).toBe(2);
    const createdPosts = await prisma.post.findMany({
      where: { authorId: author.id },
      select: { id: true },
    });
    expect(
      await prisma.postTag.count({
        where: { postId: { in: createdPosts.map(({ id }) => id) } },
      }),
    ).toBe(4);
    const list = await request(app.getHttpServer())
      .get('/api/posts?page=1&pageSize=20&sort=latest')
      .expect(200);
    expect(list.body.items[0]).not.toHaveProperty('contentMarkdown');
    expect(list.body.items[0].author).not.toHaveProperty('email');
    expect(typeof list.body.items[0].category.key).toBe('string');
    expect(typeof list.body.items[0].category.label).toBe('string');
    await request(app.getHttpServer())
      .get(`/api/posts/${first.body.slug}`)
      .expect(200)
      .expect(({ body: detail }) => {
        expect(detail.contentMarkdown).toContain('<script>');
        expect(detail.contentMarkdown).not.toContain(body.title);
        expect(detail.contentMarkdown).toMatch(/^# 正文/);
        expect(detail.category).toEqual({ key: 'rag', label: 'RAG' });
      });
    await request(app.getHttpServer()).get('/api/posts/missing-slug').expect(404);
    const mine = await request(app.getHttpServer())
      .get('/api/posts/mine')
      .set('Cookie', cookie)
      .expect(200);
    expect(mine.body.items).toHaveLength(2);
    await app.close();
    app = await createApp();
    prisma = app.get(PrismaService);
    await request(app.getHttpServer())
      .post('/api/posts')
      .set('Cookie', cookie)
      .send({
        category: 'AGENT',
        title: '重启后的帖子',
        contentMarkdown: '重启后的帖子\n\nSession 仍然有效',
        tags: [],
      })
      .expect(201);
  });

  it.each(['PENDING_VERIFICATION', 'SUSPENDED', 'BANNED'] as const)(
    'rejects %s session creation',
    async (status) => {
      const user = await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } });
      await prisma.user.update({ where: { id: user.id }, data: { status } });
      const secret = `phase4-${status.toLowerCase()}-secret-that-is-long-enough`;
      await prisma.userSession.create({
        data: {
          userId: user.id,
          tokenHash: hashSecret(secret),
          expiresAt: new Date(Date.now() + 60_000),
        },
      });
      await request(app.getHttpServer())
        .post('/api/posts')
        .set('Cookie', `liftoff_session=${secret}`)
        .send({
          category: 'AGENT',
          title: 'Blocked post',
          contentMarkdown: 'Blocked post\n\nblocked',
        })
        .expect(403);
      await prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
    },
  );

  it('validates pagination, tag count and invisible content', async () => {
    await request(app.getHttpServer()).get('/api/posts?page=0&pageSize=100').expect(400);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    await request(app.getHttpServer())
      .post('/api/posts')
      .set('Cookie', cookie)
      .send({
        category: 'AGENT',
        title: '显式兼容标题',
        contentMarkdown: '不同的正文首行标题\n\n正文内容',
      })
      .expect(400)
      .expect(({ body }) => expect(body.message).toContain('title 必须与正文第一行'));
    await request(app.getHttpServer())
      .post('/api/posts')
      .set('Cookie', cookie)
      .send({
        category: 'AGENT',
        title: '\u200b\u200b\u200b',
        contentMarkdown: '\u200b\u200b\u200b\n\nvalid body',
        tags: [],
      })
      .expect(400);
    for (const category of ['SIDE_PROJECT', 'INCOME_CASE']) {
      await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          category,
          contentMarkdown: `${guestTitlePrefix}旧分类 ${category}\n\nbody`,
        })
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/api/posts')
      .set('Cookie', cookie)
      .send({
        category: 'AGENT',
        title: 'Too many tags',
        contentMarkdown: 'Too many tags\n\nvalid body',
        tags: Array.from({ length: 9 }, (_, i) => `tag${i}`),
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/posts')
      .send({
        category: 'AGENT',
        title: `${guestTitlePrefix}空正文`,
        contentMarkdown: `${guestTitlePrefix}空正文\n\n   `,
        tags: [],
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/posts')
      .send({
        category: 'AGENT',
        title: `${guestTitlePrefix}超长标签`,
        contentMarkdown: `${guestTitlePrefix}超长标签\n\nvalid body`,
        tags: ['x'.repeat(31)],
      })
      .expect(400);
  });

  it('requires a valid first-level category and never guesses it from tags or titles', async () => {
    const missingTitle = `${guestTitlePrefix}缺少分类`;
    const invalidTitle = `${guestTitlePrefix}非法分类`;
    await request(app.getHttpServer())
      .post('/api/posts')
      .send({ title: missingTitle, contentMarkdown: `${missingTitle}\n\nAgent`, tags: ['Agent'] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/posts')
      .send({
        category: 'NOT_A_CATEGORY',
        title: invalidTitle,
        contentMarkdown: `${invalidTitle}\n\nbody`,
      })
      .expect(400);
    expect(
      await prisma.post.count({ where: { title: { in: [missingTitle, invalidTitle] } } }),
    ).toBe(0);
  });

  it.each([
    ['![图片](https://example.com/a.png)\n\n正文内容', '正文第一行不能是图片 Markdown'],
    ['https://example.com\n\n正文内容', '正文第一行不能是纯链接'],
    ['……!!!\n\n正文内容', '正文第一行不能是空白或纯标点'],
    ['短\n\n正文内容', '帖子标题不能少于 3 个字符'],
    [`${'长'.repeat(161)}\n\n正文内容`, '帖子标题不能超过 160 个字符'],
    ['只有标题没有正文', '请在标题下一行继续填写正文'],
  ])(
    'rejects invalid first-line post content through the API',
    async (contentMarkdown, message) => {
      const browser = request.agent(app.getHttpServer());
      await browser
        .post('/api/posts')
        .send({ category: 'AGENT', contentMarkdown })
        .expect(400)
        .expect(({ body }) => expect(body.message).toBe(message));
    },
  );

  it('rejects duplicate submissions and a filled honeypot without creating posts', async () => {
    const duplicateBody = {
      category: 'AGENT',
      title: `${guestTitlePrefix}重复保护`,
      contentMarkdown: `${guestTitlePrefix}重复保护\n\n连续点击不应创建两条相同内容`,
      tags: ['防重复'],
    };
    const before = await prisma.post.count({ where: { title: duplicateBody.title } });
    await request(app.getHttpServer()).post('/api/posts').send(duplicateBody).expect(201);
    await request(app.getHttpServer()).post('/api/posts').send(duplicateBody).expect(409);
    expect(await prisma.post.count({ where: { title: duplicateBody.title } })).toBe(before + 1);

    const honeypotTitle = `${guestTitlePrefix}蜜罐保护`;
    await request(app.getHttpServer())
      .post('/api/posts')
      .send({
        category: 'AGENT',
        title: honeypotTitle,
        contentMarkdown: `${honeypotTitle}\n\nbot`,
        website: 'https://spam.example',
      })
      .expect(400);
    expect(await prisma.post.count({ where: { title: honeypotTitle } })).toBe(0);
  });

  it('filters published posts by an exact normalized tag before pagination', async () => {
    await app.close();
    app = await createApp();
    prisma = app.get(PrismaService);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];

    const create = (title: string, tags: string[]) =>
      request(app.getHttpServer())
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ category: 'AGENT', title, contentMarkdown: `${title}\n\n${title} 正文`, tags })
        .expect(201);

    await create('AI 自动化获客机会', [opportunityTagName]);
    await create('AI 自动化落地机会', [opportunityTagName, '项目验证']);
    await create('标题包含赚钱机会但标签不同', ['技术讨论']);
    await create('分类为 Agent 但带 RAG 标签', ['RAG']);

    const opportunityTag = await prisma.tag.findUniqueOrThrow({
      where: { name: opportunityTagName },
    });
    const author = await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } });
    await prisma.post.create({
      data: {
        title: '不应公开的赚钱机会草稿',
        slug: 'hidden-opportunity-draft',
        contentMarkdown: 'draft',
        category: 'MONEY_OPPORTUNITY',
        authorId: author.id,
        status: 'DRAFT',
        tags: { create: { tagId: opportunityTag.id } },
      },
    });

    const firstPage = await request(app.getHttpServer())
      .get(`/api/posts?tag=${encodeURIComponent(opportunityTagName)}&page=1&pageSize=1&sort=latest`)
      .expect(200);
    expect(firstPage.body.pagination).toEqual({
      page: 1,
      pageSize: 1,
      totalItems: 2,
      totalPages: 2,
      hasPreviousPage: false,
      hasNextPage: true,
    });
    expect(firstPage.body.items).toHaveLength(1);
    expect(firstPage.body.items[0].tags).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: opportunityTagName })]),
    );
    expect(firstPage.body.items[0].title).not.toBe('标题包含赚钱机会但标签不同');
    expect(firstPage.body.items[0]).not.toHaveProperty('contentMarkdown');
    expect(firstPage.body.items[0].author).not.toHaveProperty('email');

    const secondPage = await request(app.getHttpServer())
      .get(`/api/posts?tag=${encodeURIComponent(opportunityTagName)}&page=2&pageSize=1&sort=latest`)
      .expect(200);
    expect(secondPage.body.pagination).toEqual({
      page: 2,
      pageSize: 1,
      totalItems: 2,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
    });
    expect(secondPage.body.items).toHaveLength(1);

    const unfiltered = await request(app.getHttpServer())
      .get('/api/posts?page=1&pageSize=20&sort=latest')
      .expect(200);
    expect(unfiltered.body.pagination.totalItems).toBeGreaterThan(
      firstPage.body.pagination.totalItems,
    );
  });

  it('accepts stable category filters, preserves pagination safety, and rejects unknown values', async () => {
    const rag = await request(app.getHttpServer())
      .get('/api/posts?category=rag&page=1&pageSize=1&sort=latest')
      .expect(200);

    expect(rag.body.pagination.page).toBe(1);
    expect(rag.body.pagination.pageSize).toBe(1);
    expect(rag.body.pagination.totalItems).toBe(2);
    expect(rag.body.items).toHaveLength(1);
    expect(rag.body.items[0].tags).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'RAG' })]),
    );
    expect(rag.body.items[0].category).toEqual({ key: 'rag', label: 'RAG' });
    expect(rag.body.items[0].title).not.toBe('分类为 Agent 但带 RAG 标签');
    expect(rag.body.items[0]).not.toHaveProperty('contentMarkdown');
    expect(rag.body.items[0].author).not.toHaveProperty('email');

    const technical = await request(app.getHttpServer())
      .get('/api/posts?category=technical-discussions&page=1&pageSize=20&sort=latest')
      .expect(200);
    expect(technical.body.pagination.totalItems).toBeGreaterThanOrEqual(
      rag.body.pagination.totalItems,
    );

    await request(app.getHttpServer()).get('/api/posts?category=not-a-real-category').expect(400);
    await request(app.getHttpServer()).get('/api/posts?category=side-project').expect(400);
    await request(app.getHttpServer()).get('/api/posts?category=income-case').expect(400);
  });

  it('paginates 45 isolated posts without duplicates or omissions for lists, categories and search', async () => {
    const author = await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } });
    const ids = Array.from(
      { length: 45 },
      (_, index) => `e2e-page-${String(index).padStart(2, '0')}`,
    );
    const createdAt = new Date('2026-07-15T02:00:00.000Z');
    try {
      await prisma.post.createMany({
        data: ids.map((id, index) => ({
          id,
          title: `E2E 分页验收 ${String(index).padStart(2, '0')}`,
          slug: `e2e-pagination-${String(index).padStart(2, '0')}`,
          contentMarkdown: `分页验收正文 ${index}`,
          category: 'MONEY_OPPORTUNITY',
          authorId: author.id,
          status: 'PUBLISHED',
          publishedAt: createdAt,
          createdAt,
        })),
      });

      const defaults = await request(app.getHttpServer())
        .get(`/api/posts?q=${encodeURIComponent('E2E 分页验收')}`)
        .expect(200);
      expect(defaults.body.items).toHaveLength(20);
      expect(defaults.body.pagination.page).toBe(1);
      expect(defaults.body.pagination.pageSize).toBe(20);

      const pages = await Promise.all(
        [1, 2, 3].map((page) =>
          request(app.getHttpServer())
            .get(`/api/posts?q=${encodeURIComponent('E2E 分页验收')}&page=${page}&pageSize=20`)
            .expect(200),
        ),
      );
      const pageBodies = pages.map(
        ({ body }) => body as { items: Array<{ id: string }>; pagination: Record<string, unknown> },
      );
      expect(pageBodies.map(({ items }) => items.length)).toEqual([20, 20, 5]);
      expect(pageBodies[0].pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 45,
        totalPages: 3,
        hasPreviousPage: false,
        hasNextPage: true,
      });
      expect(pageBodies[2].pagination.hasNextPage).toBe(false);
      const returnedIds = pageBodies.flatMap(({ items }) => items.map(({ id }) => id));
      expect(new Set(returnedIds).size).toBe(45);
      expect(new Set(returnedIds)).toEqual(new Set(ids));

      const category = await request(app.getHttpServer())
        .get('/api/posts?category=money-opportunity&page=1&pageSize=20')
        .expect(200);
      expect(category.body.pagination.totalItems).toBeGreaterThanOrEqual(45);
      await request(app.getHttpServer())
        .get(`/api/posts?q=${encodeURIComponent('E2E 分页验收')}&page=4&pageSize=20`)
        .expect(404);
      await request(app.getHttpServer()).get('/api/posts?page=abc&pageSize=20').expect(400);
      await request(app.getHttpServer()).get('/api/posts?page=1&pageSize=51').expect(400);
    } finally {
      await prisma.post.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it('limits one guest IP to five posts per ten minutes', async () => {
    await app.close();
    process.env.ALLOW_GUEST_POSTING = 'true';
    app = await createApp();
    prisma = app.get(PrismaService);
    const browser = request.agent(app.getHttpServer());

    for (let index = 1; index <= 5; index += 1) {
      await browser
        .post('/api/posts')
        .send({
          category: 'AGENT',
          title: `${guestTitlePrefix}限流 ${index}`,
          contentMarkdown: `${guestTitlePrefix}限流 ${index}\n\n限流正文 ${index}`,
        })
        .expect(201);
    }
    await browser
      .post('/api/posts')
      .send({
        category: 'AGENT',
        title: `${guestTitlePrefix}限流 6`,
        contentMarkdown: `${guestTitlePrefix}限流 6\n\n限流正文 6`,
      })
      .expect(429)
      .expect(({ body }) => expect(body.message).toBe('Too Many Requests'));
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
