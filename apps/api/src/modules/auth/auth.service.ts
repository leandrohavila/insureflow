import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { OwnershipService } from '../access/ownership.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);
  private readonly accessExpiresIn: JwtSignOptions['expiresIn'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    private readonly auditLogs: AuditLogsService,
    private readonly ownership: OwnershipService,
  ) {
    this.accessExpiresIn = this.cfg.get<string>(
      'JWT_EXPIRES_IN',
      '15m',
    ) as JwtSignOptions['expiresIn'];
  }

  async validateUser(
    tenantSlug: string,
    email: string,
    password: string,
  ): Promise<{
    payload: JwtAccessPayload;
    userEntity: { id: string; tenantId: string };
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('Tenant inválido ou inativo');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: { tenantId: tenant.id, email: email.toLowerCase() },
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const roleSlugs = user.userRoles.map((ur) => ur.role.slug);
    const permSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permSet.add(rp.permission.key);
      }
    }

    const accessCtx = await this.ownership.resolveContext(tenant.id, {
      userId: user.id,
      roles: roleSlugs,
      permissions: [...permSet],
    });

    const payload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      roles: roleSlugs,
      permissions: [...permSet],
      dataScope: accessCtx.dataScope,
      teamIds: accessCtx.teamIds,
    };

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { payload, userEntity: { id: user.id, tenantId: tenant.id } };
  }

  async login(
    tenantSlug: string,
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    user: JwtAccessPayload;
  }> {
    const { payload, userEntity } = await this.validateUser(
      tenantSlug,
      email,
      password,
    );

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.accessExpiresIn,
    });
    const refreshRaw = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(refreshRaw).digest('hex');
    const refreshDays = this.cfg.get<number>('JWT_REFRESH_DAYS', 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    await this.prisma.refreshToken.create({
      data: {
        tenantId: userEntity.tenantId,
        userId: userEntity.id,
        tokenHash,
        expiresAt,
      },
    });

    this.auditLogs.enqueue({
      tenantId: userEntity.tenantId,
      userId: userEntity.id,
      action: 'auth.login',
      resource: 'auth',
      severity: 'info',
    });

    this.log.log(
      `[auth] Login OK tenant=${tenantSlug} userId=${userEntity.id}`,
    );

    return {
      accessToken,
      refreshToken: refreshRaw,
      expiresIn: this.cfg.get<string>('JWT_EXPIRES_IN', '15m'),
      user: payload,
    };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: string;
  }> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const row = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!row?.user?.isActive) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const u = row.user;
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: u.tenantId },
    });
    if (tenant.status !== 'active') {
      throw new UnauthorizedException('Tenant inativo');
    }

    const roleSlugs = u.userRoles.map((ur) => ur.role.slug);
    const permSet = new Set<string>();
    for (const ur of u.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permSet.add(rp.permission.key);
      }
    }

    const payload: JwtAccessPayload = {
      sub: u.id,
      email: u.email,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      roles: roleSlugs,
      permissions: [...permSet],
    };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.accessExpiresIn,
    });
    return {
      accessToken,
      expiresIn: this.cfg.get<string>('JWT_EXPIRES_IN', '15m'),
    };
  }

  async logout(refreshToken: string, userId: string): Promise<void> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
