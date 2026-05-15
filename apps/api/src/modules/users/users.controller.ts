import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Listar usuários do tenant' })
  list(@CurrentUser() user: JwtAccessPayload) {
    return this.users.findByTenant(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Detalhe do usuário' })
  one(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.users.findOne(user.tenantId, id);
  }
}
