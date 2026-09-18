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
import { CrmInsightsController } from '../src/modules/crm/crm-insights.controller';
import { ExecutiveDashboardService } from '../src/modules/crm/executive-dashboard.service';
import { PipelinesService } from '../src/modules/crm/pipelines.service';
import { SlaDashboardService } from '../src/modules/crm/sla-dashboard.service';

describe('Sales pipeline insights (e2e)', () => {
  let app: INestApplication<App>;
  const list = jest.fn();
  const getDashboard = jest.fn();
  const getSlaDashboard = jest.fn();

  beforeEach(async () => {
    list.mockReset();
    getDashboard.mockReset();
    getSlaDashboard.mockReset();
    list.mockResolvedValue([
      {
        id: 'pl-1',
        name: 'Pipeline Seguros',
        businessUnit: { type: 'INSURANCE' },
        stages: [{ slug: 'cotacao', maxDays: 3 }],
      },
    ]);
    getDashboard.mockResolvedValue({
      leads: 10,
      deals: 4,
      conversionRate: 20,
      revenue: 50000,
    });
    getSlaDashboard.mockResolvedValue({
      inSla: 8,
      warning: 2,
      overdue: 1,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CrmInsightsController],
      providers: [
        { provide: PipelinesService, useValue: { list } },
        { provide: ExecutiveDashboardService, useValue: { getDashboard } },
        { provide: SlaDashboardService, useValue: { getDashboard: getSlaDashboard } },
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
            permissions: ['crm:view'],
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
          permissions: ['crm:view'],
        };
        next();
      },
    );
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET crm/pipelines lista pipelines da unidade', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/crm/pipelines')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body[0].stages[0].slug).toBe('cotacao');
      });
  });

  it('GET crm/dashboard-executivo retorna indicadores', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/crm/dashboard-executivo')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.conversionRate).toBe(20);
        expect(body.revenue).toBe(50000);
      });
  });

  it('GET crm/dashboard-sla retorna indicadores de SLA', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/crm/dashboard-sla')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.warning).toBe(2);
        expect(body.overdue).toBe(1);
      });
  });
});
