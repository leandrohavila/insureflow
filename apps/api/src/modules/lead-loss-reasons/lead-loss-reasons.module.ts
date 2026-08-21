import { Module } from '@nestjs/common';

import { BusinessUnitsModule } from '../business-units/business-units.module';
import { LeadLossReasonsController } from './lead-loss-reasons.controller';
import { LeadLossReasonsService } from './lead-loss-reasons.service';

@Module({
  imports: [BusinessUnitsModule],
  controllers: [LeadLossReasonsController],
  providers: [LeadLossReasonsService],
  exports: [LeadLossReasonsService],
})
export class LeadLossReasonsModule {}
