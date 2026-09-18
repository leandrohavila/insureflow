import { ForbiddenException } from '@nestjs/common';

export const SUPER_ADMIN_ROLE_SLUG = 'super_admin';
export const SUPER_ADMIN_MANAGE_PERMISSION = 'tenants:manage';

export type UserManagementActor = {
  userId: string;
  roles: readonly string[];
  permissions: readonly string[];
};

/** Pode criar/promover/remover/editar roles de super_admin. */
export function canManageSuperAdmin(
  actor: Pick<UserManagementActor, 'roles' | 'permissions'>,
): boolean {
  return (
    actor.roles.includes(SUPER_ADMIN_ROLE_SLUG) ||
    actor.permissions.includes(SUPER_ADMIN_MANAGE_PERMISSION)
  );
}

export function assertCanManageSuperAdmin(
  actor: Pick<UserManagementActor, 'roles' | 'permissions'>,
): void {
  if (!canManageSuperAdmin(actor)) {
    throw new ForbiddenException(
      'Somente super administradores podem gerenciar o perfil super_admin',
    );
  }
}

export function includesSuperAdminSlug(slugs: readonly string[]): boolean {
  return slugs.includes(SUPER_ADMIN_ROLE_SLUG);
}

export function userHasSuperAdminRole(
  userRoles: ReadonlyArray<{ role: { slug: string } }>,
): boolean {
  return userRoles.some((ur) => ur.role.slug === SUPER_ADMIN_ROLE_SLUG);
}

export function requiresSuperAdminActorForRoleChange(input: {
  currentSlugs: readonly string[];
  nextSlugs: readonly string[];
}): boolean {
  return (
    includesSuperAdminSlug(input.currentSlugs) ||
    includesSuperAdminSlug(input.nextSlugs)
  );
}
