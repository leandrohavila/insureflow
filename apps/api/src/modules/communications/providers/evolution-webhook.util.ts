import type { CommunicationStatus } from '../../../common/constants/interest-categories';
import { jidToPhone } from './evolution-settings.util';

export type ParsedEvolutionWebhook =
  | {
      type: 'status';
      instanceName: string;
      messageId: string | null;
      remoteJid: string | null;
      from: string | null;
      status: CommunicationStatus;
    }
  | {
      type: 'inbound';
      instanceName: string;
      messageId: string | null;
      from: string;
      content: string;
      pushName?: string;
    }
  | {
      type: 'connection';
      instanceName: string;
      state: 'open' | 'close' | 'connecting';
    }
  | { type: 'ignored' };

const STATUS_RANK: Record<CommunicationStatus, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 0,
  replied: 4,
};

export function shouldAdvanceStatus(
  current: CommunicationStatus,
  next: CommunicationStatus,
) {
  if (current === 'failed' && next !== 'failed') return true;
  if (next === 'failed') return current === 'queued' || current === 'sent';
  if (current === 'replied') return false;
  return STATUS_RANK[next] > STATUS_RANK[current];
}

export function statusActivityKind(
  status: CommunicationStatus,
):
  | 'communication_sent'
  | 'communication_delivered'
  | 'communication_read'
  | 'communication_failed'
  | null {
  if (status === 'sent') return 'communication_sent';
  if (status === 'delivered') return 'communication_delivered';
  if (status === 'read') return 'communication_read';
  if (status === 'failed') return 'communication_failed';
  return null;
}

export function mapEvolutionAckToStatus(
  ack: unknown,
): CommunicationStatus | null {
  if (typeof ack === 'number') {
    if (ack <= 0) return 'failed';
    if (ack <= 2) return 'sent';
    if (ack === 3) return 'delivered';
    if (ack >= 4) return 'read';
  }
  const value = String(ack ?? '')
    .trim()
    .toUpperCase();
  if (!value) return null;
  if (['0', 'ERROR', 'FAILED'].includes(value)) return 'failed';
  if (
    ['1', '2', 'PENDING', 'SERVER_ACK', 'SERVER', 'SENT', 'DEVICE'].includes(
      value,
    )
  ) {
    return 'sent';
  }
  if (['3', 'DELIVERY_ACK', 'DELIVERED'].includes(value)) return 'delivered';
  if (['4', '5', 'READ', 'PLAYED', 'READ_ACK'].includes(value)) return 'read';
  return null;
}

export function parseEvolutionWebhook(body: unknown): ParsedEvolutionWebhook {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { type: 'ignored' };
  }
  const payload = body as Record<string, unknown>;
  const event = normalizeEvent(payload.event ?? payload.apikey);
  const instanceName = asString(
    payload.instance ??
      (payload.data && typeof payload.data === 'object'
        ? (payload.data as Record<string, unknown>).instance
        : ''),
  );
  const data = unwrapData(payload.data ?? payload);

  if (event.includes('CONNECTION')) {
    const state = mapConnectionState(
      asString(data.state ?? data.status ?? payload.state),
    );
    if (!state || !instanceName) return { type: 'ignored' };
    return { type: 'connection', instanceName, state };
  }

  if (event.includes('MESSAGES.UPDATE') || event.includes('SEND.MESSAGE')) {
    const status = mapEvolutionAckToStatus(
      data.status ?? data.ack ?? nestedStatus(data),
    );
    if (!status) return { type: 'ignored' };
    const messageId = extractMessageId(data);
    const remoteJid = extractRemoteJid(data);
    return {
      type: 'status',
      instanceName,
      messageId,
      remoteJid,
      from: remoteJid ? jidToPhone(remoteJid) : null,
      status,
    };
  }

  if (event.includes('MESSAGES.UPSERT') || event.includes('MESSAGES.SET')) {
    if (isFromMe(data)) {
      const status = mapEvolutionAckToStatus(data.status ?? data.ack) ?? 'sent';
      return {
        type: 'status',
        instanceName,
        messageId: extractMessageId(data),
        remoteJid: extractRemoteJid(data),
        from: extractRemoteJid(data)
          ? jidToPhone(extractRemoteJid(data) as string)
          : null,
        status,
      };
    }
    const content = extractMessageText(data);
    const remoteJid = extractRemoteJid(data);
    if (!content || !remoteJid) return { type: 'ignored' };
    return {
      type: 'inbound',
      instanceName,
      messageId: extractMessageId(data),
      from: jidToPhone(remoteJid),
      content,
      pushName: asString(data.pushName) || undefined,
    };
  }

  return { type: 'ignored' };
}

function normalizeEvent(value: unknown) {
  return asString(value).replace(/_/g, '.').toUpperCase();
}

function unwrapData(value: unknown): Record<string, unknown> {
  if (Array.isArray(value) && value[0] && typeof value[0] === 'object') {
    return value[0] as Record<string, unknown>;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.messages) && record.messages[0]) {
      return unwrapData(record.messages[0]);
    }
    return record;
  }
  return {};
}

function extractMessageId(data: Record<string, unknown>) {
  const key = asRecord(data.key);
  return (
    asString(data.keyId) ||
    asString(key?.id) ||
    asString(data.id) ||
    asString(data.messageId) ||
    null
  );
}

function extractRemoteJid(data: Record<string, unknown>) {
  const key = asRecord(data.key);
  return (
    asString(data.remoteJid) ||
    asString(key?.remoteJid) ||
    asString(data.from) ||
    null
  );
}

function isFromMe(data: Record<string, unknown>) {
  const key = asRecord(data.key);
  return Boolean(data.fromMe ?? key?.fromMe);
}

function extractMessageText(data: Record<string, unknown>) {
  const message = asRecord(data.message) ?? asRecord(data);
  if (!message) return '';
  return (
    asString(message.conversation) ||
    asString(asRecord(message.extendedTextMessage)?.text) ||
    asString(asRecord(message.imageMessage)?.caption) ||
    asString(asRecord(message.videoMessage)?.caption) ||
    asString(asRecord(message.buttonsResponseMessage)?.selectedDisplayText) ||
    asString(data.conversation) ||
    asString(data.body) ||
    asString(data.text)
  );
}

function nestedStatus(data: Record<string, unknown>) {
  const update = asRecord(data.update);
  return update?.status ?? data.status;
}

function mapConnectionState(
  value: string,
): 'open' | 'close' | 'connecting' | null {
  const normalized = value.toLowerCase();
  if (['open', 'connected'].includes(normalized)) return 'open';
  if (['close', 'closed', 'disconnected', 'refused'].includes(normalized)) {
    return 'close';
  }
  if (['connecting', 'qr', 'pair'].includes(normalized)) return 'connecting';
  return null;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
