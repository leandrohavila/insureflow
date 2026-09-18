import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { PersonsRepository } from './repositories/persons.repository';

@Injectable()
export class PersonsService {
  constructor(
    private readonly persons: PersonsRepository,
    private readonly prisma: PrismaService,
  ) {}

  findAll(tenantId: string, search?: string) {
    return this.persons.findMany(tenantId, search);
  }

  async findOne(tenantId: string, id: string) {
    const row = await this.persons.findById(tenantId, id);
    if (!row) throw new NotFoundException('Pessoa não encontrada');
    return row;
  }

  private async assertCustomer(tenantId: string, customerId?: string) {
    if (!customerId) return;
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
  }

  async create(tenantId: string, dto: CreatePersonDto) {
    await this.assertCustomer(tenantId, dto.customerId);
    try {
      return await this.persons.create({
        tenantId,
        name: dto.name.trim(),
        kind: dto.kind ?? 'INDIVIDUAL',
        document: dto.document?.trim() || null,
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        customerId: dto.customerId || null,
      });
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async update(tenantId: string, id: string, dto: UpdatePersonDto) {
    await this.findOne(tenantId, id);
    await this.assertCustomer(tenantId, dto.customerId);
    try {
      return await this.persons.update(id, {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.kind ? { kind: dto.kind } : {}),
        ...(dto.document !== undefined ? { document: dto.document?.trim() || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
        ...(dto.customerId !== undefined ? { customerId: dto.customerId || null } : {}),
      });
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  private rethrowUnique(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Pessoa já vinculada a este cliente');
    }
  }
}
