import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CommercialReactivationCampaignsService } from './commercial-reactivation-campaigns.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type { LeadFollowUpsService } from '../lead-follow-ups/lead-follow-ups.service';

type PrismaMock = {
  $transaction: jest.Mock;
  reactivationCampaign: {
    count: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  campaignLead: {
    count: jest.Mock;
    findMany: jest.Mock;
    createMany: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  lead: {
    count: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  user: { findFirst: jest.Mock };
};

type LeadUpdateArg = {
  data: {
    status?: string;
    nextReactivationAt?: Date | null;
  };
};

type ActivityPublishArg = {
  operationalEventKind: string;
  leadId?: string;
  metadata?: Record<string, unknown>;
};

function firstArg<T>(mock: { mock: { calls: unknown } }): T {
  const calls = mock.mock.calls;
  if (!Array.isArray(calls) || !Array.isArray(calls[0])) {
    throw new Error('expected mock to be called');
  }
  return calls[0][0] as T;
}

describe('CommercialReactivationCampaignsService', () => {
  const tenantId = 'tenant-1';
  const actor = {
    userId: 'user-1',
    tenantId,
    roles: ['admin'],
    permissions: ['crm:manage', 'crm:view', 'leads:manage'],
    currentBusinessUnitId: 'bu-1',
  };

  const baseCampaign = {
    id: 'camp-1',
    tenantId,
    name: 'Campanha Q3',
    description: 'Teste',
    status: 'DRAFT',
    ownerUserId: 'user-1',
    createdById: 'user-1',
    businessUnitId: 'bu-1',
    startedAt: null,
    finishedAt: null,
    createdAt: new Date('2026-09-17T12:00:00.000Z'),
    updatedAt: new Date('2026-09-17T12:00:00.000Z'),
    ownerUser: { id: 'user-1', name: 'Leandro', email: 'a@b.com' },
    createdBy: { id: 'user-1', name: 'Leandro' },
    businessUnit: { id: 'bu-1', name: 'Corretora' },
    _count: { leads: 0 },
  };

  function createService() {
    const campaignFindMany = jest.fn().mockResolvedValue([baseCampaign]);
    const campaignCount = jest.fn().mockResolvedValue(1);
    const campaignFindFirst = jest.fn().mockResolvedValue(baseCampaign);
    const campaignCreate = jest.fn().mockResolvedValue(baseCampaign);
    const campaignUpdate = jest
      .fn()
      .mockImplementation((args: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...baseCampaign, ...args.data }),
      );

    const campaignLeadCount = jest.fn().mockResolvedValue(0);
    const campaignLeadFindMany = jest.fn().mockResolvedValue([]);
    const campaignLeadCreateMany = jest.fn().mockResolvedValue({ count: 2 });
    const campaignLeadFindFirst = jest.fn();
    const campaignLeadUpdate = jest.fn();
    const campaignLeadDelete = jest.fn();

    const leadCount = jest.fn().mockResolvedValue(127);
    const leadFindMany = jest
      .fn()
      .mockResolvedValue([{ id: 'lead-1' }, { id: 'lead-2' }]);
    const leadUpdate = jest.fn().mockResolvedValue({
      id: 'lead-1',
      status: 'contacted',
    });
    const userFindFirst = jest.fn().mockResolvedValue({ id: 'user-1' });

    const prisma: PrismaMock = {
      $transaction: jest.fn(
        async (
          arg: Promise<unknown>[] | ((tx: PrismaMock) => Promise<unknown>),
        ) => {
          if (Array.isArray(arg)) {
            return Promise.all(arg);
          }
          return arg(prisma);
        },
      ),
      reactivationCampaign: {
        count: campaignCount,
        findMany: campaignFindMany,
        findFirst: campaignFindFirst,
        create: campaignCreate,
        update: campaignUpdate,
      },
      campaignLead: {
        count: campaignLeadCount,
        findMany: campaignLeadFindMany,
        createMany: campaignLeadCreateMany,
        findFirst: campaignLeadFindFirst,
        update: campaignLeadUpdate,
        delete: campaignLeadDelete,
      },
      lead: {
        count: leadCount,
        findMany: leadFindMany,
        update: leadUpdate,
      },
      user: { findFirst: userFindFirst },
    };

    const publish = jest.fn().mockResolvedValue({ id: 'act-1', created: true });
    const activityEngine = { publish } as unknown as ActivityEngineService;
    const enqueue = jest.fn();
    const auditLogs = { enqueue } as unknown as AuditLogsService;
    const scheduleForCampaign = jest.fn();
    const followUps = {
      scheduleForCampaign,
    } as unknown as LeadFollowUpsService;

    const buAccess = {
      resolveIds: jest.fn().mockResolvedValue(null),
      leadWhere: jest.fn().mockResolvedValue(undefined),
    } as unknown as BusinessUnitAccessService;

    const service = new CommercialReactivationCampaignsService(
      prisma as unknown as PrismaService,
      activityEngine,
      followUps,
      auditLogs,
      buAccess,
    );

    return {
      service,
      prisma,
      publish,
      enqueue,
      scheduleForCampaign,
      campaignCreate,
      campaignUpdate,
      campaignFindFirst,
      campaignLeadCount,
      campaignLeadFindMany,
      campaignLeadCreateMany,
      campaignLeadFindFirst,
      campaignLeadUpdate,
      leadCount,
      leadUpdate,
      buAccess,
    };
  }

  it('cria campanha e registra campaign_created', async () => {
    const { service, campaignCreate, publish, enqueue } = createService();
    const result = await service.create(
      tenantId,
      { name: 'Campanha Q3', description: 'Teste' },
      actor,
    );

    expect(campaignCreate).toHaveBeenCalled();
    const publishArg = firstArg<ActivityPublishArg>(publish);
    expect(publishArg.operationalEventKind).toBe('campaign_created');
    expect(publishArg.metadata).toMatchObject({ campaignId: 'camp-1' });
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'campaign_created',
        resource: 'reactivation_campaigns',
        resourceId: 'camp-1',
      }),
    );
    expect(result.name).toBe('Campanha Q3');
  });

  it('atualiza metadados em DRAFT e registra campaign_updated', async () => {
    const { service, campaignUpdate, publish, enqueue, campaignFindFirst } =
      createService();
    campaignFindFirst.mockResolvedValue(baseCampaign);

    const result = await service.update(
      tenantId,
      'camp-1',
      { name: 'Campanha Q3b', description: 'Nova', ownerUserId: 'user-1' },
      actor,
    );

    expect(campaignUpdate).toHaveBeenCalled();
    expect(result.name).toBe('Campanha Q3b');
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ operationalEventKind: 'campaign_updated' }),
    );
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'campaign_updated' }),
    );
  });

  it('bloqueia edição de campanha IN_PROGRESS ou FINISHED', async () => {
    const { service, campaignFindFirst } = createService();
    campaignFindFirst.mockResolvedValue({
      ...baseCampaign,
      status: 'IN_PROGRESS',
    });
    await expect(
      service.update(tenantId, 'camp-1', { name: 'Xxxxx' }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);

    campaignFindFirst.mockResolvedValue({
      ...baseCampaign,
      status: 'FINISHED',
    });
    await expect(
      service.update(tenantId, 'camp-1', { name: 'Xxxxx' }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('preview retorna total filtrado de leads perdidos', async () => {
    const { service, leadCount, campaignFindFirst } = createService();
    campaignFindFirst.mockResolvedValue(baseCampaign);
    const result = await service.previewLeads(
      tenantId,
      'camp-1',
      { lostDays: 90, source: 'site' },
      actor,
    );
    expect(leadCount).toHaveBeenCalled();
    expect(result.total).toBe(127);
  });

  it('adiciona leads e registra campaign_lead_added', async () => {
    const {
      service,
      campaignLeadCreateMany,
      publish,
      enqueue,
      campaignFindFirst,
    } = createService();
    campaignFindFirst.mockResolvedValue(baseCampaign);
    const result = await service.addLeads(
      tenantId,
      'camp-1',
      { lostDays: 60 },
      actor,
    );
    expect(campaignLeadCreateMany).toHaveBeenCalled();
    const publishArg = firstArg<ActivityPublishArg>(publish);
    expect(publishArg.operationalEventKind).toBe('campaign_lead_added');
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'campaign_lead_added' }),
    );
    expect(result.added).toBe(2);
  });

  it('não inicia campanha sem leads', async () => {
    const { service, campaignFindFirst, campaignLeadCount } = createService();
    campaignFindFirst.mockResolvedValue(baseCampaign);
    campaignLeadCount.mockResolvedValue(0);
    await expect(
      service.start(tenantId, 'camp-1', actor),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('inicia campanha, gera 3 follow-ups e não duplica na reexecução', async () => {
    const {
      service,
      campaignFindFirst,
      campaignLeadCount,
      campaignLeadFindMany,
      scheduleForCampaign,
      publish,
      enqueue,
      campaignUpdate,
    } = createService();

    campaignFindFirst.mockResolvedValue({
      ...baseCampaign,
      status: 'DRAFT',
    });
    campaignLeadCount.mockResolvedValue(3);
    campaignLeadFindMany.mockImplementation(
      (args: { select?: { leadId?: boolean } }) => {
        if (args?.select?.leadId) {
          return Promise.resolve([
            { leadId: 'lead-1' },
            { leadId: 'lead-2' },
            { leadId: 'lead-3' },
          ]);
        }
        return Promise.resolve([]);
      },
    );
    scheduleForCampaign
      .mockResolvedValueOnce({ created: true, followUp: { id: 'fu-1' } })
      .mockResolvedValueOnce({ created: true, followUp: { id: 'fu-2' } })
      .mockResolvedValueOnce({ created: true, followUp: { id: 'fu-3' } })
      .mockResolvedValue({ created: false, followUp: { id: 'fu-1' } });

    await service.start(tenantId, 'camp-1', actor);

    expect(campaignUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'IN_PROGRESS' }),
      }),
    );
    expect(scheduleForCampaign).toHaveBeenCalledTimes(3);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ operationalEventKind: 'campaign_started' }),
    );
    expect(
      enqueue.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { action: string }).action === 'campaign_followup_created',
      ),
    ).toHaveLength(3);

    campaignFindFirst.mockResolvedValue({
      ...baseCampaign,
      status: 'IN_PROGRESS',
    });
    publish.mockClear();
    enqueue.mockClear();
    scheduleForCampaign.mockClear();
    scheduleForCampaign.mockResolvedValue({
      created: false,
      followUp: { id: 'fu-1' },
    });

    await service.start(tenantId, 'camp-1', actor);

    expect(scheduleForCampaign).toHaveBeenCalledTimes(3);
    expect(publish).not.toHaveBeenCalledWith(
      expect.objectContaining({ operationalEventKind: 'campaign_started' }),
    );
    expect(
      enqueue.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { action: string }).action === 'campaign_followup_created',
      ),
    ).toHaveLength(0);
  });

  it('encerra campanha e registra campaign_finished', async () => {
    const {
      service,
      campaignFindFirst,
      campaignUpdate,
      publish,
      enqueue,
    } = createService();
    campaignFindFirst.mockResolvedValue({
      ...baseCampaign,
      status: 'IN_PROGRESS',
    });

    await service.finish(tenantId, 'camp-1', actor);

    expect(campaignUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FINISHED' }),
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ operationalEventKind: 'campaign_finished' }),
    );
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'campaign_finished' }),
    );
  });

  it('reativa lead da campanha com auditoria lead_reactivated_campaign', async () => {
    const {
      service,
      campaignFindFirst,
      campaignLeadFindFirst,
      campaignLeadUpdate,
      leadUpdate,
      publish,
    } = createService();

    campaignFindFirst.mockResolvedValue({
      ...baseCampaign,
      status: 'IN_PROGRESS',
    });
    campaignLeadFindFirst.mockResolvedValue({
      id: 'cl-1',
      tenantId,
      campaignId: 'camp-1',
      leadId: 'lead-1',
      contactStatus: 'INTERESTED',
      contactedAt: new Date(),
      reactivatedAt: null,
      notes: null,
      addedAt: new Date('2026-09-10T00:00:00.000Z'),
      lead: {
        id: 'lead-1',
        name: 'Bruna',
        status: 'lost',
        lostReason: 'Sem retorno',
        lossReasonId: 'r1',
        configuredLossReason: { id: 'r1', name: 'Sem retorno' },
      },
    });
    campaignLeadUpdate.mockResolvedValue({ id: 'cl-1' });

    await service.reactivateLead(
      tenantId,
      'camp-1',
      'cl-1',
      { notes: 'Cliente voltou' },
      actor,
    );

    const updateArg = firstArg<LeadUpdateArg>(leadUpdate);
    expect(updateArg.data.status).toBe('contacted');
    expect(updateArg.data.nextReactivationAt).toBeNull();
    const publishArg = firstArg<ActivityPublishArg>(publish);
    expect(publishArg.operationalEventKind).toBe('lead_reactivated_campaign');
    expect(publishArg.leadId).toBe('lead-1');
    expect(publishArg.metadata).toMatchObject({
      campaignId: 'camp-1',
      action: 'campaign_reopen',
    });
  });

  it('404 quando campanha fora do ACL', async () => {
    const { service, campaignFindFirst } = createService();
    campaignFindFirst.mockResolvedValue(null);
    await expect(
      service.getById(tenantId, 'missing', actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
