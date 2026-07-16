import { describe, expect, it } from 'vitest';

import { resolveWebEnvironment } from './environment';

describe('resolveWebEnvironment', () => {
  it('keeps localhost defaults in development', () => {
    expect(resolveWebEnvironment({ nodeEnv: 'development' })).toEqual({
      siteUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:4000/api',
    });
  });

  it.each(['siteUrl', 'apiUrl'] as const)('requires %s in production', (missing) => {
    const input = {
      nodeEnv: 'production',
      siteUrl: 'https://woyaoqifei.club',
      apiUrl: 'https://api.woyaoqifei.club/api',
      [missing]: undefined,
    };
    expect(() => resolveWebEnvironment(input)).toThrow(/required in production/);
  });

  it('normalizes trailing slashes', () => {
    expect(
      resolveWebEnvironment({
        nodeEnv: 'production',
        siteUrl: 'https://woyaoqifei.club/',
        apiUrl: 'https://api.woyaoqifei.club/api///',
      }),
    ).toEqual({
      siteUrl: 'https://woyaoqifei.club',
      apiUrl: 'https://api.woyaoqifei.club/api',
    });
  });

  it('requires the API URL to include /api', () => {
    expect(() =>
      resolveWebEnvironment({
        nodeEnv: 'production',
        siteUrl: 'https://woyaoqifei.club',
        apiUrl: 'https://api.woyaoqifei.club',
      }),
    ).toThrow(/include an \/api path/);
  });
});
