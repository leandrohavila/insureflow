import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { ListCommercialAgendaQueryDto } from './commercial-agenda.dto';
import { CommercialAgendaService } from './commercial-agenda.service';

@ApiTags('commercial-agenda')
@ApiBearerAuth('access-token')
@Controller('commercial-agenda')
export class CommercialAgendaController {
  constructor(private readonly agenda: CommercialAgendaService) {}

  @Get()
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Agenda comercial unificada' })
  list(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListCommercialAgendaQueryDto,
  ) {
    return this.agenda.list(user.tenantId, query, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }
}
