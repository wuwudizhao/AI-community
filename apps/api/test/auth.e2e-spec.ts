/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
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
  const passwordChangeEmail = 'password-change@example.com';
  const newPassword = 'NewStrongPass456';
  const adminVerificationEmail = 'admin-verification@example.com';
  const verificationUserEmail = 'admin-verification-user@example.com';
  const adminVerificationSecret = 'admin-verification-primary-secret';
  const otherAdminSessionSecret = 'admin-verification-secondary-secret';
  const verificationUserSecret = 'admin-verification-user-secret';
  const testEmails = [
    email,
    'expired@example.com',
    'other@example.com',
    passwordChangeEmail,
    adminVerificationEmail,
    verificationUserEmail,
  ] as const;

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
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(403);
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

  describe('admin password verification', () => {
    let adminUserId: string;

    beforeEach(async () => {
      const passwordHash = await hashPassword(password);
      const [adminUser, regularUser] = await Promise.all([
        prisma.user.upsert({
          where: { emailNormalized: adminVerificationEmail },
          create: {
            email: adminVerificationEmail,
            emailNormalized: adminVerificationEmail,
            passwordHash,
            username: 'adminverification',
            displayName: 'Admin Verification',
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
          },
          update: { passwordHash, role: 'ADMIN', status: 'ACTIVE', emailVerifiedAt: new Date() },
        }),
        prisma.user.upsert({
          where: { emailNormalized: verificationUserEmail },
          create: {
            email: verificationUserEmail,
            emailNormalized: verificationUserEmail,
            passwordHash,
            username: 'adminverificationuser',
            displayName: 'Admin Verification User',
            role: 'USER',
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
          },
          update: { passwordHash, role: 'USER', status: 'ACTIVE', emailVerifiedAt: new Date() },
        }),
      ]);
      adminUserId = adminUser.id;
      await prisma.userSession.deleteMany({
        where: { userId: { in: [adminUser.id, regularUser.id] } },
      });
      await prisma.userSession.createMany({
        data: [
          sessionData(adminUser.id, adminVerificationSecret),
          sessionData(adminUser.id, otherAdminSessionSecret),
          sessionData(regularUser.id, verificationUserSecret),
        ],
      });
    });

    it('returns 401 without a community session', () =>
      request(app.getHttpServer())
        .post('/api/auth/verify-admin-password')
        .send({ password })
        .expect(401));

    it('returns 403 for a regular USER session', () =>
      verifyAdminPassword(verificationUserSecret, password).expect(403));

    it('rejects an incorrect ADMIN password with the unified message', async () => {
      const response = await verifyAdminPassword(adminVerificationSecret, 'WrongPass123').expect(
        400,
      );
      expect(response.body.message).toBe('密码不正确，请重新输入。');
    });

    it('marks only the current ADMIN session after a correct password', async () => {
      const response = await verifyAdminPassword(adminVerificationSecret, password).expect(200);
      expect(response.body).toMatchObject({
        message: '管理员身份验证成功',
        adminVerifiedUntil: expect.any(String),
      });

      const [currentSession, otherSession] = await Promise.all([
        sessionFor(adminVerificationSecret),
        sessionFor(otherAdminSessionSecret),
      ]);
      expect(currentSession.adminVerifiedAt).not.toBeNull();
      expect(otherSession.adminVerifiedAt).toBeNull();
      await authRequest('get', '/api/admin/dashboard', adminVerificationSecret).expect(200);
      await authRequest('get', '/api/admin/dashboard', otherAdminSessionSecret).expect(403);
    });

    it('rejects an ADMIN verification older than 30 minutes', async () => {
      await prisma.userSession.update({
        where: { tokenHash: hashSecret(adminVerificationSecret) },
        data: { adminVerifiedAt: new Date(Date.now() - 30 * 60_000 - 1) },
      });

      await authRequest('get', '/api/admin/dashboard', adminVerificationSecret).expect(403);
      const me = await authRequest('get', '/api/auth/me', adminVerificationSecret).expect(200);
      expect(me.body.adminVerifiedUntil).toBeNull();
      expect((await sessionFor(adminVerificationSecret)).adminVerifiedAt).toBeNull();
    });

    it('clears secondary verification when the session logs out', async () => {
      await verifyAdminPassword(adminVerificationSecret, password).expect(200);
      await authRequest('post', '/api/auth/logout', adminVerificationSecret).expect(200);

      const session = await sessionFor(adminVerificationSecret);
      expect(session.revokedAt).not.toBeNull();
      expect(session.adminVerifiedAt).toBeNull();
    });

    it('removes the verified session when the password changes', async () => {
      await verifyAdminPassword(adminVerificationSecret, password).expect(200);
      await authRequest('post', '/api/auth/change-password', adminVerificationSecret)
        .send({ currentPassword: password, newPassword, confirmPassword: newPassword })
        .expect(200);

      await authRequest('get', '/api/auth/me', adminVerificationSecret).expect(401);
      expect(await prisma.userSession.count({ where: { userId: adminUserId } })).toBe(0);
    });

    function verifyAdminPassword(secret: string, targetPassword: string) {
      return authRequest('post', '/api/auth/verify-admin-password', secret).send({
        password: targetPassword,
      });
    }

    function sessionFor(secret: string) {
      return prisma.userSession.findUniqueOrThrow({ where: { tokenHash: hashSecret(secret) } });
    }
  });

  describe('change password', () => {
    beforeEach(async () => {
      const passwordHash = await hashPassword(password);
      await prisma.user.upsert({
        where: { emailNormalized: passwordChangeEmail },
        create: {
          email: passwordChangeEmail,
          emailNormalized: passwordChangeEmail,
          passwordHash,
          username: 'passwordchanger',
          displayName: 'Password Changer',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
        update: { passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date() },
      });
      const user = await prisma.user.findUniqueOrThrow({
        where: { emailNormalized: passwordChangeEmail },
      });
      await prisma.userSession.deleteMany({ where: { userId: user.id } });
    });

    it('changes the password, rejects bad credentials, and invalidates every session', async () => {
      const firstAgent = await loginAgent(passwordChangeEmail, password);
      const secondAgent = await loginAgent(passwordChangeEmail, password);

      const rejected = await firstAgent
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'WrongCurrent123',
          newPassword,
          confirmPassword: newPassword,
        })
        .expect(400);
      expect(rejected.body.message).toBe('当前密码不正确');
      await firstAgent.get('/api/auth/me').expect(200);

      const changed = await firstAgent
        .post('/api/auth/change-password')
        .send({ currentPassword: password, newPassword, confirmPassword: newPassword })
        .expect(200);
      expect(changed.body).toEqual({ message: '密码修改成功，请重新登录。' });

      await firstAgent.get('/api/auth/me').expect(401);
      await secondAgent.get('/api/auth/me').expect(401);
      const user = await prisma.user.findUniqueOrThrow({
        where: { emailNormalized: passwordChangeEmail },
      });
      expect(await prisma.userSession.count({ where: { userId: user.id } })).toBe(0);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: passwordChangeEmail, password })
        .expect(401);
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: passwordChangeEmail, password: newPassword })
        .expect(200);
    });
  });

  async function loginAgent(targetEmail: string, targetPassword: string) {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/login')
      .send({ email: targetEmail, password: targetPassword })
      .expect(200);
    return agent;
  }

  function authRequest(method: 'get' | 'post', path: string, secret: string) {
    return request(app.getHttpServer())[method](path).set('Cookie', `liftoff_session=${secret}`);
  }

  function sessionData(userId: string, secret: string) {
    return {
      userId,
      tokenHash: hashSecret(secret),
      expiresAt: new Date(Date.now() + 3_600_000),
    };
  }

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
