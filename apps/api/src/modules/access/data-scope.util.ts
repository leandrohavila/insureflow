import type { DataScope } from '@prisma/client';

const SCOPE_RANK: Record<DataScope, number> = {
  shared: 1,
  own: 2,
  team: 3,
  tenant: 4,
};

/** Slug de role → escopo padrão (fallback se DB não tiver defaultDataScope). */
export const ROLE_SLUG_DEFAULT_SCOPE: Record<string, DataScope> = {
  parceiro: 'shared',
  comercial: 'own',
  sales: 'own',
  gerencia: 'team',
  operacional: 'team',
  admin: 'tenant',
  leitura: 'tenant',
  viewer: 'tenant',
  financeiro: 'tenant',
  super_admin: 'tenant',
};

export function resolveEffectiveDataScope(
  roleScopes: DataScope[],
): DataScope {
  if (roleScopes.length === 0) return 'own';

  return roleScopes.reduce((best, current) =>
    SCOPE_RANK[current] > SCOPE_RANK[best] ? current : best,
  );
}

export function scopeForRoleSlug(slug: string, fromDb?: DataScope): DataScope {
  if (fromDb) return fromDb;
  return ROLE_SLUG_DEFAULT_SCOPE[slug] ?? 'own';
}
