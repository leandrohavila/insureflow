import { randomUUID } from 'node:crypto';

import type { CommunicationProviderKind } from '../../../common/constants/interest-categories';
import type {
  CommunicationProvider,
  ProviderHealthResult,
  ProviderQrCodeResult,
  SendCommunicationInput,
  SendCommunicationResult,
} from './communication-provider';

const INTERNAL_HEALTH: ProviderHealthResult = {
  ok: true,
  status: 'connected',
  message: 'Provider interno (sem WhatsApp real)',
};

export class InternalCommunicationProvider implements CommunicationProvider {
  readonly kind: CommunicationProviderKind = 'INTERNAL';

  async send(
    input: SendCommunicationInput,
  ): Promise<SendCommunicationResult> {
    if (!input.to.trim()) {
      return {
        provider: this.kind,
        status: 'failed',
        externalId: null,
        errorMessage: 'Destinatário ausente',
      };
    }

    const externalId = `internal-${randomUUID()}`;
    return {
      provider: this.kind,
      status: 'sent',
      externalId,
      messageId: externalId,
    };
  }

  async validateConnection(): Promise<ProviderHealthResult> {
    return INTERNAL_HEALTH;
  }

  async generateQrCode(): Promise<ProviderQrCodeResult> {
    return {
      base64: null,
      errorMessage: 'QR Code disponível apenas na Evolution API',
    };
  }

  async disconnect(): Promise<ProviderHealthResult> {
    return INTERNAL_HEALTH;
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    return INTERNAL_HEALTH;
  }
}
