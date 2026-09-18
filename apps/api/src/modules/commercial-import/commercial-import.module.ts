import { Module } from '@nestjs/common';

import { CommercialImportController } from './commercial-import.controller';
import { CommercialImportService } from './commercial-import.service';

@Module({
  controllers: [CommercialImportController],
  providers: [CommercialImportService],
})
export class CommercialImportModule {}
