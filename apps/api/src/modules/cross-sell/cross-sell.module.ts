import { Module } from '@nestjs/common';

import { CommunicationsModule } from '../communications/communications.module';
import { MessageTemplatesModule } from '../message-templates/message-templates.module';
import { CrossSellController } from './cross-sell.controller';
import { CrossSellService } from './cross-sell.service';

@Module({
  imports: [CommunicationsModule, MessageTemplatesModule],
  controllers: [CrossSellController],
  providers: [CrossSellService],
  exports: [CrossSellService],
})
export class CrossSellModule {}
