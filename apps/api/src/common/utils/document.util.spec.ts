import {
  normalizeCnpj,
  normalizeCpf,
  normalizeDocument,
  stripDocumentDigits,
} from './document.util';

describe('document.util', () => {
  it('normaliza CPF com e sem máscara para o mesmo valor', () => {
    const masked = '111.444.777-35';
    const plain = '11144477735';
    expect(normalizeCpf(masked)).toBe(plain);
    expect(normalizeCpf(plain)).toBe(plain);
  });

  it('normaliza CNPJ com e sem máscara para o mesmo valor', () => {
    const masked = '11.222.333/0001-81';
    const plain = '11222333000181';
    expect(normalizeCnpj(masked)).toBe(plain);
    expect(normalizeCnpj(plain)).toBe(plain);
  });

  it('normalizeDocument retorna dígitos para tipo válido', () => {
    const result = normalizeDocument('cpf', '111.444.777-35');
    expect(result?.document).toBe('11144477735');
  });

  it('stripDocumentDigits remove caracteres não numéricos', () => {
    expect(stripDocumentDigits('12.345.678/0001-90')).toBe('12345678000190');
  });
});
