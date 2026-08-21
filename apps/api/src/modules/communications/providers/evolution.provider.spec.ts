import { EvolutionCommunicationProvider } from './evolution.provider';
import type { EvolutionHttpClient } from './evolution-http.client';
import type { PrismaService } from '../../../infrastructure/prisma/prisma.service';

describe('EvolutionCommunicationProvider', () => {
  const settings = {
    instanceName: 'insureflow',
    apiUrl: 'https://evo.example.com',
    apiKey: 'key-1',
    connectionStatus: 'connected',
    lastSyncedAt: null,
    webhookToken: 'token',
  };

  function createProvider(request = jest.fn()) {
    const prisma = {
      communicationProviderConfig: {
        findUnique: jest.fn().mockResolvedValue({
          tenantId: 't1',
          kind: 'EVOLUTION',
          settings,
        }),
        update: jest.fn(),
      },
    } as unknown as PrismaService;
    const http = { request } as unknown as EvolutionHttpClient;
    return {
      provider: new EvolutionCommunicationProvider(prisma, http),
      request,
      prisma,
    };
  }

  it('envia texto e persiste messageId da Evolution', async () => {
    const request = jest.fn().mockResolvedValue({
      key: { id: '3EB0ABC' },
    });
    const { provider } = createProvider(request);
    const result = await provider.send({
      tenantId: 't1',
      channel: 'WHATSAPP',
      to: '11988887777',
      content: 'Olá',
      purpose: 'REACTIVATION',
    });
    expect(result.status).toBe('sent');
    expect(result.provider).toBe('EVOLUTION');
    expect(result.messageId).toBe('3EB0ABC');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/message/sendText/insureflow',
        body: { number: '5511988887777', text: 'Olá' },
      }),
    );
  });

  it('falha sem configuração', async () => {
    const prisma = {
      communicationProviderConfig: {
        findUnique: jest.fn().mockResolvedValue({ settings: {} }),
      },
    } as unknown as PrismaService;
    const provider = new EvolutionCommunicationProvider(prisma, {
      request: jest.fn(),
    } as unknown as EvolutionHttpClient);
    const result = await provider.send({
      tenantId: 't1',
      channel: 'WHATSAPP',
      to: '11988887777',
      content: 'Olá',
      purpose: 'MANUAL',
    });
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toMatch(/não está configurada/);
  });

  it('healthCheck mapeia state open para connected', async () => {
    const request = jest.fn().mockResolvedValue({ instance: { state: 'open' } });
    const { provider } = createProvider(request);
    const health = await provider.healthCheck('t1');
    expect(health).toMatchObject({ ok: true, status: 'connected' });
  });
});
