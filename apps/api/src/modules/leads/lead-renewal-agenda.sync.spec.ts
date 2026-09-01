import { syncLeadRenewalActivities } from './lead-renewal-agenda.sync';
import { leadRenewalEventKind } from './lead-renewal-agenda.util';

describe('syncLeadRenewalActivities', () => {
  it('gera atividades RENEWAL 60/30/15 quando há vencimento futuro', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const createMany = jest.fn().mockResolvedValue({ count: 3 });
    const created = await syncLeadRenewalActivities(
      { activity: { deleteMany, createMany } } as never,
      {
        tenantId: 'tenant-1',
        leadId: 'lead-1',
        performedById: 'user-1',
        expiresAt: new Date('2099-12-31T12:00:00.000Z'),
      },
    );

    expect(created).toBe(3);
    expect(deleteMany).toHaveBeenCalled();
    const calls = createMany.mock.calls as unknown as Array<
      [
        {
          data: Array<{
            type: string;
            status: string;
            performedById: string;
            operationalEventKind: string;
          }>;
        },
      ]
    >;
    const payload = calls[0]?.[0];
    expect(payload?.data).toHaveLength(3);
    expect(payload?.data.map((item) => item.operationalEventKind)).toEqual([
      leadRenewalEventKind(60),
      leadRenewalEventKind(30),
      leadRenewalEventKind(15),
    ]);
    expect(payload?.data.every((item) => item.type === 'renewal')).toBe(true);
    expect(payload?.data.every((item) => item.performedById === 'user-1')).toBe(
      true,
    );
  });

  it('não cria tarefas quando não há vencimento', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const createMany = jest.fn();
    const created = await syncLeadRenewalActivities(
      { activity: { deleteMany, createMany } } as never,
      {
        tenantId: 'tenant-1',
        leadId: 'lead-1',
        performedById: 'user-1',
        expiresAt: null,
      },
    );
    expect(created).toBe(0);
    expect(createMany).not.toHaveBeenCalled();
  });
});
