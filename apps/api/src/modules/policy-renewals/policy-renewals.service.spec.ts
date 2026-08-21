import { PolicyRenewalsService } from './policy-renewals.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { MessageTemplatesService } from '../message-templates/message-templates.service';

describe('PolicyRenewalsService', () => {
  const tenantId = 'tenant-1';

  function createService() {
    const customerFindFirst = jest.fn().mockResolvedValue({
      id: 'cust-1',
      name: 'Marina Costa',
      businessUnitId: 'bu-1',
    });
    const create = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'ren-1',
        ...data,
        convertedRevenue: null,
        customer: { id: 'cust-1', name: 'Marina Costa', document: '1' },
        assignedUser: null,
        businessUnit: null,
        deal: null,
      }),
    );
    const publish = jest.fn().mockResolvedValue({ id: 'act-1', created: true });

    const prisma = {
      customer: { findFirst: customerFindFirst },
      policyRenewal: {
        create,
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      policy: { findMany: jest.fn() },
      deal: { create: jest.fn() },
      dealStageHistory: { create: jest.fn().mockResolvedValue({ id: 'hist-1' }) },
      businessUnitPipeline: {
        findUnique: jest.fn().mockResolvedValue({ id: 'pl-1' }),
      },
      user: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as PrismaService;

    const service = new PolicyRenewalsService(
      prisma,
      { publish } as unknown as ActivityEngineService,
      { findActiveForChannel: jest.fn() } as unknown as MessageTemplatesService,
      {
        dispatch: jest.fn().mockResolvedValue({ id: 'comm-1', status: 'sent', provider: 'INTERNAL' }),
        resolveRecipient: jest.fn().mockResolvedValue('+5511999999999'),
      } as never,
    );

    return { service, create, publish };
  }

  it('cria renovação comercial vinculada ao cliente', async () => {
    const { service, create, publish } = createService();
    const result = await service.create(
      tenantId,
      {
        clientId: 'cust-1',
        policyNumber: '123',
        insurer: 'Porto',
        product: 'Auto',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-09-04T00:00:00.000Z',
      },
      'user-1',
    );

    expect(result.clientId).toBe('cust-1');
    expect(create).toHaveBeenCalled();
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'renewal_started',
        customerId: 'cust-1',
      }),
    );
  });

  it('gera tarefa, lembrete e oportunidade conforme a janela', async () => {
    const { service } = createService();
    const now = new Date(Date.UTC(2026, 7, 20));
    const prisma = (
      service as unknown as { prisma: PrismaService }
    ).prisma as unknown as {
      policy: { findMany: jest.Mock };
      policyRenewal: {
        findFirst: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
      };
      deal: { create: jest.Mock };
      user: { findFirst: jest.Mock };
    };

    prisma.policy.findMany.mockResolvedValue([
      {
        id: 'pol-1',
        tenantId,
        customerId: 'cust-1',
        policyNumber: '999',
        insurer: 'Porto',
        productLine: 'Auto',
        premiumValue: 1200,
        status: 'active',
        effectiveFrom: new Date(Date.UTC(2025, 8, 4)),
        effectiveTo: new Date(Date.UTC(2026, 8, 4)),
        createdAt: now,
        brokerUserId: 'user-1',
        customer: {
          id: 'cust-1',
          name: 'Marina',
          tenantId,
          businessUnitId: 'bu-1',
          companyName: 'Acme',
          phone: '+5511999999999',
          email: 'marina@acme.com',
        },
        brokerUser: { id: 'user-1', name: 'Ana' },
      },
    ]);
    prisma.policyRenewal.findFirst.mockResolvedValue(null);
    prisma.policyRenewal.create.mockResolvedValue({
      id: 'ren-auto',
      tenantId,
      assignedUserId: 'user-1',
      status: 'RENEWAL_PENDING',
      taskCreatedAt: null,
      reminderSentAt: null,
      opportunityCreatedAt: null,
      dealId: null,
    });
    prisma.policyRenewal.update.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'ren-auto',
        tenantId,
        assignedUserId: 'user-1',
        status: data.status ?? 'RENEWAL_PENDING',
        taskCreatedAt: data.taskCreatedAt ?? now,
        reminderSentAt: data.reminderSentAt ?? null,
        opportunityCreatedAt: data.opportunityCreatedAt ?? null,
        dealId: data.dealId ?? null,
      }),
    );
    prisma.deal.create.mockResolvedValue({ id: 'deal-1' });
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });

    const result = await service.processDailyAutomation(now);
    expect(result.tasksCreated).toBe(1);
    expect(result.remindersSent).toBe(1);
    expect(result.opportunitiesCreated).toBe(1);
  });
});
