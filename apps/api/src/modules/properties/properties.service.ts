import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  BatchPropertyPublicationDto,
  CreatePropertyDto,
  ListPropertiesQueryDto,
  UpdatePropertyDto,
} from './dto/property.dto';
import {
  deleteLocalPropertyFile,
  isAllowedImageMime,
  MAX_IMAGE_BYTES,
  MAX_UPLOAD_FILES,
  resolveStoredPropertyImageUrl,
  savePropertyImage,
  StorageUnavailableError,
  type MemoryUpload,
} from './property-storage';
import { PropertiesRepository } from './repositories/properties.repository';
import { PropertyImagesRepository } from './repositories/property-images.repository';
import { PropertyLeadsRepository } from './repositories/property-leads.repository';
import {
  buildFriendlyPropertySlug,
  withUniqueFriendlySuffix,
} from './property-slug';
import { serializeProperty, slugifyTitle } from './properties.util';
import { serializePropertyLead } from './property-leads.util';

function presentImage<
  T extends {
    url: string;
    storageKey?: string | null;
    storageDriver?: string | null;
  },
>(image: T) {
  const { storageKey, storageDriver, ...rest } = image;
  return {
    ...rest,
    url: resolveStoredPropertyImageUrl({
      url: image.url,
      storageKey,
      storageDriver,
    }),
  };
}

function parseFeaturedUntil(value?: string | null) {
  if (value == null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('featuredUntil inválido');
  }
  return date;
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly properties: PropertiesRepository,
    private readonly images: PropertyImagesRepository,
    private readonly propertyLeads: PropertyLeadsRepository,
    private readonly buAccess: BusinessUnitAccessService,
    private readonly prisma: PrismaService,
  ) {}

  private actor(user: JwtAccessPayload) {
    return this.buAccess.fromUser(user);
  }

  private async assertBusinessUnit(tenantId: string, businessUnitId: string) {
    const unit = await this.prisma.businessUnit.findFirst({
      where: { id: businessUnitId, tenantId, isActive: true },
      select: { id: true, type: true },
    });
    if (!unit) {
      throw new NotFoundException('Unidade de negócio não encontrada');
    }
    if (unit.type !== 'REAL_ESTATE') {
      throw new BadRequestException(
        'Imóvel deve pertencer a uma unidade imobiliária',
      );
    }
    return unit;
  }

  private async assertCanUseBusinessUnit(
    user: JwtAccessPayload,
    businessUnitId: string,
  ) {
    await this.assertBusinessUnit(user.tenantId, businessUnitId);
    const scopedIds = await this.buAccess.resolveIds(
      this.actor(user),
      businessUnitId,
    );
    if (Array.isArray(scopedIds) && !scopedIds.includes(businessUnitId)) {
      throw new ForbiddenException();
    }
  }

  private async uniqueSlug(
    tenantId: string,
    title: string,
    requested?: string,
    excludeId?: string,
  ) {
    const base = slugifyTitle(requested?.trim() || title);
    let slug = base;
    let n = 2;
    while (await this.properties.isSlugTaken(tenantId, slug, excludeId)) {
      slug = `${base}-${n}`.slice(0, 88);
      n += 1;
    }
    return slug;
  }

  private async uniquePublicCode(tenantId: string, excludeId?: string) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = String(1000 + Math.floor(Math.random() * 9000));
      if (
        !(await this.properties.isPublicCodeTaken(tenantId, code, excludeId))
      ) {
        return code;
      }
    }
    const fallback = String(Date.now()).slice(-8);
    return fallback;
  }

  private async uniqueFriendlySlug(
    tenantId: string,
    input: {
      type?: string | null;
      neighborhood?: string | null;
      city?: string | null;
      bedrooms?: number | null;
      publicCode: string;
    },
    excludeId?: string,
  ) {
    const base = buildFriendlyPropertySlug(input);
    let slug = base;
    let attempt = 1;
    while (await this.properties.isSlugTaken(tenantId, slug, excludeId)) {
      attempt += 1;
      slug = withUniqueFriendlySuffix(base, attempt);
    }
    return slug;
  }

  private needsFriendlySlug(row: {
    slug?: string | null;
    publicCode?: string | null;
  }) {
    return !row.publicCode || !/-cod-\d+/i.test(row.slug ?? '');
  }

  async findAll(user: JwtAccessPayload, query: ListPropertiesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const scopedIds = await this.buAccess.resolveIds(
      this.actor(user),
      query.businessUnitId,
    );
    if (Array.isArray(scopedIds) && scopedIds.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    const filters = {
      tenantId: user.tenantId,
      businessUnitIds: scopedIds ?? undefined,
      city: query.city,
      neighborhood: query.neighborhood,
      purpose: query.purpose,
      published: query.published,
      search: query.search,
    };

    const [rows, total] = await Promise.all([
      this.properties.findMany(filters, (page - 1) * limit, limit),
      this.properties.count(filters),
    ]);

    return {
      data: rows.map((row) => serializeProperty(row)),
      total,
      page,
      limit,
    };
  }

  async findOne(user: JwtAccessPayload, id: string) {
    const row = await this.properties.findById(user.tenantId, id);
    if (!row) throw new NotFoundException('Imóvel não encontrado');
    const scopedIds = await this.buAccess.resolveIds(this.actor(user));
    if (Array.isArray(scopedIds) && !scopedIds.includes(row.businessUnitId)) {
      throw new NotFoundException('Imóvel não encontrado');
    }
    return serializeProperty(row);
  }

  async create(user: JwtAccessPayload, dto: CreatePropertyDto) {
    await this.assertCanUseBusinessUnit(user, dto.businessUnitId);

    const publicCode = await this.uniquePublicCode(user.tenantId);
    const slug = await this.uniqueFriendlySlug(user.tenantId, {
      type: dto.type,
      neighborhood: dto.neighborhood,
      city: dto.city,
      bedrooms: dto.bedrooms,
      publicCode,
    });
    const legacySlugs: string[] = [];
    if (dto.slug?.trim()) {
      const requested = await this.uniqueSlug(
        user.tenantId,
        dto.title,
        dto.slug,
      );
      if (requested !== slug) legacySlugs.push(requested);
    }
    const images = dto.images ?? [];
    const data: Prisma.PropertyCreateInput = {
      title: dto.title,
      slug,
      publicCode,
      legacySlugs,
      description: dto.description,
      purpose: dto.purpose,
      type: dto.type ?? 'OTHER',
      city: dto.city,
      neighborhood: dto.neighborhood,
      address: dto.address,
      state: dto.state?.toUpperCase(),
      postalCode: dto.postalCode,
      price: dto.price,
      areaM2: dto.areaM2,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      parkingSpots: dto.parkingSpots,
      featured: dto.isFeatured ?? dto.featured ?? false,
      isLaunch: dto.isLaunch ?? false,
      featuredUntil: parseFeaturedUntil(dto.featuredUntil),
      portalOrder: dto.portalOrder ?? 0,
      metaTitle: dto.metaTitle?.trim() || null,
      metaDescription: dto.metaDescription?.trim() || null,
      published: false,
      publishedAt: null,
      status: dto.status ?? 'DRAFT',
      tenant: { connect: { id: user.tenantId } },
      businessUnit: { connect: { id: dto.businessUnitId } },
      createdByUser: { connect: { id: user.sub } },
      images: images.length
        ? {
            create: images.map((img, index) => ({
              url: img.url,
              alt: img.alt,
              sortOrder: img.sortOrder ?? index,
              isCover: img.isCover ?? index === 0,
              tenant: { connect: { id: user.tenantId } },
            })),
          }
        : undefined,
    };

    const created = await this.properties.create(data);
    return serializeProperty(created);
  }

  async update(user: JwtAccessPayload, id: string, dto: UpdatePropertyDto) {
    const current = await this.findOne(user, id);
    if (dto.businessUnitId) {
      await this.assertCanUseBusinessUnit(user, dto.businessUnitId);
    }

    let slug = current.slug;
    const legacySlugs = [...(current.legacySlugs ?? [])];
    if (dto.slug !== undefined && dto.slug.trim()) {
      slug = await this.uniqueSlug(
        user.tenantId,
        dto.title ?? current.title,
        dto.slug,
        id,
      );
      if (slug !== current.slug && !legacySlugs.includes(current.slug)) {
        legacySlugs.push(current.slug);
      }
    }

    const updated = await this.properties.update(id, {
      ...(dto.title != null ? { title: dto.title } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.purpose ? { purpose: dto.purpose } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.city != null ? { city: dto.city } : {}),
      ...(dto.neighborhood !== undefined
        ? { neighborhood: dto.neighborhood }
        : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.state !== undefined ? { state: dto.state?.toUpperCase() } : {}),
      ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
      ...(dto.price != null ? { price: dto.price } : {}),
      ...(dto.areaM2 !== undefined ? { areaM2: dto.areaM2 } : {}),
      ...(dto.bedrooms !== undefined ? { bedrooms: dto.bedrooms } : {}),
      ...(dto.bathrooms !== undefined ? { bathrooms: dto.bathrooms } : {}),
      ...(dto.parkingSpots !== undefined
        ? { parkingSpots: dto.parkingSpots }
        : {}),
      ...(dto.isFeatured != null || dto.featured != null
        ? { featured: dto.isFeatured ?? dto.featured }
        : {}),
      ...(dto.isLaunch != null ? { isLaunch: dto.isLaunch } : {}),
      ...(dto.featuredUntil !== undefined
        ? { featuredUntil: parseFeaturedUntil(dto.featuredUntil) }
        : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.portalOrder != null ? { portalOrder: dto.portalOrder } : {}),
      ...(dto.metaTitle !== undefined
        ? { metaTitle: dto.metaTitle?.trim() || null }
        : {}),
      ...(dto.metaDescription !== undefined
        ? { metaDescription: dto.metaDescription?.trim() || null }
        : {}),
      ...(dto.businessUnitId
        ? { businessUnit: { connect: { id: dto.businessUnitId } } }
        : {}),
      slug,
      ...(slug !== current.slug ? { legacySlugs } : {}),
    });
    return serializeProperty(updated);
  }

  private async publicationIdentity(
    tenantId: string,
    current: {
      id: string;
      slug: string;
      publicCode?: string | null;
      legacySlugs?: string[];
      type?: string | null;
      neighborhood?: string | null;
      city?: string | null;
      bedrooms?: number | null;
    },
  ) {
    if (!this.needsFriendlySlug(current)) return {};
    const publicCode =
      current.publicCode ?? (await this.uniquePublicCode(tenantId, current.id));
    const slug = await this.uniqueFriendlySlug(
      tenantId,
      {
        type: current.type,
        neighborhood: current.neighborhood,
        city: current.city,
        bedrooms: current.bedrooms,
        publicCode,
      },
      current.id,
    );
    const legacySlugs = [...(current.legacySlugs ?? [])];
    if (slug !== current.slug && !legacySlugs.includes(current.slug)) {
      legacySlugs.push(current.slug);
    }
    return {
      publicCode,
      slug,
      ...(slug !== current.slug ? { legacySlugs } : {}),
    };
  }

  async publish(user: JwtAccessPayload, id: string) {
    const current = await this.findOne(user, id);
    const updated = await this.properties.update(id, {
      published: true,
      publishedAt: new Date(),
      status: 'AVAILABLE',
      ...(await this.publicationIdentity(user.tenantId, current)),
    });
    return serializeProperty(updated);
  }

  async unpublish(user: JwtAccessPayload, id: string) {
    await this.findOne(user, id);
    const updated = await this.properties.update(id, {
      published: false,
    });
    return serializeProperty(updated);
  }

  async setPublication(
    user: JwtAccessPayload,
    dto: BatchPropertyPublicationDto,
  ) {
    const ids = [...new Set(dto.ids.map((id) => id.trim()).filter(Boolean))];
    if (!ids.length) {
      throw new BadRequestException('Informe ao menos um imóvel');
    }
    for (const id of ids) {
      await this.findOne(user, id);
    }
    const updated = [];
    for (const id of ids) {
      const current = await this.findOne(user, id);
      const data = dto.published
        ? {
            published: true,
            publishedAt: new Date(),
            status: 'AVAILABLE' as const,
            ...(await this.publicationIdentity(user.tenantId, current)),
          }
        : { published: false };
      updated.push(serializeProperty(await this.properties.update(id, data)));
    }
    return { data: updated, total: updated.length };
  }

  async addImage(
    user: JwtAccessPayload,
    id: string,
    input: { url: string; alt?: string; sortOrder?: number; isCover?: boolean },
  ) {
    const property = await this.findOne(user, id);
    if (input.isCover) {
      await this.images.clearCover(property.id);
    }
    const image = await this.images.create({
      tenantId: user.tenantId,
      propertyId: property.id,
      url: input.url,
      alt: input.alt,
      sortOrder: input.sortOrder ?? 0,
      isCover: input.isCover ?? false,
    });
    return presentImage(image);
  }

  async uploadImages(
    user: JwtAccessPayload,
    id: string,
    files: MemoryUpload[],
  ) {
    const property = await this.findOne(user, id);
    if (!files?.length) {
      throw new BadRequestException('Envie ao menos uma imagem');
    }
    if (files.length > MAX_UPLOAD_FILES) {
      throw new BadRequestException(
        `No máximo ${MAX_UPLOAD_FILES} arquivos por envio`,
      );
    }

    const invalid = files.find(
      (file) =>
        !isAllowedImageMime(file.mimetype) || file.size > MAX_IMAGE_BYTES,
    );
    if (invalid) {
      throw new BadRequestException('Use JPEG, PNG, WebP ou GIF de até 8 MB');
    }

    const startOrder = await this.images.nextSortOrder(property.id);
    const existingCount = await this.images.countByProperty(property.id);
    const created = [];
    for (let index = 0; index < files.length; index += 1) {
      let saved: Awaited<ReturnType<typeof savePropertyImage>>;
      try {
        saved = await savePropertyImage(files[index], property.id);
      } catch (error) {
        if (error instanceof StorageUnavailableError) {
          throw new ServiceUnavailableException(error.message);
        }
        throw error;
      }
      const isCover = existingCount === 0 && index === 0;
      if (isCover) {
        await this.images.clearCover(property.id);
      }
      created.push(
        await this.images.create({
          tenantId: user.tenantId,
          propertyId: property.id,
          url: saved.url,
          storageKey: saved.storageKey,
          storageDriver: saved.storageDriver,
          alt: files[index].originalname?.slice(0, 160),
          sortOrder: startOrder + index,
          isCover,
        }),
      );
    }
    return created.map((image) => presentImage(image));
  }

  async setCoverImage(user: JwtAccessPayload, id: string, imageId: string) {
    await this.findOne(user, id);
    const image = await this.images.setCover(user.tenantId, id, imageId);
    if (!image) throw new NotFoundException('Imagem não encontrada');
    return presentImage(image);
  }

  async reorderImages(user: JwtAccessPayload, id: string, imageIds: string[]) {
    await this.findOne(user, id);
    if (!imageIds.length) {
      throw new BadRequestException('Informe a ordem das imagens');
    }
    await this.images.reorder(id, imageIds);
    return this.findOne(user, id);
  }

  async removeImage(user: JwtAccessPayload, id: string, imageId: string) {
    await this.findOne(user, id);
    const deleted = await this.images.deleteOwned(user.tenantId, id, imageId);
    if (!deleted) throw new NotFoundException('Imagem não encontrada');
    await deleteLocalPropertyFile(id, deleted.url, {
      storageKey: deleted.storageKey,
      storageDriver: deleted.storageDriver,
    });
    return { ok: true };
  }

  async remove(user: JwtAccessPayload, id: string) {
    await this.findOne(user, id);
    await this.properties.delete(id);
    return { ok: true };
  }

  async listLeads(user: JwtAccessPayload, id: string) {
    await this.findOne(user, id);
    const rows = await this.propertyLeads.findByProperty(user.tenantId, id);
    return rows.map((row) => serializePropertyLead(row));
  }

  async listInbox(user: JwtAccessPayload, businessUnitId?: string) {
    const scopedIds = await this.buAccess.resolveIds(
      this.actor(user),
      businessUnitId,
    );
    if (Array.isArray(scopedIds) && scopedIds.length === 0) {
      return [];
    }

    const rows = await this.propertyLeads.findInbox(
      user.tenantId,
      scopedIds ?? undefined,
    );
    return rows.map((row) => serializePropertyLead(row));
  }
}
