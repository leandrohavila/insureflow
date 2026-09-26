export type StorageDriver = 'local' | 's3';

export type StorageUpload = {
  buffer: Buffer;
  contentType?: string;
  size?: number;
};

export interface StorageProvider {
  readonly driver: StorageDriver;
  upload(file: StorageUpload, path: string): Promise<void>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getPublicUrl(path: string): string;
}

export function assertStorageKey(key: string) {
  if (!key || key.startsWith('/') || key.includes('\\') || key.includes('..')) {
    throw new Error('INVALID_STORAGE_KEY');
  }
  if (!/^[A-Za-z0-9._/-]+$/.test(key)) {
    throw new Error('INVALID_STORAGE_KEY');
  }
}

export function joinPublicUrl(base: string, key: string) {
  const root = base.replace(/\/$/, '');
  const encoded = key
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${root}/${encoded}`;
}
