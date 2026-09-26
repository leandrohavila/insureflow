import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

export type R2Config = {
  enabled: boolean;
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
};

export type StoredObject = {
  key: string;
  url: string;
};

const ENV_BY_FIELD = {
  bucket: 'R2_BUCKET',
  endpoint: 'R2_ENDPOINT',
  accessKeyId: 'R2_ACCESS_KEY_ID',
  secretAccessKey: 'R2_SECRET_ACCESS_KEY',
  publicUrl: 'R2_PUBLIC_URL',
} as const;

type RequiredR2Field = keyof typeof ENV_BY_FIELD;

export class R2StorageConfigError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Cloudflare R2 sem configuração: ${missing.join(', ')}`);
    this.name = 'R2StorageConfigError';
    this.missing = missing;
  }
}

function clean(value: string | undefined) {
  return value?.trim() ?? '';
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

/** Lê a configuração S3 do Cloudflare R2. `R2_ENABLED=true` liga o provider. */
export function readR2Config(): R2Config {
  return {
    enabled: clean(process.env.R2_ENABLED).toLowerCase() === 'true',
    bucket: clean(process.env.R2_BUCKET),
    endpoint: stripTrailingSlash(clean(process.env.R2_ENDPOINT)),
    accessKeyId: clean(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: clean(process.env.R2_SECRET_ACCESS_KEY),
    publicUrl: stripTrailingSlash(clean(process.env.R2_PUBLIC_URL)),
  };
}

export function isR2Enabled() {
  return readR2Config().enabled;
}

function requireR2Fields(config: R2Config, fields: RequiredR2Field[]) {
  const missing = fields
    .filter((field) => !config[field])
    .map((field) => ENV_BY_FIELD[field]);
  if (missing.length) throw new R2StorageConfigError(missing);
}

export function isManagedObjectKey(key: string) {
  return key.startsWith('properties/') || key.startsWith('portal/');
}

/**
 * Extrai a object key de uma URL pública do R2.
 * URLs locais (`/api/v1/files/...`) e hosts diferentes retornam null.
 */
export function keyFromPublicUrl(url: string, publicUrl?: string) {
  const baseRaw = publicUrl ?? readR2Config().publicUrl;
  if (!url || !baseRaw) return null;
  let parsed: URL;
  let base: URL;
  try {
    parsed = new URL(url);
    base = new URL(baseRaw.endsWith('/') ? baseRaw : `${baseRaw}/`);
  } catch {
    return null;
  }
  if (parsed.origin !== base.origin) return null;
  const basePath = base.pathname.replace(/\/$/, '');
  const prefix = `${basePath}/`;
  if (!parsed.pathname.startsWith(prefix)) return null;
  let key: string;
  try {
    key = decodeURIComponent(parsed.pathname.slice(prefix.length));
  } catch {
    return null;
  }
  const segments = key.split('/');
  if (!key || segments.some((part) => !part || part === '.' || part === '..')) {
    return null;
  }
  return key;
}

type R2ClientFactory = (config: R2Config) => S3Client;

/** Opções do cliente S3 usadas pelo Cloudflare R2 (`region: "auto"`). */
export function r2ClientOptions(config: R2Config) {
  return {
    region: 'auto' as const,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // O SDK recente envia checksums que o R2 ainda não implementa.
    requestChecksumCalculation: 'WHEN_REQUIRED' as const,
    responseChecksumValidation: 'WHEN_REQUIRED' as const,
  };
}

function defaultClientFactory(config: R2Config) {
  return new S3Client(r2ClientOptions(config));
}

export type ObjectStorage = {
  uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<StoredObject>;
  deleteFile(key: string): Promise<void>;
  buildPublicUrl(key: string): string;
};

let clientFactory: R2ClientFactory = defaultClientFactory;
let singleton: R2StorageService | null = null;
let storageOverride: ObjectStorage | null = null;

export function setR2ClientFactoryForTests(factory: R2ClientFactory | null) {
  clientFactory = factory ?? defaultClientFactory;
  singleton = null;
}

export function setR2StorageForTests(storage: ObjectStorage | null) {
  storageOverride = storage;
  if (!storage) singleton = null;
}

export function getR2Storage(): ObjectStorage {
  if (storageOverride) return storageOverride;
  singleton ??= new R2StorageService();
  return singleton;
}

@Injectable()
export class R2StorageService {
  private client: S3Client | null = null;
  private clientFingerprint = '';

  private clientFor(config: R2Config) {
    const fingerprint = `${config.endpoint}\0${config.accessKeyId}\0${config.secretAccessKey}`;
    if (!this.client || this.clientFingerprint !== fingerprint) {
      this.client = clientFactory(config);
      this.clientFingerprint = fingerprint;
    }
    return this.client;
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<StoredObject> {
    const config = readR2Config();
    requireR2Fields(config, [
      'bucket',
      'endpoint',
      'accessKeyId',
      'secretAccessKey',
      'publicUrl',
    ]);
    const normalized = this.normalizeKey(key);
    await this.clientFor(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: normalized,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return { key: normalized, url: this.buildPublicUrl(normalized) };
  }

  async deleteFile(key: string) {
    const config = readR2Config();
    requireR2Fields(config, [
      'bucket',
      'endpoint',
      'accessKeyId',
      'secretAccessKey',
    ]);
    const normalized = this.normalizeKey(key);
    await this.clientFor(config).send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: normalized,
      }),
    );
  }

  buildPublicUrl(key: string) {
    const config = readR2Config();
    requireR2Fields(config, ['publicUrl']);
    const normalized = this.normalizeKey(key);
    const encoded = normalized.split('/').map(encodeURIComponent).join('/');
    return `${config.publicUrl}/${encoded}`;
  }

  private normalizeKey(key: string) {
    const normalized = key.replace(/^\/+/, '');
    const segments = normalized.split('/');
    if (
      !normalized ||
      segments.some((part) => !part || part === '.' || part === '..')
    ) {
      throw new Error('INVALID_OBJECT_KEY');
    }
    return normalized;
  }
}
