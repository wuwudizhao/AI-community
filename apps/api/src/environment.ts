import { apiEnvironmentSchema, type ApiEnvironment } from '@liftoff/validation';

export function validateEnvironment(config: Record<string, unknown>): ApiEnvironment {
  const result = apiEnvironmentSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Invalid API environment: ${result.error.message}`);
  }

  return result.data;
}
