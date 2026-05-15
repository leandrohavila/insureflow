import { Request } from 'express';

export type JwtAccessPayload = {
  sub: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  roles: string[];
  permissions: string[];
};

export type RequestWithUser = Request & { user: JwtAccessPayload };
