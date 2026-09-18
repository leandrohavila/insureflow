import { CommercialAutomationService } from './commercial-automation.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { LeadFollowUpsService } from '../lead-follow-ups/lead-follow-ups.service';
import type { LeadReactivationService } from '../lead-reactivation/lead-reactivation.service';
import type { PolicyRenewalsService } from '../policy-renewals/policy-renewals.service';
import type { SalesSlaEngine } from './sales-sla-engine.service';

describe('CommercialAutomationService', () => {
  it('orquestra reativação, follow-up, renovação e SLA', async () => {
    const reactivation = {
      runDailyJob: jest.fn().mockResolvedValue({ processed: 2, sent: 1 }),
      processTenant: jest.fn(),
    };
    const followUps = {
      processDailyAutomation: jest.fn().mockResolvedValue({ dueAlerts: 3 }),
    };
    const renewals = {
      processDailyAutomation: jest
        .fn()
        .mockResolvedValue({ tasksCreated: 1, remindersSent: 1 }),
    };
    const sla = {
      processDaily: jest.fn().mockResolvedValue({ overdue: 2, warnings: 1 }),
      processTenant: jest.fn(),
    };

    const service = new CommercialAutomationService(
      {} as PrismaService,
      reactivation as unknown as LeadReactivationService,
      followUps as unknown as LeadFollowUpsService,
      renewals as unknown as PolicyRenewalsService,
      sla as unknown as SalesSlaEngine,
    );

    const result = await service.runDailyJob(new Date('2026-08-20T10:00:00Z'));
    expect(reactivation.runDailyJob).toHaveBeenCalled();
    expect(followUps.processDailyAutomation).toHaveBeenCalled();
    expect(renewals.processDailyAutomation).toHaveBeenCalled();
    expect(sla.processDaily).toHaveBeenCalled();
    expect(result.reactivation.processed).toBe(2);
    expect(result.followUps.dueAlerts).toBe(3);
    expect(result.renewals.tasksCreated).toBe(1);
    expect(result.sla.overdue).toBe(2);
  });

  it('calcula taxa de recuperação do dashboard', async () => {
    const prisma = {
      lead: { count: jest.fn() },
      leadReactivationLog: { findMany: jest.fn() },
      leadFollowUp: { count: jest.fn() },
      policyRenewal: { count: jest.fn(), aggregate: jest.fn() },
      deal: { aggregate: jest.fn() },
    };

    prisma.lead.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4);
    prisma.leadReactivationLog.findMany.mockResolvedValue([
      { leadId: 'a' },
      { leadId: 'b' },
      { leadId: 'c' },
      { leadId: 'd' },
      { leadId: 'e' },
    ]);
    prisma.leadFollowUp.count.mockResolvedValueOnce(8).mockResolvedValueOnce(2);
    prisma.policyRenewal.count.mockResolvedValueOnce(6).mockResolvedValueOnce(1);
    prisma.deal.aggregate.mockResolvedValue({ _sum: { value: 1500 } });
    prisma.policyRenewal.aggregate.mockResolvedValue({
      _sum: { convertedRevenue: 500 },
    });

    const service = new CommercialAutomationService(
      prisma as unknown as PrismaService,
      { runDailyJob: jest.fn(), processTenant: jest.fn() } as never,
      { processDailyAutomation: jest.fn() } as never,
      { processDailyAutomation: jest.fn() } as never,
      { processDaily: jest.fn(), processTenant: jest.fn() } as never,
    );

    const metrics = await service.getDashboard('tenant-1', {});
    expect(metrics.lostLeads).toBe(10);
    expect(metrics.reactivatedLeads).toBe(5);
    expect(metrics.returnedLeads).toBe(4);
    expect(metrics.recoveryRate).toBe(80);
    expect(metrics.pendingFollowUps).toBe(8);
    expect(metrics.overdueFollowUps).toBe(2);
    expect(metrics.upcomingRenewals).toBe(6);
    expect(metrics.convertedRenewals).toBe(1);
    expect(metrics.recoveredRevenue).toBe(2000);
  });
});
