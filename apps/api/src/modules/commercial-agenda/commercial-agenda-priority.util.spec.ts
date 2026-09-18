import { agendaPriority } from './commercial-agenda-priority.util';

describe('agendaPriority', () => {
  const now = new Date('2026-09-01T15:00:00');

  it('marca atrasados como alta', () => {
    expect(agendaPriority(new Date('2026-08-31T10:00:00'), now)).toBe('high');
  });

  it('marca hoje como média', () => {
    expect(agendaPriority(new Date('2026-09-01T09:00:00'), now)).toBe('medium');
  });

  it('marca futuro como normal', () => {
    expect(agendaPriority(new Date('2026-09-06T10:00:00'), now)).toBe('low');
  });
});
