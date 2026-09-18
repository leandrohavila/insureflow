import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { CommercialReactivationCampaignsController } from './commercial-reactivation-campaigns.controller';
import { CommercialReactivationCampaignsService } from './commercial-reactivation-campaigns.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [CommercialReactivationCampaignsController],
  providers: [CommercialReactivationCampaignsService],
  exports: [CommercialReactivationCampaignsService],
})
export class CommercialReactivationCampaignsModule {}
