import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { CommunicationsModule } from '../communications/communications.module';
import { MessageTemplatesModule } from '../message-templates/message-templates.module';
import { PolicyRenewalsController } from './policy-renewals.controller';
import { PolicyRenewalsService } from './policy-renewals.service';

@Module({
  imports: [ActivitiesModule, MessageTemplatesModule, CommunicationsModule],
  controllers: [PolicyRenewalsController],
  providers: [PolicyRenewalsService],
  exports: [PolicyRenewalsService],
})
export class PolicyRenewalsModule {}
