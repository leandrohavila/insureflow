import type { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';

import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { OwnershipEnforcement } from './ownership.types';

type TenantSettingsJson = {
  ownershipEnforcement?: OwnershipEnforcement;
};

function parseEnforcement(value: unknown): OwnershipEnforcement | null {
  if (value === 'off' || value === 'shadow' || value === 'on') {
    return value;
  }
  return null;
}

/**
 * Resolve ownership enforcement: env `OWNERSHIP_ENFORCEMENT` overrides tenant.settings.
 */
export async function getOwnershipEnforcement(
  prisma: PrismaService,
  tenantId: string,
  config?: ConfigService,
): Promise<OwnershipEnforcement> {
  const fromEnv = config?.get<string>('OWNERSHIP_ENFORCEMENT');
  const envParsed = parseEnforcement(fromEnv);
  if (envParsed) return envParsed;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  const settings = (tenant?.settings ?? {}) as TenantSettingsJson;
  return parseEnforcement(settings.ownershipEnforcement) ?? 'off';
}

export function mergeTenantSettings(
  current: Prisma.JsonValue | null | undefined,
  patch: TenantSettingsJson,
): Prisma.InputJsonValue {
  const base =
    current && typeof current === 'object' && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
  return { ...base, ...patch } as Prisma.InputJsonValue;
}
