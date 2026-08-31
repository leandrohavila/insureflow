import {
  assertAtLeastOneBusinessUnit,
  assertValidPrimaryForActiveUser,
  resolvePrimaryBusinessUnitId,
} from './users-business-units.util';

describe('users-business-units.util', () => {
  describe('assertAtLeastOneBusinessUnit', () => {
    it('rejeita lista vazia', () => {
      expect(() => assertAtLeastOneBusinessUnit([])).toThrow(
        'Usuário ativo deve ter ao menos uma empresa vinculada',
      );
    });
  });

  describe('resolvePrimaryBusinessUnitId', () => {
    it('usa primary quando válido', () => {
      expect(
        resolvePrimaryBusinessUnitId(['bu-1', 'bu-2'], 'bu-2'),
      ).toBe('bu-2');
    });

    it('usa primeira empresa quando primary ausente', () => {
      expect(resolvePrimaryBusinessUnitId(['bu-1', 'bu-2'], null)).toBe('bu-1');
    });

    it('usa primeira empresa quando primary fora da lista', () => {
      expect(
        resolvePrimaryBusinessUnitId(['bu-1', 'bu-2'], 'bu-x'),
      ).toBe('bu-1');
    });
  });

  describe('assertValidPrimaryForActiveUser', () => {
    it('ignora usuário inativo', () => {
      expect(() =>
        assertValidPrimaryForActiveUser({
          isActive: false,
          businessUnitIds: [],
          currentBusinessUnitId: null,
        }),
      ).not.toThrow();
    });

    it('rejeita ativo sem empresas', () => {
      expect(() =>
        assertValidPrimaryForActiveUser({
          isActive: true,
          businessUnitIds: [],
          currentBusinessUnitId: null,
        }),
      ).toThrow('Usuário ativo deve ter ao menos uma empresa vinculada');
    });

    it('rejeita ativo com primary inválida', () => {
      expect(() =>
        assertValidPrimaryForActiveUser({
          isActive: true,
          businessUnitIds: ['bu-1'],
          currentBusinessUnitId: 'bu-2',
        }),
      ).toThrow('Usuário ativo deve ter uma empresa principal válida');
    });

    it('aceita ativo com primary consistente', () => {
      expect(() =>
        assertValidPrimaryForActiveUser({
          isActive: true,
          businessUnitIds: ['bu-1', 'bu-2'],
          currentBusinessUnitId: 'bu-2',
        }),
      ).not.toThrow();
    });
  });
});
