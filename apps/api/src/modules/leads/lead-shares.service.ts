import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { LeadSharePermission } from '@prisma/client';

import { OwnershipService } from '../access/ownership.service';
import type { LeadAccessActor } from '../access/ownership.types';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  CreateLeadShareDto,
  UpdateLeadShareDto,
} from './dto/lead-share.dto';

const shareUserSelect = {
  id: true,
  name: true,
  email: true,
  initials: true,
} as const;

@Injectable()
export class LeadSharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async listShares(tenantId: string, leadId: string, actor: LeadAccessActor) {
    await this.assertLeadShareAccess(tenantId, leadId, actor);

    const shares = await this.prisma.leadShare.findMany({
      where: { tenantId, leadId, revokedAt: null },
      include: {
        sharedWithUser: { select: shareUserSelect },
        sharedByUser: { select: shareUserSelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares.map((share) => this.serializeShare(share));
  }

  async createShare(
    tenantId: string,
    leadId: string,
    dto: CreateLeadShareDto,
    actor: LeadAccessActor,
  ) {
    await this.assertLeadShareAccess(tenantId, leadId, actor);

    const sharedWith = await this.prisma.user.findFirst({
      where: { id: dto.sharedWithUserId, tenantId, isActive: true },
      select: { id: true },
    });
    if (!sharedWith) {
      throw new NotFoundException('Usuário destino não encontrado');
    }

    const existing = await this.prisma.leadShare.findFirst({
      where: {
        leadId,
        sharedWithUserId: dto.sharedWithUserId,
        revokedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException('Lead já compartilhado com este usuário');
    }

    const share = await this.prisma.leadShare.create({
      data: {
        tenantId,
        leadId,
        sharedWithUserId: dto.sharedWithUserId,
        sharedByUserId: actor.userId,
        permission: dto.permission ?? 'read',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        sharedWithUser: { select: shareUserSelect },
        sharedByUser: { select: shareUserSelect },
      },
    });

    return this.serializeShare(share);
  }

  async updateShare(
    tenantId: string,
    leadId: string,
    shareId: string,
    dto: UpdateLeadShareDto,
    actor: LeadAccessActor,
  ) {
    await this.assertLeadShareAccess(tenantId, leadId, actor);
    await this.ensureShareBelongsToLead(tenantId, leadId, shareId);

    const share = await this.prisma.leadShare.update({
      where: { id: shareId },
      data: {
        ...(dto.permission !== undefined ? { permission: dto.permission } : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
        ...(dto.revoked === true ? { revokedAt: new Date() } : {}),
      },
      include: {
        sharedWithUser: { select: shareUserSelect },
        sharedByUser: { select: shareUserSelect },
      },
    });

    return this.serializeShare(share);
  }

  async revokeShare(
    tenantId: string,
    leadId: string,
    shareId: string,
    actor: LeadAccessActor,
  ) {
    await this.assertLeadShareAccess(tenantId, leadId, actor);
    await this.ensureShareBelongsToLead(tenantId, leadId, shareId);

    await this.prisma.leadShare.update({
      where: { id: shareId },
      data: { revokedAt: new Date() },
    });

    return { revoked: true, id: shareId };
  }

  private async assertLeadShareAccess(
    tenantId: string,
    leadId: string,
    actor: LeadAccessActor,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: { id: true },
    });
    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }

    const enforcement = await this.ownership.getEnforcementMode(tenantId);
    if (enforcement === 'off') return;

    const ctx = await this.ownership.resolveContext(tenantId, actor);
    if (enforcement === 'shadow') {
      void this.ownership.logLeadAccessShadowDenied(ctx, leadId);
      return;
    }

    await this.ownership.assertCanAccessLead(ctx, leadId);
  }

  private async ensureShareBelongsToLead(
    tenantId: string,
    leadId: string,
    shareId: string,
  ) {
    const share = await this.prisma.leadShare.findFirst({
      where: { id: shareId, leadId, tenantId },
      select: { id: true },
    });
    if (!share) {
      throw new NotFoundException('Compartilhamento não encontrado');
    }
  }

  private serializeShare(share: {
    id: string;
    tenantId: string;
    leadId: string;
    sharedWithUserId: string;
    sharedByUserId: string;
    permission: LeadSharePermission;
    expiresAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
    sharedWithUser: {
      id: string;
      name: string;
      email: string;
      initials: string;
    };
    sharedByUser: {
      id: string;
      name: string;
      email: string;
      initials: string;
    };
  }) {
    return {
      id: share.id,
      tenantId: share.tenantId,
      leadId: share.leadId,
      sharedWithUserId: share.sharedWithUserId,
      sharedByUserId: share.sharedByUserId,
      permission: share.permission,
      expiresAt: share.expiresAt?.toISOString() ?? null,
      revokedAt: share.revokedAt?.toISOString() ?? null,
      createdAt: share.createdAt.toISOString(),
      sharedWithUser: share.sharedWithUser,
      sharedByUser: share.sharedByUser,
    };
  }
}
