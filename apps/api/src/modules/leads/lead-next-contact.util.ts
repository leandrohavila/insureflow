export const LEAD_NEXT_CONTACT_EVENT_KIND = 'lead_next_contact';

export const NEXT_CONTACT_ACTIVITY_TYPES = [
  'call',
  'whatsapp',
  'email',
  'meeting',
  'visit',
  'follow_up',
  'renewal',
  'task',
] as const;

export type NextContactActivityType =
  (typeof NEXT_CONTACT_ACTIVITY_TYPES)[number];

export function isNextContactActivityType(
  value: string | null | undefined,
): value is NextContactActivityType {
  return (
    !!value &&
    (NEXT_CONTACT_ACTIVITY_TYPES as readonly string[]).includes(value)
  );
}

export function buildLeadNextContactDraft(input: {
  at: Date;
  type?: string | null;
  notes?: string | null;
}) {
  const type = isNextContactActivityType(input.type) ? input.type : 'whatsapp';
  return {
    type,
    status: 'pending' as const,
    subject: 'Próximo contato',
    description:
      input.notes?.trim() || 'Contato comercial agendado no cadastro do lead.',
    occurredAt: input.at,
    nextFollowUpAt: input.at,
    operationalEventKind: LEAD_NEXT_CONTACT_EVENT_KIND,
  };
}
