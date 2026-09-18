import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { decimalToNumber } from './properties.util';
import type {
  CreatePropertyOwnerDto,
  UpdatePropertyOwnerDto,
} from './dto/property-owner.dto';
import { PersonsRepository } from './repositories/persons.repository';
import { PropertyOwnersRepository } from './repositories/property-owners.repository';
import { PropertiesService } from './properties.service';

@Injectable()
export class PropertyOwnersService {
  constructor(
    private readonly properties: PropertiesService,
    private readonly owners: PropertyOwnersRepository,
    private readonly persons: PersonsRepository,
  ) {}

  private serialize<T extends { sharePercent?: { toNumber?: () => number } | number | null }>(
    row: T,
  ) {
    return {
      ...row,
      sharePercent: decimalToNumber(row.sharePercent ?? null),
    };
  }

  async list(user: JwtAccessPayload, propertyId: string) {
    await this.properties.findOne(user, propertyId);
    const rows = await this.owners.findByProperty(user.tenantId, propertyId);
    return rows.map((row) => this.serialize(row));
  }

  async add(user: JwtAccessPayload, propertyId: string, dto: CreatePropertyOwnerDto) {
    await this.properties.findOne(user, propertyId);
    const person = await this.persons.findById(user.tenantId, dto.personId);
    if (!person) throw new NotFoundException('Pessoa não encontrada');

    if (dto.isPrimary) {
      await this.owners.clearPrimary(propertyId);
    }

    try {
      const created = await this.owners.create({
        tenantId: user.tenantId,
        propertyId,
        personId: dto.personId,
        isPrimary: dto.isPrimary ?? false,
        publicVisible: dto.publicVisible ?? false,
        sharePercent: dto.sharePercent,
      });
      return this.serialize(created);
    } catch {
      throw new ConflictException('Pessoa já é proprietária deste imóvel');
    }
  }

  async update(
    user: JwtAccessPayload,
    propertyId: string,
    ownerId: string,
    dto: UpdatePropertyOwnerDto,
  ) {
    await this.properties.findOne(user, propertyId);
    const current = await this.owners.findOwned(user.tenantId, propertyId, ownerId);
    if (!current) throw new NotFoundException('Proprietário não encontrado');

    if (dto.isPrimary) {
      await this.owners.clearPrimary(propertyId);
    }

    const updated = await this.owners.update(ownerId, {
      ...(dto.isPrimary != null ? { isPrimary: dto.isPrimary } : {}),
      ...(dto.publicVisible != null ? { publicVisible: dto.publicVisible } : {}),
      ...(dto.sharePercent !== undefined ? { sharePercent: dto.sharePercent } : {}),
    });
    return this.serialize(updated);
  }

  async setPrimary(user: JwtAccessPayload, propertyId: string, ownerId: string) {
    return this.update(user, propertyId, ownerId, { isPrimary: true });
  }

  async remove(user: JwtAccessPayload, propertyId: string, ownerId: string) {
    await this.properties.findOne(user, propertyId);
    const current = await this.owners.findOwned(user.tenantId, propertyId, ownerId);
    if (!current) throw new NotFoundException('Proprietário não encontrado');
    await this.owners.delete(ownerId);
    return { ok: true };
  }
}
