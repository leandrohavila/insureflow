import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { PublicQuestionnaireAnswersDto } from './dto/questionnaire.dto';
import { QuestionnairesService } from './questionnaires.service';

@ApiTags('public-questionnaires')
@Public()
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('public/questionnaires')
export class PublicQuestionnaireController {
  constructor(private readonly questionnaires: QuestionnairesService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Abrir o questionário público a partir do token do link',
  })
  @ApiParam({
    name: 'token',
    description: 'Token do link, sem o identificador interno',
  })
  open(@Param('token') token: string) {
    return this.questionnaires.openPublicQuestionnaire(token);
  }

  @Patch(':token')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @ApiOperation({ summary: 'Salvar o rascunho público sem concluir' })
  save(
    @Param('token') token: string,
    @Body() dto: PublicQuestionnaireAnswersDto,
  ) {
    return this.questionnaires.savePublicQuestionnaire(token, dto.answers);
  }

  @Post(':token/complete')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @ApiOperation({ summary: 'Concluir o questionário público' })
  complete(
    @Param('token') token: string,
    @Body() dto: PublicQuestionnaireAnswersDto,
  ) {
    return this.questionnaires.completePublicQuestionnaire(token, dto.answers);
  }
}
