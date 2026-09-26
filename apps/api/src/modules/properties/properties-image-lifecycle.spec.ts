import { ServiceUnavailableException } from '@nestjs/common';

import { PropertiesService } from './properties.service';
import {
  deleteLocalPropertyFile,
  savePropertyImage,
  StorageUnavailableError,
} from './property-storage';

jest.mock('./property-storage', () => {
  const actual =
    jest.requireActual<typeof import('./property-storage')>(
      './property-storage',
    );
  return {
    ...actual,
    savePropertyImage: jest.fn(),
    deleteLocalPropertyFile: jest.fn(),
  };
});

const saveMock = savePropertyImage as jest.MockedFunction<
  typeof savePropertyImage
>;
const deleteMock = deleteLocalPropertyFile as jest.MockedFunction<
  typeof deleteLocalPropertyFile
>;

describe('ciclo de vida das imagens do imóvel', () => {
  const user = {
    sub: 'user-1',
    tenantId: 't1',
    tenantSlug: 'insureflow',
    email: 'a@b.c',
    roles: ['admin'],
    permissions: ['properties:manage'],
    currentBusinessUnitId: null,
  };

  const file = {
    originalname: 'fachada.jpg',
    mimetype: 'image/jpeg',
    size: 4,
    buffer: Buffer.from('foto'),
  };

  function createService() {
    const images = {
      nextSortOrder: jest.fn().mockResolvedValue(0),
      countByProperty: jest.fn().mockResolvedValue(0),
      clearCover: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn(),
      deleteOwned: jest.fn().mockResolvedValue({ id: 'img' }),
      findOwned: jest.fn(),
      findByProperty: jest.fn().mockResolvedValue([]),
    };
    const repo = {
      findById: jest.fn().mockResolvedValue({
        id: 'p1',
        tenantId: 't1',
        businessUnitId: 'bu1',
        slug: 'apto',
        title: 'Apto',
        price: 100,
        areaM2: null,
        images: [],
      }),
      delete: jest.fn().mockResolvedValue({ id: 'p1' }),
    };
    const buAccess = {
      fromUser: jest.fn().mockReturnValue(user),
      resolveIds: jest.fn().mockResolvedValue(null),
    };
    const service = new PropertiesService(
      repo as never,
      images as never,
      {} as never,
      buAccess as never,
      {} as never,
    );
    return { service, images, repo };
  }

  beforeEach(() => {
    saveMock.mockReset();
    deleteMock.mockReset();
  });

  it('falha no segundo upload apaga o objeto e a linha do primeiro', async () => {
    const { service, images } = createService();
    saveMock
      .mockResolvedValueOnce({
        filename: 'a.jpg',
        url: 'properties/p1/a.jpg',
        storageKey: 'properties/p1/a.jpg',
        storageDriver: 's3',
      })
      .mockRejectedValueOnce(new StorageUnavailableError('bucket fora'));
    images.create.mockResolvedValue({
      id: 'img-1',
      url: 'properties/p1/a.jpg',
      storageKey: 'properties/p1/a.jpg',
      storageDriver: 's3',
    });

    await expect(
      service.uploadImages(user, 'p1', [file, file]),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(images.deleteOwned).toHaveBeenCalledWith('t1', 'p1', 'img-1');
    expect(deleteMock).toHaveBeenCalledWith(
      'p1',
      'properties/p1/a.jpg',
      expect.objectContaining({ storageKey: 'properties/p1/a.jpg' }),
    );
  });

  it('exclusão de imagem apaga o storage antes da linha', async () => {
    const { service, images } = createService();
    const order: string[] = [];
    images.findOwned.mockResolvedValue({
      id: 'img-1',
      url: 'properties/p1/a.jpg',
      storageKey: 'properties/p1/a.jpg',
      storageDriver: 's3',
    });
    deleteMock.mockImplementation(() => {
      order.push('storage');
      return Promise.resolve();
    });
    images.deleteOwned.mockImplementation(() => {
      order.push('db');
      return Promise.resolve({ id: 'img-1' });
    });

    await service.removeImage(user, 'p1', 'img-1');
    expect(order).toEqual(['storage', 'db']);
  });

  it('falha do S3 na exclusão mantém a linha', async () => {
    const { service, images } = createService();
    images.findOwned.mockResolvedValue({
      id: 'img-1',
      url: 'properties/p1/a.jpg',
      storageKey: 'properties/p1/a.jpg',
      storageDriver: 's3',
    });
    deleteMock.mockRejectedValue(new StorageUnavailableError('AccessDenied'));

    await expect(
      service.removeImage(user, 'p1', 'img-1'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(images.deleteOwned).not.toHaveBeenCalled();
  });

  it('exclusão do imóvel apaga os objetos antes do registro', async () => {
    const { service, images, repo } = createService();
    const order: string[] = [];
    images.findByProperty.mockResolvedValue([
      {
        id: 'img-s3',
        url: 'properties/p1/a.jpg',
        storageKey: 'properties/p1/a.jpg',
        storageDriver: 's3',
      },
      {
        id: 'img-local',
        url: '/api/v1/files/properties/p1/b.jpg',
        storageKey: null,
        storageDriver: null,
      },
    ]);
    deleteMock.mockImplementation(() => {
      order.push('storage');
      return Promise.resolve();
    });
    repo.delete.mockImplementation(() => {
      order.push('property');
      return Promise.resolve({ id: 'p1' });
    });

    await service.remove(user, 'p1');
    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(order).toEqual(['storage', 'storage', 'property']);
  });

  it('falha ao apagar objeto impede a exclusão do imóvel', async () => {
    const { service, images, repo } = createService();
    images.findByProperty.mockResolvedValue([
      {
        id: 'img-s3',
        url: 'properties/p1/a.jpg',
        storageKey: 'properties/p1/a.jpg',
        storageDriver: 's3',
      },
    ]);
    deleteMock.mockRejectedValue(new StorageUnavailableError('timeout'));

    await expect(service.remove(user, 'p1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
