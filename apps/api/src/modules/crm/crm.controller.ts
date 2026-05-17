import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { CrmService } from './crm.service';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';

@ApiTags('crm')
@ApiBearerAuth('access-token')
@Controller('crm/deals')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get()
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Listar negócios do tenant' })
  findDeals(@CurrentUser() user: JwtAccessPayload) {
    return this.crm.findDeals(user.tenantId);
  }

  @Post()
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Criar negócio no tenant' })
  createDeal(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateDealDto,
  ) {
    return this.crm.createDeal(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Atualizar negócio do tenant' })
  @ApiParam({ name: 'id', description: 'ID do negócio' })
  updateDeal(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.crm.updateDeal(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Excluir negócio do tenant' })
  @ApiParam({ name: 'id', description: 'ID do negócio' })
  deleteDeal(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.crm.deleteDeal(user.tenantId, id);
  }
}
