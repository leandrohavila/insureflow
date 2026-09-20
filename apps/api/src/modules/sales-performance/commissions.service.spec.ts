import { Prisma } from '@prisma/client';

import { CommissionsService } from './commissions.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('CommissionsService', () => {
  it('gera comissão e atualiza metas ao ganhar o deal', async () => {
    const salesCommission = {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'c1',
        tenantId: 't1',
        dealId: 'd1',
        userId: 'u1',
        businessUnitId: 'bu-1',
        commissionPercentage: new Prisma.Decimal(15),
        commissionValue: new Prisma.Decimal(1500),
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
    const updateMany = jest.fn().mockResolvedValue({ count: 2 });
    const prisma = {
      salesCommission,
      deal: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'd1',
          tenantId: 't1',
          title: 'Auto',
          status: 'won',
          value: new Prisma.Decimal(10000),
          ownerUserId: 'u1',
          businessUnitId: 'bu-1',
          customerId: 'cust-1',
          productType: 'AUTO',
          wonAt: new Date('2026-08-10T00:00:00.000Z'),
          businessUnit: { type: 'INSURANCE' },
          ownerUser: { id: 'u1', primaryTeamId: 'team-1' },
        }),
      },
      commissionRule: { findFirst: jest.fn().mockResolvedValue(null) },
      salesTarget: { updateMany },
    } as unknown as PrismaService;
    const activityEngine = { publish: jest.fn().mockResolvedValue(undefined) };
    const service = new CommissionsService(prisma, activityEngine as never);

    const result = await service.onDealWon('t1', 'd1', 'u1');

    expect(salesCommission.create).toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalled();
    expect(activityEngine.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'deal_commission_created',
      }),
    );
    expect(result?.commissionValue).toBe(1500);
  });

  it('é idempotente quando a comissão já existe', async () => {
    const existing = {
      id: 'c1',
      tenantId: 't1',
      dealId: 'd1',
      userId: 'u1',
      businessUnitId: 'bu-1',
      commissionPercentage: new Prisma.Decimal(15),
      commissionValue: new Prisma.Decimal(1500),
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const createCommission = jest.fn();
    const prisma = {
      salesCommission: {
        findUnique: jest.fn().mockResolvedValue(existing),
        create: createCommission,
      },
    } as unknown as PrismaService;
    const service = new CommissionsService(prisma, {
      publish: jest.fn(),
    } as never);
    await service.onDealWon('t1', 'd1', 'u1');
    expect(createCommission).not.toHaveBeenCalled();
  });

  it('aplica ACL de unidade na listagem', async () => {
    const transaction = jest.fn().mockResolvedValue([0, []]);
    const prisma = {
      $transaction: transaction,
      salesCommission: { count: jest.fn(), findMany: jest.fn() },
    } as unknown as PrismaService;
    const buAccess = {
      dealWhere: jest
        .fn()
        .mockResolvedValue({ businessUnitId: { in: ['bu-1'] } }),
    };
    const service = new CommissionsService(
      prisma,
      { publish: jest.fn() } as never,
      buAccess as never,
    );
    await service.list(
      't1',
      {},
      {
        userId: 'u1',
        tenantId: 't1',
        roles: ['comercial'],
        permissions: ['crm:view'],
      },
    );
    expect(buAccess.dealWhere).toHaveBeenCalled();
    expect(transaction).toHaveBeenCalled();
  });
});
