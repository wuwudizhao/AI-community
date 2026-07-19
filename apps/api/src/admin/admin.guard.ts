import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/session-auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('仅管理员可以访问此资源');
    }
    return true;
  }
}
