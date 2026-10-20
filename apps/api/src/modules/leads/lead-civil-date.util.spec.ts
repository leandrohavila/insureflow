import {
  addCivilDays,
  civilDateTimeToUtc,
  LEAD_AGENDA_TIME_ZONE,
  parsePolicyExpiresAt,
} from './lead-civil-date.util';

describe('datas civis da agenda', () => {
  it('grava o vencimento como data civil em meia-noite UTC', () => {
    expect(parsePolicyExpiresAt('2027-04-15')?.toISOString()).toBe(
      '2027-04-15T00:00:00.000Z',
    );
    expect(parsePolicyExpiresAt('2027-01-01')?.toISOString()).toBe(
      '2027-01-01T00:00:00.000Z',
    );
    expect(parsePolicyExpiresAt(null)).toBeNull();
    expect(parsePolicyExpiresAt('')).toBeNull();
  });

  it('atravessa mês e ano sem depender do fuso do processo', () => {
    expect(addCivilDays('2027-03-01', -15)).toBe('2027-02-14');
    expect(addCivilDays('2027-01-10', -60)).toBe('2026-11-11');
    expect(addCivilDays('2027-04-15', -30)).toBe('2027-03-16');
  });

  it('fixa 09:00 em Brasília e em UTC como instantes diferentes e estáveis', () => {
    expect(
      civilDateTimeToUtc(
        '2027-02-14',
        '09:00',
        LEAD_AGENDA_TIME_ZONE,
      ).toISOString(),
    ).toBe('2027-02-14T12:00:00.000Z');
    expect(civilDateTimeToUtc('2027-02-14', '09:00', 'UTC').toISOString()).toBe(
      '2027-02-14T09:00:00.000Z',
    );
    expect(
      civilDateTimeToUtc(
        '2026-12-26',
        '09:00',
        LEAD_AGENDA_TIME_ZONE,
      ).toISOString(),
    ).toBe('2026-12-26T12:00:00.000Z');
  });
});
