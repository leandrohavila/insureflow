import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { performance } from 'node:perf_hooks';
import type { Request, Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  ConvertLeadDto,
  CreateLeadDto,
  FindLeadDuplicatesQueryDto,
  LEAD_STATUSES,
  ListLeadsQueryDto,
  UpdateLeadDto,
} from './dto/lead.dto';
import { LeadsService } from './leads.service';
import { LeadSharesService } from './lead-shares.service';
import { CreateLeadShareDto, UpdateLeadShareDto } from './dto/lead-share.dto';
import { LinkBusinessUnitDto } from '../business-units/dto/business-unit.dto';

@ApiTags('leads')
@ApiBearerAuth('access-token')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leads: LeadsService,
    private readonly leadShares: LeadSharesService,
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
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Listar leads do tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: LEAD_STATUSES })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'mine', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Máximo 500 para workspaces operacionais.',
  })
  findLeads(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListLeadsQueryDto,
    @Headers('x-bug010-trace') bug010TraceId?: string,
    @Req() request?: Request,
    @Res({ passthrough: true }) response?: Response,
  ) {
    const traceId = bug010TraceId?.trim() || 'lead-list';
    const controllerStartedAt = performance.now();
    console.info('[BUG010.2][api] Controller findLeads início', {
      traceId,
      path: request?.url,
      query,
    });
    response?.once('finish', () => {
      console.info('[BUG010.2][api] Controller findLeads response finish', {
        traceId,
        status: response.statusCode,
        controllerToFinishMs: Number(
          (performance.now() - controllerStartedAt).toFixed(2),
        ),
      });
    });

    const result = this.leads.findLeads(
      user.tenantId,
      query,
      this.actorFrom(user),
      { traceId },
    );
    void result
      .then(() => {
        console.info('[BUG010.2][api] Controller findLeads service resolved', {
          traceId,
          controllerMs: Number(
            (performance.now() - controllerStartedAt).toFixed(2),
          ),
        });
      })
      .catch(() => {
        console.info('[BUG010.2][api] Controller findLeads service rejected', {
          traceId,
          controllerMs: Number(
            (performance.now() - controllerStartedAt).toFixed(2),
          ),
        });
      });
    return result;
  }

  @Get('duplicates')
  @RequirePermissions('leads:view')
  @ApiOperation({
    summary: 'Buscar leads duplicados por CPF/CNPJ (documento completo)',
  })
  @ApiQuery({ name: 'document', required: true })
  @ApiQuery({ name: 'excludeId', required: false })
  findDuplicates(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: FindLeadDuplicatesQueryDto,
  ) {
    return this.leads.findDuplicates(user.tenantId, query);
  }

  @Get(':id/context')
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Contexto comercial agregado do lead' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  findLeadContext(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.leads.findLeadContext(user.tenantId, id, this.actorFrom(user));
  }

  @Get(':id')
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Detalhe do lead do tenant' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  findLead(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.leads.findLead(user.tenantId, id, this.actorFrom(user));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Criar lead no tenant' })
  createLead(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateLeadDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Req() request?: Request,
    @Res({ passthrough: true }) response?: Response,
  ) {
    const traceId = idempotencyKey?.trim() || 'lead-create';
    const controllerStartedAt = performance.now();
    console.info('[BUG010][api] Controller createLead start', {
      traceId,
      path: request?.url,
    });
    response?.once('finish', () => {
      console.info('[BUG010][api] Controller response finish', {
        traceId,
        status: response.statusCode,
        controllerToFinishMs: Number(
          (performance.now() - controllerStartedAt).toFixed(2),
        ),
      });
    });

    const serviceStartedAt = performance.now();
    const result = this.leads.createLead(
      user.tenantId,
      dto,
      this.actorFrom(user),
      {
        idempotencyKey,
      },
    );
    void result
      .then(() => {
        console.info('[BUG010][api] Service resolved from controller', {
          traceId,
          serviceMs: Number((performance.now() - serviceStartedAt).toFixed(2)),
          controllerMs: Number(
            (performance.now() - controllerStartedAt).toFixed(2),
          ),
        });
      })
      .catch(() => {
        console.info('[BUG010][api] Service rejected from controller', {
          traceId,
          serviceMs: Number((performance.now() - serviceStartedAt).toFixed(2)),
        });
      });
    return result;
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
    return this.leads.updateLead(user.tenantId, id, dto, this.actorFrom(user));
  }

  @Post(':id/business-units')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Vincular unidade de negócio ao lead' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  linkBusinessUnit(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: LinkBusinessUnitDto,
  ) {
    return this.leads.linkBusinessUnit(
      user.tenantId,
      id,
      dto.businessUnitId,
      this.actorFrom(user),
    );
  }

  @Delete(':id/business-units/:businessUnitId')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Remover vínculo do lead com unidade de negócio' })
  unlinkBusinessUnit(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('businessUnitId') businessUnitId: string,
  ) {
    return this.leads.unlinkBusinessUnit(
      user.tenantId,
      id,
      businessUnitId,
      this.actorFrom(user),
    );
  }

  @Delete(':id')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Excluir lead do tenant' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  deleteLead(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.leads.deleteLead(user.tenantId, id, this.actorFrom(user));
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
    return this.leads.convertLead(user.tenantId, id, dto, this.actorFrom(user));
  }

  @Get(':leadId/shares')
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Listar compartilhamentos ativos do lead' })
  @ApiParam({ name: 'leadId', description: 'ID do lead' })
  listLeadShares(
    @CurrentUser() user: JwtAccessPayload,
    @Param('leadId') leadId: string,
  ) {
    return this.leadShares.listShares(
      user.tenantId,
      leadId,
      this.actorFrom(user),
    );
  }

  @Post(':leadId/shares')
  @RequirePermissions('leads:share')
  @ApiOperation({ summary: 'Compartilhar lead com usuário do tenant' })
  @ApiParam({ name: 'leadId', description: 'ID do lead' })
  createLeadShare(
    @CurrentUser() user: JwtAccessPayload,
    @Param('leadId') leadId: string,
    @Body() dto: CreateLeadShareDto,
  ) {
    return this.leadShares.createShare(
      user.tenantId,
      leadId,
      dto,
      this.actorFrom(user),
    );
  }

  @Patch(':leadId/shares/:shareId')
  @RequirePermissions('leads:share')
  @ApiOperation({ summary: 'Atualizar compartilhamento do lead' })
  updateLeadShare(
    @CurrentUser() user: JwtAccessPayload,
    @Param('leadId') leadId: string,
    @Param('shareId') shareId: string,
    @Body() dto: UpdateLeadShareDto,
  ) {
    return this.leadShares.updateShare(
      user.tenantId,
      leadId,
      shareId,
      dto,
      this.actorFrom(user),
    );
  }

  @Delete(':leadId/shares/:shareId')
  @RequirePermissions('leads:share')
  @ApiOperation({ summary: 'Revogar compartilhamento do lead' })
  revokeLeadShare(
    @CurrentUser() user: JwtAccessPayload,
    @Param('leadId') leadId: string,
    @Param('shareId') shareId: string,
  ) {
    return this.leadShares.revokeShare(
      user.tenantId,
      leadId,
      shareId,
      this.actorFrom(user),
    );
  }
}
