import type { DataScope } from '@prisma/client';
import { Request } from 'express';

export type JwtAccessPayload = {
  sub: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  roles: string[];
  permissions: string[];
  /** Escopo efetivo de ownership (Sprint 2). */
  dataScope?: DataScope;
  teamIds?: string[];
};

export type RequestWithUser = Request & { user: JwtAccessPayload };
