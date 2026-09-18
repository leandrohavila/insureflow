import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class LeadReactivationScheduler implements OnModuleInit {
  private readonly log = new Logger(LeadReactivationScheduler.name);

  onModuleInit(): void {
    this.log.log(
      'LeadReactivationJob agora é disparado pelo CommercialAutomationJob às 07:00',
    );
  }
}
