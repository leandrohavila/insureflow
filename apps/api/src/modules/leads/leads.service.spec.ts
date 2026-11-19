import { NotFoundException } from '@nestjs/common';

import { LeadsService } from './leads.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { OwnershipService } from '../access/ownership.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { BusinessUnitsService } from '../business-units/business-units.service';

describe('LeadsService.createLead', () => {
  const tenantId = 'tenant-1';
  const actor = {
    userId: 'user-owner',
    roles: ['comercial'],
    permissions: ['leads:manage'],
  };

  function createService(options?: {
    assignedUser?: { id: string; name: string; email: string } | null;
    primaryTeamId?: string | null;
  }) {
    const assignedUser = options?.assignedUser ?? {
      id: 'user-partner',
      name: 'Ana Costa',
      email: 'ana@insureflow.com',
    };

    const leadCreate = jest.fn().mockImplementation(({ data }) => {
      const { businessUnits, ...rest } = data;
      void businessUnits;
      return Promise.resolve({
        ...rest,
        id: 'lead-new-1',
        dealId: null,
        createdAt: new Date('2026-07-22T20:00:00.000Z'),
        updatedAt: new Date('2026-07-22T20:00:00.000Z'),
        businessUnit: null,
        businessUnits: [],
        interestCategories: rest.interestCategories ?? [],
        lostReason: rest.lostReason ?? null,
        lossReasonId: rest.lossReasonId ?? null,
        lostAt: rest.lostAt ?? null,
        reactivationEnabled: rest.reactivationEnabled ?? true,
        reactivationDays: rest.reactivationDays ?? null,
        reactivationAttempts: rest.reactivationAttempts ?? 0,
        nextReactivationAt: rest.nextReactivationAt ?? null,
        lastReactivatedAt: rest.lastReactivatedAt ?? null,
        ownerUser: assignedUser
          ? {
              id: assignedUser.id,
              name: assignedUser.name,
              initials: 'AC',
            }
          : null,
      });
    });

    const userFindFirst = jest.fn().mockImplementation(({ where, select }) => {
      if (where.id === actor.userId && where.tenantId === tenantId) {
        return Promise.resolve({
          primaryTeamId: options?.primaryTeamId ?? 'team-1',
        });
      }

      if (where.OR || where.id === 'user-partner') {
        return Promise.resolve(
          assignedUser
            ? select
              ? {
                  id: assignedUser.id,
                  name: assignedUser.name,
                  email: assignedUser.email,
                }
              : { id: assignedUser.id }
            : null,
        );
      }

      return Promise.resolve(null);
    });

    const activityDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const activityCreateMany = jest.fn().mockResolvedValue({ count: 0 });
    const activityCreate = jest.fn().mockResolvedValue({ id: 'act-next-1' });
    const prisma = {
      lead: {
        create: leadCreate,
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { findFirst: userFindFirst },
      $queryRaw: jest
        .fn()
        .mockResolvedValue([
          { id: 'lead-new-1', d60: false, d30: false, d15: false },
        ]),
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn(prisma),
      ),
      activity: {
        deleteMany: activityDeleteMany,
        createMany: activityCreateMany,
        create: activityCreate,
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    const ownership = {
      resolveContext: jest.fn().mockResolvedValue({
        teamIds: ['team-1'],
      }),
    } as unknown as OwnershipService;

    const activityEngine = {} as ActivityEngineService;
    const businessUnits = {
      assertIds: jest.fn((_tenant: string, ids: string[]) =>
        Promise.resolve(ids),
      ),
    } as unknown as BusinessUnitsService;

    const followUps = {
      scheduleOnLeadCreate: jest.fn().mockResolvedValue(null),
      isFollowUpType: jest.fn().mockReturnValue(false),
    };
    const lossReasons = { findOne: jest.fn() };

    return {
      service: new LeadsService(
        prisma,
        ownership,
        activityEngine,
        businessUnits,
        followUps as never,
        lossReasons as never,
      ),
      leadCreate,
      activityCreate,
      activityCreateMany,
      followUps,
    };
  }

  it('persists status=new when payload omits status', async () => {
    const { service, leadCreate } = createService();

    const result = await service.createLead(
      tenantId,
      { name: 'Marina Costa' },
      actor,
    );

    expect(leadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Marina Costa',
          status: 'new',
          tenantId,
          ownerUserId: actor.userId,
        }),
      }),
    );
    expect(result.status).toBe('new');
  });

  it('resolves assignedTo display name to ownerUserId', async () => {
    const { service, leadCreate } = createService();

    await service.createLead(
      tenantId,
      { name: 'Lead Atribuído', assignedTo: 'Ana Costa' },
      actor,
    );

    expect(leadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignedTo: 'Ana Costa',
          ownerUserId: 'user-partner',
        }),
      }),
    );
  });

  it('creates a custom next-contact activity for the owner', async () => {
    const { service, activityCreate, activityCreateMany, followUps } =
      createService({
        assignedUser: {
          id: 'user-leandro',
          name: 'Leandro',
          email: 'leandro@insureflow.com',
        },
      });
    const at = '2027-03-15T13:00:00.000Z';

    await service.createLead(
      tenantId,
      {
        name: 'Bruna Lopes Coelho',
        assignedTo: 'Leandro',
        opportunityType: 'renewal',
        currentInsurer: 'Porto Seguro',
        policyExpiresAt: '2027-04-15',
        nextContactAt: at,
        nextContactType: 'whatsapp',
        nextContactNotes: 'Conquistar apólice',
      },
      actor,
    );

    const { scheduleOnLeadCreate } = followUps;
    expect(scheduleOnLeadCreate).not.toHaveBeenCalled();
    const createCalls = activityCreate.mock.calls as unknown as Array<
      [
        {
          data: {
            type: string;
            leadId: string;
            performedById: string;
            occurredAt: Date;
            nextFollowUpAt: Date;
            operationalEventKind: string;
          };
        },
      ]
    >;
    const nextContact = createCalls.find(
      (call) => call[0]?.data.operationalEventKind === 'lead_next_contact',
    );
    expect(nextContact?.[0]?.data).toEqual(
      expect.objectContaining({
        type: 'whatsapp',
        leadId: 'lead-new-1',
        performedById: 'user-leandro',
        occurredAt: new Date(at),
        nextFollowUpAt: new Date(at),
        operationalEventKind: 'lead_next_contact',
      }),
    );
    expect(activityCreate).toHaveBeenCalled();
    expect(activityCreateMany).not.toHaveBeenCalled();
  });

  it('stores normalized document digits from contract payload', async () => {
    const { service, leadCreate } = createService();

    await service.createLead(
      tenantId,
      {
        name: 'Lead CPF',
        documentType: 'cpf',
        document: '529.982.247-25',
      },
      actor,
    );

    expect(leadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          documentType: 'cpf',
          document: '52998224725',
        }),
      }),
    );
  });

  it('deduplicates simultaneous creates with the same idempotency key', async () => {
    const { service, leadCreate } = createService();

    const [first, second] = await Promise.all([
      service.createLead(
        tenantId,
        { name: 'Lead Protegido', email: 'lead@email.com' },
        actor,
        { idempotencyKey: 'bug-009-key' },
      ),
      service.createLead(
        tenantId,
        { name: 'Lead Protegido', email: 'lead@email.com' },
        actor,
        { idempotencyKey: 'bug-009-key' },
      ),
    ]);

    expect(leadCreate).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('deduplicates simultaneous creates with the same payload while pending', async () => {
    const { service, leadCreate } = createService();

    const [first, second] = await Promise.all([
      service.createLead(
        tenantId,
        { name: 'Lead Sem Header', phone: '(11) 99999-9999' },
        actor,
      ),
      service.createLead(
        tenantId,
        { name: 'Lead Sem Header', phone: '(11) 99999-9999' },
        actor,
      ),
    ]);

    expect(leadCreate).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });
});

describe('LeadsService.updateLead lost', () => {
  const tenantId = 'tenant-1';
  const leadId = 'lead-1';
  const actor = {
    userId: 'user-owner',
    tenantId,
    roles: ['comercial'],
    permissions: ['leads:manage'],
  };

  function updatedLead(data: Record<string, unknown>) {
    return {
      id: leadId,
      tenantId,
      name: 'Marina Costa',
      email: 'marina@email.com',
      phone: null,
      company: null,
      source: 'whatsapp',
      documentType: null,
      document: null,
      notes: 'Nota original',
      assignedTo: 'Ana Costa',
      ownerUserId: 'user-owner',
      ownerTeamId: null,
      businessUnitId: null,
      interestCategories: [],
      dealId: null,
      reactivationAttempts: 0,
      lastReactivatedAt: null,
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      updatedAt: new Date('2026-07-22T12:00:00.000Z'),
      ownerUser: { id: 'user-owner', name: 'Ana Costa', initials: 'AC' },
      businessUnit: null,
      businessUnits: [],
      ...data,
    };
  }

  function createUpdateService(reason: Record<string, unknown> | null) {
    const leadUpdate = jest
      .fn()
      .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve(updatedLead(data)),
      );
    const findOne = jest.fn().mockResolvedValue(reason);
    const publish = jest.fn().mockResolvedValue(null);
    const prisma = {
      lead: {
        findFirst: jest.fn().mockImplementation(({ select }) => {
          if (select?.status) {
            return Promise.resolve({
              ownerUserId: 'user-owner',
              status: 'qualified',
              businessUnitId: null,
              businessUnits: [],
            });
          }
          return Promise.resolve({ id: leadId });
        }),
        update: leadUpdate,
      },
      leadReactivationSetting: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      activity: {
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    const service = new LeadsService(
      prisma,
      {
        getEnforcementMode: jest.fn().mockResolvedValue('off'),
      } as unknown as OwnershipService,
      { publish } as unknown as ActivityEngineService,
      {} as BusinessUnitsService,
      {} as never,
      { findOne } as never,
    );

    return { service, leadUpdate, findOne, publish };
  }

  it('rejeita perda sem motivo e não grava o lead', async () => {
    const { service, leadUpdate, findOne } = createUpdateService(null);

    await expect(
      service.updateLead(tenantId, leadId, { status: 'lost' }, actor),
    ).rejects.toThrow(
      'Motivo de perda é obrigatório ao marcar o lead como perdido.',
    );

    expect(findOne).not.toHaveBeenCalled();
    expect(leadUpdate).not.toHaveBeenCalled();
  });

  it('rejeita motivo inativo', async () => {
    const { service, leadUpdate } = createUpdateService({
      id: 'reason-off',
      name: 'Motivo antigo',
      isActive: false,
      reactivationEnabled: false,
      reactivationDays: null,
    });

    await expect(
      service.updateLead(
        tenantId,
        leadId,
        { status: 'lost', lossReasonId: 'reason-off' },
        actor,
      ),
    ).rejects.toThrow('Motivo de perda inválido ou inativo.');

    expect(leadUpdate).not.toHaveBeenCalled();
  });

  it('rejeita motivo inexistente', async () => {
    const { service, leadUpdate, findOne } = createUpdateService(null);
    findOne.mockRejectedValue(
      new NotFoundException('Motivo de perda não encontrado'),
    );

    await expect(
      service.updateLead(
        tenantId,
        leadId,
        { status: 'lost', lossReasonId: 'missing' },
        actor,
      ),
    ).rejects.toThrow('Motivo de perda não encontrado');

    expect(leadUpdate).not.toHaveBeenCalled();
  });

  it('marca como perdido com motivo ativo e agenda a reativação do motivo', async () => {
    const { service, leadUpdate, publish } = createUpdateService({
      id: 'reason-1',
      name: 'Sem orçamento',
      isActive: true,
      reactivationEnabled: true,
      reactivationDays: 30,
    });

    const result = await service.updateLead(
      tenantId,
      leadId,
      { status: 'lost', lossReasonId: 'reason-1' },
      actor,
    );

    const data = leadUpdate.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.status).toBe('lost');
    expect(data.lossReasonId).toBe('reason-1');
    expect(data.lostReason).toBe('Sem orçamento');
    expect(data.name).toBeUndefined();
    expect(data.email).toBeUndefined();
    expect(data.notes).toBeUndefined();
    expect(data.reactivationEnabled).toBe(true);
    expect(data.reactivationDays).toBe(30);
    expect(data.nextReactivationAt).toBeInstanceOf(Date);
    expect(data.lostAt).toBeInstanceOf(Date);
    const diffDays = Math.round(
      ((data.nextReactivationAt as Date).getTime() -
        (data.lostAt as Date).getTime()) /
        86_400_000,
    );
    expect(diffDays).toBe(30);
    expect(result.status).toBe('lost');
    expect(result.lostReason).toBe('Sem orçamento');
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'lead_lost',
        leadId,
      }),
    );
  });

  it('motivo sem reativação não agenda a próxima data', async () => {
    const { service, leadUpdate } = createUpdateService({
      id: 'reason-2',
      name: 'Sem interesse',
      isActive: true,
      reactivationEnabled: false,
      reactivationDays: null,
    });

    await service.updateLead(
      tenantId,
      leadId,
      { status: 'lost', lossReasonId: 'reason-2' },
      actor,
    );

    const data = leadUpdate.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.reactivationEnabled).toBe(false);
    expect(data.nextReactivationAt).toBeNull();
    expect(data.reactivationDays).toBeNull();
  });
});
