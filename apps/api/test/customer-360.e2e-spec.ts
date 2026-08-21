import 'reflect-metadata';

import {
  HttpStatus,
  INestApplication,
  NotFoundException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { Customer360Service } from '../src/modules/customers/customer-360.service';
import { CustomersController } from '../src/modules/customers/customers.controller';
import { CustomersService } from '../src/modules/customers/customers.service';
import { Dashboard360Service } from '../src/modules/customers/dashboard-360.service';
import { OpportunitiesController } from '../src/modules/opportunities/opportunities.controller';
import { OpportunitiesService } from '../src/modules/opportunities/opportunities.service';

describe('Customer 360 contract (e2e)', () => {
  let app: INestApplication<App>;
  const get360 = jest.fn();
  const generate = jest.fn();
  const getDashboard = jest.fn();
  const findAll = jest.fn();
  const findOne = jest.fn();

  beforeEach(async () => {
    get360.mockReset();
    generate.mockReset();
    getDashboard.mockReset();
    findAll.mockReset();
    findOne.mockReset();
    get360.mockResolvedValue({
      customer: { id: 'cust-1', name: 'Maria', phones: [], emails: [] },
      timeline: [],
      leads: [],
      deals: [],
      policies: [],
      properties: [],
      communications: [],
      followUps: [],
      renewals: [],
      crossSell: [],
      opportunities: [],
    });
    generate.mockResolvedValue({ created: 1, suggestions: [] });
    getDashboard.mockResolvedValue({
      activeCustomers: 8,
      inactiveCustomers: 2,
      reactivatedCustomers: 1,
      predictedRevenue: 10000,
      renewalRevenue: 2000,
      crossSellRevenue: 500,
      openOpportunities: 3,
      conversionRate: 12.5,
      brokers: [],
    });
    findAll.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    findOne.mockImplementation((_tenant: string, id: string) => {
      if (id === 'opp-corretora') return { id, type: 'AUTO_INSURANCE' };
      throw new NotFoundException('Oportunidade não encontrada');
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController, OpportunitiesController],
      providers: [
        {
          provide: CustomersService,
          useValue: { findCustomers: jest.fn(), findCustomer: jest.fn() },
        },
        { provide: Customer360Service, useValue: { get360, generate } },
        { provide: Dashboard360Service, useValue: { getDashboard } },
        {
          provide: OpportunitiesService,
          useValue: {
            findAll,
            findOne,
            create: jest.fn(),
            update: jest.fn(),
            generateForTenant: jest.fn(),
            generateForCustomer: jest.fn(),
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
            permissions: ['crm:view', 'crm:manage', 'clients:view'],
          };
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
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
          permissions: ['crm:view', 'crm:manage', 'clients:view'],
        };
        next();
      },
    );
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

  it('GET customers/:id/360 retorna a visão unificada', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/customers/cust-1/360')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.customer.id).toBe('cust-1');
        expect(body.timeline).toEqual([]);
      });
    expect(get360).toHaveBeenCalledWith(
      'tenant-1',
      'cust-1',
      expect.objectContaining({ tenantId: 'tenant-1' }),
    );
  });

  it('GET customers/dashboard-360 retorna indicadores', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/customers/dashboard-360')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.activeCustomers).toBe(8);
        expect(body.openOpportunities).toBe(3);
      });
  });

  it('GET opportunities lista no tenant', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/opportunities')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.data).toEqual([]);
      });
  });

  it('GET opportunity de outra unidade retorna 404', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/opportunities/opp-imoveis')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('POST customers/:id/360/generate dispara o motor', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/customers/cust-1/360/generate')
      .expect(HttpStatus.CREATED)
      .expect(({ body }) => {
        expect(body.created).toBe(1);
      });
  });
});
