/** Retorna a data mais recente entre candidatos válidos. */
export function pickLatestDate(
  ...values: (Date | string | null | undefined)[]
): Date | null {
  let latest: Date | null = null;

  for (const value of values) {
    if (!value) continue;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) continue;
    if (!latest || date.getTime() > latest.getTime()) {
      latest = date;
    }
  }

  return latest;
}
