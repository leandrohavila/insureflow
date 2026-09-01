import { inAgendaWindow } from './commercial-agenda-window.util';

describe('inAgendaWindow', () => {
  const now = new Date('2026-09-01T15:00:00');

  it('classifica hoje', () => {
    expect(inAgendaWindow(new Date('2026-09-01T09:00:00'), 'today', now)).toBe(
      true,
    );
    expect(inAgendaWindow(new Date('2026-08-31T23:00:00'), 'today', now)).toBe(
      false,
    );
  });

  it('classifica atrasados', () => {
    expect(
      inAgendaWindow(new Date('2026-08-31T10:00:00'), 'overdue', now),
    ).toBe(true);
    expect(
      inAgendaWindow(new Date('2026-09-01T08:00:00'), 'overdue', now),
    ).toBe(false);
  });

  it('classifica próximos 7 dias', () => {
    expect(inAgendaWindow(new Date('2026-09-06T10:00:00'), 'next7', now)).toBe(
      true,
    );
    expect(inAgendaWindow(new Date('2026-09-10T10:00:00'), 'next7', now)).toBe(
      false,
    );
  });
});
