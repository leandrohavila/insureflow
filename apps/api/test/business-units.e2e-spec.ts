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
import { BusinessUnitAccessService } from '../src/modules/access/business-unit-access.service';
import { BusinessUnitsController } from '../src/modules/business-units/business-units.controller';
import { BusinessUnitsService } from '../src/modules/business-units/business-units.service';

describe('Business units contract (e2e)', () => {
  let app: INestApplication<App>;
  const create = jest.fn();
  const getContext = jest.fn();
  const updateContext = jest.fn();

  beforeEach(async () => {
    create.mockReset();
    getContext.mockReset();
    updateContext.mockReset();
    create.mockResolvedValue({
      id: 'bu-1',
      tenantId: 'tenant-1',
      name: 'Corretora Ávila',
      slug: 'corretora-avila',
      type: 'INSURANCE',
      isActive: true,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BusinessUnitsController],
      providers: [
        {
          provide: BusinessUnitsService,
          useValue: {
            create,
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getContext,
            updateContext,
          },
        },
        {
          provide: BusinessUnitAccessService,
          useValue: {
            fromUser: (user: { sub: string; tenantId: string }) => ({
              userId: user.sub,
              tenantId: user.tenantId,
              roles: ['admin'],
              permissions: [],
            }),
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
            permissions: ['settings:manage', 'settings:view'],
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
          permissions: ['settings:manage', 'settings:view'],
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

  it('creates an insurance business unit', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/business-units')
      .send({ name: 'Corretora Ávila', type: 'INSURANCE' })
      .expect(HttpStatus.CREATED);

    expect(create).toHaveBeenCalled();
    expect(response.body).toMatchObject({
      slug: 'corretora-avila',
      type: 'INSURANCE',
    });
  });

  it('returns active business unit context', async () => {
    getContext.mockResolvedValue({
      currentBusinessUnitId: null,
      canViewAll: true,
      units: [{ id: 'bu-1', name: 'Corretora Ávila' }],
    });
    const response = await request(app.getHttpServer())
      .get('/api/v1/business-units/context')
      .expect(HttpStatus.OK);
    expect(getContext).toHaveBeenCalled();
    expect(response.body.canViewAll).toBe(true);
  });

  it('switches active business unit', async () => {
    updateContext.mockResolvedValue({
      currentBusinessUnitId: 'bu-1',
      accessToken: 'token',
    });
    const response = await request(app.getHttpServer())
      .patch('/api/v1/business-units/context')
      .send({ businessUnitId: 'bu-1' })
      .expect(HttpStatus.OK);
    expect(updateContext).toHaveBeenCalled();
    expect(response.body.currentBusinessUnitId).toBe('bu-1');
  });
});
