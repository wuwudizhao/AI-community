import type { HealthResponse } from '@liftoff/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import { DATABASE_HEALTH_PROBE, type DatabaseHealthProbe } from '../prisma/database-health-probe';

@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE_HEALTH_PROBE) private readonly databaseHealthProbe: DatabaseHealthProbe,
  ) {}

  async check(): Promise<HealthResponse> {
    const startedAt = performance.now();

    try {
      await this.databaseHealthProbe.ping();

      return {
        status: 'ok',
        service: 'liftoff-api',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: { status: 'up', latencyMs: Math.round(performance.now() - startedAt) },
      };
    } catch (error) {
      return {
        status: 'degraded',
        service: 'liftoff-api',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: 'down',
          latencyMs: null,
          message: error instanceof Error ? error.message : 'Unknown database error',
        },
      };
    }
  }
}
