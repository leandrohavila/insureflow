import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  isRuntimeAudit,
  logDealContract,
} from '../../common/utils/deal-contract-debug';
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
    @Req() req: Request,
  ) {
    if (isRuntimeAudit()) {
      console.warn('[runtime-audit][crm.create] rawBody', req.body);

      console.warn('[runtime-audit][crm.create] dto', dto);
    }
    logDealContract('controller.create', {
      keys: Object.keys(dto),
      pipelineOrder: dto.pipelineOrder,
    });
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
    @Req() req: Request,
  ) {
    if (isRuntimeAudit()) {
      console.warn('[runtime-audit][crm.update] rawBody', req.body);

      console.warn('[runtime-audit][crm.update] dto', dto);
    }
    logDealContract('controller.update', {
      id,
      keys: Object.keys(dto),
      pipelineOrder: dto.pipelineOrder,
    });
    return this.crm.updateDeal(user.tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Excluir negócio do tenant' })
  @ApiParam({ name: 'id', description: 'ID do negócio' })
  deleteDeal(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.crm.deleteDeal(user.tenantId, id);
  }
}
