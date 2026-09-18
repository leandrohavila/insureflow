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
import { LeadLossReasonsController } from '../src/modules/lead-loss-reasons/lead-loss-reasons.controller';
import { LeadLossReasonsService } from '../src/modules/lead-loss-reasons/lead-loss-reasons.service';

describe('Lead loss reasons contract (e2e)', () => {
  let app: INestApplication<App>;
  const create = jest.fn();

  beforeEach(async () => {
    create.mockReset();
    create.mockResolvedValue({
      id: 'reason-1',
      tenantId: 'tenant-1',
      name: 'Sem orçamento',
      isActive: true,
      reactivationEnabled: true,
      reactivationDays: 45,
      maxAttempts: 2,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LeadLossReasonsController],
      providers: [
        {
          provide: LeadLossReasonsService,
          useValue: {
            create,
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
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
            permissions: ['settings:manage', 'settings:view', 'crm:view'],
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
          permissions: ['settings:manage', 'settings:view', 'crm:view'],
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

  it('creates a configurable loss reason', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/lead-loss-reasons')
      .send({
        name: 'Sem orçamento',
        reactivationDays: 45,
        maxAttempts: 2,
      })
      .expect(HttpStatus.CREATED);

    expect(create).toHaveBeenCalled();
    expect(response.body).toMatchObject({
      name: 'Sem orçamento',
      reactivationDays: 45,
    });
  });
});
