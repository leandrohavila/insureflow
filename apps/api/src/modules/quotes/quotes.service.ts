import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  Prisma,
  ProposalStatus,
  QuoteLineStatus,
  QuoteWorkflowStatus,
} from '@prisma/client';

import type { ActivityEventKind } from '../../common/utils/activity-event-kinds.util';
import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import type {
  BulkCreateQuoteLinesDto,
  CreateProposalDto,
  CreateQuoteComparisonDto,
  CreateQuoteLineDto,
  ListProposalsQueryDto,
  ListQuoteComparisonsQueryDto,
  UpdateProposalDto,
  UpdateQuoteComparisonDto,
  UpdateQuoteLineDto,
} from './dto/quote.dto';
import { ProposalPdfService } from './proposal-pdf.service';
import {
  proposalListInclude,
  quoteComparisonInclude,
  serializeProposalListItem,
  serializeQuoteComparison,
  type QuoteComparisonRecord,
} from './quote-serialize.util';
import {
  computeAverageQuoteDurationHours,
  computeQuoteConversionRate,
} from './quotes-metrics.util';

type ComparisonRelations = {
  leadId?: string | null;
  dealId?: string | null;
  customerId?: string | null;
  submissionId?: string | null;
};

type SubmissionSyncInput = {
  id: string;
  leadId: string | null;
  dealId: string | null;
  customerId: string | null;
};

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityEngine: ActivityEngineService,
    private readonly proposalPdf: ProposalPdfService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async findComparisons(
    tenantId: string,
    query: ListQuoteComparisonsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.buildComparisonWhere(tenantId, query, actor);

    const [total, comparisons] = await this.prisma.$transaction([
      this.prisma.quoteComparison.count({ where }),
      this.prisma.quoteComparison.findMany({
        where,
        include: quoteComparisonInclude,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: comparisons.map(serializeQuoteComparison),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findComparison(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertQuoteComparisonVisible(actor, tenantId, id);
    }
    const comparison = await this.findComparisonOrThrow(tenantId, id);
    return serializeQuoteComparison(comparison);
  }

  async findProposals(
    tenantId: string,
    query: ListProposalsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.buildProposalWhere(tenantId, query, actor);

    const [total, proposals] = await this.prisma.$transaction([
      this.prisma.proposal.count({ where }),
      this.prisma.proposal.findMany({
        where,
        include: proposalListInclude,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: proposals.map(serializeProposalListItem),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findProposal(
    tenantId: string,
    proposalId: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertProposalVisible(actor, tenantId, proposalId);
    }
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, tenantId },
      include: proposalListInclude,
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    return serializeProposalListItem(proposal);
  }

  async createComparison(
    tenantId: string,
    performedById: string,
    dto: CreateQuoteComparisonDto,
  ) {
    await this.ensureRelations(tenantId, dto);

    try {
      const comparison = await this.prisma.quoteComparison.create({
        data: {
          tenantId,
          title: dto.title?.trim() || null,
          leadId: dto.leadId ?? null,
          dealId: dto.dealId ?? null,
          customerId: dto.customerId ?? null,
          submissionId: dto.submissionId ?? null,
          assignedToId: dto.assignedToId ?? null,
          notes: dto.notes?.trim() || null,
        },
        include: quoteComparisonInclude,
      });

      await this.publishComparisonEvent({
        tenantId,
        performedById,
        comparison,
        operationalEventKind: 'quote_created',
        subject: this.comparisonSubject(comparison, 'Comparativo criado'),
        description: 'Comparativo de cotações registrado.',
      });

      return serializeQuoteComparison(comparison);
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async updateComparison(
    tenantId: string,
    id: string,
    performedById: string,
    dto: UpdateQuoteComparisonDto,
  ) {
    const current = await this.findComparisonOrThrow(tenantId, id);
    await this.ensureRelations(tenantId, {
      assignedToId: dto.assignedToId,
    });

    const comparison = await this.prisma.quoteComparison.update({
      where: { id },
      data: {
        ...(dto.title !== undefined
          ? { title: dto.title?.trim() || null }
          : {}),
        ...(dto.workflowStatus !== undefined
          ? { workflowStatus: dto.workflowStatus }
          : {}),
        ...(dto.notes !== undefined
          ? { notes: dto.notes?.trim() || null }
          : {}),
        ...(dto.assignedToId !== undefined
          ? { assignedToId: dto.assignedToId ?? null }
          : {}),
        ...(dto.workflowStatus === 'closed_won' ||
        dto.workflowStatus === 'closed_lost'
          ? { closedAt: new Date() }
          : {}),
      },
      include: quoteComparisonInclude,
    });

    const changed =
      dto.title !== undefined ||
      dto.workflowStatus !== undefined ||
      dto.notes !== undefined ||
      dto.assignedToId !== undefined;

    if (changed) {
      await this.publishComparisonEvent({
        tenantId,
        performedById,
        comparison,
        operationalEventKind: 'quote_updated',
        subject: this.comparisonSubject(comparison, 'Comparativo atualizado'),
        description: this.describeComparisonUpdate(current, comparison),
      });
    }

    return serializeQuoteComparison(comparison);
  }

  async addQuoteLine(
    tenantId: string,
    comparisonId: string,
    performedById: string,
    dto: CreateQuoteLineDto,
  ) {
    await this.findComparisonOrThrow(tenantId, comparisonId);

    return this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.quote.count({
        where: { tenantId, comparisonId },
      });

      const quote = await tx.quote.create({
        data: this.buildQuoteLineData(
          tenantId,
          comparisonId,
          dto,
          existingCount,
        ),
      });

      if (existingCount === 0) {
        await tx.quoteComparison.update({
          where: { id: comparisonId },
          data: { workflowStatus: QuoteWorkflowStatus.quote_created },
        });
      }

      const comparison = await tx.quoteComparison.findFirstOrThrow({
        where: { id: comparisonId, tenantId },
        include: quoteComparisonInclude,
      });

      await this.publishComparisonEvent(
        {
          tenantId,
          performedById,
          comparison,
          operationalEventKind: 'quote_created',
          subject: this.comparisonSubject(
            comparison,
            `Cotação adicionada — ${quote.insurer}`,
          ),
          description: 'Linha de cotação registrada no comparativo.',
          metadata: {
            comparisonId,
            quoteId: quote.id,
            insurer: quote.insurer,
          },
        },
        tx,
      );

      return serializeQuoteComparison(comparison);
    });
  }

  async bulkAddQuoteLines(
    tenantId: string,
    comparisonId: string,
    performedById: string,
    dto: BulkCreateQuoteLinesDto,
  ) {
    if (dto.lines.length === 0) {
      throw new BadRequestException('Informe ao menos uma linha de cotação');
    }

    await this.findComparisonOrThrow(tenantId, comparisonId);

    return this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.quote.count({
        where: { tenantId, comparisonId },
      });

      await tx.quote.createMany({
        data: dto.lines.map((line, index) =>
          this.buildQuoteLineData(
            tenantId,
            comparisonId,
            line,
            existingCount + index,
          ),
        ),
      });

      if (existingCount === 0) {
        await tx.quoteComparison.update({
          where: { id: comparisonId },
          data: { workflowStatus: QuoteWorkflowStatus.quote_created },
        });
      }

      const comparison = await tx.quoteComparison.findFirstOrThrow({
        where: { id: comparisonId, tenantId },
        include: quoteComparisonInclude,
      });

      await this.publishComparisonEvent(
        {
          tenantId,
          performedById,
          comparison,
          operationalEventKind: 'quote_created',
          subject: this.comparisonSubject(
            comparison,
            `${dto.lines.length} cotações adicionadas`,
          ),
          description: 'Linhas de cotação registradas em lote.',
          metadata: {
            comparisonId,
            lineCount: dto.lines.length,
          },
        },
        tx,
      );

      return serializeQuoteComparison(comparison);
    });
  }

  async updateQuoteLine(
    tenantId: string,
    comparisonId: string,
    quoteId: string,
    performedById: string,
    dto: UpdateQuoteLineDto,
  ) {
    await this.findComparisonOrThrow(tenantId, comparisonId);
    await this.findQuoteLineOrThrow(tenantId, comparisonId, quoteId);

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: this.buildQuoteLineUpdateData(dto),
    });

    if (dto.isSelected === true) {
      await this.applySelectedQuote(tenantId, comparisonId, quoteId);
    }

    const comparison = await this.findComparisonOrThrow(tenantId, comparisonId);

    await this.publishComparisonEvent({
      tenantId,
      performedById,
      comparison,
      operationalEventKind: 'quote_updated',
      subject: this.comparisonSubject(
        comparison,
        'Linha de cotação atualizada',
      ),
      description: 'Detalhes da cotação foram revisados.',
      metadata: { comparisonId, quoteId },
    });

    return serializeQuoteComparison(comparison);
  }

  async selectQuoteLine(
    tenantId: string,
    comparisonId: string,
    quoteId: string,
    performedById: string,
  ) {
    await this.findComparisonOrThrow(tenantId, comparisonId);
    await this.findQuoteLineOrThrow(tenantId, comparisonId, quoteId);

    await this.applySelectedQuote(tenantId, comparisonId, quoteId);

    const comparison = await this.findComparisonOrThrow(tenantId, comparisonId);

    await this.publishComparisonEvent({
      tenantId,
      performedById,
      comparison,
      operationalEventKind: 'quote_updated',
      subject: this.comparisonSubject(comparison, 'Cotação selecionada'),
      description: 'Seguradora escolhida no comparativo.',
      metadata: { comparisonId, quoteId },
    });

    return serializeQuoteComparison(comparison);
  }

  async markComparisonSent(
    tenantId: string,
    comparisonId: string,
    performedById: string,
  ) {
    const current = await this.findComparisonOrThrow(tenantId, comparisonId);
    if (current.quotes.length === 0) {
      throw new BadRequestException(
        'Adicione ao menos uma cotação antes de enviar o comparativo.',
      );
    }

    const now = new Date();
    const comparison = await this.prisma.quoteComparison.update({
      where: { id: comparisonId },
      data: {
        workflowStatus: QuoteWorkflowStatus.quote_sent,
        sentAt: now,
      },
      include: quoteComparisonInclude,
    });

    await this.prisma.quote.updateMany({
      where: {
        tenantId,
        comparisonId,
        status: { in: [QuoteLineStatus.draft, QuoteLineStatus.quoted] },
      },
      data: { status: QuoteLineStatus.sent },
    });

    const refreshed = await this.findComparisonOrThrow(tenantId, comparisonId);

    await this.publishComparisonEvent({
      tenantId,
      performedById,
      comparison: refreshed,
      operationalEventKind: 'quote_sent',
      subject: this.comparisonSubject(comparison, 'Comparativo enviado'),
      description: 'Cotações compartilhadas com o cliente.',
      occurredAt: now,
      metadata: { comparisonId, sentAt: now.toISOString() },
    });

    return serializeQuoteComparison(refreshed);
  }

  async recordComparisonViewed(
    tenantId: string,
    comparisonId: string,
    performedById: string,
  ) {
    const comparison = await this.findComparisonOrThrow(tenantId, comparisonId);

    await this.publishComparisonEvent({
      tenantId,
      performedById,
      comparison,
      operationalEventKind: 'quote_compared',
      subject: this.comparisonSubject(comparison, 'Comparativo visualizado'),
      description: 'Comparativo de cotações consultado.',
      metadata: {
        comparisonId,
        lineCount: comparison.quotes.length,
        selectedQuoteId: comparison.selectedQuoteId,
      },
    });

    return serializeQuoteComparison(comparison);
  }

  async createProposal(
    tenantId: string,
    comparisonId: string,
    performedById: string,
    dto: CreateProposalDto,
  ) {
    await this.findComparisonOrThrow(tenantId, comparisonId);

    if (dto.quoteId) {
      await this.findQuoteLineOrThrow(tenantId, comparisonId, dto.quoteId);
    }

    const proposal = await this.prisma.proposal.create({
      data: {
        tenantId,
        comparisonId,
        quoteId: dto.quoteId ?? null,
        title: dto.title?.trim() || null,
        value: dto.value ?? null,
        notes: dto.notes?.trim() || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        publicViewToken: randomUUID(),
      },
    });

    const refreshed = await this.findComparisonOrThrow(tenantId, comparisonId);

    await this.publishComparisonEvent({
      tenantId,
      performedById,
      comparison: refreshed,
      operationalEventKind: 'proposal_created',
      subject: this.comparisonSubject(refreshed, 'Proposta criada'),
      description: 'Proposta comercial registrada.',
      metadata: {
        comparisonId,
        proposalId: proposal.id,
        quoteId: proposal.quoteId,
      },
    });

    return serializeQuoteComparison(refreshed);
  }

  async updateProposal(
    tenantId: string,
    comparisonId: string,
    proposalId: string,
    performedById: string,
    dto: UpdateProposalDto,
  ) {
    await this.findComparisonOrThrow(tenantId, comparisonId);
    const current = await this.findProposalOrThrow(
      tenantId,
      comparisonId,
      proposalId,
    );

    const nextStatus = dto.status ?? current.status;
    const now = new Date();

    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.title !== undefined
          ? { title: dto.title?.trim() || null }
          : {}),
        ...(dto.value !== undefined ? { value: dto.value ?? null } : {}),
        ...(dto.notes !== undefined
          ? { notes: dto.notes?.trim() || null }
          : {}),
        ...(dto.expiresAt !== undefined
          ? {
              expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            }
          : {}),
        ...(nextStatus === ProposalStatus.sent &&
        current.status !== ProposalStatus.sent
          ? { sentAt: now }
          : {}),
        ...(nextStatus === ProposalStatus.viewed &&
        current.status !== ProposalStatus.viewed
          ? { viewedAt: now }
          : {}),
        ...(nextStatus === ProposalStatus.accepted ||
        nextStatus === ProposalStatus.rejected
          ? { respondedAt: now }
          : {}),
        ...(nextStatus === ProposalStatus.expired &&
        current.status !== ProposalStatus.expired
          ? { expiredAt: now }
          : {}),
      },
    });

    if (nextStatus === ProposalStatus.sent) {
      await this.prisma.quoteComparison.update({
        where: { id: comparisonId },
        data: { workflowStatus: QuoteWorkflowStatus.negotiation },
      });
    } else if (nextStatus === ProposalStatus.accepted) {
      await this.prisma.quoteComparison.update({
        where: { id: comparisonId },
        data: {
          workflowStatus: QuoteWorkflowStatus.closed_won,
          closedAt: now,
        },
      });
    } else if (nextStatus === ProposalStatus.rejected) {
      await this.prisma.quoteComparison.update({
        where: { id: comparisonId },
        data: {
          workflowStatus: QuoteWorkflowStatus.negotiation,
        },
      });
    }

    const comparison = await this.findComparisonOrThrow(tenantId, comparisonId);

    if (dto.status !== undefined && dto.status !== current.status) {
      const eventKind = this.proposalStatusEventKind(dto.status);
      if (eventKind) {
        await this.publishComparisonEvent({
          tenantId,
          performedById,
          comparison,
          operationalEventKind: eventKind,
          subject: this.comparisonSubject(
            comparison,
            this.proposalStatusLabel(dto.status),
          ),
          description: 'Status da proposta comercial atualizado.',
          occurredAt: now,
          metadata: { comparisonId, proposalId, status: dto.status },
        });
      }
    } else if (
      dto.title !== undefined ||
      dto.value !== undefined ||
      dto.notes !== undefined
    ) {
      await this.publishComparisonEvent({
        tenantId,
        performedById,
        comparison,
        operationalEventKind: 'quote_updated',
        subject: this.comparisonSubject(comparison, 'Proposta atualizada'),
        description: 'Detalhes da proposta comercial revisados.',
        metadata: { comparisonId, proposalId },
      });
    }

    return serializeQuoteComparison(comparison);
  }

  async generateProposalPdf(
    tenantId: string,
    comparisonId: string,
    proposalId: string,
    performedById: string,
  ) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, tenantId, comparisonId },
      include: {
        ...proposalListInclude,
        quote: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    const comparisonFull = await this.findComparisonOrThrow(
      tenantId,
      comparisonId,
    );
    const comparison = proposal.comparison;
    const quote = proposal.quote ?? comparisonFull.selectedQuote ?? null;
    const nextVersion = (proposal.pdfVersion ?? 0) + 1;
    const clientName =
      comparison.customer?.name ??
      comparison.lead?.name ??
      comparison.deal?.title ??
      'Cliente';
    const clientDocument = comparison.customer?.document ?? null;

    const { storageKey } = await this.proposalPdf.generateAndStore({
      tenantId,
      proposalId: proposal.id,
      pdfVersion: nextVersion,
      title: proposal.title?.trim() || 'Proposta Comercial de Seguros',
      value: proposal.value != null ? Number(proposal.value) : null,
      status: proposal.status,
      notes: proposal.notes,
      expiresAt: proposal.expiresAt?.toISOString() ?? null,
      createdAt: proposal.createdAt.toISOString(),
      clientName,
      clientDocument,
      dealTitle: comparison.deal?.title ?? null,
      insurer: quote?.insurer ?? null,
      plan: quote?.plan ?? null,
      premiumValue: quote ? Number(quote.premiumValue) : null,
      franchiseValue:
        quote?.franchiseValue != null ? Number(quote.franchiseValue) : null,
      coverages: Array.isArray(quote?.coverages)
        ? quote.coverages.filter(
            (item): item is string => typeof item === 'string',
          )
        : [],
      assistance: quote?.assistance ?? null,
    });

    const now = new Date();
    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        pdfStorageKey: storageKey,
        pdfGeneratedAt: now,
        pdfVersion: nextVersion,
      },
    });

    const refreshed = await this.findComparisonOrThrow(tenantId, comparisonId);

    await this.publishComparisonEvent({
      tenantId,
      performedById,
      comparison: refreshed,
      operationalEventKind: 'proposal_pdf_generated',
      subject: this.comparisonSubject(refreshed, 'PDF da proposta gerado'),
      description: 'Documento PDF da proposta comercial disponível.',
      occurredAt: now,
      metadata: {
        comparisonId,
        proposalId,
        pdfVersion: nextVersion,
        pdfStorageKey: storageKey,
      },
    });

    return serializeQuoteComparison(refreshed);
  }

  async getProposalPdfBuffer(
    tenantId: string,
    comparisonId: string,
    proposalId: string,
  ) {
    const proposal = await this.findProposalOrThrow(
      tenantId,
      comparisonId,
      proposalId,
    );

    if (!proposal.pdfStorageKey) {
      throw new NotFoundException(
        'PDF da proposta ainda não foi gerado. Gere o documento antes do download.',
      );
    }

    const buffer = await this.proposalPdf.readStoredPdf(proposal.pdfStorageKey);
    return {
      buffer,
      filename: `proposta-${proposalId}-v${proposal.pdfVersion ?? 1}.pdf`,
    };
  }

  async markProposalSent(
    tenantId: string,
    comparisonId: string,
    proposalId: string,
    performedById: string,
  ) {
    return this.updateProposal(
      tenantId,
      comparisonId,
      proposalId,
      performedById,
      {
        status: ProposalStatus.sent,
      },
    );
  }

  async markProposalViewed(
    tenantId: string,
    comparisonId: string,
    proposalId: string,
    performedById: string,
  ) {
    const current = await this.findProposalOrThrow(
      tenantId,
      comparisonId,
      proposalId,
    );

    if (
      current.status !== ProposalStatus.sent &&
      current.status !== ProposalStatus.viewed
    ) {
      throw new BadRequestException(
        'Somente propostas enviadas podem ser marcadas como visualizadas.',
      );
    }

    if (current.status === ProposalStatus.viewed) {
      const comparison = await this.findComparisonOrThrow(
        tenantId,
        comparisonId,
      );
      await this.publishComparisonEvent({
        tenantId,
        performedById,
        comparison,
        operationalEventKind: 'proposal_viewed',
        subject: this.comparisonSubject(comparison, 'Proposta visualizada'),
        description: 'Visualização da proposta registrada novamente.',
        metadata: { comparisonId, proposalId },
      });
      return serializeQuoteComparison(comparison);
    }

    return this.updateProposal(
      tenantId,
      comparisonId,
      proposalId,
      performedById,
      {
        status: ProposalStatus.viewed,
      },
    );
  }

  async markProposalExpired(
    tenantId: string,
    comparisonId: string,
    proposalId: string,
    performedById: string,
  ) {
    const current = await this.findProposalOrThrow(
      tenantId,
      comparisonId,
      proposalId,
    );

    if (
      current.status === ProposalStatus.accepted ||
      current.status === ProposalStatus.rejected
    ) {
      throw new BadRequestException(
        'Propostas aceitas ou recusadas não podem expirar.',
      );
    }

    return this.updateProposal(
      tenantId,
      comparisonId,
      proposalId,
      performedById,
      {
        status: ProposalStatus.expired,
      },
    );
  }

  async syncComparisonFromSubmission(
    tenantId: string,
    submission: SubmissionSyncInput,
    workflowStatus: QuoteWorkflowStatus,
    performedById?: string,
  ) {
    const existing = await this.prisma.quoteComparison.findFirst({
      where: { tenantId, submissionId: submission.id },
      include: quoteComparisonInclude,
    });

    if (existing) {
      if (existing.workflowStatus === workflowStatus) {
        return serializeQuoteComparison(existing);
      }

      const comparison = await this.prisma.quoteComparison.update({
        where: { id: existing.id },
        data: { workflowStatus },
        include: quoteComparisonInclude,
      });

      if (performedById) {
        await this.publishComparisonEvent({
          tenantId,
          performedById,
          comparison,
          operationalEventKind: 'quote_updated',
          subject: this.comparisonSubject(
            comparison,
            'Comparativo sincronizado com questionário',
          ),
          description: `Status atualizado para ${workflowStatus}.`,
          metadata: {
            comparisonId: comparison.id,
            submissionId: submission.id,
            workflowStatus,
          },
        });
      }

      return serializeQuoteComparison(comparison);
    }

    const comparison = await this.prisma.quoteComparison.create({
      data: {
        tenantId,
        submissionId: submission.id,
        leadId: submission.leadId,
        dealId: submission.dealId,
        customerId: submission.customerId,
        workflowStatus,
        title: 'Comparativo comercial',
      },
      include: quoteComparisonInclude,
    });

    if (performedById) {
      await this.publishComparisonEvent({
        tenantId,
        performedById,
        comparison,
        operationalEventKind: 'quote_created',
        subject: this.comparisonSubject(comparison, 'Comparativo iniciado'),
        description: 'Comparativo criado a partir do questionário.',
        metadata: {
          comparisonId: comparison.id,
          submissionId: submission.id,
          workflowStatus,
        },
      });
    }

    return serializeQuoteComparison(comparison);
  }

  async getMetrics(tenantId: string, actor?: BusinessUnitActor) {
    const comparisonScope = await this.scopedComparisonWhere(tenantId, actor);
    const proposalScope = await this.scopedProposalWhere(tenantId, actor);
    const [statusGroups, proposalCounts, recentCount, sentComparisons] =
      await Promise.all([
        this.prisma.quoteComparison.groupBy({
          by: ['workflowStatus'],
          where: comparisonScope,
          _count: { _all: true },
        }),
        this.prisma.proposal.groupBy({
          by: ['status'],
          where: proposalScope,
          _count: { _all: true },
        }),
        this.prisma.quoteComparison.count({
          where: {
            ...comparisonScope,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.quoteComparison.findMany({
          where: { ...comparisonScope, sentAt: { not: null } },
          select: { createdAt: true, sentAt: true },
        }),
      ]);

    const byWorkflowStatus = Object.fromEntries(
      statusGroups.map((group) => [group.workflowStatus, group._count._all]),
    ) as Partial<Record<QuoteWorkflowStatus, number>>;

    const byProposalStatus = Object.fromEntries(
      proposalCounts.map((group) => [group.status, group._count._all]),
    ) as Partial<Record<ProposalStatus, number>>;

    const totalComparisons = statusGroups.reduce(
      (sum, group) => sum + group._count._all,
      0,
    );

    const closedWon = byWorkflowStatus.closed_won ?? 0;
    const closedLost = byWorkflowStatus.closed_lost ?? 0;

    const averageQuoteDurationHours = computeAverageQuoteDurationHours(
      sentComparisons
        .filter(
          (item): item is { createdAt: Date; sentAt: Date } =>
            item.sentAt != null,
        )
        .map((item) => ({
          createdAt: item.createdAt,
          sentAt: item.sentAt,
        })),
    );

    const quoteConversionRate = computeQuoteConversionRate(
      closedWon,
      closedLost,
    );

    return {
      totalComparisons,
      recentComparisons: recentCount,
      byWorkflowStatus,
      pendingAnalysis:
        (byWorkflowStatus.received ?? 0) + (byWorkflowStatus.in_analysis ?? 0),
      sent: byWorkflowStatus.quote_sent ?? 0,
      closedWon,
      closedLost,
      activeProposals:
        (byProposalStatus.draft ?? 0) + (byProposalStatus.sent ?? 0),
      sentProposals: byProposalStatus.sent ?? 0,
      viewedProposals: byProposalStatus.viewed ?? 0,
      expiredProposals: byProposalStatus.expired ?? 0,
      proposalsAwaitingResponse:
        (byProposalStatus.sent ?? 0) + (byProposalStatus.viewed ?? 0),
      acceptedProposals: byProposalStatus.accepted ?? 0,
      rejectedProposals: byProposalStatus.rejected ?? 0,
      averageQuoteDurationHours,
      quoteConversionRate,
    };
  }

  private async scopedComparisonWhere(
    tenantId: string,
    actor?: BusinessUnitActor,
  ): Promise<Prisma.QuoteComparisonWhereInput> {
    let where: Prisma.QuoteComparisonWhereInput = { tenantId };
    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.quoteComparisonWhere(actor);
      if (buWhere) where = andWhere(where, buWhere);
    }
    return where;
  }

  private async scopedProposalWhere(
    tenantId: string,
    actor?: BusinessUnitActor,
  ): Promise<Prisma.ProposalWhereInput> {
    let where: Prisma.ProposalWhereInput = { tenantId };
    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.proposalWhere(actor);
      if (buWhere) where = andWhere(where, buWhere);
    }
    return where;
  }

  private async buildProposalWhere(
    tenantId: string,
    query: ListProposalsQueryDto,
    actor?: BusinessUnitActor,
  ): Promise<Prisma.ProposalWhereInput> {
    const where: Prisma.ProposalWhereInput = { tenantId };

    if (query.comparisonId) where.comparisonId = query.comparisonId;
    if (query.status) where.status = query.status;

    if (query.leadId || query.dealId || query.customerId) {
      where.comparison = {
        tenantId,
        ...(query.leadId ? { leadId: query.leadId } : {}),
        ...(query.dealId ? { dealId: query.dealId } : {}),
        ...(query.customerId ? { customerId: query.customerId } : {}),
      };
    }

    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.proposalWhere(actor);
      if (buWhere) return andWhere(where, buWhere);
    }

    return where;
  }

  private async buildComparisonWhere(
    tenantId: string,
    query: ListQuoteComparisonsQueryDto,
    actor?: BusinessUnitActor,
  ): Promise<Prisma.QuoteComparisonWhereInput> {
    const where: Prisma.QuoteComparisonWhereInput = { tenantId };

    if (query.leadId) where.leadId = query.leadId;
    if (query.dealId) where.dealId = query.dealId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.submissionId) where.submissionId = query.submissionId;
    if (query.workflowStatus) where.workflowStatus = query.workflowStatus;

    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.quoteComparisonWhere(actor);
      if (buWhere) return andWhere(where, buWhere);
    }

    return where;
  }

  private buildQuoteLineData(
    tenantId: string,
    comparisonId: string,
    dto: CreateQuoteLineDto,
    sortIndex: number,
  ): Prisma.QuoteCreateManyInput {
    return {
      tenantId,
      comparisonId,
      insurer: dto.insurer.trim(),
      product: dto.product?.trim() || null,
      plan: dto.plan?.trim() || null,
      premiumValue: dto.premiumValue,
      franchiseValue: dto.franchiseValue ?? null,
      coverages: dto.coverages ?? [],
      assistance: dto.assistance?.trim() || null,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      status: dto.status ?? QuoteLineStatus.draft,
      observations: dto.observations?.trim() || null,
      externalSource: dto.externalSource?.trim() || 'manual',
      sortOrder: dto.sortOrder ?? sortIndex,
    };
  }

  private buildQuoteLineUpdateData(
    dto: UpdateQuoteLineDto,
  ): Prisma.QuoteUpdateInput {
    return {
      ...(dto.insurer !== undefined ? { insurer: dto.insurer.trim() } : {}),
      ...(dto.product !== undefined
        ? { product: dto.product?.trim() || null }
        : {}),
      ...(dto.plan !== undefined ? { plan: dto.plan?.trim() || null } : {}),
      ...(dto.premiumValue !== undefined
        ? { premiumValue: dto.premiumValue }
        : {}),
      ...(dto.franchiseValue !== undefined
        ? { franchiseValue: dto.franchiseValue ?? null }
        : {}),
      ...(dto.coverages !== undefined
        ? { coverages: dto.coverages ?? [] }
        : {}),
      ...(dto.assistance !== undefined
        ? { assistance: dto.assistance?.trim() || null }
        : {}),
      ...(dto.effectiveFrom !== undefined
        ? {
            effectiveFrom: dto.effectiveFrom
              ? new Date(dto.effectiveFrom)
              : null,
          }
        : {}),
      ...(dto.effectiveTo !== undefined
        ? {
            effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
          }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.observations !== undefined
        ? { observations: dto.observations?.trim() || null }
        : {}),
      ...(dto.externalSource !== undefined
        ? { externalSource: dto.externalSource?.trim() || 'manual' }
        : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.isSelected !== undefined ? { isSelected: dto.isSelected } : {}),
    };
  }

  private async applySelectedQuote(
    tenantId: string,
    comparisonId: string,
    quoteId: string,
  ) {
    await this.prisma.$transaction([
      this.prisma.quote.updateMany({
        where: { tenantId, comparisonId },
        data: { isSelected: false },
      }),
      this.prisma.quote.update({
        where: { id: quoteId },
        data: { isSelected: true, status: QuoteLineStatus.selected },
      }),
      this.prisma.quoteComparison.update({
        where: { id: comparisonId },
        data: { selectedQuoteId: quoteId },
      }),
    ]);
  }

  private async ensureRelations(
    tenantId: string,
    dto: ComparisonRelations & { assignedToId?: string | null },
  ) {
    if (dto.leadId) {
      await this.assertEntity(
        this.prisma.lead.findFirst({
          where: { id: dto.leadId, tenantId },
          select: { id: true },
        }),
        'Lead relacionado não encontrado',
      );
    }

    if (dto.dealId) {
      await this.assertEntity(
        this.prisma.deal.findFirst({
          where: { id: dto.dealId, tenantId },
          select: { id: true },
        }),
        'Negócio relacionado não encontrado',
      );
    }

    if (dto.customerId) {
      await this.assertEntity(
        this.prisma.customer.findFirst({
          where: { id: dto.customerId, tenantId },
          select: { id: true },
        }),
        'Cliente relacionado não encontrado',
      );
    }

    if (dto.submissionId) {
      await this.assertEntity(
        this.prisma.questionnaireSubmission.findFirst({
          where: { id: dto.submissionId, tenantId },
          select: { id: true },
        }),
        'Resposta de questionário não encontrada',
      );
    }

    if (dto.assignedToId) {
      await this.assertEntity(
        this.prisma.user.findFirst({
          where: { id: dto.assignedToId, tenantId },
          select: { id: true },
        }),
        'Responsável não encontrado',
      );
    }
  }

  private async assertEntity<T>(
    promise: Promise<T | null>,
    message: string,
  ): Promise<void> {
    const entity = await promise;
    if (!entity) {
      throw new NotFoundException(message);
    }
  }

  private async findComparisonOrThrow(tenantId: string, id: string) {
    const comparison = await this.prisma.quoteComparison.findFirst({
      where: { id, tenantId },
      include: quoteComparisonInclude,
    });
    if (!comparison) {
      throw new NotFoundException('Comparativo de cotações não encontrado');
    }
    return comparison;
  }

  private async findQuoteLineOrThrow(
    tenantId: string,
    comparisonId: string,
    quoteId: string,
  ) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, tenantId, comparisonId },
      select: { id: true },
    });
    if (!quote) {
      throw new NotFoundException('Linha de cotação não encontrada');
    }
  }

  private async findProposalOrThrow(
    tenantId: string,
    comparisonId: string,
    proposalId: string,
  ) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, tenantId, comparisonId },
    });
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    return proposal;
  }

  private comparisonSubject(
    comparison: QuoteComparisonRecord,
    action: string,
  ): string {
    const label =
      comparison.title?.trim() ||
      comparison.deal?.title?.trim() ||
      comparison.lead?.name?.trim() ||
      'Comparativo';
    return `${action} — ${label}`;
  }

  private describeComparisonUpdate(
    previous: QuoteComparisonRecord,
    next: QuoteComparisonRecord,
  ): string {
    if (previous.workflowStatus !== next.workflowStatus) {
      return `${previous.workflowStatus} → ${next.workflowStatus}`;
    }
    return 'Dados do comparativo revisados.';
  }

  private proposalStatusEventKind(
    status: ProposalStatus,
  ): ActivityEventKind | null {
    if (status === ProposalStatus.sent) return 'proposal_sent';
    if (status === ProposalStatus.viewed) return 'proposal_viewed';
    if (status === ProposalStatus.accepted) return 'proposal_accepted';
    if (status === ProposalStatus.rejected) return 'proposal_rejected';
    if (status === ProposalStatus.expired) return 'proposal_expired';
    return null;
  }

  private proposalStatusLabel(status: ProposalStatus): string {
    if (status === ProposalStatus.sent) return 'Proposta enviada';
    if (status === ProposalStatus.viewed) return 'Proposta visualizada';
    if (status === ProposalStatus.accepted) return 'Proposta aceita';
    if (status === ProposalStatus.rejected) return 'Proposta recusada';
    if (status === ProposalStatus.expired) return 'Proposta expirada';
    return 'Proposta atualizada';
  }

  private async publishComparisonEvent(
    input: {
      tenantId: string;
      performedById: string;
      comparison: QuoteComparisonRecord;
      operationalEventKind: ActivityEventKind;
      subject: string;
      description?: string;
      occurredAt?: Date;
      metadata?: Record<string, unknown>;
    },
    tx?: Prisma.TransactionClient,
  ) {
    await this.activityEngine.publish(
      {
        tenantId: input.tenantId,
        performedById: input.performedById,
        operationalEventKind: input.operationalEventKind,
        subject: input.subject,
        description: input.description,
        occurredAt: input.occurredAt,
        leadId: input.comparison.leadId,
        dealId: input.comparison.dealId,
        customerId: input.comparison.customerId,
        metadata: {
          comparisonId: input.comparison.id,
          workflowStatus: input.comparison.workflowStatus,
          submissionId: input.comparison.submissionId,
          ...input.metadata,
        },
      },
      tx,
    );
  }

  private handleWriteError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Registro de cotação já existe neste tenant');
    }
    throw error;
  }
}
