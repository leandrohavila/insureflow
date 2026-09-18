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
import { CrmController } from '../src/modules/crm/crm.controller';
import { CrmService } from '../src/modules/crm/crm.service';
import { Customer360Service } from '../src/modules/customers/customer-360.service';
import { CustomersController } from '../src/modules/customers/customers.controller';
import { CustomersService } from '../src/modules/customers/customers.service';
import { Dashboard360Service } from '../src/modules/customers/dashboard-360.service';
import { LeadSharesService } from '../src/modules/leads/lead-shares.service';
import { LeadsController } from '../src/modules/leads/leads.controller';
import { LeadsService } from '../src/modules/leads/leads.service';

describe('Business unit detail ACL (e2e)', () => {
  let app: INestApplication<App>;
  const findLead = jest.fn();
  const findCustomer = jest.fn();
  const findDeal = jest.fn();

  beforeEach(async () => {
    findLead.mockReset();
    findCustomer.mockReset();
    findDeal.mockReset();
    findLead.mockImplementation((_tenant: string, id: string) => {
      if (id === 'lead-corretora') return { id, name: 'Lead Corretora' };
      throw new NotFoundException('Lead não encontrado');
    });
    findCustomer.mockImplementation((_tenant: string, id: string) => {
      if (id === 'customer-corretora') return { id, name: 'Cliente Corretora' };
      throw new NotFoundException('Cliente não encontrado');
    });
    findDeal.mockImplementation((_tenant: string, id: string) => {
      if (id === 'deal-corretora') return { id, title: 'Deal Corretora' };
      throw new NotFoundException('Negócio não encontrado');
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController, CustomersController, CrmController],
      providers: [
        {
          provide: LeadsService,
          useValue: {
            findLeads: jest.fn(),
            findLead,
            findLeadContext: findLead,
            findDuplicates: jest.fn(),
          },
        },
        { provide: LeadSharesService, useValue: {} },
        {
          provide: CustomersService,
          useValue: { findCustomers: jest.fn(), findCustomer },
        },
        {
          provide: Customer360Service,
          useValue: { get360: jest.fn(), generate: jest.fn() },
        },
        {
          provide: Dashboard360Service,
          useValue: { getDashboard: jest.fn() },
        },
        { provide: CrmService, useValue: { findDeals: jest.fn(), findDeal } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            sub: 'user-sales',
            tenantId: 'tenant-1',
            roles: ['sales'],
            permissions: ['leads:view', 'clients:view', 'crm:view'],
            currentBusinessUnitId: null,
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
          sub: 'user-sales',
          tenantId: 'tenant-1',
          roles: ['sales'],
          permissions: ['leads:view', 'clients:view', 'crm:view'],
          currentBusinessUnitId: null,
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

  it('GET lead da Corretora retorna 200', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/leads/lead-corretora')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.id).toBe('lead-corretora');
      });
  });

  it('GET lead da Imobiliária retorna 404 (não 403)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/leads/lead-imoveis')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('GET customer da Imobiliária retorna 404', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/customers/customer-imoveis')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('GET deal da Imobiliária retorna 404', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/crm/deals/deal-imoveis')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('GET registro inexistente retorna 404', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/leads/missing')
      .expect(HttpStatus.NOT_FOUND);
  });
});
