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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { MessageTemplatesService } from './message-templates.service';
import {
  CreateMessageTemplateDto,
  ListMessageTemplatesQueryDto,
  UpdateMessageTemplateDto,
} from './dto/message-template.dto';

@ApiTags('message-templates')
@ApiBearerAuth('access-token')
@Controller('message-templates')
export class MessageTemplatesController {
  constructor(private readonly templates: MessageTemplatesService) {}

  @Get()
  @RequirePermissions('automation:view')
  @ApiOperation({ summary: 'Listar templates de mensagem' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListMessageTemplatesQueryDto,
  ) {
    return this.templates.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('automation:view')
  @ApiOperation({ summary: 'Detalhe do template' })
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.templates.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Criar template de mensagem' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateMessageTemplateDto,
  ) {
    return this.templates.create(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Atualizar template de mensagem' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.templates.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('automation:manage')
  @ApiOperation({ summary: 'Excluir template de mensagem' })
  remove(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.templates.remove(user.tenantId, id);
  }
}
