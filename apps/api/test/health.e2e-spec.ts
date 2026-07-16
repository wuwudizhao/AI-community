import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { HealthController } from '../src/health/health.controller';
import { HealthService } from '../src/health/health.service';

describe('Health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            check: jest.fn().mockResolvedValue({
              status: 'ok',
              service: 'liftoff-api',
              timestamp: '2026-07-12T00:00:00.000Z',
              uptimeSeconds: 1,
              database: { status: 'up', latencyMs: 1 },
            }),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => app.close());

  it('GET /api/health returns structured readiness', async () => {
    const server = app.getHttpServer() as Server;

    await request(server)
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          status: 'ok',
          service: 'liftoff-api',
          database: { status: 'up', latencyMs: 1 },
        });
      });
  });
});
