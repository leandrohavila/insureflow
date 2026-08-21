import { Injectable, Logger } from '@nestjs/common';

import {
  INTEREST_CATEGORY_LABELS,
  type InterestCategory,
  type MessageChannel,
  type ReactivationChannel,
} from '../../common/constants/interest-categories';
import {
  addUtcDays,
  buildNextAttemptPatch,
  isLeadEligibleForReactivation,
} from '../../common/utils/lead-reactivation.util';
import { renderMessageTemplate } from '../../common/utils/message-template-render.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { CommunicationsService } from '../communications/communications.service';
import { LeadFollowUpsService } from '../lead-follow-ups/lead-follow-ups.service';
import { MessageTemplatesService } from '../message-templates/message-templates.service';
import type { UpdateLeadReactivationSettingsDto } from './dto/lead-reactivation-settings.dto';

const DEFAULT_SETTINGS = {
  enabled: false,
  idleDays: 30,
  maxAttempts: 3,
  channel: 'WHATSAPP' as ReactivationChannel,
  templateId: null as string | null,
};

export type LeadReactivationJobResult = {
  tenants: number;
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
};

@Injectable()
export class LeadReactivationService {
  private readonly log = new Logger(LeadReactivationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: MessageTemplatesService,
    private readonly activityEngine: ActivityEngineService,
    private readonly followUps: LeadFollowUpsService,
    private readonly communications: CommunicationsService,
  ) {}

  async getSettings(tenantId: string) {
    const existing = await this.prisma.leadReactivationSetting.findUnique({
      where: { tenantId },
    });
    if (existing) return existing;

    return this.prisma.leadReactivationSetting.create({
      data: { tenantId, ...DEFAULT_SETTINGS },
    });
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateLeadReactivationSettingsDto,
  ) {
    const current = await this.getSettings(tenantId);
    const updated = await this.prisma.leadReactivationSetting.upsert({
      where: { tenantId },
      create: {
        tenantId,
        enabled: dto.enabled ?? DEFAULT_SETTINGS.enabled,
        idleDays: dto.idleDays ?? DEFAULT_SETTINGS.idleDays,
        maxAttempts: dto.maxAttempts ?? DEFAULT_SETTINGS.maxAttempts,
        channel: dto.channel ?? DEFAULT_SETTINGS.channel,
        templateId: dto.templateId ?? null,
      },
      update: {
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.idleDays !== undefined ? { idleDays: dto.idleDays } : {}),
        ...(dto.maxAttempts !== undefined
          ? { maxAttempts: dto.maxAttempts }
          : {}),
        ...(dto.channel !== undefined ? { channel: dto.channel } : {}),
        ...(dto.templateId !== undefined ? { templateId: dto.templateId } : {}),
      },
    });

    if (updated.enabled && (!current.enabled || dto.idleDays !== undefined)) {
      await this.schedulePendingLostLeads(tenantId, updated.idleDays);
    }

    return updated;
  }

  async getMetrics(tenantId: string) {
    const [sentLogs, distinctLeads, returned, converted, revenue] =
      await Promise.all([
        this.prisma.leadReactivationLog.count({
          where: { tenantId, status: 'sent' },
        }),
        this.prisma.leadReactivationLog.findMany({
          where: { tenantId, status: 'sent' },
          distinct: ['leadId'],
          select: { leadId: true },
        }),
        this.prisma.lead.count({
          where: {
            tenantId,
            lastReactivatedAt: { not: null },
            status: { not: 'lost' },
          },
        }),
        this.prisma.lead.count({
          where: {
            tenantId,
            lastReactivatedAt: { not: null },
            status: 'converted',
          },
        }),
        this.prisma.deal.aggregate({
          where: {
            tenantId,
            status: 'won',
            convertedLead: { lastReactivatedAt: { not: null } },
          },
          _sum: { value: true },
        }),
      ]);

    const reactivated = distinctLeads.length;
    const returnRate = reactivated === 0 ? 0 : roundRate(returned / reactivated);
    const conversionRate =
      reactivated === 0 ? 0 : roundRate(converted / reactivated);

    return {
      leadsReactivated: reactivated,
      messagesSent: sentLogs,
      returnedLeads: returned,
      convertedLeads: converted,
      returnRate,
      conversionRate,
      revenueFromReactivation: Number(revenue._sum.value ?? 0),
    };
  }

  async runDailyJob(): Promise<LeadReactivationJobResult> {
    const result: LeadReactivationJobResult = {
      tenants: 0,
      processed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    const settings = await this.prisma.leadReactivationSetting.findMany({
      where: { enabled: true },
    });
    result.tenants = settings.length;

    for (const tenantSettings of settings) {
      const batch = await this.processTenant(tenantSettings.tenantId);
      result.processed += batch.processed;
      result.sent += batch.sent;
      result.skipped += batch.skipped;
      result.failed += batch.failed;
    }

    return result;
  }

  async processTenant(tenantId: string) {
    const settings = await this.getSettings(tenantId);
    const summary = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    if (!settings.enabled) return summary;

    const now = new Date();
    const leads = await this.prisma.lead.findMany({
      where: {
        tenantId,
        status: 'lost',
        reactivationEnabled: true,
        nextReactivationAt: { lte: now },
        reactivationAttempts: { lt: settings.maxAttempts },
      },
      include: {
        ownerUser: { select: { id: true, name: true } },
        businessUnit: { select: { name: true } },
      },
      take: 200,
    });

    for (const lead of leads) {
      summary.processed += 1;
      const eligible = isLeadEligibleForReactivation({
        status: lead.status,
        reactivationEnabled: lead.reactivationEnabled,
        nextReactivationAt: lead.nextReactivationAt,
        reactivationAttempts: lead.reactivationAttempts,
        maxAttempts: settings.maxAttempts,
        now,
      });
      if (!eligible) {
        summary.skipped += 1;
        continue;
      }

      try {
        await this.dispatchReactivation(lead, settings, now);
        summary.sent += 1;
      } catch (error) {
        summary.failed += 1;
        this.log.error(
          `Falha ao reativar lead ${lead.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return summary;
  }

  private async dispatchReactivation(
    lead: {
      id: string;
      tenantId: string;
      name: string;
      email: string | null;
      phone: string | null;
      company: string | null;
      assignedTo: string | null;
      ownerUserId: string | null;
      ownerUser: { id: string; name: string } | null;
      businessUnit: { name: string } | null;
      interestCategories: string[];
      reactivationAttempts: number;
    },
    settings: {
      idleDays: number;
      channel: ReactivationChannel;
      templateId: string | null;
    },
    now: Date,
  ) {
    const channels = resolveDispatchChannels(settings.channel);
    const idleDays = leadIdleDays(settings.idleDays);
    const interesse = firstInterestLabel(lead.interestCategories);
    const corretor = lead.ownerUser?.name || lead.assignedTo || 'seu consultor';
    const empresa = lead.businessUnit?.name || lead.company || 'nossa equipe';
    const performerId = await this.resolvePerformerId(
      lead.tenantId,
      lead.ownerUserId ?? lead.ownerUser?.id,
    );

    let sentAny = false;

    for (const channel of channels) {
      const template = settings.templateId
        ? await this.prisma.messageTemplate.findFirst({
            where: {
              id: settings.templateId,
              tenantId: lead.tenantId,
              active: true,
            },
          })
        : await this.templates.findActiveForChannel(
            lead.tenantId,
            channel,
            'reactivation',
          );

      const content = renderMessageTemplate(
        template?.content ?? defaultReactivationContent(),
        {
          nome: lead.name,
          interesse,
          empresa,
          corretor,
        },
      );

      const to = await this.communications.resolveRecipient({
        channel,
        phone: lead.phone,
        email: lead.email,
      });
      const dispatch = await this.communications.dispatch({
        tenantId: lead.tenantId,
        channel,
        purpose: 'REACTIVATION',
        content,
        to,
        leadId: lead.id,
        templateId: template?.id ?? null,
        performedById: performerId,
        metadata: {
          attempt: lead.reactivationAttempts + 1,
          source: 'lead_reactivation',
        },
      });

      if (dispatch.status !== 'sent') {
        continue;
      }

      await this.prisma.leadReactivationLog.create({
        data: {
          tenantId: lead.tenantId,
          leadId: lead.id,
          channel,
          templateId: template?.id ?? null,
          content,
          attemptNumber: lead.reactivationAttempts + 1,
          status: 'sent',
          sentAt: now,
        },
      });

      if (performerId) {
        const retry = lead.reactivationAttempts > 0;
        await this.activityEngine.publish({
          tenantId: lead.tenantId,
          performedById: performerId,
          operationalEventKind: retry ? 'reactivation_retry' : 'lead_reactivated',
          subject: retry
            ? `Nova tentativa de reativação — ${lead.name}`
            : `Reativação automática — ${lead.name}`,
          description: content,
          occurredAt: now,
          leadId: lead.id,
          metadata: {
            channel,
            templateId: template?.id ?? null,
            attempt: lead.reactivationAttempts + 1,
            communicationId: dispatch.id,
            provider: dispatch.provider,
          },
        });
      }

      sentAny = true;
    }

    if (!sentAny) return;

    const patch = buildNextAttemptPatch({
      now,
      currentAttempts: lead.reactivationAttempts,
      idleDays,
    });

    await this.prisma.lead.update({
      where: { id: lead.id },
      data: patch,
    });

    if (performerId) {
      await this.followUps.scheduleAfterReactivation({
        tenantId: lead.tenantId,
        leadId: lead.id,
        performerId,
      });
    }
  }

  private async schedulePendingLostLeads(tenantId: string, idleDays: number) {
    const lost = await this.prisma.lead.findMany({
      where: {
        tenantId,
        status: 'lost',
        reactivationEnabled: true,
        nextReactivationAt: null,
      },
      select: { id: true, lostAt: true, updatedAt: true },
    });

    for (const lead of lost) {
      const from = lead.lostAt ?? lead.updatedAt;
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: {
          nextReactivationAt: addUtcDays(from, idleDays),
          reactivationDays: idleDays,
        },
      });
    }
  }

  private async resolvePerformerId(
    tenantId: string,
    ownerUserId?: string | null,
  ) {
    if (ownerUserId) return ownerUserId;
    const user = await this.prisma.user.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return user?.id ?? null;
  }
}

function resolveDispatchChannels(
  channel: ReactivationChannel,
): MessageChannel[] {
  if (channel === 'BOTH') return ['WHATSAPP', 'EMAIL'];
  return [channel];
}

function leadIdleDays(settingsDays: number) {
  return Math.max(1, settingsDays);
}

function firstInterestLabel(categories: string[]) {
  const first = categories[0];
  if (first && first in INTEREST_CATEGORY_LABELS) {
    return INTEREST_CATEGORY_LABELS[first as InterestCategory];
  }
  return first || 'sua oportunidade';
}

function defaultReactivationContent() {
  return 'Olá {{nome}}. Há algum tempo conversamos sobre {{interesse}}. Gostaria de verificar se ainda possui interesse. Posso ajudar?';
}

function roundRate(value: number) {
  return Math.round(value * 1000) / 10;
}
