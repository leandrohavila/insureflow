import { randomBytes } from 'node:crypto';

import type { EvolutionConnectionStatus } from './communication-provider';

export type EvolutionInstanceSettings = {
  instanceName: string;
  apiUrl: string;
  apiKey: string;
  connectionStatus: EvolutionConnectionStatus;
  lastSyncedAt: string | null;
  webhookToken: string;
};

const EMPTY: EvolutionInstanceSettings = {
  instanceName: '',
  apiUrl: '',
  apiKey: '',
  connectionStatus: 'disconnected',
  lastSyncedAt: null,
  webhookToken: '',
};

export function parseEvolutionSettings(
  raw: unknown,
): EvolutionInstanceSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY };
  }
  const value = raw as Record<string, unknown>;
  const status = value.connectionStatus;
  return {
    instanceName: asString(value.instanceName),
    apiUrl: asString(value.apiUrl).replace(/\/+$/, ''),
    apiKey: asString(value.apiKey),
    connectionStatus: isConnectionStatus(status) ? status : 'disconnected',
    lastSyncedAt: asString(value.lastSyncedAt) || null,
    webhookToken: asString(value.webhookToken),
  };
}

export function mergeEvolutionSettings(
  current: unknown,
  patch: Partial<EvolutionInstanceSettings>,
): EvolutionInstanceSettings {
  const base = parseEvolutionSettings(current);
  const next: EvolutionInstanceSettings = {
    instanceName: patch.instanceName ?? base.instanceName,
    apiUrl: (patch.apiUrl ?? base.apiUrl).replace(/\/+$/, ''),
    apiKey: patch.apiKey ?? base.apiKey,
    connectionStatus: patch.connectionStatus ?? base.connectionStatus,
    lastSyncedAt:
      patch.lastSyncedAt === undefined ? base.lastSyncedAt : patch.lastSyncedAt,
    webhookToken: patch.webhookToken ?? base.webhookToken,
  };
  if (!next.webhookToken) {
    next.webhookToken = randomBytes(24).toString('hex');
  }
  return next;
}

export function isEvolutionConfigured(settings: EvolutionInstanceSettings) {
  return Boolean(
    settings.instanceName.trim() &&
      settings.apiUrl.trim() &&
      settings.apiKey.trim(),
  );
}

export function maskSecret(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 4) return '••••';
  return `••••${trimmed.slice(-4)}`;
}

export function publicEvolutionSettings(settings: EvolutionInstanceSettings) {
  return {
    instanceName: settings.instanceName,
    apiUrl: settings.apiUrl,
    apiKeyMasked: maskSecret(settings.apiKey),
    hasApiKey: Boolean(settings.apiKey.trim()),
    connectionStatus: settings.connectionStatus,
    lastSyncedAt: settings.lastSyncedAt,
  };
}

export function whatsappDigits(input: string) {
  return input.replace(/\D/g, '').replace(/^00/, '');
}

export function jidToPhone(jid: string) {
  return whatsappDigits((jid.split('@')[0] ?? '').split(':')[0] ?? '');
}

export function toEvolutionNumber(phone: string) {
  let digits = whatsappDigits(phone);
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return digits;
}

export function phoneMatchCandidates(phone: string) {
  const digits = whatsappDigits(phone);
  const national = digits.startsWith('55') && digits.length > 11
    ? digits.slice(2)
    : digits;
  return [...new Set([phone.trim(), digits, national, `+${digits}`, `55${national}`])].filter(
    (item) => item.length >= 8,
  );
}

export function buildEvolutionWebhookUrl(publicApiUrl: string, token: string) {
  const base = publicApiUrl.replace(/\/+$/, '');
  const prefix = base.endsWith('/api/v1') ? base : `${base}/api/v1`;
  return `${prefix}/communications/webhooks/evolution?token=${encodeURIComponent(token)}`;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isConnectionStatus(
  value: unknown,
): value is EvolutionConnectionStatus {
  return (
    value === 'disconnected' ||
    value === 'connecting' ||
    value === 'connected' ||
    value === 'qr'
  );
}
