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
import { CommissionRulesService } from '../src/modules/sales-performance/commission-rules.service';
import { CommissionsService } from '../src/modules/sales-performance/commissions.service';
import { PerformanceService } from '../src/modules/sales-performance/performance.service';
import {
  CommissionRulesController,
  CommissionsController,
  PerformanceController,
  SalesTargetsController,
} from '../src/modules/sales-performance/sales-performance.controller';
import { SalesTargetsService } from '../src/modules/sales-performance/sales-targets.service';

describe('Sales performance (e2e)', () => {
  let app: INestApplication<App>;
  const getDashboard = jest.fn();
  const getRanking = jest.fn();
  const listTargets = jest.fn();
  const listCommissions = jest.fn();
  const listRules = jest.fn();

  beforeEach(async () => {
    getDashboard.mockReset().mockResolvedValue({
      monthRevenue: 50000,
      targetAttainment: 80,
      wonDeals: 3,
    });
    getRanking.mockReset().mockResolvedValue([
      { id: 'u1', name: 'Ana', revenue: 50000, wonDeals: 3, conversionRate: 50 },
    ]);
    listTargets.mockReset().mockResolvedValue([]);
    listCommissions.mockReset().mockResolvedValue({ data: [], meta: { total: 0 } });
    listRules.mockReset().mockResolvedValue([]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        PerformanceController,
        SalesTargetsController,
        CommissionsController,
        CommissionRulesController,
      ],
      providers: [
        { provide: PerformanceService, useValue: { getDashboard, getRanking } },
        { provide: SalesTargetsService, useValue: { list: listTargets } },
        { provide: CommissionsService, useValue: { list: listCommissions } },
        { provide: CommissionRulesService, useValue: { list: listRules } },
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

  it('GET performance retorna indicadores', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/performance')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.monthRevenue).toBe(50000);
        expect(body.targetAttainment).toBe(80);
      });
  });

  it('GET performance/ranking retorna ranking', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/performance/ranking?groupBy=broker')
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body[0].name).toBe('Ana');
      });
  });

  it('GET sales-targets e commissions respeitam as rotas', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/sales-targets')
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .get('/api/v1/commissions')
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .get('/api/v1/commission-rules')
      .expect(HttpStatus.OK);
    expect(listTargets).toHaveBeenCalled();
    expect(listCommissions).toHaveBeenCalled();
    expect(listRules).toHaveBeenCalled();
  });
});
