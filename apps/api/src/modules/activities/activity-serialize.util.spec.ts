import { serializeActivity } from './activity-serialize.util';

describe('serializeActivity', () => {
  it('expõe policyId e operationalEventKind para atividades legadas', () => {
    const serialized = serializeActivity({
      id: 'act-1',
      tenantId: 't1',
      type: 'note',
      status: 'completed',
      subject: 'Apólice emitida',
      description: null,
      outcome: null,
      operationalEventKind: 'policy_issued',
      occurredAt: new Date('2026-05-23T12:00:00.000Z'),
      nextFollowUpAt: null,
      leadId: null,
      dealId: 'deal-1',
      customerId: 'cust-1',
      policyId: 'pol-1',
      performedById: 'user-1',
      createdAt: new Date('2026-05-23T12:00:00.000Z'),
      updatedAt: new Date('2026-05-23T12:00:00.000Z'),
      performedBy: {
        id: 'user-1',
        name: 'Ana',
        initials: 'AN',
      },
    });

    expect(serialized.policyId).toBe('pol-1');
    expect(serialized.operationalEventKind).toBe('policy_issued');
    expect(serialized.performedBy.name).toBe('Ana');
  });

  it('tolera tipo desconhecido e performer ausente', () => {
    const serialized = serializeActivity({
      id: 'act-2',
      tenantId: 't1',
      type: 'legacy_custom',
      status: 'completed',
      subject: 'Registro antigo',
      description: null,
      outcome: null,
      operationalEventKind: null,
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      nextFollowUpAt: null,
      leadId: null,
      dealId: null,
      customerId: null,
      policyId: null,
      performedById: 'user-2',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      performedBy: null,
    } as never);

    expect(serialized.type).toBe('note');
    expect(serialized.policyId).toBeNull();
    expect(serialized.performedBy.id).toBe('user-2');
  });
});
