import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import {
  assertStorageKey,
  joinPublicUrl,
  type StorageProvider,
  type StorageUpload,
} from './storage-provider';

export type S3ObjectClient = {
  putObject(input: {
    Bucket: string;
    Key: string;
    Body: Buffer;
    ContentType?: string;
  }): Promise<void>;
  deleteObject(input: { Bucket: string; Key: string }): Promise<void>;
  headObject(input: { Bucket: string; Key: string }): Promise<boolean>;
};

export function isMissingS3Object(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String(error.name) : '';
  if (name === 'NotFound' || name === 'NoSuchKey') return true;
  const status =
    '$metadata' in error
      ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode
      : undefined;
  return status === 404;
}

export function s3ObjectClientFromSdk(client: S3Client): S3ObjectClient {
  return {
    async putObject(input) {
      await client.send(new PutObjectCommand(input));
    },
    async deleteObject(input) {
      await client.send(new DeleteObjectCommand(input));
    },
    async headObject(input) {
      try {
        await client.send(new HeadObjectCommand(input));
        return true;
      } catch (error) {
        if (isMissingS3Object(error)) return false;
        throw error;
      }
    },
  };
}

export class S3StorageProvider implements StorageProvider {
  readonly driver = 's3' as const;

  constructor(
    private readonly client: S3ObjectClient,
    private readonly bucket: string,
    private readonly publicBaseUrl: string,
  ) {}

  async upload(file: StorageUpload, key: string) {
    assertStorageKey(key);
    await this.client.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.contentType,
    });
  }

  async delete(key: string) {
    assertStorageKey(key);
    await this.client.deleteObject({ Bucket: this.bucket, Key: key });
  }

  async exists(key: string) {
    assertStorageKey(key);
    return this.client.headObject({ Bucket: this.bucket, Key: key });
  }

  getPublicUrl(key: string) {
    assertStorageKey(key);
    return joinPublicUrl(this.publicBaseUrl, key);
  }
}
