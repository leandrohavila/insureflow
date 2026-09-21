import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { LeadFollowUpsModule } from '../lead-follow-ups/lead-follow-ups.module';
import { CommercialReactivationCampaignsController } from './commercial-reactivation-campaigns.controller';
import { CommercialReactivationCampaignsService } from './commercial-reactivation-campaigns.service';

@Module({
  imports: [ActivitiesModule, LeadFollowUpsModule, AuditLogsModule],
  controllers: [CommercialReactivationCampaignsController],
  providers: [CommercialReactivationCampaignsService],
  exports: [CommercialReactivationCampaignsService],
})
export class CommercialReactivationCampaignsModule {}
