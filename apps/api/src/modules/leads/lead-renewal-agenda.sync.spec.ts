import { syncLeadRenewalActivities } from './lead-renewal-agenda.sync';
import { leadRenewalEventKind } from './lead-renewal-agenda.util';
import { renewalReminderSlotsFromDto } from './lead-renewal-agenda.util';

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
  nextFollowUpAt?: Date;
};

function memoryPrisma() {
  const rows: Row[] = [];
  const flags = { d60: false, d30: false, d15: false };
  let chain: Promise<unknown> = Promise.resolve();
  let sequence = 0;
  const tx = {
    $queryRaw: jest.fn(() => [
      { id: 'lead-1', d60: flags.d60, d30: flags.d30, d15: flags.d15 },
    ]),
    lead: {
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
          if (where.tenantId !== 'tenant-1' || where.id !== 'lead-1') {
            return { count: 0 };
          }
          if (data.renewalD60Disabled !== undefined) {
            flags.d60 = data.renewalD60Disabled;
          }
          if (data.renewalD30Disabled !== undefined) {
            flags.d30 = data.renewalD30Disabled;
          }
          if (data.renewalD15Disabled !== undefined) {
            flags.d15 = data.renewalD15Disabled;
          }
          return { count: 1 };
        },
      ),
    },
    activity: {
      findMany: jest.fn(() =>
        [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ),
      create: jest.fn(
        ({
          data,
        }: {
          data: Omit<Row, 'id' | 'createdAt'> & { createdAt?: Date };
        }) => {
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
            nextFollowUpAt: data.occurredAt,
          };
          rows.push(row);
          return row;
        },
      ),
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
      delete: jest.fn(({ where }: { where: { id: string } }) => {
        const index = rows.findIndex((item) => item.id === where.id);
        if (index >= 0) rows.splice(index, 1);
      }),
    },
  };
  return {
    rows,
    flags,
    tx,
    client: {
      $transaction: (fn: (db: typeof tx) => Promise<unknown>) => {
        const run = chain.then(async () => {
          const snapshot = rows.map((row) => ({ ...row }));
          const flagSnapshot = { ...flags };
          try {
            return await fn(tx);
          } catch (error) {
            rows.splice(0, rows.length, ...snapshot);
            flags.d60 = flagSnapshot.d60;
            flags.d30 = flagSnapshot.d30;
            flags.d15 = flagSnapshot.d15;
            throw error;
          }
        });
        chain = run.then(
          () => undefined,
          () => undefined,
        );
        return run;
      },
    },
  };
}

describe('syncLeadRenewalActivities', () => {
  const expiresAt = new Date('2099-12-31T00:00:00.000Z');

  it('cria sugestões uma vez e o segundo salvamento não duplica', async () => {
    const db = memoryPrisma();
    const input = {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      performedById: 'user-1',
      expiresAt,
      generateMissing: true,
    };
    await syncLeadRenewalActivities(db.client as never, input);
    const firstIds = db.rows.map((row) => row.id);
    await syncLeadRenewalActivities(db.client as never, input);
    expect(db.rows.map((row) => row.operationalEventKind)).toEqual([
      leadRenewalEventKind(60),
      leadRenewalEventKind(30),
      leadRenewalEventKind(15),
    ]);
    expect(db.rows.map((row) => row.id)).toEqual(firstIds);
  });

  it('serializa salvamentos concorrentes sem duplicar o lembrete', async () => {
    const db = memoryPrisma();
    const input = {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      performedById: 'user-1',
      expiresAt,
      generateMissing: true,
    };
    await Promise.all([
      syncLeadRenewalActivities(db.client as never, input),
      syncLeadRenewalActivities(db.client as never, input),
    ]);
    expect(
      db.rows.filter(
        (row) => row.operationalEventKind === leadRenewalEventKind(60),
      ),
    ).toHaveLength(1);
  });

  it('preserva id, vínculos e descrição ao mudar só o horário', async () => {
    const db = memoryPrisma();
    db.rows.push({
      id: 'act-manual',
      status: 'pending',
      operationalEventKind: leadRenewalEventKind(60),
      occurredAt: new Date('2027-02-01T12:00:00.000Z'),
      description: 'Ligar para o corretor',
      dealId: 'deal-1',
      customerId: 'customer-1',
      policyId: 'policy-1',
      type: 'renewal',
      outcome: 'sem resposta',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    await syncLeadRenewalActivities(db.client as never, {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      performedById: 'user-1',
      slots: { 60: new Date('2027-02-14T12:00:00.000Z') },
    });
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({
      id: 'act-manual',
      description: 'Ligar para o corretor',
      dealId: 'deal-1',
      customerId: 'customer-1',
      policyId: 'policy-1',
      outcome: 'sem resposta',
      occurredAt: new Date('2027-02-14T12:00:00.000Z'),
    });
  });

  it('cancela o lembrete explícito e mantém concluído, cancelado e atividade manual', async () => {
    const db = memoryPrisma();
    db.rows.push(
      {
        id: 'pending',
        status: 'pending',
        operationalEventKind: leadRenewalEventKind(60),
        occurredAt: new Date('2027-02-14T12:00:00.000Z'),
        description: null,
        dealId: null,
        customerId: null,
        policyId: null,
        type: 'renewal',
        outcome: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'done',
        status: 'completed',
        operationalEventKind: leadRenewalEventKind(60),
        occurredAt: new Date('2027-02-14T12:00:00.000Z'),
        description: 'feito',
        dealId: 'deal-1',
        customerId: null,
        policyId: null,
        type: 'renewal',
        outcome: 'ok',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
      {
        id: 'cancelled',
        status: 'cancelled',
        operationalEventKind: leadRenewalEventKind(30),
        occurredAt: new Date('2027-03-01T12:00:00.000Z'),
        description: null,
        dealId: null,
        customerId: null,
        policyId: null,
        type: 'renewal',
        outcome: null,
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
      },
      {
        id: 'manual',
        status: 'pending',
        operationalEventKind: 'manual_follow_up',
        occurredAt: new Date('2027-03-01T12:00:00.000Z'),
        description: 'manual',
        dealId: null,
        customerId: null,
        policyId: null,
        type: 'task',
        outcome: null,
        createdAt: new Date('2026-01-04T00:00:00.000Z'),
      },
    );
    await syncLeadRenewalActivities(db.client as never, {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      performedById: 'user-1',
      slots: { 60: null },
    });
    expect(db.rows.map((row) => row.id).sort()).toEqual([
      'cancelled',
      'done',
      'manual',
      'pending',
    ]);
    expect(db.rows.find((row) => row.id === 'pending')).toMatchObject({
      status: 'cancelled',
      dealId: null,
    });
    expect(db.rows.find((row) => row.id === 'done')).toMatchObject({
      status: 'completed',
      description: 'feito',
      dealId: 'deal-1',
      outcome: 'ok',
    });
    expect(db.flags.d60).toBe(true);
    expect(db.flags.d30).toBe(false);
  });

  it('não recria um lembrete desativado na sugestão seguinte', async () => {
    const db = memoryPrisma();
    db.flags.d60 = true;
    await syncLeadRenewalActivities(db.client as never, {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      performedById: 'user-1',
      expiresAt,
      generateMissing: true,
    });
    expect(
      db.rows.some(
        (row) => row.operationalEventKind === leadRenewalEventKind(60),
      ),
    ).toBe(false);
    expect(
      db.rows.filter(
        (row) => row.operationalEventKind === leadRenewalEventKind(30),
      ),
    ).toHaveLength(1);
  });

  it('não grava agenda de outro tenant', async () => {
    const db = memoryPrisma();
    const created = await syncLeadRenewalActivities(db.client as never, {
      tenantId: 'outro-tenant',
      leadId: 'lead-1',
      performedById: 'user-1',
      expiresAt,
      generateMissing: true,
    });
    expect(created).toBe(0);
    expect(db.rows).toHaveLength(0);
  });

  it('reativa o lembrete só quando a data é enviada de novo', async () => {
    const db = memoryPrisma();
    db.flags.d60 = true;
    await syncLeadRenewalActivities(db.client as never, {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      performedById: 'user-1',
      slots: { 60: new Date('2027-02-14T12:00:00.000Z') },
    });
    expect(db.flags.d60).toBe(false);
    expect(
      db.rows.filter(
        (row) =>
          row.operationalEventKind === leadRenewalEventKind(60) &&
          row.status === 'pending',
      ),
    ).toHaveLength(1);
  });

  it('desfaz flag e status quando a persistência falha', async () => {
    const db = memoryPrisma();
    db.rows.push({
      id: 'pending',
      status: 'pending',
      operationalEventKind: leadRenewalEventKind(60),
      occurredAt: new Date('2027-02-14T12:00:00.000Z'),
      description: 'Ligar',
      dealId: 'deal-1',
      customerId: null,
      policyId: null,
      type: 'renewal',
      outcome: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    db.tx.activity.updateMany.mockImplementationOnce(() => {
      throw new Error('falha de persistência');
    });
    await expect(
      syncLeadRenewalActivities(db.client as never, {
        tenantId: 'tenant-1',
        leadId: 'lead-1',
        performedById: 'user-1',
        slots: { 60: null },
      }),
    ).rejects.toThrow('falha de persistência');
    expect(db.flags.d60).toBe(false);
    expect(db.rows.find((row) => row.id === 'pending')).toMatchObject({
      status: 'pending',
      description: 'Ligar',
      dealId: 'deal-1',
    });
  });

  it('não sincroniza renovação quando o PATCH só muda o tipo da oportunidade', () => {
    expect(renewalReminderSlotsFromDto({}).anyPresent).toBe(false);
    expect(
      renewalReminderSlotsFromDto({
        renewalReminderD60: null,
        renewalReminderD30: null,
        renewalReminderD15: null,
      }).slots,
    ).toEqual({ 60: null, 30: null, 15: null });
  });
});
