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

export function publicImageUrl(propertyId: string, filename: string) {
  return `/api/v1/files/properties/${propertyId}/${filename}`;
}

export function isLocalPropertyUrl(url: string, propertyId: string) {
  return url.startsWith(`/api/v1/files/properties/${propertyId}/`);
}

export function filenameFromLocalUrl(url: string, propertyId: string) {
  if (!isLocalPropertyUrl(url, propertyId)) return null;
  return url.slice(`/api/v1/files/properties/${propertyId}/`.length);
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
  return { filename, url: publicImageUrl(propertyId, filename) };
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
