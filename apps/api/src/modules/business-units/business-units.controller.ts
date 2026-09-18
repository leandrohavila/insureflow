import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { BusinessUnitsService } from './business-units.service';
import {
  CreateBusinessUnitDto,
  ListBusinessUnitsQueryDto,
  UpdateBusinessUnitContextDto,
  UpdateBusinessUnitDto,
} from './dto/business-unit.dto';

@ApiTags('business-units')
@ApiBearerAuth('access-token')
@Controller('business-units')
export class BusinessUnitsController {
  constructor(
    private readonly businessUnits: BusinessUnitsService,
    private readonly buAccess: BusinessUnitAccessService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar unidades de negócio visíveis ao usuário' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListBusinessUnitsQueryDto,
  ) {
    return this.businessUnits.findAll(
      user.tenantId,
      query,
      this.buAccess.fromUser(user),
    );
  }

  @Get('context')
  @ApiOperation({ summary: 'Contexto da empresa ativa e unidades permitidas' })
  getContext(@CurrentUser() user: JwtAccessPayload) {
    return this.businessUnits.getContext(this.buAccess.fromUser(user));
  }

  @Patch('context')
  @ApiOperation({ summary: 'Trocar empresa ativa sem logout' })
  updateContext(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: UpdateBusinessUnitContextDto,
  ) {
    return this.businessUnits.updateContext(this.buAccess.fromUser(user), dto);
  }

  @Get(':id')
  @RequirePermissions('settings:view')
  @ApiOperation({ summary: 'Detalhe da unidade de negócio' })
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.businessUnits.findOne(user.tenantId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Criar unidade de negócio' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateBusinessUnitDto,
  ) {
    return this.businessUnits.create(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Atualizar unidade de negócio' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessUnitDto,
  ) {
    return this.businessUnits.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Excluir unidade de negócio' })
  remove(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.businessUnits.remove(user.tenantId, id);
  }
}
