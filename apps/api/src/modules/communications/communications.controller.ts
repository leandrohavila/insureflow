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
import { SkipThrottle } from '@nestjs/throttler';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { CommunicationsService } from './communications.service';
import {
  CommunicationsDashboardQueryDto,
  ListCommunicationsQueryDto,
  RecordCommunicationReplyDto,
  SendCommunicationDto,
  UpdateCommunicationProviderDto,
} from './dto/communication.dto';

@ApiTags('communications')
@ApiBearerAuth('access-token')
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communications: CommunicationsService) {}

  @Get()
  @RequirePermissions('automation:view')
  @ApiOperation({ summary: 'Listar logs de comunicação comercial' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListCommunicationsQueryDto,
  ) {
    return this.communications.findAll(user.tenantId, query, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Get('dashboard')
  @RequirePermissions('automation:view')
  @ApiOperation({ summary: 'Indicadores de comunicação comercial' })
  dashboard(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: CommunicationsDashboardQueryDto,
  ) {
    return this.communications.getDashboard(user.tenantId, query, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Get('provider')
  @RequirePermissions('automation:view')
  @ApiOperation({ summary: 'Provider ativo, Evolution e adaptadores' })
  getProvider(@CurrentUser() user: JwtAccessPayload) {
    return this.communications.getProviderConfig(user.tenantId);
  }

  @Patch('provider')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Atualizar provider e credenciais Evolution' })
  updateProvider(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: UpdateCommunicationProviderDto,
  ) {
    return this.communications.updateProviderConfig(user.tenantId, dto);
  }

  @Get('evolution/health')
  @RequirePermissions('settings:view')
  @ApiOperation({ summary: 'Status da conexão Evolution / WhatsApp' })
  evolutionHealth(@CurrentUser() user: JwtAccessPayload) {
    return this.communications.evolutionHealth(user.tenantId);
  }

  @Post('evolution/connect')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Conectar instância Evolution e registrar webhook' })
  connectEvolution(@CurrentUser() user: JwtAccessPayload) {
    return this.communications.connectEvolution(user.tenantId);
  }

  @Post('evolution/reconnect')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Reconectar instância Evolution' })
  reconnectEvolution(@CurrentUser() user: JwtAccessPayload) {
    return this.communications.reconnectEvolution(user.tenantId);
  }

  @Post('evolution/disconnect')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Desconectar instância Evolution' })
  disconnectEvolution(@CurrentUser() user: JwtAccessPayload) {
    return this.communications.disconnectEvolution(user.tenantId);
  }

  @Post('evolution/qrcode')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Gerar QR Code da instância Evolution' })
  generateQr(@CurrentUser() user: JwtAccessPayload) {
    return this.communications.generateEvolutionQr(user.tenantId);
  }

  @Public()
  @SkipThrottle()
  @Post('webhooks/evolution')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Evolution API (mensagens e status)' })
  evolutionWebhook(
    @Query('token') token: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.communications.handleEvolutionWebhook(body, token);
  }

  @Post('send')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Enviar comunicação via camada de providers' })
  send(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: SendCommunicationDto,
  ) {
    return this.communications.sendManual(user.tenantId, dto, user.sub);
  }

  @Post('inbound')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Registrar resposta recebida (manual ou webhook-ready)' })
  inbound(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: RecordCommunicationReplyDto,
  ) {
    return this.communications.recordReply(user.tenantId, dto);
  }

  @Get(':id')
  @RequirePermissions('automation:view')
  @ApiOperation({ summary: 'Detalhe de um log de comunicação' })
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.communications.findOne(user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post(':id/reply')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Registrar resposta em um envio específico' })
  reply(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: RecordCommunicationReplyDto,
  ) {
    return this.communications.recordReply(user.tenantId, dto, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }
}
