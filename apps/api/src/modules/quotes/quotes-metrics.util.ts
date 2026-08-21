type SentComparisonDuration = {
  createdAt: Date;
  sentAt: Date;
};

export function computeAverageQuoteDurationHours(
  comparisons: SentComparisonDuration[],
): number | null {
  if (comparisons.length === 0) return null;

  const totalHours = comparisons.reduce((sum, item) => {
    const diffMs = item.sentAt.getTime() - item.createdAt.getTime();
    return sum + Math.max(0, diffMs) / (1000 * 60 * 60);
  }, 0);

  return Math.round((totalHours / comparisons.length) * 10) / 10;
}

export function computeQuoteConversionRate(
  closedWon: number,
  closedLost: number,
): number | null {
  const decided = closedWon + closedLost;
  if (decided === 0) return null;

  return Math.round((closedWon / decided) * 1000) / 10;
}
