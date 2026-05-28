import type { DataScope } from '@prisma/client';

export type OwnershipEnforcement = 'off' | 'shadow' | 'on';

export type AccessContext = {
  tenantId: string;
  userId: string;
  roles: string[];
  permissions: string[];
  dataScope: DataScope;
  teamIds: string[];
};

export type LeadAccessActor = {
  userId: string;
  roles: string[];
  permissions: string[];
};
