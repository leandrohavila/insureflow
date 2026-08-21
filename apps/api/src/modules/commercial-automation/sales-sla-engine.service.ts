import { Injectable, Logger } from '@nestjs/common';

import type { ActivityEventKind } from '../../common/utils/activity-event-kinds.util';
import {
  canonicalDealStage,
  computeStageSla,
  defaultStagesForUnitType,
} from '../../common/utils/deal-pipeline.util';
import { decodeActivityEventMetadata } from '../activities/activity-event-metadata.util';
import {
  CROSS_SELL_IDLE_ALERT_DAYS,
  elapsedDaysFromHours,
  escalationLevelsDue,
  isIdleSince,
  OPPORTUNITY_IDLE_ALERT_DAYS,
  PENDING_RENEWAL_STATUSES,
  shouldAlertIdleRenewal,
  type SlaEscalationLevel,
} from '../../common/utils/sales-sla.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { CommunicationsService } from '../communications/communications.service';

export type SalesSlaJobResult = {
  tenants: number;
  dealsScanned: number;
  warnings: number;
  overdue: number;
  escalated: number;
  renewals: number;
  opportunities: number;
  crossSell: number;
};

type StaffUser = { id: string; name: string; email: string };

@Injectable()
export class SalesSlaEngine {
  private readonly log = new Logger(SalesSlaEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityEngine: ActivityEngineService,
    private readonly communications: CommunicationsService,
  ) {}

  async processDaily(now = new Date()): Promise<SalesSlaJobResult> {
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true },
    });
    const summary = emptyResult();
    summary.tenants = tenants.length;
    for (const tenant of tenants) {
      const batch = await this.processTenant(tenant.id, now);
      addResult(summary, batch);
    }
    summary.tenants = tenants.length;
    return summary;
  }

  async processTenant(tenantId: string, now = new Date()) {
    const summary = emptyResult();
    summary.tenants = 1;
    const performerId = await this.resolvePerformerId(tenantId);
    if (!performerId) return summary;

    const deals = await this.handleDeals(tenantId, performerId, now);
    const renewals = await this.handleRenewals(tenantId, performerId, now);
    const opportunities = await this.handleOpportunities(
      tenantId,
      performerId,
      now,
    );
    const crossSell = await this.handleCrossSell(tenantId, performerId, now);

    return {
      tenants: 1,
      dealsScanned: deals.scanned,
      warnings: deals.warnings,
      overdue: deals.overdue,
      escalated: deals.escalated,
      renewals,
      opportunities,
      crossSell,
    };
  }

  private async handleDeals(
    tenantId: string,
    performerId: string,
    now: Date,
  ) {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId, status: 'open' },
      include: {
        ownerUser: {
          select: { id: true, name: true, email: true, primaryTeamId: true },
        },
        businessUnit: { select: { type: true } },
        pipeline: {
          include: {
            stages: {
              select: {
                slug: true,
                maxDays: true,
                label: true,
                alertTarget: true,
              },
            },
          },
        },
        customer: { select: { id: true } },
        convertedLead: { select: { id: true } },
      },
      take: 500,
    });

    let warnings = 0;
    let overdue = 0;
    let escalated = 0;

    for (const deal of deals) {
      const unitType = deal.businessUnit?.type ?? 'INSURANCE';
      const stages =
        deal.pipeline?.stages?.length
          ? deal.pipeline.stages
          : defaultStagesForUnitType(unitType);
      const slug = canonicalDealStage(deal.stage, unitType);
      const stageDef = stages.find((stage) => stage.slug === slug);
      const sla = computeStageSla({
        enteredAt: deal.stageEnteredAt,
        maxDays: stageDef?.maxDays,
        now,
      });
      const since = deal.stageEnteredAt;
      const leadId = deal.convertedLead?.id ?? null;
      const customerId = deal.customer?.id ?? null;
      const stageLabel = stageDef?.label ?? slug;

      if (sla.status === 'warning') {
        const created = await this.publishOnce({
          tenantId,
          performerId,
          kind: 'sla_warning',
          subject: `SLA em alerta — ${deal.title}`,
          description: `${stageLabel} atingiu 80% do tempo máximo.`,
          now,
          dealId: deal.id,
          leadId,
          customerId,
          since,
          metadata: { stage: slug, status: sla.status },
        });
        if (created) {
          warnings += 1;
          await this.notifyStaff({
            tenantId,
            performerId,
            target: await this.resolveTarget(tenantId, deal, 'OWNER'),
            content: `O negócio "${deal.title}" está em alerta de SLA no estágio ${stageLabel}.`,
            customerId,
            leadId,
            kind: 'sla_warning',
          });
        }
      }

      if (sla.status === 'overdue') {
        const created = await this.publishOnce({
          tenantId,
          performerId,
          kind: 'sla_overdue',
          subject: `SLA atrasado — ${deal.title}`,
          description: `${stageLabel} ultrapassou o tempo máximo.`,
          now,
          dealId: deal.id,
          leadId,
          customerId,
          since,
          metadata: { stage: slug, status: sla.status },
        });
        if (created) {
          overdue += 1;
          await this.notifyStaff({
            tenantId,
            performerId,
            target: await this.resolveTarget(
              tenantId,
              deal,
              stageDef?.alertTarget === 'MANAGER' ? 'MANAGER' : 'OWNER',
            ),
            content: `O negócio "${deal.title}" está atrasado no estágio ${stageLabel}.`,
            customerId,
            leadId,
            kind: 'sla_overdue',
          });
        }
      }

      const levels = escalationLevelsDue(elapsedDaysFromHours(sla.elapsedHours));
      const existingLevels = await this.existingEscalationLevels(
        tenantId,
        deal.id,
        since,
      );
      for (const level of levels) {
        if (existingLevels.has(level)) continue;
        const target = await this.resolveTarget(tenantId, deal, level);
        const created = await this.activityEngine.publish({
          tenantId,
          performedById: performerId,
          operationalEventKind: 'sla_escalated',
          subject: `SLA escalonado (${levelLabel(level)}) — ${deal.title}`,
          description: `${elapsedDaysFromHours(sla.elapsedHours)} dia(s) em ${stageLabel}.`,
          occurredAt: now,
          dealId: deal.id,
          leadId,
          customerId,
          metadata: { stage: slug, level },
        });
        if (!created.created) continue;
        escalated += 1;
        existingLevels.add(level);
        await this.notifyStaff({
          tenantId,
          performerId,
          target,
          content: `Escalonamento ${levelLabel(level)}: "${deal.title}" parado em ${stageLabel}.`,
          customerId,
          leadId,
          kind: 'sla_escalated',
        });
      }
    }

    return { scanned: deals.length, warnings, overdue, escalated };
  }

  private async handleRenewals(
    tenantId: string,
    performerId: string,
    now: Date,
  ) {
    const rows = await this.prisma.policyRenewal.findMany({
      where: {
        tenantId,
        status: { in: [...PENDING_RENEWAL_STATUSES] },
      },
      select: {
        id: true,
        customerId: true,
        dealId: true,
        policyNumber: true,
        product: true,
        status: true,
        renewalDate: true,
        updatedAt: true,
        assignedUserId: true,
      },
      take: 300,
    });

    let created = 0;
    for (const row of rows) {
      if (
        !shouldAlertIdleRenewal({
          status: row.status,
          renewalDate: row.renewalDate,
          updatedAt: row.updatedAt,
          now,
        })
      ) {
        continue;
      }
      const published = await this.publishOnce({
        tenantId,
        performerId,
        kind: 'renewal_overdue',
        subject: `Renovação sem movimentação — ${row.policyNumber}`,
        description: `${row.product} em ${row.status}.`,
        now,
        dealId: row.dealId,
        customerId: row.customerId,
        since: row.updatedAt,
        metadata: { renewalId: row.id, status: row.status },
      });
      if (!published) continue;
      created += 1;
      const target = row.assignedUserId
        ? await this.prisma.user.findFirst({
            where: { id: row.assignedUserId, tenantId },
            select: { id: true, name: true, email: true },
          })
        : null;
      await this.notifyStaff({
        tenantId,
        performerId,
        target,
        content: `Renovação ${row.policyNumber} (${row.product}) sem movimentação.`,
        customerId: row.customerId,
        kind: 'renewal_overdue',
      });
    }
    return created;
  }

  private async handleOpportunities(
    tenantId: string,
    performerId: string,
    now: Date,
  ) {
    const rows = await this.prisma.opportunity.findMany({
      where: {
        tenantId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      select: {
        id: true,
        customerId: true,
        type: true,
        updatedAt: true,
        assignedUserId: true,
      },
      take: 300,
    });

    let created = 0;
    for (const row of rows) {
      if (
        !isIdleSince({
          lastMovementAt: row.updatedAt,
          idleDays: OPPORTUNITY_IDLE_ALERT_DAYS,
          now,
        })
      ) {
        continue;
      }
      const published = await this.publishOnce({
        tenantId,
        performerId,
        kind: 'sla_warning',
        subject: `Oportunidade parada — ${row.type}`,
        description: 'Sem movimentação há 7 dias.',
        now,
        customerId: row.customerId,
        since: row.updatedAt,
        metadata: { opportunityId: row.id, entity: 'opportunity' },
      });
      if (!published) continue;
      created += 1;
      const target = row.assignedUserId
        ? await this.prisma.user.findFirst({
            where: { id: row.assignedUserId, tenantId },
            select: { id: true, name: true, email: true },
          })
        : null;
      await this.notifyStaff({
        tenantId,
        performerId,
        target,
        content: `Oportunidade ${row.type} sem movimentação há 7 dias.`,
        customerId: row.customerId,
        kind: 'sla_warning',
      });
    }
    return created;
  }

  private async handleCrossSell(
    tenantId: string,
    performerId: string,
    now: Date,
  ) {
    const rows = await this.prisma.crossSellOpportunity.findMany({
      where: { tenantId, status: 'PENDING' },
      select: {
        id: true,
        customerId: true,
        suggestedCategory: true,
        updatedAt: true,
      },
      take: 300,
    });

    let created = 0;
    for (const row of rows) {
      if (
        !isIdleSince({
          lastMovementAt: row.updatedAt,
          idleDays: CROSS_SELL_IDLE_ALERT_DAYS,
          now,
        })
      ) {
        continue;
      }
      const published = await this.publishOnce({
        tenantId,
        performerId,
        kind: 'sla_warning',
        subject: `Cross-sell pendente — ${row.suggestedCategory}`,
        description: 'Sem contato há 7 dias.',
        now,
        customerId: row.customerId,
        since: row.updatedAt,
        metadata: { crossSellId: row.id, entity: 'cross_sell' },
      });
      if (!published) continue;
      created += 1;
      await this.notifyStaff({
        tenantId,
        performerId,
        target: null,
        content: `Cross-sell ${row.suggestedCategory} pendente sem movimentação.`,
        customerId: row.customerId,
        kind: 'sla_warning',
      });
    }
    return created;
  }

  private async publishOnce(params: {
    tenantId: string;
    performerId: string;
    kind: ActivityEventKind;
    subject: string;
    description: string;
    now: Date;
    dealId?: string | null;
    leadId?: string | null;
    customerId?: string | null;
    since: Date;
    metadata: Record<string, unknown>;
  }) {
    const existing = await this.prisma.activity.findFirst({
      where: {
        tenantId: params.tenantId,
        operationalEventKind: params.kind,
        occurredAt: { gte: params.since },
        ...(params.dealId ? { dealId: params.dealId } : {}),
        ...(params.leadId ? { leadId: params.leadId } : {}),
        ...(params.customerId && !params.dealId
          ? { customerId: params.customerId }
          : {}),
      },
      select: { id: true },
    });
    if (existing) return false;
    const result = await this.activityEngine.publish({
      tenantId: params.tenantId,
      performedById: params.performerId,
      operationalEventKind: params.kind,
      subject: params.subject,
      description: params.description,
      occurredAt: params.now,
      dealId: params.dealId ?? null,
      leadId: params.leadId ?? null,
      customerId: params.customerId ?? null,
      metadata: params.metadata,
    });
    return result.created;
  }

  private async existingEscalationLevels(
    tenantId: string,
    dealId: string,
    since: Date,
  ) {
    const rows = await this.prisma.activity.findMany({
      where: {
        tenantId,
        dealId,
        operationalEventKind: 'sla_escalated',
        occurredAt: { gte: since },
      },
      select: { outcome: true },
    });
    const levels = new Set<SlaEscalationLevel>();
    for (const row of rows) {
      const meta = decodeActivityEventMetadata(row.outcome);
      const level = meta?.level;
      if (level === 'OWNER' || level === 'MANAGER' || level === 'DIRECTOR') {
        levels.add(level);
      }
    }
    return levels;
  }

  private async notifyStaff(params: {
    tenantId: string;
    performerId: string;
    target: StaffUser | null;
    content: string;
    customerId?: string | null;
    leadId?: string | null;
    kind: string;
  }) {
    const email = params.target?.email?.trim();
    if (!email) return;
    try {
      await this.communications.dispatch({
        tenantId: params.tenantId,
        channel: 'EMAIL',
        purpose: 'FOLLOW_UP',
        content: params.content,
        to: email,
        customerId: params.customerId ?? null,
        leadId: params.leadId ?? null,
        performedById: params.performerId,
        metadata: {
          source: 'sales_sla_engine',
          kind: params.kind,
          targetUserId: params.target?.id ?? null,
        },
      });
    } catch (error) {
      this.log.warn(
        `Falha ao notificar ${email}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async resolveTarget(
    tenantId: string,
    deal: {
      ownerUser: (StaffUser & { primaryTeamId: string | null }) | null;
    },
    level: SlaEscalationLevel,
  ): Promise<StaffUser | null> {
    if (level === 'OWNER') return deal.ownerUser;
    if (level === 'MANAGER') {
      if (deal.ownerUser?.primaryTeamId) {
        const lead = await this.prisma.teamMember.findFirst({
          where: { teamId: deal.ownerUser.primaryTeamId, isLead: true },
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
        });
        if (lead?.user) return lead.user;
      }
      return this.findUserByRole(tenantId, 'gerencia');
    }
    return this.findUserByRole(tenantId, 'admin');
  }

  private async findUserByRole(tenantId: string, slug: string) {
    return this.prisma.user.findFirst({
      where: {
        tenantId,
        isActive: true,
        userRoles: { some: { role: { slug } } },
      },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async resolvePerformerId(tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return user?.id ?? null;
  }
}

function emptyResult(): SalesSlaJobResult {
  return {
    tenants: 0,
    dealsScanned: 0,
    warnings: 0,
    overdue: 0,
    escalated: 0,
    renewals: 0,
    opportunities: 0,
    crossSell: 0,
  };
}

function addResult(target: SalesSlaJobResult, batch: SalesSlaJobResult) {
  target.dealsScanned += batch.dealsScanned;
  target.warnings += batch.warnings;
  target.overdue += batch.overdue;
  target.escalated += batch.escalated;
  target.renewals += batch.renewals;
  target.opportunities += batch.opportunities;
  target.crossSell += batch.crossSell;
}

function levelLabel(level: SlaEscalationLevel) {
  if (level === 'MANAGER') return 'gestor';
  if (level === 'DIRECTOR') return 'diretor';
  return 'responsável';
}
