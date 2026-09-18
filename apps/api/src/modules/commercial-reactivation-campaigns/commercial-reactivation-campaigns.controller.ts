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
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { CommercialReactivationCampaignsService } from './commercial-reactivation-campaigns.service';
import {
  AddCampaignLeadsDto,
  CreateCampaignDto,
  ListCampaignsQueryDto,
  PreviewCampaignLeadsDto,
  ReactivateCampaignLeadDto,
  UpdateCampaignDto,
  UpdateCampaignLeadDto,
} from './dto/commercial-reactivation-campaigns.dto';

@ApiTags('commercial-reactivation-campaigns')
@ApiBearerAuth('access-token')
@Controller('commercial-reactivation-campaigns')
export class CommercialReactivationCampaignsController {
  constructor(
    private readonly campaigns: CommercialReactivationCampaignsService,
  ) {}

  private actorFrom(user: JwtAccessPayload) {
    return {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    };
  }

  @Get()
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Listar campanhas de reativação' })
  list(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListCampaignsQueryDto,
  ) {
    return this.campaigns.list(user.tenantId, query, this.actorFrom(user));
  }

  @Post()
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Criar campanha de reativação' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaigns.create(user.tenantId, dto, this.actorFrom(user));
  }

  @Get(':id')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Detalhe da campanha com leads' })
  @ApiParam({ name: 'id' })
  getById(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.campaigns.getById(user.tenantId, id, this.actorFrom(user));
  }

  @Patch(':id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Atualizar campanha' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaigns.update(user.tenantId, id, dto, this.actorFrom(user));
  }

  @Post(':id/start')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Iniciar campanha' })
  start(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.campaigns.start(user.tenantId, id, this.actorFrom(user));
  }

  @Post(':id/finish')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Encerrar campanha' })
  finish(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.campaigns.finish(user.tenantId, id, this.actorFrom(user));
  }

  @Post(':id/preview-leads')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Prévia de leads elegíveis pelos filtros' })
  previewLeads(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: PreviewCampaignLeadsDto,
  ) {
    return this.campaigns.previewLeads(
      user.tenantId,
      id,
      dto,
      this.actorFrom(user),
    );
  }

  @Post(':id/add-leads')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Adicionar leads à campanha' })
  addLeads(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: AddCampaignLeadsDto,
  ) {
    return this.campaigns.addLeads(
      user.tenantId,
      id,
      dto,
      this.actorFrom(user),
    );
  }

  @Delete(':id/leads/:campaignLeadId')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Remover lead da campanha' })
  removeLead(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('campaignLeadId') campaignLeadId: string,
  ) {
    return this.campaigns.removeLead(
      user.tenantId,
      id,
      campaignLeadId,
      this.actorFrom(user),
    );
  }

  @Patch(':id/leads/:campaignLeadId')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Atualizar status de contato do lead na campanha' })
  updateLead(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('campaignLeadId') campaignLeadId: string,
    @Body() dto: UpdateCampaignLeadDto,
  ) {
    return this.campaigns.updateLead(
      user.tenantId,
      id,
      campaignLeadId,
      dto,
      this.actorFrom(user),
    );
  }

  @Post(':id/leads/:campaignLeadId/reactivate')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Reativar lead a partir da campanha' })
  reactivateLead(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('campaignLeadId') campaignLeadId: string,
    @Body() dto: ReactivateCampaignLeadDto,
  ) {
    return this.campaigns.reactivateLead(
      user.tenantId,
      id,
      campaignLeadId,
      dto,
      this.actorFrom(user),
    );
  }
}
