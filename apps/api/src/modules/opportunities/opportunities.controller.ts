import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { OpportunitiesService } from './opportunities.service';
import {
  CreateOpportunityDto,
  ListOpportunitiesQueryDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';

@ApiTags('opportunities')
@ApiBearerAuth('access-token')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunities: OpportunitiesService) {}

  @Get()
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Listar oportunidades 360' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListOpportunitiesQueryDto,
  ) {
    return this.opportunities.findAll(user.tenantId, query, actorFrom(user));
  }

  @Post('generate')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Gerar oportunidades para todos os clientes ativos' })
  generateAll(@CurrentUser() user: JwtAccessPayload) {
    return this.opportunities.generateForTenant(user.tenantId);
  }

  @Post('generate/:customerId')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Gerar oportunidades para um cliente' })
  generateOne(
    @CurrentUser() user: JwtAccessPayload,
    @Param('customerId') customerId: string,
  ) {
    return this.opportunities.generateForCustomer(user.tenantId, customerId);
  }

  @Get(':id')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Detalhe da oportunidade' })
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.opportunities.findOne(user.tenantId, id, actorFrom(user));
  }

  @Post()
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Criar oportunidade manual' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateOpportunityDto,
  ) {
    return this.opportunities.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Atualizar oportunidade' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    return this.opportunities.update(user.tenantId, id, dto, actorFrom(user));
  }
}

function actorFrom(user: JwtAccessPayload) {
  return {
    userId: user.sub,
    tenantId: user.tenantId,
    roles: user.roles,
    permissions: user.permissions,
    currentBusinessUnitId: user.currentBusinessUnitId,
  };
}
