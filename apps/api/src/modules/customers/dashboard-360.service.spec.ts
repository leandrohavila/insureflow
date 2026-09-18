import { Dashboard360Service } from './dashboard-360.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('Dashboard360Service', () => {
  function createService() {
    const count = jest.fn();
    const aggregate = jest.fn().mockResolvedValue({ _sum: { value: 0 } });
    const prisma = {
      customer: { count },
      lead: { count },
      deal: { aggregate },
      policyRenewal: { aggregate },
      crossSellOpportunity: { aggregate },
      opportunity: { aggregate, count },
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'user-1', name: 'Ana' }]),
      },
    } as unknown as PrismaService;

    const buAccess = {
      customerWhere: jest.fn().mockResolvedValue({
        businessUnitId: { in: ['bu-ins'] },
      }),
      dealWhere: jest.fn().mockResolvedValue({
        businessUnitId: { in: ['bu-ins'] },
      }),
      opportunityWhere: jest.fn().mockResolvedValue({
        businessUnitId: { in: ['bu-ins'] },
      }),
      renewalWhere: jest.fn().mockResolvedValue({
        businessUnitId: { in: ['bu-ins'] },
      }),
      crossSellWhere: jest.fn().mockResolvedValue({
        customer: { businessUnitId: { in: ['bu-ins'] } },
      }),
    };

    const service = new Dashboard360Service(prisma, buAccess as never);
    return { service, prisma, count, aggregate, buAccess };
  }

  it('calcula indicadores e taxa de conversão no recorte ACL', async () => {
    const { service, count, aggregate, buAccess } = createService();
    count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(8);
    aggregate
      .mockResolvedValueOnce({ _sum: { value: 15000 } })
      .mockResolvedValueOnce({ _sum: { convertedRevenue: 3000 } })
      .mockResolvedValueOnce({ _sum: { convertedRevenue: 1000 } })
      .mockResolvedValueOnce({ _sum: { estimatedValue: 500 } });

    const result = await service.getDashboard(
      'tenant-1',
      {
        from: '2026-08-01T00:00:00.000Z',
        to: '2026-08-20T00:00:00.000Z',
        userId: 'user-1',
        businessUnitId: 'bu-ins',
      },
      {
        userId: 'user-1',
        tenantId: 'tenant-1',
        roles: ['sales'],
        permissions: ['crm:view'],
      },
    );

    expect(buAccess.customerWhere).toHaveBeenCalled();
    expect(buAccess.opportunityWhere).toHaveBeenCalled();
    expect(result.activeCustomers).toBe(10);
    expect(result.inactiveCustomers).toBe(4);
    expect(result.reactivatedCustomers).toBe(2);
    expect(result.predictedRevenue).toBe(15000);
    expect(result.renewalRevenue).toBe(3000);
    expect(result.crossSellRevenue).toBe(1500);
    expect(result.openOpportunities).toBe(5);
    expect(result.conversionRate).toBe(25);
    expect(result.brokers).toEqual([{ id: 'user-1', name: 'Ana' }]);
  });

  it('retorna conversão 0 quando não há oportunidades no período', async () => {
    const { service, count, aggregate } = createService();
    count.mockResolvedValue(0);
    aggregate.mockResolvedValue({ _sum: { value: null, convertedRevenue: null, estimatedValue: null } });

    const result = await service.getDashboard('tenant-1', {});

    expect(result.conversionRate).toBe(0);
    expect(result.predictedRevenue).toBe(0);
  });
});
