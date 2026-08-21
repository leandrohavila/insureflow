import { CommunicationsService } from './communications.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ActivityEngineService } from '../activities/activity-engine.service';
import type { MessageTemplatesService } from '../message-templates/message-templates.service';
import { CommunicationProviderRegistry } from './providers/communication-provider.registry';
import { InternalCommunicationProvider } from './providers/internal.provider';

describe('CommunicationsService', () => {
  function createService() {
    const create = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({ id: 'log-1', ...data }),
    );
    const findUnique = jest.fn().mockResolvedValue({
      tenantId: 'tenant-1',
      kind: 'INTERNAL',
      enabled: true,
    });
    const publish = jest.fn().mockResolvedValue({ id: 'act-1', created: true });

    const prisma = {
      communicationProviderConfig: {
        findUnique,
        create: jest.fn(),
        update: jest.fn(),
      },
      communicationLog: {
        create,
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
      lead: {
        update: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue({ dealId: null }),
      },
      $transaction: jest.fn(),
    } as unknown as PrismaService;

    const service = new CommunicationsService(
      prisma,
      new CommunicationProviderRegistry(new InternalCommunicationProvider()),
      { publish } as unknown as ActivityEngineService,
      { findActiveForChannel: jest.fn() } as unknown as MessageTemplatesService,
    );

    return { service, create, publish };
  }

  it('persiste CommunicationLog e activity ao enviar', async () => {
    const { service, create, publish } = createService();
    const log = await service.dispatch({
      tenantId: 'tenant-1',
      channel: 'WHATSAPP',
      purpose: 'REACTIVATION',
      content: 'Olá Marina',
      to: '+5511999999999',
      leadId: 'lead-1',
      performedById: 'user-1',
    });

    expect(log.status).toBe('sent');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: 'INTERNAL',
          purpose: 'REACTIVATION',
          status: 'sent',
          leadId: 'lead-1',
        }),
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'communication_sent',
        leadId: 'lead-1',
      }),
    );
  });

  it('falha sem destinatário e registra activity de falha', async () => {
    const { service, create, publish } = createService();
    const log = await service.dispatch({
      tenantId: 'tenant-1',
      channel: 'WHATSAPP',
      purpose: 'RENEWAL',
      content: 'Olá',
      to: '  ',
      customerId: 'cust-1',
      performedById: 'user-1',
    });

    expect(log.status).toBe('failed');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'failed',
          errorMessage: expect.stringMatching(/Destinatário/),
        }),
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'communication_failed',
      }),
    );
  });

  it('falha quando o provider do tenant está desabilitado', async () => {
    const { service } = createService();
    const prisma = (service as unknown as { prisma: PrismaService }).prisma as unknown as {
      communicationProviderConfig: { findUnique: jest.Mock };
    };
    prisma.communicationProviderConfig.findUnique.mockResolvedValue({
      tenantId: 'tenant-1',
      kind: 'INTERNAL',
      enabled: false,
    });

    const log = await service.dispatch({
      tenantId: 'tenant-1',
      channel: 'WHATSAPP',
      purpose: 'CROSS_SELL',
      content: 'Olá',
      to: '+5511999999999',
      performedById: 'user-1',
    });
    expect(log.status).toBe('failed');
    expect(log.errorMessage).toMatch(/desabilitado/);
  });

  it('falha com stub Evolution sem chamar fornecedor real', async () => {
    const { service } = createService();
    const prisma = (service as unknown as { prisma: PrismaService }).prisma as unknown as {
      communicationProviderConfig: { findUnique: jest.Mock };
    };
    prisma.communicationProviderConfig.findUnique.mockResolvedValue({
      tenantId: 'tenant-1',
      kind: 'EVOLUTION',
      enabled: true,
    });

    const log = await service.dispatch({
      tenantId: 'tenant-1',
      channel: 'WHATSAPP',
      purpose: 'REACTIVATION',
      content: 'Olá',
      to: '+5511999999999',
      performedById: 'user-1',
    });
    expect(log.status).toBe('failed');
    expect(log.provider).toBe('EVOLUTION');
    expect(log.errorMessage).toMatch(/não está configurado/);
  });

  it('atualiza status delivered via webhook Evolution', async () => {
    const { service, publish } = createService();
    const prisma = (service as unknown as { prisma: PrismaService }).prisma as unknown as {
      communicationLog: { findFirst: jest.Mock; update: jest.Mock };
    };
    prisma.communicationLog.findFirst.mockResolvedValue({
      id: 'log-1',
      tenantId: 'tenant-1',
      status: 'sent',
      leadId: 'lead-1',
      customerId: null,
      performedById: 'user-1',
      purpose: 'REACTIVATION',
      provider: 'EVOLUTION',
      channel: 'WHATSAPP',
      content: 'Olá',
    });
    prisma.communicationLog.update.mockResolvedValue({
      id: 'log-1',
      status: 'delivered',
    });

    const evolution = {
      findTenantIdByInstance: jest.fn().mockResolvedValue({
        tenantId: 'tenant-1',
        settings: {},
      }),
      applyConnectionState: jest.fn(),
    };
    (service as unknown as { evolution: typeof evolution }).evolution = evolution;

    const result = await service.handleEvolutionWebhook(
      {
        event: 'messages.update',
        instance: 'insureflow',
        data: { keyId: 'MSG1', status: 'DELIVERY_ACK' },
      },
      'token',
    );
    expect(result).toMatchObject({ ok: true, type: 'status', status: 'delivered' });
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'communication_delivered',
      }),
    );
  });

  it('registra resposta inbound no log original', async () => {
    const { service, publish } = createService();
    const prisma = (service as unknown as { prisma: PrismaService }).prisma as unknown as {
      communicationLog: { findFirst: jest.Mock; update: jest.Mock };
    };
    prisma.communicationLog.findFirst.mockResolvedValue({
      id: 'log-1',
      tenantId: 'tenant-1',
      purpose: 'REACTIVATION',
      provider: 'INTERNAL',
      channel: 'WHATSAPP',
      leadId: 'lead-1',
      customerId: null,
      performedById: 'user-1',
      direction: 'OUTBOUND',
    });
    prisma.communicationLog.update.mockResolvedValue({
      id: 'log-1',
      status: 'replied',
    });

    const updated = await service.recordReply('tenant-1', {
      content: 'Ainda tenho interesse',
      from: '+5511999999999',
    });
    expect(updated.status).toBe('replied');
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        operationalEventKind: 'communication_replied',
        leadId: 'lead-1',
      }),
    );
  });

  it('findOne retorna 404 quando o ACL de Business Unit nega', async () => {
    const { service } = createService();
    const buAccess = {
      assertCommunicationVisible: jest.fn().mockRejectedValue(
        Object.assign(new Error('Comunicação não encontrada'), { status: 404 }),
      ),
    };
    (service as unknown as { buAccess: typeof buAccess }).buAccess = buAccess;

    await expect(
      service.findOne('tenant-1', 'log-hidden', {
        userId: 'sales-1',
        tenantId: 'tenant-1',
        roles: ['sales'],
        permissions: [],
        currentBusinessUnitId: 'bu-corretora',
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
