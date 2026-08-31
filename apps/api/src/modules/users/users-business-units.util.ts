import { BadRequestException } from '@nestjs/common';

export const ACTIVE_USER_REQUIRES_BUSINESS_UNIT_MSG =
  'Usuário ativo deve ter ao menos uma empresa vinculada';

export const ACTIVE_USER_REQUIRES_PRIMARY_BUSINESS_UNIT_MSG =
  'Usuário ativo deve ter uma empresa principal válida';

export function assertAtLeastOneBusinessUnit(
  businessUnitIds: readonly string[],
): void {
  if (businessUnitIds.length === 0) {
    throw new BadRequestException(ACTIVE_USER_REQUIRES_BUSINESS_UNIT_MSG);
  }
}

/** Empresa principal ∈ memberships; default = primeira da lista. */
export function resolvePrimaryBusinessUnitId(
  businessUnitIds: readonly string[],
  primaryBusinessUnitId?: string | null,
): string {
  assertAtLeastOneBusinessUnit(businessUnitIds);
  if (
    primaryBusinessUnitId &&
    businessUnitIds.includes(primaryBusinessUnitId)
  ) {
    return primaryBusinessUnitId;
  }
  return businessUnitIds[0]!;
}

export function assertValidPrimaryForActiveUser(input: {
  isActive: boolean;
  businessUnitIds: readonly string[];
  currentBusinessUnitId?: string | null;
}): void {
  if (!input.isActive) return;

  assertAtLeastOneBusinessUnit(input.businessUnitIds);

  if (
    !input.currentBusinessUnitId ||
    !input.businessUnitIds.includes(input.currentBusinessUnitId)
  ) {
    throw new BadRequestException(ACTIVE_USER_REQUIRES_PRIMARY_BUSINESS_UNIT_MSG);
  }
}

export function extractBusinessUnitIds(
  businessUnits: ReadonlyArray<{ businessUnitId: string }> | undefined,
): string[] {
  return businessUnits?.map((link) => link.businessUnitId) ?? [];
}
