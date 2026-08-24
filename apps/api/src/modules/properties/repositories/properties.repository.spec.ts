import { PropertiesRepository } from './properties.repository';

describe('PropertiesRepository filters', () => {
  function createRepo() {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const repo = new PropertiesRepository({
      property: { findMany, count },
    } as never);
    return { repo, findMany };
  }

  it('aplica published, cidade, bairro, finalidade e faixa de preço', async () => {
    const { repo, findMany } = createRepo();
    await repo.findMany(
      {
        tenantId: 't1',
        city: 'Cuiabá',
        neighborhood: 'Centro',
        purpose: 'SALE',
        priceMin: 200000,
        priceMax: 500000,
        published: true,
      },
      0,
      12,
    );

    const arg = findMany.mock.calls[0][0];
    expect(arg.where.AND).toEqual(
      expect.arrayContaining([
        { tenantId: 't1' },
        { published: true },
        { purpose: 'SALE' },
        { price: { gte: 200000, lte: 500000 } },
        { city: { equals: 'Cuiabá', mode: 'insensitive' } },
        { neighborhood: { equals: 'Centro', mode: 'insensitive' } },
      ]),
    );
  });

  it('não inclui published quando o filtro admin omite o campo', async () => {
    const { repo, findMany } = createRepo();
    await repo.findMany({ tenantId: 't1' }, 0, 20);
    const arg = findMany.mock.calls[0][0];
    expect(arg.where.AND).toEqual([{ tenantId: 't1' }]);
  });

  it('destaque vigente inclui featuredUntil nulo ou futuro', async () => {
    const { repo, findMany } = createRepo();
    await repo.findMany(
      { tenantId: 't1', featured: true, featuredActiveOnly: true, published: true },
      0,
      12,
    );
    const arg = findMany.mock.calls[0][0];
    expect(arg.where.AND).toEqual(
      expect.arrayContaining([
        { featured: true },
        { published: true },
        {
          OR: [{ featuredUntil: null }, { featuredUntil: { gt: expect.any(Date) } }],
        },
      ]),
    );
  });
});
