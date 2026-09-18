import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { CommissionRulesService } from './commission-rules.service';
import { CommissionsService } from './commissions.service';
import { PerformanceService } from './performance.service';
import {
  CommissionRulesController,
  CommissionsController,
  PerformanceController,
  SalesTargetsController,
} from './sales-performance.controller';
import { SalesTargetsService } from './sales-targets.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [
    PerformanceController,
    SalesTargetsController,
    CommissionsController,
    CommissionRulesController,
  ],
  providers: [
    SalesTargetsService,
    CommissionsService,
    CommissionRulesService,
    PerformanceService,
  ],
  exports: [CommissionsService],
})
export class SalesPerformanceModule {}
