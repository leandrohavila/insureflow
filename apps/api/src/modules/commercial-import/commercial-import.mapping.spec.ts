import { INTEREST_CATEGORIES } from '../../common/constants/interest-categories';
import {
  composeImportNotes,
  mapInterestProduct,
  parseCustomerRow,
  parseDocument,
  parseLeadRow,
} from './commercial-import.mapping';

describe('commercial-import.mapping', () => {
  it('maps product aliases to interest categories', () => {
    expect(mapInterestProduct('Seguro Auto; Vida')).toEqual([
      'AUTO_INSURANCE',
      'LIFE_INSURANCE',
    ]);
    expect(INTEREST_CATEGORIES).toContain('AUTO_INSURANCE');
  });

  it('rejects lead without name and invalid document', () => {
    const result = parseLeadRow(2, {
      Nome: '',
      'CPF/CNPJ': '123',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((item) => item.field)).toEqual(
        expect.arrayContaining(['Nome', 'CPF/CNPJ']),
      );
    }
  });

  it('parses official Avila lead headers', () => {
    const result = parseLeadRow(2, {
      Nome: 'Maria Silva',
      'CPF/CNPJ': '39053344705',
      Telefone: '11988887777',
      WhatsApp: '11988887777',
      Email: 'maria@test.com',
      Cidade: 'Santos',
      UF: 'SP',
      Origem: 'carteira',
      'Produto Interesse': 'Auto',
      'Data Renovação': '10/09/2026',
      'Seguradora Atual': 'Porto Seguro',
      'Prêmio Atual': '4.800,00',
      Observações: 'Homolog',
      Responsável: 'admin@insureflow.com',
      'Business Unit': 'corretora-avila',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.coverageDueAt).toContain('2026-09-10');
      expect(result.data.premiumAtual).toBe(4800);
      expect(result.data.city).toBe('Santos');
    }
  });

  it('parses official Avila customer headers', () => {
    const result = parseCustomerRow(2, {
      Nome: 'Cliente Avila',
      'CPF/CNPJ': '39053344705',
      Produto: 'Seguro Auto',
      Seguradora: 'Porto Seguro',
      'Número Apólice': 'AP-1',
      'Vigência Inicial': '21/08/2025',
      'Vigência Final': '10/09/2026',
      Prêmio: '2500',
      Responsável: 'admin@insureflow.com',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.product).toBe('Seguro Auto');
      expect(result.data.premium).toBe(2500);
    }
  });

  it('parses a valid lead row with legacy columns', () => {
    const result = parseLeadRow(2, {
      Nome: 'Maria Silva',
      Telefone: '11988887777',
      Email: 'maria@test.com',
      'CPF/CNPJ': '39053344705',
      'Produto Interesse': 'Auto',
      Origem: 'carteira',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.document).toBe('39053344705');
      expect(result.data.interestCategories).toEqual(['AUTO_INSURANCE']);
    }
  });

  it('requires valid document on customer import', () => {
    const result = parseCustomerRow(3, { Nome: 'Cliente' });
    expect(result.ok).toBe(false);
  });

  it('composes notes with extras', () => {
    expect(composeImportNotes('obs', [['Cidade', 'Santos'], ['UF', 'SP']])).toBe(
      'obs\nCidade: Santos | UF: SP',
    );
  });

  it('parses known valid CPF', () => {
    expect(parseDocument('390.533.447-05')?.document).toBe('39053344705');
  });
});
