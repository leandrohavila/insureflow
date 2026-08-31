import { Prisma } from '@prisma/client';
import { PublicPropertiesService } from './public-properties.service';
import { PropertyLeadsService } from './property-leads.service';

describe('PublicPropertiesService', () => {
  const published = {
    id: 'p1',
    tenantId: 't1',
    businessUnitId: 'bu1',
    slug: 'apto-centro',
    title: 'Apto Centro',
    published: true,
    featured: true,
    price: { toNumber: () => 350000 },
    areaM2: null,
    city: 'Cuiabá',
    neighborhood: 'Centro',
    purpose: 'SALE',
    images: [],
  };

  function createService(overrides?: {
    findMany?: jest.Mock;
    count?: jest.Mock;
    findBySlug?: jest.Mock;
    findById?: jest.Mock;
  }) {
    const findMany = overrides?.findMany ?? jest.fn().mockResolvedValue([published]);
    const count = overrides?.count ?? jest.fn().mockResolvedValue(1);
    const findBySlug =
      overrides?.findBySlug ?? jest.fn().mockResolvedValue(published);
    const repo = { findMany, count, findBySlug, findById: overrides?.findById };
    const context = {
      resolve: jest.fn().mockResolvedValue({
        tenantId: 't1',
        tenantSlug: 'insureflow',
        businessUnitId: undefined,
      }),
    };
    const service = new PublicPropertiesService(context as never, repo as never);
    return { service, findMany, count, findBySlug, context };
  }

  it('lista apenas com published=true no filtro do repositório', async () => {
    const { service, findMany } = createService();
    await service.list({ tenantSlug: 'insureflow', page: 1, limit: 12 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ published: true, tenantId: 't1' }),
      0,
      12,
    );
  });

  it('highlights exige featured, published e destaque ainda vigente', async () => {
    const { service, findMany } = createService();
    await service.highlights({ tenantSlug: 'insureflow' });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        published: true,
        featured: true,
        featuredActiveOnly: true,
      }),
      0,
      12,
    );
  });

  it('search encaminha q e filtros de cidade/bairro/finalidade/preço', async () => {
    const { service, findMany } = createService();
    await service.search({
      tenantSlug: 'insureflow',
      q: 'cobertura',
      city: 'Cuiabá',
      neighborhood: 'Centro',
      purpose: 'SALE',
      priceMin: 200000,
      priceMax: 500000,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        published: true,
        q: 'cobertura',
        city: 'Cuiabá',
        neighborhood: 'Centro',
        purpose: 'SALE',
        priceMin: 200000,
        priceMax: 500000,
      }),
      0,
      12,
    );
  });

  it('detalhe por slug usa publishedOnly', async () => {
    const { service, findBySlug } = createService();
    await service.findBySlug('apto-centro', { tenantSlug: 'insureflow' });
    expect(findBySlug).toHaveBeenCalledWith('t1', 'apto-centro', true);
  });

  it('não revela imóvel não publicado no detalhe', async () => {
    const { service } = createService({
      findBySlug: jest.fn().mockResolvedValue(null),
    });
    await expect(
      service.findBySlug('rascunho', { tenantSlug: 'insureflow' }),
    ).rejects.toThrow('Imóvel não encontrado');
  });
});

describe('PropertyLeadsService.createPublic', () => {
  const published = {
    id: 'p1',
    published: true,
    businessUnitId: 'bu1',
  };

  function createLeadService(overrides?: {
    findById?: jest.Mock;
    findBySlug?: jest.Mock;
    businessUnitId?: string;
  }) {
    const leads = {
      create: jest.fn().mockResolvedValue({ id: 'pl1' }),
    };
    const properties = {
      findById:
        overrides?.findById ?? jest.fn().mockResolvedValue(published),
      findBySlug:
        overrides?.findBySlug ?? jest.fn().mockResolvedValue(published),
    };
    const context = {
      resolve: jest.fn().mockResolvedValue({
        tenantId: 't1',
        businessUnitId: overrides?.businessUnitId,
      }),
    };
    const service = new PropertyLeadsService(
      context as never,
      properties as never,
      leads as never,
    );
    return { service, leads, properties, context };
  }

  it('rejeita imóvel não publicado', async () => {
    const { service, leads } = createLeadService({
      findById: jest.fn().mockResolvedValue({
        id: 'p1',
        published: false,
        businessUnitId: 'bu1',
      }),
    });

    await expect(
      service.createPublic({
        tenantSlug: 'insureflow',
        propertyId: 'p1',
        name: 'Maria',
        email: 'maria@example.com',
      }),
    ).rejects.toThrow('Imóvel não encontrado');
    expect(leads.create).not.toHaveBeenCalled();
  });

  it('cria PropertyLead quando o imóvel está publicado (source default)', async () => {
    const { service, leads } = createLeadService();

    await service.createPublic({
      tenantSlug: 'insureflow',
      propertySlug: 'apto-centro',
      name: 'Maria',
      phone: '65999999999',
    });

    expect(leads.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 't1',
        propertyId: 'p1',
        businessUnitId: 'bu1',
        source: 'public_portal',
        name: 'Maria',
        metadata: Prisma.DbNull,
      }),
    );
  });

  it('persiste source informado e metadata UTM (não hardcode public_portal)', async () => {
    const { service, leads } = createLeadService();

    await service.createPublic({
      tenantSlug: 'insureflow',
      propertySlug: 'apto-centro',
      name: 'Maria',
      phone: '34999999999',
      source: 'public_portal_whatsapp',
      metadata: {
        utm_source: 'google',
        utm_campaign: 'uberaba',
        gclid: 'gclid-1',
        ignored: 'drop',
      },
    });

    expect(leads.create).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: 'p1',
        source: 'public_portal_whatsapp',
        metadata: {
          utm_source: 'google',
          utm_campaign: 'uberaba',
          gclid: 'gclid-1',
        },
      }),
    );
  });

  it('cria lead genérico sem imóvel quando a BU está resolvida', async () => {
    const { service, leads, properties } = createLeadService({
      businessUnitId: 'bu1',
    });

    await service.createPublic({
      tenantSlug: 'insureflow',
      businessUnitSlug: 'avila-imoveis',
      name: 'Maria',
      phone: '34999999999',
      source: 'public_portal_home',
      metadata: { landingPage: '/', placement: 'home' },
    });

    expect(properties.findById).not.toHaveBeenCalled();
    expect(properties.findBySlug).not.toHaveBeenCalled();
    expect(leads.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 't1',
        businessUnitId: 'bu1',
        propertyId: null,
        source: 'public_portal_home',
        metadata: { landingPage: '/', placement: 'home' },
      }),
    );
  });

  it('rejeita lead genérico sem unidade de negócio', async () => {
    const { service, leads } = createLeadService();

    await expect(
      service.createPublic({
        tenantSlug: 'insureflow',
        name: 'Maria',
        phone: '34999999999',
        source: 'public_portal_home',
      }),
    ).rejects.toThrow('Informe a unidade de negócio');
    expect(leads.create).not.toHaveBeenCalled();
  });

  it('rejeita ausência de e-mail e telefone', async () => {
    const { service, leads } = createLeadService();

    await expect(
      service.createPublic({
        tenantSlug: 'insureflow',
        propertySlug: 'apto-centro',
        name: 'Maria',
      }),
    ).rejects.toThrow('Informe e-mail ou telefone');
    expect(leads.create).not.toHaveBeenCalled();
  });

  it('não revela imóvel unpublished por slug', async () => {
    const { service, leads } = createLeadService({
      findBySlug: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.createPublic({
        tenantSlug: 'insureflow',
        propertySlug: 'rascunho',
        name: 'Maria',
        phone: '34999999999',
      }),
    ).rejects.toThrow('Imóvel não encontrado');
    expect(leads.create).not.toHaveBeenCalled();
  });

  it('não revela imóvel de outra unidade de negócio', async () => {
    const { service, leads } = createLeadService({
      businessUnitId: 'bu-other',
    });

    await expect(
      service.createPublic({
        tenantSlug: 'insureflow',
        businessUnitSlug: 'outra',
        propertySlug: 'apto-centro',
        name: 'Maria',
        phone: '34999999999',
      }),
    ).rejects.toThrow('Imóvel não encontrado');
    expect(leads.create).not.toHaveBeenCalled();
  });
});
