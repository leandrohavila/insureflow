import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import {
  LEAD_REACTIVATION_JOB,
  LEAD_REACTIVATION_QUEUE,
} from './lead-reactivation.constants';
import { LeadReactivationService } from './lead-reactivation.service';

@Processor(LEAD_REACTIVATION_QUEUE, { concurrency: 1 })
export class LeadReactivationProcessor extends WorkerHost {
  private readonly log = new Logger(LeadReactivationProcessor.name);

  constructor(private readonly reactivation: LeadReactivationService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.log.log(`Iniciando ${LEAD_REACTIVATION_JOB} (${job.id})`);
    const result = await this.reactivation.runDailyJob();
    this.log.log(
      `Job concluído — tenants=${result.tenants} processados=${result.processed} enviados=${result.sent} falhas=${result.failed}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error): void {
    this.log.error(`LeadReactivationJob ${job?.id} failed: ${err.message}`);
  }

  @OnWorkerEvent('error')
  onWorkerError(err: Error): void {
    const msg = err.message ?? String(err);
    if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Redis/i.test(msg)) {
      this.log.error(`[redis] LeadReactivation worker sem Redis: ${msg}`);
    } else {
      this.log.error(`[queue] LeadReactivation worker error: ${msg}`);
    }
  }
}
