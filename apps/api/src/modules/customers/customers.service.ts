import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findCustomers(tenantId: string, query: ListCustomersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildCustomerWhere(tenantId, query);

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findCustomer(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return customer;
  }

  async createCustomer(tenantId: string, dto: CreateCustomerDto) {
    try {
      return await this.prisma.customer.create({
        data: {
          tenantId,
          type: dto.type,
          name: dto.name,
          document: dto.document,
          email: dto.email,
          phone: dto.phone,
          status: dto.status,
        },
      });
    } catch (error) {
      this.handleCustomerWriteError(error);
    }
  }

  async updateCustomer(tenantId: string, id: string, dto: UpdateCustomerDto) {
    await this.ensureCustomerBelongsToTenant(tenantId, id);

    try {
      return await this.prisma.customer.update({
        where: { id },
        data: {
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.document !== undefined ? { document: dto.document } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      });
    } catch (error) {
      this.handleCustomerWriteError(error);
    }
  }

  async deleteCustomer(tenantId: string, id: string) {
    await this.ensureCustomerBelongsToTenant(tenantId, id);
    await this.prisma.customer.delete({ where: { id } });
    return { deleted: true, id };
  }

  private buildCustomerWhere(
    tenantId: string,
    query: ListCustomersQueryDto,
  ): Prisma.CustomerWhereInput {
    const search = query.search?.trim();

    return {
      tenantId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { document: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private async ensureCustomerBelongsToTenant(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
  }

  private handleCustomerWriteError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Documento já cadastrado neste tenant');
    }
    throw error;
  }
}
