import { API_LISTEN_HOST, resolveApiPort } from './server-config';

describe('server configuration', () => {
  it('prefers the Railway PORT value', () => {
    const config = {
      get: jest.fn().mockReturnValue(8080),
      getOrThrow: jest.fn().mockReturnValue(4000),
    };

    expect(resolveApiPort(config)).toBe(8080);
    expect(config.getOrThrow).not.toHaveBeenCalled();
  });

  it('falls back to API_PORT', () => {
    const config = {
      get: jest.fn().mockReturnValue(undefined),
      getOrThrow: jest.fn().mockReturnValue(4000),
    };

    expect(resolveApiPort(config)).toBe(4000);
  });

  it('listens on all Railway interfaces', () => {
    expect(API_LISTEN_HOST).toBe('0.0.0.0');
  });
});
