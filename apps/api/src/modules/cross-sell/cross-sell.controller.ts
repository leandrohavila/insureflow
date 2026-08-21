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
import { CrossSellService } from './cross-sell.service';
import {
  ListCrossSellQueryDto,
  UpdateCrossSellOpportunityDto,
} from './dto/cross-sell.dto';

@ApiTags('cross-sell')
@ApiBearerAuth('access-token')
@Controller('cross-sell')
export class CrossSellController {
  constructor(private readonly crossSell: CrossSellService) {}

  @Get('opportunities')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Listar oportunidades de cross-sell' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListCrossSellQueryDto,
  ) {
    return this.crossSell.findAll(user.tenantId, query, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Get('metrics')
  @RequirePermissions('automation:view')
  @ApiOperation({ summary: 'Indicadores de cross-sell' })
  getMetrics(@CurrentUser() user: JwtAccessPayload) {
    return this.crossSell.getMetrics(user.tenantId, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post('generate')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Gerar sugestões de cross-sell da base atual' })
  generate(@CurrentUser() user: JwtAccessPayload) {
    return this.crossSell.generateForTenant(user.tenantId);
  }

  @Patch('opportunities/:id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Atualizar status da oportunidade de cross-sell' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCrossSellOpportunityDto,
  ) {
    return this.crossSell.update(user.tenantId, id, dto, user.sub, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }
}
