import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { BusinessUnitsModule } from '../business-units/business-units.module';
import { CrossSellModule } from '../cross-sell/cross-sell.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { Customer360Service } from './customer-360.service';
import { CustomerActivationService } from './customer-activation.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Dashboard360Service } from './dashboard-360.service';

@Module({
  imports: [
    ActivitiesModule,
    BusinessUnitsModule,
    CrossSellModule,
    OpportunitiesModule,
  ],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    CustomerActivationService,
    Customer360Service,
    Dashboard360Service,
  ],
  exports: [CustomersService, CustomerActivationService],
})
export class CustomersModule {}
