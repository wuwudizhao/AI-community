import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports the application and database as healthy after a successful query', async () => {
    const database = { ping: jest.fn().mockResolvedValue(undefined) };
    const service = new HealthService(database);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.database.status).toBe('up');
    expect(result.database.latencyMs).toEqual(expect.any(Number));
  });

  it('reports a degraded state when PostgreSQL is unavailable', async () => {
    const database = { ping: jest.fn().mockRejectedValue(new Error('connection refused')) };
    const service = new HealthService(database);

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.database).toMatchObject({
      status: 'down',
      latencyMs: null,
      message: 'connection refused',
    });
  });
});
