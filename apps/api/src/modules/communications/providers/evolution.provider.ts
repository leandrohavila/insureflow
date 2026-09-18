import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import type { CommunicationProviderKind } from '../../../common/constants/interest-categories';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  CommunicationProvider,
  ProviderHealthResult,
  ProviderQrCodeResult,
  SendCommunicationInput,
  SendCommunicationResult,
} from './communication-provider';
import {
  EvolutionHttpClient,
  EvolutionHttpError,
} from './evolution-http.client';
import {
  buildEvolutionWebhookUrl,
  isEvolutionConfigured,
  parseEvolutionSettings,
  toEvolutionNumber,
  type EvolutionInstanceSettings,
} from './evolution-settings.util';

@Injectable()
export class EvolutionCommunicationProvider implements CommunicationProvider {
  readonly kind: CommunicationProviderKind = 'EVOLUTION';
  private readonly logger = new Logger(EvolutionCommunicationProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: EvolutionHttpClient,
    @Optional() private readonly config?: ConfigService,
  ) {}

  async send(input: SendCommunicationInput): Promise<SendCommunicationResult> {
    if (input.channel !== 'WHATSAPP') {
      return {
        provider: this.kind,
        status: 'failed',
        externalId: null,
        errorMessage: 'Evolution API envia apenas WhatsApp',
      };
    }
    if (!input.to.trim()) {
      return {
        provider: this.kind,
        status: 'failed',
        externalId: null,
        errorMessage: 'Destinatário ausente',
      };
    }

    const settings = await this.loadSettings(input.tenantId);
    if (!isEvolutionConfigured(settings)) {
      return {
        provider: this.kind,
        status: 'failed',
        externalId: null,
        errorMessage:
          'Evolution API ainda não está configurada. Informe URL, API Key e instância.',
      };
    }

    try {
      const number = toEvolutionNumber(input.to);
      const payload = await this.http.request({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        method: 'POST',
        path: `/message/sendText/${encodeURIComponent(settings.instanceName)}`,
        body: {
          number,
          text: input.content,
        },
      });
      const messageId = extractSendMessageId(payload);
      return {
        provider: this.kind,
        status: 'sent',
        externalId: messageId,
        messageId,
      };
    } catch (error) {
      return {
        provider: this.kind,
        status: 'failed',
        externalId: null,
        errorMessage: error instanceof Error ? error.message : 'Falha Evolution',
      };
    }
  }

  async validateConnection(tenantId: string): Promise<ProviderHealthResult> {
    return this.healthCheck(tenantId);
  }

  async healthCheck(tenantId: string): Promise<ProviderHealthResult> {
    const settings = await this.loadSettings(tenantId);
    if (!isEvolutionConfigured(settings)) {
      return {
        ok: false,
        status: 'disconnected',
        message: 'Instância Evolution não configurada',
      };
    }
    try {
      const payload = await this.http.request({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        path: `/instance/connectionState/${encodeURIComponent(settings.instanceName)}`,
      });
      const state = readConnectionState(payload);
      const status =
        state === 'open'
          ? 'connected'
          : state === 'connecting'
            ? 'connecting'
            : 'disconnected';
      await this.patchSettings(tenantId, {
        connectionStatus: status,
        lastSyncedAt: new Date().toISOString(),
      });
      return {
        ok: status === 'connected',
        status,
        message: state,
      };
    } catch (error) {
      return {
        ok: false,
        status: 'disconnected',
        message: error instanceof Error ? error.message : 'Falha na Evolution',
      };
    }
  }

  async generateQrCode(tenantId: string): Promise<ProviderQrCodeResult> {
    const settings = await this.loadSettings(tenantId);
    if (!isEvolutionConfigured(settings)) {
      return {
        base64: null,
        errorMessage: 'Configure URL, API Key e nome da instância antes do QR.',
      };
    }
    try {
      const payload = await this.http.request({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        path: `/instance/connect/${encodeURIComponent(settings.instanceName)}`,
      });
      const base64 = readQrBase64(payload);
      await this.patchSettings(tenantId, {
        connectionStatus: base64 ? 'qr' : 'connecting',
        lastSyncedAt: new Date().toISOString(),
      });
      return {
        base64,
        pairingCode: readPairingCode(payload),
      };
    } catch (error) {
      return {
        base64: null,
        errorMessage:
          error instanceof Error ? error.message : 'Falha ao gerar QR Code',
      };
    }
  }

  async disconnect(tenantId: string): Promise<ProviderHealthResult> {
    const settings = await this.loadSettings(tenantId);
    if (!isEvolutionConfigured(settings)) {
      return { ok: true, status: 'disconnected', message: 'Já desconectada' };
    }
    try {
      await this.http.request({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        method: 'DELETE',
        path: `/instance/logout/${encodeURIComponent(settings.instanceName)}`,
      });
    } catch (error) {
      this.logger.warn(
        `Logout Evolution: ${error instanceof Error ? error.message : 'erro'}`,
      );
    }
    await this.patchSettings(tenantId, {
      connectionStatus: 'disconnected',
      lastSyncedAt: new Date().toISOString(),
    });
    return { ok: true, status: 'disconnected', message: 'Instância desconectada' };
  }

  async connect(tenantId: string): Promise<{
    health: ProviderHealthResult;
    qr: ProviderQrCodeResult;
  }> {
    const settings = await this.loadSettings(tenantId);
    if (!isEvolutionConfigured(settings)) {
      return {
        health: {
          ok: false,
          status: 'disconnected',
          message: 'Configure URL, API Key e nome da instância.',
        },
        qr: { base64: null, errorMessage: 'Configuração incompleta' },
      };
    }

    await this.ensureInstance(settings);
    await this.registerWebhook(settings);
    const health = await this.healthCheck(tenantId);
    if (health.ok) {
      return { health, qr: { base64: null } };
    }
    const qr = await this.generateQrCode(tenantId);
    return {
      health: {
        ok: false,
        status: qr.base64 ? 'qr' : 'connecting',
        message: qr.errorMessage ?? 'Aguardando leitura do QR Code',
      },
      qr,
    };
  }

  async reconnect(tenantId: string) {
    await this.disconnect(tenantId);
    return this.connect(tenantId);
  }

  async findTenantIdByInstance(instanceName: string, token?: string | null) {
    const name = instanceName.trim();
    if (!name) return null;
    const configs = await this.prisma.communicationProviderConfig.findMany({
      where: { kind: 'EVOLUTION' },
    });
    for (const config of configs) {
      const settings = parseEvolutionSettings(config.settings);
      if (settings.instanceName !== name) continue;
      if (token && settings.webhookToken && token !== settings.webhookToken) {
        continue;
      }
      return { tenantId: config.tenantId, settings };
    }
    return null;
  }

  async applyConnectionState(
    tenantId: string,
    state: 'open' | 'close' | 'connecting',
  ) {
    await this.patchSettings(tenantId, {
      connectionStatus:
        state === 'open'
          ? 'connected'
          : state === 'connecting'
            ? 'connecting'
            : 'disconnected',
      lastSyncedAt: new Date().toISOString(),
    });
  }

  private async ensureInstance(settings: EvolutionInstanceSettings) {
    try {
      await this.http.request({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        path: `/instance/connectionState/${encodeURIComponent(settings.instanceName)}`,
      });
    } catch (error) {
      const missing =
        error instanceof EvolutionHttpError &&
        (error.statusCode === 404 || error.statusCode === 400);
      if (!missing) throw error;
      await this.http.request({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        method: 'POST',
        path: '/instance/create',
        body: {
          instanceName: settings.instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        },
      });
    }
  }

  private async registerWebhook(settings: EvolutionInstanceSettings) {
    const publicUrl =
      this.config?.get<string>('API_PUBLIC_URL') ||
      this.config?.get<string>('API_URL') ||
      `http://localhost:${this.config?.get<string>('PORT') ?? '4000'}`;
    const url = buildEvolutionWebhookUrl(publicUrl, settings.webhookToken);
    try {
      await this.http.request({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        method: 'POST',
        path: `/webhook/set/${encodeURIComponent(settings.instanceName)}`,
        body: {
          webhook: {
            url,
            byEvents: false,
            base64: false,
            events: [
              'QRCODE_UPDATED',
              'CONNECTION_UPDATE',
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'SEND_MESSAGE',
            ],
          },
        },
      });
    } catch (error) {
      this.logger.warn(
        `Webhook Evolution: ${error instanceof Error ? error.message : 'erro'}`,
      );
    }
  }

  private async loadSettings(tenantId: string) {
    const config = await this.prisma.communicationProviderConfig.findUnique({
      where: { tenantId },
    });
    return parseEvolutionSettings(config?.settings);
  }

  private async patchSettings(
    tenantId: string,
    patch: Partial<EvolutionInstanceSettings>,
  ) {
    const current = await this.prisma.communicationProviderConfig.findUnique({
      where: { tenantId },
    });
    if (!current) return;
    const settings = {
      ...parseEvolutionSettings(current.settings),
      ...patch,
    };
    await this.prisma.communicationProviderConfig.update({
      where: { tenantId },
      data: {
        settings: settings as Prisma.InputJsonValue,
      },
    });
  }
}

function extractSendMessageId(payload: Record<string, unknown>) {
  const key = asRecord(payload.key);
  const nested = asRecord(payload.data);
  const nestedKey = nested ? asRecord(nested.key) : null;
  return (
    asString(key?.id) ||
    asString(nestedKey?.id) ||
    asString(payload.messageId) ||
    asString(payload.id) ||
    null
  );
}

function readConnectionState(payload: Record<string, unknown>) {
  const instance = asRecord(payload.instance);
  return asString(
    payload.state ?? instance?.state ?? payload.status ?? instance?.status,
  ).toLowerCase();
}

function readQrBase64(payload: Record<string, unknown>) {
  const qr = asRecord(payload.qrcode) ?? asRecord(payload.qr);
  const raw =
    asString(payload.base64) ||
    asString(qr?.base64) ||
    asString(payload.code) ||
    asString(qr?.code);
  if (!raw) return null;
  return raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
}

function readPairingCode(payload: Record<string, unknown>) {
  const qr = asRecord(payload.qrcode);
  return asString(payload.pairingCode) || asString(qr?.pairingCode) || null;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
