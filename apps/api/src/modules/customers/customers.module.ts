import { Module } from '@nestjs/common';

import { CustomerActivationService } from './customer-activation.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, CustomerActivationService],
  exports: [CustomersService, CustomerActivationService],
})
export class CustomersModule {}
