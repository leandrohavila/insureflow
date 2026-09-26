import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider, type S3ObjectClient } from './s3-storage.provider';
import {
  createS3StorageProvider,
  resetStorageProviderCache,
  setStorageProviderForTests,
  storageDriverFromEnv,
} from './storage-provider.factory';
import {
  deleteLocalPropertyFile,
  publicImageUrl,
  resolveLocalPropertyFile,
  resolveStoredPropertyImageUrl,
  savePropertyImage,
} from '../property-storage';

describe('storage providers', () => {
  const prev: Record<string, string | undefined> = {};
  let dir: string;

  beforeEach(async () => {
    for (const key of [
      'STORAGE_DRIVER',
      'STORAGE_PROVIDER',
      'STORAGE_BUCKET',
      'STORAGE_REGION',
      'STORAGE_PUBLIC_URL',
      'STORAGE_ACCESS_KEY',
      'STORAGE_SECRET_KEY',
      'PROPERTY_UPLOADS_DIR',
      'API_PUBLIC_URL',
    ]) {
      prev[key] = process.env[key];
    }
    dir = await mkdtemp(path.join(tmpdir(), 'prop-storage-'));
    process.env.PROPERTY_UPLOADS_DIR = dir;
    process.env.API_PUBLIC_URL = 'https://api.example.com';
    delete process.env.STORAGE_DRIVER;
    delete process.env.STORAGE_PROVIDER;
    resetStorageProviderCache();
    setStorageProviderForTests(null);
  });

  afterEach(async () => {
    setStorageProviderForTests(null);
    resetStorageProviderCache();
    for (const [key, value] of Object.entries(prev)) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(dir, { recursive: true, force: true });
  });

  it('local grava, consulta, publica e apaga sem sair da pasta', async () => {
    const local = new LocalStorageProvider(dir, 'https://api.example.com');
    await local.upload(
      { buffer: Buffer.from('img'), contentType: 'image/jpeg' },
      'properties/p1/a.jpg',
    );
    expect(await local.exists('properties/p1/a.jpg')).toBe(true);
    expect(await readFile(path.join(dir, 'properties/p1/a.jpg'), 'utf8')).toBe(
      'img',
    );
    expect(local.getPublicUrl('properties/p1/a.jpg')).toBe(
      'https://api.example.com/api/v1/files/properties/p1/a.jpg',
    );
    await local.delete('properties/p1/a.jpg');
    expect(await local.exists('properties/p1/a.jpg')).toBe(false);
    await expect(local.exists('properties/../../etc/passwd')).resolves.toBe(
      false,
    );
    expect(() => local.getPublicUrl('../secret.jpg')).toThrow(
      'INVALID_STORAGE_KEY',
    );
  });

  it('s3 envia a key ao bucket e devolve a URL pública', async () => {
    const objects = new Map<string, Buffer>();
    const client: S3ObjectClient = {
      putObject(input) {
        objects.set(input.Key, input.Body);
        expect(input.Bucket).toBe('imoveis');
        expect(input.ContentType).toBe('image/webp');
        return Promise.resolve();
      },
      deleteObject(input) {
        objects.delete(input.Key);
        return Promise.resolve();
      },
      headObject(input) {
        return Promise.resolve(objects.has(input.Key));
      },
    };
    const s3 = new S3StorageProvider(
      client,
      'imoveis',
      'https://imoveis.s3.sa-east-1.amazonaws.com',
    );
    await s3.upload(
      { buffer: Buffer.from('webp'), contentType: 'image/webp' },
      'properties/p1/foto.webp',
    );
    expect(objects.has('properties/p1/foto.webp')).toBe(true);
    expect(await s3.exists('properties/p1/foto.webp')).toBe(true);
    expect(s3.getPublicUrl('properties/p1/foto.webp')).toBe(
      'https://imoveis.s3.sa-east-1.amazonaws.com/properties/p1/foto.webp',
    );
    await s3.delete('properties/p1/foto.webp');
    expect(await s3.exists('properties/p1/foto.webp')).toBe(false);
  });

  it('STORAGE_DRIVER=local mantém o path da API e o arquivo em disco', async () => {
    process.env.STORAGE_DRIVER = 'local';
    resetStorageProviderCache();
    const saved = await savePropertyImage(
      {
        originalname: 'fachada.png',
        mimetype: 'image/png',
        size: 3,
        buffer: Buffer.from('png'),
      },
      'prop1',
    );
    expect(saved.storageDriver).toBe('local');
    expect(saved.storageKey).toBe(`properties/prop1/${saved.filename}`);
    expect(saved.url).toBe(`/api/v1/files/properties/prop1/${saved.filename}`);
    expect(await resolveLocalPropertyFile('prop1', saved.filename)).toContain(
      path.join('properties', 'prop1', saved.filename),
    );
    expect(publicImageUrl('prop1', saved.filename)).toBe(
      `https://api.example.com/api/v1/files/properties/prop1/${saved.filename}`,
    );
  });

  it('STORAGE_DRIVER=s3 grava só a key e não usa o disco local', async () => {
    const objects = new Map<string, Buffer>();
    setStorageProviderForTests(
      new S3StorageProvider(
        {
          putObject(input) {
            objects.set(input.Key, input.Body);
            return Promise.resolve();
          },
          deleteObject(input) {
            objects.delete(input.Key);
            return Promise.resolve();
          },
          headObject(input) {
            return Promise.resolve(objects.has(input.Key));
          },
        },
        'imoveis',
        'https://cdn.example',
      ),
    );
    const saved = await savePropertyImage(
      {
        originalname: 'sala.jpg',
        mimetype: 'image/jpeg',
        size: 3,
        buffer: Buffer.from('jpg'),
      },
      'prop2',
    );
    expect(saved.storageDriver).toBe('s3');
    expect(saved.url).toBe(saved.storageKey);
    expect(saved.storageKey.startsWith('properties/prop2/')).toBe(true);
    expect(objects.has(saved.storageKey)).toBe(true);
    expect(await resolveLocalPropertyFile('prop2', saved.filename)).toBeNull();
    expect(
      resolveStoredPropertyImageUrl({
        url: saved.url,
        storageKey: saved.storageKey,
        storageDriver: 's3',
      }),
    ).toBe(`https://cdn.example/${saved.storageKey}`);
    await deleteLocalPropertyFile('prop2', saved.url, {
      storageKey: saved.storageKey,
      storageDriver: 's3',
    });
    expect(objects.has(saved.storageKey)).toBe(false);
  });

  it('registro antigo sem storage_driver continua na URL da API', () => {
    expect(storageDriverFromEnv()).toBe('local');
    expect(
      resolveStoredPropertyImageUrl({
        url: '/api/v1/files/properties/p1/antiga.jpg',
      }),
    ).toBe('https://api.example.com/api/v1/files/properties/p1/antiga.jpg');
    expect(
      resolveStoredPropertyImageUrl({
        url: 'https://cdn.externo/foto.jpg',
      }),
    ).toBe('https://cdn.externo/foto.jpg');
  });

  it('s3 sem bucket configurado falha ao criar o provider', () => {
    process.env.STORAGE_DRIVER = 's3';
    expect(() => createS3StorageProvider()).toThrow(/STORAGE_BUCKET/);
  });
});
