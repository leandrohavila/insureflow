import { SlaDashboardService } from './sla-dashboard.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('SlaDashboardService', () => {
  it('classifica negócios em SLA, alerta e atraso', async () => {
    const prisma = {
      deal: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ok',
            stage: 'novo',
            stageEnteredAt: new Date('2026-08-20T08:00:00.000Z'),
            ownerUserId: 'u1',
            businessUnitId: 'bu-1',
            ownerUser: { id: 'u1', name: 'Ana' },
            businessUnit: { id: 'bu-1', name: 'Corretora', type: 'INSURANCE' },
            pipeline: {
              stages: [{ slug: 'novo', maxDays: 2 }],
            },
          },
          {
            id: 'late',
            stage: 'cotacao',
            stageEnteredAt: new Date('2026-08-16T08:00:00.000Z'),
            ownerUserId: 'u1',
            businessUnitId: 'bu-1',
            ownerUser: { id: 'u1', name: 'Ana' },
            businessUnit: { id: 'bu-1', name: 'Corretora', type: 'INSURANCE' },
            pipeline: {
              stages: [{ slug: 'cotacao', maxDays: 3 }],
            },
          },
        ]),
      },
    } as unknown as PrismaService;

    const service = new SlaDashboardService(prisma);
    const result = await service.getDashboard(
      'tenant-1',
      { to: '2026-08-20T12:00:00.000Z' },
    );

    expect(result.openDeals).toBe(2);
    expect(result.overdue).toBe(1);
    expect(result.inSla + result.warning + result.overdue).toBe(2);
    expect(result.byBroker[0]?.name).toBe('Ana');
    expect(result.avgHoursByStage.length).toBeGreaterThan(0);
  });
});
