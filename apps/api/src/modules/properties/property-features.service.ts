import { BadRequestException, Injectable } from '@nestjs/common';

import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import type { ReplacePropertyFeaturesDto } from './dto/property-feature.dto';
import { serializeFeatureValue } from './properties.util';
import { PropertiesService } from './properties.service';
import { PropertyFeatureDefinitionsRepository } from './repositories/property-feature-definitions.repository';
import { PropertyFeaturesRepository } from './repositories/property-features.repository';

@Injectable()
export class PropertyFeaturesService {
  constructor(
    private readonly properties: PropertiesService,
    private readonly features: PropertyFeaturesRepository,
    private readonly definitions: PropertyFeatureDefinitionsRepository,
  ) {}

  async replace(
    user: JwtAccessPayload,
    propertyId: string,
    dto: ReplacePropertyFeaturesDto,
  ) {
    await this.properties.findOne(user, propertyId);

    const catalog = await this.definitions.findMany(user.tenantId);
    const byId = new Map(catalog.map((item) => [item.id, item]));

    const rows = dto.items.map((item) => {
      const definition = byId.get(item.definitionId);
      if (!definition) {
        throw new BadRequestException('Característica inválida para este tenant');
      }
      return {
        tenantId: user.tenantId,
        propertyId,
        definitionId: definition.id,
        valueBoolean: definition.valueType === 'BOOLEAN' ? this.asBoolean(item.value) : null,
        valueText: definition.valueType === 'TEXT' ? this.asText(item.value) : null,
        valueNumber: definition.valueType === 'NUMBER' ? this.asNumber(item.value) : null,
      };
    });

    await this.features.deleteByProperty(propertyId);
    await this.features.createMany(rows);

    const stored = await this.features.findByProperty(user.tenantId, propertyId);
    return stored
      .map((row) => serializeFeatureValue(row))
      .filter((item): item is NonNullable<typeof item> => item != null);
  }

  private asBoolean(value: unknown) {
    if (value == null) return null;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    throw new BadRequestException('Valor booleano inválido');
  }

  private asText(value: unknown) {
    if (value == null) return null;
    if (typeof value === 'string') return value.slice(0, 200);
    return String(value).slice(0, 200);
  }

  private asNumber(value: unknown) {
    if (value == null || value === '') return null;
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) {
      throw new BadRequestException('Valor numérico inválido');
    }
    return n;
  }
}
