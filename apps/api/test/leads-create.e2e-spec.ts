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
import { LeadsController } from '../src/modules/leads/leads.controller';
import { LeadSharesService } from '../src/modules/leads/lead-shares.service';
import { LeadsService } from '../src/modules/leads/leads.service';

describe('Lead create contract (e2e)', () => {
  let app: INestApplication<App>;
  const createLead = jest.fn();

  beforeEach(async () => {
    createLead.mockReset();
    createLead.mockResolvedValue({
      id: 'lead-new-1',
      tenantId: 'tenant-1',
      name: 'Marina Costa',
      email: null,
      phone: null,
      company: null,
      source: 'whatsapp',
      documentType: null,
      document: null,
      status: 'new',
      notes: null,
      assignedTo: 'Ana Costa',
      ownerUserId: 'user-partner',
      ownerTeamId: 'team-1',
      owner: {
        id: 'user-partner',
        name: 'Ana Costa',
        initials: 'AC',
      },
      lastContactAt: '2026-07-22T20:00:00.000Z',
      lastInteractionAt: '2026-07-22T20:00:00.000Z',
      dealId: null,
      createdAt: '2026-07-22T20:00:00.000Z',
      updatedAt: '2026-07-22T20:00:00.000Z',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        { provide: LeadsService, useValue: { createLead } },
        { provide: LeadSharesService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            sub: 'user-owner',
            tenantId: 'tenant-1',
            roles: ['comercial'],
            permissions: ['leads:manage', 'leads:view'],
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
          sub: 'user-owner',
          tenantId: 'tenant-1',
          roles: ['comercial'],
          permissions: ['leads:manage', 'leads:view'],
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
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/leads accepts LeadDialog payload without status (201)', async () => {
    const payload = {
      name: 'Marina Costa',
      source: 'whatsapp',
      assignedTo: 'Ana Costa',
    };

    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .send(payload)
      .expect(HttpStatus.CREATED)
      .expect(({ body }) => {
        expect(body.status).toBe('new');
        expect(body.id).toBe('lead-new-1');
      });

    expect(createLead).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining(payload),
      expect.objectContaining({ userId: 'user-owner' }),
    );
  });

  it('POST /api/v1/leads rejects invalid status (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .send({ name: 'Lead', status: 'all' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(createLead).not.toHaveBeenCalled();
  });

  it('POST /api/v1/leads accepts empty optional strings from legacy clients', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .send({
        name: 'Lead Legado',
        email: '',
        phone: '',
        status: '',
        assignedTo: 'Ana Costa',
      })
      .expect(HttpStatus.CREATED);

    expect(createLead).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        name: 'Lead Legado',
        assignedTo: 'Ana Costa',
      }),
      expect.any(Object),
    );

    const dto = createLead.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(dto.email).toBeUndefined();
    expect(dto.phone).toBeUndefined();
    expect(dto.status).toBeUndefined();
  });
});
