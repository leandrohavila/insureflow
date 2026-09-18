import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { CommunicationsModule } from '../communications/communications.module';
import { LeadFollowUpsModule } from '../lead-follow-ups/lead-follow-ups.module';
import { LEAD_REACTIVATION_QUEUE } from '../lead-reactivation/lead-reactivation.constants';
import { LeadReactivationModule } from '../lead-reactivation/lead-reactivation.module';
import { PolicyRenewalsModule } from '../policy-renewals/policy-renewals.module';
import { COMMERCIAL_AUTOMATION_QUEUE } from './commercial-automation.constants';
import { CommercialAutomationController } from './commercial-automation.controller';
import { CommercialAutomationProcessor } from './commercial-automation.processor';
import { CommercialAutomationScheduler } from './commercial-automation.scheduler';
import { CommercialAutomationService } from './commercial-automation.service';
import { SalesSlaEngine } from './sales-sla-engine.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: COMMERCIAL_AUTOMATION_QUEUE },
      { name: LEAD_REACTIVATION_QUEUE },
    ),
    ActivitiesModule,
    CommunicationsModule,
    LeadReactivationModule,
    LeadFollowUpsModule,
    PolicyRenewalsModule,
  ],
  controllers: [CommercialAutomationController],
  providers: [
    CommercialAutomationService,
    CommercialAutomationProcessor,
    CommercialAutomationScheduler,
    SalesSlaEngine,
  ],
  exports: [CommercialAutomationService, SalesSlaEngine],
})
export class CommercialAutomationModule {}
