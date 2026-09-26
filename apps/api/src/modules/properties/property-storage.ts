import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  getR2Storage,
  isManagedObjectKey,
  isR2Enabled,
  keyFromPublicUrl,
} from '../../common/storage/r2-storage.service';

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

export function portalUploadDir(businessUnitId: string) {
  return path.join(uploadsRoot(), 'portal', businessUnitId);
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

export function portalImagePath(businessUnitId: string, filename: string) {
  return `/api/v1/files/portal/${businessUnitId}/${filename}`;
}

export function publicPortalImageUrl(businessUnitId: string, filename: string) {
  return `${apiPublicBaseUrl()}${portalImagePath(businessUnitId, filename)}`;
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

export async function savePropertyImage(
  file: MemoryUpload,
  propertyId: string,
) {
  const ext = MIME_TO_EXT.get(file.mimetype);
  if (!ext || !file.buffer?.length) {
    throw new Error('INVALID_IMAGE');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }
  const filename = `${randomUUID()}${ext}`;
  const key = `properties/${propertyId}/${filename}`;
  const url = await persistImage({
    buffer: file.buffer,
    contentType: file.mimetype,
    key,
    localDir: propertyUploadDir(propertyId),
    filename,
    localUrl: propertyImagePath(propertyId, filename),
  });
  return { filename, url };
}

export async function deleteLocalPropertyFile(propertyId: string, url: string) {
  if (await deleteRemoteObjectIfManaged(url, `properties/${propertyId}/`)) {
    return;
  }
  const filename = filenameFromLocalUrl(url, propertyId);
  if (!filename) return;
  const dest = path.join(propertyUploadDir(propertyId), filename);
  try {
    await unlink(dest);
  } catch {
    /* arquivo já ausente */
  }
}

function safeStorageId(id: string) {
  if (!id || id.length > 40 || !/^[A-Za-z0-9_-]+$/.test(id)) return null;
  return id;
}

export async function savePortalImage(
  file: MemoryUpload,
  businessUnitId: string,
) {
  const unitId = safeStorageId(businessUnitId);
  const ext = MIME_TO_EXT.get(file.mimetype);
  if (!unitId || !ext || !file.buffer?.length) {
    throw new Error('INVALID_IMAGE');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }
  const filename = `${randomUUID()}${ext}`;
  const key = `portal/${unitId}/${filename}`;
  const url = await persistImage({
    buffer: file.buffer,
    contentType: file.mimetype,
    key,
    localDir: portalUploadDir(unitId),
    filename,
    localUrl: publicPortalImageUrl(unitId, filename),
  });
  return { filename, url };
}

function localPortalPathPrefix(businessUnitId: string) {
  return `/api/v1/files/portal/${businessUnitId}/`;
}

export function filenameFromPortalUrl(url: string, businessUnitId: string) {
  const marker = localPortalPathPrefix(businessUnitId);
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const rest = url.slice(idx + marker.length).split(/[?#]/)[0] ?? '';
  return safeFilename(rest);
}

export async function deleteLocalPortalFile(
  businessUnitId: string,
  url: string,
) {
  const unitId = safeStorageId(businessUnitId);
  if (!unitId) return;
  if (await deleteRemoteObjectIfManaged(url, `portal/${unitId}/`)) return;
  const filename = filenameFromPortalUrl(url, unitId);
  if (!filename) return;
  try {
    await unlink(path.join(portalUploadDir(unitId), filename));
  } catch {
    /* arquivo já ausente */
  }
}

/**
 * R2_ENABLED=true envia o buffer ao Cloudflare R2 e devolve a URL pública.
 * Caso contrário grava em disco e devolve a URL local já usada pela API.
 */
async function persistImage(input: {
  buffer: Buffer;
  contentType: string;
  key: string;
  localDir: string;
  filename: string;
  localUrl: string;
}) {
  if (!isR2Enabled()) {
    await mkdir(input.localDir, { recursive: true });
    await writeFile(path.join(input.localDir, input.filename), input.buffer);
    return input.localUrl;
  }
  const stored = await getR2Storage().uploadFile(
    input.buffer,
    input.key,
    input.contentType,
  );
  return stored.url;
}

/**
 * Apaga objeto R2 quando a URL salva é a URL pública do bucket.
 * URLs locais legadas retornam false para o unlink em disco continuar.
 * Falha de rede não propaga: o registro no banco já foi removido.
 */
async function deleteRemoteObjectIfManaged(url: string, keyPrefix: string) {
  const key = keyFromPublicUrl(url);
  if (!key || !isManagedObjectKey(key) || !key.startsWith(keyPrefix)) {
    return false;
  }
  try {
    await getR2Storage().deleteFile(key);
  } catch {
    /* objeto já ausente ou R2 indisponível */
  }
  return true;
}

export function resolveLocalPortalFile(
  businessUnitId: string,
  filename: string,
) {
  const unitId = safeStorageId(businessUnitId);
  const safe = safeFilename(filename);
  if (!unitId || !safe) return null;
  const root = path.resolve(portalUploadDir(unitId));
  const dest = path.resolve(root, safe);
  if (dest !== root && !dest.startsWith(root + path.sep)) return null;
  if (!existsSync(dest)) return null;
  return dest;
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
