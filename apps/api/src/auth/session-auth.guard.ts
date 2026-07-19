import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { AuthService, type AuthenticatedSession, type PublicUser } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user: PublicUser;
  session: AuthenticatedSession;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookieName = this.config.getOrThrow<string>('AUTH_COOKIE_NAME');
    const authenticated = await this.auth.authenticateSession(
      request.cookies?.[cookieName] as string | undefined,
    );
    request.user = authenticated.user;
    request.session = authenticated.session;
    if (request.user.status !== 'ACTIVE') throw new ForbiddenException('账户当前不允许发布内容');
    return true;
  }
}
