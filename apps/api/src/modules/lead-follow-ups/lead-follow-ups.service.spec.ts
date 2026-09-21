import { LeadFollowUpsService } from './lead-follow-ups.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';

describe('LeadFollowUpsService', () => {
  const tenantId = 'tenant-1';
  const actorUserId = 'user-1';

  function createService() {
    const leadFindFirst = jest.fn().mockResolvedValue({
      id: 'lead-1',
      name: 'Marina Costa',
      ownerUserId: 'user-1',
      businessUnitId: 'bu-1',
    });
    const followUpCreate = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'fu-1',
        ...data,
        lead: { id: 'lead-1', name: 'Marina Costa' },
      }),
    );
    const publish = jest.fn().mockResolvedValue({ id: 'act-1', created: true });

    const prisma = {
      lead: { findFirst: leadFindFirst, update: jest.fn() },
      leadFollowUp: {
        create: followUpCreate,
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        update: jest.fn(),
      },
      user: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as PrismaService;

    const service = new LeadFollowUpsService(prisma, {
      publish,
    } as unknown as ActivityEngineService);

    return { service, followUpCreate, publish };
  }

  it('agenda follow-up na criação do lead', async () => {
    const { service, followUpCreate, publish } = createService();
    const created = await service.scheduleOnLeadCreate({
      tenantId,
      leadId: 'lead-1',
      actorUserId,
      days: 3,
      type: 'WHATSAPP',
    });

    expect(created.id).toBe('fu-1');
    expect(followUpCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          leadId: 'lead-1',
          type: 'WHATSAPP',
          createdById: actorUserId,
        }),
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'lead_follow_up_scheduled',
        leadId: 'lead-1',
      }),
    );
  });

  it('gera follow-up de campanha WHATSAPP/PENDING sem duplicar', async () => {
    const leadFindFirst = jest.fn().mockResolvedValue({
      id: 'lead-1',
      name: 'Marina Costa',
      ownerUserId: 'user-1',
      businessUnitId: 'bu-1',
    });
    const followUpCreate = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'fu-camp-1',
        ...data,
      }),
    );
    const followUpFindFirst = jest.fn().mockResolvedValue(null);
    const publish = jest.fn().mockResolvedValue({ id: 'act-1', created: true });

    const prisma = {
      lead: { findFirst: leadFindFirst, update: jest.fn() },
      leadFollowUp: {
        create: followUpCreate,
        findFirst: followUpFindFirst,
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        update: jest.fn(),
      },
      user: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as PrismaService;

    const service = new LeadFollowUpsService(prisma, {
      publish,
    } as unknown as ActivityEngineService);

    const first = await service.scheduleForCampaign({
      tenantId,
      leadId: 'lead-1',
      campaignId: 'camp-1',
      campaignName: 'Campanha Q3',
      actorUserId,
      assignedUserId: 'owner-9',
    });

    expect(first.created).toBe(true);
    expect(followUpCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          campaignId: 'camp-1',
          type: 'WHATSAPP',
          status: 'PENDING',
          assignedUserId: 'owner-9',
          notes:
            'Follow-up gerado automaticamente pela campanha de reativação.',
        }),
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'campaign_followup_created',
        leadId: 'lead-1',
      }),
    );

    followUpFindFirst.mockResolvedValue({ id: 'fu-camp-1' });
    const second = await service.scheduleForCampaign({
      tenantId,
      leadId: 'lead-1',
      campaignId: 'camp-1',
      campaignName: 'Campanha Q3',
      actorUserId,
      assignedUserId: 'owner-9',
    });
    expect(second.created).toBe(false);
    expect(followUpCreate).toHaveBeenCalledTimes(1);
  });
});
