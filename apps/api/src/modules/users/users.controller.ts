import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  ChangeUserPasswordDto,
  CreateUserDto,
  SetUserBusinessUnitsDto,
  SetUserRolesDto,
  SetUserStatusDto,
  UpdateUserDto,
} from './dto/user.dto';
import type { UserManagementActor } from './users-super-admin-guard.util';
import { UsersService } from './users.service';

function toActor(user: JwtAccessPayload): UserManagementActor {
  return {
    userId: user.sub,
    roles: user.roles,
    permissions: user.permissions,
  };
}

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

  @Get('assignable-roles')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Perfis disponíveis para atribuição (go-live)' })
  assignableRoles(@CurrentUser() user: JwtAccessPayload) {
    return this.users.listAssignableRoles(user.tenantId, user);
  }

  @Get(':id')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Detalhe do usuário' })
  one(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.users.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Criar usuário' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateUserDto,
  ) {
    return this.users.create(user.tenantId, dto, toActor(user));
  }

  @Patch(':id')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Atualizar dados do usuário' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(user.tenantId, id, dto, toActor(user));
  }

  @Patch(':id/status')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Ativar ou inativar usuário' })
  setStatus(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: SetUserStatusDto,
  ) {
    return this.users.setStatus(user.tenantId, id, dto, toActor(user));
  }

  @Patch(':id/password')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Definir nova senha do usuário' })
  changePassword(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: ChangeUserPasswordDto,
  ) {
    return this.users.changePassword(user.tenantId, id, dto, toActor(user));
  }

  @Put(':id/roles')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Substituir perfis (roles) do usuário' })
  setRoles(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: SetUserRolesDto,
  ) {
    return this.users.setRoles(user.tenantId, id, dto, toActor(user));
  }

  @Put(':id/business-units')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Substituir vínculos de empresas (BUs)' })
  setBusinessUnits(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: SetUserBusinessUnitsDto,
  ) {
    return this.users.setBusinessUnits(user.tenantId, id, dto, toActor(user));
  }
}
