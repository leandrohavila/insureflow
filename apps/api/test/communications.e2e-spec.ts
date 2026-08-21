import 'reflect-metadata';

import {
  HttpStatus,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { CommunicationsController } from '../src/modules/communications/communications.controller';
import { CommunicationsService } from '../src/modules/communications/communications.service';

describe('Communications contract (e2e)', () => {
  let app: INestApplication<App>;
  const sendManual = jest.fn();
  const getDashboard = jest.fn();
  const recordReply = jest.fn();
  const handleEvolutionWebhook = jest.fn();
  const findOne = jest.fn();
  const connectEvolution = jest.fn();

  beforeEach(async () => {
    sendManual.mockReset();
    getDashboard.mockReset();
    recordReply.mockReset();
    handleEvolutionWebhook.mockReset();
    findOne.mockReset();
    connectEvolution.mockReset();
    sendManual.mockResolvedValue({
      id: 'log-1',
      provider: 'EVOLUTION',
      status: 'sent',
      purpose: 'REACTIVATION',
      messageId: '3EB0ABC',
    });
    getDashboard.mockResolvedValue({
      provider: 'EVOLUTION',
      sent: 3,
      delivered: 2,
      read: 1,
      failed: 1,
      replied: 1,
    });
    recordReply.mockResolvedValue({ id: 'log-1', status: 'replied' });
    handleEvolutionWebhook.mockResolvedValue({
      ok: true,
      type: 'status',
      status: 'delivered',
    });
    findOne.mockRejectedValue({ status: 404 });
    connectEvolution.mockResolvedValue({
      ok: false,
      status: 'qr',
      qr: { base64: 'data:image/png;base64,abc' },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CommunicationsController],
      providers: [
        {
          provide: CommunicationsService,
          useValue: {
            findAll: jest.fn(),
            getDashboard,
            getProviderConfig: jest.fn(),
            updateProviderConfig: jest.fn(),
            sendManual,
            recordReply,
            handleEvolutionWebhook,
            findOne,
            connectEvolution,
            reconnectEvolution: jest.fn(),
            disconnectEvolution: jest.fn(),
            generateEvolutionQr: jest.fn(),
            evolutionHealth: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            sub: 'user-admin',
            tenantId: 'tenant-1',
            roles: ['admin'],
            permissions: ['automation:view', 'automation:manage', 'settings:manage'],
          };
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(
      (
        req: { user?: Record<string, unknown> },
        _res: unknown,
        next: () => void,
      ) => {
        req.user = {
          sub: 'user-admin',
          tenantId: 'tenant-1',
          roles: ['admin'],
          permissions: ['automation:view', 'automation:manage', 'settings:manage'],
        };
        next();
      },
    );
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('envia comunicação via provider', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/communications/send')
      .send({
        channel: 'WHATSAPP',
        purpose: 'REACTIVATION',
        leadId: 'lead-1',
        content: 'Olá Marina',
      })
      .expect(HttpStatus.CREATED);

    expect(sendManual).toHaveBeenCalled();
    expect(response.body).toMatchObject({
      provider: 'EVOLUTION',
      status: 'sent',
    });
  });

  it('expõe dashboard de comunicação', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/communications/dashboard')
      .expect(HttpStatus.OK);

    expect(getDashboard).toHaveBeenCalled();
    expect(response.body).toMatchObject({
      provider: 'EVOLUTION',
      sent: 3,
      delivered: 2,
    });
  });

  it('registra resposta inbound', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/communications/inbound')
      .send({ content: 'Ainda tenho interesse', from: '+5511999999999' })
      .expect(HttpStatus.CREATED);

    expect(recordReply).toHaveBeenCalled();
  });

  it('aceita webhook Evolution sem JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/communications/webhooks/evolution?token=abc')
      .send({
        event: 'messages.update',
        instance: 'insureflow',
        data: { keyId: 'MSG1', status: 'DELIVERY_ACK' },
      })
      .expect(HttpStatus.OK);

    expect(handleEvolutionWebhook).toHaveBeenCalled();
    expect(response.body).toMatchObject({ ok: true, type: 'status' });
  });

  it('conecta instância Evolution', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/communications/evolution/connect')
      .expect(HttpStatus.CREATED);

    expect(connectEvolution).toHaveBeenCalled();
    expect(response.body.qr.base64).toContain('data:image/png');
  });
});
