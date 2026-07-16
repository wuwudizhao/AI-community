import { z } from 'zod';

const productionRequiredKeys = [
  'API_PUBLIC_URL',
  'DATABASE_URL',
  'WEB_ORIGIN',
  'WEB_BASE_URL',
  'POST_IMAGE_STORAGE_DIR',
  'MAIL_PROVIDER',
  'MAIL_API_KEY',
  'MAIL_FROM_ADDRESS',
  'MAIL_FROM_NAME',
] as const;

function isOrigin(value: string) {
  const url = new URL(value);
  return url.pathname === '/' && !url.search && !url.hash;
}

export const apiEnvironmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).optional(),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    API_PUBLIC_URL: z.string().url().optional(),
    DATABASE_URL: z
      .string()
      .url()
      .regex(/^postgres(?:ql)?:\/\//),
    WEB_ORIGIN: z.string().url().optional(),
    WEB_BASE_URL: z.string().url().optional(),
    AUTH_COOKIE_NAME: z.string().min(1).default('liftoff_session'),
    ALLOW_GUEST_POSTING: z
      .union([z.boolean(), z.enum(['true', 'false']).transform((value) => value === 'true')])
      .default(true),
    POST_IMAGE_STORAGE_DIR: z.string().min(1).optional(),
    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
    EMAIL_VERIFICATION_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
    MAIL_PROVIDER: z.enum(['resend']).optional(),
    MAIL_API_KEY: z.string().min(1).optional(),
    MAIL_FROM_ADDRESS: z.string().email().optional(),
    MAIL_FROM_NAME: z.string().min(1).max(80).optional(),
    MAIL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(10000),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== 'production') return;
    for (const key of productionRequiredKeys) {
      if (!value[key])
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required in production`,
        });
    }

    if (
      value.API_PUBLIC_URL &&
      (!isOrigin(value.API_PUBLIC_URL) || value.API_PUBLIC_URL.endsWith('/'))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['API_PUBLIC_URL'],
        message: 'API_PUBLIC_URL must be an origin without /api or a trailing slash',
      });
    }
    for (const key of ['WEB_ORIGIN', 'WEB_BASE_URL'] as const) {
      const url = value[key];
      if (url && (!isOrigin(url) || url.endsWith('/'))) {
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} must be an origin without a trailing slash`,
        });
      }
    }
    if (value.POST_IMAGE_STORAGE_DIR && !value.POST_IMAGE_STORAGE_DIR.startsWith('/')) {
      context.addIssue({
        code: 'custom',
        path: ['POST_IMAGE_STORAGE_DIR'],
        message: 'POST_IMAGE_STORAGE_DIR must be an absolute production path',
      });
    }
  })
  .transform((value) => ({
    ...value,
    API_PUBLIC_URL: value.API_PUBLIC_URL ?? 'http://localhost:4000',
    WEB_ORIGIN: value.WEB_ORIGIN ?? 'http://localhost:3000',
    WEB_BASE_URL: value.WEB_BASE_URL ?? 'http://localhost:3000',
    POST_IMAGE_STORAGE_DIR: value.POST_IMAGE_STORAGE_DIR ?? 'storage/post-images',
    MAIL_FROM_NAME: value.MAIL_FROM_NAME ?? 'Liftoff',
  }));

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;
