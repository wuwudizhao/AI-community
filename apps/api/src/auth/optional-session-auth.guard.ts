import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { AuthService, type PublicUser } from './auth.service';

export interface OptionalAuthenticatedRequest extends Request {
  user: PublicUser | null;
}

@Injectable()
export class OptionalSessionAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OptionalAuthenticatedRequest>();
    const cookieName = this.config.getOrThrow<string>('AUTH_COOKIE_NAME');
    const secret = request.cookies?.[cookieName] as string | undefined;

    if (!secret) {
      request.user = null;
      return true;
    }

    try {
      request.user = await this.auth.authenticate(secret);
      if (request.user.status !== 'ACTIVE') {
        throw new ForbiddenException('账户当前不允许发布内容');
      }
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error;
      request.user = null;
    }
    return true;
  }
}
