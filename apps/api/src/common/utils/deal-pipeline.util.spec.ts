import {
  boardDealStage,
  canonicalDealStage,
  computeStageSla,
} from './deal-pipeline.util';

describe('deal-pipeline', () => {
  it('normaliza estágios legados por tipo de empresa', () => {
    expect(canonicalDealStage('qualificacao', 'INSURANCE')).toBe('contato');
    expect(canonicalDealStage('qualificacao', 'REAL_ESTATE')).toBe('visita');
    expect(canonicalDealStage('fechado')).toBe('fechamento');
  });

  it('encaixa estágios imobiliários no board de seguros', () => {
    expect(boardDealStage('visita', 'REAL_ESTATE', 'INSURANCE')).toBe('contato');
    expect(boardDealStage('contrato', 'REAL_ESTATE', 'INSURANCE')).toBe(
      'proposta',
    );
  });

  it('marca SLA de cotação vencida após 3 dias', () => {
    const sla = computeStageSla({
      enteredAt: '2026-08-16T12:00:00.000Z',
      maxDays: 3,
      now: new Date('2026-08-20T12:00:00.000Z'),
    });
    expect(sla.status).toBe('overdue');
    expect(sla.dueAt).toBe('2026-08-19T12:00:00.000Z');
  });

  it('alerta ao atingir 80% do SLA do estágio', () => {
    const sla = computeStageSla({
      enteredAt: '2026-08-17T12:00:00.000Z',
      maxDays: 3,
      now: new Date('2026-08-20T00:00:00.000Z'),
    });
    expect(sla.status).toBe('warning');
  });

  it('alerta no último dia do SLA', () => {
    const sla = computeStageSla({
      enteredAt: '2026-08-13T12:00:00.000Z',
      maxDays: 7,
      now: new Date('2026-08-20T06:00:00.000Z'),
    });
    expect(sla.status).toBe('warning');
  });
});
