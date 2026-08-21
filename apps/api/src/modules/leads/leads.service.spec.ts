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
      const { businessUnits: _nested, ...rest } = data;
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

    const prisma = {
      lead: { create: leadCreate },
      user: { findFirst: userFindFirst },
    } as unknown as PrismaService;

    const ownership = {
      resolveContext: jest.fn().mockResolvedValue({
        teamIds: ['team-1'],
      }),
    } as unknown as OwnershipService;

    const activityEngine = {} as ActivityEngineService;
    const businessUnits = {
      assertIds: jest.fn(async (_tenant: string, ids: string[]) => ids),
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
