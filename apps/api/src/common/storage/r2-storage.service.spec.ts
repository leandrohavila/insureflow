import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import {
  R2StorageConfigError,
  R2StorageService,
  isManagedObjectKey,
  isR2Enabled,
  keyFromPublicUrl,
  r2ClientOptions,
  readR2Config,
  setR2ClientFactoryForTests,
} from './r2-storage.service';

describe('r2-storage.service', () => {
  const envKeys = [
    'R2_ENABLED',
    'R2_BUCKET',
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_PUBLIC_URL',
  ] as const;
  const previous = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const key of envKeys) previous.set(key, process.env[key]);
  });

  afterEach(() => {
    for (const key of envKeys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    setR2ClientFactoryForTests(null);
  });

  it('lê a flag e as credenciais do ambiente', () => {
    process.env.R2_ENABLED = 'true';
    process.env.R2_BUCKET = ' imoveis ';
    process.env.R2_ENDPOINT = 'https://acct.r2.cloudflarestorage.com/';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_PUBLIC_URL = 'https://cdn.example/media/';
    expect(isR2Enabled()).toBe(true);
    expect(readR2Config()).toMatchObject({
      enabled: true,
      bucket: 'imoveis',
      endpoint: 'https://acct.r2.cloudflarestorage.com',
      publicUrl: 'https://cdn.example/media',
    });
  });

  it('trata flag ausente ou falsa como armazenamento local', () => {
    delete process.env.R2_ENABLED;
    expect(isR2Enabled()).toBe(false);
    process.env.R2_ENABLED = 'false';
    expect(isR2Enabled()).toBe(false);
  });

  it('monta o cliente com region auto e o endpoint do ambiente', () => {
    const options = r2ClientOptions({
      enabled: true,
      bucket: 'imoveis',
      endpoint: 'https://acct.r2.cloudflarestorage.com',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      publicUrl: 'https://cdn.example',
    });
    expect(options.region).toBe('auto');
    expect(options.endpoint).toBe('https://acct.r2.cloudflarestorage.com');
    expect(options.credentials).toEqual({
      accessKeyId: 'key',
      secretAccessKey: 'secret',
    });
  });

  it('uploadFile envia o objeto e devolve a URL pública', async () => {
    process.env.R2_BUCKET = 'imoveis';
    process.env.R2_ENDPOINT = 'https://acct.r2.cloudflarestorage.com';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_PUBLIC_URL = 'https://cdn.example';
    const sent: unknown[] = [];
    setR2ClientFactoryForTests(
      () =>
        ({
          send: (command: unknown) => {
            sent.push(command);
            return Promise.resolve({});
          },
        }) as S3Client,
    );
    const service = new R2StorageService();
    const stored = await service.uploadFile(
      Buffer.from('png'),
      '/properties/p1/a.png',
      'image/png',
    );
    expect(stored).toEqual({
      key: 'properties/p1/a.png',
      url: 'https://cdn.example/properties/p1/a.png',
    });
    expect(sent[0]).toBeInstanceOf(PutObjectCommand);
    expect((sent[0] as PutObjectCommand).input).toMatchObject({
      Bucket: 'imoveis',
      Key: 'properties/p1/a.png',
      ContentType: 'image/png',
    });
    await service.deleteFile('properties/p1/a.png');
    expect(sent[1]).toBeInstanceOf(DeleteObjectCommand);
  });

  it('recusa upload quando a configuração está incompleta', async () => {
    delete process.env.R2_BUCKET;
    delete process.env.R2_ENDPOINT;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_PUBLIC_URL;
    const service = new R2StorageService();
    await expect(
      service.uploadFile(Buffer.from('x'), 'properties/p/a.png', 'image/png'),
    ).rejects.toBeInstanceOf(R2StorageConfigError);
  });

  it('buildPublicUrl e keyFromPublicUrl são inversos e ignoram URL local', () => {
    process.env.R2_PUBLIC_URL = 'https://cdn.example/media';
    const service = new R2StorageService();
    const url = service.buildPublicUrl('portal/bu1/foto.png');
    expect(url).toBe('https://cdn.example/media/portal/bu1/foto.png');
    expect(keyFromPublicUrl(url)).toBe('portal/bu1/foto.png');
    expect(keyFromPublicUrl(`${url}?v=1`)).toBe('portal/bu1/foto.png');
    expect(
      keyFromPublicUrl('https://api.example/api/v1/files/properties/p/a.png'),
    ).toBeNull();
    expect(
      keyFromPublicUrl('https://cdn.example/media/portal/../secret.png'),
    ).toBe('secret.png');
    expect(isManagedObjectKey('secret.png')).toBe(false);
    expect(isManagedObjectKey('properties/p/a.png')).toBe(true);
    expect(isManagedObjectKey('api/v1/files/properties/p/a.png')).toBe(false);
    expect(() => service.buildPublicUrl('portal/../secret.png')).toThrow(
      'INVALID_OBJECT_KEY',
    );
  });
});
