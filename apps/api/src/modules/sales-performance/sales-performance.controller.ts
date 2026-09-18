import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { CommissionRulesService } from './commission-rules.service';
import { CommissionsService } from './commissions.service';
import {
  CreateCommissionRuleDto,
  CreateSalesTargetDto,
  ListCommissionsQueryDto,
  ListSalesTargetsQueryDto,
  PerformanceQueryDto,
  UpdateCommissionDto,
  UpdateCommissionRuleDto,
  UpdateSalesTargetDto,
} from './dto/sales-performance.dto';
import { PerformanceService } from './performance.service';
import { SalesTargetsService } from './sales-targets.service';

function actorFrom(user: JwtAccessPayload) {
  return {
    userId: user.sub,
    tenantId: user.tenantId,
    roles: user.roles,
    permissions: user.permissions,
    currentBusinessUnitId: user.currentBusinessUnitId,
  };
}

@ApiTags('performance')
@ApiBearerAuth('access-token')
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performance: PerformanceService) {}

  @Get()
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Indicadores de performance comercial' })
  dashboard(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: PerformanceQueryDto,
  ) {
    return this.performance.getDashboard(
      user.tenantId,
      query,
      actorFrom(user),
    );
  }

  @Get('ranking')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Ranking comercial' })
  ranking(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: PerformanceQueryDto,
  ) {
    return this.performance.getRanking(user.tenantId, query, actorFrom(user));
  }
}

@ApiTags('sales-targets')
@ApiBearerAuth('access-token')
@Controller('sales-targets')
export class SalesTargetsController {
  constructor(private readonly targets: SalesTargetsService) {}

  @Get()
  @RequirePermissions('crm:view')
  list(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListSalesTargetsQueryDto,
  ) {
    return this.targets.list(user.tenantId, query, actorFrom(user));
  }

  @Post()
  @RequirePermissions('crm:manage')
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateSalesTargetDto,
  ) {
    return this.targets.create(user.tenantId, dto, user.sub, actorFrom(user));
  }

  @Patch(':id')
  @RequirePermissions('crm:manage')
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSalesTargetDto,
  ) {
    return this.targets.update(
      user.tenantId,
      id,
      dto,
      user.sub,
      actorFrom(user),
    );
  }
}

@ApiTags('commissions')
@ApiBearerAuth('access-token')
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissions: CommissionsService) {}

  @Get()
  @RequirePermissions('crm:view')
  list(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListCommissionsQueryDto,
  ) {
    return this.commissions.list(user.tenantId, query, actorFrom(user));
  }

  @Patch(':id')
  @RequirePermissions('crm:manage')
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCommissionDto,
  ) {
    return this.commissions.update(
      user.tenantId,
      id,
      dto,
      user.sub,
      actorFrom(user),
    );
  }
}

@ApiTags('commission-rules')
@ApiBearerAuth('access-token')
@Controller('commission-rules')
export class CommissionRulesController {
  constructor(private readonly rules: CommissionRulesService) {}

  @Get()
  @RequirePermissions('crm:view')
  list(@CurrentUser() user: JwtAccessPayload) {
    return this.rules.list(user.tenantId, actorFrom(user));
  }

  @Post()
  @RequirePermissions('crm:manage')
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateCommissionRuleDto,
  ) {
    return this.rules.create(user.tenantId, dto, actorFrom(user));
  }

  @Patch(':id')
  @RequirePermissions('crm:manage')
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCommissionRuleDto,
  ) {
    return this.rules.update(user.tenantId, id, dto, actorFrom(user));
  }
}
