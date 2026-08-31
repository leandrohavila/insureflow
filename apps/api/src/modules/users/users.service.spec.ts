import { ForbiddenException } from '@nestjs/common';

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

describe('UsersService super_admin escalation guard', () => {
  const tenantId = 'tenant-1';
  const superAdminRoleId = 'role-super';
  const adminRoleId = 'role-admin';
  const operadorRoleId = 'role-operador';
  const buId1 = 'bu-corretora';
  const targetUserId = 'user-target';

  const adminActor: UserManagementActor = {
    userId: 'actor-admin',
    roles: ['admin'],
    permissions: ['users:manage'],
  };

  const superAdminActor: UserManagementActor = {
    userId: 'actor-super',
    roles: ['super_admin'],
    permissions: ['users:manage', 'tenants:manage'],
  };

  const tenantManageActor: UserManagementActor = {
    userId: 'actor-tenant-mgr',
    roles: ['admin'],
    permissions: ['users:manage', 'tenants:manage'],
  };

  function roleRows(ids: string[]) {
    const byId: Record<string, { id: string; slug: string }> = {
      [superAdminRoleId]: { id: superAdminRoleId, slug: 'super_admin' },
      [adminRoleId]: { id: adminRoleId, slug: 'admin' },
      [operadorRoleId]: { id: operadorRoleId, slug: 'operador' },
    };
    return ids.map((id) => byId[id]!);
  }

  function createService() {
    const roleFindMany = jest
      .fn()
      .mockImplementation(({ where }: { where: { id?: { in: string[] } } }) => {
        const ids = where.id?.in ?? [];
        return Promise.resolve(roleRows(ids));
      });

    const userFindFirst = jest.fn().mockImplementation(({ where }) => {
      if (where.id && where.tenantId) {
        const userId = where.id as string;
        const isSuperTarget = userId === targetUserId;
        const isNewUser = userId === 'user-new';
        if (!isSuperTarget && !isNewUser) return Promise.resolve(null);
        const slug = isNewUser ? 'super_admin' : 'super_admin';
        const roleId = isNewUser ? superAdminRoleId : superAdminRoleId;
        return Promise.resolve({
          id: userId,
          tenantId,
          email: isNewUser ? 'new@example.com' : 'super@example.com',
          name: isNewUser ? 'New User' : 'Super User',
          initials: isNewUser ? 'NU' : 'SU',
          title: '',
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentBusinessUnitId: null,
          userRoles: isNewUser
            ? [
                {
                  userId,
                  roleId: operadorRoleId,
                  role: { id: operadorRoleId, name: 'Operador', slug: 'operador' },
                },
              ]
            : [
                {
                  userId,
                  roleId,
                  role: { id: roleId, name: 'Super Admin', slug },
                },
              ],
          businessUnits: [],
        });
      }
      if (where.email) return Promise.resolve(null);
      return Promise.resolve(null);
    });

    const userUpdate = jest.fn().mockResolvedValue({});
    const userCreate = jest.fn().mockResolvedValue({
      id: 'user-new',
      email: 'new@example.com',
      name: 'New User',
    });
    const userRoleCreateMany = jest.fn().mockResolvedValue({ count: 1 });
    const userRoleDeleteMany = jest.fn().mockResolvedValue({ count: 1 });

    const transaction = jest.fn().mockImplementation(async (fn) =>
      fn({
        user: {
          create: userCreate,
          update: userUpdate,
        },
        userRole: {
          createMany: userRoleCreateMany,
          deleteMany: userRoleDeleteMany,
        },
        userBusinessUnit: {
          createMany: jest.fn(),
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
        count: jest.fn().mockImplementation(({ where }: { where: { id?: { in: string[] } } }) =>
          Promise.resolve(where.id?.in?.length ?? 0),
        ),
      },
      refreshToken: { deleteMany: jest.fn() },
      $transaction: transaction,
    } as unknown as PrismaService;

    const auditLogs = { enqueue: jest.fn() };

    return {
      service: new UsersService(prisma, auditLogs as never),
      roleFindMany,
      userFindFirst,
      userUpdate,
      transaction,
      auditLogs,
    };
  }

  function createPayload(roleIds: string[]) {
    return {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      roleIds,
      businessUnitIds: [buId1],
    };
  }

  describe('POST /users (create)', () => {
    it('nega admin com users:manage ao criar super_admin', async () => {
      const { service } = createService();

      await expect(
        service.create(tenantId, {
          ...createPayload([superAdminRoleId]),
          email: 'new-super@example.com',
          name: 'New Super',
        }, adminActor),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite super_admin criar super_admin', async () => {
      const { service, transaction } = createService();

      await service.create(tenantId, {
        ...createPayload([superAdminRoleId]),
        email: 'new-super@example.com',
        name: 'New Super',
      }, superAdminActor);

      expect(transaction).toHaveBeenCalled();
    });

    it('permite actor com tenants:manage criar super_admin', async () => {
      const { service, transaction } = createService();

      await service.create(tenantId, {
        ...createPayload([superAdminRoleId]),
        email: 'new-super@example.com',
        name: 'New Super',
      }, tenantManageActor);

      expect(transaction).toHaveBeenCalled();
    });

    it('permite admin criar perfil não-super_admin', async () => {
      const { service, transaction } = createService();

      await service.create(tenantId, {
        ...createPayload([operadorRoleId]),
        email: 'operador@example.com',
        name: 'Operador',
      }, adminActor);

      expect(transaction).toHaveBeenCalled();
    });
  });

  describe('PUT /users/:id/roles (setRoles)', () => {
    it('nega admin ao promover usuário para super_admin', async () => {
      const { service, userFindFirst } = createService();
      userFindFirst.mockImplementationOnce(({ where }) => {
        if (where.id === 'user-regular') {
          return Promise.resolve({
            id: 'user-regular',
            tenantId,
            email: 'regular@example.com',
            name: 'Regular',
            initials: 'RG',
            title: '',
            isActive: true,
            lastLoginAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            currentBusinessUnitId: null,
            userRoles: [
              {
                userId: 'user-regular',
                roleId: adminRoleId,
                role: { id: adminRoleId, name: 'Admin', slug: 'admin' },
              },
            ],
            businessUnits: [],
          });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.setRoles(
          tenantId,
          'user-regular',
          { roleIds: [superAdminRoleId] },
          adminActor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('nega admin ao remover super_admin de usuário', async () => {
      const { service } = createService();

      await expect(
        service.setRoles(
          tenantId,
          targetUserId,
          { roleIds: [adminRoleId] },
          adminActor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('nega admin ao editar roles de usuário super_admin', async () => {
      const { service } = createService();

      await expect(
        service.setRoles(
          tenantId,
          targetUserId,
          { roleIds: [superAdminRoleId, operadorRoleId] },
          adminActor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite super_admin alterar roles de outro super_admin', async () => {
      const { service, transaction } = createService();

      await service.setRoles(
        tenantId,
        targetUserId,
        { roleIds: [superAdminRoleId, adminRoleId] },
        superAdminActor,
      );

      expect(transaction).toHaveBeenCalled();
    });
  });

  describe('PATCH /users/:id (update)', () => {
    it('nega admin ao editar perfil de super_admin', async () => {
      const { service } = createService();

      await expect(
        service.update(
          tenantId,
          targetUserId,
          { name: 'Alterado' },
          adminActor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite super_admin editar perfil de super_admin', async () => {
      const { service, userUpdate } = createService();

      await service.update(
        tenantId,
        targetUserId,
        { name: 'Alterado' },
        superAdminActor,
      );

      expect(userUpdate).toHaveBeenCalled();
    });
  });

  describe('GET assignable-roles', () => {
    it('oculta super_admin para admin sem tenants:manage', async () => {
      const { service, roleFindMany } = createService();
      roleFindMany.mockResolvedValueOnce([
        {
          id: superAdminRoleId,
          slug: 'super_admin',
          name: 'Super Admin',
          description: null,
          isSystem: true,
          defaultDataScope: 'tenant',
        },
        {
          id: adminRoleId,
          slug: 'admin',
          name: 'Admin',
          description: null,
          isSystem: true,
          defaultDataScope: 'tenant',
        },
      ]);

      const result = await service.listAssignableRoles(tenantId, adminActor);
      expect(result.data.map((r) => r.slug)).toEqual(['admin']);
    });

    it('inclui super_admin para super_admin actor', async () => {
      const { service, roleFindMany } = createService();
      roleFindMany.mockResolvedValueOnce([
        {
          id: superAdminRoleId,
          slug: 'super_admin',
          name: 'Super Admin',
          description: null,
          isSystem: true,
          defaultDataScope: 'tenant',
        },
        {
          id: adminRoleId,
          slug: 'admin',
          name: 'Admin',
          description: null,
          isSystem: true,
          defaultDataScope: 'tenant',
        },
      ]);

      const result = await service.listAssignableRoles(tenantId, superAdminActor);
      expect(result.data.map((r) => r.slug)).toContain('super_admin');
    });
  });
});
