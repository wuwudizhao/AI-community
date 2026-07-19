import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/session-auth.guard';
import { isAdminVerificationValid } from '../auth/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('仅管理员可以访问此资源');
    }
    if (!isAdminVerificationValid(request.session?.adminVerifiedAt)) {
      throw new ForbiddenException('管理员二次验证已过期或尚未完成');
    }
    return true;
  }
}
