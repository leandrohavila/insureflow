import { PerformanceService } from './performance.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('PerformanceService', () => {
  it('calcula indicadores do período com ACL', async () => {
    const prisma = {
      deal: {
        aggregate: jest
          .fn()
          .mockResolvedValueOnce({ _sum: { value: 80000 }, _count: { _all: 2 } })
          .mockResolvedValueOnce({ _sum: { value: 20000 } }),
        count: jest.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(2),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      salesCommission: {
        groupBy: jest.fn().mockResolvedValue([
          { status: 'PENDING', _sum: { commissionValue: 1000 } },
          { status: 'APPROVED', _sum: { commissionValue: 400 } },
          { status: 'PAID', _sum: { commissionValue: 200 } },
        ]),
      },
      salesTarget: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { targetRevenue: 100000, achievedRevenue: 80000 },
        }),
      },
    } as unknown as PrismaService;
    const buAccess = {
      dealWhere: jest.fn().mockResolvedValue({ businessUnitId: { in: ['bu-1'] } }),
    };
    const service = new PerformanceService(prisma, buAccess as never);
    const result = await service.getDashboard(
      't1',
      { period: 'month', month: 8, year: 2026 },
      {
        userId: 'u1',
        tenantId: 't1',
        roles: ['comercial'],
        permissions: ['crm:view'],
      },
    );
    expect(buAccess.dealWhere).toHaveBeenCalled();
    expect(result.monthRevenue).toBe(80000);
    expect(result.targetAttainment).toBe(80);
    expect(result.commissionForecast).toBe(1400);
    expect(result.wonDeals).toBe(2);
    expect(result.avgTicket).toBe(40000);
  });
});
