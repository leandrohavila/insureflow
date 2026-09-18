import { syncLeadNextContactActivity } from './lead-next-contact.sync';
import { LEAD_NEXT_CONTACT_EVENT_KIND } from './lead-next-contact.util';

describe('syncLeadNextContactActivity', () => {
  it('cria atividade futura vinculada ao lead', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const create = jest.fn().mockResolvedValue({ id: 'act-1' });
    const at = new Date('2027-03-15T14:00:00.000Z');
    const created = await syncLeadNextContactActivity(
      { activity: { deleteMany, create } } as never,
      {
        tenantId: 'tenant-1',
        leadId: 'lead-1',
        performedById: 'user-1',
        at,
        type: 'whatsapp',
        notes: 'Contato em março para renovação',
      },
    );
    expect(created).toBe(1);
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        leadId: 'lead-1',
        status: 'pending',
        operationalEventKind: LEAD_NEXT_CONTACT_EVENT_KIND,
      },
    });
    const calls = create.mock.calls as unknown as Array<
      [
        {
          data: {
            type: string;
            leadId: string;
            performedById: string;
            occurredAt: Date;
            nextFollowUpAt: Date;
            operationalEventKind: string;
          };
        },
      ]
    >;
    expect(calls[0]?.[0]?.data).toEqual(
      expect.objectContaining({
        type: 'whatsapp',
        leadId: 'lead-1',
        performedById: 'user-1',
        occurredAt: at,
        nextFollowUpAt: at,
        operationalEventKind: LEAD_NEXT_CONTACT_EVENT_KIND,
      }),
    );
  });

  it('não cria atividade sem data', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const create = jest.fn();
    const created = await syncLeadNextContactActivity(
      { activity: { deleteMany, create } } as never,
      {
        tenantId: 'tenant-1',
        leadId: 'lead-1',
        performedById: 'user-1',
        at: null,
      },
    );
    expect(created).toBe(0);
    expect(create).not.toHaveBeenCalled();
  });
});
