import { LeadsService } from './leads.service';
import { leadRenewalEventKind } from './lead-renewal-agenda.util';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { OwnershipService } from '../access/ownership.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { BusinessUnitsService } from '../business-units/business-units.service';

type Row = {
  id: string;
  status: string;
  operationalEventKind: string | null;
  occurredAt: Date;
  description: string | null;
  dealId: string | null;
  customerId: string | null;
  policyId: string | null;
  type: string | null;
  outcome: string | null;
  createdAt: Date;
};

describe('updateLead confirma vencimento e lembretes na mesma transação', () => {
  const tenantId = 'tenant-1';
  const actor = {
    userId: 'user-owner',
    roles: ['comercial'],
    permissions: ['leads:manage'],
  };
  const originalExpiry = new Date('2027-04-15T00:00:00.000Z');
  const manualAt = new Date('2027-02-01T14:30:00.000Z');

  function harness(options?: { hideLockedLead?: boolean }) {
    const lead = {
      id: 'lead-1',
      tenantId,
      name: 'Marina Costa',
      email: null as string | null,
      phone: null as string | null,
      company: null as string | null,
      source: null as string | null,
      documentType: null as string | null,
      document: null as string | null,
      status: 'new',
      notes: null as string | null,
      assignedTo: 'Ana Costa',
      ownerUserId: 'user-owner',
      ownerTeamId: null as string | null,
      policyExpiresAt: new Date(originalExpiry),
      renewalD60Disabled: false,
      renewalD30Disabled: false,
      renewalD15Disabled: false,
      opportunityType: 'renewal',
      currentInsurer: null as string | null,
      currentPolicyNumber: null as string | null,
      lastContactAt: new Date('2026-01-01T00:00:00.000Z'),
      lastInteractionAt: new Date('2026-01-01T00:00:00.000Z'),
      businessUnitId: null as string | null,
      interestCategories: [] as string[],
      lostReason: null as string | null,
      lossReasonId: null as string | null,
      lostAt: null as Date | null,
      reactivationEnabled: true,
      reactivationDays: null as number | null,
      reactivationAttempts: 0,
      nextReactivationAt: null as Date | null,
      lastReactivatedAt: null as Date | null,
      dealId: null as string | null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const rows: Row[] = [];
    let sequence = 0;
    let chain: Promise<unknown> = Promise.resolve();
    const copyLead = () => ({
      ...lead,
      policyExpiresAt: lead.policyExpiresAt
        ? new Date(lead.policyExpiresAt)
        : null,
    });
    const view = () => ({
      ...copyLead(),
      businessUnits: [],
      businessUnit: null,
      ownerUser: null,
    });
    const tx = {
      $queryRaw: jest.fn(() =>
        options?.hideLockedLead
          ? []
          : [
              {
                id: lead.id,
                d60: lead.renewalD60Disabled,
                d30: lead.renewalD30Disabled,
                d15: lead.renewalD15Disabled,
              },
            ],
      ),
      lead: {
        findFirst: jest.fn(() => view()),
        update: jest.fn(({ data }: { data: Partial<typeof lead> }) => {
          Object.assign(lead, data);
          return view();
        }),
        updateMany: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string; tenantId: string };
            data: {
              renewalD60Disabled?: boolean;
              renewalD30Disabled?: boolean;
              renewalD15Disabled?: boolean;
            };
          }) => {
            if (where.tenantId !== tenantId || where.id !== lead.id) {
              return { count: 0 };
            }
            Object.assign(lead, data);
            return { count: 1 };
          },
        ),
      },
      activity: {
        findMany: jest.fn(
          ({
            where,
          }: {
            where?: {
              status?: string;
              operationalEventKind?: { in?: string[] };
            };
          }) =>
            rows.filter((row) => {
              if (where?.status && row.status !== where.status) return false;
              const kinds = where?.operationalEventKind?.in;
              if (kinds && !kinds.includes(row.operationalEventKind ?? '')) {
                return false;
              }
              return true;
            }),
        ),
        create: jest.fn(({ data }: { data: Omit<Row, 'id' | 'createdAt'> }) => {
          sequence += 1;
          const row: Row = {
            id: `act-${sequence}`,
            status: data.status,
            operationalEventKind: data.operationalEventKind,
            occurredAt: data.occurredAt,
            description: data.description ?? null,
            dealId: data.dealId ?? null,
            customerId: data.customerId ?? null,
            policyId: data.policyId ?? null,
            type: data.type ?? null,
            outcome: data.outcome ?? null,
            createdAt: new Date(sequence),
          };
          rows.push(row);
          return row;
        }),
        update: jest.fn(
          ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
            const row = rows.find((item) => item.id === where.id);
            if (!row) throw new Error('missing');
            Object.assign(row, data);
            return row;
          },
        ),
        updateMany: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string; status?: string };
            data: Partial<Row>;
          }) => {
            const row = rows.find(
              (item) => item.id === where.id && item.status === 'pending',
            );
            if (!row) return { count: 0 };
            Object.assign(row, data);
            return { count: 1 };
          },
        ),
        groupBy: jest.fn(() => []),
      },
    };
    const prisma = {
      ...tx,
      user: { findFirst: jest.fn(() => null) },
      $transaction: jest.fn((fn: (db: typeof tx) => Promise<unknown>) => {
        const run = chain.then(async () => {
          const leadSnap = copyLead();
          const rowSnap = rows.map((row) => ({ ...row }));
          try {
            return await fn(tx);
          } catch (error) {
            Object.assign(lead, leadSnap);
            rows.splice(0, rows.length, ...rowSnap);
            throw error;
          }
        });
        chain = run.then(
          () => undefined,
          () => undefined,
        );
        return run;
      }),
    };

    const service = new LeadsService(
      prisma as unknown as PrismaService,
      {
        getEnforcementMode: jest.fn(() => 'off'),
        resolveContext: jest.fn(),
      } as unknown as OwnershipService,
      {} as ActivityEngineService,
      { assertIds: jest.fn() } as unknown as BusinessUnitsService,
      {
        scheduleOnLeadCreate: jest.fn(),
        isFollowUpType: jest.fn(),
      } as never,
      { findOne: jest.fn() } as never,
    );

    return { lead, rows, tx, service };
  }

  it('grava o novo vencimento e preserva a data manual do lembrete', async () => {
    const db = harness();
    db.rows.push({
      id: 'act-manual',
      status: 'pending',
      operationalEventKind: leadRenewalEventKind(60),
      occurredAt: manualAt,
      description: 'Ligar para o corretor',
      dealId: 'deal-1',
      customerId: null,
      policyId: null,
      type: 'renewal',
      outcome: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const saved = await db.service.updateLead(
      tenantId,
      'lead-1',
      {
        name: 'Marina Atualizada',
        policyExpiresAt: '2027-06-15',
        renewalReminderD60: manualAt.toISOString(),
        renewalReminderD30: '2027-05-16T12:00:00.000Z',
        renewalReminderD15: '2027-05-31T12:00:00.000Z',
      },
      actor,
    );

    expect(saved.policyExpiresAt).toBe('2027-06-15T00:00:00.000Z');
    expect(db.lead.policyExpiresAt?.toISOString()).toBe(
      '2027-06-15T00:00:00.000Z',
    );
    expect(db.lead.name).toBe('Marina Atualizada');
    expect(db.rows.find((row) => row.id === 'act-manual')).toMatchObject({
      occurredAt: manualAt,
      description: 'Ligar para o corretor',
      dealId: 'deal-1',
      status: 'pending',
    });
    expect(db.lead.renewalD60Disabled).toBe(false);
  });

  it('mantém D-60 desativado ao trocar o vencimento', async () => {
    const db = harness();
    db.lead.renewalD60Disabled = true;
    db.rows.push({
      id: 'act-off',
      status: 'cancelled',
      operationalEventKind: leadRenewalEventKind(60),
      occurredAt: manualAt,
      description: 'desativado',
      dealId: 'deal-1',
      customerId: null,
      policyId: null,
      type: 'renewal',
      outcome: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await db.service.updateLead(
      tenantId,
      'lead-1',
      {
        policyExpiresAt: '2027-07-15',
        renewalReminderD60: null,
        renewalReminderD30: '2027-06-15T12:00:00.000Z',
        renewalReminderD15: '2027-06-30T12:00:00.000Z',
      },
      actor,
    );

    expect(db.lead.policyExpiresAt?.toISOString()).toBe(
      '2027-07-15T00:00:00.000Z',
    );
    expect(db.lead.renewalD60Disabled).toBe(true);
    expect(
      db.rows.filter(
        (row) =>
          row.operationalEventKind === leadRenewalEventKind(60) &&
          row.status === 'pending',
      ),
    ).toHaveLength(0);
    expect(db.rows.find((row) => row.id === 'act-off')).toMatchObject({
      status: 'cancelled',
      dealId: 'deal-1',
    });
  });

  it('desfaz vencimento, nome e atividade quando a sincronização falha', async () => {
    const db = harness();
    db.rows.push({
      id: 'act-manual',
      status: 'pending',
      operationalEventKind: leadRenewalEventKind(60),
      occurredAt: manualAt,
      description: 'Ligar para o corretor',
      dealId: 'deal-1',
      customerId: null,
      policyId: null,
      type: 'renewal',
      outcome: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    db.tx.activity.update.mockImplementationOnce(() => {
      throw new Error('falha de persistência');
    });

    await expect(
      db.service.updateLead(
        tenantId,
        'lead-1',
        {
          name: 'Nome que não pode permanecer',
          policyExpiresAt: '2027-08-15',
          renewalReminderD60: '2027-06-16T12:00:00.000Z',
          renewalReminderD30: '2027-07-16T12:00:00.000Z',
          renewalReminderD15: '2027-07-31T12:00:00.000Z',
        },
        actor,
      ),
    ).rejects.toThrow('falha de persistência');

    expect(db.lead.name).toBe('Marina Costa');
    expect(db.lead.policyExpiresAt?.toISOString()).toBe(
      originalExpiry.toISOString(),
    );
    expect(db.lead.renewalD60Disabled).toBe(false);
    expect(db.rows.find((row) => row.id === 'act-manual')).toMatchObject({
      status: 'pending',
      occurredAt: manualAt,
      description: 'Ligar para o corretor',
      dealId: 'deal-1',
    });
  });

  it('desfaz o vencimento quando o bloqueio do lead não encontra o tenant', async () => {
    const db = harness({ hideLockedLead: true });

    await expect(
      db.service.updateLead(
        tenantId,
        'lead-1',
        {
          policyExpiresAt: '2027-09-15',
          renewalReminderD60: '2027-07-17T12:00:00.000Z',
          renewalReminderD30: '2027-08-16T12:00:00.000Z',
          renewalReminderD15: '2027-08-31T12:00:00.000Z',
        },
        actor,
      ),
    ).rejects.toThrow('Lead não encontrado');

    expect(db.lead.policyExpiresAt?.toISOString()).toBe(
      originalExpiry.toISOString(),
    );
    expect(db.rows).toHaveLength(0);
  });

  it('serializa atualizações concorrentes sem duplicar o lembrete nem misturar o vencimento', async () => {
    const db = harness();
    const firstExpiry = '2027-05-15';
    const secondExpiry = '2027-06-15';
    const firstReminder = '2027-03-16T12:00:00.000Z';
    const secondReminder = '2027-04-16T12:00:00.000Z';

    await Promise.all([
      db.service.updateLead(
        tenantId,
        'lead-1',
        {
          policyExpiresAt: firstExpiry,
          renewalReminderD60: firstReminder,
          renewalReminderD30: null,
          renewalReminderD15: null,
        },
        actor,
      ),
      db.service.updateLead(
        tenantId,
        'lead-1',
        {
          policyExpiresAt: secondExpiry,
          renewalReminderD60: secondReminder,
          renewalReminderD30: null,
          renewalReminderD15: null,
        },
        actor,
      ),
    ]);

    const pending = db.rows.filter(
      (row) =>
        row.operationalEventKind === leadRenewalEventKind(60) &&
        row.status === 'pending',
    );
    expect(pending).toHaveLength(1);
    const expiry = db.lead.policyExpiresAt?.toISOString().slice(0, 10);
    expect([firstExpiry, secondExpiry]).toContain(expiry);
    expect(pending[0]?.occurredAt.toISOString()).toBe(
      expiry === firstExpiry ? firstReminder : secondReminder,
    );
    expect(db.lead.renewalD30Disabled).toBe(true);
    expect(db.lead.renewalD15Disabled).toBe(true);
  });
});
