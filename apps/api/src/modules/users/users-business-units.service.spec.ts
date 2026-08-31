import { BadRequestException } from '@nestjs/common';

import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UsersService } from './users.service';
import type { UserManagementActor } from './users-super-admin-guard.util';

jest.mock('./users-roles.util', () => ({
  ...jest.requireActual('./users-roles.util'),
  ensureGoLiveRoles: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('UsersService primary business unit (P1)', () => {
  const tenantId = 'tenant-1';
  const operadorRoleId = 'role-operador';
  const buId1 = 'bu-corretora';
  const buId2 = 'bu-imoveis';
  const inactiveUserId = 'user-inactive';
  const activeUserId = 'user-active';

  const adminActor: UserManagementActor = {
    userId: 'actor-admin',
    roles: ['admin'],
    permissions: ['users:manage'],
  };

  function createService() {
    const roleFindMany = jest.fn().mockResolvedValue([
      { id: operadorRoleId, slug: 'operador' },
    ]);

    const userFindFirst = jest.fn().mockImplementation(({ where }) => {
      if (where.email) return Promise.resolve(null);

      if (where.id === inactiveUserId) {
        return Promise.resolve({
          id: inactiveUserId,
          tenantId,
          email: 'inactive@example.com',
          name: 'Inactive',
          initials: 'IN',
          title: '',
          isActive: false,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentBusinessUnitId: null,
          userRoles: [
            {
              userId: inactiveUserId,
              roleId: operadorRoleId,
              role: { id: operadorRoleId, name: 'Operador', slug: 'operador' },
            },
          ],
          businessUnits: [],
        });
      }

      if (where.id === activeUserId) {
        return Promise.resolve({
          id: activeUserId,
          tenantId,
          email: 'active@example.com',
          name: 'Active',
          initials: 'AC',
          title: '',
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentBusinessUnitId: buId1,
          userRoles: [
            {
              userId: activeUserId,
              roleId: operadorRoleId,
              role: { id: operadorRoleId, name: 'Operador', slug: 'operador' },
            },
          ],
          businessUnits: [
            {
              businessUnitId: buId1,
              createdAt: new Date(),
              businessUnit: {
                id: buId1,
                name: 'Corretora',
                slug: 'corretora-avila',
                type: 'INSURANCE',
                isActive: true,
              },
            },
          ],
        });
      }

      if (where.id === 'user-new') {
        return Promise.resolve({
          id: 'user-new',
          tenantId,
          email: 'new@example.com',
          name: 'New User',
          initials: 'NU',
          title: '',
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentBusinessUnitId: buId1,
          userRoles: [
            {
              userId: 'user-new',
              roleId: operadorRoleId,
              role: { id: operadorRoleId, name: 'Operador', slug: 'operador' },
            },
          ],
          businessUnits: [
            {
              businessUnitId: buId1,
              createdAt: new Date(),
              businessUnit: {
                id: buId1,
                name: 'Corretora',
                slug: 'corretora-avila',
                type: 'INSURANCE',
                isActive: true,
              },
            },
          ],
        });
      }

      return Promise.resolve(null);
    });

    const userUpdate = jest.fn().mockResolvedValue({});
    const userCreate = jest.fn().mockResolvedValue({
      id: 'user-new',
      email: 'new@example.com',
      name: 'New User',
    });
    const buCreateMany = jest.fn().mockResolvedValue({ count: 1 });
    const buDeleteMany = jest.fn().mockResolvedValue({ count: 1 });

    const transaction = jest.fn().mockImplementation(async (fn) =>
      fn({
        user: {
          create: userCreate,
          update: userUpdate,
        },
        userRole: {
          createMany: jest.fn(),
        },
        userBusinessUnit: {
          createMany: buCreateMany,
          deleteMany: buDeleteMany,
        },
      }),
    );

    const prisma = {
      role: { findMany: roleFindMany },
      user: {
        findFirst: userFindFirst,
        findMany: jest.fn().mockResolvedValue([]),
        update: userUpdate,
      },
      businessUnit: {
        count: jest.fn().mockImplementation(({ where }: { where: { id: { in: string[] } } }) =>
          Promise.resolve(where.id.in.length),
        ),
      },
      refreshToken: { deleteMany: jest.fn() },
      $transaction: transaction,
    } as unknown as PrismaService;

    const auditLogs = { enqueue: jest.fn() };

    return {
      service: new UsersService(prisma, auditLogs as never),
      userFindFirst,
      userUpdate,
      transaction,
      buCreateMany,
      userCreateUpdate: userUpdate,
    };
  }

  describe('POST /users (create)', () => {
    it('bloqueia criação sem empresa', async () => {
      const { service } = createService();

      await expect(
        service.create(
          tenantId,
          {
            email: 'sem-bu@example.com',
            password: 'password123',
            name: 'Sem BU',
            roleIds: [operadorRoleId],
            businessUnitIds: [],
          },
          adminActor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('define currentBusinessUnitId consistente ao criar', async () => {
      const { service, transaction } = createService();

      await service.create(
        tenantId,
        {
          email: 'com-bu@example.com',
          password: 'password123',
          name: 'Com BU',
          roleIds: [operadorRoleId],
          businessUnitIds: [buId1, buId2],
          primaryBusinessUnitId: buId2,
        },
        adminActor,
      );

      expect(transaction).toHaveBeenCalled();
      const txArg = transaction.mock.calls[0]?.[0];
      const tx = {
        user: {
          create: jest.fn().mockResolvedValue({ id: 'user-new' }),
          update: jest.fn(),
        },
        userRole: { createMany: jest.fn() },
        userBusinessUnit: { createMany: jest.fn() },
      };
      await txArg(tx);
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-new' },
        data: { currentBusinessUnitId: buId2 },
      });
    });
  });

  describe('PUT /users/:id/business-units (setBusinessUnits)', () => {
    it('impede lista vazia (remoção da última empresa)', async () => {
      const { service } = createService();

      await expect(
        service.setBusinessUnits(
          tenantId,
          activeUserId,
          { businessUnitIds: [] },
          adminActor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('atualiza primary para empresa válida da lista', async () => {
      const { service, transaction } = createService();

      await service.setBusinessUnits(
        tenantId,
        activeUserId,
        { businessUnitIds: [buId1, buId2], primaryBusinessUnitId: buId2 },
        adminActor,
      );

      expect(transaction).toHaveBeenCalled();
    });
  });

  describe('PATCH /users/:id/status (activate)', () => {
    it('bloqueia ativação sem empresa principal', async () => {
      const { service } = createService();

      await expect(
        service.setStatus(
          tenantId,
          inactiveUserId,
          { isActive: true },
          adminActor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('permite ativação com empresa principal válida', async () => {
      const { service, userFindFirst, userUpdate } = createService();
      userFindFirst.mockImplementation(({ where }) => {
        if (where.id === activeUserId) {
          return Promise.resolve({
            id: activeUserId,
            tenantId,
            email: 'was-inactive@example.com',
            name: 'Was Inactive',
            initials: 'WI',
            title: '',
            isActive: false,
            lastLoginAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            currentBusinessUnitId: buId1,
            userRoles: [],
            businessUnits: [
              {
                businessUnitId: buId1,
                createdAt: new Date(),
                businessUnit: {
                  id: buId1,
                  name: 'Corretora',
                  slug: 'corretora-avila',
                  type: 'INSURANCE',
                  isActive: true,
                },
              },
            ],
          });
        }
        return Promise.resolve(null);
      });

      await service.setStatus(
        tenantId,
        activeUserId,
        { isActive: true },
        adminActor,
      );

      expect(userUpdate).toHaveBeenCalledWith({
        where: { id: activeUserId },
        data: { isActive: true },
      });
    });
  });
});
