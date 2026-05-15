import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { PermissionsCatalogService } from './permissions.service';

@ApiTags('permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly catalog: PermissionsCatalogService) {}

  @Get()
  @RequirePermissions('settings:view')
  @ApiOperation({ summary: 'Catálogo global de permissões' })
  permissions() {
    return this.catalog.listPermissions();
  }

  @Get('roles')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Papéis e permissões do tenant' })
  roles(@CurrentUser() user: JwtAccessPayload) {
    return this.catalog.listRoles(user.tenantId);
  }
}
