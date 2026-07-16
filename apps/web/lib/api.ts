import { webEnvironment } from './environment';

const API_URL = webEnvironment.apiUrl;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isMultipart = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: isMultipart ? init.headers : { 'Content-Type': 'application/json', ...init.headers },
  });
  const body = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join('；') : body.message;
    throw new ApiError(response.status, message ?? '请求失败，请稍后重试');
  }
  return body as T;
}
