import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { ProposalPdfService } from './proposal-pdf.service';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [QuotesController],
  providers: [QuotesService, ProposalPdfService],
  exports: [QuotesService],
})
export class QuotesModule {}
