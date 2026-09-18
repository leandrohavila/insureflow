import { NotFoundException } from '@nestjs/common';

import { OpportunitiesService } from './opportunities.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('OpportunitiesService', () => {
  const createdAt = new Date('2026-08-20T10:00:00.000Z');

  function createService() {
    const opportunity = {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    };
    const customer = {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([{ id: 'cust-1' }]),
    };
    const businessUnit = {
      findMany: jest.fn().mockResolvedValue([
        { id: 'bu-ins', type: 'INSURANCE' },
        { id: 'bu-re', type: 'REAL_ESTATE' },
      ]),
    };
    const prisma = {
      opportunity,
      customer,
      businessUnit,
      $transaction: jest.fn((ops: Array<Promise<unknown>>) => Promise.all(ops)),
    } as unknown as PrismaService;

    const buAccess = {
      opportunityWhere: jest.fn().mockResolvedValue({
        businessUnitId: { in: ['bu-ins'] },
      }),
      assertOpportunityVisible: jest.fn().mockResolvedValue(undefined),
    };

    const service = new OpportunitiesService(prisma, undefined, buAccess as never);
    return { service, prisma, opportunity, customer, businessUnit, buAccess };
  }

  it('lista oportunidades no tenant com ACL de unidade', async () => {
    const { service, opportunity, buAccess } = createService();
    opportunity.findMany.mockResolvedValue([
      {
        id: 'opp-1',
        tenantId: 'tenant-1',
        type: 'LIFE_INSURANCE',
        status: 'OPEN',
        source: 'ENGINE',
        score: 'HIGH',
        estimatedValue: null,
        customer: { id: 'cust-1', name: 'Maria', document: '1' },
        businessUnit: {
          id: 'bu-ins',
          name: 'Corretora',
          slug: 'corretora',
          type: 'INSURANCE',
          isActive: true,
        },
        assignedUser: null,
      },
    ]);

    const result = await service.findAll(
      'tenant-1',
      { page: 1, limit: 20 },
      {
        userId: 'user-1',
        tenantId: 'tenant-1',
        roles: ['sales'],
        permissions: ['crm:view'],
      },
    );

    expect(buAccess.opportunityWhere).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(opportunity.findMany.mock.calls[0][0].where).toEqual({
      AND: [
        expect.objectContaining({ tenantId: 'tenant-1' }),
        { businessUnitId: { in: ['bu-ins'] } },
      ],
    });
  });

  it('gera sugestões do motor sem duplicar o que já existe', async () => {
    const { service, customer, opportunity } = createService();
    customer.findFirst.mockResolvedValue({
      id: 'cust-1',
      ownerUserId: 'user-1',
      businessUnitId: 'bu-ins',
      interestCategories: ['AUTO_INSURANCE', 'PROPERTY_BUY'],
    });
    opportunity.upsert
      .mockResolvedValueOnce({
        createdAt,
        updatedAt: createdAt,
      })
      .mockResolvedValueOnce({
        createdAt,
        updatedAt: new Date('2026-08-20T11:00:00.000Z'),
      });

    const result = await service.generateForCustomer('tenant-1', 'cust-1');

    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'LIFE_INSURANCE', score: 'HIGH' }),
        expect.objectContaining({ type: 'HOME_INSURANCE', score: 'HIGH' }),
      ]),
    );
    expect(result.created).toBe(1);
    expect(opportunity.upsert).toHaveBeenCalledTimes(2);
  });

  it('retorna 404 ao criar para cliente inexistente', async () => {
    const { service, customer } = createService();
    customer.findFirst.mockResolvedValue(null);

    await expect(
      service.create('tenant-1', {
        customerId: 'missing',
        type: 'AUTO_INSURANCE',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marca convertida ao atualizar para WON', async () => {
    const { service, opportunity, buAccess } = createService();
    opportunity.findFirst.mockResolvedValue({
      id: 'opp-1',
      status: 'OPEN',
      customerId: 'cust-1',
    });
    opportunity.update.mockResolvedValue({
      id: 'opp-1',
      tenantId: 'tenant-1',
      customerId: 'cust-1',
      type: 'LIFE_INSURANCE',
      status: 'WON',
      source: 'ENGINE',
      score: 'HIGH',
      estimatedValue: null,
      assignedUserId: 'user-1',
      customer: { id: 'cust-1', name: 'Maria', document: '1' },
      businessUnit: null,
      assignedUser: { id: 'user-1', name: 'Ana' },
    });

    const updated = await service.update(
      'tenant-1',
      'opp-1',
      { status: 'WON' },
      {
        userId: 'user-1',
        tenantId: 'tenant-1',
        roles: ['admin'],
        permissions: ['crm:manage'],
      },
    );

    expect(buAccess.assertOpportunityVisible).toHaveBeenCalled();
    expect(updated.status).toBe('WON');
  });
});
