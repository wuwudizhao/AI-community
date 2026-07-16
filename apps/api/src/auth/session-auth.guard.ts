import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { AuthService, type PublicUser } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user: PublicUser;
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
    request.user = await this.auth.authenticate(
      request.cookies?.[cookieName] as string | undefined,
    );
    if (request.user.status !== 'ACTIVE') throw new ForbiddenException('账户当前不允许发布内容');
    return true;
  }
}
