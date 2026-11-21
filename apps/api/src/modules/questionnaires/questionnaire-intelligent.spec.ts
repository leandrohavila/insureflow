import { readFileSync } from 'fs';
import { join } from 'path';

import { QUESTIONNAIRE_BRANCH_SECTIONS } from './questionnaire-branches';
import { buildQuestionnaireVersionDefinition } from './questionnaire-version.util';
import {
  canTransitionQuestionnaireStatus,
  isQuestionnaireAnswerLocked,
} from './questionnaire-status.util';
import {
  generateQuestionnaireShareToken,
  hashQuestionnaireShareToken,
} from './questionnaire-share-token.util';

describe('questionário inteligente — estrutura', () => {
  it('prepara seções opcionais para automóvel, residencial e empresarial', () => {
    expect(
      QUESTIONNAIRE_BRANCH_SECTIONS.auto.map((section) => section.title),
    ).toEqual([
      'Dados do veículo',
      'Condutor',
      'Utilização',
      'Garagem e pernoite',
      'Histórico',
      'Coberturas',
    ]);
    expect(
      QUESTIONNAIRE_BRANCH_SECTIONS.residencial.map((section) => section.title),
    ).toContain('Endereço do risco');
    expect(
      QUESTIONNAIRE_BRANCH_SECTIONS.empresarial.map((section) => section.title),
    ).toContain('Estabelecimento');
    for (const sections of Object.values(QUESTIONNAIRE_BRANCH_SECTIONS)) {
      expect(sections.every((section) => section.required === false)).toBe(
        true,
      );
    }
  });

  it('fotografa a definição sem alterar o campo de origem', () => {
    const source = {
      key: 'vehicle_model',
      label: 'Modelo',
      type: 'TEXT',
      required: true,
      order: 0,
      settings: { section: 'vehicle_identification' },
    };
    const definition = buildQuestionnaireVersionDefinition({
      branch: 'auto',
      fields: [source],
    });
    const snapshot = definition.fields[0];
    if (!snapshot) throw new Error('campo ausente');
    snapshot.required = false;
    expect(source.required).toBe(true);
    expect(definition.fields[0]?.sectionKey).toBe('vehicle_identification');
  });

  it('bloqueia edição silenciosa do concluído e permite o fluxo legado de envio', () => {
    expect(canTransitionQuestionnaireStatus('draft', 'submitted')).toBe(true);
    expect(canTransitionQuestionnaireStatus('draft', 'completed')).toBe(true);
    expect(canTransitionQuestionnaireStatus('completed', 'draft')).toBe(false);
    expect(canTransitionQuestionnaireStatus('submitted', 'reviewed')).toBe(
      true,
    );
    expect(isQuestionnaireAnswerLocked('completed')).toBe(true);
    expect(isQuestionnaireAnswerLocked('draft')).toBe(false);
    expect(isQuestionnaireAnswerLocked('in_progress')).toBe(false);
  });

  it('não reaproveita o token como hash', () => {
    const token = generateQuestionnaireShareToken();
    const hash = hashQuestionnaireShareToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(token);
    expect(hash).not.toContain(token);
  });

  it('a migração não apaga respostas nem tabelas existentes', () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        '../../packages/database/prisma/migrations/20261117140000_questionnaire_intelligent_foundation/migration.sql',
      ),
      'utf8',
    );
    expect(sql.toLowerCase()).not.toMatch(/delete\s+from/);
    expect(sql.toLowerCase()).not.toMatch(/drop\s+table/);
    expect(sql.toLowerCase()).not.toMatch(/truncate/);
    expect(sql).not.toMatch(/"answers"/);
    expect(sql).toContain('"template_version_id" = version."id"');
  });
});
