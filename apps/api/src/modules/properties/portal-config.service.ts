import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type {
  CreatePortalBannerDto,
  UpdatePortalBannerDto,
  UpsertPortalConfigDto,
} from './dto/portal-config.dto';
import { PublicCatalogContextService } from './public-catalog-context.service';
import {
  deleteLocalPortalFile,
  isAllowedImageMime,
  MAX_IMAGE_BYTES,
  savePortalImage,
  StorageUnavailableError,
  type MemoryUpload,
} from './property-storage';

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function serializeConfig(row: {
  differentials: Prisma.JsonValue;
  [key: string]: unknown;
}) {
  const differentials = Array.isArray(row.differentials)
    ? row.differentials.filter(
        (item): item is string => typeof item === 'string',
      )
    : [];
  return { ...row, differentials };
}

@Injectable()
export class PortalConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buAccess: BusinessUnitAccessService,
    private readonly context: PublicCatalogContextService,
  ) {}

  private async assertUnit(user: JwtAccessPayload, businessUnitId: string) {
    const unit = await this.prisma.businessUnit.findFirst({
      where: { id: businessUnitId, tenantId: user.tenantId, isActive: true },
      select: { id: true },
    });
    if (!unit) throw new NotFoundException('Unidade de negócio não encontrada');
    const scoped = await this.buAccess.resolveIds(
      this.buAccess.fromUser(user),
      businessUnitId,
    );
    if (Array.isArray(scoped) && !scoped.includes(businessUnitId)) {
      throw new ForbiddenException();
    }
  }

  async getForUser(user: JwtAccessPayload, businessUnitId: string) {
    await this.assertUnit(user, businessUnitId);
    const row = await this.prisma.portalConfig.findFirst({
      where: { tenantId: user.tenantId, businessUnitId },
    });
    return row ? serializeConfig(row) : null;
  }

  async upsert(user: JwtAccessPayload, dto: UpsertPortalConfigDto) {
    await this.assertUnit(user, dto.businessUnitId);
    const data = {
      companyName: dto.companyName.trim(),
      heroTitle: emptyToNull(dto.heroTitle),
      heroSubtitle: emptyToNull(dto.heroSubtitle),
      heroImage: emptyToNull(dto.heroImage),
      logoUrl: emptyToNull(dto.logoUrl),
      aboutTitle: emptyToNull(dto.aboutTitle),
      aboutText: emptyToNull(dto.aboutText),
      aboutImage: emptyToNull(dto.aboutImage),
      differentials: (dto.differentials ?? [])
        .map((item) => item.trim())
        .filter(Boolean),
      whatsapp: emptyToNull(dto.whatsapp),
      phone: emptyToNull(dto.phone),
      email: emptyToNull(dto.email),
      instagram: emptyToNull(dto.instagram),
      facebook: emptyToNull(dto.facebook),
      youtube: emptyToNull(dto.youtube),
      creci: emptyToNull(dto.creci),
      address: emptyToNull(dto.address),
    };
    const current = await this.prisma.portalConfig.findFirst({
      where: {
        tenantId: user.tenantId,
        businessUnitId: dto.businessUnitId,
      },
    });
    const row = await this.prisma.portalConfig.upsert({
      where: { businessUnitId: dto.businessUnitId },
      create: {
        ...data,
        tenant: { connect: { id: user.tenantId } },
        businessUnit: { connect: { id: dto.businessUnitId } },
      },
      update: data,
    });
    if (current) {
      await this.forgetReplacedMedia(dto.businessUnitId, current, data);
    }
    return serializeConfig(row);
  }

  private async forgetReplacedMedia(
    businessUnitId: string,
    current: {
      heroImage: string | null;
      logoUrl: string | null;
      aboutImage: string | null;
    },
    next: {
      heroImage: string | null;
      logoUrl: string | null;
      aboutImage: string | null;
    },
  ) {
    const previous = [current.heroImage, current.logoUrl, current.aboutImage];
    const kept = new Set(
      [next.heroImage, next.logoUrl, next.aboutImage].filter(
        (url): url is string => Boolean(url),
      ),
    );
    for (const url of previous) {
      if (!url || kept.has(url)) continue;
      await this.removePortalObject(businessUnitId, url);
    }
  }

  async listBanners(user: JwtAccessPayload, businessUnitId: string) {
    await this.assertUnit(user, businessUnitId);
    return this.prisma.portalBanner.findMany({
      where: { tenantId: user.tenantId, businessUnitId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createBanner(user: JwtAccessPayload, dto: CreatePortalBannerDto) {
    await this.assertUnit(user, dto.businessUnitId);
    return this.prisma.portalBanner.create({
      data: {
        title: dto.title.trim(),
        subtitle: emptyToNull(dto.subtitle),
        image: dto.image.trim(),
        link: emptyToNull(dto.link),
        active: dto.active ?? true,
        order: dto.order ?? 0,
        tenant: { connect: { id: user.tenantId } },
        businessUnit: { connect: { id: dto.businessUnitId } },
      },
    });
  }

  async updateBanner(
    user: JwtAccessPayload,
    id: string,
    dto: UpdatePortalBannerDto,
  ) {
    const current = await this.prisma.portalBanner.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!current) throw new NotFoundException('Banner não encontrado');
    await this.assertUnit(user, current.businessUnitId);
    return this.prisma.portalBanner.update({
      where: { id },
      data: {
        ...(dto.title != null ? { title: dto.title.trim() } : {}),
        ...(dto.subtitle !== undefined
          ? { subtitle: emptyToNull(dto.subtitle) }
          : {}),
        ...(dto.image != null ? { image: dto.image.trim() } : {}),
        ...(dto.link !== undefined ? { link: emptyToNull(dto.link) } : {}),
        ...(dto.active != null ? { active: dto.active } : {}),
        ...(dto.order != null ? { order: dto.order } : {}),
      },
    });
  }

  async deleteBanner(user: JwtAccessPayload, id: string) {
    const current = await this.prisma.portalBanner.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!current) throw new NotFoundException('Banner não encontrado');
    await this.assertUnit(user, current.businessUnitId);
    await this.removePortalObject(current.businessUnitId, current.image);
    await this.prisma.portalBanner.delete({ where: { id } });
    return { ok: true };
  }

  async uploadMedia(
    user: JwtAccessPayload,
    businessUnitId: string,
    file: MemoryUpload | undefined,
    previousUrl?: string,
  ) {
    await this.assertUnit(user, businessUnitId);
    if (!file?.buffer?.length) {
      throw new BadRequestException('Envie uma imagem');
    }
    if (!isAllowedImageMime(file.mimetype) || file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Use JPEG, PNG, WebP ou GIF de até 8 MB');
    }
    let saved: Awaited<ReturnType<typeof savePortalImage>>;
    try {
      saved = await savePortalImage(file, businessUnitId);
    } catch (error) {
      if (error instanceof StorageUnavailableError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
    if (previousUrl?.trim()) {
      try {
        await this.removePortalObject(businessUnitId, previousUrl);
      } catch (error) {
        await deleteLocalPortalFile(businessUnitId, saved.url).catch(
          () => undefined,
        );
        throw error;
      }
    }
    return { url: saved.url };
  }

  private async removePortalObject(businessUnitId: string, url: string) {
    try {
      await deleteLocalPortalFile(businessUnitId, url);
    } catch (error) {
      if (error instanceof StorageUnavailableError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
  }

  async publicPortal(params: {
    tenantSlug: string;
    businessUnitId?: string;
    businessUnitSlug?: string;
  }) {
    const ctx = await this.context.resolve(params);
    if (!ctx.businessUnitId) {
      throw new NotFoundException('Unidade de negócio não encontrada');
    }
    const [config, banners] = await Promise.all([
      this.prisma.portalConfig.findFirst({
        where: { tenantId: ctx.tenantId, businessUnitId: ctx.businessUnitId },
      }),
      this.prisma.portalBanner.findMany({
        where: {
          tenantId: ctx.tenantId,
          businessUnitId: ctx.businessUnitId,
          active: true,
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);
    return {
      config: config ? serializeConfig(config) : null,
      banners,
    };
  }

  async publicBanners(params: {
    tenantSlug: string;
    businessUnitId?: string;
    businessUnitSlug?: string;
  }) {
    const portal = await this.publicPortal(params);
    return { banners: portal.banners };
  }
}
