import { PropertyOwnersService } from './property-owners.service';

describe('PropertyOwnersService', () => {
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
      findOne: jest.fn().mockResolvedValue({ id: 'p1', tenantId: 't1' }),
    };
    const owners = {
      findByProperty: jest.fn().mockResolvedValue([]),
      findOwned: jest.fn().mockResolvedValue({
        id: 'o1',
        propertyId: 'p1',
        isPrimary: false,
        person: { name: 'Maria' },
      }),
      create: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'o1',
          ...data,
          sharePercent: data.sharePercent ?? null,
          person: { name: 'Maria', kind: 'INDIVIDUAL' },
        }),
      ),
      update: jest.fn().mockImplementation((id, data) =>
        Promise.resolve({
          id,
          isPrimary: data.isPrimary ?? false,
          publicVisible: data.publicVisible ?? false,
          sharePercent: null,
          person: { name: 'Maria', kind: 'INDIVIDUAL' },
        }),
      ),
      delete: jest.fn().mockResolvedValue({ id: 'o1' }),
      clearPrimary: jest.fn().mockResolvedValue({ count: 1 }),
    };
    const persons = {
      findById: jest.fn().mockResolvedValue({ id: 'person-1', tenantId: 't1' }),
    };
    const service = new PropertyOwnersService(
      properties as never,
      owners as never,
      persons as never,
    );
    return { service, properties, owners, persons };
  }

  it('define um único principal limpando os demais', async () => {
    const { service, owners } = createService();
    await service.add(user as never, 'p1', {
      personId: 'person-1',
      isPrimary: true,
      publicVisible: true,
    });
    expect(owners.clearPrimary).toHaveBeenCalledWith('p1');
    expect(owners.create).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: 'p1',
        personId: 'person-1',
        isPrimary: true,
        publicVisible: true,
      }),
    );
  });

  it('setPrimary também remove o principal anterior', async () => {
    const { service, owners } = createService();
    await service.setPrimary(user as never, 'p1', 'o1');
    expect(owners.clearPrimary).toHaveBeenCalledWith('p1');
    expect(owners.update).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ isPrimary: true }),
    );
  });

  it('rejeita pessoa de outro tenant', async () => {
    const { service, persons } = createService();
    persons.findById.mockResolvedValue(null);
    await expect(
      service.add(user as never, 'p1', { personId: 'other' }),
    ).rejects.toThrow('Pessoa não encontrada');
  });
});
