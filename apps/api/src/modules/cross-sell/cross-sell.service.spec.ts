import { CrossSellService } from './cross-sell.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('CrossSellService.generateForCustomer', () => {
  it('cria oportunidade pendente a partir das regras', async () => {
    const upsert = jest.fn().mockResolvedValue({
      createdAt: new Date('2026-08-20T10:00:00.000Z'),
      updatedAt: new Date('2026-08-20T10:00:00.000Z'),
    });
    const prisma = {
      crossSellOpportunity: { upsert },
    } as unknown as PrismaService;

    const service = new CrossSellService(
      prisma,
      { dispatch: jest.fn(), resolveRecipient: jest.fn() } as never,
      { findActiveForChannel: jest.fn() } as never,
    );
    const created = await service.generateForCustomer('tenant-1', 'cust-1', [
      'AUTO_INSURANCE',
    ]);

    expect(created).toBe(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          originCategory: 'AUTO_INSURANCE',
          suggestedCategory: 'LIFE_INSURANCE',
        }),
      }),
    );
  });

  it('envia comunicação ao marcar oportunidade como CONTACTED', async () => {
    const dispatch = jest.fn().mockResolvedValue({ id: 'log-1', status: 'sent' });
    const prisma = {
      crossSellOpportunity: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'opp-1',
          tenantId: 'tenant-1',
          customerId: 'cust-1',
          originCategory: 'AUTO_INSURANCE',
          suggestedCategory: 'LIFE_INSURANCE',
          status: 'PENDING',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'opp-1',
          tenantId: 'tenant-1',
          customerId: 'cust-1',
          originCategory: 'AUTO_INSURANCE',
          suggestedCategory: 'LIFE_INSURANCE',
          status: 'CONTACTED',
          convertedRevenue: null,
          customer: { id: 'cust-1', name: 'Marina', document: '1' },
        }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'cust-1',
          name: 'Marina',
          phone: '+5511999999999',
          email: 'marina@acme.com',
          companyName: 'Acme',
          interestCategories: ['AUTO_INSURANCE'],
        }),
      },
    } as unknown as PrismaService;

    const service = new CrossSellService(
      prisma,
      {
        dispatch,
        resolveRecipient: jest.fn().mockResolvedValue('+5511999999999'),
      } as never,
      { findActiveForChannel: jest.fn().mockResolvedValue(null) } as never,
    );

    await service.update(
      'tenant-1',
      'opp-1',
      { status: 'CONTACTED' },
      'user-1',
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'CROSS_SELL',
        customerId: 'cust-1',
        channel: 'WHATSAPP',
      }),
    );
  });
});
