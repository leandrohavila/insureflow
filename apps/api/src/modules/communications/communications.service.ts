import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  CommunicationProviderKind,
  CommunicationPurpose,
  CommunicationStatus,
  MessageChannel,
} from '../../common/constants/interest-categories';
import { interestCategoryLabel } from '../../common/constants/interest-categories';
import {
  renderMessageTemplate,
  type MessageTemplateVariables,
} from '../../common/utils/message-template-render.util';
import { andWhere, type BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { MessageTemplatesService } from '../message-templates/message-templates.service';
import type {
  CommunicationsDashboardQueryDto,
  ListCommunicationsQueryDto,
  RecordCommunicationReplyDto,
  SendCommunicationDto,
  UpdateCommunicationProviderDto,
} from './dto/communication.dto';
import { CommunicationProviderRegistry } from './providers/communication-provider.registry';
import { EvolutionCommunicationProvider } from './providers/evolution.provider';
import {
  isEvolutionConfigured,
  mergeEvolutionSettings,
  parseEvolutionSettings,
  phoneMatchCandidates,
  publicEvolutionSettings,
} from './providers/evolution-settings.util';
import {
  parseEvolutionWebhook,
  shouldAdvanceStatus,
  statusActivityKind,
} from './providers/evolution-webhook.util';

export type DispatchCommunicationInput = {
  tenantId: string;
  channel: MessageChannel;
  purpose: CommunicationPurpose;
  content: string;
  to?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  templateId?: string | null;
  performedById?: string | null;
  metadata?: Record<string, unknown>;
};

const SENT_STATUSES: CommunicationStatus[] = [
  'sent',
  'delivered',
  'read',
  'replied',
];
const DELIVERED_STATUSES: CommunicationStatus[] = [
  'delivered',
  'read',
  'replied',
];
const READ_STATUSES: CommunicationStatus[] = ['read', 'replied'];

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: CommunicationProviderRegistry,
    private readonly activityEngine: ActivityEngineService,
    private readonly templates: MessageTemplatesService,
    @Optional() private readonly evolution?: EvolutionCommunicationProvider,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async getProviderConfig(tenantId: string) {
    const existing = await this.prisma.communicationProviderConfig.findUnique({
      where: { tenantId },
    });
    const config =
      existing ??
      (await this.prisma.communicationProviderConfig.create({
        data: { tenantId, kind: 'INTERNAL', enabled: true },
      }));
    const settings = parseEvolutionSettings(config.settings);
    return this.serializeProviderConfig(config, settings);
  }

  async updateProviderConfig(
    tenantId: string,
    dto: UpdateCommunicationProviderDto,
  ) {
    await this.getProviderConfig(tenantId);
    const current = await this.prisma.communicationProviderConfig.findUnique({
      where: { tenantId },
    });
    const settings = mergeEvolutionSettings(current?.settings, {
      ...(dto.instanceName !== undefined
        ? { instanceName: dto.instanceName }
        : {}),
      ...(dto.apiUrl !== undefined ? { apiUrl: dto.apiUrl } : {}),
      ...(dto.apiKey !== undefined ? { apiKey: dto.apiKey } : {}),
    });
    const kind =
      dto.kind ??
      (isEvolutionConfigured(settings) ? 'EVOLUTION' : current?.kind ?? 'INTERNAL');
    const updated = await this.prisma.communicationProviderConfig.update({
      where: { tenantId },
      data: {
        kind,
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        settings: settings as Prisma.InputJsonValue,
      },
    });
    return this.serializeProviderConfig(updated, settings);
  }

  async connectEvolution(tenantId: string) {
    await this.updateProviderConfig(tenantId, { kind: 'EVOLUTION', enabled: true });
    if (!this.evolution) {
      return {
        ok: false,
        status: 'disconnected' as const,
        message: 'EvolutionProvider indisponível',
        qr: { base64: null as string | null },
      };
    }
    const result = await this.evolution.connect(tenantId);
    return {
      ...result.health,
      qr: result.qr,
      provider: await this.getProviderConfig(tenantId),
    };
  }

  async reconnectEvolution(tenantId: string) {
    if (!this.evolution) {
      return this.connectEvolution(tenantId);
    }
    await this.updateProviderConfig(tenantId, { kind: 'EVOLUTION', enabled: true });
    const result = await this.evolution.reconnect(tenantId);
    return {
      ...result.health,
      qr: result.qr,
      provider: await this.getProviderConfig(tenantId),
    };
  }

  async disconnectEvolution(tenantId: string) {
    const health = this.evolution
      ? await this.evolution.disconnect(tenantId)
      : { ok: true, status: 'disconnected' as const };
    return {
      ...health,
      provider: await this.getProviderConfig(tenantId),
    };
  }

  async generateEvolutionQr(tenantId: string) {
    if (!this.evolution) {
      return { base64: null, errorMessage: 'EvolutionProvider indisponível' };
    }
    const qr = await this.evolution.generateQrCode(tenantId);
    return {
      ...qr,
      provider: await this.getProviderConfig(tenantId),
    };
  }

  async evolutionHealth(tenantId: string) {
    const health = this.evolution
      ? await this.evolution.healthCheck(tenantId)
      : { ok: false, status: 'disconnected' as const, message: 'Indisponível' };
    return {
      ...health,
      provider: await this.getProviderConfig(tenantId),
    };
  }

  async findAll(
    tenantId: string,
    query: ListCommunicationsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.scopedWhere(tenantId, query, actor);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.communicationLog.count({ where }),
      this.prisma.communicationLog.findMany({
        where,
        include: {
          lead: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          template: { select: { id: true, name: true, kind: true } },
          performedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(tenantId: string, id: string, actor?: BusinessUnitActor) {
    if (this.buAccess) {
      await this.buAccess.assertCommunicationVisible(actor, tenantId, id);
    }
    const log = await this.prisma.communicationLog.findFirst({
      where: { id, tenantId },
      include: {
        lead: { select: { id: true, name: true, dealId: true } },
        customer: { select: { id: true, name: true } },
        template: { select: { id: true, name: true, kind: true } },
      },
    });
    if (!log) {
      throw new NotFoundException('Comunicação não encontrada');
    }
    return log;
  }

  async getDashboard(
    tenantId: string,
    query: CommunicationsDashboardQueryDto = {},
    actor?: BusinessUnitActor,
  ) {
    const where = await this.scopedWhere(tenantId, query, actor);
    const outbound = andWhere(where, { direction: 'OUTBOUND' });

    const [sent, delivered, read, failed, replied, outboundCount, brokers] =
      await Promise.all([
        this.prisma.communicationLog.count({
          where: andWhere(outbound, { status: { in: SENT_STATUSES } }),
        }),
        this.prisma.communicationLog.count({
          where: andWhere(outbound, { status: { in: DELIVERED_STATUSES } }),
        }),
        this.prisma.communicationLog.count({
          where: andWhere(outbound, { status: { in: READ_STATUSES } }),
        }),
        this.prisma.communicationLog.count({
          where: andWhere(where, { status: 'failed' }),
        }),
        this.prisma.communicationLog.count({
          where: andWhere(where, { status: 'replied' }),
        }),
        this.prisma.communicationLog.count({ where: outbound }),
        this.prisma.communicationLog.findMany({
          where: andWhere(outbound, { performedById: { not: null } }),
          distinct: ['performedById'],
          select: {
            performedBy: { select: { id: true, name: true } },
          },
          take: 50,
        }),
      ]);

    const byPurpose = await this.prisma.communicationLog.groupBy({
      by: ['purpose'],
      where: outbound,
      orderBy: { purpose: 'asc' },
      _count: { _all: true },
    });

    const config = await this.getProviderConfig(tenantId);

    return {
      provider: config.kind,
      providerEnabled: config.enabled,
      adapters: config.adapters,
      evolution: config.evolution,
      sent,
      delivered,
      read,
      failed,
      replied,
      outbound: outboundCount,
      replyRate: sent === 0 ? 0 : Math.round((replied / sent) * 1000) / 10,
      failureRate:
        outboundCount === 0
          ? 0
          : Math.round((failed / outboundCount) * 1000) / 10,
      byPurpose: byPurpose.map((row) => ({
        purpose: row.purpose,
        count: row._count._all,
      })),
      brokers: brokers
        .map((row) => row.performedBy)
        .filter((item): item is { id: string; name: string } => Boolean(item)),
    };
  }

  async sendManual(tenantId: string, dto: SendCommunicationDto, actorUserId: string) {
    const resolved = await this.resolveManualContent(tenantId, dto);
    return this.dispatch({
      tenantId,
      channel: dto.channel,
      purpose: dto.purpose,
      content: resolved.content,
      to: resolved.to,
      leadId: dto.leadId,
      customerId: dto.customerId,
      templateId: resolved.templateId,
      performedById: actorUserId,
      metadata: { source: 'manual' },
    });
  }

  async dispatch(input: DispatchCommunicationInput) {
    const config = await this.getProviderConfig(input.tenantId);
    const provider = this.registry.get(config.kind);
    const to = (input.to ?? '').trim();
    const now = new Date();

    if (!config.enabled) {
      return this.persistLog({
        ...input,
        to: to || 'n/a',
        provider: config.kind,
        status: 'failed',
        errorMessage: 'Provider de comunicação desabilitado para o tenant',
        now,
      });
    }

    if (!to) {
      return this.persistLog({
        ...input,
        to: 'n/a',
        provider: provider.kind,
        status: 'failed',
        errorMessage: 'Destinatário ausente (telefone ou e-mail)',
        now,
      });
    }

    const result = await provider.send({
      tenantId: input.tenantId,
      channel: input.channel,
      to,
      content: input.content,
      purpose: input.purpose,
      metadata: input.metadata,
    });

    const log = await this.persistLog({
      ...input,
      to,
      provider: result.provider,
      status: result.status === 'queued' ? 'queued' : result.status,
      externalId: result.externalId,
      messageId: result.messageId ?? result.externalId,
      errorMessage: result.errorMessage,
      now,
    });

    return log;
  }

  async recordReply(
    tenantId: string,
    dto: RecordCommunicationReplyDto,
    communicationId?: string,
    actor?: BusinessUnitActor,
  ) {
    if (communicationId && this.buAccess) {
      await this.buAccess.assertCommunicationVisible(
        actor,
        tenantId,
        communicationId,
      );
    }
    const existing = communicationId
      ? await this.prisma.communicationLog.findFirst({
          where: { id: communicationId, tenantId },
        })
      : await this.findOutboundForReply(tenantId, dto);

    if (!existing) {
      throw new NotFoundException('Comunicação original não encontrada');
    }

    const now = new Date();
    const updated = await this.prisma.communicationLog.update({
      where: { id: existing.id },
      data: {
        status: 'replied',
        replyContent: dto.content.trim(),
        repliedAt: now,
        direction: existing.direction,
      },
    });

    await this.touchLastInteraction(existing.leadId, existing.customerId, now);
    await this.publishStatusActivity({
      tenantId,
      log: {
        id: existing.id,
        leadId: existing.leadId,
        customerId: existing.customerId,
        performedById: existing.performedById,
        purpose: existing.purpose,
        provider: existing.provider,
        channel: existing.channel,
      },
      kind: 'communication_replied',
      description: dto.content.trim(),
    });

    return updated;
  }

  async handleEvolutionWebhook(body: unknown, token?: string | null) {
    const parsed = parseEvolutionWebhook(body);
    if (parsed.type === 'ignored') {
      return { ok: true, ignored: true };
    }
    if (!this.evolution) {
      return { ok: true, ignored: true, reason: 'provider_unavailable' };
    }
    const match = await this.evolution.findTenantIdByInstance(
      parsed.instanceName,
      token,
    );
    if (!match) {
      return { ok: true, ignored: true, reason: 'unknown_instance' };
    }
    const { tenantId } = match;

    if (parsed.type === 'connection') {
      await this.evolution.applyConnectionState(tenantId, parsed.state);
      return { ok: true, type: 'connection', state: parsed.state };
    }

    if (parsed.type === 'status') {
      const log = await this.findLogForStatus(tenantId, parsed.messageId, parsed.from);
      if (!log) return { ok: true, ignored: true, reason: 'log_not_found' };
      await this.applyStatus(log, parsed.status);
      return { ok: true, type: 'status', status: parsed.status, id: log.id };
    }

    const replied = await this.recordInboundMessage(tenantId, {
      from: parsed.from,
      content: parsed.content,
      externalId: parsed.messageId,
    });
    return { ok: true, type: 'inbound', id: replied.id };
  }

  async resolveRecipient(params: {
    channel: MessageChannel;
    phone?: string | null;
    email?: string | null;
  }) {
    return params.channel === 'EMAIL'
      ? params.email?.trim() || null
      : params.phone?.trim() || null;
  }

  templateKindForPurpose(purpose: CommunicationPurpose) {
    if (purpose === 'REACTIVATION') return 'reactivation';
    return purpose;
  }

  render(
    content: string,
    variables: MessageTemplateVariables,
  ) {
    return renderMessageTemplate(content, variables);
  }

  private async applyStatus(
    log: {
      id: string;
      tenantId: string;
      status: CommunicationStatus;
      leadId: string | null;
      customerId: string | null;
      performedById: string | null;
      purpose: CommunicationPurpose;
      provider: CommunicationProviderKind;
      channel: MessageChannel;
      content: string;
    },
    next: CommunicationStatus,
  ) {
    if (!shouldAdvanceStatus(log.status, next)) {
      return log;
    }
    const now = new Date();
    const updated = await this.prisma.communicationLog.update({
      where: { id: log.id },
      data: {
        status: next,
        ...(next === 'sent' ? { sentAt: log.status === 'queued' ? now : undefined } : {}),
        ...(next === 'delivered' ? { deliveredAt: now } : {}),
        ...(next === 'read' ? { readAt: now, deliveredAt: now } : {}),
        ...(next === 'failed' ? { errorMessage: 'Falha reportada pela Evolution' } : {}),
      },
    });
    const kind = statusActivityKind(next);
    if (kind && kind !== 'communication_sent') {
      await this.publishStatusActivity({
        tenantId: log.tenantId,
        log,
        kind,
        description: log.content,
      });
    }
    return updated;
  }

  private async recordInboundMessage(
    tenantId: string,
    dto: { from: string; content: string; externalId?: string | null },
  ) {
    try {
      return await this.recordReply(tenantId, {
        content: dto.content,
        from: dto.from,
        externalId: dto.externalId ?? undefined,
      });
    } catch {
      const related = await this.matchLeadOrCustomer(tenantId, dto.from);
      const now = new Date();
      const log = await this.prisma.communicationLog.create({
        data: {
          tenantId,
          provider: 'EVOLUTION',
          channel: 'WHATSAPP',
          direction: 'INBOUND',
          purpose: 'MANUAL',
          status: 'replied',
          leadId: related.leadId,
          customerId: related.customerId,
          to: dto.from,
          content: dto.content,
          replyContent: dto.content,
          externalId: dto.externalId ?? null,
          messageId: dto.externalId ?? null,
          repliedAt: now,
          metadata: { source: 'evolution_inbound' } as Prisma.InputJsonValue,
        },
      });
      await this.touchLastInteraction(related.leadId, related.customerId, now);
      await this.publishStatusActivity({
        tenantId,
        log: {
          id: log.id,
          leadId: related.leadId,
          customerId: related.customerId,
          performedById: related.ownerUserId,
          purpose: 'MANUAL',
          provider: 'EVOLUTION',
          channel: 'WHATSAPP',
        },
        kind: 'communication_replied',
        description: dto.content,
        dealId: related.dealId,
      });
      return log;
    }
  }

  private async findOutboundForReply(
    tenantId: string,
    dto: RecordCommunicationReplyDto,
  ) {
    if (dto.externalId) {
      const byExternal = await this.prisma.communicationLog.findFirst({
        where: {
          tenantId,
          OR: [{ externalId: dto.externalId }, { messageId: dto.externalId }],
        },
        orderBy: { createdAt: 'desc' },
      });
      if (byExternal) return byExternal;
    }
    if (!dto.from) return null;
    const candidates = phoneMatchCandidates(dto.from);
    return this.prisma.communicationLog.findFirst({
      where: {
        tenantId,
        direction: 'OUTBOUND',
        OR: candidates.map((item) => ({ to: { contains: item } })),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findLogForStatus(
    tenantId: string,
    messageId: string | null,
    from: string | null,
  ) {
    if (messageId) {
      const byId = await this.prisma.communicationLog.findFirst({
        where: {
          tenantId,
          OR: [{ messageId }, { externalId: messageId }],
        },
        orderBy: { createdAt: 'desc' },
      });
      if (byId) return byId;
    }
    if (!from) return null;
    const candidates = phoneMatchCandidates(from);
    return this.prisma.communicationLog.findFirst({
      where: {
        tenantId,
        direction: 'OUTBOUND',
        OR: candidates.map((item) => ({ to: { contains: item } })),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async matchLeadOrCustomer(tenantId: string, from: string) {
    const candidates = phoneMatchCandidates(from);
    const phoneFilter = {
      OR: candidates.map((item) => ({ phone: { contains: item } })),
    };
    const lead = await this.prisma.lead.findFirst({
      where: { tenantId, ...phoneFilter },
      select: { id: true, dealId: true, ownerUserId: true },
    });
    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, ...phoneFilter },
      select: { id: true },
    });
    return {
      leadId: lead?.id ?? null,
      customerId: customer?.id ?? null,
      dealId: lead?.dealId ?? null,
      ownerUserId: lead?.ownerUserId ?? null,
    };
  }

  private async touchLastInteraction(
    leadId: string | null,
    _customerId: string | null,
    now: Date,
  ) {
    if (!leadId) return;
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { lastContactAt: now, lastInteractionAt: now },
    });
  }

  private async publishStatusActivity(params: {
    tenantId: string;
    log: {
      id?: string;
      leadId: string | null;
      customerId: string | null;
      performedById: string | null;
      purpose: CommunicationPurpose;
      provider: CommunicationProviderKind;
      channel: MessageChannel;
    };
    kind:
      | 'communication_sent'
      | 'communication_delivered'
      | 'communication_read'
      | 'communication_failed'
      | 'communication_replied';
    description: string;
    dealId?: string | null;
  }) {
    const performerId = await this.resolvePerformerId(
      params.tenantId,
      params.log.performedById,
    );
    if (!performerId) return;
    const dealId =
      params.dealId ??
      (params.log.leadId
        ? (
            await this.prisma.lead.findFirst({
              where: { id: params.log.leadId },
              select: { dealId: true },
            })
          )?.dealId
        : null);
    await this.activityEngine.publish({
      tenantId: params.tenantId,
      performedById: performerId,
      operationalEventKind: params.kind,
      subject: this.activitySubject(params.kind, params.log.purpose),
      description: params.description,
      leadId: params.log.leadId,
      customerId: params.log.customerId,
      dealId,
      metadata: {
        communicationId: params.log.id,
        provider: params.log.provider,
        channel: params.log.channel,
      },
    });
  }

  private activitySubject(
    kind:
      | 'communication_sent'
      | 'communication_delivered'
      | 'communication_read'
      | 'communication_failed'
      | 'communication_replied',
    purpose: CommunicationPurpose,
  ) {
    if (kind === 'communication_failed') return `Falha ao enviar ${purpose}`;
    if (kind === 'communication_delivered') return `Entregue — ${purpose}`;
    if (kind === 'communication_read') return `Lida — ${purpose}`;
    if (kind === 'communication_replied') return `Resposta recebida — ${purpose}`;
    return `Comunicação ${purpose}`;
  }

  private async scopedWhere(
    tenantId: string,
    query: {
      purpose?: CommunicationPurpose;
      status?: CommunicationStatus;
      channel?: MessageChannel;
      provider?: CommunicationProviderKind;
      leadId?: string;
      customerId?: string;
      userId?: string;
      businessUnitId?: string;
      from?: string;
      to?: string;
    },
    actor?: BusinessUnitActor,
  ): Promise<Prisma.CommunicationLogWhereInput> {
    let where: Prisma.CommunicationLogWhereInput = {
      tenantId,
      ...(query.purpose ? { purpose: query.purpose } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
      ...(query.provider ? { provider: query.provider } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.userId ? { performedById: query.userId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.communicationWhere(
        actor,
        query.businessUnitId,
      );
      if (buWhere) where = andWhere(where, buWhere);
    } else if (query.businessUnitId) {
      where = andWhere(where, {
        OR: [
          { lead: { businessUnitId: query.businessUnitId } },
          { customer: { businessUnitId: query.businessUnitId } },
        ],
      });
    }
    return where;
  }

  private serializeProviderConfig(
    config: {
      id: string;
      tenantId: string;
      kind: CommunicationProviderKind;
      enabled: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    settings: ReturnType<typeof parseEvolutionSettings>,
  ) {
    const evolutionReady = isEvolutionConfigured(settings);
    return {
      ...config,
      evolution: publicEvolutionSettings(settings),
      adapters: this.registry.list(evolutionReady),
    };
  }

  private async resolveManualContent(
    tenantId: string,
    dto: SendCommunicationDto,
  ) {
    let templateId = dto.templateId ?? null;
    let content = dto.content?.trim() || '';

    if (!content) {
      const template = dto.templateId
        ? await this.prisma.messageTemplate.findFirst({
            where: { id: dto.templateId, tenantId, active: true },
          })
        : await this.templates.findActiveForChannel(
            tenantId,
            dto.channel,
            this.templateKindForPurpose(dto.purpose),
          );
      content = template?.content ?? 'Olá {{nome}}, podemos retomar o contato?';
      templateId = template?.id ?? null;
    }

    const lead = dto.leadId
      ? await this.prisma.lead.findFirst({
          where: { id: dto.leadId, tenantId },
          include: {
            ownerUser: { select: { name: true } },
            businessUnit: { select: { name: true } },
          },
        })
      : null;
    const customer = dto.customerId
      ? await this.prisma.customer.findFirst({
          where: { id: dto.customerId, tenantId },
        })
      : null;

    const rendered = this.render(content, {
      nome: lead?.name ?? customer?.name,
      interesse: interestCategoryLabel(lead?.interestCategories[0] ?? customer?.interestCategories[0]),
      empresa: lead?.businessUnit?.name ?? customer?.companyName,
      corretor: lead?.ownerUser?.name ?? lead?.assignedTo,
    });

    const to = await this.resolveRecipient({
      channel: dto.channel,
      phone: lead?.phone ?? customer?.phone,
      email: lead?.email ?? customer?.email,
    });

    return { content: rendered, to, templateId };
  }

  private async persistLog(params: DispatchCommunicationInput & {
    provider: CommunicationProviderKind;
    status: 'queued' | 'sent' | 'failed';
    externalId?: string | null;
    messageId?: string | null;
    errorMessage?: string;
    now: Date;
  }) {
    const log = await this.prisma.communicationLog.create({
      data: {
        tenantId: params.tenantId,
        provider: params.provider,
        channel: params.channel,
        direction: 'OUTBOUND',
        purpose: params.purpose,
        status: params.status,
        leadId: params.leadId ?? null,
        customerId: params.customerId ?? null,
        templateId: params.templateId ?? null,
        performedById: params.performedById ?? null,
        to: params.to ?? 'n/a',
        content: params.content,
        externalId: params.externalId ?? null,
        messageId: params.messageId ?? params.externalId ?? null,
        errorMessage: params.errorMessage ?? null,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        sentAt: params.status === 'sent' ? params.now : null,
      },
    });

    const performerId = await this.resolvePerformerId(
      params.tenantId,
      params.performedById,
    );
    if (performerId) {
      await this.activityEngine.publish({
        tenantId: params.tenantId,
        performedById: performerId,
        operationalEventKind:
          params.status === 'failed' ? 'communication_failed' : 'communication_sent',
        subject:
          params.status === 'failed'
            ? `Falha ao enviar ${params.purpose}`
            : `Comunicação ${params.purpose} — ${params.channel}`,
        description: params.content,
        leadId: params.leadId,
        customerId: params.customerId,
        metadata: {
          communicationId: log.id,
          provider: params.provider,
          channel: params.channel,
          purpose: params.purpose,
          status: params.status,
          messageId: params.messageId ?? null,
          ...(params.metadata ?? {}),
        },
      });
    }

    return log;
  }

  private async resolvePerformerId(
    tenantId: string,
    preferred?: string | null,
  ) {
    if (preferred) return preferred;
    const user = await this.prisma.user.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return user?.id ?? null;
  }
}
