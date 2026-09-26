import path from 'node:path';

/** Base pública da API (CRM/Portal/img src). Preferir API_PUBLIC_URL. */
export function apiPublicBaseUrl() {
  const fromEnv =
    process.env.API_PUBLIC_URL?.trim() ||
    process.env.API_BASE_URL?.trim() ||
    process.env.API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const port = process.env.PORT?.trim() || '4000';
  return `http://localhost:${port}`;
}

export function uploadsRoot() {
  return (
    process.env.PROPERTY_UPLOADS_DIR?.trim() ||
    path.resolve(process.cwd(), 'uploads')
  );
}
