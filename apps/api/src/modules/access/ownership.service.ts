import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  resolveEffectiveDataScope,
  scopeForRoleSlug,
} from './data-scope.util';
import { getOwnershipEnforcement } from './tenant-settings.util';
import type {
  AccessContext,
  LeadAccessActor,
  OwnershipEnforcement,
} from './ownership.types';

@Injectable()
export class OwnershipService {
  private readonly log = new Logger(OwnershipService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getEnforcementMode(tenantId: string): Promise<OwnershipEnforcement> {
    return getOwnershipEnforcement(this.prisma, tenantId, this.config);
  }

  async resolveContext(
    tenantId: string,
    actor: LeadAccessActor,
  ): Promise<AccessContext> {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId: actor.userId, team: { tenantId, isActive: true } },
      select: { teamId: true },
    });
    const teamIds = [...new Set(memberships.map((m) => m.teamId))];

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: actor.userId, role: { tenantId } },
      include: { role: { select: { slug: true, defaultDataScope: true } } },
    });

    const roleScopes = userRoles.map((ur) =>
      scopeForRoleSlug(ur.role.slug, ur.role.defaultDataScope),
    );

    if (actor.roles.includes('super_admin')) {
      roleScopes.push('tenant');
    }

    const dataScope = resolveEffectiveDataScope(roleScopes);

    return {
      tenantId,
      userId: actor.userId,
      roles: actor.roles,
      permissions: actor.permissions,
      dataScope,
      teamIds,
    };
  }

  buildLeadAccessWhere(ctx: AccessContext): Prisma.LeadWhereInput {
    switch (ctx.dataScope) {
      case 'tenant':
        return {};
      case 'own':
        return { ownerUserId: ctx.userId };
      case 'team':
        if (ctx.teamIds.length === 0) {
          return { ownerTeamId: { in: [] } };
        }
        return { ownerTeamId: { in: ctx.teamIds } };
      case 'shared':
        return {
          shares: {
            some: {
              sharedWithUserId: ctx.userId,
              revokedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        };
      default:
        return { ownerUserId: ctx.userId };
    }
  }

  async assertCanAccessLead(ctx: AccessContext, leadId: string): Promise<void> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: ctx.tenantId,
        ...this.buildLeadAccessWhere(ctx),
      },
      select: { id: true },
    });
    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }
  }

  /**
   * Shadow: compara contagem legacy (assignedTo mine) vs ownership sem bloquear.
   */
  async logLeadListShadowComparison(
    tenantId: string,
    ctx: AccessContext,
    legacyWhere: Prisma.LeadWhereInput,
    ownershipWhere: Prisma.LeadWhereInput,
  ): Promise<void> {
    const [legacyCount, ownershipCount, intersectionCount] =
      await this.prisma.$transaction([
        this.prisma.lead.count({ where: legacyWhere }),
        this.prisma.lead.count({
          where: { tenantId, ...ownershipWhere },
        }),
        this.prisma.lead.count({
          where: { tenantId, AND: [legacyWhere, ownershipWhere] },
        }),
      ]);

    if (legacyCount !== ownershipCount || intersectionCount < legacyCount) {
      this.log.warn(
        `[ownership:shadow] tenant=${tenantId} user=${ctx.userId} scope=${ctx.dataScope} ` +
          `legacy=${legacyCount} ownership=${ownershipCount} intersection=${intersectionCount}`,
      );
    }
  }

  async logLeadAccessShadowDenied(
    ctx: AccessContext,
    leadId: string,
  ): Promise<void> {
    const visible = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: ctx.tenantId,
        ...this.buildLeadAccessWhere(ctx),
      },
      select: { id: true },
    });
    if (!visible) {
      this.log.warn(
        `[ownership:shadow] denied lead=${leadId} user=${ctx.userId} scope=${ctx.dataScope}`,
      );
    }
  }
}
