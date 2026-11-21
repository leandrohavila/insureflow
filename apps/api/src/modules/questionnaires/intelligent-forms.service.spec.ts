import { BadRequestException } from '@nestjs/common';

import { QuestionnairesService } from './questionnaires.service';

type Row = Record<string, unknown>;

describe('QuestionnairesService formulários inteligentes', () => {
  function createHarness() {
    const templates: Row[] = [];
    const fields: Row[] = [];
    const versions: Row[] = [];
    let sequence = 0;
    const nextId = (prefix: string) => `${prefix}-${++sequence}`;

    const prisma = {
      questionnaireTemplate: {
        findMany: jest.fn(
          ({ where }: { where: { tenantId: string; branch: string } }) =>
            templates
              .filter(
                (template) =>
                  template.tenantId === where.tenantId &&
                  template.branch === where.branch &&
                  template.status !== 'archived',
              )
              .map((template) => ({
                ...template,
                fields: fields.filter(
                  (field) => field.templateId === template.id,
                ),
              })),
        ),
        findFirst: jest.fn(
          ({ where }: { where: { id: string; tenantId: string } }) => {
            const template = templates.find(
              (item) =>
                item.id === where.id && item.tenantId === where.tenantId,
            );
            if (!template) return null;
            return {
              ...template,
              fields: fields
                .filter((field) => field.templateId === template.id)
                .sort(
                  (left, right) => Number(left.order) - Number(right.order),
                ),
            };
          },
        ),
        create: jest.fn(({ data }: { data: Row }) => {
          const template = {
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
            id: nextId('tpl'),
          };
          templates.push(template);
          return { ...template, fields: [] };
        }),
        update: jest.fn(
          ({ where, data }: { where: { id: string }; data: Row }) => {
            const template = templates.find((item) => item.id === where.id);
            if (!template) throw new Error('template ausente');
            Object.assign(template, data);
            return template;
          },
        ),
      },
      questionnaireField: {
        findMany: jest.fn(
          ({ where }: { where: { tenantId: string; templateId: string } }) =>
            fields.filter(
              (field) =>
                field.tenantId === where.tenantId &&
                field.templateId === where.templateId,
            ),
        ),
        create: jest.fn(({ data }: { data: Row }) => {
          const field = { ...data, id: nextId('field') };
          fields.push(field);
          return field;
        }),
        update: jest.fn(
          ({ where, data }: { where: { id: string }; data: Row }) => {
            const field = fields.find((item) => item.id === where.id);
            if (!field) throw new Error('campo ausente');
            Object.assign(field, data);
            return field;
          },
        ),
      },
      questionnaireTemplateVersion: {
        findFirst: jest.fn(
          ({ where }: { where: { tenantId: string; templateId: string } }) =>
            versions
              .filter(
                (version) =>
                  version.tenantId === where.tenantId &&
                  version.templateId === where.templateId,
              )
              .sort(
                (left, right) =>
                  Number(right.versionNumber) - Number(left.versionNumber),
              )[0] ?? null,
        ),
        create: jest.fn(({ data }: { data: Row }) => {
          const version = {
            publishedAt: new Date(),
            ...data,
            id: nextId('ver'),
          };
          versions.push(version);
          return version;
        }),
      },
      auditLog: {
        create: jest.fn(({ data }: { data: Row }) => {
          const metadata = JSON.stringify(data.metadata ?? {});
          expect(metadata).not.toMatch(/529\.982|placa|chassi/i);
          return { id: nextId('audit') };
        }),
      },
    };
    const database = {
      ...prisma,
      $transaction: (work: (tx: typeof prisma) => unknown) => work(prisma),
    };

    const service = new QuestionnairesService(
      database as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    return { service, templates, fields, versions };
  }

  it('rejeita ramo fora do catálogo', async () => {
    const { service } = createHarness();
    await expect(
      service.ensureIntelligentForm('tenant-1', 'vida', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cria o formulário do tenant, versiona os campos e não republica igual', async () => {
    const { service, templates, fields, versions } = createHarness();
    templates.push({
      id: 'tpl-other',
      tenantId: 'tenant-2',
      branch: 'auto',
      status: 'active',
      name: 'Questionário Automóvel',
      version: 1,
      settings: { intelligentForm: true },
      createdAt: new Date(),
    });

    const created = await service.ensureIntelligentForm(
      'tenant-1',
      'auto',
      'user-1',
    );
    expect(created.id).not.toBe('tpl-other');
    expect(
      templates.filter((item) => item.tenantId === 'tenant-1'),
    ).toHaveLength(1);
    const plate = fields.find((field) => field.key === 'plate');
    const brand = fields.find((field) => field.key === 'brand');
    expect(plate?.required).toBe(false);
    expect(brand?.required).toBe(true);
    expect(versions).toHaveLength(1);
    const definition = versions[0]?.definition as {
      fields: Array<{ key: string; settings?: { section?: string } }>;
      rules?: unknown[];
      catalogVersion?: number;
    };
    expect(definition.catalogVersion).toBe(1);
    expect(definition.rules?.length).toBeGreaterThan(0);
    expect(
      definition.fields.find((field) => field.key === 'brand')?.settings
        ?.section,
    ).toBe('vehicle_identification');

    await service.ensureIntelligentForm('tenant-1', 'auto', 'user-1');
    expect(
      templates.filter((item) => item.tenantId === 'tenant-1'),
    ).toHaveLength(1);
    expect(versions).toHaveLength(1);
  });

  it('isola residencial e empresarial no tenant da chamada', async () => {
    const { service, templates } = createHarness();
    await service.ensureIntelligentForm('tenant-1', 'residencial', 'user-1');
    await service.ensureIntelligentForm('tenant-1', 'empresarial', 'user-1');
    expect(templates.map((template) => template.branch)).toEqual([
      'residencial',
      'empresarial',
    ]);
    expect(
      templates.every((template) => template.tenantId === 'tenant-1'),
    ).toBe(true);
  });
});
