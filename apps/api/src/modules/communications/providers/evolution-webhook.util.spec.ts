import {
  isEvolutionConfigured,
  mergeEvolutionSettings,
  parseEvolutionSettings,
  phoneMatchCandidates,
  publicEvolutionSettings,
  toEvolutionNumber,
} from './evolution-settings.util';
import {
  mapEvolutionAckToStatus,
  parseEvolutionWebhook,
  shouldAdvanceStatus,
} from './evolution-webhook.util';

describe('evolution-settings', () => {
  it('normaliza telefone brasileiro para a Evolution', () => {
    expect(toEvolutionNumber('(11) 99999-8888')).toBe('5511999998888');
    expect(toEvolutionNumber('+55 11 99999-8888')).toBe('5511999998888');
  });

  it('mascara API key e exige trio URL/key/instância', () => {
    const settings = mergeEvolutionSettings(
      {},
      {
        instanceName: 'insureflow',
        apiUrl: 'https://evo.example.com/',
        apiKey: 'secret-key-1234',
      },
    );
    expect(settings.apiUrl).toBe('https://evo.example.com');
    expect(settings.webhookToken).toHaveLength(48);
    expect(isEvolutionConfigured(settings)).toBe(true);
    expect(publicEvolutionSettings(settings).apiKeyMasked).toBe('••••1234');
  });

  it('gera candidatos de telefone para matching inbound', () => {
    const candidates = phoneMatchCandidates('5511999998888');
    expect(candidates).toEqual(
      expect.arrayContaining(['5511999998888', '11999998888', '+5511999998888']),
    );
  });
});

describe('evolution-webhook', () => {
  it('mapeia ACK Evolution para sent/delivered/read/failed', () => {
    expect(mapEvolutionAckToStatus(2)).toBe('sent');
    expect(mapEvolutionAckToStatus('DELIVERY_ACK')).toBe('delivered');
    expect(mapEvolutionAckToStatus('READ')).toBe('read');
    expect(mapEvolutionAckToStatus('ERROR')).toBe('failed');
  });

  it('não regride status já avançado', () => {
    expect(shouldAdvanceStatus('delivered', 'sent')).toBe(false);
    expect(shouldAdvanceStatus('sent', 'delivered')).toBe(true);
    expect(shouldAdvanceStatus('replied', 'read')).toBe(false);
    expect(shouldAdvanceStatus('queued', 'failed')).toBe(true);
  });

  it('interpreta mensagem recebida', () => {
    const parsed = parseEvolutionWebhook({
      event: 'MESSAGES_UPSERT',
      instance: 'insureflow',
      data: {
        key: {
          remoteJid: '5511999998888@s.whatsapp.net',
          fromMe: false,
          id: 'MSG1',
        },
        message: { conversation: 'Ainda tenho interesse' },
        pushName: 'Marina',
      },
    });
    expect(parsed).toMatchObject({
      type: 'inbound',
      instanceName: 'insureflow',
      from: '5511999998888',
      content: 'Ainda tenho interesse',
      messageId: 'MSG1',
    });
  });

  it('interpreta entrega e conexão', () => {
    expect(
      parseEvolutionWebhook({
        event: 'messages.update',
        instance: 'insureflow',
        data: { keyId: 'MSG1', status: 'DELIVERY_ACK' },
      }),
    ).toMatchObject({ type: 'status', status: 'delivered', messageId: 'MSG1' });

    expect(
      parseEvolutionWebhook({
        event: 'connection.update',
        instance: 'insureflow',
        data: { state: 'open' },
      }),
    ).toMatchObject({ type: 'connection', state: 'open' });
  });
});
