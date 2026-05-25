import {
  Body,
  Controller,
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
  CancelPolicyDto,
  CreatePolicyDto,
  IssuePolicyFromDealDto,
  ListPoliciesQueryDto,
  RenewPolicyDto,
  UpdatePolicyDto,
} from './dto/policy.dto';
import { PoliciesService } from './policies.service';

@ApiTags('policies')
@ApiBearerAuth('access-token')
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Get()
  @RequirePermissions('policies:view')
  @ApiOperation({ summary: 'Listar apólices do tenant' })
  findPolicies(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListPoliciesQueryDto,
  ) {
    return this.policies.findPolicies(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('policies:manage')
  @ApiOperation({ summary: 'Registrar apólice manualmente' })
  createPolicy(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreatePolicyDto,
  ) {
    return this.policies.createPolicy(user.tenantId, user.sub, dto);
  }

  @Post('issue-from-deal')
  @RequirePermissions('policies:manage')
  @ApiOperation({
    summary: 'Emitir apólice operacional a partir de negócio ganho',
  })
  issueFromDeal(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: IssuePolicyFromDealDto,
  ) {
    return this.policies.issuePolicyFromDeal(user.tenantId, user.sub, dto);
  }

  @Get(':id')
  @RequirePermissions('policies:view')
  @ApiOperation({ summary: 'Detalhe da apólice' })
  @ApiParam({ name: 'id' })
  findPolicy(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.policies.findPolicy(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('policies:manage')
  @ApiOperation({ summary: 'Atualizar apólice' })
  @ApiParam({ name: 'id' })
  updatePolicy(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policies.updatePolicy(user.tenantId, id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('policies:manage')
  @ApiOperation({ summary: 'Cancelar apólice' })
  @ApiParam({ name: 'id' })
  cancelPolicy(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: CancelPolicyDto,
  ) {
    return this.policies.cancelPolicy(user.tenantId, id, user.sub, dto);
  }

  @Post(':id/renew')
  @RequirePermissions('policies:manage')
  @ApiOperation({ summary: 'Renovar apólice (nova vigência)' })
  @ApiParam({ name: 'id' })
  renewPolicy(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: RenewPolicyDto,
  ) {
    return this.policies.renewPolicy(user.tenantId, id, user.sub, dto);
  }
}
