import {
  ACTIVITY_EVENT_KINDS,
  ACTIVITY_EVENT_LABELS,
  activityEventLabel,
  isActivityEventKind,
  isCommercialEventKind,
} from './activity-event-kinds.util';

describe('activity-event-kinds', () => {
  it('cataloga marcos comerciais e pós-venda', () => {
    expect(ACTIVITY_EVENT_KINDS).toEqual(
      expect.arrayContaining([
        'lead_converted',
        'lead_reactivated',
        'communication_sent',
        'communication_delivered',
        'communication_read',
        'communication_replied',
        'questionnaire_submitted',
        'quote_created',
        'quote_updated',
        'quote_compared',
        'proposal_sent',
        'proposal_accepted',
        'proposal_rejected',
        'policy_issued',
        'renewal_completed',
        'sla_warning',
        'sla_overdue',
        'reactivation_retry',
      ]),
    );
  });

  it('rotula eventos conhecidos', () => {
    expect(activityEventLabel('lead_converted')).toBe('Lead convertido');
    expect(activityEventLabel('lead_reactivated')).toBe('Lead reativado');
    expect(activityEventLabel('communication_sent')).toBe('Comunicação enviada');
    expect(activityEventLabel('communication_delivered')).toBe(
      'Comunicação entregue',
    );
    expect(ACTIVITY_EVENT_LABELS.proposal_sent).toBe('Proposta enviada');
  });

  it('classifica kinds comerciais', () => {
    expect(isCommercialEventKind('quote_created')).toBe(true);
    expect(isActivityEventKind('deal_won')).toBe(true);
    expect(isCommercialEventKind('deal_won')).toBe(false);
  });
});
