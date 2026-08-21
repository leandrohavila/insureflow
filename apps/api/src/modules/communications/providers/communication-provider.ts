import type {
  CommunicationProviderKind,
  CommunicationPurpose,
  CommunicationStatus,
  MessageChannel,
} from '../../../common/constants/interest-categories';

export type SendCommunicationInput = {
  channel: MessageChannel;
  to: string;
  content: string;
  purpose: CommunicationPurpose;
  tenantId: string;
  metadata?: Record<string, unknown>;
};

export type SendCommunicationResult = {
  provider: CommunicationProviderKind;
  status: Extract<CommunicationStatus, 'sent' | 'failed' | 'queued'>;
  externalId: string | null;
  messageId?: string | null;
  errorMessage?: string;
};

export const EVOLUTION_CONNECTION_STATUSES = [
  'disconnected',
  'connecting',
  'connected',
  'qr',
] as const;
export type EvolutionConnectionStatus =
  (typeof EVOLUTION_CONNECTION_STATUSES)[number];

export type ProviderHealthResult = {
  ok: boolean;
  status: EvolutionConnectionStatus;
  message?: string;
};

export type ProviderQrCodeResult = {
  base64: string | null;
  pairingCode?: string | null;
  errorMessage?: string;
};

export interface CommunicationProvider {
  readonly kind: CommunicationProviderKind;
  send(input: SendCommunicationInput): Promise<SendCommunicationResult>;
  validateConnection(tenantId: string): Promise<ProviderHealthResult>;
  generateQrCode(tenantId: string): Promise<ProviderQrCodeResult>;
  disconnect(tenantId: string): Promise<ProviderHealthResult>;
  healthCheck(tenantId: string): Promise<ProviderHealthResult>;
}

export const COMMUNICATION_PROVIDER_REGISTRY = Symbol(
  'COMMUNICATION_PROVIDER_REGISTRY',
);
