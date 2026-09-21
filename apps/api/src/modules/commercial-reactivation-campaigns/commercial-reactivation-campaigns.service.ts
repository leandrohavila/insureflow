import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { buildManualReactivatePatch } from '../../common/utils/lead-reactivation.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LeadFollowUpsService } from '../lead-follow-ups/lead-follow-ups.service';
import type {
  AddCampaignLeadsDto,
  CreateCampaignDto,
  ListCampaignsQueryDto,
  PreviewCampaignLeadsDto,
  ReactivateCampaignLeadDto,
  UpdateCampaignDto,
  UpdateCampaignLeadDto,
} from './dto/commercial-reactivation-campaigns.dto';

const campaignInclude = {
  ownerUser: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  businessUnit: { select: { id: true, name: true } },
  _count: { select: { leads: true } },
} as const;

@Injectable()
export class CommercialReactivationCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityEngine: ActivityEngineService,
    private readonly followUps: LeadFollowUpsService,
    private readonly auditLogs: AuditLogsService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async list(
    tenantId: string,
    query: ListCampaignsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    let where: Prisma.ReactivationCampaignWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.ownerUserId ? { ownerUserId: query.ownerUserId } : {}),
      ...(query.businessUnitId ? { businessUnitId: query.businessUnitId } : {}),
    };
    where = await this.applyCampaignAcl(where, actor, query.businessUnitId);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.reactivationCampaign.count({ where }),
      this.prisma.reactivationCampaign.findMany({
        where,
        include: campaignInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = await Promise.all(
      rows.map(async (campaign) => {
        const kpis = await this.computeKpis(campaign.id);
        return this.toCampaignListItem(campaign, kpis);
      }),
    );

    return {
      data,
      meta: { total, page, limit, pageCount: Math.ceil(total / limit) },
    };
  }

  async getById(tenantId: string, id: string, actor?: BusinessUnitActor) {
    const campaign = await this.requireCampaign(tenantId, id, actor);
    const kpis = await this.computeKpis(campaign.id);
    const leads = await this.prisma.campaignLead.findMany({
      where: { tenantId, campaignId: campaign.id },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            source: true,
            company: true,
            status: true,
            lostAt: true,
            lostReason: true,
            lossReasonId: true,
            ownerUserId: true,
            ownerUser: { select: { id: true, name: true } },
            configuredLossReason: { select: { id: true, name: true } },
            businessUnitId: true,
          },
        },
        addedBy: { select: { id: true, name: true } },
      },
      orderBy: { addedAt: 'asc' },
    });

    return {
      ...this.toCampaignListItem(campaign, kpis),
      description: campaign.description,
      startedAt: campaign.startedAt?.toISOString() ?? null,
      finishedAt: campaign.finishedAt?.toISOString() ?? null,
      businessUnitId: campaign.businessUnitId,
      businessUnitName: campaign.businessUnit?.name ?? null,
      leads: leads.map((row) => ({
        id: row.id,
        leadId: row.leadId,
        name: row.lead.name,
        phone: row.lead.phone,
        email: row.lead.email,
        source: row.lead.source,
        company: row.lead.company,
        lossReasonName:
          row.lead.configuredLossReason?.name ?? row.lead.lostReason,
        lostAt: row.lead.lostAt?.toISOString() ?? null,
        ownerName: row.lead.ownerUser?.name ?? null,
        ownerUserId: row.lead.ownerUserId,
        contactStatus: row.contactStatus,
        contactedAt: row.contactedAt?.toISOString() ?? null,
        reactivatedAt: row.reactivatedAt?.toISOString() ?? null,
        notes: row.notes,
        addedAt: row.addedAt.toISOString(),
        addedByName: row.addedBy?.name ?? null,
      })),
    };
  }

  async create(
    tenantId: string,
    dto: CreateCampaignDto,
    actor: BusinessUnitActor & { userId: string },
  ) {
    const ownerUserId = dto.ownerUserId?.trim() || actor.userId;
    await this.assertUserInTenant(tenantId, ownerUserId);

    const created = await this.prisma.reactivationCampaign.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        ownerUserId,
        createdById: actor.userId,
        businessUnitId:
          dto.businessUnitId || actor.currentBusinessUnitId || null,
        status: 'DRAFT',
      },
      include: campaignInclude,
    });

    const metadata = {
      campaignId: created.id,
      campaignName: created.name,
      ownerUserId: created.ownerUserId,
      status: created.status,
    };
    await this.activityEngine.publish({
      tenantId,
      performedById: actor.userId,
      operationalEventKind: 'campaign_created',
      subject: `Campanha criada — ${created.name}`,
      description: created.description ?? undefined,
      metadata,
    });
    this.auditCampaign(actor, 'campaign_created', created.id, metadata);

    const kpis = await this.computeKpis(created.id);
    return this.toCampaignListItem(created, kpis);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCampaignDto,
    actor: BusinessUnitActor & { userId: string },
  ) {
    const campaign = await this.requireCampaign(tenantId, id, actor);
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException(
        'Somente campanhas em rascunho podem ser editadas.',
      );
    }
    if (dto.ownerUserId) {
      await this.assertUserInTenant(tenantId, dto.ownerUserId);
    }

    const updated = await this.prisma.reactivationCampaign.update({
      where: { id: campaign.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.ownerUserId ? { ownerUserId: dto.ownerUserId } : {}),
      },
      include: campaignInclude,
    });

    const metadata = {
      campaignId: updated.id,
      campaignName: updated.name,
      ownerUserId: updated.ownerUserId,
      status: updated.status,
    };
    await this.activityEngine.publish({
      tenantId,
      performedById: actor.userId,
      operationalEventKind: 'campaign_updated',
      subject: `Campanha atualizada — ${updated.name}`,
      description: updated.description ?? undefined,
      metadata,
    });
    this.auditCampaign(actor, 'campaign_updated', updated.id, metadata);

    const kpis = await this.computeKpis(updated.id);
    return this.toCampaignListItem(updated, kpis);
  }

  async start(
    tenantId: string,
    id: string,
    actor: BusinessUnitActor & { userId: string },
  ) {
    const campaign = await this.requireCampaign(tenantId, id, actor);
    if (campaign.status === 'FINISHED') {
      throw new BadRequestException('Campanha já encerrada.');
    }

    const leadCount = await this.prisma.campaignLead.count({
      where: { campaignId: campaign.id },
    });
    if (campaign.status === 'DRAFT' && leadCount < 1) {
      throw new BadRequestException(
        'Adicione leads à campanha antes de iniciar.',
      );
    }

    if (campaign.status === 'DRAFT') {
      const updated = await this.prisma.reactivationCampaign.update({
        where: { id: campaign.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
        include: campaignInclude,
      });

      const metadata = {
        campaignId: updated.id,
        campaignName: updated.name,
        totalLeads: leadCount,
      };
      await this.activityEngine.publish({
        tenantId,
        performedById: actor.userId,
        operationalEventKind: 'campaign_started',
        subject: `Campanha iniciada — ${updated.name}`,
        metadata,
      });
      this.auditCampaign(actor, 'campaign_started', updated.id, metadata);
    }

    await this.ensureCampaignFollowUps(
      tenantId,
      campaign.id,
      campaign.name,
      campaign.ownerUserId,
      actor,
    );

    return this.getById(tenantId, id, actor);
  }

  async finish(
    tenantId: string,
    id: string,
    actor: BusinessUnitActor & { userId: string },
  ) {
    const campaign = await this.requireCampaign(tenantId, id, actor);
    if (campaign.status === 'FINISHED') {
      return this.getById(tenantId, id, actor);
    }

    const updated = await this.prisma.reactivationCampaign.update({
      where: { id: campaign.id },
      data: { status: 'FINISHED', finishedAt: new Date() },
      include: campaignInclude,
    });

    const kpis = await this.computeKpis(updated.id);
    const metadata = {
      campaignId: updated.id,
      campaignName: updated.name,
      ...kpis,
    };
    await this.activityEngine.publish({
      tenantId,
      performedById: actor.userId,
      operationalEventKind: 'campaign_finished',
      subject: `Campanha encerrada — ${updated.name}`,
      metadata,
    });
    this.auditCampaign(actor, 'campaign_finished', updated.id, metadata);

    return this.getById(tenantId, id, actor);
  }

  async previewLeads(
    tenantId: string,
    campaignId: string,
    dto: PreviewCampaignLeadsDto,
    actor?: BusinessUnitActor,
  ) {
    await this.requireCampaign(tenantId, campaignId, actor);
    const where = await this.buildLostLeadWhere(
      tenantId,
      dto,
      actor,
      campaignId,
    );
    const total = await this.prisma.lead.count({ where });
    return { total };
  }

  async addLeads(
    tenantId: string,
    campaignId: string,
    dto: AddCampaignLeadsDto,
    actor: BusinessUnitActor & { userId: string },
  ) {
    const campaign = await this.requireCampaign(tenantId, campaignId, actor);
    if (campaign.status === 'FINISHED') {
      throw new BadRequestException(
        'Não é possível adicionar leads a campanha encerrada.',
      );
    }

    let leadIds = dto.leadIds?.filter(Boolean) ?? [];
    if (leadIds.length === 0) {
      const where = await this.buildLostLeadWhere(
        tenantId,
        dto,
        actor,
        campaignId,
      );
      const found = await this.prisma.lead.findMany({
        where,
        select: { id: true },
        take: 2000,
      });
      leadIds = found.map((row) => row.id);
    } else {
      const where = await this.buildLostLeadWhere(
        tenantId,
        { ...dto /* ignore lostDays when explicit ids? keep ACL */ },
        actor,
        campaignId,
      );
      const allowed = await this.prisma.lead.findMany({
        where: andWhere(where, { id: { in: leadIds } }),
        select: { id: true },
      });
      leadIds = allowed.map((row) => row.id);
    }

    if (leadIds.length === 0) {
      return {
        added: 0,
        total: await this.prisma.campaignLead.count({
          where: { campaignId },
        }),
      };
    }

    const result = await this.prisma.campaignLead.createMany({
      data: leadIds.map((leadId) => ({
        tenantId,
        campaignId,
        leadId,
        addedById: actor.userId,
        contactStatus: 'NOT_STARTED' as const,
      })),
      skipDuplicates: true,
    });

    const metadata = {
      campaignId,
      campaignName: campaign.name,
      added: result.count,
      requested: leadIds.length,
    };
    await this.activityEngine.publish({
      tenantId,
      performedById: actor.userId,
      operationalEventKind: 'campaign_lead_added',
      subject: `Leads adicionados — ${campaign.name}`,
      description: `${result.count} lead(s) vinculados à campanha.`,
      metadata,
    });
    this.auditCampaign(actor, 'campaign_lead_added', campaignId, metadata);

    return {
      added: result.count,
      total: await this.prisma.campaignLead.count({ where: { campaignId } }),
    };
  }

  async removeLead(
    tenantId: string,
    campaignId: string,
    campaignLeadId: string,
    actor: BusinessUnitActor & { userId: string },
  ) {
    const campaign = await this.requireCampaign(tenantId, campaignId, actor);
    if (campaign.status === 'FINISHED') {
      throw new BadRequestException(
        'Não é possível remover leads de campanha encerrada.',
      );
    }

    const row = await this.prisma.campaignLead.findFirst({
      where: { id: campaignLeadId, tenantId, campaignId },
      include: { lead: { select: { id: true, name: true } } },
    });
    if (!row) throw new NotFoundException('Lead da campanha não encontrado.');

    await this.prisma.campaignLead.delete({ where: { id: row.id } });

    const metadata = {
      campaignId,
      campaignName: campaign.name,
      campaignLeadId: row.id,
      leadId: row.leadId,
    };
    await this.activityEngine.publish({
      tenantId,
      performedById: actor.userId,
      operationalEventKind: 'campaign_lead_removed',
      subject: `Lead removido — ${campaign.name}`,
      description: row.lead.name,
      leadId: row.leadId,
      metadata,
    });
    this.auditCampaign(actor, 'campaign_lead_removed', campaignId, metadata);

    return { deleted: true, id: row.id };
  }

  async updateLead(
    tenantId: string,
    campaignId: string,
    campaignLeadId: string,
    dto: UpdateCampaignLeadDto,
    actor: BusinessUnitActor & { userId: string },
  ) {
    await this.requireCampaign(tenantId, campaignId, actor);
    const row = await this.prisma.campaignLead.findFirst({
      where: { id: campaignLeadId, tenantId, campaignId },
    });
    if (!row) throw new NotFoundException('Lead da campanha não encontrado.');

    if (dto.contactStatus === 'REACTIVATED') {
      throw new BadRequestException(
        'Use a ação de reativação da campanha para marcar como reativado.',
      );
    }

    const now = new Date();
    const contactedStatuses = new Set([
      'IN_PROGRESS',
      'NO_RESPONSE',
      'INTERESTED',
      'CLOSED',
    ]);

    return this.prisma.campaignLead.update({
      where: { id: row.id },
      data: {
        ...(dto.contactStatus
          ? {
              contactStatus: dto.contactStatus,
              ...(contactedStatuses.has(dto.contactStatus) && !row.contactedAt
                ? { contactedAt: now }
                : {}),
            }
          : {}),
        ...(dto.notes !== undefined
          ? { notes: dto.notes?.trim() || null }
          : {}),
      },
    });
  }

  async reactivateLead(
    tenantId: string,
    campaignId: string,
    campaignLeadId: string,
    dto: ReactivateCampaignLeadDto,
    actor: BusinessUnitActor & { userId: string },
  ) {
    const campaign = await this.requireCampaign(tenantId, campaignId, actor);
    const row = await this.prisma.campaignLead.findFirst({
      where: { id: campaignLeadId, tenantId, campaignId },
      include: {
        lead: {
          include: {
            configuredLossReason: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Lead da campanha não encontrado.');
    if (row.lead.status !== 'lost') {
      throw new BadRequestException('Lead já não está perdido.');
    }

    const now = new Date();
    const patch = buildManualReactivatePatch({
      now,
      toStatus: dto.toStatus,
    });

    const [lead] = await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id: row.leadId },
        data: patch,
      }),
      this.prisma.campaignLead.update({
        where: { id: row.id },
        data: {
          contactStatus: 'REACTIVATED',
          reactivatedAt: now,
          contactedAt: row.contactedAt ?? now,
          notes: dto.notes?.trim() || row.notes,
        },
      }),
    ]);

    const lossLabel =
      row.lead.configuredLossReason?.name || row.lead.lostReason || '—';

    await this.activityEngine.publish({
      tenantId,
      performedById: actor.userId,
      operationalEventKind: 'lead_reactivated_campaign',
      subject: `Lead reativado por campanha — ${row.lead.name}`,
      description: [
        `Campanha: ${campaign.name}`,
        `Participação desde: ${row.addedAt.toLocaleDateString('pt-BR')}`,
        `Motivo original: ${lossLabel}`,
        `Reativado em: ${now.toLocaleDateString('pt-BR')}`,
        dto.notes?.trim() ? `Notas: ${dto.notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      leadId: row.leadId,
      metadata: {
        action: 'campaign_reopen',
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignLeadId: row.id,
        fromStatus: 'lost',
        toStatus: patch.status,
        lossReasonId: row.lead.lossReasonId,
        addedAt: row.addedAt.toISOString(),
        reactivatedAt: now.toISOString(),
        actorUserId: actor.userId,
      },
    });

    return { lead, campaignLeadId: row.id, campaignId: campaign.id };
  }

  private async computeKpis(campaignId: string) {
    const [totalLeads, contacted, reactivated] = await Promise.all([
      this.prisma.campaignLead.count({ where: { campaignId } }),
      this.prisma.campaignLead.count({
        where: {
          campaignId,
          OR: [
            { contactedAt: { not: null } },
            {
              contactStatus: {
                in: [
                  'IN_PROGRESS',
                  'NO_RESPONSE',
                  'INTERESTED',
                  'REACTIVATED',
                  'CLOSED',
                ],
              },
            },
          ],
        },
      }),
      this.prisma.campaignLead.count({
        where: { campaignId, contactStatus: 'REACTIVATED' },
      }),
    ]);

    const conversionRate =
      totalLeads > 0
        ? Number(((reactivated / totalLeads) * 100).toFixed(1))
        : 0;

    return {
      totalLeads,
      contacted,
      reactivated,
      conversionRate,
    };
  }

  private toCampaignListItem(
    campaign: {
      id: string;
      name: string;
      description: string | null;
      status: string;
      createdAt: Date;
      ownerUserId: string;
      ownerUser: { id: string; name: string; email?: string | null };
      createdBy?: { id: string; name: string } | null;
      businessUnit?: { id: string; name: string } | null;
      businessUnitId?: string | null;
      startedAt?: Date | null;
      finishedAt?: Date | null;
    },
    kpis: {
      totalLeads: number;
      contacted: number;
      reactivated: number;
      conversionRate: number;
    },
  ) {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      createdAt: campaign.createdAt.toISOString(),
      ownerUserId: campaign.ownerUserId,
      ownerName: campaign.ownerUser.name,
      createdByName: campaign.createdBy?.name ?? null,
      ...kpis,
    };
  }

  private async requireCampaign(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    let where: Prisma.ReactivationCampaignWhereInput = { id, tenantId };
    where = await this.applyCampaignAcl(where, actor);

    const campaign = await this.prisma.reactivationCampaign.findFirst({
      where,
      include: campaignInclude,
    });
    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada ou sem acesso.');
    }
    return campaign;
  }

  private async applyCampaignAcl(
    where: Prisma.ReactivationCampaignWhereInput,
    actor?: BusinessUnitActor,
    requestedBusinessUnitId?: string,
  ) {
    if (!this.buAccess || !actor) return where;

    const ids = await this.buAccess.resolveIds(actor, requestedBusinessUnitId);
    // null = view-all (admin/gestor amplo)
    if (ids === null) {
      if (requestedBusinessUnitId) {
        return andWhere(where, {
          OR: [
            { businessUnitId: requestedBusinessUnitId },
            { businessUnitId: null },
          ],
        });
      }
      return where;
    }
    if (ids.length === 0) {
      return andWhere(where, { id: '__none__' });
    }
    return andWhere(where, {
      OR: [{ businessUnitId: { in: ids } }, { businessUnitId: null }],
    });
  }

  private async buildLostLeadWhere(
    tenantId: string,
    dto: PreviewCampaignLeadsDto,
    actor: BusinessUnitActor | undefined,
    campaignId: string,
  ): Promise<Prisma.LeadWhereInput> {
    const now = new Date();
    let where: Prisma.LeadWhereInput = {
      tenantId,
      status: 'lost',
      ...(dto.lossReasonId ? { lossReasonId: dto.lossReasonId } : {}),
      ...(dto.source
        ? { source: { equals: dto.source, mode: 'insensitive' } }
        : {}),
      ...(dto.ownerUserId ? { ownerUserId: dto.ownerUserId } : {}),
      ...(dto.company
        ? { company: { contains: dto.company, mode: 'insensitive' } }
        : {}),
      campaignLeads: { none: { campaignId } },
    };

    if (dto.lostDays) {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - dto.lostDays);
      where = andWhere(where, {
        lostAt: { lte: cutoff },
      });
    }

    if (this.buAccess && actor) {
      const leadExtra = await this.buAccess.leadWhere(
        actor,
        dto.businessUnitId,
      );
      where = andWhere(where, leadExtra);
    } else if (dto.businessUnitId) {
      where = andWhere(where, { businessUnitId: dto.businessUnitId });
    }

    return where;
  }

  private async ensureCampaignFollowUps(
    tenantId: string,
    campaignId: string,
    campaignName: string,
    ownerUserId: string,
    actor: BusinessUnitActor & { userId: string },
  ) {
    const rows = await this.prisma.campaignLead.findMany({
      where: { campaignId },
      select: { leadId: true },
    });

    for (const row of rows) {
      const result = await this.followUps.scheduleForCampaign({
        tenantId,
        leadId: row.leadId,
        campaignId,
        campaignName,
        actorUserId: actor.userId,
        assignedUserId: ownerUserId,
      });
      if (!result.created) continue;

      this.auditCampaign(actor, 'campaign_followup_created', campaignId, {
        campaignId,
        campaignName,
        leadId: row.leadId,
        followUpId: result.followUp.id,
        type: 'WHATSAPP',
        status: 'PENDING',
      });
    }
  }

  private auditCampaign(
    actor: BusinessUnitActor & { userId: string },
    action: string,
    resourceId: string,
    metadata: Record<string, unknown>,
  ) {
    this.auditLogs.enqueue({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action,
      resource: 'reactivation_campaigns',
      resourceId,
      severity: 'info',
      metadata,
    });
  }

  private async assertUserInTenant(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true },
    });
    if (!user) {
      throw new BadRequestException('Responsável inválido para o tenant.');
    }
  }
}
