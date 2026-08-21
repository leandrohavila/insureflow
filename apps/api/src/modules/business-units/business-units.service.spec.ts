import { BusinessUnitsService } from './business-units.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('BusinessUnitsService', () => {
  const tenantId = 'tenant-1';

  function createService() {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'bu-1',
        tenantId,
        name: 'Corretora Ávila',
        slug: 'corretora-avila',
        type: 'INSURANCE',
        isActive: true,
      },
    ]);
    const findFirst = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({ id: 'bu-new', ...data }),
    );

    const prisma = {
      businessUnit: { findMany, findFirst, create },
      user: { update: jest.fn() },
    } as unknown as PrismaService;

    const buAccess = {
      resolveIds: jest.fn().mockResolvedValue(null),
      membershipIds: jest.fn().mockResolvedValue(['bu-1']),
      describe: jest.fn().mockReturnValue({ canViewAll: true, canManage: true }),
    };

    const auth = {
      issueAccessTokenForUser: jest.fn().mockResolvedValue({
        accessToken: 'token',
        expiresIn: '15m',
        user: { sub: 'user-1' },
      }),
    };

    const auditLogs = { enqueue: jest.fn() };

    return {
      service: new BusinessUnitsService(
        prisma,
        buAccess as never,
        auth as never,
        auditLogs as never,
      ),
      create,
      findFirst,
      findMany,
      buAccess,
      auditLogs,
    };
  }

  it('lista unidades do tenant', async () => {
    const { service } = createService();
    const result = await service.findAll(tenantId);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.slug).toBe('corretora-avila');
  });

  it('gera slug a partir do nome', async () => {
    const { service, create } = createService();
    await service.create(tenantId, {
      name: 'Ávila Imóveis',
      type: 'REAL_ESTATE',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'avila-imoveis',
          type: 'REAL_ESTATE',
        }),
      }),
    );
  });

  it('retorna contexto Todas para admin', async () => {
    const { service } = createService();
    const context = await service.getContext({
      userId: 'user-1',
      tenantId,
      roles: ['admin'],
      permissions: [],
      currentBusinessUnitId: null,
    });
    expect(context.currentBusinessUnitId).toBeNull();
    expect(context.canViewAll).toBe(true);
    expect(context.units[0]?.slug).toBe('corretora-avila');
  });
});
