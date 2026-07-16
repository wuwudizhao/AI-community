export const API_LISTEN_HOST = '0.0.0.0';

type ConfigReader = {
  get<T>(key: string): T | undefined;
  getOrThrow<T>(key: string): T;
};

export function resolveApiPort(config: ConfigReader) {
  return config.get<number>('PORT') ?? config.getOrThrow<number>('API_PORT');
}
