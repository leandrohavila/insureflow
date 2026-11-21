import 'reflect-metadata';

import {
  BadRequestException,
  ConflictException,
  GoneException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { getIntelligentForm } from '@repo/forms-library';
import { PublicQuestionnaireAnswersDto } from './dto/questionnaire.dto';
import { PublicQuestionnaireController } from './public-questionnaire.controller';
import { QuestionnairesService } from './questionnaires.service';
import {
  generateQuestionnaireShareToken,
  hashQuestionnaireShareToken,
} from './questionnaire-share-token.util';
import { buildQuestionnaireVersionDefinition } from './questionnaire-version.util';

const tenantA = 'tenant-a';
const tenantB = 'tenant-b';

function field(
  key: string,
  label: string,
  extra: Record<string, unknown> = {},
) {
  return {
    key,
    label,
    type: 'TEXT',
    required: false,
    order: 0,
    settings: {
      section: 'vehicle_identification',
      sectionTitle: 'Dados do veículo',
    },
    ...extra,
  };
}

describe('questionário público por link', () => {
  function createHarness() {
    const tokenA = generateQuestionnaireShareToken();
    const tokenB = generateQuestionnaireShareToken();
    const definition = buildQuestionnaireVersionDefinition({
      branch: 'auto',
      catalogVersion: 1,
      rules: getIntelligentForm('auto').rules,
      fields: [
        field('brand', 'Marca', { required: true, order: 0 }),
        field('vehicle_condition', 'Veículo zero ou usado', {
          type: 'SELECT',
          required: true,
          order: 1,
          options: [
            { label: 'Zero', value: 'new' },
            { label: 'Usado', value: 'used' },
          ],
        }),
        field('plate', 'Placa', { order: 2 }),
      ],
    });
    const shares = new Map<string, Record<string, unknown>>([
      [
        hashQuestionnaireShareToken(tokenA),
        {
          id: 'share-a',
          tenantId: tenantA,
          status: 'active',
          expiresAt: new Date(Date.now() + 86_400_000),
          createdById: 'broker-a',
          submission: {
            id: 'submission-a',
            tenantId: tenantA,
            status: 'pending_client',
            answers: { brand: 'Fiat' },
            branch: 'auto',
            templateId: 'template-a',
            leadId: 'lead-a',
            startedAt: null,
            template: { name: 'Questionário Automóvel' },
            templateVersion: {
              tenantId: tenantA,
              versionNumber: 1,
              definition,
            },
          },
        },
      ],
      [
        hashQuestionnaireShareToken(tokenB),
        {
          id: 'share-b',
          tenantId: tenantB,
          status: 'active',
          expiresAt: new Date(Date.now() + 86_400_000),
          createdById: 'broker-b',
          submission: {
            id: 'submission-b',
            tenantId: tenantB,
            status: 'in_progress',
            answers: { brand: 'OutroTenant' },
            branch: 'auto',
            templateId: 'template-b',
            leadId: 'lead-b',
            startedAt: new Date(),
            template: { name: 'Questionário Automóvel' },
            templateVersion: {
              tenantId: tenantB,
              versionNumber: 3,
              definition,
            },
          },
        },
      ],
    ]);
    const updates: Array<Record<string, unknown>> = [];
    const audits: Array<Record<string, unknown>> = [];
    const touchLastContact = jest.fn();
    const syncQuotes = jest.fn();
    const publish = jest
      .fn()
      .mockResolvedValue({ id: 'activity-1', created: true });
    const prisma = {
      questionnaireShare: {
        findUnique: jest.fn(
          ({ where }: { where: { tokenHash: string } }) =>
            shares.get(where.tokenHash) ?? null,
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            for (const share of shares.values()) {
              if (share.id === where.id) Object.assign(share, data);
            }
            return { id: where.id, ...data };
          },
        ),
      },
      questionnaireSubmission: {
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            for (const share of shares.values()) {
              const submission = share.submission as { id: string };
              if (submission.id === where.id) Object.assign(submission, data);
            }
            updates.push(data);
            return data;
          },
        ),
      },
      questionnaireTemplate: {
        findFirst: jest.fn(() => ({
          id: 'template-a',
          tenantId: tenantA,
          name: 'Questionário Automóvel',
          status: 'active',
          version: 4,
          settings: { engineVersion: 2, rules: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
          fields: [
            {
              id: 'live-future',
              tenantId: tenantA,
              templateId: 'template-a',
              key: 'future_field',
              label: 'Campo novo do catálogo',
              type: 'TEXT',
              required: true,
              order: 99,
              placeholder: null,
              helpText: null,
              options: null,
              validation: null,
              settings: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),
      },
      auditLog: {
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          audits.push(data);
          const metadata = JSON.stringify(data.metadata ?? {});
          expect(metadata).not.toMatch(/Fiat|OutroTenant|placa/i);
          expect(metadata).not.toContain(tokenA);
          return { id: 'audit-1' };
        }),
      },
    };
    const service = new QuestionnairesService(
      prisma as never,
      { touchLastContact } as never,
      { publish } as never,
      { syncComparisonFromSubmission: syncQuotes } as never,
      {} as never,
    );
    return {
      service,
      tokenA,
      tokenB,
      updates,
      audits,
      touchLastContact,
      syncQuotes,
      publish,
      shares,
    };
  }

  it('não exige autenticação no controller público', () => {
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, PublicQuestionnaireController),
    ).toBe(true);
  });

  it('preserva as respostas dinâmicas e rejeita campos fora do contrato', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const answers = {
      brand: 'Fiat',
      vehicle_condition: 'used',
      driver_birth_date: '1990-05-02',
    };
    await expect(
      pipe.transform(
        { answers, leadId: 'lead-a' },
        { type: 'body', metatype: PublicQuestionnaireAnswersDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      pipe.transform(
        { answers },
        { type: 'body', metatype: PublicQuestionnaireAnswersDto },
      ),
    ).resolves.toEqual({ answers });
  });

  it('abre pela versão vinculada e não revela lead, token nem outro tenant', async () => {
    const { service, tokenA, tokenB } = createHarness();
    const opened = await service.openPublicQuestionnaire(tokenA);
    expect(opened.state).toBe('open');
    expect(opened.versionNumber).toBe(1);
    const fields = opened.definition?.fields;
    expect(
      Array.isArray(fields)
        ? fields.map((field) =>
            field && typeof field === 'object' && 'key' in field
              ? String(field.key)
              : '',
          )
        : [],
    ).toEqual(['brand', 'vehicle_condition', 'plate']);
    const serialized = JSON.stringify(opened);
    expect(serialized).not.toMatch(/lead-a|tenant-a|submission-a/);
    expect(serialized).not.toContain(tokenA);
    expect(serialized).not.toContain('OutroTenant');
    expect(serialized).not.toContain('future_field');

    const other = await service.openPublicQuestionnaire(tokenB);
    expect(JSON.stringify(other)).not.toContain('Fiat');
    expect(other.versionNumber).toBe(3);
  });

  it('rejeita token inválido, expirado, revogado e versão de outro tenant', async () => {
    const { service, tokenA, shares } = createHarness();
    await expect(
      service.openPublicQuestionnaire('curto'),
    ).rejects.toBeInstanceOf(NotFoundException);

    const share = shares.get(hashQuestionnaireShareToken(tokenA));
    if (!share) throw new Error('share ausente');
    share.expiresAt = new Date(Date.now() - 1000);
    await expect(
      service.openPublicQuestionnaire(tokenA),
    ).rejects.toBeInstanceOf(GoneException);
    expect(share.status).toBe('expired');

    share.status = 'revoked';
    share.expiresAt = new Date(Date.now() + 86_400_000);
    await expect(
      service.openPublicQuestionnaire(tokenA),
    ).rejects.toBeInstanceOf(GoneException);

    share.status = 'active';
    const submission = share.submission as {
      templateVersion: { tenantId: string };
    };
    submission.templateVersion.tenantId = tenantB;
    await expect(
      service.openPublicQuestionnaire(tokenA),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('salva o rascunho, conclui sem o campo novo do catálogo e bloqueia reenvio', async () => {
    const { service, tokenA, updates, touchLastContact, syncQuotes, publish } =
      createHarness();
    const saved = await service.savePublicQuestionnaire(tokenA, {
      brand: 'Fiat',
      vehicle_condition: 'new',
      plate: 'ABC1D23',
    });
    expect(saved).toEqual({ saved: true, status: 'in_progress' });
    expect(updates[0]?.answers).toEqual({
      brand: 'Fiat',
      vehicle_condition: 'new',
    });

    const completed = await service.completePublicQuestionnaire(tokenA, {
      brand: 'Fiat',
      vehicle_condition: 'new',
    });
    expect(completed.state).toBe('completed');
    expect(completed.definition).toBeNull();
    await expect(
      service.completePublicQuestionnaire(tokenA, {
        brand: 'Fiat',
        vehicle_condition: 'new',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(touchLastContact).not.toHaveBeenCalled();
    expect(syncQuotes).not.toHaveBeenCalled();
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'questionnaire_completed',
        leadId: 'lead-a',
      }),
    );
    expect(JSON.stringify(publish.mock.calls[0]?.[0])).not.toContain('Fiat');
  });

  it('exige a placa só quando a versão diz que o veículo é usado', async () => {
    const { service, tokenA } = createHarness();
    await expect(
      service.completePublicQuestionnaire(tokenA, {
        brand: 'Fiat',
        vehicle_condition: 'used',
      }),
    ).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining([expect.stringMatching(/placa/i)]),
      },
    });
  });

  it('conclui mesmo quando a timeline não pode ser registrada', async () => {
    const { service, tokenA, publish } = createHarness();
    publish.mockRejectedValueOnce(new Error('timeline indisponível'));
    const completed = await service.completePublicQuestionnaire(tokenA, {
      brand: 'Fiat',
      vehicle_condition: 'new',
    });
    expect(completed.state).toBe('completed');
    expect(completed.definition).toBeNull();
  });
});
