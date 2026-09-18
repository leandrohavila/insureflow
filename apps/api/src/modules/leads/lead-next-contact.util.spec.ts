import {
  buildLeadNextContactDraft,
  isNextContactActivityType,
} from './lead-next-contact.util';

describe('buildLeadNextContactDraft', () => {
  it('agenda atividade futura com tipo e observação', () => {
    const at = new Date('2027-03-15T14:00:00.000Z');
    const draft = buildLeadNextContactDraft({
      at,
      type: 'call',
      notes: 'Conquistar apólice da concorrência',
    });
    expect(draft.type).toBe('call');
    expect(draft.status).toBe('pending');
    expect(draft.occurredAt).toEqual(at);
    expect(draft.nextFollowUpAt).toEqual(at);
    expect(draft.description).toContain('concorrência');
  });

  it('usa WhatsApp quando o tipo é inválido', () => {
    expect(
      buildLeadNextContactDraft({
        at: new Date('2027-03-01T12:00:00.000Z'),
        type: 'sms',
      }).type,
    ).toBe('whatsapp');
  });

  it('reconhece tipos comerciais', () => {
    expect(isNextContactActivityType('whatsapp')).toBe(true);
    expect(isNextContactActivityType('note')).toBe(false);
  });
});
