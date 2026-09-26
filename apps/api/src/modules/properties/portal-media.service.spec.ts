import { ServiceUnavailableException } from '@nestjs/common';

import { PortalConfigService } from './portal-config.service';
import {
  deleteLocalPortalFile,
  savePortalImage,
  StorageUnavailableError,
} from './property-storage';

jest.mock('./property-storage', () => {
  const actual =
    jest.requireActual<typeof import('./property-storage')>(
      './property-storage',
    );
  return {
    ...actual,
    savePortalImage: jest.fn(),
    deleteLocalPortalFile: jest.fn(),
  };
});

const saveMock = savePortalImage as jest.MockedFunction<typeof savePortalImage>;
const deleteMock = deleteLocalPortalFile as jest.MockedFunction<
  typeof deleteLocalPortalFile
>;

describe('mídia do portal', () => {
  const user = {
    sub: 'user-1',
    tenantId: 't1',
    tenantSlug: 'insureflow',
    email: 'a@b.c',
    roles: ['admin'],
    permissions: ['properties:manage'],
    currentBusinessUnitId: null,
  };

  function createService() {
    const prisma = {
      businessUnit: {
        findFirst: jest.fn().mockResolvedValue({ id: 'bu1' }),
      },
      portalConfig: {
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
      portalBanner: {
        findFirst: jest.fn(),
        delete: jest.fn().mockResolvedValue({ id: 'banner-1' }),
      },
    };
    const buAccess = {
      fromUser: jest.fn().mockReturnValue(user),
      resolveIds: jest.fn().mockResolvedValue(null),
    };
    const service = new PortalConfigService(
      prisma as never,
      buAccess as never,
      {} as never,
    );
    return { service, prisma };
  }

  beforeEach(() => {
    saveMock.mockReset();
    deleteMock.mockReset();
    deleteMock.mockResolvedValue(undefined);
  });

  it('troca de logo apaga o arquivo anterior depois do upload', async () => {
    const { service } = createService();
    const order: string[] = [];
    saveMock.mockImplementation(() => {
      order.push('upload');
      return Promise.resolve({
        filename: 'novo.png',
        url: 'https://cdn.example/portal/bu1/novo.png',
        storageKey: 'portal/bu1/novo.png',
        storageDriver: 's3' as const,
      });
    });
    deleteMock.mockImplementation(() => {
      order.push('delete');
      return Promise.resolve();
    });

    const result = await service.uploadMedia(
      user,
      'bu1',
      {
        originalname: 'logo.png',
        mimetype: 'image/png',
        size: 4,
        buffer: Buffer.from('logo'),
      },
      'https://cdn.example/portal/bu1/antigo.png',
    );
    expect(result.url).toBe('https://cdn.example/portal/bu1/novo.png');
    expect(order).toEqual(['upload', 'delete']);
  });

  it('falha ao apagar o arquivo anterior desfaz o upload novo', async () => {
    const { service } = createService();
    saveMock.mockResolvedValue({
      filename: 'novo.png',
      url: 'https://cdn.example/portal/bu1/novo.png',
      storageKey: 'portal/bu1/novo.png',
      storageDriver: 's3',
    });
    deleteMock
      .mockRejectedValueOnce(new StorageUnavailableError('negado'))
      .mockResolvedValueOnce(undefined);

    await expect(
      service.uploadMedia(
        user,
        'bu1',
        {
          originalname: 'logo.png',
          mimetype: 'image/png',
          size: 4,
          buffer: Buffer.from('logo'),
        },
        'https://cdn.example/portal/bu1/antigo.png',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(deleteMock).toHaveBeenLastCalledWith(
      'bu1',
      'https://cdn.example/portal/bu1/novo.png',
    );
  });

  it('exclusão de banner apaga o objeto antes da linha', async () => {
    const { service, prisma } = createService();
    const order: string[] = [];
    prisma.portalBanner.findFirst.mockResolvedValue({
      id: 'banner-1',
      tenantId: 't1',
      businessUnitId: 'bu1',
      image: 'https://cdn.example/portal/bu1/banner.jpg',
    });
    deleteMock.mockImplementation(() => {
      order.push('storage');
      return Promise.resolve();
    });
    prisma.portalBanner.delete.mockImplementation(() => {
      order.push('db');
      return Promise.resolve({ id: 'banner-1' });
    });

    await service.deleteBanner(user, 'banner-1');
    expect(order).toEqual(['storage', 'db']);
  });

  it('falha do S3 impede apagar o banner', async () => {
    const { service, prisma } = createService();
    prisma.portalBanner.findFirst.mockResolvedValue({
      id: 'banner-1',
      tenantId: 't1',
      businessUnitId: 'bu1',
      image: 'https://cdn.example/portal/bu1/banner.jpg',
    });
    deleteMock.mockRejectedValue(new StorageUnavailableError('timeout'));

    await expect(service.deleteBanner(user, 'banner-1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.portalBanner.delete).not.toHaveBeenCalled();
  });
});
