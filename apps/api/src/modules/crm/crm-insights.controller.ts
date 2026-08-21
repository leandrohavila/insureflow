import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { Dashboard360QueryDto } from '../opportunities/dto/opportunity.dto';
import { ExecutiveDashboardService } from './executive-dashboard.service';
import { PipelinesService } from './pipelines.service';
import { SlaDashboardService } from './sla-dashboard.service';

@ApiTags('crm')
@ApiBearerAuth('access-token')
@Controller('crm')
export class CrmInsightsController {
  constructor(
    private readonly pipelines: PipelinesService,
    private readonly executive: ExecutiveDashboardService,
    private readonly sla: SlaDashboardService,
  ) {}

  @Get('pipelines')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Pipelines por unidade de negócio' })
  listPipelines(@CurrentUser() user: JwtAccessPayload) {
    return this.pipelines.list(user.tenantId, actorFrom(user));
  }

  @Get('dashboard-executivo')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Dashboard executivo do funil comercial' })
  dashboard(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: Dashboard360QueryDto,
  ) {
    return this.executive.getDashboard(user.tenantId, query, actorFrom(user));
  }

  @Get('dashboard-sla')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Dashboard de SLA comercial' })
  slaDashboard(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: Dashboard360QueryDto,
  ) {
    return this.sla.getDashboard(user.tenantId, query, actorFrom(user));
  }
}

function actorFrom(user: JwtAccessPayload) {
  return {
    userId: user.sub,
    tenantId: user.tenantId,
    roles: user.roles,
    permissions: user.permissions,
    currentBusinessUnitId: user.currentBusinessUnitId,
  };
}
