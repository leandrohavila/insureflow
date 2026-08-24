import { PropertiesService } from './properties.service';

describe('PropertiesService publication', () => {
  const user = {
    sub: 'user-1',
    tenantId: 't1',
    tenantSlug: 'insureflow',
    email: 'a@b.c',
    roles: ['admin'],
    permissions: ['properties:manage', 'properties:view'],
    currentBusinessUnitId: null,
  };

  function createService() {
    const row = {
      id: 'p1',
      tenantId: 't1',
      businessUnitId: 'bu1',
      slug: 'apto',
      title: 'Apto',
      published: false,
      publishedAt: null,
      price: 100,
      areaM2: null,
      images: [],
    };
    const repo = {
      findById: jest.fn().mockResolvedValue(row),
      update: jest.fn().mockImplementation((_id, data) =>
        Promise.resolve({ ...row, ...data, price: 100, images: [] }),
      ),
      isSlugTaken: jest.fn().mockResolvedValue(false),
      create: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          ...row,
          title: data.title,
          slug: data.slug,
          published: data.published,
          publishedAt: data.publishedAt,
          price: 100,
          images: [],
        }),
      ),
    };
    const buAccess = {
      fromUser: jest.fn().mockReturnValue(user),
      resolveIds: jest.fn().mockResolvedValue(null),
    };
    const prisma = {
      businessUnit: {
        findFirst: jest.fn().mockResolvedValue({ id: 'bu1', type: 'REAL_ESTATE' }),
      },
    };
    const service = new PropertiesService(
      repo as never,
      {} as never,
      {} as never,
      buAccess as never,
      prisma as never,
    );
    return { service, repo, buAccess, prisma };
  }

  it('publish define published e publishedAt', async () => {
    const { service, repo } = createService();
    const result = await service.publish(user as never, 'p1');
    expect(repo.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        published: true,
        status: 'AVAILABLE',
      }),
    );
    expect(result.published).toBe(true);
    expect(result.publishedAt).toBeInstanceOf(Date);
  });

  it('unpublish zera published e preserva o registro', async () => {
    const { service, repo } = createService();
    await service.unpublish(user as never, 'p1');
    expect(repo.update).toHaveBeenCalledWith('p1', { published: false });
  });

  it('findAll retorna vazio quando o escopo de BU não tem unidades', async () => {
    const { service, buAccess } = createService();
    buAccess.resolveIds.mockResolvedValue([]);
    const result = await service.findAll(user as never, { page: 1, limit: 20 });
    expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
  });

  it('create persiste featuredUntil quando informado', async () => {
    const { service, repo } = createService();
    await service.create(user as never, {
      businessUnitId: 'bu1',
      title: 'Apto',
      purpose: 'SALE',
      city: 'Cuiabá',
      price: 100,
      featured: true,
      featuredUntil: '2026-12-31T23:59:59.000Z',
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        featured: true,
        featuredUntil: new Date('2026-12-31T23:59:59.000Z'),
        published: false,
      }),
    );
  });

  it('create não publica o imóvel', async () => {
    const { service, repo } = createService();
    const result = await service.create(user as never, {
      businessUnitId: 'bu1',
      title: 'Apto',
      purpose: 'SALE',
      city: 'Cuiabá',
      price: 100,
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        published: false,
        publishedAt: null,
        status: 'DRAFT',
      }),
    );
    expect(result.published).toBe(false);
  });

  it('rejeita cadastro em unidade que não é imobiliária', async () => {
    const { service, prisma } = createService();
    prisma.businessUnit.findFirst.mockResolvedValue({
      id: 'bu-ins',
      type: 'INSURANCE',
    });
    await expect(
      service.create(user as never, {
        businessUnitId: 'bu-ins',
        title: 'Apto',
        purpose: 'SALE',
        city: 'Cuiabá',
        price: 100,
      }),
    ).rejects.toThrow('Imóvel deve pertencer a uma unidade imobiliária');
  });
});
