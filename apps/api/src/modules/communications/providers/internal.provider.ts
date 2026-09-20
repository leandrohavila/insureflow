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

  send(input: SendCommunicationInput): Promise<SendCommunicationResult> {
    if (!input.to.trim()) {
      return Promise.resolve({
        provider: this.kind,
        status: 'failed',
        externalId: null,
        errorMessage: 'Destinatário ausente',
      });
    }

    const externalId = `internal-${randomUUID()}`;
    return Promise.resolve({
      provider: this.kind,
      status: 'sent',
      externalId,
      messageId: externalId,
    });
  }

  validateConnection(tenantId: string): Promise<ProviderHealthResult> {
    void tenantId;
    return Promise.resolve(INTERNAL_HEALTH);
  }

  generateQrCode(tenantId: string): Promise<ProviderQrCodeResult> {
    void tenantId;
    return Promise.resolve({
      base64: null,
      errorMessage: 'QR Code disponível apenas na Evolution API',
    });
  }

  disconnect(tenantId: string): Promise<ProviderHealthResult> {
    void tenantId;
    return Promise.resolve(INTERNAL_HEALTH);
  }

  healthCheck(tenantId: string): Promise<ProviderHealthResult> {
    return this.validateConnection(tenantId);
  }
}
