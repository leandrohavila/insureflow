import { CustomerActivationService } from './customer-activation.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('CustomerActivationService', () => {
  const tenantId = 'tenant-1';

  function createService(
    deal: Record<string, unknown>,
    customers?: {
      byPhone?: Array<Record<string, unknown>>;
    },
  ) {
    const customerCreate = jest
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: 'customer-new', ...data }),
      );
    const customerFindFirst = jest.fn().mockResolvedValue(null);
    const customerFindMany = jest.fn().mockImplementation(({ where }) => {
      if (where.phone?.contains) {
        return Promise.resolve(customers?.byPhone ?? []);
      }
      return Promise.resolve([]);
    });
    const dealUpdate = jest.fn().mockResolvedValue({ id: 'deal-1' });
    const submissionUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const activityUpdateMany = jest.fn().mockResolvedValue({ count: 1 });

    const tx = {
      customer: {
        findFirst: customerFindFirst,
        findMany: customerFindMany,
        create: customerCreate,
        update: jest.fn(),
      },
      deal: { update: dealUpdate },
      questionnaireSubmission: { updateMany: submissionUpdateMany },
      activity: { updateMany: activityUpdateMany },
    };

    const prisma = {
      deal: {
        findFirst: jest.fn().mockResolvedValue(deal),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as unknown as PrismaService;

    const activityEngine = { publish: jest.fn().mockResolvedValue(undefined) };
    const service = new CustomerActivationService(
      prisma,
      activityEngine as never,
    );

    return {
      service,
      customerCreate,
      customerFindMany,
      submissionUpdateMany,
      activityEngine,
    };
  }

  const wonDeal = {
    id: 'deal-1',
    tenantId,
    title: 'Lead: Marina Lima',
    company: 'Marina Lima',
    status: 'won',
    stage: 'fechado',
    customerId: null,
    wonAt: null,
    ownerUserId: 'user-owner',
    businessUnitId: 'bu-insurance',
    convertedLead: {
      id: 'lead-auto',
      name: 'Marina Lima',
      email: null,
      phone: '11988887777',
      company: null,
      document: null,
      documentType: null,
      assignedTo: 'Marina Lima',
      ownerUserId: 'user-owner',
      interestCategories: ['AUTO_INSURANCE'],
      businessUnitId: 'bu-insurance',
      businessUnits: [{ businessUnitId: 'bu-insurance', isOrigin: true }],
    },
  };

  it('copia o responsável do lead para o cliente criado e preserva as respostas', async () => {
    const deal = {
      ...wonDeal,
      convertedLead: {
        ...wonDeal.convertedLead,
        document: '52998224725',
        email: 'marina@example.com',
      },
    };
    const { service, customerCreate, submissionUpdateMany } =
      createService(deal);

    const result = await service.activateFromWonDeal(
      tenantId,
      'deal-1',
      'user-owner',
    );

    expect(result?.created).toBe(true);
    expect(result?.customerId).toBe('customer-new');
    expect(customerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerUserId: 'user-owner',
          tenantId,
          sourceDealId: 'deal-1',
        }),
      }),
    );
    expect(submissionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          OR: expect.arrayContaining([
            { dealId: 'deal-1' },
            { leadId: 'lead-auto' },
          ]),
        }),
        data: { customerId: 'customer-new' },
      }),
    );
  });

  it('não une outra pessoa só porque o final do telefone coincide', async () => {
    const { service, customerCreate, customerFindMany } = createService(
      wonDeal,
      {
        byPhone: [
          {
            id: 'customer-bruno',
            phone: '21988887777',
            email: 'bruno@example.com',
            document: null,
          },
        ],
      },
    );

    const result = await service.activateFromWonDeal(
      tenantId,
      'deal-1',
      'user-owner',
    );

    expect(customerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          phone: { contains: '11988887777' },
        }),
      }),
    );
    const phoneFilter = customerFindMany.mock.calls
      .map((call) => call[0]?.where?.phone?.contains)
      .find(Boolean);
    expect(phoneFilter).toBe('11988887777');
    expect(String(phoneFilter)).not.toBe('98887777');
    expect(result?.created).toBe(true);
    expect(customerCreate).toHaveBeenCalled();
  });
});
