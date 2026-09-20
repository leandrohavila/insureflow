import { LeadLossReasonsService } from './lead-loss-reasons.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('LeadLossReasonsService', () => {
  const tenantId = 'tenant-1';

  function createService() {
    const findMany = jest
      .fn()
      .mockResolvedValue([
        { id: 'reason-1', tenantId, name: 'Sem orçamento', isActive: true },
      ]);
    const findFirst = jest.fn().mockResolvedValue(null);
    const create = jest
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: 'reason-new', ...data }),
      );

    const prisma = {
      leadLossReason: { findMany, findFirst, create },
    } as unknown as PrismaService;

    const service = new LeadLossReasonsService(prisma, {
      assertIds: jest.fn().mockResolvedValue([]),
    } as never);

    return { service, create };
  }

  it('lista motivos do tenant', async () => {
    const { service } = createService();
    const result = await service.findAll(tenantId);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.name).toBe('Sem orçamento');
  });

  it('cria motivo exigindo reactivationDays do catálogo', async () => {
    const { service, create } = createService();
    await service.create(tenantId, {
      name: 'Não respondeu',
      reactivationDays: 45,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Não respondeu',
          reactivationEnabled: true,
          reactivationDays: 45,
          maxAttempts: 3,
        }),
      }),
    );
  });

  it('rejeita create sem reactivationDays quando reativação ligada', async () => {
    const { service } = createService();
    await expect(
      service.create(tenantId, { name: 'Sem dias' } as never),
    ).rejects.toThrow(/reactivationDays/);
  });
});
