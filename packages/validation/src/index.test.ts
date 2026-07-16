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
      API_PUBLIC_URL: 'http://localhost:4000',
      WEB_ORIGIN: 'http://localhost:3000',
      POST_IMAGE_STORAGE_DIR: 'storage/post-images',
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

  it('accepts the postgres protocol used by Railway', () => {
    expect(
      apiEnvironmentSchema.parse({ DATABASE_URL: 'postgres://user:password@host:5432/liftoff' })
        .DATABASE_URL,
    ).toBe('postgres://user:password@host:5432/liftoff');
  });

  it('requires all deployment variables in production', () => {
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
        API_PUBLIC_URL: 'https://api.example.test',
        WEB_ORIGIN: 'https://example.test',
        WEB_BASE_URL: 'https://example.test',
        POST_IMAGE_STORAGE_DIR: '/data/post-images',
        MAIL_PROVIDER: 'resend',
        MAIL_API_KEY: 'not-a-real-key',
        MAIL_FROM_ADDRESS: 'mail@example.test',
        MAIL_FROM_NAME: 'Liftoff',
      }).MAIL_FROM_NAME,
    ).toBe('Liftoff');
  });

  it('rejects production origins with paths or trailing slashes', () => {
    expect(() =>
      apiEnvironmentSchema.parse({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://liftoff:password@localhost:5432/liftoff',
        API_PUBLIC_URL: 'https://api.example.test/api',
        WEB_ORIGIN: 'https://example.test/',
        WEB_BASE_URL: 'https://example.test',
        POST_IMAGE_STORAGE_DIR: '/data/post-images',
        MAIL_PROVIDER: 'resend',
        MAIL_API_KEY: 'not-a-real-key',
        MAIL_FROM_ADDRESS: 'mail@example.test',
        MAIL_FROM_NAME: 'Liftoff',
      }),
    ).toThrow();
  });

  it('rejects a relative image path in production', () => {
    expect(() =>
      apiEnvironmentSchema.parse({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://liftoff:password@localhost:5432/liftoff',
        API_PUBLIC_URL: 'https://api.example.test',
        WEB_ORIGIN: 'https://example.test',
        WEB_BASE_URL: 'https://example.test',
        POST_IMAGE_STORAGE_DIR: 'storage/post-images',
        MAIL_PROVIDER: 'resend',
        MAIL_API_KEY: 'not-a-real-key',
        MAIL_FROM_ADDRESS: 'mail@example.test',
        MAIL_FROM_NAME: 'Liftoff',
      }),
    ).toThrow();
  });
});
