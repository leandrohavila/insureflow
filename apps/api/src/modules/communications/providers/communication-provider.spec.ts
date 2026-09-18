import { InternalCommunicationProvider } from './internal.provider';
import { UnconfiguredCommunicationProvider } from './unconfigured.provider';
import { CommunicationProviderRegistry } from './communication-provider.registry';

describe('Communication providers', () => {
  it('Internal envia sem chamar fornecedor externo', async () => {
    const provider = new InternalCommunicationProvider();
    const result = await provider.send({
      tenantId: 't1',
      channel: 'WHATSAPP',
      to: '+5511999999999',
      content: 'Olá',
      purpose: 'REACTIVATION',
    });

    expect(result.provider).toBe('INTERNAL');
    expect(result.status).toBe('sent');
    expect(result.externalId).toMatch(/^internal-/);
    expect(result.messageId).toMatch(/^internal-/);
  });

  it('Internal falha sem destinatário', async () => {
    const provider = new InternalCommunicationProvider();
    const result = await provider.send({
      tenantId: 't1',
      channel: 'WHATSAPP',
      to: '  ',
      content: 'Olá',
      purpose: 'REACTIVATION',
    });
    expect(result.status).toBe('failed');
  });

  it('Meta/Z-API/Twilio permanecem stubs até integração', async () => {
    for (const kind of ['META', 'ZAPI', 'TWILIO'] as const) {
      const provider = new UnconfiguredCommunicationProvider(kind);
      const result = await provider.send({
        tenantId: 't1',
        channel: 'WHATSAPP',
        to: '+5511999999999',
        content: 'Olá',
        purpose: 'RENEWAL',
      });
      expect(result.status).toBe('failed');
      expect(result.errorMessage).toContain(kind);
    }
  });

  it('registry devolve INTERNAL por padrão e marca Evolution pronta quando injetada', () => {
    const registry = new CommunicationProviderRegistry(
      new InternalCommunicationProvider(),
    );
    expect(registry.get('INTERNAL').kind).toBe('INTERNAL');
    expect(registry.get('EVOLUTION').kind).toBe('EVOLUTION');
    expect(registry.list().some((item) => item.kind === 'TWILIO' && !item.ready)).toBe(
      true,
    );
    expect(
      registry.list(true).find((item) => item.kind === 'EVOLUTION')?.ready,
    ).toBe(true);
  });
});
