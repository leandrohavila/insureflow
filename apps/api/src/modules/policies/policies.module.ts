import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { CustomersModule } from '../customers/customers.module';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';

@Module({
  imports: [CustomersModule, ActivitiesModule],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
