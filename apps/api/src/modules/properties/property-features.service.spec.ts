import { PropertyFeaturesService } from './property-features.service';

describe('PropertyFeaturesService.replace', () => {
  const user = {
    sub: 'user-1',
    tenantId: 't1',
    tenantSlug: 'insureflow',
    email: 'a@b.c',
    roles: ['admin'],
    permissions: ['properties:manage'],
    currentBusinessUnitId: null,
  };

  function createService() {
    const properties = {
      findOne: jest.fn().mockResolvedValue({ id: 'p1' }),
    };
    const features = {
      deleteByProperty: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      findByProperty: jest.fn().mockResolvedValue([
        {
          valueBoolean: true,
          definition: { key: 'piscina', label: 'Piscina', valueType: 'BOOLEAN' },
        },
      ]),
    };
    const definitions = {
      findMany: jest.fn().mockResolvedValue([
        { id: 'def-1', valueType: 'BOOLEAN', key: 'piscina', label: 'Piscina' },
      ]),
    };
    const service = new PropertyFeaturesService(
      properties as never,
      features as never,
      definitions as never,
    );
    return { service, features };
  }

  it('grava valor booleano conforme a definição', async () => {
    const { service, features } = createService();
    const result = await service.replace(user as never, 'p1', {
      items: [{ definitionId: 'def-1', value: true }],
    });
    expect(features.deleteByProperty).toHaveBeenCalledWith('p1');
    expect(features.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        definitionId: 'def-1',
        valueBoolean: true,
        valueText: null,
        valueNumber: null,
      }),
    ]);
    expect(result[0]).toEqual(
      expect.objectContaining({ key: 'piscina', value: true }),
    );
  });

  it('rejeita definição de outro tenant', async () => {
    const { service } = createService();
    await expect(
      service.replace(user as never, 'p1', {
        items: [{ definitionId: 'unknown', value: true }],
      }),
    ).rejects.toThrow('Característica inválida para este tenant');
  });
});
