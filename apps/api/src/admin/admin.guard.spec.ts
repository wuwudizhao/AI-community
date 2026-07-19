import { ForbiddenException, type ExecutionContext } from '@nestjs/common';

import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows an ADMIN request', () => {
    expect(guard.canActivate(contextFor('ADMIN'))).toBe(true);
  });

  it('rejects a USER request with 403', () => {
    expect(() => guard.canActivate(contextFor('USER'))).toThrow(ForbiddenException);
  });
});

function contextFor(role: 'USER' | 'ADMIN') {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  } as unknown as ExecutionContext;
}
