import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PublicCatalogContextService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(params: {
    tenantSlug: string;
    businessUnitId?: string;
    businessUnitSlug?: string;
  }) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: params.tenantSlug.trim(), status: 'active' },
      select: { id: true, slug: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    let businessUnitId: string | undefined;
    if (params.businessUnitId?.trim() || params.businessUnitSlug?.trim()) {
      const unit = await this.prisma.businessUnit.findFirst({
        where: {
          tenantId: tenant.id,
          isActive: true,
          ...(params.businessUnitId
            ? { id: params.businessUnitId }
            : { slug: params.businessUnitSlug }),
        },
        select: { id: true },
      });
      if (!unit) {
        throw new NotFoundException('Unidade de negócio não encontrada');
      }
      businessUnitId = unit.id;
    }

    return { tenantId: tenant.id, tenantSlug: tenant.slug, businessUnitId };
  }
}
