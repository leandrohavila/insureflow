import { existsSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  assertStorageKey,
  type StorageProvider,
  type StorageUpload,
} from './storage-provider';

export class LocalStorageProvider implements StorageProvider {
  readonly driver = 'local' as const;

  constructor(
    private readonly rootDir: string,
    private readonly publicBaseUrl: string,
  ) {}

  absolutePath(key: string) {
    assertStorageKey(key);
    const root = path.resolve(this.rootDir);
    const dest = path.resolve(root, key);
    if (dest !== root && !dest.startsWith(root + path.sep)) {
      throw new Error('INVALID_STORAGE_KEY');
    }
    return dest;
  }

  async upload(file: StorageUpload, key: string) {
    const dest = this.absolutePath(key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, file.buffer);
  }

  async delete(key: string) {
    const dest = this.absolutePath(key);
    try {
      await unlink(dest);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  exists(key: string) {
    try {
      return Promise.resolve(existsSync(this.absolutePath(key)));
    } catch {
      return Promise.resolve(false);
    }
  }

  getPublicUrl(key: string) {
    assertStorageKey(key);
    const property = key.match(/^properties\/([^/]+)\/([^/]+)$/);
    if (property) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/api/v1/files/properties/${property[1]}/${property[2]}`;
    }
    const portal = key.match(/^portal\/([^/]+)\/([^/]+)$/);
    if (portal) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/api/v1/files/portal/${portal[1]}/${portal[2]}`;
    }
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }
}
