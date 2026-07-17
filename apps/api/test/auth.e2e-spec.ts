/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { hashPassword, hashSecret } from '../src/auth/auth.crypto';
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

  it('registers an active user without creating an email verification token', async () => {
    const response = await register(email, username);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: '注册成功，现在可以登录' });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('developmentPreviewUrl');
    const user = await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } });
    expect(user.status).toBe('ACTIVE');
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(await prisma.emailVerificationToken.count({ where: { userId: user.id } })).toBe(0);
  });

  it('rejects duplicate email and duplicate username', async () => {
    await register(email.toUpperCase(), 'anothername', 409);
    await register('other@example.com', username, 409);
  });

  it('does not allow a legacy unverified user to login', async () => {
    await prisma.user.update({
      where: { emailNormalized: email },
      data: { status: 'PENDING_VERIFICATION', emailVerifiedAt: null },
    });
    await request(app.getHttpServer()).post('/api/auth/login').send({ email, password }).expect(403);
    await prisma.user.update({
      where: { emailNormalized: email },
      data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
    });
  });

  it('rejects an expired verification token', async () => {
    const expiredEmail = 'expired@example.com';
    const token = 'expired-verification-token-that-is-long-enough';
    const user = await createPendingUser(expiredEmail, 'expireduser');
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashSecret(token), expiresAt: new Date(0) },
    });
    await request(app.getHttpServer()).post('/api/auth/verify-email').send({ token }).expect(400);
  });

  it('keeps legacy email verification and token reuse protection available', async () => {
    const verificationEmail = 'other@example.com';
    const user = await createPendingUser(verificationEmail, 'verificationuser');
    const record = await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashSecret('initial-verification-token-that-is-long-enough'),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    // The raw token is only available from the development preview, so request a new one for this test.
    const resend = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: verificationEmail })
      .expect(200);
    const token = tokenFromPreview(resend.body.developmentPreviewUrl as string);
    expect(
      (await prisma.emailVerificationToken.findUniqueOrThrow({ where: { id: record.id } })).usedAt,
    ).not.toBeNull();
    await request(app.getHttpServer()).post('/api/auth/verify-email').send({ token }).expect(201);
    await request(app.getHttpServer()).post('/api/auth/verify-email').send({ token }).expect(400);
    const verifiedResend = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: verificationEmail })
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

  async function createPendingUser(targetEmail: string, targetUsername: string) {
    return prisma.user.create({
      data: {
        email: targetEmail,
        emailNormalized: targetEmail.toLowerCase(),
        passwordHash: await hashPassword(password),
        username: targetUsername,
        displayName: 'Legacy Pending User',
        status: 'PENDING_VERIFICATION',
        emailVerifiedAt: null,
      },
    });
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
