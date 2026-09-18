import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { Dashboard360QueryDto } from '../opportunities/dto/opportunity.dto';
import { Customer360Service } from './customer-360.service';
import { CustomersService } from './customers.service';
import { Dashboard360Service } from './dashboard-360.service';
import {
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@ApiTags('customers')
@ApiBearerAuth('access-token')
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customers: CustomersService,
    private readonly customer360: Customer360Service,
    private readonly dashboard360Service: Dashboard360Service,
  ) {}

  @Get()
  @RequirePermissions('clients:view')
  @ApiOperation({ summary: 'Listar clientes do tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false, enum: CUSTOMER_TYPES })
  @ApiQuery({ name: 'status', required: false, enum: CUSTOMER_STATUSES })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Máximo 500 para workspaces operacionais.',
  })
  findCustomers(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customers.findCustomers(
      user.tenantId,
      query,
      {
        userId: user.sub,
        tenantId: user.tenantId,
        roles: user.roles,
        permissions: user.permissions,
        currentBusinessUnitId: user.currentBusinessUnitId,
      },
    );
  }

  @Get('dashboard-360')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Dashboard Customer 360' })
  dashboard360(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: Dashboard360QueryDto,
  ) {
    return this.dashboard360Service.getDashboard(user.tenantId, query, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Get(':id/360')
  @RequirePermissions('clients:view')
  @ApiOperation({ summary: 'Visão 360 do cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  findCustomer360(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.customer360.get360(user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post(':id/360/generate')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Gerar oportunidades 360 do cliente' })
  generateCustomer360(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.customer360.generate(user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Get(':id')
  @RequirePermissions('clients:view')
  @ApiOperation({ summary: 'Detalhe do cliente do tenant' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  findCustomer(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.customers.findCustomer(user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post()
  @RequirePermissions('clients:manage')
  @ApiOperation({ summary: 'Criar cliente no tenant' })
  createCustomer(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customers.createCustomer(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('clients:manage')
  @ApiOperation({ summary: 'Atualizar cliente do tenant' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  updateCustomer(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customers.updateCustomer(user.tenantId, id, dto, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Delete(':id')
  @RequirePermissions('clients:manage')
  @ApiOperation({ summary: 'Excluir cliente do tenant' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  deleteCustomer(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.customers.deleteCustomer(user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }
}
