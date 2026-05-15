import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuditJobPayload } from '../queue/queue.constants';
import { AUDIT_QUEUE } from '../queue/queue.constants';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectQueue(AUDIT_QUEUE) private readonly auditQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  enqueue(payload: AuditJobPayload): void {
    void this.auditQueue.add('persist', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });
  }

  async findByTenant(
    tenantId: string,
    opts: { skip?: number; take?: number } = {},
  ) {
    const take = Math.min(opts.take ?? 50, 200);
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take,
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }
}
