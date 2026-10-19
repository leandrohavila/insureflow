/** Fuso da sugestão comercial. O instante não depende do fuso do processo. */
export const LEAD_AGENDA_TIME_ZONE = 'America/Sao_Paulo';

export const LEAD_AGENDA_SUGGESTED_TIME = '09:00';

export function civilDateFromInstant(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Data de apólice `AAAA-MM-DD` vira meia-noite UTC, sem deslocar o dia civil. */
export function parsePolicyExpiresAt(
  value: string | null | undefined,
): Date | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    return new Date(
      Date.UTC(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      ),
    );
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function addCivilDays(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return '';
  const utc = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  utc.setUTCDate(utc.getUTCDate() + days);
  return civilDateFromInstant(utc);
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour'),
    read('minute'),
    read('second'),
  );
  return asUtc - instant.getTime();
}

/** Hora civil num fuso IANA, estável em processo UTC ou Brasília. */
export function civilDateTimeToUtc(
  isoDate: string,
  time: string,
  timeZone: string,
): Date {
  const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  const clock = /^(\d{2}):(\d{2})/.exec(time);
  if (!date || !clock) return new Date(NaN);
  const utcGuess = Date.UTC(
    Number(date[1]),
    Number(date[2]) - 1,
    Number(date[3]),
    Number(clock[1]),
    Number(clock[2]),
    0,
  );
  const first = new Date(
    utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone),
  );
  return new Date(utcGuess - timeZoneOffsetMs(first, timeZone));
}

export function startOfCivilDay(now: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return civilDateTimeToUtc(
    `${read('year')}-${read('month')}-${read('day')}`,
    '00:00',
    timeZone,
  );
}
