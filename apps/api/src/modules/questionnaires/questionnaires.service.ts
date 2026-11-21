import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type QuestionnaireBranch } from '@prisma/client';

import {
  RuleEngine,
  ValidationEngine,
  createServerValidationContext,
  fieldsToDescriptors,
  resolveValidationProfile,
} from '@repo/forms-engine';
import {
  getIntelligentForm,
  intelligentFormFingerprint,
  isIntelligentFormBranch,
  type IntelligentFormDefinition,
  type IntelligentFormField,
} from '@repo/forms-library';
import {
  andWhere,
  canViewAllBusinessUnits,
  relatedLeadCustomerDealWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { LeadsService } from '../leads/leads.service';
import { QuotesService } from '../quotes/quotes.service';
import {
  buildQuestionnaireAnswerChanges,
  questionnaireAnswersDiffer,
} from './questionnaire-answer-audit.util';
import { readQuestionnaireBranch } from './questionnaire-branches';
import {
  generateQuestionnaireShareToken,
  hashQuestionnaireShareToken,
  questionnaireShareExpiry,
  resolveQuestionnaireShareDays,
} from './questionnaire-share-token.util';
import {
  canReviseQuestionnaire,
  canShareQuestionnaire,
  canTransitionQuestionnaireStatus,
  isQuestionnaireAnswerLocked,
  isQuestionnaireCompletionStatus,
} from './questionnaire-status.util';
import { matchQuestionnaireTemplates } from './questionnaire-template-match.util';
import {
  buildQuestionnaireVersionDefinition,
  readVersionDefinition,
} from './questionnaire-version.util';
import {
  isPublicQuestionnaireClosed,
  isPublicQuestionnaireOpen,
  normalizePublicQuestionnaireToken,
  toPublicQuestionnairePayload,
} from './public-questionnaire.util';
import type {
  CreateQuestionnaireFieldDto,
  CreateQuestionnaireShareDto,
  CreateQuestionnaireSubmissionDto,
  CreateQuestionnaireTemplateDto,
  QuestionnaireFieldType,
  QuestionnaireSubmissionStatus,
  ListQuestionnaireSubmissionsQueryDto,
  ListQuestionnaireTemplatesQueryDto,
  UpdateQuestionnaireFieldDto,
  UpdateQuestionnaireSubmissionDto,
  UpdateQuestionnaireTemplateDto,
} from './dto/questionnaire.dto';

const templateInclude = {
  fields: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
  _count: { select: { submissions: true } },
} satisfies Prisma.QuestionnaireTemplateInclude;

const submissionInclude = {
  template: {
    select: {
      id: true,
      name: true,
      version: true,
      status: true,
      branch: true,
    },
  },
  templateVersion: {
    select: {
      id: true,
      versionNumber: true,
      publishedAt: true,
    },
  },
  lead: {
    select: {
      id: true,
      name: true,
      assignedTo: true,
    },
  },
  responsibleUser: {
    select: {
      id: true,
      name: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.QuestionnaireSubmissionInclude;

const sharePublicSelect = {
  id: true,
  submissionId: true,
  status: true,
  expiresAt: true,
  revokedAt: true,
  createdAt: true,
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.QuestionnaireShareSelect;

type SubmissionAnswers = Record<string, unknown>;

type TemplateForSubmission = Prisma.QuestionnaireTemplateGetPayload<{
  include: { fields: true };
}>;

type NormalizedFieldOption = {
  label: string;
  value: string;
};

@Injectable()
export class QuestionnairesService {
  private readonly validationEngine = new ValidationEngine();
  private readonly ruleEngine = new RuleEngine();

  constructor(
    private readonly prisma: PrismaService,
    private readonly leads: LeadsService,
    private readonly activityEngine: ActivityEngineService,
    private readonly quotes: QuotesService,
    private readonly businessUnitAccess: BusinessUnitAccessService,
  ) {}

  async findTemplates(
    tenantId: string,
    query: ListQuestionnaireTemplatesQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildTemplateWhere(tenantId, query);

    const [total, templates] = await this.prisma.$transaction([
      this.prisma.questionnaireTemplate.count({ where }),
      this.prisma.questionnaireTemplate.findMany({
        where,
        include: templateInclude,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: templates,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findTemplate(tenantId: string, id: string) {
    const template = await this.prisma.questionnaireTemplate.findFirst({
      where: { id, tenantId },
      include: templateInclude,
    });
    if (!template) {
      throw new NotFoundException('Template de questionário não encontrado');
    }
    return template;
  }

  async createTemplate(
    tenantId: string,
    dto: CreateQuestionnaireTemplateDto,
    publishedById?: string,
  ) {
    if (dto.businessUnitId) {
      await this.ensureBusinessUnitBelongsToTenant(
        tenantId,
        dto.businessUnitId,
      );
    }
    const settings = this.mergeTemplateSettings(dto.settings, dto.branch);
    try {
      const template = await this.prisma.questionnaireTemplate.create({
        data: {
          tenantId,
          name: dto.name,
          description: dto.description,
          status: dto.status,
          version: dto.version,
          ...(dto.branch ? { branch: dto.branch } : {}),
          ...(dto.businessUnitId ? { businessUnitId: dto.businessUnitId } : {}),
          ...(settings ? { settings: this.toInputJson(settings) } : {}),
        },
        include: templateInclude,
      });
      if (!dto.branch) return template;
      await this.publishTemplateVersion(tenantId, template.id, publishedById);
      return this.findTemplate(tenantId, template.id);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.handleWriteError(error, 'Template já existe nesta versão');
    }
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    dto: UpdateQuestionnaireTemplateDto,
  ) {
    const current = await this.prisma.questionnaireTemplate.findFirst({
      where: { id, tenantId },
      select: { id: true, settings: true },
    });
    if (!current) {
      throw new NotFoundException('Template de questionário não encontrado');
    }
    if (dto.businessUnitId) {
      await this.ensureBusinessUnitBelongsToTenant(
        tenantId,
        dto.businessUnitId,
      );
    }
    const settings =
      dto.branch !== undefined || dto.settings !== undefined
        ? this.mergeTemplateSettings(
            dto.settings ??
              (this.isPlainObject(current.settings) ? current.settings : {}),
            dto.branch,
          )
        : undefined;

    try {
      return await this.prisma.questionnaireTemplate.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.version !== undefined ? { version: dto.version } : {}),
          ...(dto.branch !== undefined ? { branch: dto.branch } : {}),
          ...(dto.businessUnitId !== undefined
            ? { businessUnitId: dto.businessUnitId }
            : {}),
          ...(settings ? { settings: this.toInputJson(settings) } : {}),
        },
        include: templateInclude,
      });
    } catch (error) {
      this.handleWriteError(error, 'Template já existe nesta versão');
    }
  }

  async deleteTemplate(tenantId: string, id: string) {
    await this.ensureTemplateBelongsToTenant(tenantId, id);

    const submissions = await this.prisma.questionnaireSubmission.count({
      where: { tenantId, templateId: id },
    });
    if (submissions > 0) {
      const template = await this.prisma.questionnaireTemplate.update({
        where: { id },
        data: { status: 'archived' },
        include: templateInclude,
      });
      return { deleted: false, archived: true, template };
    }

    await this.prisma.questionnaireTemplate.delete({ where: { id } });
    return { deleted: true, id };
  }

  async createField(
    tenantId: string,
    templateId: string,
    dto: CreateQuestionnaireFieldDto,
  ) {
    await this.ensureTemplateBelongsToTenant(tenantId, templateId);
    const options = this.normalizeFieldOptions(dto.type, dto.options);
    if (this.fieldTypeUsesOptions(dto.type) && options === undefined) {
      throw new BadRequestException(
        'Campos de escolha precisam ter pelo menos uma opção',
      );
    }

    try {
      return await this.prisma.questionnaireField.create({
        data: {
          tenantId,
          templateId,
          key: dto.key,
          label: dto.label,
          type: dto.type,
          required: dto.required,
          order: dto.order,
          placeholder: dto.placeholder,
          helpText: dto.helpText,
          ...(options !== undefined
            ? { options: this.toInputJson(options) }
            : {}),
          ...(dto.validation !== undefined
            ? { validation: this.toInputJson(dto.validation) }
            : {}),
          ...(dto.settings !== undefined
            ? { settings: this.toInputJson(dto.settings) }
            : {}),
        },
      });
    } catch (error) {
      this.handleWriteError(error, 'Campo já existe neste template');
    }
  }

  async findFields(tenantId: string, templateId: string) {
    await this.ensureTemplateBelongsToTenant(tenantId, templateId);

    return this.prisma.questionnaireField.findMany({
      where: { tenantId, templateId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findField(tenantId: string, templateId: string, fieldId: string) {
    const field = await this.prisma.questionnaireField.findFirst({
      where: { id: fieldId, templateId, tenantId },
    });
    if (!field) {
      throw new NotFoundException('Campo de questionário não encontrado');
    }
    return field;
  }

  async updateField(
    tenantId: string,
    templateId: string,
    fieldId: string,
    dto: UpdateQuestionnaireFieldDto,
  ) {
    const current = await this.ensureFieldBelongsToTemplate(
      tenantId,
      templateId,
      fieldId,
    );
    const nextType = dto.type ?? current.type;
    const options = this.normalizeFieldOptions(nextType, dto.options);
    if (
      dto.type !== undefined &&
      this.fieldTypeUsesOptions(nextType) &&
      options === undefined &&
      this.getOptionValues(current.options).length === 0
    ) {
      throw new BadRequestException(
        'Campos de escolha precisam ter pelo menos uma opção',
      );
    }

    try {
      return await this.prisma.questionnaireField.update({
        where: { id: fieldId },
        data: {
          ...(dto.key !== undefined ? { key: dto.key } : {}),
          ...(dto.label !== undefined ? { label: dto.label } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.required !== undefined ? { required: dto.required } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
          ...(dto.placeholder !== undefined
            ? { placeholder: dto.placeholder }
            : {}),
          ...(dto.helpText !== undefined ? { helpText: dto.helpText } : {}),
          ...(options !== undefined
            ? { options: this.toInputJson(options) }
            : {}),
          ...(dto.validation !== undefined
            ? { validation: this.toInputJson(dto.validation) }
            : {}),
          ...(dto.settings !== undefined
            ? { settings: this.toInputJson(dto.settings) }
            : {}),
        },
      });
    } catch (error) {
      this.handleWriteError(error, 'Campo já existe neste template');
    }
  }

  async deleteField(tenantId: string, templateId: string, fieldId: string) {
    await this.ensureFieldBelongsToTemplate(tenantId, templateId, fieldId);
    await this.prisma.questionnaireField.delete({ where: { id: fieldId } });
    return { deleted: true, id: fieldId };
  }

  async findSubmissions(
    tenantId: string,
    query: ListQuestionnaireSubmissionsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    await this.assertListedReferencesVisible(tenantId, query, actor);
    const where = andWhere(
      this.buildSubmissionWhere(tenantId, query),
      await this.submissionListScope(actor),
    );

    const [total, submissions] = await this.prisma.$transaction([
      this.prisma.questionnaireSubmission.count({ where }),
      this.prisma.questionnaireSubmission.findMany({
        where,
        include: submissionInclude,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: submissions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findSubmission(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    const submission = await this.prisma.questionnaireSubmission.findFirst({
      where: andWhere(
        { id, tenantId },
        await this.submissionRecordScope(actor),
      ),
      include: {
        ...submissionInclude,
        templateVersion: {
          select: {
            id: true,
            versionNumber: true,
            publishedAt: true,
            definition: true,
          },
        },
      },
    });
    if (!submission) {
      throw new NotFoundException('Resposta de questionário não encontrada');
    }
    return submission;
  }

  async suggestTemplatesForLead(
    tenantId: string,
    leadId: string,
    actor?: BusinessUnitActor,
  ) {
    const normalizedLeadId = leadId?.trim();
    if (!normalizedLeadId) {
      throw new BadRequestException('Informe o lead.');
    }
    if (actor) {
      await this.businessUnitAccess.assertLeadVisible(
        actor,
        tenantId,
        normalizedLeadId,
      );
    }
    const lead = await this.prisma.lead.findFirst({
      where: { id: normalizedLeadId, tenantId },
      select: {
        id: true,
        interestCategories: true,
        businessUnit: { select: { type: true } },
      },
    });
    if (!lead) {
      throw new NotFoundException('Lead relacionado não encontrado');
    }

    const templates = await this.prisma.questionnaireTemplate.findMany({
      where: { tenantId, status: 'active' },
      select: {
        id: true,
        name: true,
        version: true,
        status: true,
        settings: true,
        fields: { select: { key: true } },
      },
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
      take: 100,
    });
    const evaluated = matchQuestionnaireTemplates({
      interests: lead.interestCategories,
      businessUnitType: lead.businessUnit?.type ?? null,
      templates,
    });
    const visible =
      evaluated.match === 'none'
        ? templates
        : templates.filter((template) =>
            evaluated.templateIds.includes(template.id),
          );

    return {
      leadId: lead.id,
      businessUnitType: lead.businessUnit?.type ?? null,
      interestCategories: lead.interestCategories,
      match: evaluated.match,
      reason: evaluated.reason ?? null,
      suggestedTemplateId: evaluated.suggestedTemplateId,
      templates: visible.map((template) => ({
        id: template.id,
        name: template.name,
        version: template.version,
        status: template.status,
        settings: template.settings,
      })),
    };
  }

  async createSubmission(
    tenantId: string,
    dto: CreateQuestionnaireSubmissionDto,
    performedById?: string,
    actor?: BusinessUnitActor,
  ) {
    await this.assertActorCanUseReferences(tenantId, dto, actor);
    if (
      actor &&
      !canViewAllBusinessUnits(actor) &&
      !dto.leadId &&
      !dto.customerId &&
      !dto.dealId
    ) {
      throw new BadRequestException(
        'A resposta precisa estar vinculada a um lead, negócio ou cliente da sua unidade.',
      );
    }
    await this.ensureSubmissionReferencesBelongToTenant(tenantId, dto);
    if (dto.leadId) {
      await this.assertTemplateMatchesLead(
        tenantId,
        dto.leadId,
        dto.templateId,
      );
    }
    const template = await this.getTemplateForSubmission(
      tenantId,
      dto.templateId,
    );
    this.validateTemplateIsSubmittable(template);
    const publishedVersion = await this.latestPublishedVersion(
      tenantId,
      dto.templateId,
    );
    const leadContext = dto.leadId
      ? await this.prisma.lead.findFirst({
          where: { id: dto.leadId, tenantId },
          select: { id: true, businessUnitId: true },
        })
      : null;
    if (dto.leadId && !leadContext) {
      throw new NotFoundException('Lead relacionado não encontrado');
    }
    this.assertTemplateBusinessUnit(
      template.businessUnitId,
      leadContext?.businessUnitId ?? null,
    );
    this.validateSubmissionAnswers(
      this.withPinnedFields(template, publishedVersion?.definition),
      dto.answers ?? {},
      dto.status ?? 'draft',
    );

    /**
     * Reaproveita o rascunho do mesmo lead e template.
     * Unicidade no banco exigiria índice parcial e migration; a corrida
     * entre duas criações simultâneas continua possível.
     */
    if ((dto.status ?? 'draft') === 'draft' && dto.leadId) {
      const draftWhere = {
        tenantId,
        leadId: dto.leadId,
        templateId: dto.templateId,
        status: 'draft' as const,
      };
      const scope = await this.submissionRecordScope(actor);
      const existingDraft = await this.prisma.questionnaireSubmission.findFirst(
        {
          where: scope ? { AND: [draftWhere, scope] } : draftWhere,
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
          select: { id: true, updatedAt: true, answers: true },
        },
      );
      if (existingDraft) {
        const incomingAnswers = dto.answers ?? {};
        const hasIncoming =
          this.isPlainObject(incomingAnswers) &&
          Object.keys(incomingAnswers).length > 0;
        if (!hasIncoming) {
          return this.findSubmission(tenantId, existingDraft.id, actor);
        }
        return this.updateSubmission(
          tenantId,
          existingDraft.id,
          {
            ...dto,
            expectedUpdatedAt: existingDraft.updatedAt.toISOString(),
          },
          performedById,
          actor,
        );
      }
    }

    const status = dto.status ?? 'draft';
    const branch = this.resolveBranch(
      readVersionDefinition(publishedVersion?.definition)?.branch ??
        template.branch,
      template.settings,
    );
    const businessUnitId =
      leadContext?.businessUnitId ?? template.businessUnitId ?? null;

    const submission = await this.prisma.questionnaireSubmission.create({
      data: {
        tenantId,
        templateId: dto.templateId,
        ...(publishedVersion ? { templateVersionId: publishedVersion.id } : {}),
        ...(branch ? { branch } : {}),
        mode: dto.mode,
        origin: dto.origin,
        status: dto.status,
        ...(dto.answers !== undefined
          ? { answers: this.toInputJson(dto.answers) }
          : {}),
        ...(dto.metadata !== undefined
          ? { metadata: this.toInputJson(dto.metadata) }
          : {}),
        leadId: dto.leadId,
        customerId: dto.customerId,
        dealId: dto.dealId,
        ...(businessUnitId ? { businessUnitId } : {}),
        ...(performedById ? { responsibleUserId: performedById } : {}),
        startedAt: new Date(),
        submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : undefined,
        ...(isQuestionnaireCompletionStatus(status)
          ? { completedAt: new Date() }
          : {}),
      },
      include: submissionInclude,
    });

    if (
      (submission.status === 'submitted' ||
        submission.status === 'completed') &&
      submission.leadId
    ) {
      await this.leads.touchLastContact(tenantId, submission.leadId);
    }

    await this.publishQuestionnaireStatusEvent(
      tenantId,
      performedById,
      submission,
      null,
      submission.status,
    );

    return submission;
  }

  async updateSubmission(
    tenantId: string,
    id: string,
    dto: UpdateQuestionnaireSubmissionDto,
    performedById?: string,
    actor?: BusinessUnitActor,
  ) {
    const current = await this.getSubmissionForUpdate(tenantId, id, actor);
    await this.assertActorCanUseReferences(tenantId, dto, actor);
    await this.ensureSubmissionReferencesBelongToTenant(tenantId, dto);
    const nextStatus = dto.status ?? current.status;
    if (!canTransitionQuestionnaireStatus(current.status, nextStatus)) {
      throw new BadRequestException(
        'Transição de status do questionário não permitida.',
      );
    }
    const previousAnswers = this.toAnswerRecord(current.answers);
    this.assertLockedSubmissionUnchanged(current, dto, previousAnswers);
    const leadId = dto.leadId ?? current.leadId ?? undefined;
    if (leadId && dto.templateId) {
      await this.assertTemplateMatchesLead(tenantId, leadId, dto.templateId);
    }
    this.assertDraftIsNotStale(current.updatedAt, dto.expectedUpdatedAt);
    const template = await this.getTemplateForSubmission(
      tenantId,
      dto.templateId ?? current.templateId,
    );
    this.validateTemplateIsSubmittable(template);
    const pinnedDefinition = await this.definitionForSubmission(
      tenantId,
      current.templateVersionId,
    );
    const validationTemplate = this.withPinnedFields(
      template,
      pinnedDefinition,
    );
    const answers = dto.answers !== undefined ? dto.answers : previousAnswers;
    this.validateSubmissionAnswers(validationTemplate, answers, nextStatus);

    const answerChanges =
      dto.answers !== undefined
        ? buildQuestionnaireAnswerChanges(
            validationTemplate.fields,
            previousAnswers,
            dto.answers,
          )
        : [];

    const submission = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.questionnaireSubmission.update({
        where: { id },
        data: {
          ...(dto.templateId !== undefined
            ? { templateId: dto.templateId }
            : {}),
          ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
          ...(dto.origin !== undefined ? { origin: dto.origin } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(answerChanges.length > 0
            ? { answers: this.toInputJson(answers) }
            : {}),
          ...(dto.metadata !== undefined
            ? { metadata: this.toInputJson(dto.metadata) }
            : {}),
          ...(dto.leadId !== undefined ? { leadId: dto.leadId } : {}),
          ...(dto.customerId !== undefined
            ? { customerId: dto.customerId }
            : {}),
          ...(dto.dealId !== undefined ? { dealId: dto.dealId } : {}),
          ...(dto.submittedAt !== undefined
            ? { submittedAt: new Date(dto.submittedAt) }
            : {}),
          ...(isQuestionnaireCompletionStatus(nextStatus) &&
          !current.completedAt
            ? { completedAt: new Date() }
            : {}),
          ...(performedById ? { updatedById: performedById } : {}),
        },
        include: submissionInclude,
      });

      if (answerChanges.length > 0) {
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: performedById,
            action: 'questionnaire_submission.answers_updated',
            resource: 'QuestionnaireSubmission',
            resourceId: id,
            metadata: this.toInputJson({
              submissionId: id,
              templateId: updated.templateId,
              status: updated.status,
              changedAt: updated.updatedAt.toISOString(),
              changedById: performedById ?? null,
              changes: answerChanges,
            }),
            severity: 'info',
          },
        });
      }

      if (nextStatus !== current.status) {
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: performedById,
            action: 'questionnaire_submission.status_changed',
            resource: 'QuestionnaireSubmission',
            resourceId: id,
            metadata: this.toInputJson({
              submissionId: id,
              from: current.status,
              to: nextStatus,
              leadId: updated.leadId,
            }),
            severity: 'info',
          },
        });
      }

      return updated;
    });

    if (nextStatus === 'submitted' && submission.leadId) {
      await this.leads.touchLastContact(tenantId, submission.leadId);
    }
    if (
      nextStatus === 'completed' &&
      current.status !== 'completed' &&
      submission.leadId
    ) {
      await this.leads.touchLastContact(tenantId, submission.leadId);
    }

    await this.publishQuestionnaireStatusEvent(
      tenantId,
      performedById,
      submission,
      current.status,
      nextStatus,
    );

    return submission;
  }

  async deleteSubmission(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    const current = await this.getSubmissionForUpdate(tenantId, id, actor);
    if (isQuestionnaireAnswerLocked(current.status)) {
      throw new ConflictException(
        'Questionários concluídos permanecem no histórico e não podem ser excluídos.',
      );
    }
    await this.prisma.questionnaireSubmission.delete({ where: { id } });
    return { deleted: true, id };
  }

  async ensureIntelligentForm(
    tenantId: string,
    branchInput: string,
    publishedById?: string,
  ) {
    if (!isIntelligentFormBranch(branchInput)) {
      throw new BadRequestException('Ramo de questionário inválido');
    }
    const form = getIntelligentForm(branchInput);
    const fingerprint = intelligentFormFingerprint(form);
    const candidates = await this.prisma.questionnaireTemplate.findMany({
      where: {
        tenantId,
        branch: branchInput,
        status: { not: 'archived' },
      },
      include: { fields: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    const current = candidates.find((template) =>
      this.isIntelligentTemplate(template.settings),
    );
    const template =
      current ??
      (await this.prisma.questionnaireTemplate.create({
        data: {
          tenantId,
          name: form.name,
          description: form.description,
          status: 'active',
          version: 1,
          branch: branchInput,
          settings: this.toInputJson(
            this.intelligentSettings(form, fingerprint),
          ),
        },
        include: { fields: true },
      }));
    const storedFingerprint = this.readFingerprint(template.settings);
    if (!current || storedFingerprint !== fingerprint) {
      await this.syncIntelligentFields(tenantId, template.id, form.fields);
      await this.prisma.questionnaireTemplate.update({
        where: { id: template.id },
        data: {
          name: form.name,
          description: form.description,
          status: 'active',
          branch: branchInput,
          settings: this.toInputJson(
            this.intelligentSettings(form, fingerprint, template.settings),
          ),
        },
      });
      await this.publishTemplateVersion(tenantId, template.id, publishedById);
    }
    return this.findTemplate(tenantId, template.id);
  }

  async publishTemplateVersion(
    tenantId: string,
    templateId: string,
    publishedById?: string,
  ) {
    const template = await this.getTemplateForSubmission(tenantId, templateId);
    const branch = this.resolveBranch(template.branch, template.settings);
    const latest = await this.latestPublishedVersion(tenantId, templateId);
    const nextNumber = latest
      ? latest.versionNumber + 1
      : Math.max(template.version, 1);
    const settings = this.isPlainObject(template.settings)
      ? template.settings
      : {};
    const catalogVersion =
      typeof settings.catalogVersion === 'number'
        ? settings.catalogVersion
        : undefined;
    const definition = buildQuestionnaireVersionDefinition({
      branch,
      fields: template.fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        order: field.order,
        placeholder: field.placeholder,
        helpText: field.helpText,
        options: field.options,
        validation: field.validation,
        settings: field.settings,
      })),
      catalogVersion,
      rules: settings.rules,
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const version = await tx.questionnaireTemplateVersion.create({
          data: {
            tenantId,
            templateId,
            versionNumber: nextNumber,
            definition: this.toInputJson(definition),
            ...(publishedById ? { publishedById } : {}),
          },
        });
        await tx.questionnaireTemplate.update({
          where: { id: templateId },
          data: {
            version: nextNumber,
            ...(branch ? { branch } : {}),
          },
        });
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: publishedById,
            action: 'questionnaire_template.version_published',
            resource: 'QuestionnaireTemplateVersion',
            resourceId: version.id,
            metadata: this.toInputJson({
              templateId,
              versionNumber: nextNumber,
              branch,
              sectionKeys: definition.sections.map((section) => section.key),
              fieldCount: definition.fields.length,
            }),
            severity: 'info',
          },
        });
        return version;
      });
    } catch (error) {
      this.handleWriteError(
        error,
        'Esta versão do questionário já foi publicada',
      );
    }
  }

  async listTemplateVersions(tenantId: string, templateId: string) {
    await this.ensureTemplateBelongsToTenant(tenantId, templateId);
    return this.prisma.questionnaireTemplateVersion.findMany({
      where: { tenantId, templateId },
      orderBy: [{ versionNumber: 'desc' }],
      select: {
        id: true,
        templateId: true,
        versionNumber: true,
        definition: true,
        publishedAt: true,
        publishedById: true,
        createdAt: true,
      },
    });
  }

  async createShare(
    tenantId: string,
    submissionId: string,
    dto: CreateQuestionnaireShareDto,
    performedById?: string,
    actor?: BusinessUnitActor,
  ) {
    const days = resolveQuestionnaireShareDays(dto.expiresInDays);
    if (days === null) {
      throw new BadRequestException(
        'A validade do compartilhamento deve ficar entre 1 e 30 dias.',
      );
    }
    const current = await this.getSubmissionForUpdate(
      tenantId,
      submissionId,
      actor,
    );
    if (
      !canShareQuestionnaire(current.status) ||
      !canTransitionQuestionnaireStatus(current.status, 'pending_client')
    ) {
      throw new ConflictException(
        'Este questionário não pode receber um link externo.',
      );
    }

    const token = generateQuestionnaireShareToken();
    const tokenHash = hashQuestionnaireShareToken(token);
    const expiresAt = questionnaireShareExpiry(days);
    const share = await this.prisma.$transaction(async (tx) => {
      await tx.questionnaireShare.updateMany({
        where: { tenantId, submissionId, status: 'active' },
        data: { status: 'revoked', revokedAt: new Date() },
      });
      const created = await tx.questionnaireShare.create({
        data: {
          tenantId,
          submissionId,
          tokenHash,
          expiresAt,
          status: 'active',
          ...(performedById ? { createdById: performedById } : {}),
        },
        select: sharePublicSelect,
      });
      await tx.questionnaireSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'pending_client',
          mode: 'EXTERNAL',
          ...(performedById ? { updatedById: performedById } : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: performedById,
          action: 'questionnaire_share.created',
          resource: 'QuestionnaireShare',
          resourceId: created.id,
          metadata: this.toInputJson({
            shareId: created.id,
            submissionId,
            expiresAt: expiresAt.toISOString(),
            status: 'active',
          }),
          severity: 'info',
        },
      });
      return created;
    });

    return { ...share, token };
  }

  async listShares(
    tenantId: string,
    submissionId: string,
    actor?: BusinessUnitActor,
  ) {
    await this.getSubmissionForUpdate(tenantId, submissionId, actor);
    await this.expireDueShares(tenantId, submissionId);
    return this.prisma.questionnaireShare.findMany({
      where: { tenantId, submissionId },
      orderBy: [{ createdAt: 'desc' }],
      select: sharePublicSelect,
    });
  }

  async revokeShare(
    tenantId: string,
    shareId: string,
    performedById?: string,
    actor?: BusinessUnitActor,
  ) {
    const share = await this.prisma.questionnaireShare.findFirst({
      where: { id: shareId, tenantId },
      select: { id: true, status: true, submissionId: true },
    });
    if (!share) {
      throw new NotFoundException('Compartilhamento não encontrado');
    }
    await this.getSubmissionForUpdate(tenantId, share.submissionId, actor);
    await this.expireDueShares(tenantId, share.submissionId);
    if (share.status === 'revoked' || share.status === 'expired') {
      return this.prisma.questionnaireShare.findFirst({
        where: { id: shareId, tenantId },
        select: sharePublicSelect,
      });
    }

    const revoked = await this.prisma.questionnaireShare.update({
      where: { id: shareId },
      data: { status: 'revoked', revokedAt: new Date() },
      select: sharePublicSelect,
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: performedById,
        action: 'questionnaire_share.revoked',
        resource: 'QuestionnaireShare',
        resourceId: shareId,
        metadata: this.toInputJson({
          shareId,
          submissionId: share.submissionId,
        }),
        severity: 'info',
      },
    });
    return revoked;
  }

  async openPublicQuestionnaire(token: string) {
    const resolved = await this.resolvePublicShare(token);
    if (
      resolved.submission.status === 'pending_client' ||
      resolved.submission.status === 'draft'
    ) {
      await this.prisma.questionnaireSubmission.update({
        where: { id: resolved.submission.id },
        data: {
          status: 'in_progress',
          mode: 'EXTERNAL',
          ...(resolved.submission.startedAt ? {} : { startedAt: new Date() }),
        },
      });
      resolved.submission.status = 'in_progress';
    }
    return this.presentPublicQuestionnaire(resolved);
  }

  async savePublicQuestionnaire(
    token: string,
    answers: Record<string, unknown>,
  ) {
    const resolved = await this.resolvePublicShare(token);
    this.assertPublicQuestionnaireWritable(resolved.submission.status);
    this.assertPublicAnswerSize(answers);
    const pinned = await this.pinnedPublicTemplate(resolved);
    this.validateSubmissionAnswers(pinned, answers, 'draft');
    const visibleAnswers = this.filterVisibleAnswers(pinned, answers);
    await this.prisma.questionnaireSubmission.update({
      where: { id: resolved.submission.id },
      data: {
        answers: this.toInputJson(visibleAnswers),
        status: 'in_progress',
        mode: 'EXTERNAL',
        ...(resolved.submission.startedAt ? {} : { startedAt: new Date() }),
      },
    });
    return { saved: true, status: 'in_progress' as const };
  }

  async completePublicQuestionnaire(
    token: string,
    answers: Record<string, unknown>,
  ) {
    const resolved = await this.resolvePublicShare(token);
    this.assertPublicQuestionnaireWritable(resolved.submission.status);
    this.assertPublicAnswerSize(answers);
    const pinned = await this.pinnedPublicTemplate(resolved);
    this.validateSubmissionAnswers(pinned, answers, 'completed');
    const visibleAnswers = this.filterVisibleAnswers(pinned, answers);
    await this.prisma.questionnaireSubmission.update({
      where: { id: resolved.submission.id },
      data: {
        answers: this.toInputJson(visibleAnswers),
        status: 'completed',
        mode: 'EXTERNAL',
        completedAt: new Date(),
      },
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId: resolved.share.tenantId,
        userId: resolved.share.createdById,
        action: 'questionnaire_submission.completed_public',
        resource: 'QuestionnaireSubmission',
        resourceId: resolved.submission.id,
        metadata: this.toInputJson({
          submissionId: resolved.submission.id,
          shareId: resolved.share.id,
          status: 'completed',
        }),
        severity: 'info',
      },
    });
    if (resolved.share.createdById && resolved.submission.leadId) {
      try {
        await this.activityEngine.publish({
          tenantId: resolved.share.tenantId,
          performedById: resolved.share.createdById,
          operationalEventKind: 'questionnaire_completed',
          subject: `Questionário concluído pelo cliente — ${resolved.submission.template.name}`,
          description: 'O cliente enviou as respostas pelo link.',
          leadId: resolved.submission.leadId,
          metadata: {
            submissionId: resolved.submission.id,
            status: 'completed',
          },
        });
      } catch {
        // A conclusão permanece mesmo se a timeline não puder ser registrada.
      }
    }
    return toPublicQuestionnairePayload({
      title: resolved.submission.template.name,
      branch: resolved.definition.branch ?? resolved.submission.branch,
      versionNumber: resolved.submission.templateVersion?.versionNumber ?? null,
      expiresAt: resolved.share.expiresAt,
      status: 'completed',
      definition: null,
    });
  }

  async reviseSubmission(
    tenantId: string,
    id: string,
    performedById?: string,
    actor?: BusinessUnitActor,
  ) {
    const current = await this.getSubmissionForUpdate(tenantId, id, actor);
    if (!canReviseQuestionnaire(current.status)) {
      throw new ConflictException(
        'Somente um questionário concluído pode gerar uma nova resposta de correção.',
      );
    }
    const source = await this.prisma.questionnaireSubmission.findFirst({
      where: { id, tenantId },
      select: {
        templateId: true,
        templateVersionId: true,
        branch: true,
        origin: true,
        answers: true,
        leadId: true,
        customerId: true,
        dealId: true,
        businessUnitId: true,
      },
    });
    if (!source) {
      throw new NotFoundException('Resposta de questionário não encontrada');
    }

    const created = await this.prisma.questionnaireSubmission.create({
      data: {
        tenantId,
        templateId: source.templateId,
        ...(source.templateVersionId
          ? { templateVersionId: source.templateVersionId }
          : {}),
        ...(source.branch ? { branch: source.branch } : {}),
        mode: 'INTERNAL',
        origin: source.origin,
        status: 'draft',
        answers: this.toInputJson(this.toAnswerRecord(source.answers)),
        metadata: this.toInputJson({ revisedFromSubmissionId: id }),
        leadId: source.leadId,
        customerId: source.customerId,
        dealId: source.dealId,
        ...(source.businessUnitId
          ? { businessUnitId: source.businessUnitId }
          : {}),
        ...(performedById
          ? { responsibleUserId: performedById, updatedById: performedById }
          : {}),
        startedAt: new Date(),
      },
      include: submissionInclude,
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: performedById,
        action: 'questionnaire_submission.revision_created',
        resource: 'QuestionnaireSubmission',
        resourceId: created.id,
        metadata: this.toInputJson({
          fromSubmissionId: id,
          submissionId: created.id,
          leadId: source.leadId,
        }),
        severity: 'info',
      },
    });
    return created;
  }

  private buildTemplateWhere(
    tenantId: string,
    query: ListQuestionnaireTemplatesQueryDto,
  ): Prisma.QuestionnaireTemplateWhereInput {
    const search = query.search?.trim();

    return {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.branch ? { branch: query.branch } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };
  }

  private buildSubmissionWhere(
    tenantId: string,
    query: ListQuestionnaireSubmissionsQueryDto,
  ): Prisma.QuestionnaireSubmissionWhereInput {
    const createdAt = this.buildSubmissionDateRange(
      query.dateFrom,
      query.dateTo,
    );

    return {
      tenantId,
      ...(query.templateId ? { templateId: query.templateId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.origin ? { origin: query.origin } : {}),
      ...(query.mode ? { mode: query.mode } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.dealId ? { dealId: query.dealId } : {}),
      ...(createdAt ? { createdAt } : {}),
    };
  }

  private buildSubmissionDateRange(dateFrom?: string, dateTo?: string) {
    if (!dateFrom && !dateTo) return undefined;

    return {
      ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
    };
  }

  private async ensureTemplateBelongsToTenant(tenantId: string, id: string) {
    const template = await this.prisma.questionnaireTemplate.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!template) {
      throw new NotFoundException('Template de questionário não encontrado');
    }
  }

  private async ensureFieldBelongsToTemplate(
    tenantId: string,
    templateId: string,
    fieldId: string,
  ) {
    const field = await this.prisma.questionnaireField.findFirst({
      where: { id: fieldId, templateId, tenantId },
      select: { id: true, type: true, options: true },
    });
    if (!field) {
      throw new NotFoundException('Campo de questionário não encontrado');
    }
    return field;
  }

  private async ensureSubmissionBelongsToTenant(tenantId: string, id: string) {
    const submission = await this.prisma.questionnaireSubmission.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!submission) {
      throw new NotFoundException('Resposta de questionário não encontrada');
    }
  }

  private async getSubmissionForUpdate(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    const submission = await this.prisma.questionnaireSubmission.findFirst({
      where: andWhere(
        { id, tenantId },
        await this.submissionRecordScope(actor),
      ),
      select: {
        id: true,
        templateId: true,
        templateVersionId: true,
        status: true,
        mode: true,
        answers: true,
        leadId: true,
        customerId: true,
        dealId: true,
        completedAt: true,
        updatedAt: true,
      },
    });
    if (!submission) {
      throw new NotFoundException('Resposta de questionário não encontrada');
    }
    return submission;
  }

  private assertDraftIsNotStale(updatedAt: Date, expectedUpdatedAt?: string) {
    if (!expectedUpdatedAt) return;
    const expected = new Date(expectedUpdatedAt).getTime();
    if (Number.isNaN(expected)) return;
    if (updatedAt.getTime() > expected) {
      throw new ConflictException(
        'Existe um rascunho mais recente. Recarregue antes de salvar.',
      );
    }
  }

  private async submissionListScope(actor?: BusinessUnitActor) {
    if (!actor) return undefined;
    return relatedLeadCustomerDealWhere(
      await this.businessUnitAccess.resolveIds(actor),
    );
  }

  private async submissionRecordScope(actor?: BusinessUnitActor) {
    if (!actor) return undefined;
    return relatedLeadCustomerDealWhere(
      await this.businessUnitAccess.resolveRecordIds(actor),
    );
  }

  private async assertListedReferencesVisible(
    tenantId: string,
    query: ListQuestionnaireSubmissionsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    if (!actor) return;
    await this.assertActorCanUseReferences(
      tenantId,
      {
        leadId: query.leadId,
        customerId: query.customerId,
        dealId: query.dealId,
      },
      actor,
    );
  }

  private async assertActorCanUseReferences(
    tenantId: string,
    dto: { leadId?: string; customerId?: string; dealId?: string },
    actor?: BusinessUnitActor,
  ) {
    if (!actor) return;
    if (dto.leadId) {
      await this.businessUnitAccess.assertLeadVisible(
        actor,
        tenantId,
        dto.leadId,
      );
    }
    if (dto.customerId) {
      await this.businessUnitAccess.assertCustomerVisible(
        actor,
        tenantId,
        dto.customerId,
      );
    }
    if (dto.dealId) {
      await this.businessUnitAccess.assertDealVisible(
        actor,
        tenantId,
        dto.dealId,
      );
    }
  }

  private async assertTemplateMatchesLead(
    tenantId: string,
    leadId: string,
    templateId: string,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: {
        interestCategories: true,
        businessUnit: { select: { type: true } },
      },
    });
    if (!lead) {
      throw new NotFoundException('Lead relacionado não encontrado');
    }
    const templates = await this.prisma.questionnaireTemplate.findMany({
      where: { tenantId, status: 'active' },
      select: {
        id: true,
        settings: true,
        fields: { select: { key: true } },
      },
      take: 100,
    });
    const evaluated = matchQuestionnaireTemplates({
      interests: lead.interestCategories,
      businessUnitType: lead.businessUnit?.type ?? null,
      templates,
    });
    if (evaluated.match === 'none') return;
    if (!evaluated.templateIds.includes(templateId)) {
      throw new BadRequestException(
        'Este template não corresponde ao produto e à unidade do lead.',
      );
    }
  }

  private async ensureSubmissionReferencesBelongToTenant(
    tenantId: string,
    dto: {
      templateId?: string;
      leadId?: string;
      customerId?: string;
      dealId?: string;
    },
  ) {
    if (dto.templateId) {
      await this.ensureTemplateBelongsToTenant(tenantId, dto.templateId);
    }
    await Promise.all([
      dto.leadId ? this.ensureLeadBelongsToTenant(tenantId, dto.leadId) : null,
      dto.customerId
        ? this.ensureCustomerBelongsToTenant(tenantId, dto.customerId)
        : null,
      dto.dealId ? this.ensureDealBelongsToTenant(tenantId, dto.dealId) : null,
    ]);
  }

  private async getTemplateForSubmission(
    tenantId: string,
    templateId: string,
  ): Promise<TemplateForSubmission> {
    const template = await this.prisma.questionnaireTemplate.findFirst({
      where: { id: templateId, tenantId },
      include: {
        fields: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (!template) {
      throw new NotFoundException('Template de questionário não encontrado');
    }
    return template;
  }

  private validateTemplateIsSubmittable(template: TemplateForSubmission) {
    if (template.status !== 'active') {
      throw new BadRequestException(
        'Somente templates ativos podem receber respostas',
      );
    }
  }

  private validateSubmissionAnswers(
    template: TemplateForSubmission,
    answers: SubmissionAnswers,
    status: QuestionnaireSubmissionStatus,
  ) {
    if (!this.isPlainObject(answers)) {
      throw new BadRequestException('Respostas devem ser um objeto JSON');
    }

    const settings = this.isPlainObject(template.settings)
      ? (template.settings as Record<string, unknown>)
      : {};
    const profile = resolveValidationProfile(settings);
    const mode = isQuestionnaireCompletionStatus(status) ? 'finalize' : 'draft';

    const descriptors = fieldsToDescriptors(
      template.fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        order: field.order,
        placeholder: field.placeholder,
        helpText: field.helpText,
        options: field.options,
        validation: field.validation,
        settings: field.settings,
      })),
    );

    const templateDescriptor = {
      name: template.name,
      settings,
      fields: descriptors,
    };

    const ruleResult = this.ruleEngine.evaluateSubmission({
      template: templateDescriptor,
      answers,
    });

    const effectiveAnswers = this.ruleEngine.applyValueOverrides(
      answers,
      ruleResult,
    );

    const context = createServerValidationContext(effectiveAnswers, {
      mode,
      profile,
      enforceRequired: mode === 'finalize',
      visibleFieldKeys: ruleResult.visibleFieldKeys,
      requiredFieldKeys: ruleResult.requiredFieldKeys,
      optionalFieldKeys: ruleResult.optionalFieldKeys,
      disabledFieldKeys: ruleResult.disabledFieldKeys,
    });

    const result = this.validationEngine.validateSubmission(
      descriptors,
      effectiveAnswers,
      context,
    );

    if (!result.valid) {
      throw new BadRequestException(
        result.errors.map((error) => error.message),
      );
    }
  }

  private getOptionValues(options: Prisma.JsonValue | null): string[] {
    if (!Array.isArray(options)) return [];
    return options
      .map((option) => {
        if (!this.isPlainObject(option)) return null;
        const value = option.value;
        return typeof value === 'string' ? value : null;
      })
      .filter((value): value is string => Boolean(value));
  }

  private normalizeFieldOptions(
    type: QuestionnaireFieldType | undefined,
    options: unknown[] | undefined,
  ): NormalizedFieldOption[] | undefined {
    if (options === undefined) return undefined;
    if (type && !this.fieldTypeUsesOptions(type)) return [];

    const usedValues = new Set<string>();
    const normalized = options
      .map((option, index) => this.normalizeFieldOption(option, index))
      .filter((option): option is NormalizedFieldOption => Boolean(option))
      .map((option) => {
        const value = this.uniqueOptionValue(option.value, usedValues);
        usedValues.add(value);
        return { ...option, value };
      });
    if (type && this.fieldTypeUsesOptions(type) && normalized.length === 0) {
      throw new BadRequestException(
        'Campos de escolha precisam ter pelo menos uma opção',
      );
    }

    return normalized;
  }

  private normalizeFieldOption(
    option: unknown,
    index: number,
  ): NormalizedFieldOption | null {
    if (typeof option === 'string') {
      const label = option.trim();
      return label
        ? { label, value: this.slugifyOptionValue(label, index) }
        : null;
    }
    if (!this.isPlainObject(option)) return null;

    const label =
      typeof option.label === 'string' && option.label.trim()
        ? option.label.trim()
        : typeof option.value === 'string' && option.value.trim()
          ? option.value.trim()
          : null;
    if (!label) return null;

    const value =
      typeof option.value === 'string' && option.value.trim()
        ? option.value.trim()
        : this.slugifyOptionValue(label, index);

    return { label, value };
  }

  private fieldTypeUsesOptions(type: QuestionnaireFieldType) {
    return type === 'SELECT' || type === 'MULTI_SELECT';
  }

  private slugifyOptionValue(label: string, index: number) {
    const slug = label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    return slug || `opcao_${index + 1}`;
  }

  private uniqueOptionValue(value: string, usedValues: Set<string>) {
    if (!usedValues.has(value)) return value;

    let index = 2;
    while (usedValues.has(`${value}_${index}`)) index += 1;
    return `${value}_${index}`;
  }

  private intelligentSettings(
    form: IntelligentFormDefinition,
    fingerprint: string,
    previous?: unknown,
  ) {
    const base = this.isPlainObject(previous) ? previous : {};
    return {
      ...base,
      intelligentForm: true,
      engineVersion: 2,
      branch: form.branch,
      wizardBranch: form.branch,
      catalogVersion: form.catalogVersion,
      catalogFingerprint: fingerprint,
      rules: form.rules,
    };
  }

  private isIntelligentTemplate(settings: unknown) {
    return this.isPlainObject(settings) && settings.intelligentForm === true;
  }

  private readFingerprint(settings: unknown) {
    if (!this.isPlainObject(settings)) return null;
    const fingerprint = settings.catalogFingerprint;
    return typeof fingerprint === 'string' ? fingerprint : null;
  }

  private intelligentFieldData(field: IntelligentFormField) {
    return {
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      order: field.order,
      placeholder: field.placeholder ?? null,
      helpText: field.helpText ?? null,
      options: field.options
        ? this.toInputJson(field.options)
        : Prisma.JsonNull,
      validation: field.validation
        ? this.toInputJson(field.validation)
        : Prisma.JsonNull,
      settings: this.toInputJson({
        section: field.sectionKey,
        sectionTitle: field.sectionTitle,
        ...(field.mask ? { mask: field.mask } : {}),
        essential: field.required,
      }),
    };
  }

  private async syncIntelligentFields(
    tenantId: string,
    templateId: string,
    fields: readonly IntelligentFormField[],
  ) {
    const existing = await this.prisma.questionnaireField.findMany({
      where: { tenantId, templateId },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const field of fields) {
        const data = this.intelligentFieldData(field);
        const found = existing.find((item) => item.key === field.key);
        if (!found) {
          await tx.questionnaireField.create({
            data: { tenantId, templateId, ...data },
          });
          continue;
        }
        await tx.questionnaireField.update({
          where: { id: found.id },
          data,
        });
      }
    });
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  private toAnswerRecord(value: Prisma.JsonValue): SubmissionAnswers {
    return this.isPlainObject(value) ? value : {};
  }

  private async ensureLeadBelongsToTenant(tenantId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!lead) {
      throw new NotFoundException('Lead relacionado não encontrado');
    }
  }

  private async ensureCustomerBelongsToTenant(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente relacionado não encontrado');
    }
  }

  private async ensureDealBelongsToTenant(tenantId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!deal) {
      throw new NotFoundException('Negócio relacionado não encontrado');
    }
  }

  private async publishQuestionnaireStatusEvent(
    tenantId: string,
    performedById: string | undefined,
    submission: Prisma.QuestionnaireSubmissionGetPayload<{
      include: typeof submissionInclude;
    }>,
    previousStatus: QuestionnaireSubmissionStatus | null,
    nextStatus: QuestionnaireSubmissionStatus,
  ) {
    if (!performedById) return;
    if (previousStatus === nextStatus) return;

    const templateName = submission.template?.name ?? 'Questionário';
    const relations = {
      leadId: submission.leadId,
      dealId: submission.dealId,
      customerId: submission.customerId,
    };

    if (nextStatus === 'submitted' && previousStatus !== 'submitted') {
      await this.activityEngine.publish({
        tenantId,
        performedById,
        operationalEventKind: 'questionnaire_submitted',
        subject: `Questionário enviado — ${templateName}`,
        description: 'Resposta comercial registrada na timeline.',
        leadId: relations.leadId,
        dealId: relations.dealId,
        customerId: relations.customerId,
        metadata: {
          submissionId: submission.id,
          templateId: submission.templateId,
          status: nextStatus,
        },
      });

      await this.quotes.syncComparisonFromSubmission(
        tenantId,
        {
          id: submission.id,
          leadId: submission.leadId,
          dealId: submission.dealId,
          customerId: submission.customerId,
        },
        'received',
        performedById,
      );
    }

    if (nextStatus === 'reviewed' && previousStatus !== 'reviewed') {
      await this.activityEngine.publish({
        tenantId,
        performedById,
        operationalEventKind: 'questionnaire_reviewed',
        subject: `Questionário revisado — ${templateName}`,
        description: 'Revisão comercial concluída.',
        leadId: relations.leadId,
        dealId: relations.dealId,
        customerId: relations.customerId,
        metadata: {
          submissionId: submission.id,
          templateId: submission.templateId,
          status: nextStatus,
        },
      });

      await this.quotes.syncComparisonFromSubmission(
        tenantId,
        {
          id: submission.id,
          leadId: submission.leadId,
          dealId: submission.dealId,
          customerId: submission.customerId,
        },
        'in_analysis',
        performedById,
      );
    }
  }

  private toInputJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private resolveBranch(
    branch: string | null | undefined,
    settings: unknown,
  ): QuestionnaireBranch | null {
    return readQuestionnaireBranch({ branch, settings });
  }

  private mergeTemplateSettings(
    settings: Record<string, unknown> | undefined,
    branch?: string,
  ) {
    if (!branch && !settings) return undefined;
    return {
      ...(settings ?? {}),
      ...(branch ? { branch } : {}),
    };
  }

  private assertTemplateBusinessUnit(
    templateBusinessUnitId: string | null | undefined,
    leadBusinessUnitId: string | null | undefined,
  ) {
    if (
      templateBusinessUnitId &&
      leadBusinessUnitId &&
      templateBusinessUnitId !== leadBusinessUnitId
    ) {
      throw new BadRequestException(
        'O questionário precisa usar a unidade de negócio do lead.',
      );
    }
  }

  private assertLockedSubmissionUnchanged(
    current: {
      status: QuestionnaireSubmissionStatus;
      templateId: string;
      leadId: string | null;
      customerId: string | null;
      dealId: string | null;
    },
    dto: UpdateQuestionnaireSubmissionDto,
    previousAnswers: SubmissionAnswers,
  ) {
    if (!isQuestionnaireAnswerLocked(current.status)) return;
    const answersChanged =
      dto.answers !== undefined &&
      questionnaireAnswersDiffer(previousAnswers, dto.answers);
    const linkChanged =
      (dto.templateId !== undefined && dto.templateId !== current.templateId) ||
      (dto.leadId !== undefined && dto.leadId !== current.leadId) ||
      (dto.customerId !== undefined && dto.customerId !== current.customerId) ||
      (dto.dealId !== undefined && dto.dealId !== current.dealId);
    if (answersChanged || linkChanged) {
      throw new ConflictException(
        'Questionário concluído não pode ser alterado. Crie uma revisão para corrigir as respostas.',
      );
    }
  }

  private assertPublicAnswerSize(answers: Record<string, unknown>) {
    if (!this.isPlainObject(answers)) {
      throw new BadRequestException('Respostas devem ser um objeto JSON');
    }
    if (JSON.stringify(answers).length > 200_000) {
      throw new BadRequestException(
        'As respostas excedem o tamanho permitido.',
      );
    }
  }

  private assertPublicQuestionnaireWritable(status: string) {
    if (isPublicQuestionnaireClosed(status)) {
      throw new ConflictException('Este questionário já foi enviado.');
    }
    if (!isPublicQuestionnaireOpen(status)) {
      throw new GoneException('Este link não aceita mais respostas.');
    }
  }

  private async resolvePublicShare(token: string) {
    const normalized = normalizePublicQuestionnaireToken(token);
    if (!normalized) {
      throw new NotFoundException('Link inválido ou expirado.');
    }
    const share = await this.prisma.questionnaireShare.findUnique({
      where: { tokenHash: hashQuestionnaireShareToken(normalized) },
      select: {
        id: true,
        tenantId: true,
        status: true,
        expiresAt: true,
        createdById: true,
        submission: {
          select: {
            id: true,
            tenantId: true,
            status: true,
            answers: true,
            branch: true,
            templateId: true,
            leadId: true,
            startedAt: true,
            template: { select: { name: true } },
            templateVersion: {
              select: {
                tenantId: true,
                versionNumber: true,
                definition: true,
              },
            },
          },
        },
      },
    });
    if (!share?.submission || share.submission.tenantId !== share.tenantId) {
      throw new NotFoundException('Link inválido ou expirado.');
    }
    if (share.status === 'active' && share.expiresAt.getTime() < Date.now()) {
      await this.prisma.questionnaireShare.update({
        where: { id: share.id },
        data: { status: 'expired' },
      });
      throw new GoneException('Este link expirou.');
    }
    if (share.status === 'expired') {
      throw new GoneException('Este link expirou.');
    }
    if (share.status === 'revoked') {
      throw new GoneException('Este link foi cancelado.');
    }
    if (share.status !== 'active') {
      throw new GoneException('Este link não aceita mais respostas.');
    }
    const version = share.submission.templateVersion;
    if (!version || version.tenantId !== share.tenantId) {
      throw new NotFoundException('Link inválido ou expirado.');
    }
    const definition = readVersionDefinition(version.definition);
    if (!definition || definition.fields.length === 0) {
      throw new NotFoundException('Questionário indisponível.');
    }
    return { share, submission: share.submission, definition };
  }

  private presentPublicQuestionnaire(resolved: {
    share: { expiresAt: Date };
    submission: {
      status: string;
      branch: string | null;
      answers: Prisma.JsonValue;
      template: { name: string };
      templateVersion: { versionNumber: number } | null;
    };
    definition: NonNullable<ReturnType<typeof readVersionDefinition>>;
  }) {
    return toPublicQuestionnairePayload({
      title: resolved.submission.template.name,
      branch: resolved.definition.branch ?? resolved.submission.branch,
      versionNumber: resolved.submission.templateVersion?.versionNumber ?? null,
      expiresAt: resolved.share.expiresAt,
      status: resolved.submission.status,
      definition: {
        schemaVersion: resolved.definition.schemaVersion,
        branch: resolved.definition.branch,
        sections: resolved.definition.sections,
        fields: resolved.definition.fields,
        rules: Array.isArray(resolved.definition.rules)
          ? resolved.definition.rules
          : [],
      },
      answers: this.toAnswerRecord(resolved.submission.answers),
    });
  }

  private async pinnedPublicTemplate(resolved: {
    share: { tenantId: string };
    submission: {
      templateId: string;
      templateVersion: { definition: Prisma.JsonValue } | null;
    };
  }) {
    const template = await this.getTemplateForSubmission(
      resolved.share.tenantId,
      resolved.submission.templateId,
    );
    return this.withPinnedFields(
      template,
      resolved.submission.templateVersion?.definition,
    );
  }

  private filterVisibleAnswers(
    template: TemplateForSubmission,
    answers: SubmissionAnswers,
  ) {
    const descriptors = fieldsToDescriptors(
      template.fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        order: field.order,
        placeholder: field.placeholder,
        helpText: field.helpText,
        options: field.options,
        validation: field.validation,
        settings: field.settings,
      })),
    );
    const settings = this.isPlainObject(template.settings)
      ? template.settings
      : {};
    const result = this.ruleEngine.evaluateSubmission({
      template: { name: template.name, settings, fields: descriptors },
      answers,
    });
    return Object.fromEntries(
      Object.entries(answers).filter(([key]) =>
        result.visibleFieldKeys.has(key),
      ),
    );
  }

  private expireDueShares(tenantId: string, submissionId: string) {
    return this.prisma.questionnaireShare.updateMany({
      where: {
        tenantId,
        submissionId,
        status: 'active',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });
  }

  private latestPublishedVersion(tenantId: string, templateId: string) {
    return this.prisma.questionnaireTemplateVersion.findFirst({
      where: { tenantId, templateId },
      orderBy: [{ versionNumber: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  private async definitionForSubmission(
    tenantId: string,
    templateVersionId?: string | null,
  ) {
    if (!templateVersionId) return null;
    const version = await this.prisma.questionnaireTemplateVersion.findFirst({
      where: { id: templateVersionId, tenantId },
      select: { definition: true },
    });
    return version?.definition ?? null;
  }

  private async ensureBusinessUnitBelongsToTenant(
    tenantId: string,
    id: string,
  ) {
    const unit = await this.prisma.businessUnit.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!unit) {
      throw new NotFoundException('Unidade de negócio não encontrada');
    }
  }

  private withPinnedFields(
    template: TemplateForSubmission,
    definition: unknown,
  ): TemplateForSubmission {
    const parsed = readVersionDefinition(definition);
    if (!parsed || parsed.fields.length === 0) return template;
    const fields = parsed.fields.map((field) => ({
      id: `snapshot-${field.key}`,
      tenantId: template.tenantId,
      templateId: template.id,
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      order: field.order,
      placeholder: field.placeholder,
      helpText: field.helpText,
      options: field.options ?? null,
      validation: field.validation ?? null,
      settings: field.settings ?? {},
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));
    const pinnedRules = (parsed as { rules?: unknown }).rules;
    const settings = Array.isArray(pinnedRules)
      ? ({
          ...(this.isPlainObject(template.settings) ? template.settings : {}),
          rules: pinnedRules,
          engineVersion: 2,
        } as Prisma.JsonValue)
      : template.settings;
    return {
      ...template,
      settings,
      fields: fields as TemplateForSubmission['fields'],
    };
  }

  private handleWriteError(error: unknown, conflictMessage: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(conflictMessage);
    }
    throw error;
  }
}
