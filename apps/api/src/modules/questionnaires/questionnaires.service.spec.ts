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

    const prisma = {
      lead: { findFirst: leadFindFirst },
      questionnaireTemplate: {
        findFirst: templateFindFirst,
        findMany: templateFindMany,
      },
      questionnaireSubmission: {
        findFirst: submissionFindFirst,
        findMany: submissionFindMany,
        count: submissionCount,
        create: submissionCreate,
        update: submissionUpdate,
      },
      auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
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
      submissionCreate,
      submissionUpdate,
      submissionFindFirst,
      submissionFindMany,
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
});
