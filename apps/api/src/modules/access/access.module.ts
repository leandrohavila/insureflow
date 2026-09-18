import { Global, Module } from '@nestjs/common';

import { BusinessUnitAccessService } from './business-unit-access.service';
import { OwnershipService } from './ownership.service';

@Global()
@Module({
  providers: [OwnershipService, BusinessUnitAccessService],
  exports: [OwnershipService, BusinessUnitAccessService],
})
export class AccessModule {}
