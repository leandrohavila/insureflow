import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { LeadsModule } from '../leads/leads.module';
import { QuotesModule } from '../quotes/quotes.module';
import { PublicQuestionnaireController } from './public-questionnaire.controller';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';

@Module({
  imports: [LeadsModule, ActivitiesModule, QuotesModule],
  controllers: [QuestionnairesController, PublicQuestionnaireController],
  providers: [QuestionnairesService],
})
export class QuestionnairesModule {}
