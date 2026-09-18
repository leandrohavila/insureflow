import { NotFoundException } from '@nestjs/common';

import { Customer360Service } from './customer-360.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('Customer360Service', () => {
  const now = new Date('2026-08-20T12:00:00.000Z');
  const earlier = new Date('2026-01-01T12:00:00.000Z');

  function createService() {
    const empty = () => jest.fn().mockResolvedValue([]);
    const prisma = {
      lead: { findMany: empty() },
      deal: { findMany: empty() },
      policy: { findMany: empty() },
      communicationLog: { findMany: empty() },
      leadFollowUp: { findMany: empty() },
      policyRenewal: { findMany: empty() },
      crossSellOpportunity: { findMany: empty() },
      opportunity: { findMany: empty() },
      activity: { findMany: empty() },
      salesCommission: { findMany: empty() },
    } as unknown as PrismaService;

    const customers = {
      findCustomer: jest.fn().mockResolvedValue({
        id: 'cust-1',
        name: 'Maria Silva',
        document: '12345678900',
        email: 'maria@empresa.com',
        phone: '11999999999',
        createdAt: earlier,
        ownerUser: { id: 'user-1', name: 'Ana' },
        businessUnits: [
          { id: 'bu-1', name: 'Corretora Ávila', type: 'INSURANCE' },
        ],
        interestCategories: ['AUTO_INSURANCE'],
      }),
    };

    const opportunities = {
      generateForCustomer: jest.fn().mockResolvedValue({
        created: 1,
        suggestions: [{ type: 'LIFE_INSURANCE', score: 'HIGH' }],
      }),
    };

    const buAccess = {
      assertCustomerVisible: jest.fn().mockResolvedValue(undefined),
    };

    const service = new Customer360Service(
      prisma,
      customers as never,
      opportunities as never,
      buAccess as never,
    );

    return { service, prisma, customers, opportunities, buAccess };
  }

  it('agrega cadastro, abas e timeline do mais recente para o mais antigo', async () => {
    const { service, prisma } = createService();
    (prisma.lead.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'lead-1',
        name: 'Maria Lead',
        status: 'new',
        phone: '11888888888',
        email: 'lead@empresa.com',
        createdAt: earlier,
        dealId: 'deal-1',
        assignedTo: null,
        ownerUser: { id: 'user-1', name: 'Ana' },
        businessUnit: { id: 'bu-1', name: 'Corretora', type: 'INSURANCE' },
      },
    ]);
    (prisma.deal.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'deal-1',
        title: 'Auto Maria',
        value: 1200,
        stage: 'proposta',
        status: 'open',
        assignedTo: 'Ana',
        createdAt: now,
        updatedAt: now,
        stageEnteredAt: now,
        ownerUser: { id: 'user-1', name: 'Ana' },
        businessUnit: { id: 'bu-1', name: 'Corretora', type: 'INSURANCE' },
      },
    ]);
    (prisma.opportunity.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'opp-1',
        type: 'LIFE_INSURANCE',
        status: 'OPEN',
        score: 'HIGH',
        source: 'CROSS_SELL',
        estimatedValue: null,
        createdAt: now,
        updatedAt: now,
        assignedUser: { id: 'user-1', name: 'Ana' },
        businessUnit: { id: 'bu-1', name: 'Corretora', type: 'INSURANCE' },
      },
    ]);

    const result = await service.get360('tenant-1', 'cust-1', {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: ['admin'],
      permissions: ['clients:view'],
    });

    expect(result.customer.phones).toEqual(
      expect.arrayContaining(['11999999999', '11888888888']),
    );
    expect(result.customer.emails).toEqual(
      expect.arrayContaining(['maria@empresa.com', 'lead@empresa.com']),
    );
    expect(result.leads).toHaveLength(1);
    expect(result.deals[0].title).toBe('Auto Maria');
    expect(result.pendencies).toEqual([]);
    expect(result.finance?.closedDeals).toBe(0);
    expect(result.finance?.commissions).toEqual([]);
    expect(result.opportunities[0].type).toBe('LIFE_INSURANCE');
    expect(result.timeline[0].occurredAt >= result.timeline.at(-1)!.occurredAt).toBe(
      true,
    );
    expect(result.timeline.some((item) => item.kind === 'lead_created')).toBe(
      true,
    );
    expect(result.timeline.some((item) => item.kind === 'lead_converted')).toBe(
      true,
    );
  });

  it('propaga 404 quando o cliente não é visível', async () => {
    const { service, customers } = createService();
    customers.findCustomer.mockRejectedValue(
      new NotFoundException('Cliente não encontrado'),
    );

    await expect(service.get360('tenant-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('gera oportunidades respeitando ACL do cliente', async () => {
    const { service, buAccess, opportunities } = createService();

    await service.generate('tenant-1', 'cust-1', {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: ['sales'],
      permissions: ['crm:manage'],
    });

    expect(buAccess.assertCustomerVisible).toHaveBeenCalled();
    expect(opportunities.generateForCustomer).toHaveBeenCalledWith(
      'tenant-1',
      'cust-1',
    );
  });
});
