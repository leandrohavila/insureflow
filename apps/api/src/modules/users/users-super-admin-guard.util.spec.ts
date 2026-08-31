import {
  assertCanManageSuperAdmin,
  canManageSuperAdmin,
  includesSuperAdminSlug,
  requiresSuperAdminActorForRoleChange,
  userHasSuperAdminRole,
} from './users-super-admin-guard.util';

describe('users-super-admin-guard.util', () => {
  describe('canManageSuperAdmin', () => {
    it('permite actor com role super_admin', () => {
      expect(
        canManageSuperAdmin({
          roles: ['super_admin'],
          permissions: ['users:manage'],
        }),
      ).toBe(true);
    });

    it('permite actor com tenants:manage', () => {
      expect(
        canManageSuperAdmin({
          roles: ['admin'],
          permissions: ['users:manage', 'tenants:manage'],
        }),
      ).toBe(true);
    });

    it('nega admin com apenas users:manage', () => {
      expect(
        canManageSuperAdmin({
          roles: ['admin'],
          permissions: ['users:manage'],
        }),
      ).toBe(false);
    });
  });

  describe('assertCanManageSuperAdmin', () => {
    it('lança ForbiddenException para admin comum', () => {
      expect(() =>
        assertCanManageSuperAdmin({
          roles: ['admin'],
          permissions: ['users:manage'],
        }),
      ).toThrow('Somente super administradores podem gerenciar o perfil super_admin');
    });
  });

  describe('requiresSuperAdminActorForRoleChange', () => {
    it('exige guard ao promover para super_admin', () => {
      expect(
        requiresSuperAdminActorForRoleChange({
          currentSlugs: ['admin'],
          nextSlugs: ['super_admin'],
        }),
      ).toBe(true);
    });

    it('exige guard ao remover super_admin', () => {
      expect(
        requiresSuperAdminActorForRoleChange({
          currentSlugs: ['super_admin'],
          nextSlugs: ['admin'],
        }),
      ).toBe(true);
    });

    it('exige guard ao editar roles de usuário super_admin', () => {
      expect(
        requiresSuperAdminActorForRoleChange({
          currentSlugs: ['super_admin', 'admin'],
          nextSlugs: ['super_admin', 'operador'],
        }),
      ).toBe(true);
    });

    it('não exige guard para troca entre perfis não-super_admin', () => {
      expect(
        requiresSuperAdminActorForRoleChange({
          currentSlugs: ['admin'],
          nextSlugs: ['operador'],
        }),
      ).toBe(false);
    });
  });

  describe('includesSuperAdminSlug / userHasSuperAdminRole', () => {
    it('detecta slug super_admin', () => {
      expect(includesSuperAdminSlug(['corretor', 'super_admin'])).toBe(true);
      expect(includesSuperAdminSlug(['admin'])).toBe(false);
    });

    it('detecta super_admin no usuário', () => {
      expect(
        userHasSuperAdminRole([{ role: { slug: 'super_admin' } }]),
      ).toBe(true);
      expect(userHasSuperAdminRole([{ role: { slug: 'admin' } }])).toBe(false);
    });
  });
});
