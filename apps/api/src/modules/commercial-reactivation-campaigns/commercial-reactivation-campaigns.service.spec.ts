import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CommercialReactivationCampaignsService } from './commercial-reactivation-campaigns.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { BusinessUnitAccessService } from '../access/business-unit-access.service';

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

    const buAccess = {
      resolveIds: jest.fn().mockResolvedValue(null),
      leadWhere: jest.fn().mockResolvedValue(undefined),
    } as unknown as BusinessUnitAccessService;

    const service = new CommercialReactivationCampaignsService(
      prisma as unknown as PrismaService,
      activityEngine,
      buAccess,
    );

    return {
      service,
      prisma,
      publish,
      campaignCreate,
      campaignUpdate,
      campaignFindFirst,
      campaignLeadCount,
      campaignLeadCreateMany,
      campaignLeadFindFirst,
      campaignLeadUpdate,
      leadCount,
      leadUpdate,
      buAccess,
    };
  }

  it('cria campanha e registra campaign_created', async () => {
    const { service, campaignCreate, publish } = createService();
    const result = await service.create(
      tenantId,
      { name: 'Campanha Q3', description: 'Teste' },
      actor,
    );

    expect(campaignCreate).toHaveBeenCalled();
    const publishArg = firstArg<ActivityPublishArg>(publish);
    expect(publishArg.operationalEventKind).toBe('campaign_created');
    expect(publishArg.metadata).toMatchObject({ campaignId: 'camp-1' });
    expect(result.name).toBe('Campanha Q3');
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
    const { service, campaignLeadCreateMany, publish, campaignFindFirst } =
      createService();
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
