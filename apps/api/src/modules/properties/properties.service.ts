import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { CreatePropertyDto, ListPropertiesQueryDto, UpdatePropertyDto } from './dto/property.dto';
import {
  deleteLocalPropertyFile,
  isAllowedImageMime,
  MAX_IMAGE_BYTES,
  MAX_UPLOAD_FILES,
  savePropertyImage,
  type MemoryUpload,
} from './property-storage';
import { PropertiesRepository } from './repositories/properties.repository';
import { PropertyImagesRepository } from './repositories/property-images.repository';
import { PropertyLeadsRepository } from './repositories/property-leads.repository';
import { serializeProperty, slugifyTitle } from './properties.util';

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

  private async uniqueSlug(tenantId: string, title: string, requested?: string, excludeId?: string) {
    const base = slugifyTitle(requested?.trim() || title);
    let slug = base;
    let n = 2;
    while (await this.properties.isSlugTaken(tenantId, slug, excludeId)) {
      slug = `${base}-${n}`.slice(0, 88);
      n += 1;
    }
    return slug;
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

    const slug = await this.uniqueSlug(user.tenantId, dto.title, dto.slug);
    const images = dto.images ?? [];
    const data: Prisma.PropertyCreateInput = {
      title: dto.title,
      slug,
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
      featured: dto.featured ?? false,
      featuredUntil: parseFeaturedUntil(dto.featuredUntil),
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
    if (dto.slug || dto.title) {
      slug = await this.uniqueSlug(
        user.tenantId,
        dto.title ?? current.title,
        dto.slug,
        id,
      );
    }

    const updated = await this.properties.update(id, {
      ...(dto.title != null ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.purpose ? { purpose: dto.purpose } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.city != null ? { city: dto.city } : {}),
      ...(dto.neighborhood !== undefined ? { neighborhood: dto.neighborhood } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.state !== undefined ? { state: dto.state?.toUpperCase() } : {}),
      ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
      ...(dto.price != null ? { price: dto.price } : {}),
      ...(dto.areaM2 !== undefined ? { areaM2: dto.areaM2 } : {}),
      ...(dto.bedrooms !== undefined ? { bedrooms: dto.bedrooms } : {}),
      ...(dto.bathrooms !== undefined ? { bathrooms: dto.bathrooms } : {}),
      ...(dto.parkingSpots !== undefined ? { parkingSpots: dto.parkingSpots } : {}),
      ...(dto.featured != null ? { featured: dto.featured } : {}),
      ...(dto.featuredUntil !== undefined
        ? { featuredUntil: parseFeaturedUntil(dto.featuredUntil) }
        : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.businessUnitId ? { businessUnit: { connect: { id: dto.businessUnitId } } } : {}),
      slug,
    });
    return serializeProperty(updated);
  }

  async publish(user: JwtAccessPayload, id: string) {
    await this.findOne(user, id);
    const updated = await this.properties.update(id, {
      published: true,
      publishedAt: new Date(),
      status: 'AVAILABLE',
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
    return image;
  }

  async uploadImages(user: JwtAccessPayload, id: string, files: MemoryUpload[]) {
    const property = await this.findOne(user, id);
    if (!files?.length) {
      throw new BadRequestException('Envie ao menos uma imagem');
    }
    if (files.length > MAX_UPLOAD_FILES) {
      throw new BadRequestException(`No máximo ${MAX_UPLOAD_FILES} arquivos por envio`);
    }

    const invalid = files.find(
      (file) => !isAllowedImageMime(file.mimetype) || file.size > MAX_IMAGE_BYTES,
    );
    if (invalid) {
      throw new BadRequestException(
        'Use JPEG, PNG, WebP ou GIF de até 8 MB',
      );
    }

    const startOrder = await this.images.nextSortOrder(property.id);
    const existingCount = await this.images.countByProperty(property.id);
    const created = [];
    for (let index = 0; index < files.length; index += 1) {
      const saved = await savePropertyImage(files[index], property.id);
      const isCover = existingCount === 0 && index === 0;
      if (isCover) {
        await this.images.clearCover(property.id);
      }
      created.push(
        await this.images.create({
          tenantId: user.tenantId,
          propertyId: property.id,
          url: saved.url,
          alt: files[index].originalname?.slice(0, 160),
          sortOrder: startOrder + index,
          isCover,
        }),
      );
    }
    return created;
  }

  async setCoverImage(user: JwtAccessPayload, id: string, imageId: string) {
    await this.findOne(user, id);
    const image = await this.images.setCover(user.tenantId, id, imageId);
    if (!image) throw new NotFoundException('Imagem não encontrada');
    return image;
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
    await deleteLocalPropertyFile(id, deleted.url);
    return { ok: true };
  }

  async remove(user: JwtAccessPayload, id: string) {
    await this.findOne(user, id);
    await this.properties.delete(id);
    return { ok: true };
  }

  async listLeads(user: JwtAccessPayload, id: string) {
    await this.findOne(user, id);
    return this.propertyLeads.findByProperty(user.tenantId, id);
  }
}
