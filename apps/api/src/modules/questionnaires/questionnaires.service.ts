import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  RuleEngine,
  ValidationEngine,
  createServerValidationContext,
  fieldsToDescriptors,
  resolveValidationProfile,
} from '@repo/forms-engine';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { LeadsService } from '../leads/leads.service';
import { QuotesService } from '../quotes/quotes.service';
import { buildQuestionnaireAnswerChanges } from './questionnaire-answer-audit.util';
import type {
  CreateQuestionnaireFieldDto,
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
    },
  },
  lead: {
    select: {
      id: true,
      name: true,
      assignedTo: true,
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

  async createTemplate(tenantId: string, dto: CreateQuestionnaireTemplateDto) {
    try {
      return await this.prisma.questionnaireTemplate.create({
        data: {
          tenantId,
          name: dto.name,
          description: dto.description,
          status: dto.status,
          version: dto.version,
          ...(dto.settings !== undefined
            ? { settings: this.toInputJson(dto.settings) }
            : {}),
        },
        include: templateInclude,
      });
    } catch (error) {
      this.handleWriteError(error, 'Template já existe nesta versão');
    }
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    dto: UpdateQuestionnaireTemplateDto,
  ) {
    await this.ensureTemplateBelongsToTenant(tenantId, id);

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
          ...(dto.settings !== undefined
            ? { settings: this.toInputJson(dto.settings) }
            : {}),
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
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildSubmissionWhere(tenantId, query);

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

  async findSubmission(tenantId: string, id: string) {
    const submission = await this.prisma.questionnaireSubmission.findFirst({
      where: { id, tenantId },
      include: submissionInclude,
    });
    if (!submission) {
      throw new NotFoundException('Resposta de questionário não encontrada');
    }
    return submission;
  }

  async createSubmission(
    tenantId: string,
    dto: CreateQuestionnaireSubmissionDto,
    performedById?: string,
  ) {
    await this.ensureSubmissionReferencesBelongToTenant(tenantId, dto);
    const template = await this.getTemplateForSubmission(
      tenantId,
      dto.templateId,
    );
    this.validateTemplateIsSubmittable(template);
    this.validateSubmissionAnswers(
      template,
      dto.answers ?? {},
      dto.status ?? 'draft',
    );

    const submission = await this.prisma.questionnaireSubmission.create({
      data: {
        tenantId,
        templateId: dto.templateId,
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
        submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : undefined,
      },
      include: submissionInclude,
    });

    if (submission.status === 'submitted' && submission.leadId) {
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
  ) {
    const current = await this.getSubmissionForUpdate(tenantId, id);
    await this.ensureSubmissionReferencesBelongToTenant(tenantId, dto);
    const template = await this.getTemplateForSubmission(
      tenantId,
      dto.templateId ?? current.templateId,
    );
    this.validateTemplateIsSubmittable(template);
    const previousAnswers = this.toAnswerRecord(current.answers);
    const answers = dto.answers !== undefined ? dto.answers : previousAnswers;
    this.validateSubmissionAnswers(
      template,
      answers,
      dto.status ?? current.status,
    );

    const nextStatus = dto.status ?? current.status;
    const answerChanges =
      dto.answers !== undefined
        ? buildQuestionnaireAnswerChanges(
            template.fields,
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

      return updated;
    });

    if (nextStatus === 'submitted' && submission.leadId) {
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

  async deleteSubmission(tenantId: string, id: string) {
    await this.ensureSubmissionBelongsToTenant(tenantId, id);
    await this.prisma.questionnaireSubmission.delete({ where: { id } });
    return { deleted: true, id };
  }

  private buildTemplateWhere(
    tenantId: string,
    query: ListQuestionnaireTemplatesQueryDto,
  ): Prisma.QuestionnaireTemplateWhereInput {
    const search = query.search?.trim();

    return {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
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

  private async getSubmissionForUpdate(tenantId: string, id: string) {
    const submission = await this.prisma.questionnaireSubmission.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        templateId: true,
        status: true,
        answers: true,
      },
    });
    if (!submission) {
      throw new NotFoundException('Resposta de questionário não encontrada');
    }
    return submission;
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
    const mode =
      status === 'submitted' || status === 'reviewed' ? 'finalize' : 'draft';

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
