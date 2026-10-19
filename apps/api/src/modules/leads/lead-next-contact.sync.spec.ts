import { syncLeadNextContactActivity } from './lead-next-contact.sync';
import { LEAD_NEXT_CONTACT_EVENT_KIND } from './lead-next-contact.util';

describe('syncLeadNextContactActivity', () => {
  function memory() {
    const rows: Array<{
      id: string;
      status: string;
      operationalEventKind: string;
      occurredAt: Date;
      description: string | null;
      type: string | null;
      dealId: string | null;
    }> = [];
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      activity: {
        findMany: jest.fn(() => rows),
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          const row = {
            id: 'act-1',
            status: 'pending',
            operationalEventKind: String(data.operationalEventKind),
            occurredAt: data.occurredAt as Date,
            description: (data.description as string | null) ?? null,
            type: (data.type as string | null) ?? null,
            dealId: null,
          };
          rows.push(row);
          return row;
        }),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            const row = rows.find((item) => item.id === where.id);
            if (!row) throw new Error('missing');
            if (data.occurredAt) row.occurredAt = data.occurredAt as Date;
            if ('description' in data)
              row.description = data.description as string | null;
            if (data.type) row.type = data.type as string;
            return row;
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
      tx,
      client: {
        $transaction: (fn: (db: typeof tx) => Promise<unknown>) => fn(tx),
      },
    };
  }

  it('cria atividade futura vinculada ao lead', async () => {
    const db = memory();
    const at = new Date('2027-03-15T14:00:00.000Z');
    const created = await syncLeadNextContactActivity(db.client as never, {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      performedById: 'user-1',
      at,
      type: 'whatsapp',
      notes: 'Contato em março para renovação',
    });
    expect(created).toBe(1);
    expect(db.rows[0]).toMatchObject({
      type: 'whatsapp',
      occurredAt: at,
      operationalEventKind: LEAD_NEXT_CONTACT_EVENT_KIND,
      description: 'Contato em março para renovação',
    });
  });

  it('remove a pendência quando a data vem nula e mantém a concluída', async () => {
    const db = memory();
    db.rows.push(
      {
        id: 'pending',
        status: 'pending',
        operationalEventKind: LEAD_NEXT_CONTACT_EVENT_KIND,
        occurredAt: new Date('2027-03-15T14:00:00.000Z'),
        description: 'antigo',
        type: 'call',
        dealId: 'deal-1',
      },
      {
        id: 'done',
        status: 'completed',
        operationalEventKind: LEAD_NEXT_CONTACT_EVENT_KIND,
        occurredAt: new Date('2027-03-01T14:00:00.000Z'),
        description: 'feito',
        type: 'call',
        dealId: 'deal-1',
      },
    );
    const created = await syncLeadNextContactActivity(db.client as never, {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      performedById: 'user-1',
      at: null,
    });
    expect(created).toBe(0);
    expect(db.rows.map((row) => row.id)).toEqual(['done']);
  });

  it('não chama o banco quando o PATCH omite a data', async () => {
    const db = memory();
    const created = await syncLeadNextContactActivity(db.client as never, {
      tenantId: 'tenant-1',
      leadId: 'lead-1',
      performedById: 'user-1',
      at: undefined,
    });
    expect(created).toBe(0);
    expect(db.tx.$queryRaw).not.toHaveBeenCalled();
  });
});
