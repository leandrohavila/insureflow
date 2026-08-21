import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { UpdateLeadReactivationSettingsDto } from './dto/lead-reactivation-settings.dto';
import { LeadReactivationService } from './lead-reactivation.service';

@ApiTags('automation')
@ApiBearerAuth('access-token')
@Controller('automation/reactivation')
export class LeadReactivationController {
  constructor(private readonly reactivation: LeadReactivationService) {}

  @Get('settings')
  @RequirePermissions('automation:view')
  @ApiOperation({ summary: 'Configuração de reativação de leads' })
  getSettings(@CurrentUser() user: JwtAccessPayload) {
    return this.reactivation.getSettings(user.tenantId);
  }

  @Post('settings')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Atualizar configuração de reativação de leads' })
  updateSettings(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: UpdateLeadReactivationSettingsDto,
  ) {
    return this.reactivation.updateSettings(user.tenantId, dto);
  }

  @Get('metrics')
  @RequirePermissions('automation:view')
  @ApiOperation({ summary: 'Indicadores de reativação de leads' })
  getMetrics(@CurrentUser() user: JwtAccessPayload) {
    return this.reactivation.getMetrics(user.tenantId);
  }

  @Post('run')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Executar reativação agora (tenant atual)' })
  runNow(@CurrentUser() user: JwtAccessPayload) {
    return this.reactivation.processTenant(user.tenantId);
  }
}
