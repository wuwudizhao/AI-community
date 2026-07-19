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
import { AUTHENTICATION_FAILED_MESSAGE } from './auth.constants';
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
    if (!secret) throw new UnauthorizedException('未登录');
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash: hashSecret(secret) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('登录状态无效或已过期');
    }
    assertSessionUserAllowed(session.user.status);
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });
    return toPublicUser(session.user);
  }

  async logout(secret?: string): Promise<void> {
    if (!secret) return;
    await this.prisma.userSession.updateMany({
      where: { tokenHash: hashSecret(secret), revokedAt: null },
      data: { revokedAt: new Date() },
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

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  };
}

function genericResend() {
  return { message: '如果该邮箱存在且尚未验证，我们已发送新的验证邮件' };
}
