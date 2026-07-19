import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client';
import type { User, UserStatus } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  ADMIN_PASSWORD_VERIFICATION_FAILED_MESSAGE,
  ADMIN_VERIFICATION_TTL_MS,
  AUTHENTICATION_FAILED_MESSAGE,
} from './auth.constants';
import {
  createSecret,
  hashPassword,
  hashSecret,
  normalizeEmail,
  verifyPassword,
} from './auth.crypto';
import type { ChangePasswordDto, LoginDto, RegisterDto } from './auth.dto';
import { buildVerificationUrl, MAIL_SERVICE, type MailService } from './mail/mail.service';
import { SYSTEM_GUEST_USER } from './system-users';

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  adminVerifiedUntil: string | null;
}

export interface AuthenticatedSession {
  id: string;
  adminVerifiedAt: Date | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(MAIL_SERVICE) private readonly mail: MailService,
  ) {}

  async register(input: RegisterDto) {
    const emailNormalized = normalizeEmail(input.email);
    const passwordHash = await hashPassword(input.password);

    try {
      await this.prisma.user.create({
        data: {
          email: input.email.trim(),
          emailNormalized,
          passwordHash,
          username: input.username,
          displayName: input.displayName.trim(),
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });

      return {
        message: '注册成功，现在可以登录',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : '';
        throw new ConflictException(
          target.includes('username')
            ? '用户名已被使用'
            : '邮箱已被注册；如尚未验证，请使用重新发送验证邮件',
        );
      }
      throw error;
    }
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashSecret(token) },
      include: { user: true },
    });
    if (!record) throw new BadRequestException('验证链接无效');
    if (record.usedAt) throw new BadRequestException('验证链接已使用');
    if (record.expiresAt <= new Date()) throw new BadRequestException('验证链接已过期');

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
      }),
    ]);
    return { message: '邮箱验证成功' };
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { emailNormalized: normalizeEmail(input.email) },
    });
    if (
      !user ||
      user.emailNormalized === SYSTEM_GUEST_USER.emailNormalized ||
      !(await verifyPassword(user.passwordHash, input.password))
    ) {
      throw new UnauthorizedException(AUTHENTICATION_FAILED_MESSAGE);
    }
    assertLoginAllowed(user.status, user.emailVerifiedAt);

    const secret = createSecret();
    const ttlHours = this.config.getOrThrow<number>('SESSION_TTL_HOURS');
    await this.prisma.$transaction([
      this.prisma.userSession.create({
        data: {
          userId: user.id,
          tokenHash: hashSecret(secret),
          expiresAt: new Date(Date.now() + ttlHours * 3_600_000),
        },
      }),
      this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    ]);
    return { secret, user: toPublicUser(user) };
  }

  async authenticate(secret?: string): Promise<PublicUser> {
    return (await this.authenticateSession(secret)).user;
  }

  async authenticateSession(
    secret?: string,
  ): Promise<{ user: PublicUser; session: AuthenticatedSession }> {
    if (!secret) throw new UnauthorizedException('未登录');
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash: hashSecret(secret) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('登录状态无效或已过期');
    }
    assertSessionUserAllowed(session.user.status);
    const adminVerifiedAt = isAdminVerificationValid(session.adminVerifiedAt)
      ? session.adminVerifiedAt
      : null;
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(), adminVerifiedAt },
    });
    return {
      user: toPublicUser(session.user, adminVerifiedAt),
      session: { id: session.id, adminVerifiedAt },
    };
  }

  async logout(secret?: string): Promise<void> {
    if (!secret) return;
    await this.prisma.userSession.updateMany({
      where: { tokenHash: hashSecret(secret), revokedAt: null },
      data: { revokedAt: new Date(), adminVerifiedAt: null },
    });
  }

  async changePassword(userId: string, input: ChangePasswordDto) {
    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestException('两次输入的新密码不一致');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user || !(await verifyPassword(user.passwordHash, input.currentPassword))) {
      throw new BadRequestException('当前密码不正确');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.userSession.deleteMany({ where: { userId } }),
    ]);

    return { message: '密码修改成功，请重新登录。' };
  }

  async verifyAdminPassword(userId: string, sessionId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, role: true },
    });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('仅管理员可以进行二次验证');
    }
    if (!(await verifyPassword(user.passwordHash, password))) {
      throw new BadRequestException(ADMIN_PASSWORD_VERIFICATION_FAILED_MESSAGE);
    }

    const adminVerifiedAt = new Date();
    const result = await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: adminVerifiedAt } },
      data: { adminVerifiedAt },
    });
    if (result.count !== 1) throw new UnauthorizedException('登录状态无效或已过期');

    return {
      message: '管理员身份验证成功',
      adminVerifiedUntil: adminVerificationExpiresAt(adminVerifiedAt).toISOString(),
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailNormalized: normalizeEmail(email) },
    });
    if (!user || user.emailVerifiedAt || user.status !== 'PENDING_VERIFICATION')
      return genericResend();

    const token = createSecret();
    const expiresInMinutes = this.config.getOrThrow<number>('EMAIL_VERIFICATION_TTL_MINUTES');
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashSecret(token),
          expiresAt: new Date(Date.now() + expiresInMinutes * 60_000),
        },
      }),
    ]);
    const verificationUrl = buildVerificationUrl(
      this.config.getOrThrow<string>('WEB_BASE_URL'),
      token,
    );
    const delivery = await this.mail.sendVerification({
      to: user.email,
      displayName: user.displayName,
      verificationUrl,
      expiresInMinutes,
    });
    return { ...genericResend(), ...delivery };
  }
}

export function assertLoginAllowed(status: UserStatus, verifiedAt: Date | null): void {
  if (status === 'PENDING_VERIFICATION' || !verifiedAt) {
    throw new ForbiddenException('请先完成邮箱验证');
  }
  assertSessionUserAllowed(status);
}

function assertSessionUserAllowed(status: UserStatus): void {
  if (status === 'SUSPENDED' || status === 'BANNED')
    throw new ForbiddenException('账户当前不可登录');
}

function toPublicUser(user: User, adminVerifiedAt: Date | null = null): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    adminVerifiedUntil: isAdminVerificationValid(adminVerifiedAt)
      ? adminVerificationExpiresAt(adminVerifiedAt!).toISOString()
      : null,
  };
}

export function isAdminVerificationValid(
  adminVerifiedAt: Date | null | undefined,
  now = new Date(),
): boolean {
  return Boolean(
    adminVerifiedAt && adminVerificationExpiresAt(adminVerifiedAt).getTime() >= now.getTime(),
  );
}

function adminVerificationExpiresAt(adminVerifiedAt: Date): Date {
  return new Date(adminVerifiedAt.getTime() + ADMIN_VERIFICATION_TTL_MS);
}

function genericResend() {
  return { message: '如果该邮箱存在且尚未验证，我们已发送新的验证邮件' };
}
