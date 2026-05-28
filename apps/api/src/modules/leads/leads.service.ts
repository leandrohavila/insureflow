import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

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
import { OwnershipService } from '../access/ownership.service';
import type { LeadAccessActor } from '../access/ownership.types';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  resolveLeadLastInteractionAt,
  safeMaxOccurredAtByLeadIds,
  serializeLeadRecord,
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

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async findLeads(
    tenantId: string,
    query: ListLeadsQueryDto,
    actor?: LeadActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = await this.buildLeadWhere(tenantId, query, actor);
    logLeadQuery('findLeads', { tenantId, page, limit, mine: query.mine });

    const whereWithoutStatus = await this.buildLeadWhere(
      tenantId,
      { ...query, status: undefined },
      actor,
    );

    const [total, leads, converted, qualified] = await this.prisma.$transaction(
      [
        this.prisma.lead.count({ where }),
        this.prisma.lead.findMany({
          where,
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

    const leadIds = leads.map((lead) => lead.id);
    const activityByLeadId = await safeMaxOccurredAtByLeadIds(
      this.prisma,
      tenantId,
      leadIds,
    );

    const data = leads.map((lead) =>
      serializeLeadRecord({
        ...lead,
        lastInteractionAt: resolveLeadLastInteractionAt(
          activityByLeadId.get(lead.id),
          lead.lastContactAt,
        ),
      }),
    );
    logLeadSerialize('findLeads', { count: data.length });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        counts: {
          converted,
          qualified,
        },
      },
    };
  }

  async findLead(tenantId: string, id: string, actor?: LeadActor) {
    await this.assertLeadAccess(tenantId, id, actor);

    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
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

  async createLead(tenantId: string, dto: CreateLeadDto, actor?: LeadActor) {
    const assignedTo =
      dto.assignedTo?.trim() ||
      (await this.resolveDefaultAssignedTo(tenantId, actor?.userId));
    const ownerFields = actor
      ? await this.resolveOwnerFieldsForCreate(tenantId, actor)
      : { ownerUserId: null as string | null, ownerTeamId: null as string | null };
    const documentFields = this.resolveDocumentFields(
      dto.documentType,
      dto.document,
    );
    const now = new Date();

    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        source: dto.source,
        status: dto.status,
        notes: dto.notes,
        assignedTo,
        ownerUserId: ownerFields.ownerUserId,
        ownerTeamId: ownerFields.ownerTeamId,
        lastContactAt: now,
        ...documentFields,
      },
    });
    logLeadSerialize('createLead', { id: lead.id });
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

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.company !== undefined ? { company: dto.company } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.assignedTo !== undefined
          ? {
              assignedTo:
                dto.assignedTo?.trim() ||
                (await this.resolveDefaultAssignedTo(tenantId, actor?.userId)),
            }
          : {}),
        ...documentPatch,
        lastContactAt: now,
      },
    });
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

  async deleteLead(tenantId: string, id: string, actor?: LeadActor) {
    await this.assertLeadAccess(tenantId, id, actor);
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

      const deal = await tx.deal.create({
        data: {
          tenantId,
          title: dto.title?.trim() || `Lead: ${lead.name}`,
          company: lead.company?.trim() || lead.name,
          value: new Prisma.Decimal(dto.value ?? 0),
          stage,
          status: 'open',
          assignedTo: dto.assignedTo ?? lead.assignedTo,
          pipelineOrder: nextPipelineOrder(maxOrder._max.pipelineOrder),
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: 'converted',
          dealId: deal.id,
          lastContactAt: now,
        },
      });

      // Continuidade operacional Lead → Deal → QuestionnaireSubmission.
      // Sem este vínculo, o CRM abre /questionarios/respostas?dealId=… e a
      // grid retorna vazio — a submissão existe só via leadId.
      await this.linkQuestionnaireSubmissionsToDeal(tx, tenantId, id, deal.id);

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
      data: { lastContactAt: new Date() },
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

  private async resolveDefaultAssignedTo(
    tenantId: string,
    userId: string | undefined,
  ): Promise<string | undefined> {
    if (!userId) return undefined;

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { name: true, email: true, id: true },
    });
    if (!user) return undefined;

    return user.name?.trim() || user.email;
  }

  private async resolveMineAssignedToValues(
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return [userId];

    return [user.id, user.name, user.email].filter((value): value is string =>
      Boolean(value?.trim()),
    );
  }

  private async buildLeadWhere(
    tenantId: string,
    query: ListLeadsQueryDto,
    actor?: LeadActor,
  ): Promise<Prisma.LeadWhereInput> {
    const search = query.search?.trim();

    let assignedToFilter: Prisma.LeadWhereInput['assignedTo'];
    if (query.mine && actor?.userId) {
      const values = await this.resolveMineAssignedToValues(
        tenantId,
        actor.userId,
      );
      assignedToFilter = { in: values };
    }

    const legacyWhere: Prisma.LeadWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(assignedToFilter ? { assignedTo: assignedToFilter } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { source: { contains: search, mode: 'insensitive' } },
              { assignedTo: { contains: search, mode: 'insensitive' } },
              { document: { contains: stripDocumentDigits(search) } },
            ],
          }
        : {}),
    };

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
      AND: [
        filtersWithoutTenant,
        ownershipWhere,
      ],
    };
  }

  private async assertLeadAccess(
    tenantId: string,
    leadId: string,
    actor?: LeadActor,
  ): Promise<void> {
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
