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

  async send(
    _input: SendCommunicationInput,
  ): Promise<SendCommunicationResult> {
    return {
      provider: this.kind,
      status: 'failed',
      externalId: null,
      errorMessage: `${this.kind} ainda não está configurado. Use EVOLUTION ou INTERNAL.`,
    };
  }

  async validateConnection(): Promise<ProviderHealthResult> {
    return {
      ok: false,
      status: 'disconnected',
      message: `${this.kind} ainda não está configurado`,
    };
  }

  async generateQrCode(): Promise<ProviderQrCodeResult> {
    return {
      base64: null,
      errorMessage: `QR Code não disponível para ${this.kind}`,
    };
  }

  async disconnect(): Promise<ProviderHealthResult> {
    return {
      ok: true,
      status: 'disconnected',
      message: `${this.kind} não possui sessão`,
    };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    return this.validateConnection();
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
