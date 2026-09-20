import type { CommunicationProviderKind } from '../../../common/constants/interest-categories';
import type {
  CommunicationProvider,
  ProviderHealthResult,
  ProviderQrCodeResult,
  SendCommunicationInput,
  SendCommunicationResult,
} from './communication-provider';

/** Stub pronto para Meta / Z-API / Twilio — sem HTTP nesta entrega. */
export class UnconfiguredCommunicationProvider implements CommunicationProvider {
  constructor(readonly kind: CommunicationProviderKind) {}

  send(input: SendCommunicationInput): Promise<SendCommunicationResult> {
    void input;
    return Promise.resolve({
      provider: this.kind,
      status: 'failed',
      externalId: null,
      errorMessage: `${this.kind} ainda não está configurado. Use EVOLUTION ou INTERNAL.`,
    });
  }

  validateConnection(tenantId: string): Promise<ProviderHealthResult> {
    void tenantId;
    return Promise.resolve({
      ok: false,
      status: 'disconnected',
      message: `${this.kind} ainda não está configurado`,
    });
  }

  generateQrCode(tenantId: string): Promise<ProviderQrCodeResult> {
    void tenantId;
    return Promise.resolve({
      base64: null,
      errorMessage: `QR Code não disponível para ${this.kind}`,
    });
  }

  disconnect(tenantId: string): Promise<ProviderHealthResult> {
    void tenantId;
    return Promise.resolve({
      ok: true,
      status: 'disconnected',
      message: `${this.kind} não possui sessão`,
    });
  }

  healthCheck(tenantId: string): Promise<ProviderHealthResult> {
    return this.validateConnection(tenantId);
  }
}

export function createMetaProvider() {
  return new UnconfiguredCommunicationProvider('META');
}

export function createZapiProvider() {
  return new UnconfiguredCommunicationProvider('ZAPI');
}

export function createTwilioProvider() {
  return new UnconfiguredCommunicationProvider('TWILIO');
}
