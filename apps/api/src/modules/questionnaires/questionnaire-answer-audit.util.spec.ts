import { buildQuestionnaireAnswerChanges } from './questionnaire-answer-audit.util';

const fields = [
  { key: 'vehicle_model', label: 'Modelo do veículo' },
  { key: 'coverage', label: 'Coberturas' },
  { key: 'ignored', label: 'Campo ignorado' },
];

describe('questionnaire-answer-audit.util', () => {
  it('returns only modified questionnaire fields', () => {
    const changes = buildQuestionnaireAnswerChanges(
      fields,
      {
        vehicle_model: 'Civic',
        coverage: ['collision', 'theft'],
        ignored: 'same',
      },
      {
        vehicle_model: 'Corolla',
        coverage: ['collision', 'theft'],
        ignored: 'same',
        extra_key: 'not configured',
      },
    );

    expect(changes).toEqual([
      {
        field: 'vehicle_model',
        label: 'Modelo do veículo',
        oldValue: 'Civic',
        newValue: 'Corolla',
      },
    ]);
  });

  it('compares object answers without depending on key order', () => {
    const changes = buildQuestionnaireAnswerChanges(
      [{ key: 'driver', label: 'Condutor' }],
      { driver: { name: 'Ana', age: 31 } },
      { driver: { age: 31, name: 'Ana' } },
    );

    expect(changes).toEqual([]);
  });
});
