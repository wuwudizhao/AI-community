type WebEnvironmentInput = {
  nodeEnv?: string;
  siteUrl?: string;
  apiUrl?: string;
};

export type WebEnvironment = {
  siteUrl: string;
  apiUrl: string;
};

const DEVELOPMENT_SITE_URL = 'http://localhost:3000';
const DEVELOPMENT_API_URL = 'http://localhost:4000/api';

export function resolveWebEnvironment(input: WebEnvironmentInput): WebEnvironment {
  const production = input.nodeEnv === 'production';
  const siteUrl = resolveUrl(
    'NEXT_PUBLIC_SITE_URL',
    input.siteUrl,
    production,
    DEVELOPMENT_SITE_URL,
  );
  const apiUrl = resolveUrl('NEXT_PUBLIC_API_URL', input.apiUrl, production, DEVELOPMENT_API_URL);

  const site = new URL(siteUrl);
  if (site.pathname !== '/' || site.search || site.hash) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an origin without a path, query, or hash');
  }

  const api = new URL(apiUrl);
  if (!api.pathname.replace(/\/+$/, '').endsWith('/api') || api.search || api.hash) {
    throw new Error('NEXT_PUBLIC_API_URL must include an /api path and no query or hash');
  }

  return { siteUrl, apiUrl };
}

function resolveUrl(
  name: string,
  value: string | undefined,
  production: boolean,
  fallback: string,
) {
  const candidate = value?.trim();
  if (!candidate) {
    if (production) throw new Error(`${name} is required in production`);
    return fallback;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${name} must use http or https`);
  }
  return parsed.toString().replace(/\/+$/, '');
}

export const webEnvironment = resolveWebEnvironment({
  nodeEnv: process.env.NODE_ENV,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
});
