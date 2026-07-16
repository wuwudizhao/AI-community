import { describe, expect, it } from 'vitest';

import { apiEnvironmentSchema } from './index';

describe('apiEnvironmentSchema', () => {
  it('accepts a valid PostgreSQL configuration and applies defaults', () => {
    const result = apiEnvironmentSchema.parse({
      DATABASE_URL: 'postgresql://liftoff:password@localhost:5432/liftoff',
    });

    expect(result).toMatchObject({
      NODE_ENV: 'development',
      API_PORT: 4000,
      WEB_ORIGIN: 'http://localhost:3000',
      ALLOW_GUEST_POSTING: true,
    });
  });

  it('parses the guest posting feature switch', () => {
    expect(
      apiEnvironmentSchema.parse({
        DATABASE_URL: 'postgresql://liftoff:password@localhost:5432/liftoff',
        ALLOW_GUEST_POSTING: 'false',
      }).ALLOW_GUEST_POSTING,
    ).toBe(false);
  });

  it('rejects a non-PostgreSQL database URL', () => {
    expect(() =>
      apiEnvironmentSchema.parse({ DATABASE_URL: 'mysql://localhost/liftoff' }),
    ).toThrow();
  });

  it('requires complete Resend configuration in production', () => {
    expect(() =>
      apiEnvironmentSchema.parse({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://liftoff:password@localhost:5432/liftoff',
      }),
    ).toThrow();
    expect(
      apiEnvironmentSchema.parse({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://liftoff:password@localhost:5432/liftoff',
        MAIL_PROVIDER: 'resend',
        MAIL_API_KEY: 'not-a-real-key',
        MAIL_FROM_ADDRESS: 'mail@example.test',
      }).MAIL_FROM_NAME,
    ).toBe('Liftoff');
  });
});
