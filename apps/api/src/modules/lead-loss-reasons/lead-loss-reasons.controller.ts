import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  CreateLeadLossReasonDto,
  ListLeadLossReasonsQueryDto,
  UpdateLeadLossReasonDto,
} from './dto/lead-loss-reason.dto';
import { LeadLossReasonsService } from './lead-loss-reasons.service';

@ApiTags('lead-loss-reasons')
@ApiBearerAuth('access-token')
@Controller('lead-loss-reasons')
export class LeadLossReasonsController {
  constructor(private readonly reasons: LeadLossReasonsService) {}

  @Get()
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Listar motivos de perda do tenant' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListLeadLossReasonsQueryDto,
  ) {
    return this.reasons.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('settings:view')
  @ApiOperation({ summary: 'Detalhe do motivo de perda' })
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.reasons.findOne(user.tenantId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Criar motivo de perda' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateLeadLossReasonDto,
  ) {
    return this.reasons.create(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Atualizar motivo de perda' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLeadLossReasonDto,
  ) {
    return this.reasons.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Excluir motivo de perda' })
  remove(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.reasons.remove(user.tenantId, id);
  }
}
