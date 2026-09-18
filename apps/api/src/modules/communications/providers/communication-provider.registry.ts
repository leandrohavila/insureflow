import { Injectable, Optional } from '@nestjs/common';

import type { CommunicationProviderKind } from '../../../common/constants/interest-categories';
import type { CommunicationProvider } from './communication-provider';
import { EvolutionCommunicationProvider } from './evolution.provider';
import { InternalCommunicationProvider } from './internal.provider';
import {
  createMetaProvider,
  createTwilioProvider,
  createZapiProvider,
  UnconfiguredCommunicationProvider,
} from './unconfigured.provider';

@Injectable()
export class CommunicationProviderRegistry {
  private readonly providers: Record<
    CommunicationProviderKind,
    CommunicationProvider
  >;

  constructor(
    internal: InternalCommunicationProvider,
    @Optional() evolution?: EvolutionCommunicationProvider,
  ) {
    this.providers = {
      INTERNAL: internal,
      EVOLUTION: evolution ?? new UnconfiguredCommunicationProvider('EVOLUTION'),
      META: createMetaProvider(),
      ZAPI: createZapiProvider(),
      TWILIO: createTwilioProvider(),
    };
  }

  get(kind: CommunicationProviderKind): CommunicationProvider {
    return this.providers[kind] ?? this.providers.INTERNAL;
  }

  list(evolutionReady = false) {
    return (Object.keys(this.providers) as CommunicationProviderKind[]).map(
      (kind) => ({
        kind,
        ready: kind === 'INTERNAL' || (kind === 'EVOLUTION' && evolutionReady),
      }),
    );
  }
}
