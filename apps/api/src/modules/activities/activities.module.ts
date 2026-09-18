import { Module } from '@nestjs/common';

import { ActivityEngineService } from './activity-engine.service';
import { ACTIVITY_EVENT_PUBLISHER } from './activity-event-publisher.interface';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivityEngineService,
    {
      provide: ACTIVITY_EVENT_PUBLISHER,
      useExisting: ActivityEngineService,
    },
  ],
  exports: [ActivitiesService, ActivityEngineService, ACTIVITY_EVENT_PUBLISHER],
})
export class ActivitiesModule {}
