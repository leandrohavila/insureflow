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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  CreatePropertyFeatureDefinitionDto,
  UpdatePropertyFeatureDefinitionDto,
} from './dto/property-feature.dto';
import { PropertyFeatureDefinitionsService } from './property-feature-definitions.service';

@ApiTags('property-features')
@ApiBearerAuth('access-token')
@Controller('property-features')
export class PropertyFeatureDefinitionsController {
  constructor(
    private readonly definitions: PropertyFeatureDefinitionsService,
  ) {}

  @Get()
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Catálogo de características do imóvel' })
  findAll(@CurrentUser() user: JwtAccessPayload) {
    return this.definitions.findAll(user.tenantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Criar característica dinâmica' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreatePropertyFeatureDefinitionDto,
  ) {
    return this.definitions.create(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Atualizar característica' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyFeatureDefinitionDto,
  ) {
    return this.definitions.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Excluir característica (remove valores associados)' })
  remove(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.definitions.remove(user.tenantId, id);
  }
}
