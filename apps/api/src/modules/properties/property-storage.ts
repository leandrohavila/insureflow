import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'node:path';

import { LocalStorageProvider } from './storage/local-storage.provider';
import { apiPublicBaseUrl, uploadsRoot } from './storage/media-base';
import { isMissingS3Object } from './storage/s3-storage.provider';
import {
  getStorageProvider,
  providerFor,
  StorageUnavailableError,
} from './storage/storage-provider.factory';
import type { StorageDriver } from './storage/storage-provider';

export { apiPublicBaseUrl, uploadsRoot, StorageUnavailableError };
export type { StorageDriver };

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

export function propertyStorageKey(propertyId: string, filename: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(propertyId)) return null;
  const safe = safeFilename(filename);
  if (!safe) return null;
  return `properties/${propertyId}/${safe}`;
}

/** URL absoluta para resposta HTTP / <img src>, conforme STORAGE_DRIVER. */
export function publicImageUrl(propertyId: string, filename: string) {
  const key = propertyStorageKey(propertyId, filename);
  if (!key) {
    return `${apiPublicBaseUrl()}${propertyImagePath(propertyId, filename)}`;
  }
  return getStorageProvider().getPublicUrl(key);
}

export function resolveStoredPropertyImageUrl(image: {
  url: string;
  storageKey?: string | null;
  storageDriver?: string | null;
}) {
  if (image.storageDriver === 's3') {
    const key = image.storageKey?.trim() || image.url;
    return providerFor('s3').getPublicUrl(key);
  }
  return toAbsolutePropertyMediaUrl(image.url);
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

export function storageKeyFromPropertyUrl(url: string, propertyId: string) {
  const filename = filenameFromLocalUrl(url, propertyId);
  if (filename) return propertyStorageKey(propertyId, filename);
  const marker = `properties/${propertyId}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const key = (url.slice(idx).split(/[?#]/)[0] ?? '').replace(/\/$/, '');
  return propertyStorageKey(propertyId, key.slice(marker.length));
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
  const storageKey = propertyStorageKey(propertyId, filename);
  if (!storageKey) throw new Error('INVALID_IMAGE');

  const provider = getStorageProvider();
  try {
    await provider.upload(
      {
        buffer: file.buffer,
        contentType: file.mimetype,
        size: file.size,
      },
      storageKey,
    );
  } catch (error) {
    if (error instanceof StorageUnavailableError) throw error;
    if (provider.driver === 's3') throw new StorageUnavailableError();
    throw error;
  }

  return {
    filename,
    storageKey,
    storageDriver: provider.driver,
    // Local: path da API. S3: só a key; a URL pública sai na serialização.
    url:
      provider.driver === 's3'
        ? storageKey
        : propertyImagePath(propertyId, filename),
  };
}

function isMissingStorageError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  if ('code' in error && (error as { code?: string }).code === 'ENOENT') {
    return true;
  }
  return isMissingS3Object(error);
}

export async function deleteLocalPropertyFile(
  propertyId: string,
  url: string,
  stored?: { storageKey?: string | null; storageDriver?: string | null },
) {
  const driver: StorageDriver = stored?.storageDriver === 's3' ? 's3' : 'local';
  const key =
    stored?.storageKey?.trim() || storageKeyFromPropertyUrl(url, propertyId);
  if (!key) return;
  try {
    await providerFor(driver).delete(key);
  } catch (error) {
    if (isMissingStorageError(error)) return;
    if (error instanceof StorageUnavailableError) throw error;
    throw new StorageUnavailableError(
      error instanceof Error ? error.message : 'Falha ao apagar a imagem',
    );
  }
}

function safeStorageId(id: string) {
  if (!id || id.length > 40 || !/^[A-Za-z0-9_-]+$/.test(id)) return null;
  return id;
}

export function portalStorageKey(businessUnitId: string, filename: string) {
  const unitId = safeStorageId(businessUnitId);
  const safe = safeFilename(filename);
  if (!unitId || !safe) return null;
  return `portal/${unitId}/${safe}`;
}

export function storageKeyFromPortalUrl(url: string, businessUnitId: string) {
  const filename = filenameFromPortalUrl(url, businessUnitId);
  if (filename) return portalStorageKey(businessUnitId, filename);
  const base = process.env.STORAGE_PUBLIC_URL?.trim().replace(/\/$/, '');
  if (!base || !url.startsWith(`${base}/`)) return null;
  const raw = url.slice(base.length + 1).split(/[?#]/)[0] ?? '';
  let key = raw;
  try {
    key = raw
      .split('/')
      .map((part) => decodeURIComponent(part))
      .join('/');
  } catch {
    return null;
  }
  const prefix = `portal/${businessUnitId}/`;
  if (!key.startsWith(prefix)) return null;
  return portalStorageKey(businessUnitId, key.slice(prefix.length));
}

export async function savePortalImage(
  file: MemoryUpload,
  businessUnitId: string,
) {
  const ext = MIME_TO_EXT.get(file.mimetype);
  if (!ext || !file.buffer?.length) {
    throw new Error('INVALID_IMAGE');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }
  const filename = `${randomUUID()}${ext}`;
  const storageKey = portalStorageKey(businessUnitId, filename);
  if (!storageKey) throw new Error('INVALID_IMAGE');

  const provider = getStorageProvider();
  try {
    await provider.upload(
      {
        buffer: file.buffer,
        contentType: file.mimetype,
        size: file.size,
      },
      storageKey,
    );
  } catch (error) {
    if (error instanceof StorageUnavailableError) throw error;
    if (provider.driver === 's3') throw new StorageUnavailableError();
    throw error;
  }

  return {
    filename,
    storageKey,
    storageDriver: provider.driver,
    url: provider.getPublicUrl(storageKey),
  };
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
  const localName = filenameFromPortalUrl(url, businessUnitId);
  const key = storageKeyFromPortalUrl(url, businessUnitId);
  if (!key) return;
  const driver: StorageDriver =
    localName == null && process.env.STORAGE_PUBLIC_URL ? 's3' : 'local';
  try {
    await providerFor(driver).delete(key);
  } catch (error) {
    if (isMissingStorageError(error)) return;
    if (error instanceof StorageUnavailableError) throw error;
    throw new StorageUnavailableError(
      error instanceof Error ? error.message : 'Falha ao apagar a imagem',
    );
  }
}

export async function resolveLocalPortalFile(
  businessUnitId: string,
  filename: string,
) {
  const key = portalStorageKey(businessUnitId, filename);
  if (!key) return null;
  const local = providerFor('local');
  if (!(local instanceof LocalStorageProvider)) return null;
  if (!(await local.exists(key))) return null;
  return local.absolutePath(key);
}

export async function resolveLocalPropertyFile(
  propertyId: string,
  filename: string,
) {
  const key = propertyStorageKey(propertyId, filename);
  if (!key) return null;
  const local = providerFor('local');
  if (!(local instanceof LocalStorageProvider)) return null;
  if (!(await local.exists(key))) return null;
  return local.absolutePath(key);
}

export function openLocalPropertyFile(absolutePath: string) {
  return createReadStream(absolutePath);
}
