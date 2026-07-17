/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MAIL_SERVICE, type MailService } from '../src/auth/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanTestUsers } from './e2e-cleanup';

describe('Mail failure recovery (e2e, PostgreSQL)', () => {
  let prisma: PrismaService;
  let app: Awaited<ReturnType<typeof createApp>>;
  let attempts = 0;
  const testEmails = ['mail-recovery@example.test'] as const;
  const mailSpy: MailService = {
    sendVerification() {
      attempts += 1;
      return Promise.resolve({});
    },
  };

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
    app = await createApp(mailSpy);
    prisma = app.get(PrismaService);
    await cleanTestUsers(prisma, testEmails);
  });
  afterAll(async () => {
    await cleanTestUsers(prisma, testEmails);
    await app.close();
  });

  it('registers an active account without invoking the configured mail service', async () => {
    const email = 'mail-recovery@example.test';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        username: 'mailrecovery',
        displayName: 'Mail Recovery',
        password: 'StrongPass123',
      })
      .expect(201);
    const user = await prisma.user.findUniqueOrThrow({ where: { emailNormalized: email } });
    expect(user.status).toBe('ACTIVE');
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(attempts).toBe(0);
    const tokens = await prisma.emailVerificationToken.findMany({
      where: { userId: user.id },
    });
    expect(tokens).toHaveLength(0);
  });
});

async function createApp(mail: MailService) {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MAIL_SERVICE)
    .useValue(mail)
    .compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
