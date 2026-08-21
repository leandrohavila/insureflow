import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { CommercialAutomationService } from './commercial-automation.service';
import { CommercialDashboardQueryDto } from './dto/commercial-dashboard.dto';

@ApiTags('commercial-automation')
@ApiBearerAuth('access-token')
@Controller()
export class CommercialAutomationController {
  constructor(private readonly automation: CommercialAutomationService) {}

  @Get('commercial/dashboard')
  @RequirePermissions('dashboard:view')
  @ApiOperation({ summary: 'Indicadores de recuperação comercial' })
  getDashboard(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: CommercialDashboardQueryDto,
  ) {
    return this.automation.getDashboard(user.tenantId, query, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post('automation/commercial/run')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Executar motor comercial agora (tenant atual)' })
  runNow(@CurrentUser() user: JwtAccessPayload) {
    return this.automation.runTenant(user.tenantId);
  }
}
