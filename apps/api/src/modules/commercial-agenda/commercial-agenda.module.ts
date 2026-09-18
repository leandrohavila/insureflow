import { Module } from '@nestjs/common';

import { CommercialAgendaController } from './commercial-agenda.controller';
import { CommercialAgendaService } from './commercial-agenda.service';

@Module({
  controllers: [CommercialAgendaController],
  providers: [CommercialAgendaService],
})
export class CommercialAgendaModule {}
