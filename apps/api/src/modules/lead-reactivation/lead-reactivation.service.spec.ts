import { LeadReactivationService } from './lead-reactivation.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { MessageTemplatesService } from '../message-templates/message-templates.service';

describe('LeadReactivationService.getMetrics', () => {
  it('calcula taxa de retorno e conversão', async () => {
    const prisma = {
      leadReactivationLog: {
        count: jest.fn().mockResolvedValue(10),
        findMany: jest
          .fn()
          .mockResolvedValue([{ leadId: 'a' }, { leadId: 'b' }]),
      },
      lead: {
        count: jest
          .fn()
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(1),
      },
      deal: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { value: 1500 } }),
      },
    } as unknown as PrismaService;

    const service = new LeadReactivationService(
      prisma,
      {} as MessageTemplatesService,
      {} as ActivityEngineService,
      { scheduleAfterReactivation: jest.fn() } as never,
      { dispatch: jest.fn(), resolveRecipient: jest.fn() } as never,
    );

    const metrics = await service.getMetrics('tenant-1');
    expect(metrics.leadsReactivated).toBe(2);
    expect(metrics.messagesSent).toBe(10);
    expect(metrics.returnRate).toBe(50);
    expect(metrics.conversionRate).toBe(50);
    expect(metrics.revenueFromReactivation).toBe(1500);
  });
});
