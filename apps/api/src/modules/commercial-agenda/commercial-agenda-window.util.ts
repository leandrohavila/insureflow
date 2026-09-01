export type CommercialAgendaWindow = 'today' | 'overdue' | 'next7' | 'next30';

export function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function inAgendaWindow(
  at: Date,
  window: CommercialAgendaWindow | undefined,
  now: Date,
) {
  const startToday = startOfLocalDay(now);
  const endToday = endOfLocalDay(now);
  if (window === 'today') return at >= startToday && at <= endToday;
  if (window === 'overdue') return at < startToday;
  if (window === 'next7') {
    const until = new Date(startToday);
    until.setDate(until.getDate() + 7);
    return at >= startToday && at <= until;
  }
  if (window === 'next30') {
    const until = new Date(startToday);
    until.setDate(until.getDate() + 30);
    return at >= startToday && at <= until;
  }
  return true;
}
