import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type {
  ChangeUserPasswordDto,
  CreateUserDto,
  SetUserBusinessUnitsDto,
  SetUserRolesDto,
  SetUserStatusDto,
  UpdateUserDto,
} from './dto/user.dto';
import {
  deriveInitials,
  ensureGoLiveRoles,
  isGoLiveAssignableRole,
} from './users-roles.util';
import {
  assertAtLeastOneBusinessUnit,
  assertValidPrimaryForActiveUser,
  extractBusinessUnitIds,
  resolvePrimaryBusinessUnitId,
} from './users-business-units.util';
import {
  assertCanManageSuperAdmin,
  canManageSuperAdmin,
  includesSuperAdminSlug,
  requiresSuperAdminActorForRoleChange,
  type UserManagementActor,
  userHasSuperAdminRole,
} from './users-super-admin-guard.util';

const userSelect = {
  id: true,
  email: true,
  name: true,
  initials: true,
  title: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  currentBusinessUnitId: true,
  userRoles: {
    include: { role: { select: { id: true, name: true, slug: true } } },
  },
  businessUnits: {
    select: {
      businessUnitId: true,
      createdAt: true,
      businessUnit: {
        select: { id: true, name: true, slug: true, type: true, isActive: true },
      },
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findByTenant(tenantId: string) {
    await ensureGoLiveRoles(this.prisma, tenantId);
    return this.prisma.user.findMany({
      where: { tenantId },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    await ensureGoLiveRoles(this.prisma, tenantId);
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { ...userSelect, tenantId: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async listAssignableRoles(
    tenantId: string,
    actor?: Pick<UserManagementActor, 'roles' | 'permissions'>,
  ) {
    await ensureGoLiveRoles(this.prisma, tenantId);
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isSystem: true,
        defaultDataScope: true,
      },
    });
    let data = roles.filter((r) => isGoLiveAssignableRole(r.slug));
    if (actor && !canManageSuperAdmin(actor)) {
      data = data.filter((r) => r.slug !== 'super_admin');
    }
    return { data };
  }

  async create(
    tenantId: string,
    dto: CreateUserDto,
    actor: UserManagementActor,
  ) {
    await ensureGoLiveRoles(this.prisma, tenantId);
    const roles = await this.getTenantRolesByIds(tenantId, dto.roleIds);
    this.assertGoLiveAssignableRoles(roles);
    if (includesSuperAdminSlug(roles.map((r) => r.slug))) {
      assertCanManageSuperAdmin(actor);
    }

    assertAtLeastOneBusinessUnit(dto.businessUnitIds);
    await this.validateBusinessUnitIds(tenantId, dto.businessUnitIds);
    const primaryBusinessUnitId = resolvePrimaryBusinessUnitId(
      dto.businessUnitIds,
      dto.primaryBusinessUnitId,
    );

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email },
    });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado neste tenant');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const initials = deriveInitials(dto.name);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tenantId,
          email,
          passwordHash,
          name: dto.name.trim(),
          initials,
          title: dto.title?.trim() ?? '',
          isActive: true,
        },
      });

      await tx.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({
          userId: created.id,
          roleId,
        })),
      });

      await tx.userBusinessUnit.createMany({
        data: dto.businessUnitIds.map((businessUnitId) => ({
          userId: created.id,
          businessUnitId,
        })),
        skipDuplicates: true,
      });
      await tx.user.update({
        where: { id: created.id },
        data: { currentBusinessUnitId: primaryBusinessUnitId },
      });

      return created;
    });

    this.auditLogs.enqueue({
      tenantId,
      userId: actor.userId,
      action: 'user.created',
      resource: 'users',
      resourceId: user.id,
      severity: 'info',
      metadata: {
        targetUserId: user.id,
        email: user.email,
        name: user.name,
        roleIds: dto.roleIds,
        businessUnitIds: dto.businessUnitIds,
        primaryBusinessUnitId,
      },
    });

    return this.findOne(tenantId, user.id);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateUserDto,
    actor: UserManagementActor,
  ) {
    const existing = await this.findOne(tenantId, id);
    if (userHasSuperAdminRole(existing.userRoles)) {
      assertCanManageSuperAdmin(actor);
    }

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      if (email !== existing.email) {
        const dup = await this.prisma.user.findFirst({
          where: { tenantId, email, id: { not: id } },
        });
        if (dup) throw new ConflictException('E-mail já cadastrado');
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email !== undefined
          ? { email: dto.email.trim().toLowerCase() }
          : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.initials !== undefined
          ? { initials: dto.initials.trim().toUpperCase() }
          : dto.name !== undefined
            ? { initials: deriveInitials(dto.name) }
            : {}),
      },
    });

    this.auditLogs.enqueue({
      tenantId,
      userId: actor.userId,
      action: 'user.updated',
      resource: 'users',
      resourceId: id,
      severity: 'info',
      metadata: { targetUserId: id, changes: dto },
    });

    return this.findOne(tenantId, id);
  }

  async setStatus(
    tenantId: string,
    id: string,
    dto: SetUserStatusDto,
    actor: UserManagementActor,
  ) {
    if (id === actor.userId && !dto.isActive) {
      throw new ForbiddenException('Você não pode inativar sua própria conta');
    }

    const existing = await this.findOne(tenantId, id);

    if (dto.isActive) {
      assertValidPrimaryForActiveUser({
        isActive: true,
        businessUnitIds: extractBusinessUnitIds(existing.businessUnits),
        currentBusinessUnitId: existing.currentBusinessUnitId,
      });
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
    });

    if (!dto.isActive) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: id, tenantId },
      });
    }

    this.auditLogs.enqueue({
      tenantId,
      userId: actor.userId,
      action: 'user.status_changed',
      resource: 'users',
      resourceId: id,
      severity: dto.isActive ? 'info' : 'warning',
      metadata: { targetUserId: id, isActive: dto.isActive },
    });

    return this.findOne(tenantId, id);
  }

  async changePassword(
    tenantId: string,
    id: string,
    dto: ChangeUserPasswordDto,
    actor: UserManagementActor,
  ) {
    await this.findOne(tenantId, id);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId: id, tenantId },
    });

    this.auditLogs.enqueue({
      tenantId,
      userId: actor.userId,
      action: 'user.password_changed',
      resource: 'users',
      resourceId: id,
      severity: 'warning',
      metadata: { targetUserId: id, changedBy: actor.userId },
    });

    return { ok: true };
  }

  async setRoles(
    tenantId: string,
    id: string,
    dto: SetUserRolesDto,
    actor: UserManagementActor,
  ) {
    if (id === actor.userId) {
      throw new ForbiddenException(
        'Altere seus próprios perfis por outro administrador',
      );
    }

    const existing = await this.findOne(tenantId, id);
    const nextRoles = await this.getTenantRolesByIds(tenantId, dto.roleIds);
    this.assertGoLiveAssignableRoles(nextRoles);

    const currentSlugs = existing.userRoles.map((ur) => ur.role.slug);
    const nextSlugs = nextRoles.map((r) => r.slug);
    if (
      requiresSuperAdminActorForRoleChange({
        currentSlugs,
        nextSlugs,
      })
    ) {
      assertCanManageSuperAdmin(actor);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
      });
    });

    this.auditLogs.enqueue({
      tenantId,
      userId: actor.userId,
      action: 'user.roles_updated',
      resource: 'users',
      resourceId: id,
      severity: 'info',
      metadata: { targetUserId: id, roleIds: dto.roleIds },
    });

    return this.findOne(tenantId, id);
  }

  async setBusinessUnits(
    tenantId: string,
    id: string,
    dto: SetUserBusinessUnitsDto,
    actor: UserManagementActor,
  ) {
    const existing = await this.findOne(tenantId, id);

    assertAtLeastOneBusinessUnit(dto.businessUnitIds);
    await this.validateBusinessUnitIds(tenantId, dto.businessUnitIds);
    const primaryBusinessUnitId = resolvePrimaryBusinessUnitId(
      dto.businessUnitIds,
      dto.primaryBusinessUnitId,
    );

    if (existing.isActive) {
      assertValidPrimaryForActiveUser({
        isActive: true,
        businessUnitIds: dto.businessUnitIds,
        currentBusinessUnitId: primaryBusinessUnitId,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userBusinessUnit.deleteMany({ where: { userId: id } });
      await tx.userBusinessUnit.createMany({
        data: dto.businessUnitIds.map((businessUnitId) => ({
          userId: id,
          businessUnitId,
        })),
      });

      await tx.user.update({
        where: { id },
        data: { currentBusinessUnitId: primaryBusinessUnitId },
      });
    });

    this.auditLogs.enqueue({
      tenantId,
      userId: actor.userId,
      action: 'user.business_units_updated',
      resource: 'users',
      resourceId: id,
      severity: 'info',
      metadata: {
        targetUserId: id,
        businessUnitIds: dto.businessUnitIds,
        primaryBusinessUnitId,
      },
    });

    return this.findOne(tenantId, id);
  }

  private async getTenantRolesByIds(tenantId: string, roleIds: string[]) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId, id: { in: roleIds } },
      select: { id: true, slug: true },
    });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Um ou mais perfis são inválidos');
    }
    return roles;
  }

  private assertGoLiveAssignableRoles(
    roles: ReadonlyArray<{ slug: string }>,
  ) {
    const invalid = roles.filter((r) => !isGoLiveAssignableRole(r.slug));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Perfis não permitidos: ${invalid.map((r) => r.slug).join(', ')}`,
      );
    }
  }

  private async validateRoleIds(tenantId: string, roleIds: string[]) {
    const roles = await this.getTenantRolesByIds(tenantId, roleIds);
    this.assertGoLiveAssignableRoles(roles);
  }

  private async validateBusinessUnitIds(
    tenantId: string,
    businessUnitIds: string[],
  ) {
    assertAtLeastOneBusinessUnit(businessUnitIds);
    const count = await this.prisma.businessUnit.count({
      where: { tenantId, id: { in: businessUnitIds }, isActive: true },
    });
    if (count !== businessUnitIds.length) {
      throw new BadRequestException('Uma ou mais empresas são inválidas');
    }
  }
}
