import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { performance } from 'node:perf_hooks';

import {
  inferDocumentTypeFromDigits,
  isCompleteDocumentForLookup,
  normalizeDocument,
  stripDocumentDigits,
  type LeadDocumentType,
} from '../../common/utils/document.util';
import {
  buildDraftQuestionnaireWarning,
  deriveQuestionnaireCommercialStatus,
} from '../../common/utils/questionnaire-commercial.util';
import { nextPipelineOrder } from '../../common/utils/pipeline-order.util';
import {
  resolveAssignedToLabel,
  resolveAssignedToLabelForUserId,
  resolveOwnerUserIdFromAssignedTo,
} from '../../common/utils/owner-assignment.util';
import { buildLostReactivationPatch } from '../../common/utils/lead-reactivation.util';
import { applyLossReasonToReactivation } from '../../common/utils/commercial-recovery.util';
import {
  resolveBusinessUnitIds,
  syncLeadBusinessUnits,
} from '../../common/utils/business-unit-membership.util';
import { andWhere } from '../../common/utils/business-unit-acl.util';
import { OwnershipService } from '../access/ownership.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type { LeadAccessActor } from '../access/ownership.types';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { BusinessUnitsService } from '../business-units/business-units.service';
import { LeadFollowUpsService } from '../lead-follow-ups/lead-follow-ups.service';
import { LeadLossReasonsService } from '../lead-loss-reasons/lead-loss-reasons.service';
import {
  resolveLeadLastInteractionAt,
  safeMaxOccurredAtByLeadIds,
  serializeLeadRecord,
  leadOwnerInclude,
} from './lead-last-interaction.util';
import { logLeadQuery, logLeadSerialize } from './lead-runtime.util';
import type {
  ConvertLeadDto,
  CreateLeadDto,
  FindLeadDuplicatesQueryDto,
  ListLeadsQueryDto,
  UpdateLeadDto,
} from './dto/lead.dto';

export type LeadActor = LeadAccessActor;

type SerializedLead = ReturnType<typeof serializeLeadRecord>;

type CreateLeadOptions = {
  idempotencyKey?: string;
};

type ListLeadsOptions = {
  traceId?: string;
};

type LeadCreateRequestEntry = {
  promise: Promise<SerializedLead>;
  expiresAt: number;
};

const LEAD_CREATE_IDEMPOTENCY_TTL_MS = 60_000;
const leadCreateRequests = new Map<string, LeadCreateRequestEntry>();

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly activityEngine: ActivityEngineService,
    private readonly businessUnits: BusinessUnitsService,
    private readonly followUps: LeadFollowUpsService,
    private readonly lossReasons: LeadLossReasonsService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async findLeads(
    tenantId: string,
    query: ListLeadsQueryDto,
    actor?: LeadActor,
    options: ListLeadsOptions = {},
  ) {
    const traceId = options.traceId?.trim() || 'lead-list';
    const serviceStartedAt = performance.now();
    console.info('[BUG010.2][api] Service findLeads início', {
      traceId,
      tenantId,
      query,
    });
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const paginationStartedAt = performance.now();
    const where = await this.buildLeadWhere(tenantId, query, actor);
    console.info('[BUG010.2][api] paginação/filtros where', {
      traceId,
      paginationMs: Number(
        (performance.now() - paginationStartedAt).toFixed(2),
      ),
      page,
      limit,
    });
    logLeadQuery('findLeads', { tenantId, page, limit, mine: query.mine });

    const calculationsStartedAt = performance.now();
    const whereWithoutStatus = await this.buildLeadWhere(
      tenantId,
      { ...query, status: undefined },
      actor,
    );
    console.info('[BUG010.2][api] cálculos filtros agregados', {
      traceId,
      calculationsMs: Number(
        (performance.now() - calculationsStartedAt).toFixed(2),
      ),
    });

    const prismaStartedAt = performance.now();
    console.info('[BUG010.2][prisma] transaction leads list start', {
      traceId,
      limit,
    });
    const [total, leads, converted, qualified] = await this.prisma.$transaction(
      [
        this.prisma.lead.count({ where }),
        this.prisma.lead.findMany({
          where,
          include: leadOwnerInclude,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.lead.count({
          where: { ...whereWithoutStatus, status: 'converted' },
        }),
        this.prisma.lead.count({
          where: { ...whereWithoutStatus, status: 'qualified' },
        }),
      ],
    );
    console.info('[BUG010.2][prisma] transaction leads list end', {
      traceId,
      prismaTransactionMs: Number(
        (performance.now() - prismaStartedAt).toFixed(2),
      ),
      rows: leads.length,
      total,
    });

    const relationshipsStartedAt = performance.now();
    console.info('[BUG010.2][api] relacionamentos owner include', {
      traceId,
      relationshipsMs: Number(
        (performance.now() - relationshipsStartedAt).toFixed(2),
      ),
      note: 'ownerUser carregado no findMany principal',
    });

    const leadIds = leads.map((lead) => lead.id);
    const lastActivityStartedAt = performance.now();
    const activityByLeadId = await safeMaxOccurredAtByLeadIds(
      this.prisma,
      tenantId,
      leadIds,
    );
    console.info('[BUG010.2][api] última atividade enrich', {
      traceId,
      lastActivityMs: Number(
        (performance.now() - lastActivityStartedAt).toFixed(2),
      ),
      leadCount: leadIds.length,
      hits: activityByLeadId.size,
    });

    const questionnaireStartedAt = performance.now();
    console.info('[BUG010.2][api] questionários', {
      traceId,
      questionnaireMs: Number(
        (performance.now() - questionnaireStartedAt).toFixed(2),
      ),
      note: 'listagem de leads não consulta questionários',
    });

    const commercialScoreStartedAt = performance.now();
    console.info('[BUG010.2][api] commercial score', {
      traceId,
      commercialScoreMs: Number(
        (performance.now() - commercialScoreStartedAt).toFixed(2),
      ),
      note: 'listagem de leads não calcula score comercial',
    });

    const mapStartedAt = performance.now();
    const data = leads.map((lead) =>
      serializeLeadRecord({
        ...lead,
        lastInteractionAt: resolveLeadLastInteractionAt(
          activityByLeadId.get(lead.id),
          lead.lastContactAt,
        ),
      }),
    );
    console.info('[BUG010.2][api] DTO mapping', {
      traceId,
      mapDtoMs: Number((performance.now() - mapStartedAt).toFixed(2)),
      rows: data.length,
    });
    logLeadSerialize('findLeads', { count: data.length });

    const metaStartedAt = performance.now();
    const meta = {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts: {
        converted,
        qualified,
      },
    };
    console.info('[BUG010.2][api] cálculos meta/paginação', {
      traceId,
      metaMs: Number((performance.now() - metaStartedAt).toFixed(2)),
      totalPages: meta.totalPages,
    });
    console.info('[BUG010.2][api] Service findLeads fim', {
      traceId,
      serviceMs: Number((performance.now() - serviceStartedAt).toFixed(2)),
    });

    return {
      data,
      meta,
    };
  }

  async findLead(tenantId: string, id: string, actor?: LeadActor) {
    await this.assertLeadAccess(tenantId, id, actor);

    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: leadOwnerInclude,
    });
    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }

    const activityByLeadId = await safeMaxOccurredAtByLeadIds(
      this.prisma,
      tenantId,
      [id],
    );

    return serializeLeadRecord({
      ...lead,
      lastInteractionAt: resolveLeadLastInteractionAt(
        activityByLeadId.get(id),
        lead.lastContactAt,
      ),
    });
  }

  async findLeadContext(tenantId: string, id: string, actor?: LeadActor) {
    await this.assertLeadAccess(tenantId, id, actor);

    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            company: true,
            value: true,
            stage: true,
            status: true,
            assignedTo: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        questionnaireSubmissions: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            updatedAt: true,
            submittedAt: true,
            templateId: true,
            dealId: true,
            template: { select: { id: true, name: true, version: true } },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }

    const { questionnaireSubmissions, deal, ...leadCore } = lead;
    const draftCount = questionnaireSubmissions.filter(
      (item) => item.status === 'draft',
    ).length;
    const latestDerived = deriveQuestionnaireCommercialStatus(
      questionnaireSubmissions,
    );
    const latestSubmission =
      questionnaireSubmissions.find(
        (item) => item.id === latestDerived.submissionId,
      ) ?? null;

    const lastSubmissionAt =
      questionnaireSubmissions[0]?.updatedAt?.toISOString() ?? null;

    return {
      lead: leadCore,
      deal: deal ? { ...deal, value: deal.value.toNumber() } : null,
      submissions: questionnaireSubmissions,
      latestSubmission,
      warnings: buildDraftQuestionnaireWarning(draftCount > 0),
      timelineSummary: {
        leadUpdatedAt: leadCore.updatedAt.toISOString(),
        lastContactAt: leadCore.lastContactAt?.toISOString() ?? null,
        dealUpdatedAt: deal?.updatedAt?.toISOString() ?? null,
        lastSubmissionAt,
        submissionCount: questionnaireSubmissions.length,
        draftCount,
      },
    };
  }

  async findDuplicates(tenantId: string, query: FindLeadDuplicatesQueryDto) {
    const digits = stripDocumentDigits(query.document);
    if (!isCompleteDocumentForLookup(digits)) {
      return { data: [] as const };
    }

    const leads = await this.prisma.lead.findMany({
      where: {
        tenantId,
        document: digits,
        ...(query.excludeId ? { id: { not: query.excludeId } } : {}),
      },
      orderBy: [{ lastContactAt: 'desc' }, { updatedAt: 'desc' }],
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        assignedTo: true,
        lastContactAt: true,
        createdAt: true,
        documentType: true,
        document: true,
      },
    });

    return {
      data: leads.map((item) => ({
        ...item,
        lastContactAt: item.lastContactAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  async createLead(
    tenantId: string,
    dto: CreateLeadDto,
    actor?: LeadActor,
    options: CreateLeadOptions = {},
  ) {
    const traceId = options.idempotencyKey?.trim() || 'lead-create';
    const serviceStartedAt = performance.now();
    console.info('[BUG010][api] Service createLead start', {
      traceId,
      tenantId,
    });
    const dedupeKey = this.buildCreateLeadDedupeKey(
      tenantId,
      dto,
      actor,
      options.idempotencyKey,
    );

    if (!dedupeKey) {
      const lead = await this.createLeadRecord(tenantId, dto, actor, traceId);
      console.info('[BUG010][api] Service createLead end', {
        traceId,
        serviceMs: Number((performance.now() - serviceStartedAt).toFixed(2)),
      });
      return lead;
    }

    this.pruneLeadCreateRequests();
    const existing = leadCreateRequests.get(dedupeKey);
    if (existing && existing.expiresAt > Date.now()) {
      console.info('[BUG010][api] Service idempotency hit', {
        traceId,
        serviceMs: Number((performance.now() - serviceStartedAt).toFixed(2)),
      });
      return existing.promise;
    }

    const hasExplicitIdempotencyKey = Boolean(options.idempotencyKey?.trim());
    const promise = this.createLeadRecord(tenantId, dto, actor, traceId);
    leadCreateRequests.set(dedupeKey, {
      promise,
      expiresAt: hasExplicitIdempotencyKey
        ? Date.now() + LEAD_CREATE_IDEMPOTENCY_TTL_MS
        : Number.POSITIVE_INFINITY,
    });

    try {
      const lead = await promise;
      console.info('[BUG010][api] Service createLead end', {
        traceId,
        serviceMs: Number((performance.now() - serviceStartedAt).toFixed(2)),
      });
      if (hasExplicitIdempotencyKey) {
        leadCreateRequests.set(dedupeKey, {
          promise: Promise.resolve(lead),
          expiresAt: Date.now() + LEAD_CREATE_IDEMPOTENCY_TTL_MS,
        });
      }
      return lead;
    } catch (error) {
      console.info('[BUG010][api] Service createLead error', {
        traceId,
        serviceMs: Number((performance.now() - serviceStartedAt).toFixed(2)),
      });
      leadCreateRequests.delete(dedupeKey);
      throw error;
    } finally {
      if (!hasExplicitIdempotencyKey) {
        leadCreateRequests.delete(dedupeKey);
      }
    }
  }

  private async createLeadRecord(
    tenantId: string,
    dto: CreateLeadDto,
    actor?: LeadActor,
    traceId = 'lead-create',
  ) {
    const ownerFields = actor
      ? await this.resolveOwnerFieldsForCreate(tenantId, actor)
      : {
          ownerUserId: null as string | null,
          ownerTeamId: null as string | null,
        };

    let ownerUserId = ownerFields.ownerUserId;
    const ownerTeamId = ownerFields.ownerTeamId;
    let assignedTo: string | undefined;

    if (dto.assignedTo?.trim()) {
      assignedTo = dto.assignedTo.trim();
      const resolvedOwner = await resolveOwnerUserIdFromAssignedTo(
        this.prisma,
        tenantId,
        assignedTo,
      );
      if (resolvedOwner) {
        ownerUserId = resolvedOwner;
        assignedTo =
          (await resolveAssignedToLabelForUserId(
            this.prisma,
            tenantId,
            resolvedOwner,
          )) ?? assignedTo;
      }
    } else if (ownerUserId) {
      assignedTo = await resolveAssignedToLabelForUserId(
        this.prisma,
        tenantId,
        ownerUserId,
      );
    }

    const documentFields = this.resolveDocumentFields(
      dto.documentType,
      dto.document,
    );
    const now = new Date();
    const units = await this.resolveRequestedUnits(tenantId, dto);

    console.info('[BUG010][prisma] transaction', {
      traceId,
      transactionMs: 0,
      note: 'createLead não usa transaction explícita',
    });
    const insertStartedAt = performance.now();
    console.info('[BUG010][prisma] INSERT lead start', { traceId });
    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        source: dto.source,
        status: dto.status ?? 'new',
        notes: dto.notes,
        assignedTo,
        ownerUserId,
        ownerTeamId,
        lastContactAt: now,
        lastInteractionAt: now,
        businessUnitId: units.originId,
        interestCategories: dto.interestCategories ?? [],
        lostReason: dto.lostReason,
        reactivationEnabled: dto.reactivationEnabled ?? true,
        reactivationDays: dto.reactivationDays,
        ...(dto.lossReasonId ? { lossReasonId: dto.lossReasonId } : {}),
        ...(units.unitIds.length
          ? {
              businessUnits: {
                create: units.unitIds.map((businessUnitId) => ({
                  businessUnitId,
                  isOrigin: businessUnitId === units.originId,
                })),
              },
            }
          : {}),
        ...documentFields,
      },
      include: leadOwnerInclude,
    });
    console.info('[BUG010][prisma] INSERT lead end', {
      traceId,
      insertMs: Number((performance.now() - insertStartedAt).toFixed(2)),
    });
    logLeadSerialize('createLead', { id: lead.id });
    if (dto.followUpDays && actor?.userId) {
      await this.followUps.scheduleOnLeadCreate({
        tenantId,
        leadId: lead.id,
        actorUserId: actor.userId,
        days: dto.followUpDays,
        type: this.followUps.isFollowUpType(dto.followUpType)
          ? dto.followUpType
          : 'WHATSAPP',
      });
    }
    return serializeLeadRecord({
      ...lead,
      lastInteractionAt: resolveLeadLastInteractionAt(
        undefined,
        lead.lastContactAt,
      ),
    });
  }

  async updateLead(
    tenantId: string,
    id: string,
    dto: UpdateLeadDto,
    actor?: LeadActor,
  ) {
    await this.assertLeadAccess(tenantId, id, actor);

    const documentPatch = this.buildDocumentPatch(dto);
    const now = new Date();

    const existing = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      select: {
        ownerUserId: true,
        status: true,
        businessUnitId: true,
        businessUnits: { select: { businessUnitId: true } },
      },
    });

    let assignedToPatch: string | undefined | null;
    let ownerUserIdPatch: string | null | undefined;

    if (dto.assignedTo !== undefined) {
      const label =
        dto.assignedTo?.trim() ||
        (actor?.userId
          ? await resolveAssignedToLabelForUserId(
              this.prisma,
              tenantId,
              actor.userId,
            )
          : undefined);
      assignedToPatch = label ?? null;
      if (label) {
        ownerUserIdPatch =
          (await resolveOwnerUserIdFromAssignedTo(
            this.prisma,
            tenantId,
            label,
          )) ??
          existing?.ownerUserId ??
          null;
      } else {
        ownerUserIdPatch = null;
      }
    }

    const settings =
      dto.status === 'lost' && existing?.status !== 'lost'
        ? await this.prisma.leadReactivationSetting.findUnique({
            where: { tenantId },
          })
        : null;
    const configuredReason = dto.lossReasonId
      ? await this.lossReasons.findOne(tenantId, dto.lossReasonId)
      : null;
    const reasonOverride = configuredReason
      ? applyLossReasonToReactivation({
          tenantEnabled: settings?.enabled ?? false,
          tenantIdleDays: settings?.idleDays ?? 30,
          tenantMaxAttempts: settings?.maxAttempts ?? 3,
          reason: configuredReason,
        })
      : null;
    const lostPatch = buildLostReactivationPatch({
      previousStatus: existing?.status ?? 'new',
      nextStatus: dto.status,
      lostReason: configuredReason?.name ?? dto.lostReason,
      now,
      settings,
      reasonOverride,
    });

    const data: Prisma.LeadUncheckedUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.company !== undefined ? { company: dto.company } : {}),
      ...(dto.source !== undefined ? { source: dto.source } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.assignedTo !== undefined ? { assignedTo: assignedToPatch } : {}),
      ...(ownerUserIdPatch !== undefined
        ? { ownerUserId: ownerUserIdPatch }
        : {}),
      ...(dto.interestCategories !== undefined
        ? { interestCategories: dto.interestCategories }
        : {}),
      ...(dto.reactivationEnabled !== undefined
        ? { reactivationEnabled: dto.reactivationEnabled }
        : {}),
      ...(dto.reactivationDays !== undefined
        ? { reactivationDays: dto.reactivationDays }
        : {}),
      ...(dto.lossReasonId !== undefined
        ? { lossReasonId: dto.lossReasonId || null }
        : {}),
      ...documentPatch,
      ...lostPatch,
      lastContactAt: now,
      lastInteractionAt: now,
    };

    let lead = await this.prisma.lead.update({
      where: { id },
      data,
      include: leadOwnerInclude,
    });

    if (dto.businessUnitId !== undefined || dto.businessUnitIds !== undefined) {
      const units = await this.resolveRequestedUnits(tenantId, dto, {
        originId: existing?.businessUnitId,
        unitIds: existing?.businessUnits.map((item) => item.businessUnitId),
      });
      await syncLeadBusinessUnits(
        this.prisma,
        id,
        units.unitIds,
        units.originId,
      );
      const refreshed = await this.prisma.lead.findFirst({
        where: { id, tenantId },
        include: leadOwnerInclude,
      });
      if (refreshed) lead = refreshed;
    }
    const activityByLeadId = await safeMaxOccurredAtByLeadIds(
      this.prisma,
      tenantId,
      [id],
    );

    if (dto.status === 'lost' && existing?.status !== 'lost' && actor?.userId) {
      await this.activityEngine.publish({
        tenantId,
        performedById: actor.userId,
        operationalEventKind: 'lead_lost',
        subject: `Lead perdido — ${lead.name}`,
        description: lead.lostReason,
        leadId: lead.id,
        metadata: {
          lossReasonId: lead.lossReasonId,
          lostReason: lead.lostReason,
        },
      });
    }

    return serializeLeadRecord({
      ...lead,
      lastInteractionAt: resolveLeadLastInteractionAt(
        activityByLeadId.get(id),
        lead.lastContactAt,
      ),
    });
  }

  async deleteLead(tenantId: string, id: string, actor?: LeadActor) {
    await this.assertLeadAccess(tenantId, id, actor);

    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      select: { dealId: true, status: true },
    });
    if (lead?.dealId || lead?.status === 'converted') {
      throw new ConflictException('Lead convertido não pode ser excluído');
    }

    await this.prisma.lead.delete({ where: { id } });
    return { deleted: true, id };
  }

  async convertLead(
    tenantId: string,
    id: string,
    dto: ConvertLeadDto,
    actor?: LeadActor,
  ) {
    const lead = await this.findLead(tenantId, id, actor);
    if (lead.dealId) {
      throw new ConflictException('Lead já convertido em negócio');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const stage = dto.stage ?? 'novo';
      const maxOrder = await tx.deal.aggregate({
        where: { tenantId, stage },
        _max: { pipelineOrder: true },
      });
      const businessUnitId = dto.businessUnitId ?? lead.businessUnitId ?? null;
      const pipeline = businessUnitId
        ? await tx.businessUnitPipeline.findUnique({
            where: { businessUnitId },
            select: { id: true },
          })
        : null;
      const sourceType = lead.lastReactivatedAt ? 'REACTIVATION' : 'LEAD';

      const deal = await tx.deal.create({
        data: {
          tenantId,
          title: dto.title?.trim() || `Lead: ${lead.name}`,
          company: lead.company?.trim() || lead.name,
          value: new Prisma.Decimal(dto.value ?? 0),
          stage,
          status: 'open',
          assignedTo:
            dto.assignedTo ??
            resolveAssignedToLabel(lead.owner) ??
            lead.assignedTo ??
            undefined,
          ownerUserId: lead.ownerUserId ?? lead.owner?.id ?? null,
          businessUnitId,
          pipelineOrder: nextPipelineOrder(maxOrder._max.pipelineOrder),
          sourceType,
          sourceId: id,
          score: 'MEDIUM',
          stageEnteredAt: now,
          pipelineId: pipeline?.id ?? null,
        },
      });
      await tx.dealStageHistory.create({
        data: {
          tenantId,
          dealId: deal.id,
          fromStage: null,
          toStage: stage,
          pipelineId: pipeline?.id ?? null,
          enteredAt: now,
          performedById: actor?.userId ?? null,
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: 'converted',
          dealId: deal.id,
          lastContactAt: now,
          lastInteractionAt: now,
        },
        include: leadOwnerInclude,
      });

      // Continuidade operacional Lead → Deal → QuestionnaireSubmission.
      // Sem este vínculo, o CRM abre /questionarios/respostas?dealId=… e a
      // grid retorna vazio — a submissão existe só via leadId.
      await this.linkQuestionnaireSubmissionsToDeal(tx, tenantId, id, deal.id);

      await this.activityEngine.linkLeadActivitiesToDeal(
        tx,
        tenantId,
        id,
        deal.id,
      );

      if (actor?.userId) {
        await this.activityEngine.publish(
          {
            tenantId,
            performedById: actor.userId,
            operationalEventKind: 'deal_created',
            subject: `Negócio criado — ${deal.title}`,
            occurredAt: now,
            leadId: id,
            dealId: deal.id,
            idempotencyKey: {
              operationalEventKind: 'deal_created',
              dealId: deal.id,
            },
          },
          tx,
        );
        await this.activityEngine.publish(
          {
            tenantId,
            performedById: actor.userId,
            operationalEventKind: 'lead_converted',
            subject: `Lead convertido — ${lead.name}`,
            description: `Negócio criado: ${deal.title}`,
            occurredAt: now,
            leadId: id,
            dealId: deal.id,
            idempotencyKey: {
              operationalEventKind: 'lead_converted',
              dealId: deal.id,
            },
          },
          tx,
        );
      }

      return {
        lead: serializeLeadRecord({
          ...updatedLead,
          lastInteractionAt: resolveLeadLastInteractionAt(
            undefined,
            updatedLead.lastContactAt,
          ),
        }),
        deal: { ...deal, value: deal.value.toNumber() },
      };
    });
  }

  async touchLastContact(tenantId: string, leadId: string) {
    await this.prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: { lastContactAt: new Date(), lastInteractionAt: new Date() },
    });
  }

  /**
   * Propaga dealId para todas as submissões do lead na conversão.
   * Mantém leadId intacto (rastreabilidade de origem) e adiciona dealId
   * para filtros e navegação no contexto do negócio.
   */
  private async linkQuestionnaireSubmissionsToDeal(
    tx: Prisma.TransactionClient,
    tenantId: string,
    leadId: string,
    dealId: string,
  ) {
    return tx.questionnaireSubmission.updateMany({
      where: { tenantId, leadId },
      data: { dealId },
    });
  }

  private buildDocumentPatch(
    dto: Pick<UpdateLeadDto, 'document' | 'documentType'>,
  ): Prisma.LeadUpdateInput {
    if (dto.document === undefined && dto.documentType === undefined) {
      return {};
    }

    if (dto.document === null || dto.document === '') {
      return { document: null, documentType: null };
    }

    const documentType =
      dto.documentType ??
      inferDocumentTypeFromDigits(stripDocumentDigits(dto.document ?? ''));

    if (!documentType) {
      return { document: null, documentType: null };
    }

    return this.resolveDocumentFields(documentType, dto.document);
  }

  private resolveDocumentFields(
    documentType: LeadDocumentType | undefined,
    document: string | undefined,
  ): { documentType: string | null; document: string | null } {
    if (!document?.trim()) {
      return { document: null, documentType: null };
    }

    const normalized = normalizeDocument(documentType, document);
    if (!normalized) {
      return { document: null, documentType: null };
    }

    return {
      documentType: normalized.documentType,
      document: normalized.document,
    };
  }

  private async buildLeadWhere(
    tenantId: string,
    query: ListLeadsQueryDto,
    actor?: LeadActor,
  ): Promise<Prisma.LeadWhereInput> {
    const search = query.search?.trim();

    let assignedToFilter: Prisma.LeadWhereInput | undefined;
    if (query.mine && actor?.userId) {
      assignedToFilter = { ownerUserId: actor.userId };
    }

    let legacyWhere: Prisma.LeadWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.interestCategory
        ? { interestCategories: { has: query.interestCategory } }
        : {}),
      ...(assignedToFilter ?? {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { source: { contains: search, mode: 'insensitive' } },
              { assignedTo: { contains: search, mode: 'insensitive' } },
              {
                ownerUser: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
              {
                ownerUser: {
                  email: { contains: search, mode: 'insensitive' },
                },
              },
              { document: { contains: stripDocumentDigits(search) } },
            ],
          }
        : {}),
    };

    if (actor?.userId && actor.tenantId && this.buAccess) {
      const buWhere = await this.buAccess.leadWhere(
        {
          userId: actor.userId,
          tenantId: actor.tenantId,
          roles: actor.roles,
          permissions: actor.permissions,
          currentBusinessUnitId: actor.currentBusinessUnitId,
        },
        query.businessUnitId,
      );
      if (buWhere) {
        legacyWhere = andWhere(legacyWhere, buWhere);
      }
    }

    if (!actor?.userId) {
      return legacyWhere;
    }

    const enforcement = await this.ownership.getEnforcementMode(tenantId);
    if (enforcement === 'off') {
      return legacyWhere;
    }

    const ctx = await this.ownership.resolveContext(tenantId, actor);
    const ownershipWhere = this.ownership.buildLeadAccessWhere(ctx);

    if (enforcement === 'shadow') {
      void this.ownership.logLeadListShadowComparison(
        tenantId,
        ctx,
        legacyWhere,
        ownershipWhere,
      );
      return legacyWhere;
    }

    const { tenantId: _tid, ...filtersWithoutTenant } = legacyWhere;
    void _tid;

    return {
      tenantId,
      AND: [filtersWithoutTenant, ownershipWhere],
    };
  }

  private async assertLeadAccess(
    tenantId: string,
    leadId: string,
    actor?: LeadActor,
  ): Promise<void> {
    if (this.buAccess && actor?.userId && actor.tenantId) {
      await this.buAccess.assertLeadVisible(
        {
          userId: actor.userId,
          tenantId: actor.tenantId,
          roles: actor.roles,
          permissions: actor.permissions,
          currentBusinessUnitId: actor.currentBusinessUnitId,
        },
        tenantId,
        leadId,
      );
    }

    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: { id: true },
    });
    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }

    if (!actor?.userId) return;

    const enforcement = await this.ownership.getEnforcementMode(tenantId);
    if (enforcement === 'off') return;

    const ctx = await this.ownership.resolveContext(tenantId, actor);

    if (enforcement === 'shadow') {
      void this.ownership.logLeadAccessShadowDenied(ctx, leadId);
      return;
    }

    await this.ownership.assertCanAccessLead(ctx, leadId);
  }

  async linkBusinessUnit(
    tenantId: string,
    leadId: string,
    businessUnitId: string,
    actor?: LeadActor,
  ) {
    await this.assertLeadAccess(tenantId, leadId, actor);
    await this.businessUnits.assertIds(tenantId, [businessUnitId]);

    const existing = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: {
        businessUnitId: true,
        businessUnits: { select: { businessUnitId: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Lead não encontrado');
    }

    const unitIds = [
      ...new Set([
        ...existing.businessUnits.map((item) => item.businessUnitId),
        businessUnitId,
      ]),
    ];
    await syncLeadBusinessUnits(
      this.prisma,
      leadId,
      unitIds,
      existing.businessUnitId ?? businessUnitId,
    );

    if (actor?.userId) {
      await this.activityEngine.publish({
        tenantId,
        performedById: actor.userId,
        operationalEventKind: 'lead_business_unit_linked',
        subject: 'Unidade de negócio vinculada ao lead',
        leadId,
        metadata: { businessUnitId },
      });
    }

    return this.findLead(tenantId, leadId, actor);
  }

  async unlinkBusinessUnit(
    tenantId: string,
    leadId: string,
    businessUnitId: string,
    actor?: LeadActor,
  ) {
    await this.assertLeadAccess(tenantId, leadId, actor);
    const existing = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: {
        businessUnitId: true,
        businessUnits: { select: { businessUnitId: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Lead não encontrado');
    }

    const unitIds = existing.businessUnits
      .map((item) => item.businessUnitId)
      .filter((id) => id !== businessUnitId);
    const originId =
      existing.businessUnitId === businessUnitId
        ? (unitIds[0] ?? null)
        : existing.businessUnitId;

    await syncLeadBusinessUnits(this.prisma, leadId, unitIds, originId);
    return this.findLead(tenantId, leadId, actor);
  }

  private async resolveRequestedUnits(
    tenantId: string,
    dto: { businessUnitId?: string; businessUnitIds?: string[] },
    existing?: { originId?: string | null; unitIds?: string[] },
  ) {
    const resolved = resolveBusinessUnitIds({
      businessUnitId: dto.businessUnitId,
      businessUnitIds: dto.businessUnitIds,
      existingOriginId: existing?.originId,
      existingUnitIds: existing?.unitIds,
    });
    const unitIds = await this.businessUnits.assertIds(tenantId, resolved.unitIds);
    const originId =
      resolved.originId && unitIds.includes(resolved.originId)
        ? resolved.originId
        : (unitIds[0] ?? null);
    return { originId, unitIds };
  }

  private buildCreateLeadDedupeKey(
    tenantId: string,
    dto: CreateLeadDto,
    actor?: LeadActor,
    idempotencyKey?: string,
  ) {
    const explicitKey = idempotencyKey?.trim();
    if (explicitKey) {
      return `lead:create:idempotency:${tenantId}:${actor?.userId ?? 'system'}:${explicitKey.slice(0, 200)}`;
    }

    return `lead:create:payload:${tenantId}:${actor?.userId ?? 'system'}:${JSON.stringify(
      this.buildCreateLeadFingerprint(dto),
    )}`;
  }

  private buildCreateLeadFingerprint(dto: CreateLeadDto) {
    const documentFields = this.resolveDocumentFields(
      dto.documentType,
      dto.document,
    );

    return {
      name: this.normalizeFingerprintText(dto.name),
      email: this.normalizeFingerprintText(dto.email),
      phone: this.normalizeFingerprintText(dto.phone),
      company: this.normalizeFingerprintText(dto.company),
      source: this.normalizeFingerprintText(dto.source),
      status: dto.status ?? 'new',
      notes: this.normalizeFingerprintText(dto.notes),
      assignedTo: this.normalizeFingerprintText(dto.assignedTo),
      documentType: documentFields.documentType ?? null,
      document: documentFields.document ?? null,
    };
  }

  private normalizeFingerprintText(value?: string | null) {
    return value?.trim().toLowerCase() || null;
  }

  private pruneLeadCreateRequests() {
    const now = Date.now();
    for (const [key, entry] of leadCreateRequests) {
      if (entry.expiresAt <= now) {
        leadCreateRequests.delete(key);
      }
    }
  }

  private async resolveOwnerFieldsForCreate(
    tenantId: string,
    actor: LeadAccessActor,
  ): Promise<{ ownerUserId: string; ownerTeamId: string | null }> {
    const ctx = await this.ownership.resolveContext(tenantId, actor);
    let ownerTeamId: string | null = ctx.teamIds[0] ?? null;

    if (!ownerTeamId) {
      const user = await this.prisma.user.findFirst({
        where: { id: actor.userId, tenantId },
        select: { primaryTeamId: true },
      });
      ownerTeamId = user?.primaryTeamId ?? null;
    }

    return { ownerUserId: actor.userId, ownerTeamId };
  }
}
