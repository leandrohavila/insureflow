import {
  andWhere,
  canManageBusinessUnits,
  canViewAllBusinessUnits,
  directBusinessUnitWhere,
  isDirectBusinessUnitInScope,
  isLeadOrCustomerInScope,
  leadOrCustomerBusinessUnitWhere,
  relatedLeadCustomerDealWhere,
  resolveScopedBusinessUnitIds,
} from './business-unit-acl.util';

describe('business-unit-acl', () => {
  it('admin e view-all veem todas as unidades', () => {
    expect(
      canViewAllBusinessUnits({ roles: ['admin'], permissions: [] }),
    ).toBe(true);
    expect(
      canViewAllBusinessUnits({
        roles: ['sales'],
        permissions: ['business-units:view-all'],
      }),
    ).toBe(true);
    expect(
      canViewAllBusinessUnits({ roles: ['sales'], permissions: [] }),
    ).toBe(false);
  });

  it('admin em Todas não restringe IDs', () => {
    expect(
      resolveScopedBusinessUnitIds({
        canViewAll: true,
        membershipIds: ['bu-1'],
        currentBusinessUnitId: null,
      }),
    ).toBeNull();
  });

  it('admin com empresa ativa restringe à unidade', () => {
    expect(
      resolveScopedBusinessUnitIds({
        canViewAll: true,
        membershipIds: ['bu-1', 'bu-2'],
        currentBusinessUnitId: 'bu-2',
      }),
    ).toEqual(['bu-2']);
  });

  it('usuário comum vê só memberships; sem vínculo não vê nada', () => {
    expect(
      resolveScopedBusinessUnitIds({
        canViewAll: false,
        membershipIds: ['bu-1'],
      }),
    ).toEqual(['bu-1']);
    expect(
      resolveScopedBusinessUnitIds({
        canViewAll: false,
        membershipIds: [],
      }),
    ).toEqual([]);
  });

  it('pedido de unidade fora do ACL retorna vazio', () => {
    expect(
      resolveScopedBusinessUnitIds({
        canViewAll: false,
        membershipIds: ['bu-1'],
        requestedBusinessUnitId: 'bu-2',
      }),
    ).toEqual([]);
  });

  it('filtro explícito de outra unidade não é anulado pela empresa ativa', () => {
    expect(
      resolveScopedBusinessUnitIds({
        canViewAll: true,
        membershipIds: ['bu-1', 'bu-2'],
        currentBusinessUnitId: 'bu-1',
        requestedBusinessUnitId: 'bu-2',
      }),
    ).toEqual(['bu-2']);
    expect(
      resolveScopedBusinessUnitIds({
        canViewAll: false,
        membershipIds: ['bu-1', 'bu-2'],
        currentBusinessUnitId: 'bu-1',
        requestedBusinessUnitId: 'bu-2',
      }),
    ).toEqual(['bu-2']);
  });

  it('monta filtro de lead/cliente por origem ou vínculo', () => {
    expect(leadOrCustomerBusinessUnitWhere(null)).toBeUndefined();
    expect(leadOrCustomerBusinessUnitWhere([])).toEqual({ id: { in: [] } });
    expect(leadOrCustomerBusinessUnitWhere(['bu-1'])).toEqual({
      OR: [
        { businessUnitId: { in: ['bu-1'] } },
        { businessUnits: { some: { businessUnitId: { in: ['bu-1'] } } } },
      ],
    });
  });

  it('filtra cotação/atividade por lead, cliente ou deal', () => {
    expect(relatedLeadCustomerDealWhere(null)).toBeUndefined();
    expect(relatedLeadCustomerDealWhere([])).toEqual({ id: { in: [] } });
    expect(relatedLeadCustomerDealWhere(['bu-1'])).toEqual({
      OR: [
        {
          lead: {
            OR: [
              { businessUnitId: { in: ['bu-1'] } },
              { businessUnits: { some: { businessUnitId: { in: ['bu-1'] } } } },
            ],
          },
        },
        {
          customer: {
            OR: [
              { businessUnitId: { in: ['bu-1'] } },
              { businessUnits: { some: { businessUnitId: { in: ['bu-1'] } } } },
            ],
          },
        },
        { deal: { businessUnitId: { in: ['bu-1'] } } },
      ],
    });
  });

  it('combina where com AND', () => {
    expect(andWhere({ tenantId: 't1' }, directBusinessUnitWhere(['bu-1']))).toEqual({
      AND: [{ tenantId: 't1' }, { businessUnitId: { in: ['bu-1'] } }],
    });
  });

  it('registro de lead/cliente fora do vínculo não entra no escopo', () => {
    expect(
      isLeadOrCustomerInScope(['bu-1'], {
        businessUnitId: 'bu-2',
        linkedBusinessUnitIds: [],
      }),
    ).toBe(false);
    expect(
      isLeadOrCustomerInScope(['bu-1'], {
        businessUnitId: null,
        linkedBusinessUnitIds: ['bu-1'],
      }),
    ).toBe(true);
    expect(isLeadOrCustomerInScope(null, { businessUnitId: null })).toBe(true);
    expect(
      isDirectBusinessUnitInScope(['bu-1'], 'bu-1'),
    ).toBe(true);
    expect(isDirectBusinessUnitInScope(['bu-1'], 'bu-2')).toBe(false);
    expect(isDirectBusinessUnitInScope(['bu-1'], null)).toBe(false);
  });

  it('manage é exclusivo de admin ou permissão', () => {
    expect(
      canManageBusinessUnits({ roles: ['sales'], permissions: [] }),
    ).toBe(false);
    expect(
      canManageBusinessUnits({
        roles: ['sales'],
        permissions: ['business-units:manage'],
      }),
    ).toBe(true);
  });
});
