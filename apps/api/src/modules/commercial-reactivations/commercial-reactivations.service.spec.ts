import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CommercialReactivationsService } from './commercial-reactivations.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { LeadFollowUpsService } from '../lead-follow-ups/lead-follow-ups.service';
import type { BusinessUnitAccessService } from '../access/business-unit-access.service';

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

describe('CommercialReactivationsService', () => {
  const tenantId = 'tenant-1';
  const actor = {
    userId: 'user-1',
    tenantId,
    roles: ['admin'],
    permissions: ['leads:manage', 'crm:view'],
    currentBusinessUnitId: 'bu-1',
  };

  const baseLead = {
    id: 'lead-1',
    tenantId,
    name: 'Bruna Lopes',
    phone: '11999990000',
    email: 'bruna@example.com',
    source: 'site',
    status: 'lost',
    ownerUserId: 'user-2',
    lossReasonId: 'reason-1',
    lostReason: 'Não respondeu',
    lostAt: new Date('2026-08-01T00:00:00.000Z'),
    nextReactivationAt: new Date('2026-09-01T00:00:00.000Z'),
    reactivationEnabled: true,
    lastContactAt: new Date('2026-07-20T00:00:00.000Z'),
    lastInteractionAt: new Date('2026-07-20T00:00:00.000Z'),
    businessUnitId: 'bu-1',
    configuredLossReason: { id: 'reason-1', name: 'Não respondeu' },
    ownerUser: { id: 'user-2', name: 'Ana' },
    followUps: [] as { scheduledAt: Date }[],
  };

  function createService(overrides?: {
    leadWhere?: unknown;
    findFirst?: jest.Mock;
    findMany?: jest.Mock;
    count?: jest.Mock;
    update?: jest.Mock;
  }) {
    const findFirst =
      overrides?.findFirst ?? jest.fn().mockResolvedValue(baseLead);
    const findMany =
      overrides?.findMany ??
      jest.fn().mockResolvedValue([{ ...baseLead, followUps: [] }]);
    const count = overrides?.count ?? jest.fn().mockResolvedValue(1);
    const update =
      overrides?.update ??
      jest
        .fn()
        .mockImplementation((args: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...baseLead, ...args.data }),
        );

    const prisma = {
      lead: { findFirst, findMany, count, update },
    } as unknown as PrismaService;

    const publish = jest.fn().mockResolvedValue({ id: 'act-1', created: true });
    const activityEngine = { publish } as unknown as ActivityEngineService;

    const createFollowUp = jest.fn().mockResolvedValue({ id: 'fu-1' });
    const followUps = {
      create: createFollowUp,
    } as unknown as LeadFollowUpsService;

    const leadWhere = jest
      .fn()
      .mockResolvedValue(overrides?.leadWhere ?? { businessUnitId: 'bu-1' });
    const buAccess = {
      leadWhere,
    } as unknown as BusinessUnitAccessService;

    const service = new CommercialReactivationsService(
      prisma,
      activityEngine,
      followUps,
      buAccess,
    );

    return {
      service,
      publish,
      createFollowUp,
      update,
      findFirst,
      findMany,
      count,
      leadWhere,
    };
  }

  it('lista fila com métricas e aplica ACL de BU', async () => {
    const { service, leadWhere, findMany } = createService();
    const result = await service.list(
      tenantId,
      { window: 'overdue', page: 1, limit: 20 },
      actor,
    );

    expect(leadWhere).toHaveBeenCalled();
    expect(findMany).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.lossReasonName).toBe('Não respondeu');
    expect(result.metrics.today).toBeGreaterThanOrEqual(0);
    expect(result.metrics.overdue).toBeGreaterThanOrEqual(0);
    expect(result.metrics.next7).toBeGreaterThanOrEqual(0);
  });

  it('reativa lead: status ativo, limpa fila, follow-up e auditoria', async () => {
    const { service, update, publish, createFollowUp } = createService();
    const result = await service.reactivate(
      tenantId,
      'lead-1',
      { notes: 'Cliente pediu retorno' },
      actor,
    );

    const updateArg = firstArg<LeadUpdateArg>(update);
    expect(updateArg.data.status).toBe('contacted');
    expect(updateArg.data.nextReactivationAt).toBeNull();
    expect(createFollowUp).toHaveBeenCalled();
    const publishArg = firstArg<ActivityPublishArg>(publish);
    expect(publishArg.operationalEventKind).toBe('lead_reactivated');
    expect(publishArg.leadId).toBe('lead-1');
    expect(publishArg.metadata).toMatchObject({
      action: 'manual_reopen',
      fromStatus: 'lost',
      toStatus: 'contacted',
    });
    expect(result.status).toBe('contacted');
  });

  it('adia +15 dias com auditoria lead_reactivation_postponed', async () => {
    const { service, update, publish } = createService();
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-09-16T12:00:00.000Z').getTime());

    await service.postpone(
      tenantId,
      'lead-1',
      { days: 15, reason: 'Cliente viajou nesta semana' },
      actor,
    );

    const updateArg = firstArg<LeadUpdateArg>(update);
    expect(updateArg.data.nextReactivationAt).toBeInstanceOf(Date);
    const publishArg = firstArg<ActivityPublishArg>(publish);
    expect(publishArg.operationalEventKind).toBe('lead_reactivation_postponed');
    expect(publishArg.metadata).toMatchObject({
      action: 'postpone',
      preset: 15,
      reasonText: 'Cliente viajou nesta semana',
    });

    nowSpy.mockRestore();
  });

  it('rejeita adiamento sem days nem at', async () => {
    const { service } = createService();
    await expect(
      service.postpone(
        tenantId,
        'lead-1',
        { reason: 'sem data definida aqui' },
        actor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404 quando lead fora da fila ou sem ACL', async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue(null),
    });
    await expect(
      service.reactivate(tenantId, 'missing', {}, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
