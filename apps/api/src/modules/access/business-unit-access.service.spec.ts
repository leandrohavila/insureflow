import { NotFoundException } from '@nestjs/common';

import { BusinessUnitAccessService } from './business-unit-access.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { BusinessUnitActor } from '../../common/utils/business-unit-acl.util';

describe('BusinessUnitAccessService detail ACL', () => {
  const tenantId = 'tenant-1';
  const sales: BusinessUnitActor = {
    userId: 'user-sales',
    tenantId,
    roles: ['sales'],
    permissions: [],
    currentBusinessUnitId: null,
  };
  const adminTodas: BusinessUnitActor = {
    userId: 'user-admin',
    tenantId,
    roles: ['admin'],
    permissions: [],
    currentBusinessUnitId: null,
  };
  const adminCorretora: BusinessUnitActor = {
    ...adminTodas,
    currentBusinessUnitId: 'bu-insurance',
  };

  function createService(leadFound: { id: string } | null) {
    const leadFindFirst = jest.fn().mockResolvedValue(leadFound);
    const membershipFindMany = jest.fn().mockResolvedValue([
      { businessUnitId: 'bu-insurance' },
    ]);
    const prisma = {
      userBusinessUnit: { findMany: membershipFindMany },
      lead: { findFirst: leadFindFirst },
    } as unknown as PrismaService;

    return {
      service: new BusinessUnitAccessService(prisma),
      leadFindFirst,
    };
  }

  it('ACL permitido: sales vê lead da Corretora', async () => {
    const { service, leadFindFirst } = createService({ id: 'lead-ok' });
    await expect(
      service.assertLeadVisible(sales, tenantId, 'lead-ok'),
    ).resolves.toBeUndefined();
    expect(leadFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.any(Array),
        }),
      }),
    );
  });

  it('ACL negado: sales não vê lead de outra unidade (404)', async () => {
    const { service } = createService(null);
    await expect(
      service.assertLeadVisible(sales, tenantId, 'lead-imoveis'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('registro inexistente também retorna 404', async () => {
    const { service } = createService(null);
    await expect(
      service.assertLeadVisible(sales, tenantId, 'missing'),
    ).rejects.toMatchObject({ response: { statusCode: 404 } });
  });

  it('contexto Todas (admin): não aplica filtro de unidade', async () => {
    const { service, leadFindFirst } = createService({ id: 'lead-any' });
    await service.assertLeadVisible(adminTodas, tenantId, 'lead-any');
    expect(leadFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead-any', tenantId },
      }),
    );
  });

  it('contexto Business Unit específica (admin): restringe à unidade ativa', async () => {
    const { service, leadFindFirst } = createService({ id: 'lead-ok' });
    await service.assertLeadVisible(adminCorretora, tenantId, 'lead-ok');
    expect(leadFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [
            { id: 'lead-ok', tenantId },
            expect.objectContaining({
              OR: expect.any(Array),
            }),
          ],
        }),
      }),
    );
  });
});
