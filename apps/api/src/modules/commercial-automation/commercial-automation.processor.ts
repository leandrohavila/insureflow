import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import {
  COMMERCIAL_AUTOMATION_JOB,
  COMMERCIAL_AUTOMATION_QUEUE,
} from './commercial-automation.constants';
import { CommercialAutomationService } from './commercial-automation.service';

@Processor(COMMERCIAL_AUTOMATION_QUEUE, { concurrency: 1 })
export class CommercialAutomationProcessor extends WorkerHost {
  private readonly log = new Logger(CommercialAutomationProcessor.name);

  constructor(private readonly automation: CommercialAutomationService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.log.log(`Iniciando ${COMMERCIAL_AUTOMATION_JOB} (${job.id})`);
    const result = await this.automation.runDailyJob();
    this.log.log(
      `Job concluído — reativações=${result.reactivation.processed} follow-ups=${result.followUps.dueAlerts} renovações=${result.renewals.tasksCreated}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error): void {
    this.log.error(
      `CommercialAutomationJob ${job?.id} failed: ${err.message}`,
    );
  }

  @OnWorkerEvent('error')
  onWorkerError(err: Error): void {
    const msg = err.message ?? String(err);
    if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Redis/i.test(msg)) {
      this.log.error(`[redis] CommercialAutomation worker sem Redis: ${msg}`);
    } else {
      this.log.error(`[queue] CommercialAutomation worker error: ${msg}`);
    }
  }
}
