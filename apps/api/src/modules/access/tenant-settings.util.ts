import type { ConfigService } from '@nestjs/config';

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
