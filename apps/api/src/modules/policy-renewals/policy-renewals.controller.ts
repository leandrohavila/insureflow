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
  CreatePolicyRenewalDto,
  ListPolicyRenewalsQueryDto,
  UpdatePolicyRenewalDto,
} from './dto/policy-renewal.dto';
import { PolicyRenewalsService } from './policy-renewals.service';

@ApiTags('policy-renewals')
@ApiBearerAuth('access-token')
@Controller('policy-renewals')
export class PolicyRenewalsController {
  constructor(private readonly renewals: PolicyRenewalsService) {}

  @Get()
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Listar fila comercial de renovações' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListPolicyRenewalsQueryDto,
  ) {
    return this.renewals.findAll(user.tenantId, query, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Get(':id')
  @RequirePermissions('crm:view')
  @ApiOperation({ summary: 'Detalhe da renovação' })
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.renewals.findOne(user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Cadastrar renovação comercial' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreatePolicyRenewalDto,
  ) {
    return this.renewals.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Atualizar status da renovação' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePolicyRenewalDto,
  ) {
    return this.renewals.update(user.tenantId, id, dto, user.sub, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post(':id/deal')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Criar negócio de renovação e enviar ao pipeline' })
  createDeal(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.renewals.createDealFromRenewal(user.tenantId, id, user.sub, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post(':id/activity')
  @RequirePermissions('crm:manage')
  @ApiOperation({ summary: 'Criar atividade de follow-up da renovação' })
  createActivity(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.renewals.createActivityForRenewal(user.tenantId, id, user.sub, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }
}
