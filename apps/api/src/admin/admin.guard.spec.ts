import { ForbiddenException, type ExecutionContext } from '@nestjs/common';

import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows a recently verified ADMIN request', () => {
    expect(guard.canActivate(contextFor('ADMIN', new Date()))).toBe(true);
  });

  it('rejects a USER request with 403', () => {
    expect(() => guard.canActivate(contextFor('USER'))).toThrow(ForbiddenException);
  });

  it('rejects an ADMIN without secondary verification', () => {
    expect(() => guard.canActivate(contextFor('ADMIN'))).toThrow(ForbiddenException);
  });

  it('rejects an ADMIN whose secondary verification is older than 30 minutes', () => {
    const expired = new Date(Date.now() - 30 * 60_000 - 1);
    expect(() => guard.canActivate(contextFor('ADMIN', expired))).toThrow(ForbiddenException);
  });
});

function contextFor(role: 'USER' | 'ADMIN', adminVerifiedAt: Date | null = null) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { role }, session: { adminVerifiedAt } }),
    }),
  } as unknown as ExecutionContext;
}
