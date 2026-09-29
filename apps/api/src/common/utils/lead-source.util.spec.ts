import {
  buildLeadSourceWhere,
  defaultManualLeadSource,
  resolveLeadSourceCode,
} from './lead-source.util';

describe('lead-source.util', () => {
  describe('resolveLeadSourceCode', () => {
    it.each([
      [null, 'crm_manual'],
      [undefined, 'crm_manual'],
      ['', 'crm_manual'],
      ['   ', 'crm_manual'],
      ['crm_manual', 'crm_manual'],
      ['Cadastro Manual', 'crm_manual'],
      ['WhatsApp', 'whatsapp'],
      ['Indicação', 'indicacao'],
      ['indicacao', 'indicacao'],
      ['Importação', 'importacao'],
      ['public_portal', 'public_portal'],
      ['public_portal_home', 'public_portal'],
      ['Portal Imobiliário', 'public_portal'],
      ['Instagram', null],
    ])('%p -> %p', (input, expected) => {
      expect(resolveLeadSourceCode(input)).toBe(expected);
    });
  });

  describe('defaultManualLeadSource', () => {
    it('usa crm_manual quando source ausente ou vazio', () => {
      expect(defaultManualLeadSource(undefined)).toBe('crm_manual');
      expect(defaultManualLeadSource('')).toBe('crm_manual');
      expect(defaultManualLeadSource('  ')).toBe('crm_manual');
    });

    it('preserva source informado', () => {
      expect(defaultManualLeadSource(' whatsapp ')).toBe('whatsapp');
    });
  });

  describe('buildLeadSourceWhere', () => {
    it('sem filtro retorna undefined', () => {
      expect(buildLeadSourceWhere(undefined)).toBeUndefined();
      expect(buildLeadSourceWhere('  ')).toBeUndefined();
    });

    it('Cadastro Manual agrupa null, vazio e crm_manual', () => {
      expect(buildLeadSourceWhere('Cadastro Manual')).toEqual({
        OR: [
          { source: { equals: 'crm_manual', mode: 'insensitive' } },
          { source: { equals: 'Cadastro Manual', mode: 'insensitive' } },
          { source: null },
          { source: '' },
        ],
      });
    });

    it('rótulo conhecido casa com código e rótulo', () => {
      expect(buildLeadSourceWhere('whatsapp')).toEqual({
        OR: [
          { source: { equals: 'whatsapp', mode: 'insensitive' } },
          { source: { equals: 'WhatsApp', mode: 'insensitive' } },
        ],
      });
    });

    it('portal inclui variantes public_portal_*', () => {
      expect(buildLeadSourceWhere('Portal Imobiliário')).toEqual({
        source: { startsWith: 'public_portal', mode: 'insensitive' },
      });
    });

    it('origem livre desconhecida mantém igualdade exata', () => {
      expect(buildLeadSourceWhere(' Instagram ')).toEqual({
        source: 'Instagram',
      });
    });
  });
});
