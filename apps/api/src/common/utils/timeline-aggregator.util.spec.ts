import {
  aggregateCustomerTimeline,
  mapActivityKindTo360,
} from './timeline-aggregator.util';

describe('timeline-aggregator', () => {
  it('ordena do mais recente para o mais antigo', () => {
    const events = aggregateCustomerTimeline([
      {
        id: '1',
        kind: 'lead_created',
        occurredAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: '2',
        kind: 'message_sent',
        occurredAt: '2026-08-01T10:00:00.000Z',
      },
      {
        id: '3',
        kind: 'lead_converted',
        occurredAt: '2026-03-01T10:00:00.000Z',
      },
    ]);
    expect(events.map((item) => item.kind)).toEqual([
      'message_sent',
      'lead_converted',
      'lead_created',
    ]);
  });

  it('rotula eventos sem título', () => {
    const [event] = aggregateCustomerTimeline([
      {
        id: '1',
        kind: 'follow_up_completed',
        occurredAt: new Date('2026-08-20T12:00:00.000Z'),
      },
    ]);
    expect(event.title).toBe('Follow-up concluído');
  });

  it('mapeia activities operacionais para o catálogo 360', () => {
    expect(mapActivityKindTo360('communication_replied')).toBe(
      'message_received',
    );
    expect(mapActivityKindTo360('deal_created')).toBe('deal_created');
    expect(mapActivityKindTo360('deal_won')).toBe('deal_won');
    expect(mapActivityKindTo360('deal_lost')).toBe('deal_lost');
    expect(mapActivityKindTo360('deal_reopened')).toBe('deal_reopened');
    expect(mapActivityKindTo360('deal_stage_changed')).toBe('stage_changed');
    expect(mapActivityKindTo360('lead_business_unit_linked')).toBe(
      'business_unit_changed',
    );
    expect(mapActivityKindTo360('opportunity_created')).toBe(
      'opportunity_created',
    );
    expect(mapActivityKindTo360('owner_changed')).toBe('owner_changed');
    expect(mapActivityKindTo360('reactivation_retry')).toBe(
      'reactivation_retry',
    );
    expect(mapActivityKindTo360('unknown')).toBeNull();
  });
});
