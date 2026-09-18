import type {
  CommunicationProviderKind,
  CommunicationPurpose,
  CommunicationStatus,
  MessageChannel,
} from "@/lib/business-units/constants"

export type EvolutionConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "qr"

export type EvolutionPublicSettings = {
  instanceName: string
  apiUrl: string
  apiKeyMasked: string
  hasApiKey: boolean
  connectionStatus: EvolutionConnectionStatus
  lastSyncedAt: string | null
}

export type CommunicationLog = {
  id: string
  tenantId: string
  provider: CommunicationProviderKind
  channel: MessageChannel
  direction: "OUTBOUND" | "INBOUND"
  purpose: CommunicationPurpose
  status: CommunicationStatus
  leadId?: string | null
  customerId?: string | null
  templateId?: string | null
  to: string
  content: string
  externalId?: string | null
  messageId?: string | null
  errorMessage?: string | null
  replyContent?: string | null
  sentAt?: string | null
  deliveredAt?: string | null
  readAt?: string | null
  repliedAt?: string | null
  createdAt: string
  lead?: { id: string; name: string } | null
  customer?: { id: string; name: string } | null
  template?: { id: string; name: string; kind: string } | null
  performedBy?: { id: string; name: string } | null
}

export type CommunicationListFilters = {
  purpose?: CommunicationPurpose
  status?: CommunicationStatus
  channel?: MessageChannel
  provider?: CommunicationProviderKind
  userId?: string
  businessUnitId?: string
  from?: string
  to?: string
  page?: number
}

export type CommunicationDashboardFilters = {
  purpose?: CommunicationPurpose
  userId?: string
  businessUnitId?: string
  from?: string
  to?: string
}

export type CommunicationDashboard = {
  provider: CommunicationProviderKind
  providerEnabled: boolean
  adapters: { kind: CommunicationProviderKind; ready: boolean }[]
  evolution?: EvolutionPublicSettings
  sent: number
  delivered: number
  read: number
  failed: number
  replied: number
  outbound: number
  replyRate: number
  failureRate: number
  byPurpose: { purpose: CommunicationPurpose; count: number }[]
  brokers: { id: string; name: string }[]
}

export type CommunicationProviderConfig = {
  id: string
  tenantId: string
  kind: CommunicationProviderKind
  enabled: boolean
  adapters: { kind: CommunicationProviderKind; ready: boolean }[]
  evolution: EvolutionPublicSettings
}

export type SendCommunicationInput = {
  channel: MessageChannel
  purpose: CommunicationPurpose
  leadId?: string
  customerId?: string
  templateId?: string
  content?: string
}

export type RecordCommunicationReplyInput = {
  content: string
  externalId?: string
  from?: string
}

export type UpdateCommunicationProviderInput = {
  kind?: CommunicationProviderKind
  enabled?: boolean
  instanceName?: string
  apiUrl?: string
  apiKey?: string
}

export type EvolutionActionResult = {
  ok: boolean
  status: EvolutionConnectionStatus
  message?: string
  qr?: { base64: string | null; pairingCode?: string | null; errorMessage?: string }
  provider?: CommunicationProviderConfig
}

export type EvolutionQrResult = {
  base64: string | null
  pairingCode?: string | null
  errorMessage?: string
  provider?: CommunicationProviderConfig
}
