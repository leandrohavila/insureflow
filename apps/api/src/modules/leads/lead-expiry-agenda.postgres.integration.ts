import fs from 'node:fs';
import path from 'node:path';

import { Prisma, PrismaClient } from '@prisma/client';

import type { ConfigService } from '@nestjs/config';

import { LeadsService } from './leads.service';
import { syncLeadRenewalActivities } from './lead-renewal-agenda.sync';
import { leadRenewalEventKind } from './lead-renewal-agenda.util';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { OwnershipService } from '../access/ownership.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { BusinessUnitsService } from '../business-units/business-units.service';

function testDatabaseUrl() {
  const envPath = path.resolve(__dirname, '../../../../../.env.test.local');
  let raw: string;
  try {
    raw = fs.readFileSync(envPath, 'utf8');
  } catch {
    throw new Error(
      'Conexão de teste ausente. Crie .env.test.local na raiz da worktree, ignorado pelo Git, com POSTGRES_USER, POSTGRES_PASSWORD e POSTGRES_DB. O teste só aceita 127.0.0.1:5433 e o banco insureflow_test.',
    );
  }
  const values: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 0) continue;
    values[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  if (
    values.POSTGRES_USER !== 'insureflow_test' ||
    values.POSTGRES_DB !== 'insureflow_test' ||
    !values.POSTGRES_PASSWORD
  ) {
    throw new Error('Alvo do PostgreSQL de teste rejeitado');
  }
  const url = new URL('postgresql://127.0.0.1:5433/insureflow_test');
  url.username = values.POSTGRES_USER;
  url.password = values.POSTGRES_PASSWORD;
  url.searchParams.set('schema', 'public');
  if (
    url.hostname !== '127.0.0.1' ||
    url.port !== '5433' ||
    url.pathname !== '/insureflow_test'
  ) {
    throw new Error('Alvo do PostgreSQL de teste rejeitado');
  }
  return url.toString();
}

const databaseUrl = testDatabaseUrl();
const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
const stamp = `${Date.now()}`;

function service() {
  const ownership = new OwnershipService(
    prisma as unknown as PrismaService,
    { get: () => undefined } as unknown as ConfigService,
  );
  return new LeadsService(
    prisma as unknown as PrismaService,
    ownership,
    {} as ActivityEngineService,
    { assertIds: jest.fn(() => []) } as unknown as BusinessUnitsService,
    {
      scheduleOnLeadCreate: jest.fn(),
      isFollowUpType: jest.fn(() => false),
    } as never,
    { findOne: jest.fn() } as never,
  );
}

function actor(userId: string) {
  return {
    userId,
    roles: ['comercial'],
    permissions: ['leads:manage'],
  };
}

async function createTenant(label: string) {
  return prisma.tenant.create({
    data: {
      name: `Agenda PG ${label} ${stamp}`,
      slug: `agenda-pg-${label}-${stamp}`,
    },
  });
}

async function createUser(tenantId: string, label: string) {
  return prisma.user.create({
    data: {
      tenantId,
      email: `${label}-${stamp}@example.test`,
      passwordHash: 'integration-test',
      name: label,
      initials: 'IT',
    },
  });
}

async function createLead(input: {
  tenantId: string;
  ownerUserId?: string | null;
  name: string;
  policyExpiresAt: Date;
  renewalD60Disabled?: boolean;
}) {
  return prisma.lead.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      ownerUserId: input.ownerUserId ?? null,
      policyExpiresAt: input.policyExpiresAt,
      renewalD60Disabled: input.renewalD60Disabled ?? false,
      opportunityType: 'renewal',
    },
  });
}

async function createDeal(tenantId: string) {
  return prisma.deal.create({
    data: {
      tenantId,
      title: `Negócio ${stamp}`,
      company: 'Teste',
      value: new Prisma.Decimal('10.00'),
    },
  });
}

describe('PostgreSQL: vencimento e agenda na mesma transação', () => {
  const leads = service();
  const tenantIds: string[] = [];

  beforeAll(async () => {
    let rows: Array<{ db: string; usr: string }>;
    try {
      rows = await prisma.$queryRawUnsafe<Array<{ db: string; usr: string }>>(
        'SELECT current_database() AS db, current_user AS usr',
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Falha ao conectar em 127.0.0.1:5433, banco insureflow_test. Confirme o contêiner insureflow-postgres-test. ${detail.replace(/postgresql:\/\/\S+/gi, '[redacted-url]')}`,
      );
    }
    if (
      rows[0]?.db !== 'insureflow_test' ||
      rows[0]?.usr !== 'insureflow_test'
    ) {
      throw new Error(
        'A conexão respondeu com outro banco ou usuário. O teste foi interrompido antes de gravar dados.',
      );
    }
  });

  afterAll(async () => {
    if (tenantIds.length > 0) {
      await prisma.activity.deleteMany({
        where: { tenantId: { in: tenantIds } },
      });
      await prisma.lead.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.deal.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.user.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.role.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    }
    await prisma.$disconnect();
  });

  it('grava vencimento e lembretes do mesmo salvamento', async () => {
    const tenant = await createTenant('sucesso');
    tenantIds.push(tenant.id);
    const user = await createUser(tenant.id, 'sucesso');
    const lead = await createLead({
      tenantId: tenant.id,
      ownerUserId: user.id,
      name: 'Sucesso',
      policyExpiresAt: new Date('2027-04-15T00:00:00.000Z'),
    });
    const reminders = {
      renewalReminderD60: '2027-04-16T12:00:00.000Z',
      renewalReminderD30: '2027-05-16T12:00:00.000Z',
      renewalReminderD15: '2027-05-31T12:00:00.000Z',
    };

    await leads.updateLead(
      tenant.id,
      lead.id,
      { policyExpiresAt: '2027-06-15', ...reminders },
      actor(user.id),
    );

    const stored = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    const activities = await prisma.activity.findMany({
      where: { leadId: lead.id, status: 'pending' },
    });
    expect(stored.policyExpiresAt?.toISOString()).toBe(
      '2027-06-15T00:00:00.000Z',
    );
    expect(
      activities
        .find((row) => row.operationalEventKind === leadRenewalEventKind(60))
        ?.occurredAt.toISOString(),
    ).toBe(reminders.renewalReminderD60);
    expect(
      activities
        .find((row) => row.operationalEventKind === leadRenewalEventKind(30))
        ?.occurredAt.toISOString(),
    ).toBe(reminders.renewalReminderD30);
    expect(
      activities
        .find((row) => row.operationalEventKind === leadRenewalEventKind(15))
        ?.occurredAt.toISOString(),
    ).toBe(reminders.renewalReminderD15);
  });

  it('desfaz vencimento, nome e atividade quando a escrita do lembrete falha', async () => {
    const tenant = await createTenant('rollback');
    tenantIds.push(tenant.id);
    const user = await createUser(tenant.id, 'rollback');
    const lead = await createLead({
      tenantId: tenant.id,
      ownerUserId: null,
      name: 'Antes',
      policyExpiresAt: new Date('2027-04-15T00:00:00.000Z'),
    });
    const activity = await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        leadId: lead.id,
        performedById: user.id,
        type: 'renewal',
        status: 'pending',
        subject: 'Renovação D-60',
        description: 'Ligar',
        operationalEventKind: leadRenewalEventKind(60),
        occurredAt: new Date('2027-02-01T14:30:00.000Z'),
      },
    });
    const beforeLead = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    const beforeActivity = await prisma.activity.findUniqueOrThrow({
      where: { id: activity.id },
    });

    await expect(
      leads.updateLead(
        tenant.id,
        lead.id,
        {
          name: 'Não pode permanecer',
          policyExpiresAt: '2028-01-15',
          renewalReminderD60: '2027-11-16T12:00:00.000Z',
          renewalReminderD30: '2027-12-16T12:00:00.000Z',
          renewalReminderD15: '2027-12-31T12:00:00.000Z',
        },
        actor('usuario-inexistente'),
      ),
    ).rejects.toThrow();

    const afterLead = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    const afterActivity = await prisma.activity.findUniqueOrThrow({
      where: { id: activity.id },
    });
    const count = await prisma.activity.count({ where: { leadId: lead.id } });
    expect(afterLead.name).toBe(beforeLead.name);
    expect(afterLead.policyExpiresAt?.toISOString()).toBe(
      beforeLead.policyExpiresAt?.toISOString(),
    );
    expect(afterLead.lastContactAt?.toISOString()).toBe(
      beforeLead.lastContactAt?.toISOString() ?? undefined,
    );
    expect(afterActivity.occurredAt.toISOString()).toBe(
      beforeActivity.occurredAt.toISOString(),
    );
    expect(afterActivity.description).toBe('Ligar');
    expect(count).toBe(1);
  });

  it('não altera lead de outro tenant', async () => {
    const tenant = await createTenant('origem');
    const other = await createTenant('outro');
    tenantIds.push(tenant.id, other.id);
    const user = await createUser(tenant.id, 'origem');
    const lead = await createLead({
      tenantId: tenant.id,
      ownerUserId: user.id,
      name: 'Isolado',
      policyExpiresAt: new Date('2027-04-15T00:00:00.000Z'),
    });
    const activity = await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        leadId: lead.id,
        performedById: user.id,
        type: 'renewal',
        status: 'pending',
        subject: 'Renovação D-60',
        description: 'Original',
        operationalEventKind: leadRenewalEventKind(60),
        occurredAt: new Date('2027-02-14T12:00:00.000Z'),
      },
    });

    await expect(
      leads.updateLead(
        other.id,
        lead.id,
        {
          name: 'Invasão',
          policyExpiresAt: '2028-02-15',
          renewalReminderD60: '2027-12-17T12:00:00.000Z',
        },
        actor(user.id),
      ),
    ).rejects.toThrow('Lead não encontrado');

    const synced = await syncLeadRenewalActivities(prisma, {
      tenantId: other.id,
      leadId: lead.id,
      performedById: user.id,
      slots: { 60: new Date('2027-12-17T12:00:00.000Z') },
    });
    const stored = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    const storedActivity = await prisma.activity.findUniqueOrThrow({
      where: { id: activity.id },
    });
    expect(synced).toBe(0);
    expect(stored.name).toBe('Isolado');
    expect(stored.policyExpiresAt?.toISOString()).toBe(
      '2027-04-15T00:00:00.000Z',
    );
    expect(storedActivity.occurredAt.toISOString()).toBe(
      '2027-02-14T12:00:00.000Z',
    );
    expect(storedActivity.description).toBe('Original');
  });

  it('serializa duas atualizações sem duplicar o lembrete pendente', async () => {
    const tenant = await createTenant('corrida');
    tenantIds.push(tenant.id);
    const user = await createUser(tenant.id, 'corrida');
    const lead = await createLead({
      tenantId: tenant.id,
      ownerUserId: user.id,
      name: 'Corrida',
      policyExpiresAt: new Date('2027-04-15T00:00:00.000Z'),
    });
    const attempts = [
      {
        policyExpiresAt: '2027-05-15',
        renewalReminderD60: '2027-03-16T12:00:00.000Z',
        renewalReminderD30: '2027-04-15T12:00:00.000Z',
        renewalReminderD15: '2027-04-30T12:00:00.000Z',
      },
      {
        policyExpiresAt: '2027-08-15',
        renewalReminderD60: '2027-06-16T12:00:00.000Z',
        renewalReminderD30: '2027-07-16T12:00:00.000Z',
        renewalReminderD15: '2027-07-31T12:00:00.000Z',
      },
    ];

    const results = await Promise.allSettled(
      attempts.map((dto) =>
        leads.updateLead(tenant.id, lead.id, dto, actor(user.id)),
      ),
    );
    expect(results.some((result) => result.status === 'fulfilled')).toBe(true);

    const stored = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    const pending = await prisma.activity.findMany({
      where: { leadId: lead.id, status: 'pending' },
    });
    const expiry = stored.policyExpiresAt?.toISOString().slice(0, 10);
    const winner = attempts.find((item) => item.policyExpiresAt === expiry);
    expect(winner).toBeTruthy();
    for (const days of [60, 30, 15] as const) {
      const rows = pending.filter(
        (row) => row.operationalEventKind === leadRenewalEventKind(days),
      );
      expect(rows).toHaveLength(1);
    }
    expect(
      pending
        .find((row) => row.operationalEventKind === leadRenewalEventKind(60))
        ?.occurredAt.toISOString(),
    ).toBe(winner?.renewalReminderD60);
    expect(
      pending
        .find((row) => row.operationalEventKind === leadRenewalEventKind(30))
        ?.occurredAt.toISOString(),
    ).toBe(winner?.renewalReminderD30);
    expect(
      pending
        .find((row) => row.operationalEventKind === leadRenewalEventKind(15))
        ?.occurredAt.toISOString(),
    ).toBe(winner?.renewalReminderD15);
  });

  it('preserva desativação, data manual, atividade concluída, id e vínculo', async () => {
    const tenant = await createTenant('estado');
    tenantIds.push(tenant.id);
    const user = await createUser(tenant.id, 'estado');
    const deal = await createDeal(tenant.id);
    const lead = await createLead({
      tenantId: tenant.id,
      ownerUserId: user.id,
      name: 'Estado',
      policyExpiresAt: new Date('2027-04-15T00:00:00.000Z'),
      renewalD60Disabled: true,
    });
    const disabled = await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        leadId: lead.id,
        dealId: deal.id,
        performedById: user.id,
        type: 'renewal',
        status: 'cancelled',
        subject: 'Renovação D-60',
        description: 'Desativado',
        outcome: 'pausado',
        operationalEventKind: leadRenewalEventKind(60),
        occurredAt: new Date('2027-02-01T14:30:00.000Z'),
      },
    });
    const completed = await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        leadId: lead.id,
        dealId: deal.id,
        performedById: user.id,
        type: 'renewal',
        status: 'completed',
        subject: 'Renovação D-30',
        description: 'Concluído',
        outcome: 'feito',
        operationalEventKind: leadRenewalEventKind(30),
        occurredAt: new Date('2027-03-16T12:00:00.000Z'),
        completedAt: new Date('2027-03-16T13:00:00.000Z'),
      },
    });
    const manual = await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        leadId: lead.id,
        dealId: deal.id,
        performedById: user.id,
        type: 'renewal',
        status: 'pending',
        subject: 'Renovação D-15',
        description: 'Data manual',
        operationalEventKind: leadRenewalEventKind(15),
        occurredAt: new Date('2027-03-20T11:00:00.000Z'),
      },
    });

    await leads.updateLead(
      tenant.id,
      lead.id,
      {
        policyExpiresAt: '2027-07-15',
        renewalReminderD60: null,
        renewalReminderD15: '2027-06-20T11:00:00.000Z',
      },
      actor(user.id),
    );

    const stored = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    const disabledRow = await prisma.activity.findUniqueOrThrow({
      where: { id: disabled.id },
    });
    const completedRow = await prisma.activity.findUniqueOrThrow({
      where: { id: completed.id },
    });
    const manualRow = await prisma.activity.findUniqueOrThrow({
      where: { id: manual.id },
    });
    const pendingD60 = await prisma.activity.count({
      where: {
        leadId: lead.id,
        status: 'pending',
        operationalEventKind: leadRenewalEventKind(60),
      },
    });
    expect(stored.policyExpiresAt?.toISOString()).toBe(
      '2027-07-15T00:00:00.000Z',
    );
    expect(stored.renewalD60Disabled).toBe(true);
    expect(pendingD60).toBe(0);
    expect(disabledRow).toMatchObject({
      status: 'cancelled',
      description: 'Desativado',
      outcome: 'pausado',
      dealId: deal.id,
    });
    expect(completedRow).toMatchObject({
      status: 'completed',
      description: 'Concluído',
      outcome: 'feito',
      dealId: deal.id,
    });
    expect(manualRow.id).toBe(manual.id);
    expect(manualRow.dealId).toBe(deal.id);
    expect(manualRow.description).toBe('Data manual');
    expect(manualRow.occurredAt.toISOString()).toBe('2027-06-20T11:00:00.000Z');
  });

  it('impede outro corretor de alterar o lead e a agenda quando a propriedade está ativa', async () => {
    const tenant = await createTenant('propriedade');
    tenantIds.push(tenant.id);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { settings: { ownershipEnforcement: 'on' } },
    });
    const owner = await createUser(tenant.id, 'dono');
    const outsider = await createUser(tenant.id, 'outro-corretor');
    const role = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Comercial',
        slug: 'comercial',
        defaultDataScope: 'own',
      },
    });
    await prisma.userRole.createMany({
      data: [
        { userId: owner.id, roleId: role.id },
        { userId: outsider.id, roleId: role.id },
      ],
    });
    const lead = await createLead({
      tenantId: tenant.id,
      ownerUserId: owner.id,
      name: 'Lead do dono',
      policyExpiresAt: new Date('2027-04-15T00:00:00.000Z'),
    });
    const activity = await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        leadId: lead.id,
        performedById: owner.id,
        type: 'renewal',
        status: 'pending',
        subject: 'Renovação D-60',
        description: 'Agenda do dono',
        operationalEventKind: leadRenewalEventKind(60),
        occurredAt: new Date('2027-02-14T12:00:00.000Z'),
      },
    });
    const outsiderActor = {
      userId: outsider.id,
      roles: ['comercial'],
      permissions: ['leads:manage'],
    };

    await expect(
      leads.updateLead(
        tenant.id,
        lead.id,
        {
          name: 'Alteração não autorizada',
          policyExpiresAt: '2028-03-15',
          renewalReminderD60: '2027-12-20T12:00:00.000Z',
        },
        outsiderActor,
      ),
    ).rejects.toThrow('Lead não encontrado');

    const deniedLead = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    const deniedActivity = await prisma.activity.findUniqueOrThrow({
      where: { id: activity.id },
    });
    expect(deniedLead.name).toBe('Lead do dono');
    expect(deniedLead.policyExpiresAt?.toISOString()).toBe(
      '2027-04-15T00:00:00.000Z',
    );
    expect(deniedActivity.occurredAt.toISOString()).toBe(
      '2027-02-14T12:00:00.000Z',
    );
    expect(deniedActivity.description).toBe('Agenda do dono');

    await leads.updateLead(
      tenant.id,
      lead.id,
      {
        name: 'Alteração do dono',
        renewalReminderD60: '2027-02-20T12:00:00.000Z',
      },
      actor(owner.id),
    );

    const allowedLead = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    const allowedActivity = await prisma.activity.findUniqueOrThrow({
      where: { id: activity.id },
    });
    expect(allowedLead.name).toBe('Alteração do dono');
    expect(allowedActivity.id).toBe(activity.id);
    expect(allowedActivity.occurredAt.toISOString()).toBe(
      '2027-02-20T12:00:00.000Z',
    );
  });
});
