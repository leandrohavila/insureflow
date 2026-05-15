import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuditQueueProcessor } from './audit-queue.processor';
import { AUDIT_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: AUDIT_QUEUE,
    }),
  ],
  providers: [AuditQueueProcessor],
  exports: [BullModule],
})
export class QueueModule {}
