import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  ACTIVITY_TYPES,
  CreateActivityDto,
  ListActivitiesQueryDto,
  UpdateActivityDto,
} from './dto/activity.dto';
import { ActivitiesService } from './activities.service';

@ApiTags('activities')
@ApiBearerAuth('access-token')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get()
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Listar atividades humanas do tenant' })
  findActivities(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListActivitiesQueryDto,
  ) {
    return this.activities.findActivities(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Detalhe de atividade do tenant' })
  @ApiParam({ name: 'id' })
  findActivity(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.activities.findActivity(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Registrar atividade humana' })
  createActivity(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activities.createActivity(user.tenantId, user.sub, dto);
  }

  @Patch(':id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Atualizar atividade humana' })
  @ApiParam({ name: 'id' })
  updateActivity(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activities.updateActivity(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Excluir atividade humana' })
  @ApiParam({ name: 'id' })
  deleteActivity(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.activities.deleteActivity(user.tenantId, id);
  }
}

export { ACTIVITY_TYPES };
