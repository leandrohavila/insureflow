import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { LeadFollowUpsModule } from '../lead-follow-ups/lead-follow-ups.module';
import { CommercialReactivationsController } from './commercial-reactivations.controller';
import { CommercialReactivationsService } from './commercial-reactivations.service';

@Module({
  imports: [ActivitiesModule, LeadFollowUpsModule],
  controllers: [CommercialReactivationsController],
  providers: [CommercialReactivationsService],
  exports: [CommercialReactivationsService],
})
export class CommercialReactivationsModule {}
