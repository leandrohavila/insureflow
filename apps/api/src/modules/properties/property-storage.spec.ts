import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  R2StorageConfigError,
  setR2StorageForTests,
} from '../../common/storage/r2-storage.service';
import {
  apiPublicBaseUrl,
  deleteLocalPortalFile,
  deleteLocalPropertyFile,
  filenameFromLocalUrl,
  filenameFromPortalUrl,
  isLocalPropertyUrl,
  portalImagePath,
  propertyImagePath,
  publicImageUrl,
  publicPortalImageUrl,
  resolveLocalPortalFile,
  resolveLocalPropertyFile,
  safeFilename,
  savePortalImage,
  savePropertyImage,
  toAbsolutePropertyMediaUrl,
  type MemoryUpload,
} from './property-storage';

describe('property-storage', () => {
  const prevPublic = process.env.API_PUBLIC_URL;
  const prevBase = process.env.API_BASE_URL;
  const prevApi = process.env.API_URL;
  const prevPort = process.env.PORT;
  const prevUploads = process.env.PROPERTY_UPLOADS_DIR;
  const r2Keys = [
    'R2_ENABLED',
    'R2_BUCKET',
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_PUBLIC_URL',
  ] as const;
  const prevR2 = new Map(r2Keys.map((key) => [key, process.env[key]]));

  afterEach(() => {
    process.env.API_PUBLIC_URL = prevPublic;
    process.env.API_BASE_URL = prevBase;
    process.env.API_URL = prevApi;
    process.env.PORT = prevPort;
    if (prevUploads === undefined) delete process.env.PROPERTY_UPLOADS_DIR;
    else process.env.PROPERTY_UPLOADS_DIR = prevUploads;
    for (const key of r2Keys) {
      const value = prevR2.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    setR2StorageForTests(null);
  });

  const png: MemoryUpload = {
    originalname: 'foto.png',
    mimetype: 'image/png',
    size: 4,
    buffer: Buffer.from([1, 2, 3, 4]),
  };

  it('rejeita filename com path traversal', () => {
    expect(safeFilename('../secret.jpg')).toBeNull();
    expect(safeFilename('a/b.jpg')).toBeNull();
    expect(safeFilename('ok-file.webp')).toBe('ok-file.webp');
  });

  it('resolveLocalPropertyFile não sai do diretório do imóvel', () => {
    expect(resolveLocalPropertyFile('p1', '..%2fetc%2fpasswd')).toBeNull();
    expect(resolveLocalPropertyFile('p1', '../other.jpg')).toBeNull();
  });

  it('publicImageUrl é absoluta com API_PUBLIC_URL', () => {
    process.env.API_PUBLIC_URL = 'https://api.example.com/';
    delete process.env.API_BASE_URL;
    delete process.env.API_URL;
    expect(apiPublicBaseUrl()).toBe('https://api.example.com');
    expect(publicImageUrl('p1', 'a.jpg')).toBe(
      'https://api.example.com/api/v1/files/properties/p1/a.jpg',
    );
    expect(propertyImagePath('p1', 'a.jpg')).toBe(
      '/api/v1/files/properties/p1/a.jpg',
    );
  });

  it('toAbsolutePropertyMediaUrl preserva http e absolutiza relativo', () => {
    process.env.API_PUBLIC_URL = 'http://localhost:4000';
    expect(
      toAbsolutePropertyMediaUrl('/api/v1/files/properties/p1/a.jpg'),
    ).toBe('http://localhost:4000/api/v1/files/properties/p1/a.jpg');
    expect(toAbsolutePropertyMediaUrl('https://cdn.example/x.jpg')).toBe(
      'https://cdn.example/x.jpg',
    );
  });

  it('portal image url fica no storage local e rejeita path traversal', () => {
    process.env.API_PUBLIC_URL = 'https://api.example.com';
    expect(portalImagePath('bu1', 'a.jpg')).toBe(
      '/api/v1/files/portal/bu1/a.jpg',
    );
    expect(publicPortalImageUrl('bu1', 'a.jpg')).toBe(
      'https://api.example.com/api/v1/files/portal/bu1/a.jpg',
    );
    expect(
      filenameFromPortalUrl(
        'https://api.example.com/api/v1/files/portal/bu1/a.jpg',
        'bu1',
      ),
    ).toBe('a.jpg');
    expect(
      filenameFromPortalUrl('https://cdn.example/x.jpg', 'bu1'),
    ).toBeNull();
    expect(resolveLocalPortalFile('../etc', 'passwd')).toBeNull();
    expect(resolveLocalPortalFile('bu1', '../secret.jpg')).toBeNull();
  });

  it('isLocalPropertyUrl / filenameFromLocalUrl aceitam relativo e absoluto', () => {
    process.env.API_PUBLIC_URL = 'http://localhost:4000';
    const relative = '/api/v1/files/properties/p1/foto.jpg';
    const absolute = `http://localhost:4000${relative}`;
    expect(isLocalPropertyUrl(relative, 'p1')).toBe(true);
    expect(isLocalPropertyUrl(absolute, 'p1')).toBe(true);
    expect(isLocalPropertyUrl('https://cdn.example/x.jpg', 'p1')).toBe(false);
    expect(filenameFromLocalUrl(relative, 'p1')).toBe('foto.jpg');
    expect(filenameFromLocalUrl(absolute, 'p1')).toBe('foto.jpg');
  });

  it('savePropertyImage grava no disco quando R2 está desligado', async () => {
    delete process.env.R2_ENABLED;
    const dir = await mkdtemp(path.join(os.tmpdir(), 'uploads-'));
    process.env.PROPERTY_UPLOADS_DIR = dir;
    try {
      const saved = await savePropertyImage(png, 'prop1');
      expect(saved.url).toBe(
        `/api/v1/files/properties/prop1/${saved.filename}`,
      );
      expect(saved.filename.endsWith('.png')).toBe(true);
      expect(
        existsSync(path.join(dir, 'properties', 'prop1', saved.filename)),
      ).toBe(true);
      await deleteLocalPropertyFile('prop1', saved.url);
      expect(
        existsSync(path.join(dir, 'properties', 'prop1', saved.filename)),
      ).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('savePropertyImage envia ao R2 e devolve a URL pública', async () => {
    process.env.R2_ENABLED = 'true';
    const dir = await mkdtemp(path.join(os.tmpdir(), 'uploads-'));
    process.env.PROPERTY_UPLOADS_DIR = dir;
    const uploaded: string[] = [];
    setR2StorageForTests({
      uploadFile: (buffer, key, contentType) => {
        uploaded.push(`${contentType}:${buffer.length}:${key}`);
        return Promise.resolve({
          key,
          url: `https://cdn.example/${key}`,
        });
      },
      deleteFile: () => Promise.resolve(),
      buildPublicUrl: (key) => `https://cdn.example/${key}`,
    });
    try {
      const saved = await savePropertyImage(png, 'prop1');
      expect(saved.url).toBe(
        `https://cdn.example/properties/prop1/${saved.filename}`,
      );
      expect(uploaded).toEqual([
        `image/png:4:properties/prop1/${saved.filename}`,
      ]);
      expect(
        existsSync(path.join(dir, 'properties', 'prop1', saved.filename)),
      ).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('savePortalImage usa R2 com a chave portal/{unidade}/{arquivo}', async () => {
    process.env.R2_ENABLED = 'true';
    process.env.API_PUBLIC_URL = 'https://api.example.com';
    let captured = '';
    setR2StorageForTests({
      uploadFile: (_buffer, key) => {
        captured = key;
        return Promise.resolve({
          key,
          url: `https://cdn.example/${key}`,
        });
      },
      deleteFile: () => Promise.resolve(),
      buildPublicUrl: (key) => `https://cdn.example/${key}`,
    });
    const saved = await savePortalImage(png, 'bu1');
    expect(captured).toBe(`portal/bu1/${saved.filename}`);
    expect(saved.url).toBe(`https://cdn.example/${captured}`);
  });

  it('savePortalImage mantém a URL da API quando R2 está desligado', async () => {
    process.env.R2_ENABLED = 'false';
    process.env.API_PUBLIC_URL = 'https://api.example.com';
    const dir = await mkdtemp(path.join(os.tmpdir(), 'uploads-'));
    process.env.PROPERTY_UPLOADS_DIR = dir;
    try {
      const saved = await savePortalImage(png, 'bu1');
      expect(saved.url).toBe(
        `https://api.example.com/api/v1/files/portal/bu1/${saved.filename}`,
      );
      expect(existsSync(path.join(dir, 'portal', 'bu1', saved.filename))).toBe(
        true,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('apaga objeto R2 e preserva o arquivo local legado', async () => {
    delete process.env.R2_ENABLED;
    process.env.R2_PUBLIC_URL = 'https://cdn.example';
    const dir = await mkdtemp(path.join(os.tmpdir(), 'uploads-'));
    process.env.PROPERTY_UPLOADS_DIR = dir;
    const removed: string[] = [];
    setR2StorageForTests({
      uploadFile: () => Promise.reject(new Error('unused')),
      deleteFile: (key) => {
        removed.push(key);
        return Promise.resolve();
      },
      buildPublicUrl: (key) => `https://cdn.example/${key}`,
    });
    try {
      const saved = await savePropertyImage(png, 'prop1');
      await deleteLocalPropertyFile(
        'prop1',
        'https://cdn.example/properties/prop1/remoto.png',
      );
      expect(removed).toEqual(['properties/prop1/remoto.png']);
      expect(
        existsSync(path.join(dir, 'properties', 'prop1', saved.filename)),
      ).toBe(true);
      await deleteLocalPortalFile(
        'bu1',
        'https://cdn.example/portal/bu1/banner.png',
      );
      expect(removed).toContain('portal/bu1/banner.png');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('não grava em disco se o R2 está ligado e incompleto', async () => {
    process.env.R2_ENABLED = 'true';
    delete process.env.R2_BUCKET;
    delete process.env.R2_ENDPOINT;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_PUBLIC_URL;
    const dir = await mkdtemp(path.join(os.tmpdir(), 'uploads-'));
    process.env.PROPERTY_UPLOADS_DIR = dir;
    try {
      await expect(savePropertyImage(png, 'prop1')).rejects.toBeInstanceOf(
        R2StorageConfigError,
      );
      expect(existsSync(path.join(dir, 'properties'))).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
