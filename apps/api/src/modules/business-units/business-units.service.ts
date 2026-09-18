import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { slugify } from '../../common/utils/slugify.util';
import type { BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthService } from '../auth/auth.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type {
  CreateBusinessUnitDto,
  ListBusinessUnitsQueryDto,
  UpdateBusinessUnitContextDto,
  UpdateBusinessUnitDto,
} from './dto/business-unit.dto';

@Injectable()
export class BusinessUnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buAccess: BusinessUnitAccessService,
    private readonly auth: AuthService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findAll(
    tenantId: string,
    query: ListBusinessUnitsQueryDto = {},
    actor?: BusinessUnitActor,
  ) {
    const flags = actor ? this.buAccess.describe(actor) : { canViewAll: true };
    const membershipIds = actor
      ? await this.buAccess.membershipIds(actor.userId, actor.tenantId)
      : [];
    const scopedIds = flags.canViewAll ? null : membershipIds;

    const units = await this.prisma.businessUnit.findMany({
      where: {
        tenantId,
        ...(query.type ? { type: query.type } : {}),
        ...(query.active === undefined ? {} : { isActive: query.active }),
        ...(scopedIds ? { id: { in: scopedIds } } : {}),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return { data: units };
  }

  async findOne(tenantId: string, id: string) {
    const unit = await this.prisma.businessUnit.findFirst({
      where: { id, tenantId },
    });
    if (!unit) {
      throw new NotFoundException('Unidade de negócio não encontrada');
    }
    return unit;
  }

  async create(tenantId: string, dto: CreateBusinessUnitDto) {
    const slug = await this.ensureUniqueSlug(
      tenantId,
      dto.slug?.trim() || slugify(dto.name),
    );

    try {
      return await this.prisma.businessUnit.create({
        data: {
          tenantId,
          name: dto.name.trim(),
          slug,
          type: dto.type,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async update(tenantId: string, id: string, dto: UpdateBusinessUnitDto) {
    await this.findOne(tenantId, id);

    const slug =
      dto.slug !== undefined || dto.name !== undefined
        ? await this.ensureUniqueSlug(
            tenantId,
            (dto.slug?.trim() || slugify(dto.name ?? '')) as string,
            id,
          )
        : undefined;

    try {
      return await this.prisma.businessUnit.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(slug ? { slug } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.businessUnit.delete({ where: { id } });
    return { deleted: true, id };
  }

  async getContext(actor: BusinessUnitActor) {
    const flags = this.buAccess.describe(actor);
    const membershipIds = await this.buAccess.membershipIds(
      actor.userId,
      actor.tenantId,
    );
    const units = await this.prisma.businessUnit.findMany({
      where: {
        tenantId: actor.tenantId,
        isActive: true,
        ...(flags.canViewAll ? {} : { id: { in: membershipIds } }),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, type: true, isActive: true },
    });

    const current =
      actor.currentBusinessUnitId &&
      units.some((unit) => unit.id === actor.currentBusinessUnitId)
        ? actor.currentBusinessUnitId
        : null;

    return {
      currentBusinessUnitId: current,
      canViewAll: flags.canViewAll,
      canManage: flags.canManage,
      units,
    };
  }

  async updateContext(actor: BusinessUnitActor, dto: UpdateBusinessUnitContextDto) {
    const nextId = dto.businessUnitId?.trim() || null;
    const previousId = actor.currentBusinessUnitId ?? null;
    const flags = this.buAccess.describe(actor);
    const membershipIds = await this.buAccess.membershipIds(
      actor.userId,
      actor.tenantId,
    );

    let previousUnit: { id: string; name: string } | null = null;
    let nextUnit: { id: string; name: string } | null = null;

    if (previousId) {
      previousUnit = await this.prisma.businessUnit.findFirst({
        where: { id: previousId, tenantId: actor.tenantId },
        select: { id: true, name: true },
      });
    }

    if (nextId) {
      nextUnit = await this.prisma.businessUnit.findFirst({
        where: { id: nextId, tenantId: actor.tenantId, isActive: true },
        select: { id: true, name: true },
      });
      if (!nextUnit) {
        throw new NotFoundException('Unidade de negócio não encontrada');
      }
      if (!flags.canViewAll && !membershipIds.includes(nextId)) {
        throw new ForbiddenException(
          'Usuário não possui acesso a esta unidade de negócio',
        );
      }
    }

    await this.prisma.user.update({
      where: { id: actor.userId },
      data: { currentBusinessUnitId: nextId },
    });

    this.auditLogs.enqueue({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'business_unit_changed',
      resource: 'business-units',
      resourceId: nextId ?? undefined,
      severity: 'info',
      metadata: {
        previousBusinessUnitId: previousId,
        previousBusinessUnitName: previousUnit?.name ?? null,
        currentBusinessUnitId: nextId,
        currentBusinessUnitName: nextUnit?.name ?? 'Todas',
      },
    });

    const tokens = await this.auth.issueAccessTokenForUser(actor.userId);
    const context = await this.getContext({
      ...actor,
      currentBusinessUnitId: nextId,
    });

    return {
      ...context,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      user: tokens.user,
    };
  }

  async assertIds(tenantId: string, ids: string[]) {
    const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (unique.length === 0) return [] as string[];

    const found = await this.prisma.businessUnit.findMany({
      where: { tenantId, id: { in: unique } },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new NotFoundException(
        'Uma ou mais unidades de negócio são inválidas para este tenant',
      );
    }
    return unique;
  }

  private async ensureUniqueSlug(
    tenantId: string,
    baseSlug: string,
    excludeId?: string,
  ) {
    const base = slugify(baseSlug);
    let candidate = base;
    let suffix = 2;

    while (
      await this.prisma.businessUnit.findFirst({
        where: {
          tenantId,
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      })
    ) {
      candidate = `${base}-${suffix}`.slice(0, 80);
      suffix += 1;
    }

    return candidate;
  }

  private handleWriteError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Já existe uma unidade com este identificador');
    }
    throw error;
  }
}
