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
import { CustomersService } from './customers.service';
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
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @RequirePermissions('clients:view')
  @ApiOperation({ summary: 'Listar clientes do tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false, enum: CUSTOMER_TYPES })
  @ApiQuery({ name: 'status', required: false, enum: CUSTOMER_STATUSES })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findCustomers(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customers.findCustomers(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('clients:view')
  @ApiOperation({ summary: 'Detalhe do cliente do tenant' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  findCustomer(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.customers.findCustomer(user.tenantId, id);
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
    return this.customers.updateCustomer(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('clients:manage')
  @ApiOperation({ summary: 'Excluir cliente do tenant' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  deleteCustomer(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.customers.deleteCustomer(user.tenantId, id);
  }
}
