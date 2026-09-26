import { S3Client } from '@aws-sdk/client-s3';

import { LocalStorageProvider } from './local-storage.provider';
import { apiPublicBaseUrl, uploadsRoot } from './media-base';
import {
  S3StorageProvider,
  s3ObjectClientFromSdk,
  type S3ObjectClient,
} from './s3-storage.provider';
import type { StorageDriver, StorageProvider } from './storage-provider';

export class StorageUnavailableError extends Error {
  constructor(message = 'Storage de imagens indisponível') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

const providers = new Map<string, StorageProvider>();
let testOverride: StorageProvider | null = null;

export function storageDriverFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): StorageDriver {
  const raw = (env.STORAGE_DRIVER || env.STORAGE_PROVIDER || 'local')
    .trim()
    .toLowerCase();
  if (!raw || raw === 'local') return 'local';
  if (raw === 's3') return 's3';
  throw new StorageUnavailableError('STORAGE_DRIVER deve ser local ou s3');
}

export function setStorageProviderForTests(provider: StorageProvider | null) {
  testOverride = provider;
  providers.clear();
}

export function resetStorageProviderCache() {
  providers.clear();
}

function envSignature(driver: StorageDriver) {
  return [
    driver,
    uploadsRoot(),
    apiPublicBaseUrl(),
    process.env.STORAGE_BUCKET ?? '',
    process.env.STORAGE_REGION ?? '',
    process.env.STORAGE_PUBLIC_URL ?? '',
    process.env.STORAGE_ENDPOINT ?? '',
    process.env.STORAGE_ACCESS_KEY ?? '',
  ].join('|');
}

export function createLocalStorageProvider() {
  return new LocalStorageProvider(uploadsRoot(), apiPublicBaseUrl());
}

export function createS3StorageProvider(client?: S3ObjectClient) {
  const bucket = process.env.STORAGE_BUCKET?.trim();
  const region = process.env.STORAGE_REGION?.trim();
  const publicBaseUrl = process.env.STORAGE_PUBLIC_URL?.trim();
  if (!bucket || !region || !publicBaseUrl) {
    throw new StorageUnavailableError(
      'STORAGE_BUCKET, STORAGE_REGION e STORAGE_PUBLIC_URL são obrigatórios quando STORAGE_DRIVER=s3',
    );
  }

  const sender =
    client ??
    s3ObjectClientFromSdk(
      new S3Client({
        region,
        endpoint: process.env.STORAGE_ENDPOINT?.trim() || undefined,
        forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
        credentials: process.env.STORAGE_ACCESS_KEY?.trim()
          ? {
              accessKeyId: process.env.STORAGE_ACCESS_KEY.trim(),
              secretAccessKey: process.env.STORAGE_SECRET_KEY?.trim() ?? '',
            }
          : undefined,
      }),
    );

  return new S3StorageProvider(sender, bucket, publicBaseUrl);
}

export function providerFor(driver: StorageDriver): StorageProvider {
  if (testOverride && testOverride.driver === driver) return testOverride;
  const signature = envSignature(driver);
  const cached = providers.get(signature);
  if (cached) return cached;
  const provider =
    driver === 's3' ? createS3StorageProvider() : createLocalStorageProvider();
  providers.set(signature, provider);
  return provider;
}

export function getStorageProvider(): StorageProvider {
  if (testOverride) return testOverride;
  return providerFor(storageDriverFromEnv());
}
