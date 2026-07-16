import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';

import { PrismaService } from '../prisma/prisma.service';

export const ANONYMOUS_COOKIE_NAME = 'liftoff_anonymous_token';
const ANONYMOUS_COOKIE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1_000;

@Injectable()
export class AnonymousIdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getOrCreate(request: Request, response: Response) {
    const existing = await this.findExisting(request);
    if (existing) return existing;

    const newToken = randomBytes(32).toString('base64url');
    const identity = await this.prisma.anonymousIdentity.create({
      data: { tokenHash: hashAnonymousToken(newToken) },
      select: { id: true, displayName: true },
    });
    response.cookie(ANONYMOUS_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: ANONYMOUS_COOKIE_MAX_AGE_MS,
      secure: this.config.get<string>('NODE_ENV') === 'production',
    });
    return identity;
  }

  async findExisting(request: Request) {
    const token = request.cookies?.[ANONYMOUS_COOKIE_NAME] as string | undefined;
    if (token && isValidAnonymousToken(token)) {
      const identity = await this.prisma.anonymousIdentity.findUnique({
        where: { tokenHash: hashAnonymousToken(token) },
        select: { id: true, displayName: true },
      });
      if (identity) {
        await this.prisma.anonymousIdentity.update({
          where: { id: identity.id },
          data: { lastSeenAt: new Date() },
        });
        return identity;
      }
    }
    return null;
  }
}

export function hashAnonymousToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isValidAnonymousToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
