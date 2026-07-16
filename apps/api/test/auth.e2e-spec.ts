/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { hashSecret } from '../src/auth/auth.crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanTestUsers } from './e2e-cleanup';

describe('Authentication API (e2e, PostgreSQL)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  let prisma: PrismaService;
  const email = 'phase3@example.com';
  const username = 'phase3builder';
  const password = 'StrongPass123';
  const testEmails = [email, 'expired@example.com', 'other@example.com'] as const;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.API_PORT = '4000';
    process.env.WEB_ORIGIN = 'http://localhost:3000';
    process.env.WEB_BASE_URL = 'http://localhost:3000';
    process.env.AUTH_COOKIE_NAME = 'liftoff_session';
    process.env.SESSION_TTL_HOURS = '168';
    process.env.EMAIL_VERIFICATION_TTL_MINUTES = '60';
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await cleanTestUsers(prisma, testEmails);
  });

  afterAll(async () => {
    await cleanTestUsers(prisma, testEmails);
    await app.close();
  });

  it('rejects invalid registration input', () =>
    request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'bad', password: 'weak' })
      .expect(400));

  it('registers a pending user and returns a development mail preview', async () => {
    const response = await register(email, username);
    expect(response.status).toBe(201);
    expect(response.body.developmentPreviewUrl).toContain('/verify-email?token=');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate email and duplicate username', async () => {
    await register(email.toUpperCase(), 'anothername', 409);
    await register('other@example.com', username, 409);
  });

  it('does not allow an unverified user to login', () =>
    request(app.getHttpServer()).post('/api/auth/login').send({ email, password }).expect(403));

  it('rejects an expired verification token', async () => {
    const response = await register('expired@example.com', 'expireduser');
    const token = tokenFromPreview(response.body.developmentPreviewUrl as string);
    await prisma.emailVerificationToken.update({
      where: { tokenHash: hashSecret(token) },
      data: { expiresAt: new Date(0) },
    });
    await request(app.getHttpServer()).post('/api/auth/verify-email').send({ token }).expect(400);
  });

  it('verifies email and rejects token reuse', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } });
    const record = await prisma.emailVerificationToken.findFirstOrThrow({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    // The raw token is only available from the development preview, so request a new one for this test.
    const resend = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email })
      .expect(200);
    const token = tokenFromPreview(resend.body.developmentPreviewUrl as string);
    expect(record.tokenHash).not.toBe(token);
    expect(
      (await prisma.emailVerificationToken.findUniqueOrThrow({ where: { id: record.id } })).usedAt,
    ).not.toBeNull();
    await request(app.getHttpServer()).post('/api/auth/verify-email').send({ token }).expect(201);
    await request(app.getHttpServer()).post('/api/auth/verify-email').send({ token }).expect(400);
    const verifiedResend = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email })
      .expect(200);
    expect(verifiedResend.body).not.toHaveProperty('developmentPreviewUrl');
  });

  it('logs in, resolves /me, revokes on logout, and survives app restart', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ email, password }).expect(200);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body).toMatchObject({ email, username, status: 'ACTIVE' });
    expect(me.body).not.toHaveProperty('passwordHash');

    await app.close();
    app = await createTestApp();
    prisma = app.get(PrismaService);
    // supertest agent cookies belong to the old server object; the persisted session itself is verified in the database.
    const user = await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } });
    expect(await prisma.userSession.count({ where: { userId: user.id, revokedAt: null } })).toBe(1);

    const freshAgent = request.agent(app.getHttpServer());
    const login = await freshAgent.post('/api/auth/login').send({ email, password }).expect(200);
    expect(login.headers['set-cookie']?.[0]).toContain('HttpOnly');
    await freshAgent.get('/api/auth/me').expect(200);
    await freshAgent.post('/api/auth/logout').send({}).expect(200);
    await freshAgent.get('/api/auth/me').expect(401);
  });

  it.each(['SUSPENDED', 'BANNED'] as const)('rejects a %s user login', async (status) => {
    await prisma.user.update({ where: { emailNormalized: email }, data: { status } });
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(403);
    await prisma.user.update({ where: { emailNormalized: email }, data: { status: 'ACTIVE' } });
  });

  function register(targetEmail: string, targetUsername: string, expected = 201) {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: targetEmail,
        username: targetUsername,
        displayName: 'Phase 3 Builder',
        password,
      })
      .expect(expected);
  }
});

async function createTestApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

function tokenFromPreview(url: string): string {
  return new URL(url).searchParams.get('token') ?? '';
}
