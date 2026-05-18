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
import {
  ConvertLeadDto,
  CreateLeadDto,
  LEAD_STATUSES,
  ListLeadsQueryDto,
  UpdateLeadDto,
} from './dto/lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@ApiBearerAuth('access-token')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Listar leads do tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: LEAD_STATUSES })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findLeads(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListLeadsQueryDto,
  ) {
    return this.leads.findLeads(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Detalhe do lead do tenant' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  findLead(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.leads.findLead(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Criar lead no tenant' })
  createLead(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leads.createLead(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Atualizar lead do tenant' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  updateLead(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leads.updateLead(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Excluir lead do tenant' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  deleteLead(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.leads.deleteLead(user.tenantId, id);
  }

  @Post(':id/convert')
  @RequirePermissions('leads:manage', 'crm:manage')
  @ApiOperation({ summary: 'Converter lead em negócio do CRM' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  convertLead(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.leads.convertLead(user.tenantId, id, dto);
  }
}
