import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { CustomersModule } from '../customers/customers.module';
import { CrmInsightsController } from './crm-insights.controller';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { ExecutiveDashboardService } from './executive-dashboard.service';
import { PipelinesService } from './pipelines.service';
import { SlaDashboardService } from './sla-dashboard.service';
import { SalesPerformanceModule } from '../sales-performance/sales-performance.module';

@Module({
  imports: [ActivitiesModule, CustomersModule, SalesPerformanceModule],
  controllers: [CrmController, CrmInsightsController],
  providers: [CrmService, PipelinesService, ExecutiveDashboardService, SlaDashboardService],
  exports: [PipelinesService],
})
export class CrmModule {}
