import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { LeadFollowUpsController } from './lead-follow-ups.controller';
import { LeadFollowUpsService } from './lead-follow-ups.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [LeadFollowUpsController],
  providers: [LeadFollowUpsService],
  exports: [LeadFollowUpsService],
})
export class LeadFollowUpsModule {}
