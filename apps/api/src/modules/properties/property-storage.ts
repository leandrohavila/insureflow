import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MIME_TO_EXT = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 12;

export type MemoryUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

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

export function propertyUploadDir(propertyId: string) {
  return path.join(uploadsRoot(), 'properties', propertyId);
}

export function isAllowedImageMime(mime: string) {
  return MIME_TO_EXT.has(mime);
}

/** Path estável gravado no banco (independente do host). */
export function propertyImagePath(propertyId: string, filename: string) {
  return `/api/v1/files/properties/${propertyId}/${filename}`;
}

/** URL absoluta para resposta HTTP / <img src>. */
export function publicImageUrl(propertyId: string, filename: string) {
  return `${apiPublicBaseUrl()}${propertyImagePath(propertyId, filename)}`;
}

/**
 * Absolutiza URLs relativas de mídia da API.
 * URLs http(s) externas permanecem intactas.
 */
export function toAbsolutePropertyMediaUrl(url: string) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const pathPart = url.startsWith('/') ? url : `/${url}`;
  return `${apiPublicBaseUrl()}${pathPart}`;
}

function localPropertyPathPrefix(propertyId: string) {
  return `/api/v1/files/properties/${propertyId}/`;
}

export function isLocalPropertyUrl(url: string, propertyId: string) {
  if (!url) return false;
  const marker = localPropertyPathPrefix(propertyId);
  try {
    if (/^https?:\/\//i.test(url)) {
      return new URL(url).pathname.startsWith(marker);
    }
  } catch {
    return false;
  }
  return url.startsWith(marker) || url.includes(marker);
}

export function filenameFromLocalUrl(url: string, propertyId: string) {
  if (!isLocalPropertyUrl(url, propertyId)) return null;
  const marker = localPropertyPathPrefix(propertyId);
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const rest = url.slice(idx + marker.length).split(/[?#]/)[0] ?? '';
  return safeFilename(rest);
}

export function safeFilename(name: string) {
  if (!name || name.includes('..') || /[\\/]/.test(name)) return null;
  const base = path.basename(name);
  if (base !== name) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(base)) return null;
  return base;
}

export function mimeFromFilename(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  return EXT_TO_MIME[ext] ?? 'application/octet-stream';
}

export async function savePropertyImage(file: MemoryUpload, propertyId: string) {
  const ext = MIME_TO_EXT.get(file.mimetype);
  if (!ext || !file.buffer?.length) {
    throw new Error('INVALID_IMAGE');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }
  const filename = `${randomUUID()}${ext}`;
  const dir = propertyUploadDir(propertyId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), file.buffer);
  // Persiste path relativo; serialização HTTP expõe URL absoluta.
  return { filename, url: propertyImagePath(propertyId, filename) };
}

export async function deleteLocalPropertyFile(propertyId: string, url: string) {
  const filename = filenameFromLocalUrl(url, propertyId);
  if (!filename) return;
  const dest = path.join(propertyUploadDir(propertyId), filename);
  try {
    await unlink(dest);
  } catch {
    /* arquivo já ausente */
  }
}

export function resolveLocalPropertyFile(propertyId: string, filename: string) {
  const safe = safeFilename(filename);
  if (!safe) return null;
  const root = path.resolve(propertyUploadDir(propertyId));
  const dest = path.resolve(root, safe);
  if (dest !== root && !dest.startsWith(root + path.sep)) return null;
  if (!existsSync(dest)) return null;
  return dest;
}

export function openLocalPropertyFile(absolutePath: string) {
  return createReadStream(absolutePath);
}
