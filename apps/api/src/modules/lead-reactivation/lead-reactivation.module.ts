import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { CommunicationsModule } from '../communications/communications.module';
import { LeadFollowUpsModule } from '../lead-follow-ups/lead-follow-ups.module';
import { MessageTemplatesModule } from '../message-templates/message-templates.module';
import { LEAD_REACTIVATION_QUEUE } from './lead-reactivation.constants';
import { LeadReactivationController } from './lead-reactivation.controller';
import { LeadReactivationProcessor } from './lead-reactivation.processor';
import { LeadReactivationScheduler } from './lead-reactivation.scheduler';
import { LeadReactivationService } from './lead-reactivation.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: LEAD_REACTIVATION_QUEUE }),
    ActivitiesModule,
    MessageTemplatesModule,
    LeadFollowUpsModule,
    CommunicationsModule,
  ],
  controllers: [LeadReactivationController],
  providers: [
    LeadReactivationService,
    LeadReactivationProcessor,
    LeadReactivationScheduler,
  ],
  exports: [LeadReactivationService],
})
export class LeadReactivationModule {}
