import { ForbiddenException } from '@nestjs/common';

import { AUTHENTICATION_FAILED_MESSAGE } from './auth.constants';
import {
  createSecret,
  hashPassword,
  hashSecret,
  normalizeEmail,
  verifyPassword,
} from './auth.crypto';
import { assertLoginAllowed } from './auth.service';

describe('authentication security helpers', () => {
  it('normalizes email addresses', () =>
    expect(normalizeEmail(' Builder@Example.COM ')).toBe('builder@example.com'));

  it('hashes and verifies passwords with no plaintext leakage', async () => {
    const hash = await hashPassword('StrongPass123');
    expect(hash).toContain('$argon2id$');
    expect(hash).not.toContain('StrongPass123');
    await expect(verifyPassword(hash, 'StrongPass123')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'WrongPass123')).resolves.toBe(false);
  });

  it('creates unpredictable secrets and deterministic storage hashes', () => {
    const first = createSecret();
    const second = createSecret();
    expect(first).not.toBe(second);
    expect(hashSecret(first)).toHaveLength(64);
    expect(hashSecret(first)).toBe(hashSecret(first));
    expect(hashSecret(first)).not.toContain(first);
  });

  it('rejects unverified users', () => {
    expect(() => assertLoginAllowed('PENDING_VERIFICATION', null)).toThrow(ForbiddenException);
  });

  it.each(['SUSPENDED', 'BANNED'] as const)('rejects %s users', (status) => {
    expect(() => assertLoginAllowed(status, new Date())).toThrow('账户当前不可登录');
  });

  it('uses one generic credential failure message', () => {
    expect(AUTHENTICATION_FAILED_MESSAGE).toBe('邮箱或密码不正确');
  });
});
