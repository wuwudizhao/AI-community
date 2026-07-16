import { z } from 'zod';

export const apiEnvironmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
    DATABASE_URL: z.string().url().startsWith('postgresql://'),
    WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
    WEB_BASE_URL: z.string().url().default('http://localhost:3000'),
    AUTH_COOKIE_NAME: z.string().min(1).default('liftoff_session'),
    ALLOW_GUEST_POSTING: z
      .union([z.boolean(), z.enum(['true', 'false']).transform((value) => value === 'true')])
      .default(true),
    POST_IMAGE_STORAGE_DIR: z.string().min(1).default('storage/post-images'),
    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
    EMAIL_VERIFICATION_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
    MAIL_PROVIDER: z.enum(['resend']).optional(),
    MAIL_API_KEY: z.string().min(1).optional(),
    MAIL_FROM_ADDRESS: z.string().email().optional(),
    MAIL_FROM_NAME: z.string().min(1).max(80).default('Liftoff'),
    MAIL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(10000),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== 'production') return;
    for (const key of ['MAIL_PROVIDER', 'MAIL_API_KEY', 'MAIL_FROM_ADDRESS'] as const) {
      if (!value[key])
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required in production`,
        });
    }
  });

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;
