import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuditJobPayload } from './queue.constants';
import { AUDIT_QUEUE } from './queue.constants';

@Processor(AUDIT_QUEUE, { concurrency: 5 })
export class AuditQueueProcessor extends WorkerHost {
  private readonly log = new Logger(AuditQueueProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<AuditJobPayload>): Promise<void> {
    const d = job.data;
    await this.prisma.auditLog.create({
      data: {
        tenantId: d.tenantId,
        userId: d.userId,
        action: d.action,
        resource: d.resource,
        resourceId: d.resourceId,
        metadata: d.metadata as Prisma.InputJsonValue | undefined,
        severity: d.severity,
        ipAddress: d.ipAddress,
        userAgent: d.userAgent,
        requestId: d.requestId,
      },
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error): void {
    this.log.error(`Audit job ${job?.id} failed: ${err.message}`);
  }

  @OnWorkerEvent('error')
  onWorkerError(err: Error): void {
    const msg = err.message ?? String(err);
    if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Redis/i.test(msg)) {
      this.log.error(
        `[redis] Worker BullMQ sem Redis — verifique REDIS_URL no Railway: ${msg}`,
      );
    } else {
      this.log.error(`[queue] Worker error: ${msg}`);
    }
  }
}
