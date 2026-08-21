export const VIEW_ALL_BUSINESS_UNITS = 'business-units:view-all';
export const MANAGE_BUSINESS_UNITS = 'business-units:manage';

export type BusinessUnitActor = {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  currentBusinessUnitId?: string | null;
};

export function canViewAllBusinessUnits(
  actor: Pick<BusinessUnitActor, 'roles' | 'permissions'>,
): boolean {
  if (actor.roles.includes('admin') || actor.roles.includes('super_admin')) {
    return true;
  }
  return (
    actor.permissions.includes(VIEW_ALL_BUSINESS_UNITS) ||
    actor.permissions.includes(MANAGE_BUSINESS_UNITS)
  );
}

export function canManageBusinessUnits(
  actor: Pick<BusinessUnitActor, 'roles' | 'permissions'>,
): boolean {
  if (actor.roles.includes('admin') || actor.roles.includes('super_admin')) {
    return true;
  }
  return actor.permissions.includes(MANAGE_BUSINESS_UNITS);
}

/**
 * IDs visíveis no contexto atual.
 * `null` = sem restrição de unidade (admin em "Todas").
 * `[]` = nenhum dado visível.
 */
export function resolveScopedBusinessUnitIds(params: {
  canViewAll: boolean;
  membershipIds: string[];
  currentBusinessUnitId?: string | null;
  requestedBusinessUnitId?: string | null;
}): string[] | null {
  let allowed: string[] | null = params.canViewAll
    ? null
    : [...new Set(params.membershipIds)];

  if (allowed && allowed.length === 0) {
    return [];
  }

  const current = params.currentBusinessUnitId?.trim() || null;
  if (current) {
    if (allowed === null || allowed.includes(current)) {
      allowed = [current];
    } else {
      return [];
    }
  }

  const requested = params.requestedBusinessUnitId?.trim() || null;
  if (requested) {
    if (allowed === null) return [requested];
    return allowed.includes(requested) ? [requested] : [];
  }

  return allowed;
}

export function leadOrCustomerBusinessUnitWhere(ids: string[] | null):
  | { OR: Array<Record<string, unknown>> }
  | { id: { in: string[] } }
  | undefined {
  if (ids === null) return undefined;
  if (ids.length === 0) return { id: { in: [] } };
  return {
    OR: [
      { businessUnitId: { in: ids } },
      { businessUnits: { some: { businessUnitId: { in: ids } } } },
    ],
  };
}

export function directBusinessUnitWhere(ids: string[] | null):
  | { businessUnitId: { in: string[] } }
  | { id: { in: string[] } }
  | undefined {
  if (ids === null) return undefined;
  if (ids.length === 0) return { id: { in: [] } };
  return { businessUnitId: { in: ids } };
}

export function relatedLeadCustomerDealWhere(ids: string[] | null):
  | { OR: Array<Record<string, unknown>> }
  | { id: { in: string[] } }
  | undefined {
  if (ids === null) return undefined;
  if (ids.length === 0) return { id: { in: [] } };
  const related = leadOrCustomerBusinessUnitWhere(ids);
  const deal = directBusinessUnitWhere(ids);
  return {
    OR: [{ lead: related }, { customer: related }, { deal }],
  };
}

export function andWhere<T extends object>(base: T, extra?: object): T {
  if (!extra) return base;
  return { AND: [base, extra] } as T;
}

export function isLeadOrCustomerInScope(
  ids: string[] | null,
  record: {
    businessUnitId?: string | null;
    linkedBusinessUnitIds?: string[];
  },
): boolean {
  if (ids === null) return true;
  if (ids.length === 0) return false;
  if (record.businessUnitId && ids.includes(record.businessUnitId)) {
    return true;
  }
  return (record.linkedBusinessUnitIds ?? []).some((id) => ids.includes(id));
}

export function isDirectBusinessUnitInScope(
  ids: string[] | null,
  businessUnitId?: string | null,
): boolean {
  if (ids === null) return true;
  if (ids.length === 0) return false;
  return Boolean(businessUnitId && ids.includes(businessUnitId));
}
