import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  CreatePersonDto,
  ListPersonsQueryDto,
  UpdatePersonDto,
} from './dto/person.dto';
import { PersonsService } from './persons.service';

@ApiTags('persons')
@ApiBearerAuth('access-token')
@Controller('persons')
export class PersonsController {
  constructor(private readonly persons: PersonsService) {}

  @Get()
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Listar pessoas do inventário imobiliário' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListPersonsQueryDto,
  ) {
    return this.persons.findAll(user.tenantId, query.search);
  }

  @Get(':id')
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Detalhe da pessoa' })
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.persons.findOne(user.tenantId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Cadastrar pessoa (proprietário)' })
  create(@CurrentUser() user: JwtAccessPayload, @Body() dto: CreatePersonDto) {
    return this.persons.create(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Atualizar pessoa' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
  ) {
    return this.persons.update(user.tenantId, id, dto);
  }
}
