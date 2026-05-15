import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtAccessPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (required.length === 0) return true;

    const req = context
        .switchToHttp()
        .getRequest<{ user?: JwtAccessPayload }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Token inválido ou ausente');
    }

    const granted = new Set(user.permissions);
    const ok = required.every((p) => granted.has(p));
    if (!ok) {
      throw new ForbiddenException('Permissões insuficientes para este recurso');
    }
    return true;
  }
}
