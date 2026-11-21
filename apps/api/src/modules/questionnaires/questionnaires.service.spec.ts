import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { QuestionnairesService } from './questionnaires.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { BusinessUnitActor } from '../../common/utils/business-unit-acl.util';

const tenantId = 'tenant-1';
const otherTenantId = 'tenant-2';

const insuranceActor: BusinessUnitActor = {
  userId: 'user-insurance',
  tenantId,
  roles: ['comercial'],
  permissions: ['questionnaires:manage'],
  currentBusinessUnitId: 'bu-insurance',
};

const requiredField = {
  id: 'field-1',
  key: 'vehicle_model',
  label: 'Modelo',
  type: 'TEXT',
  required: true,
  order: 0,
  placeholder: null,
  helpText: null,
  options: null,
  validation: null,
  settings: {},
};

function activeTemplate(id = 'tpl-auto') {
  return {
    id,
    tenantId,
    name: id === 'tpl-auto' ? 'Seguro Auto — Cotação' : 'Compra de imóvel',
    description: null,
    status: 'active',
    version: 1,
    settings:
      id === 'tpl-auto'
        ? { wizardBranch: 'auto' }
        : { wizardBranch: 'property_buy' },
    fields: [requiredField],
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };
}

describe('QuestionnairesService lead questionnaire', () => {
  function createService() {
    const leadFindFirst = jest.fn().mockImplementation(({ where, select }) => {
      if (where.tenantId !== tenantId || where.id === 'lead-other-tenant') {
        return Promise.resolve(null);
      }
      if (where.id === 'lead-real-estate') {
        return Promise.resolve(
          select?.id && !select.interestCategories
            ? { id: where.id }
            : {
                id: where.id,
                interestCategories: ['PROPERTY_BUY'],
                businessUnit: { type: 'REAL_ESTATE' },
              },
        );
      }
      return Promise.resolve(
        select?.id && !select.interestCategories
          ? { id: where.id }
          : {
              id: where.id ?? 'lead-auto',
              interestCategories: ['AUTO_INSURANCE'],
              businessUnit: { type: 'INSURANCE' },
            },
      );
    });

    const templateFindFirst = jest
      .fn()
      .mockImplementation(
        ({ where }: { where: { tenantId?: string; id?: string } }) => {
          if (where.tenantId !== tenantId) return Promise.resolve(null);
          return Promise.resolve(activeTemplate(where.id ?? 'tpl-auto'));
        },
      );
    const templateFindMany = jest.fn().mockImplementation(() =>
      Promise.resolve([
        {
          id: 'tpl-auto',
          name: 'Seguro Auto — Cotação',
          version: 1,
          status: 'active',
          settings: { wizardBranch: 'auto' },
        },
        {
          id: 'tpl-compra',
          name: 'Compra de imóvel',
          version: 1,
          status: 'active',
          settings: { wizardBranch: 'property_buy' },
        },
        {
          id: 'tpl-vida',
          name: 'Seguro Vida',
          version: 1,
          status: 'active',
          settings: { wizardBranch: 'vida' },
        },
      ]),
    );

    const submissionFindFirst = jest.fn().mockResolvedValue(null);
    const submissionFindMany = jest.fn().mockResolvedValue([]);
    const submissionCount = jest.fn().mockResolvedValue(0);
    const submissionCreate = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        ...data,
        id: 'submission-1',
        answers: data.answers ?? {},
        template: {
          id: data.templateId,
          name: 'Seguro Auto — Cotação',
          version: 1,
          status: 'active',
        },
        lead: { id: data.leadId, name: 'Marina Lima', assignedTo: null },
        updatedBy: null,
        createdAt: new Date('2026-08-02T12:00:00.000Z'),
        updatedAt: new Date('2026-08-02T12:00:00.000Z'),
      }),
    );
    const submissionUpdate = jest.fn().mockImplementation(({ where, data }) =>
      Promise.resolve({
        id: where.id,
        ...data,
        tenantId,
        templateId: data.templateId ?? 'tpl-auto',
        leadId: data.leadId ?? 'lead-auto',
        answers: data.answers ?? { vehicle_model: 'Uno' },
        status: data.status ?? 'draft',
        template: {
          id: 'tpl-auto',
          name: 'Seguro Auto — Cotação',
          version: 1,
          status: 'active',
        },
        lead: { id: 'lead-auto', name: 'Marina Lima', assignedTo: null },
        updatedBy: null,
        createdAt: new Date('2026-08-02T12:00:00.000Z'),
        updatedAt: new Date('2026-08-02T12:05:00.000Z'),
      }),
    );

    const versionFindFirst = jest.fn().mockResolvedValue(null);
    const shareCreate = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'share-1',
        submissionId: data.submissionId,
        status: data.status,
        expiresAt: data.expiresAt,
        revokedAt: null,
        createdAt: new Date('2026-11-17T12:00:00.000Z'),
      }),
    );
    const shareUpdateMany = jest.fn().mockResolvedValue({ count: 0 });
    const auditCreate = jest.fn().mockResolvedValue({ id: 'audit-1' });

    const prisma = {
      lead: { findFirst: leadFindFirst },
      questionnaireTemplate: {
        findFirst: templateFindFirst,
        findMany: templateFindMany,
        update: jest
          .fn()
          .mockImplementation(
            ({
              where,
              data,
            }: {
              where: { id?: string };
              data: Record<string, unknown>;
            }) =>
              Promise.resolve({
                ...activeTemplate(where.id ?? 'tpl-auto'),
                ...data,
              }),
          ),
      },
      questionnaireSubmission: {
        findFirst: submissionFindFirst,
        findMany: submissionFindMany,
        count: submissionCount,
        create: submissionCreate,
        update: submissionUpdate,
        delete: jest.fn().mockResolvedValue({ id: 'submission-1' }),
      },
      questionnaireTemplateVersion: {
        findFirst: versionFindFirst,
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'version-1',
            publishedAt: new Date('2026-11-17T12:00:00.000Z'),
            createdAt: new Date('2026-11-17T12:00:00.000Z'),
            ...data,
          }),
        ),
      },
      questionnaireShare: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: shareUpdateMany,
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({
            id: where.id,
            submissionId: 'submission-1',
            status: data.status,
            expiresAt: new Date('2026-12-01T12:00:00.000Z'),
            revokedAt: data.revokedAt ?? null,
            createdAt: new Date('2026-11-17T12:00:00.000Z'),
          }),
        ),
        create: shareCreate,
      },
      businessUnit: {
        findFirst: jest.fn().mockResolvedValue({ id: 'bu-insurance' }),
      },
      auditLog: { create: auditCreate },
      $transaction: jest.fn((arg: unknown) => {
        if (typeof arg === 'function') {
          return (arg as (tx: unknown) => unknown)(prisma);
        }
        return Promise.all(arg as Array<Promise<unknown>>);
      }),
    } as unknown as PrismaService;

    const businessUnitAccess = {
      assertLeadVisible: jest
        .fn()
        .mockImplementation((_actor, _tenant, leadId: string) => {
          if (
            leadId === 'lead-real-estate' &&
            _actor.currentBusinessUnitId === 'bu-insurance'
          ) {
            return Promise.reject(new NotFoundException('Lead não encontrado'));
          }
          if (leadId === 'lead-other-tenant') {
            return Promise.reject(new NotFoundException('Lead não encontrado'));
          }
          return Promise.resolve();
        }),
      assertCustomerVisible: jest.fn().mockResolvedValue(undefined),
      assertDealVisible: jest.fn().mockResolvedValue(undefined),
      resolveIds: jest.fn().mockResolvedValue(['bu-insurance']),
      resolveRecordIds: jest.fn().mockResolvedValue(['bu-insurance']),
    };

    const service = new QuestionnairesService(
      prisma,
      { touchLastContact: jest.fn() } as never,
      { publish: jest.fn() } as never,
      { syncComparisonFromSubmission: jest.fn() } as never,
      businessUnitAccess as never,
    );

    return {
      service,
      prisma,
      businessUnitAccess,
      leadFindFirst,
      templateFindFirst,
      submissionCreate,
      submissionUpdate,
      submissionFindFirst,
      submissionFindMany,
      versionFindFirst,
      shareCreate,
      shareUpdateMany,
      auditCreate,
    };
  }

  it('cria e devolve o rascunho do lead correto sem exigir campos obrigatórios', async () => {
    const { service, submissionCreate } = createService();

    const created = await service.createSubmission(
      tenantId,
      {
        templateId: 'tpl-auto',
        leadId: 'lead-auto',
        status: 'draft',
        answers: {},
      },
      'user-insurance',
      insuranceActor,
    );

    expect(created.leadId).toBe('lead-auto');
    expect(created.status).toBe('draft');
    expect(submissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          leadId: 'lead-auto',
          templateId: 'tpl-auto',
          status: 'draft',
        }),
      }),
    );
  });

  it('retoma o rascunho existente em vez de criar outro', async () => {
    const { service, submissionCreate, submissionFindFirst, submissionUpdate } =
      createService();
    submissionFindFirst
      .mockResolvedValueOnce({
        id: 'submission-1',
        updatedAt: new Date('2026-08-02T12:00:00.000Z'),
        answers: { vehicle_model: 'Uno' },
      })
      .mockResolvedValueOnce({
        id: 'submission-1',
        templateId: 'tpl-auto',
        status: 'draft',
        answers: { vehicle_model: 'Uno' },
        leadId: 'lead-auto',
        updatedAt: new Date('2026-08-02T12:00:00.000Z'),
      });

    const saved = await service.createSubmission(
      tenantId,
      {
        templateId: 'tpl-auto',
        leadId: 'lead-auto',
        status: 'draft',
        answers: { vehicle_model: 'Palio' },
      },
      'user-insurance',
      insuranceActor,
    );

    expect(submissionCreate).not.toHaveBeenCalled();
    expect(submissionUpdate).toHaveBeenCalled();
    expect(saved.id).toBe('submission-1');
    expect(saved.leadId).toBe('lead-auto');
  });

  it('rejeita a finalização sem os campos obrigatórios', async () => {
    const { service, submissionCreate } = createService();

    await expect(
      service.createSubmission(
        tenantId,
        {
          templateId: 'tpl-auto',
          leadId: 'lead-auto',
          status: 'submitted',
          answers: {},
        },
        'user-insurance',
        insuranceActor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(submissionCreate).not.toHaveBeenCalled();
  });

  it('bloqueia lead de outro tenant', async () => {
    const { service } = createService();

    await expect(
      service.createSubmission(
        otherTenantId,
        {
          templateId: 'tpl-auto',
          leadId: 'lead-auto',
          status: 'draft',
          answers: { vehicle_model: 'Uno' },
        },
        'user-insurance',
        { ...insuranceActor, tenantId: otherTenantId },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('bloqueia leitura de respostas de outra unidade', async () => {
    const { service, submissionFindFirst } = createService();

    await expect(
      service.findSubmission(
        tenantId,
        'submission-real-estate',
        insuranceActor,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    const where = submissionFindFirst.mock.calls.at(-1)?.[0]?.where;
    expect(JSON.stringify(where)).toContain('bu-insurance');
    expect(JSON.stringify(where)).not.toContain('bu-real-estate');
  });

  it('não sugere template de outro produto', async () => {
    const { service } = createService();

    const auto = await service.suggestTemplatesForLead(
      tenantId,
      'lead-auto',
      insuranceActor,
    );
    expect(auto.match).toBe('unique');
    expect(auto.suggestedTemplateId).toBe('tpl-auto');

    const purchase = await service.suggestTemplatesForLead(
      tenantId,
      'lead-real-estate',
      {
        ...insuranceActor,
        currentBusinessUnitId: 'bu-real-estate',
        permissions: ['questionnaires:view', 'business-units:view-all'],
      },
    );
    expect(purchase.match).toBe('unique');
    expect(purchase.suggestedTemplateId).toBe('tpl-compra');
    expect(purchase.templates.map((template) => template.id)).not.toContain(
      'tpl-auto',
    );
  });

  it('recusa gravar por cima de um rascunho mais recente', async () => {
    const { service, submissionFindFirst } = createService();
    submissionFindFirst.mockResolvedValueOnce({
      id: 'submission-1',
      templateId: 'tpl-auto',
      status: 'draft',
      answers: { vehicle_model: 'Uno' },
      leadId: 'lead-auto',
      updatedAt: new Date('2026-08-02T12:10:00.000Z'),
    });

    await expect(
      service.updateSubmission(
        tenantId,
        'submission-1',
        {
          answers: { vehicle_model: 'Palio' },
          expectedUpdatedAt: '2026-08-02T12:00:00.000Z',
        },
        'user-insurance',
        insuranceActor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejeita template incompatível quando existe correspondência', async () => {
    const { service } = createService();

    await expect(
      service.createSubmission(
        tenantId,
        {
          templateId: 'tpl-vida',
          leadId: 'lead-auto',
          status: 'draft',
          answers: {},
        },
        'user-insurance',
        insuranceActor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('filtra a lista pela unidade do ator', async () => {
    const { service, submissionFindMany } = createService();

    await service.findSubmissions(
      tenantId,
      { page: 1, limit: 10, leadId: 'lead-auto' },
      insuranceActor,
    );

    expect(
      JSON.stringify(submissionFindMany.mock.calls[0]?.[0]?.where),
    ).toContain('bu-insurance');
  });

  it('publica a estrutura do ramo sem tornar as seções obrigatórias', async () => {
    const { service, auditCreate } = createService();

    const version = await service.publishTemplateVersion(
      tenantId,
      'tpl-auto',
      'user-insurance',
    );

    const definition = version?.definition as {
      branch: string;
      sections: Array<{ key: string; required: boolean }>;
      fields: unknown[];
    };
    expect(definition.branch).toBe('auto');
    expect(definition.sections.map((section) => section.key)).toEqual([
      'vehicle_identification',
      'driver',
      'usage',
      'garage',
      'insurance_history',
      'coverages',
    ]);
    expect(
      definition.sections.every((section) => section.required === false),
    ).toBe(true);
    expect(definition.fields).toHaveLength(1);
    const audit = auditCreate.mock.calls.at(-1)?.[0]?.data;
    expect(audit.action).toBe('questionnaire_template.version_published');
    expect(JSON.stringify(audit.metadata)).not.toContain('Uno');
  });

  it('não publica template de outro tenant', async () => {
    const { service } = createService();

    await expect(
      service.publishTemplateVersion(otherTenantId, 'tpl-auto', 'user-other'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('vincula a resposta ao lead e à versão publicada', async () => {
    const { service, versionFindFirst, submissionCreate } = createService();
    versionFindFirst.mockResolvedValueOnce({
      id: 'version-9',
      versionNumber: 2,
      definition: {
        schemaVersion: 1,
        branch: 'auto',
        sections: [],
        fields: [],
      },
    });

    await service.createSubmission(
      tenantId,
      {
        templateId: 'tpl-auto',
        leadId: 'lead-auto',
        status: 'draft',
        answers: { vehicle_model: 'Uno' },
      },
      'user-insurance',
      insuranceActor,
    );

    expect(submissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          leadId: 'lead-auto',
          templateId: 'tpl-auto',
          templateVersionId: 'version-9',
          branch: 'auto',
          responsibleUserId: 'user-insurance',
        }),
      }),
    );
  });

  it('recusa template de outra unidade de negócio do lead', async () => {
    const { service, leadFindFirst, templateFindFirst, submissionCreate } =
      createService();
    templateFindFirst.mockResolvedValue({
      ...{
        id: 'tpl-auto',
        tenantId,
        name: 'Seguro Auto — Cotação',
        status: 'active',
        version: 1,
        settings: { wizardBranch: 'auto' },
        fields: [
          {
            id: 'field-1',
            key: 'vehicle_model',
            label: 'Modelo',
            type: 'TEXT',
            required: true,
            order: 0,
            placeholder: null,
            helpText: null,
            options: null,
            validation: null,
            settings: {},
          },
        ],
        businessUnitId: 'bu-other',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        updatedAt: new Date('2026-08-01T00:00:00.000Z'),
      },
    });
    leadFindFirst.mockResolvedValue({
      id: 'lead-auto',
      businessUnitId: 'bu-insurance',
      interestCategories: ['AUTO_INSURANCE'],
      businessUnit: { type: 'INSURANCE' },
    });

    await expect(
      service.createSubmission(
        tenantId,
        {
          templateId: 'tpl-auto',
          leadId: 'lead-auto',
          status: 'draft',
          answers: { vehicle_model: 'Uno' },
        },
        'user-insurance',
        insuranceActor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(submissionCreate).not.toHaveBeenCalled();
  });

  it('exige os campos obrigatórios ao concluir', async () => {
    const { service, submissionCreate } = createService();

    await expect(
      service.createSubmission(
        tenantId,
        {
          templateId: 'tpl-auto',
          leadId: 'lead-auto',
          status: 'completed',
          answers: {},
        },
        'user-insurance',
        insuranceActor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(submissionCreate).not.toHaveBeenCalled();
  });

  it('impede alterar um questionário concluído e preserva a resposta em uma revisão', async () => {
    const {
      service,
      submissionFindFirst,
      submissionUpdate,
      submissionCreate,
      auditCreate,
    } = createService();
    submissionFindFirst.mockResolvedValue({
      id: 'submission-1',
      templateId: 'tpl-auto',
      templateVersionId: 'version-1',
      status: 'completed',
      mode: 'INTERNAL',
      answers: { vehicle_model: 'Uno' },
      leadId: 'lead-auto',
      customerId: null,
      dealId: null,
      branch: 'auto',
      origin: 'INTERNAL',
      businessUnitId: 'bu-insurance',
      completedAt: new Date('2026-08-03T12:00:00.000Z'),
      updatedAt: new Date('2026-08-03T12:00:00.000Z'),
    });

    await expect(
      service.updateSubmission(
        tenantId,
        'submission-1',
        { answers: { vehicle_model: 'Palio' } },
        'user-insurance',
        insuranceActor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(submissionUpdate).not.toHaveBeenCalled();

    const revision = await service.reviseSubmission(
      tenantId,
      'submission-1',
      'user-insurance',
      insuranceActor,
    );

    expect(submissionUpdate).not.toHaveBeenCalled();
    expect(submissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'draft',
          leadId: 'lead-auto',
          templateVersionId: 'version-1',
          metadata: { revisedFromSubmissionId: 'submission-1' },
        }),
      }),
    );
    expect(revision.leadId).toBe('lead-auto');
    expect(revision.status).toBe('draft');
    expect(JSON.stringify(auditCreate.mock.calls)).not.toContain('Uno');
  });

  it('recusa transição inválida de status', async () => {
    const { service, submissionFindFirst, submissionUpdate } = createService();
    submissionFindFirst.mockResolvedValueOnce({
      id: 'submission-1',
      templateId: 'tpl-auto',
      status: 'completed',
      answers: { vehicle_model: 'Uno' },
      leadId: 'lead-auto',
      customerId: null,
      dealId: null,
      updatedAt: new Date('2026-08-03T12:00:00.000Z'),
    });

    await expect(
      service.updateSubmission(
        tenantId,
        'submission-1',
        { status: 'draft' },
        'user-insurance',
        insuranceActor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(submissionUpdate).not.toHaveBeenCalled();
  });

  it('guarda só o hash do compartilhamento e não audita o token', async () => {
    const {
      service,
      submissionFindFirst,
      shareCreate,
      submissionUpdate,
      auditCreate,
    } = createService();
    submissionFindFirst.mockResolvedValue({
      id: 'submission-1',
      templateId: 'tpl-auto',
      status: 'draft',
      answers: {},
      leadId: 'lead-auto',
      customerId: null,
      dealId: null,
      updatedAt: new Date('2026-08-02T12:00:00.000Z'),
    });

    const share = await service.createShare(
      tenantId,
      'submission-1',
      { expiresInDays: 7 },
      'user-insurance',
      insuranceActor,
    );

    const persisted = shareCreate.mock.calls[0]?.[0]?.data;
    expect(share.token).toEqual(expect.any(String));
    expect(persisted.tokenHash).not.toBe(share.token);
    expect(persisted.token).toBeUndefined();
    expect(JSON.stringify(auditCreate.mock.calls)).not.toContain(share.token);
    expect(submissionUpdate.mock.calls[0]?.[0]?.data.status).toBe(
      'pending_client',
    );
  });

  it('não encontra compartilhamento de outro tenant', async () => {
    const { service } = createService();

    await expect(
      service.revokeShare(otherTenantId, 'share-1', 'user-other', {
        ...insuranceActor,
        tenantId: otherTenantId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marca como expirado o compartilhamento vencido sem apagar o registro', async () => {
    const { service, submissionFindFirst, shareUpdateMany } = createService();
    submissionFindFirst.mockResolvedValue({
      id: 'submission-1',
      templateId: 'tpl-auto',
      status: 'pending_client',
      answers: { vehicle_model: 'Uno' },
      leadId: 'lead-auto',
      customerId: null,
      dealId: null,
      updatedAt: new Date('2026-08-02T12:00:00.000Z'),
    });

    await service.listShares(tenantId, 'submission-1', insuranceActor);

    expect(shareUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          submissionId: 'submission-1',
          status: 'active',
        }),
        data: { status: 'expired' },
      }),
    );
    expect(JSON.stringify(shareUpdateMany.mock.calls)).not.toContain('Uno');
  });
});
