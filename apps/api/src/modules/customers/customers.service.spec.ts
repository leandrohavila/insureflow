import type { Prisma } from '@prisma/client';

import { CustomersService } from './customers.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('CustomersService status filter', () => {
  function createService() {
    const count = jest.fn().mockResolvedValue(0);
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      customer: { count, findMany },
      $transaction: jest.fn((ops: Array<Promise<unknown>>) => Promise.all(ops)),
    } as unknown as PrismaService;

    return {
      service: new CustomersService(
        prisma,
        { assertIds: jest.fn(async (_t: string, ids: string[]) => ids) } as never,
        { generateForCustomer: jest.fn() } as never,
      ),
      count,
      findMany,
    };
  }

  it('applies status filter in list query', async () => {
    const { service, count, findMany } = createService();

    await service.findCustomers('tenant-1', {
      page: 1,
      limit: 10,
      status: 'inactive',
    });

    const firstCall = count.mock.calls[0] as
      | [{ where: Prisma.CustomerWhereInput }]
      | undefined;
    const listWhere = firstCall?.[0]?.where;
    expect(listWhere).toMatchObject({
      tenantId: 'tenant-1',
      status: 'inactive',
    });

    const findManyCall = findMany.mock.calls[0] as
      | [{ where: Prisma.CustomerWhereInput }]
      | undefined;
    expect(findManyCall?.[0]?.where.status).toBe('inactive');
  });
});
