import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module';
import { ActivitiesModule } from '../activities/activities.module';
import { BusinessUnitsModule } from '../business-units/business-units.module';
import { LeadFollowUpsModule } from '../lead-follow-ups/lead-follow-ups.module';
import { LeadLossReasonsModule } from '../lead-loss-reasons/lead-loss-reasons.module';
import { LeadsController } from './leads.controller';
import { LeadSharesService } from './lead-shares.service';
import { LeadsService } from './leads.service';

@Module({
  imports: [
    AccessModule,
    ActivitiesModule,
    BusinessUnitsModule,
    LeadFollowUpsModule,
    LeadLossReasonsModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService, LeadSharesService],
  exports: [LeadsService],
})
export class LeadsModule {}
