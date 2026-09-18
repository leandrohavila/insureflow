import { ExecutiveDashboardService } from './executive-dashboard.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('ExecutiveDashboardService', () => {
  it('calcula conversão, receita e funil no recorte ACL', async () => {
    const count = jest.fn();
    const aggregate = jest.fn().mockResolvedValue({ _sum: { value: 80000 } });
    const prisma = {
      lead: { count },
      opportunity: { count },
      deal: {
        count,
        aggregate,
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              createdAt: new Date('2026-08-01T00:00:00.000Z'),
              wonAt: new Date('2026-08-11T00:00:00.000Z'),
            },
          ])
          .mockResolvedValueOnce([
            { stage: 'cotacao', businessUnit: { type: 'INSURANCE' } },
            { stage: 'proposta', businessUnit: { type: 'INSURANCE' } },
          ])
          .mockResolvedValueOnce([
            {
              value: 80000,
              productType: 'AUTO',
              sourceType: 'LEAD',
              businessUnitId: 'bu-1',
            },
          ]),
        groupBy: jest
          .fn()
          .mockResolvedValueOnce([{ ownerUserId: 'u1', _count: { _all: 4 } }])
          .mockResolvedValueOnce([
            { businessUnitId: 'bu-1', _count: { _all: 4 } },
          ])
          .mockResolvedValueOnce([
            {
              ownerUserId: 'u1',
              _count: { _all: 1 },
              _sum: { value: 80000 },
            },
          ])
          .mockResolvedValueOnce([
            {
              businessUnitId: 'bu-1',
              _count: { _all: 1 },
              _sum: { value: 80000 },
            },
          ]),
      },
      policyRenewal: { count },
      crossSellOpportunity: { count },
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'u1', name: 'Ana' }]),
      },
      businessUnit: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'bu-1', name: 'Corretora', type: 'INSURANCE' }]),
      },
      salesTarget: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { targetRevenue: 120000 } }),
      },
      salesCommission: {
        aggregate: jest
          .fn()
          .mockResolvedValueOnce({ _sum: { commissionValue: 4000 } })
          .mockResolvedValueOnce({ _sum: { commissionValue: 1500 } }),
      },
    } as unknown as PrismaService;

    count.mockResolvedValue(2);
    const buAccess = {
      leadWhere: jest.fn().mockResolvedValue({ businessUnitId: { in: ['bu-1'] } }),
      dealWhere: jest.fn().mockResolvedValue({ businessUnitId: { in: ['bu-1'] } }),
      opportunityWhere: jest.fn().mockResolvedValue({ businessUnitId: { in: ['bu-1'] } }),
      renewalWhere: jest.fn().mockResolvedValue({}),
      crossSellWhere: jest.fn().mockResolvedValue({}),
    };

    const service = new ExecutiveDashboardService(prisma, buAccess as never);
    const result = await service.getDashboard(
      'tenant-1',
      { from: '2026-08-01T00:00:00.000Z', to: '2026-08-20T00:00:00.000Z' },
      {
        userId: 'u1',
        tenantId: 'tenant-1',
        roles: ['sales'],
        permissions: ['crm:view'],
      },
    );

    expect(buAccess.dealWhere).toHaveBeenCalled();
    expect(result.avgCloseDays).toBe(10);
    expect(result.revenue).toBe(80000);
    expect(result.funnel.some((item) => item.stage === 'cotacao')).toBe(true);
    expect(result.byBroker[0]).toMatchObject({
      name: 'Ana',
      conversionRate: 25,
    });
  });
});
