import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

import { LEAD_REACTIVATION_JOB, LEAD_REACTIVATION_QUEUE } from '../lead-reactivation/lead-reactivation.constants';
import {
  COMMERCIAL_AUTOMATION_JOB,
  COMMERCIAL_AUTOMATION_QUEUE,
} from './commercial-automation.constants';

@Injectable()
export class CommercialAutomationScheduler implements OnModuleInit {
  private readonly log = new Logger(CommercialAutomationScheduler.name);

  constructor(
    @InjectQueue(COMMERCIAL_AUTOMATION_QUEUE)
    private readonly queue: Queue,
    @InjectQueue(LEAD_REACTIVATION_QUEUE)
    private readonly reactivationQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const existing = await this.queue.getRepeatableJobs();
      for (const job of existing) {
        if (job.name === COMMERCIAL_AUTOMATION_JOB) {
          await this.queue.removeRepeatableByKey(job.key);
        }
      }

      const legacy = await this.reactivationQueue.getRepeatableJobs();
      for (const job of legacy) {
        if (job.name === LEAD_REACTIVATION_JOB) {
          await this.reactivationQueue.removeRepeatableByKey(job.key);
        }
      }

      await this.queue.add(
        COMMERCIAL_AUTOMATION_JOB,
        {},
        {
          repeat: {
            pattern: '0 7 * * *',
            tz: 'America/Sao_Paulo',
          },
          jobId: 'commercial-automation-daily',
        },
      );
      this.log.log(
        'CommercialAutomationJob agendado diariamente às 07:00 (America/Sao_Paulo)',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error(
        `Não foi possível agendar CommercialAutomationJob: ${message}`,
      );
    }
  }
}
