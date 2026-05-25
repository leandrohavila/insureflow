import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { CustomersModule } from '../customers/customers.module';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';

@Module({
  imports: [ActivitiesModule, CustomersModule],
  controllers: [CrmController],
  providers: [CrmService],
})
export class CrmModule {}
