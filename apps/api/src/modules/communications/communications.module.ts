import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { MessageTemplatesModule } from '../message-templates/message-templates.module';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { CommunicationProviderRegistry } from './providers/communication-provider.registry';
import { EvolutionHttpClient } from './providers/evolution-http.client';
import { EvolutionCommunicationProvider } from './providers/evolution.provider';
import { InternalCommunicationProvider } from './providers/internal.provider';

@Module({
  imports: [ActivitiesModule, MessageTemplatesModule],
  controllers: [CommunicationsController],
  providers: [
    InternalCommunicationProvider,
    EvolutionHttpClient,
    EvolutionCommunicationProvider,
    CommunicationProviderRegistry,
    CommunicationsService,
  ],
  exports: [CommunicationsService, CommunicationProviderRegistry],
})
export class CommunicationsModule {}
