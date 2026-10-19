import { planExactKindAgenda } from './lead-agenda-reconcile';

const base = {
  tenantId: 'tenant-1',
  leadId: 'lead-1',
  performedById: 'user-1',
  type: 'renewal',
  status: 'pending' as const,
  subject: 'Renovação D-60',
  description: 'Sugestão',
};

describe('planExactKindAgenda', () => {
  it('não altera quando a data está ausente no PATCH', () => {
    const writes = planExactKindAgenda({
      existing: [
        {
          id: 'act-1',
          status: 'pending',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-14T12:00:00.000Z'),
          description: 'Texto editado',
          dealId: 'deal-1',
        },
      ],
      kind: 'lead_renewal_d60',
      desired: undefined,
      create: base,
    });
    expect(writes).toEqual([]);
  });

  it('atualiza só o horário e preserva o identificador', () => {
    const writes = planExactKindAgenda({
      existing: [
        {
          id: 'act-1',
          status: 'pending',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-01T12:00:00.000Z'),
          description: 'Texto editado',
          outcome: 'sem resposta',
          dealId: 'deal-1',
          customerId: 'customer-1',
          policyId: 'policy-1',
        },
      ],
      kind: 'lead_renewal_d60',
      desired: new Date('2027-02-14T12:00:00.000Z'),
      create: base,
    });
    expect(writes).toEqual([
      {
        op: 'update',
        id: 'act-1',
        occurredAt: new Date('2027-02-14T12:00:00.000Z'),
        nextFollowUpAt: new Date('2027-02-14T12:00:00.000Z'),
      },
    ]);
  });

  it('não regrava quando o salvamento repete o mesmo horário', () => {
    const writes = planExactKindAgenda({
      existing: [
        {
          id: 'act-1',
          status: 'pending',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-14T12:00:00.000Z'),
          description: 'Texto editado',
        },
      ],
      kind: 'lead_renewal_d60',
      desired: new Date('2027-02-14T12:00:00.000Z'),
      create: base,
    });
    expect(writes).toEqual([]);
  });

  it('remove só a pendência explícita e mantém concluída e cancelada', () => {
    const writes = planExactKindAgenda({
      existing: [
        {
          id: 'pending',
          status: 'pending',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-14T12:00:00.000Z'),
        },
        {
          id: 'done',
          status: 'completed',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-14T12:00:00.000Z'),
        },
        {
          id: 'cancelled',
          status: 'cancelled',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-14T12:00:00.000Z'),
        },
        {
          id: 'other',
          status: 'pending',
          operationalEventKind: 'manual_follow_up',
          occurredAt: new Date('2027-02-14T12:00:00.000Z'),
        },
      ],
      kind: 'lead_renewal_d60',
      desired: null,
      create: base,
    });
    expect(writes).toEqual([{ op: 'delete', id: 'pending' }]);
  });

  it('não duplica pendências do mesmo tipo', () => {
    const writes = planExactKindAgenda({
      existing: [
        {
          id: 'first',
          status: 'pending',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-14T12:00:00.000Z'),
        },
        {
          id: 'second',
          status: 'pending',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-14T12:00:00.000Z'),
        },
      ],
      kind: 'lead_renewal_d60',
      desired: new Date('2027-02-14T12:00:00.000Z'),
      create: base,
    });
    expect(writes).toEqual([{ op: 'delete', id: 'second' }]);
  });

  it('cancela a pendência sem apagar a linha quando o lembrete é desativado', () => {
    const writes = planExactKindAgenda({
      existing: [
        {
          id: 'pending',
          status: 'pending',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-14T12:00:00.000Z'),
          dealId: 'deal-1',
        },
        {
          id: 'done',
          status: 'completed',
          operationalEventKind: 'lead_renewal_d60',
          occurredAt: new Date('2027-02-01T12:00:00.000Z'),
        },
      ],
      kind: 'lead_renewal_d60',
      desired: null,
      retirePending: 'cancel',
      create: base,
    });
    expect(writes).toEqual([{ op: 'cancel', id: 'pending' }]);
  });
});
