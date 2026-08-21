import { SalesSlaEngine } from './sales-sla-engine.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { CommunicationsService } from '../communications/communications.service';

describe('SalesSlaEngine', () => {
  const now = new Date('2026-08-20T10:00:00.000Z');

  function createEngine() {
    const publish = jest.fn().mockResolvedValue({ id: 'act-1', created: true });
    const dispatch = jest.fn().mockResolvedValue({ id: 'comm-1', status: 'sent' });
    const prisma = {
      tenant: { findMany: jest.fn().mockResolvedValue([{ id: 'tenant-1' }]) },
      user: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'user-1', name: 'Ana', email: 'ana@avila.com' }),
      },
      deal: { findMany: jest.fn().mockResolvedValue([]) },
      policyRenewal: { findMany: jest.fn().mockResolvedValue([]) },
      opportunity: { findMany: jest.fn().mockResolvedValue([]) },
      crossSellOpportunity: { findMany: jest.fn().mockResolvedValue([]) },
      activity: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
      teamMember: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    const engine = new SalesSlaEngine(
      prisma as unknown as PrismaService,
      { publish } as unknown as ActivityEngineService,
      { dispatch } as unknown as CommunicationsService,
    );

    return { engine, prisma, publish, dispatch };
  }

  it('gera sla_overdue e notifica o responsável por e-mail', async () => {
    const { engine, prisma, publish, dispatch } = createEngine();
    prisma.deal.findMany.mockResolvedValue([
      {
        id: 'deal-1',
        title: 'Auto Maria',
        stage: 'cotacao',
        stageEnteredAt: new Date('2026-08-16T10:00:00.000Z'),
        ownerUser: {
          id: 'user-1',
          name: 'Ana',
          email: 'ana@avila.com',
          primaryTeamId: null,
        },
        businessUnit: { type: 'INSURANCE' },
        pipeline: {
          stages: [
            {
              slug: 'cotacao',
              maxDays: 3,
              label: 'Cotação',
              alertTarget: 'OWNER',
            },
          ],
        },
        customer: { id: 'cust-1' },
        convertedLead: { id: 'lead-1' },
      },
    ]);

    const result = await engine.processTenant('tenant-1', now);

    expect(result.overdue).toBe(1);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ operationalEventKind: 'sla_overdue' }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'EMAIL',
        purpose: 'FOLLOW_UP',
        to: 'ana@avila.com',
      }),
    );
  });

  it('escalona gestor após 5 dias no estágio', async () => {
    const { engine, prisma, publish } = createEngine();
    prisma.deal.findMany.mockResolvedValue([
      {
        id: 'deal-2',
        title: 'Vida João',
        stage: 'proposta',
        stageEnteredAt: new Date('2026-08-14T10:00:00.000Z'),
        ownerUser: {
          id: 'user-1',
          name: 'Ana',
          email: 'ana@avila.com',
          primaryTeamId: null,
        },
        businessUnit: { type: 'INSURANCE' },
        pipeline: {
          stages: [
            {
              slug: 'proposta',
              maxDays: 7,
              label: 'Proposta',
              alertTarget: 'MANAGER',
            },
          ],
        },
        customer: null,
        convertedLead: null,
      },
    ]);
    prisma.user.findFirst
      .mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', email: 'a@x.com' })
      .mockResolvedValue({ id: 'mgr-1', name: 'Gestor', email: 'g@x.com' });

    const result = await engine.processTenant('tenant-1', now);
    expect(result.escalated).toBeGreaterThanOrEqual(1);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'sla_escalated',
        metadata: expect.objectContaining({ level: 'OWNER' }),
      }),
    );
  });

  it('alerta renovação ociosa', async () => {
    const { engine, prisma, publish } = createEngine();
    prisma.policyRenewal.findMany.mockResolvedValue([
      {
        id: 'ren-1',
        customerId: 'cust-1',
        dealId: null,
        policyNumber: '999',
        product: 'Auto',
        status: 'RENEWAL_PENDING',
        renewalDate: new Date('2026-09-04T00:00:00.000Z'),
        updatedAt: new Date('2026-08-01T00:00:00.000Z'),
        assignedUserId: 'user-1',
      },
    ]);

    const result = await engine.processTenant('tenant-1', now);
    expect(result.renewals).toBe(1);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ operationalEventKind: 'renewal_overdue' }),
    );
  });
});
