/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PostImagesService } from '../src/post-images/post-images.service';

describe('Post body images (e2e, PostgreSQL)', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let prisma: PrismaService;
  let imagesService: PostImagesService;
  const storageDirectory = join(tmpdir(), `liftoff-post-images-${Date.now()}`);
  const createdImageIds = new Set<string>();
  const createdPostIds = new Set<string>();
  const anonymousIdentityIds = new Set<string>();
  const preexistingAnonymousIds = new Set<string>();

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: 'test',
      API_PORT: '4000',
      API_PUBLIC_URL: 'http://localhost:4000',
      WEB_ORIGIN: 'http://localhost:3000',
      WEB_BASE_URL: 'http://localhost:3000',
      AUTH_COOKIE_NAME: 'liftoff_session',
      ALLOW_GUEST_POSTING: 'true',
      POST_IMAGE_STORAGE_DIR: storageDirectory,
      SESSION_TTL_HOURS: '168',
      EMAIL_VERIFICATION_TTL_MINUTES: '60',
    });
    app = await createApp();
    prisma = app.get(PrismaService);
    imagesService = app.get(PostImagesService);
    (await prisma.anonymousIdentity.findMany({ select: { id: true } })).forEach(({ id }) =>
      preexistingAnonymousIds.add(id),
    );
  });

  afterAll(async () => {
    await prisma.post.deleteMany({ where: { id: { in: [...createdPostIds] } } });
    const pendingImageFiles = await prisma.postImage.findMany({
      where: { id: { in: [...createdImageIds] } },
      select: { storageKey: true },
    });
    await prisma.postImage.deleteMany({ where: { id: { in: [...createdImageIds] } } });
    await imagesService.removeFiles(pendingImageFiles.map(({ storageKey }) => storageKey));
    await prisma.anonymousIdentity.deleteMany({
      where: {
        id: { in: [...anonymousIdentityIds] },
        posts: { none: {} },
        postImages: { none: {} },
      },
    });
    await prisma.anonymousIdentity.deleteMany({
      where: {
        id: { notIn: [...preexistingAnonymousIds] },
        posts: { none: {} },
        postImages: { none: {} },
      },
    });
    await app.close();
    await rm(storageDirectory, { recursive: true, force: true });
  });

  it('uploads, serves, attaches and deletes a guest image with its post', async () => {
    const browser = request.agent(app.getHttpServer());
    const png = await sharp({
      create: { width: 32, height: 24, channels: 3, background: '#7c3aed' },
    })
      .png()
      .toBuffer();

    const uploaded = await browser
      .post('/api/post-images')
      .set('Origin', 'http://localhost:3000')
      .attach('image', png, { filename: 'acceptance.png', contentType: 'image/png' })
      .expect(201);

    createdImageIds.add(uploaded.body.id);
    expect(uploaded.headers['set-cookie']?.[0]).toContain('liftoff_anonymous_token=');
    expect(uploaded.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(uploaded.body).toMatchObject({
      mimeType: 'image/webp',
      width: 32,
      height: 24,
    });
    expect(uploaded.body.url).toBe(`http://localhost:4000/api/post-images/${uploaded.body.id}`);
    expect(uploaded.body.markdown).toContain(uploaded.body.url);

    await request(app.getHttpServer())
      .get(`/api/post-images/${uploaded.body.id}`)
      .expect('Content-Type', /image\/webp/)
      .expect(200);

    const postTitle = `E2E 正文图片 ${Date.now()}`;
    const created = await browser
      .post('/api/posts')
      .send({
        category: 'TUTORIAL_PRACTICE',
        contentMarkdown: `${postTitle}\n\n图片验收\n\n${uploaded.body.markdown}`,
        tags: ['正文图片'],
      })
      .expect(201);
    createdPostIds.add(created.body.id);

    const stored = await prisma.postImage.findUniqueOrThrow({
      where: { id: uploaded.body.id },
      select: { postId: true, anonymousIdentityId: true, uploaderUserId: true },
    });
    expect(stored).toMatchObject({ postId: created.body.id, uploaderUserId: null });
    expect(stored.anonymousIdentityId).toBeTruthy();
    anonymousIdentityIds.add(stored.anonymousIdentityId!);

    await browser
      .delete(`/api/posts/${created.body.slug}`)
      .set('Origin', 'http://localhost:3000')
      .expect(200);
    createdPostIds.delete(created.body.id);
    await expect(
      prisma.postImage.findUnique({ where: { id: uploaded.body.id } }),
    ).resolves.toBeNull();
    createdImageIds.delete(uploaded.body.id);
    await request(app.getHttpServer()).get(`/api/post-images/${uploaded.body.id}`).expect(404);
  });

  it('rejects invalid files, foreign origins and cross-author image reuse', async () => {
    const browserA = request.agent(app.getHttpServer());
    const browserB = request.agent(app.getHttpServer());
    await browserA
      .post('/api/post-images')
      .set('Origin', 'http://localhost:3000')
      .attach('image', Buffer.from('not-an-image'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
      .expect(400);
    await browserA
      .post('/api/post-images')
      .set('Origin', 'https://evil.example')
      .attach(
        'image',
        await sharp({ create: { width: 2, height: 2, channels: 3, background: '#000' } })
          .png()
          .toBuffer(),
        {
          filename: 'origin.png',
          contentType: 'image/png',
        },
      )
      .expect(403);

    const uploaded = await browserA
      .post('/api/post-images')
      .set('Origin', 'http://localhost:3000')
      .attach(
        'image',
        await sharp({ create: { width: 4, height: 4, channels: 3, background: '#fff' } })
          .png()
          .toBuffer(),
        {
          filename: 'owned.png',
          contentType: 'image/png',
        },
      )
      .expect(201);
    createdImageIds.add(uploaded.body.id);
    const stored = await prisma.postImage.findUniqueOrThrow({
      where: { id: uploaded.body.id },
      select: { anonymousIdentityId: true },
    });
    anonymousIdentityIds.add(stored.anonymousIdentityId!);

    const forgedTitle = `E2E 图片越权 ${Date.now()}`;
    await browserB
      .post('/api/posts')
      .send({
        category: 'AGENT',
        contentMarkdown: `${forgedTitle}\n\n${uploaded.body.markdown}`,
      })
      .expect(400);
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
