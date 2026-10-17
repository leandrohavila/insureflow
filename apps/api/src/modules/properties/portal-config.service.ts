import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type {
  CreatePortalBannerDto,
  InstitutionalVideoDto,
  UpdatePortalBannerDto,
  UpsertPortalConfigDto,
} from './dto/portal-config.dto';
import { institutionalVideoIssues } from './dto/portal-config.dto';
import {
  parseCaptionsUrl,
  parseInstitutionalVideoUrl,
  parsePosterUrl,
} from './institutional-video.util';
import { PublicCatalogContextService } from './public-catalog-context.service';
import {
  deleteLocalPortalFile,
  isAllowedImageMime,
  MAX_IMAGE_BYTES,
  savePortalImage,
  type MemoryUpload,
} from './property-storage';

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function textOrNull(value: unknown, max: number) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

function publicInstitutionalVideo(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const rawUrl = typeof row.url === 'string' ? row.url.trim() : '';
  const parsed = rawUrl ? parseInstitutionalVideoUrl(rawUrl) : null;
  const poster =
    typeof row.posterUrl === 'string' ? parsePosterUrl(row.posterUrl) : null;
  const captions =
    typeof row.captionsUrl === 'string'
      ? parseCaptionsUrl(row.captionsUrl)
      : null;
  const title = textOrNull(row.title, 160);
  const description = textOrNull(row.description, 500);
  if (!parsed && !poster && !captions && !title && !description) return null;
  return {
    active: row.active === true && parsed !== null,
    url: parsed ? rawUrl : null,
    title,
    description,
    posterUrl: poster,
    captionsUrl: captions,
  };
}

function institutionalVideoData(dto: InstitutionalVideoDto | undefined) {
  if (!dto) return undefined;
  const issues = institutionalVideoIssues(dto);
  if (issues.length > 0) throw new BadRequestException(issues.join(' '));
  const url = emptyToNull(dto.url);
  const title = emptyToNull(dto.title);
  const description = emptyToNull(dto.description);
  const posterUrl = emptyToNull(dto.posterUrl);
  const captionsUrl = emptyToNull(dto.captionsUrl);
  const active = dto.active === true && Boolean(url);
  if (!url && !title && !description && !posterUrl && !captionsUrl && !active) {
    return Prisma.DbNull;
  }
  return { active, url, title, description, posterUrl, captionsUrl };
}

function serializeConfig(row: {
  differentials: Prisma.JsonValue;
  institutionalVideo?: Prisma.JsonValue | null;
  [key: string]: unknown;
}) {
  const differentials = Array.isArray(row.differentials)
    ? row.differentials.filter(
        (item): item is string => typeof item === 'string',
      )
    : [];
  return {
    ...row,
    differentials,
    institutionalVideo: publicInstitutionalVideo(row.institutionalVideo),
  };
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

  private async assertSlugAvailable(
    tenantId: string,
    businessUnitId: string,
    slug: string,
  ) {
    const [config, unit] = await Promise.all([
      this.prisma.portalConfig.findFirst({
        where: { tenantId, publicSlug: slug, NOT: { businessUnitId } },
        select: { id: true },
      }),
      this.prisma.businessUnit.findFirst({
        where: { tenantId, slug, NOT: { id: businessUnitId } },
        select: { id: true },
      }),
    ]);
    if (config || unit) {
      throw new ConflictException(
        'Slug público já está em uso por outra unidade',
      );
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
      ...(dto.institutionalVideo !== undefined
        ? { institutionalVideo: institutionalVideoData(dto.institutionalVideo) }
        : {}),
      creci: emptyToNull(dto.creci),
      address: emptyToNull(dto.address),
      portalUrl: emptyToNull(dto.portalUrl)?.replace(/\/+$/, '') ?? null,
      publicSlug: emptyToNull(dto.publicSlug),
    };
    if (data.publicSlug) {
      await this.assertSlugAvailable(
        user.tenantId,
        dto.businessUnitId,
        data.publicSlug,
      );
    }
    const row = await this.prisma.portalConfig.upsert({
      where: { businessUnitId: dto.businessUnitId },
      create: {
        ...data,
        tenant: { connect: { id: user.tenantId } },
        businessUnit: { connect: { id: dto.businessUnitId } },
      },
      update: data,
    });
    return serializeConfig(row);
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
    const saved = await savePortalImage(file, businessUnitId);
    if (previousUrl?.trim()) {
      await deleteLocalPortalFile(businessUnitId, previousUrl);
    }
    return { url: saved.url };
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
