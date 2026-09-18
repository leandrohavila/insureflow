import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { CommercialReactivationsService } from './commercial-reactivations.service';
import {
  ListReactivationQueueQueryDto,
  PostponeReactivationDto,
  ReactivateLeadDto,
} from './dto/commercial-reactivations.dto';

@ApiTags('commercial-reactivations')
@ApiBearerAuth('access-token')
@Controller('commercial-reactivations')
export class CommercialReactivationsController {
  constructor(private readonly queue: CommercialReactivationsService) {}

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
  @ApiOperation({ summary: 'Fila operacional de reativação' })
  list(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListReactivationQueueQueryDto,
  ) {
    return this.queue.list(user.tenantId, query, this.actorFrom(user));
  }

  @Post(':leadId/reactivate')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Reativar lead perdido (reabrir oportunidade)' })
  @ApiParam({ name: 'leadId' })
  reactivate(
    @CurrentUser() user: JwtAccessPayload,
    @Param('leadId') leadId: string,
    @Body() dto: ReactivateLeadDto,
  ) {
    return this.queue.reactivate(
      user.tenantId,
      leadId,
      dto,
      this.actorFrom(user),
    );
  }

  @Post(':leadId/postpone')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Adiar data prevista de reativação' })
  @ApiParam({ name: 'leadId' })
  postpone(
    @CurrentUser() user: JwtAccessPayload,
    @Param('leadId') leadId: string,
    @Body() dto: PostponeReactivationDto,
  ) {
    return this.queue.postpone(
      user.tenantId,
      leadId,
      dto,
      this.actorFrom(user),
    );
  }
}
