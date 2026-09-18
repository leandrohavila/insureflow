import {
  Body,
  Controller,
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
  CreateLeadFollowUpDto,
  ListLeadFollowUpsQueryDto,
  UpdateLeadFollowUpDto,
} from './dto/lead-follow-up.dto';
import { LeadFollowUpsService } from './lead-follow-ups.service';

@ApiTags('lead-follow-ups')
@ApiBearerAuth('access-token')
@Controller('lead-follow-ups')
export class LeadFollowUpsController {
  constructor(private readonly followUps: LeadFollowUpsService) {}

  @Get()
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Listar fila de follow-ups' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListLeadFollowUpsQueryDto,
  ) {
    return this.followUps.findAll(user.tenantId, query, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Get(':id')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Detalhe do follow-up' })
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.followUps.findOne(user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Agendar follow-up' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateLeadFollowUpDto,
  ) {
    return this.followUps.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Atualizar follow-up (concluir, remarcar, cancelar)' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLeadFollowUpDto,
  ) {
    return this.followUps.update(user.tenantId, id, dto, user.sub, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }
}
