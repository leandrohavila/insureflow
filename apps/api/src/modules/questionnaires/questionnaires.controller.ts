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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  CreateQuestionnaireFieldDto,
  CreateQuestionnaireSubmissionDto,
  CreateQuestionnaireTemplateDto,
  ListQuestionnaireSubmissionsQueryDto,
  ListQuestionnaireTemplatesQueryDto,
  QUESTIONNAIRE_ORIGINS,
  QUESTIONNAIRE_SUBMISSION_MODES,
  QUESTIONNAIRE_SUBMISSION_STATUSES,
  QUESTIONNAIRE_TEMPLATE_STATUSES,
  UpdateQuestionnaireFieldDto,
  UpdateQuestionnaireSubmissionDto,
  UpdateQuestionnaireTemplateDto,
} from './dto/questionnaire.dto';
import { QuestionnairesService } from './questionnaires.service';

@ApiTags('questionnaires')
@ApiBearerAuth('access-token')
@Controller('questionnaires')
export class QuestionnairesController {
  constructor(private readonly questionnaires: QuestionnairesService) {}

  @Get('templates')
  @RequirePermissions('questionnaires:view')
  @ApiOperation({ summary: 'Listar templates de questionário do tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: QUESTIONNAIRE_TEMPLATE_STATUSES,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findTemplates(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListQuestionnaireTemplatesQueryDto,
  ) {
    return this.questionnaires.findTemplates(user.tenantId, query);
  }

  @Get('templates/:id')
  @RequirePermissions('questionnaires:view')
  @ApiOperation({ summary: 'Detalhe do template de questionário do tenant' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  findTemplate(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.questionnaires.findTemplate(user.tenantId, id);
  }

  @Post('templates')
  @RequirePermissions('questionnaires:manage')
  @ApiOperation({ summary: 'Criar template de questionário no tenant' })
  createTemplate(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateQuestionnaireTemplateDto,
  ) {
    return this.questionnaires.createTemplate(user.tenantId, dto);
  }

  @Patch('templates/:id')
  @RequirePermissions('questionnaires:manage')
  @ApiOperation({ summary: 'Atualizar template de questionário do tenant' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  updateTemplate(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionnaireTemplateDto,
  ) {
    return this.questionnaires.updateTemplate(user.tenantId, id, dto);
  }

  @Delete('templates/:id')
  @RequirePermissions('questionnaires:manage')
  @ApiOperation({
    summary:
      'Excluir template sem respostas ou arquivar quando já houver histórico',
  })
  @ApiParam({ name: 'id', description: 'ID do template' })
  deleteTemplate(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.questionnaires.deleteTemplate(user.tenantId, id);
  }

  @Post('templates/:id/fields')
  @RequirePermissions('questionnaires:manage')
  @ApiOperation({ summary: 'Adicionar campo ao template de questionário' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  createField(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') templateId: string,
    @Body() dto: CreateQuestionnaireFieldDto,
  ) {
    return this.questionnaires.createField(user.tenantId, templateId, dto);
  }

  @Get('templates/:id/fields')
  @RequirePermissions('questionnaires:view')
  @ApiOperation({ summary: 'Listar campos do template de questionário' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  findFields(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') templateId: string,
  ) {
    return this.questionnaires.findFields(user.tenantId, templateId);
  }

  @Get('templates/:id/fields/:fieldId')
  @RequirePermissions('questionnaires:view')
  @ApiOperation({ summary: 'Detalhe do campo do template de questionário' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiParam({ name: 'fieldId', description: 'ID do campo' })
  findField(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') templateId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.questionnaires.findField(user.tenantId, templateId, fieldId);
  }

  @Patch('templates/:id/fields/:fieldId')
  @RequirePermissions('questionnaires:manage')
  @ApiOperation({ summary: 'Atualizar campo do template de questionário' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiParam({ name: 'fieldId', description: 'ID do campo' })
  updateField(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') templateId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateQuestionnaireFieldDto,
  ) {
    return this.questionnaires.updateField(
      user.tenantId,
      templateId,
      fieldId,
      dto,
    );
  }

  @Delete('templates/:id/fields/:fieldId')
  @RequirePermissions('questionnaires:manage')
  @ApiOperation({ summary: 'Excluir campo do template de questionário' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiParam({ name: 'fieldId', description: 'ID do campo' })
  deleteField(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') templateId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.questionnaires.deleteField(user.tenantId, templateId, fieldId);
  }

  @Get('submissions')
  @RequirePermissions('questionnaires:view')
  @ApiOperation({ summary: 'Listar respostas de questionário do tenant' })
  @ApiQuery({ name: 'templateId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: QUESTIONNAIRE_SUBMISSION_STATUSES,
  })
  @ApiQuery({ name: 'origin', required: false, enum: QUESTIONNAIRE_ORIGINS })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: QUESTIONNAIRE_SUBMISSION_MODES,
  })
  @ApiQuery({ name: 'leadId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'dealId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findSubmissions(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListQuestionnaireSubmissionsQueryDto,
  ) {
    return this.questionnaires.findSubmissions(user.tenantId, query);
  }

  @Get('submissions/:id')
  @RequirePermissions('questionnaires:view')
  @ApiOperation({ summary: 'Detalhe da resposta de questionário do tenant' })
  @ApiParam({ name: 'id', description: 'ID da resposta' })
  findSubmission(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.questionnaires.findSubmission(user.tenantId, id);
  }

  @Post('submissions')
  @RequirePermissions('questionnaires:manage')
  @ApiOperation({ summary: 'Criar resposta de questionário no tenant' })
  createSubmission(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateQuestionnaireSubmissionDto,
  ) {
    return this.questionnaires.createSubmission(user.tenantId, dto);
  }

  @Patch('submissions/:id')
  @RequirePermissions('questionnaires:manage')
  @ApiOperation({ summary: 'Atualizar resposta de questionário do tenant' })
  @ApiParam({ name: 'id', description: 'ID da resposta' })
  updateSubmission(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionnaireSubmissionDto,
  ) {
    return this.questionnaires.updateSubmission(user.tenantId, id, dto);
  }

  @Delete('submissions/:id')
  @RequirePermissions('questionnaires:manage')
  @ApiOperation({ summary: 'Excluir resposta de questionário do tenant' })
  @ApiParam({ name: 'id', description: 'ID da resposta' })
  deleteSubmission(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.questionnaires.deleteSubmission(user.tenantId, id);
  }
}
