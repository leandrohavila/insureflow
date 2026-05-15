import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@ApiBearerAuth('access-token')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('me')
  @RequirePermissions('settings:view')
  @ApiOperation({ summary: 'Tenant atual (do JWT)' })
  me(@CurrentUser() user: JwtAccessPayload) {
    return this.tenants.getCurrent(user.tenantId);
  }
}
