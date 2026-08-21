import {
  computeAverageQuoteDurationHours,
  computeQuoteConversionRate,
} from './quotes-metrics.util';

describe('quotes-metrics.util', () => {
  describe('computeAverageQuoteDurationHours', () => {
    it('retorna null sem comparativos enviados', () => {
      expect(computeAverageQuoteDurationHours([])).toBeNull();
    });

    it('calcula média em horas entre criação e envio', () => {
      const average = computeAverageQuoteDurationHours([
        {
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          sentAt: new Date('2026-01-02T00:00:00.000Z'),
        },
        {
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          sentAt: new Date('2026-01-01T12:00:00.000Z'),
        },
      ]);

      expect(average).toBe(18);
    });
  });

  describe('computeQuoteConversionRate', () => {
    it('retorna null sem comparativos fechados', () => {
      expect(computeQuoteConversionRate(0, 0)).toBeNull();
    });

    it('calcula taxa de conversão com uma casa decimal', () => {
      expect(computeQuoteConversionRate(3, 1)).toBe(75);
      expect(computeQuoteConversionRate(1, 2)).toBe(33.3);
    });
  });
});
