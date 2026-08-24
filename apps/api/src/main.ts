import {
  BadRequestException,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { performance } from 'node:perf_hooks';

import { getMetadataStorage } from 'class-validator';

import {
  isDealContractDebug,
  isRuntimeAudit,
} from './common/utils/deal-contract-debug';
import {
  formatRuntimeBootLine,
  getRuntimeInfo,
} from './common/utils/runtime-info.util';
import { CreateDealDto, UpdateDealDto } from './modules/crm/dto/deal.dto';
import { CreateLeadDto } from './modules/leads/dto/lead.dto';
import { AppModule } from './app.module';

function bug010TraceIdFromRequest(req: Request) {
  const header = req.header('idempotency-key');
  return header?.trim() || 'lead-create';
}

function bug010DurationMs(startedAt: number) {
  return Number((performance.now() - startedAt).toFixed(2));
}

class Bug010ValidationPipe extends ValidationPipe {
  override async transform(
    value: unknown,
    metadata: Parameters<ValidationPipe['transform']>[1],
  ) {
    if (metadata.metatype !== CreateLeadDto) {
      return super.transform(value, metadata);
    }

    const startedAt = performance.now();
    try {
      const result = await super.transform(value, metadata);
      Logger.log(
        `[BUG010][api] ValidationPipe CreateLeadDto durationMs=${bug010DurationMs(
          startedAt,
        )}`,
        'Bug010Performance',
      );
      return result;
    } catch (error) {
      Logger.warn(
        `[BUG010][api] ValidationPipe CreateLeadDto failed durationMs=${bug010DurationMs(
          startedAt,
        )}`,
        'Bug010Performance',
      );
      throw error;
    }
  }
}

function bug010LeadCreateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.method !== 'POST') {
    next();
    return;
  }

  const startedAt = performance.now();
  const traceId = bug010TraceIdFromRequest(req);
  Logger.log(
    `[BUG010][api] request recebida traceId=${traceId}`,
    'Bug010Performance',
  );
  res.once('finish', () => {
    Logger.log(
      `[BUG010][api] resposta enviada traceId=${traceId} status=${res.statusCode} totalApiMs=${bug010DurationMs(
        startedAt,
      )}`,
      'Bug010Performance',
    );
  });
  next();
}

function logDtoRuntimeContract() {
  if (!isRuntimeAudit()) return;
  const storage = getMetadataStorage();
  const createProps = storage.getTargetValidationMetadatas(
    CreateDealDto,
    '',
    false,
    false,
  );
  const updateProps = storage.getTargetValidationMetadatas(
    UpdateDealDto,
    '',
    false,
    false,
  );
  const pick = (props: { propertyName: string }[]) =>
    [...new Set(props.map((p) => p.propertyName))].sort();
  Logger.log(
    `[runtime-audit] CreateDealDto props=${pick(createProps).join(',')}`,
    'Bootstrap',
  );
  Logger.log(
    `[runtime-audit] UpdateDealDto props=${pick(updateProps).join(',')}`,
    'Bootstrap',
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use('/api/v1/leads', bug010LeadCreateMiddleware);

  app.useGlobalPipes(
    new Bug010ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        if (
          isDealContractDebug() ||
          isRuntimeAudit() ||
          process.env.BUG003_DEBUG === 'true'
        ) {
          logger.warn(
            `[runtime-audit][validation] ${JSON.stringify(errors, null, 2)}`,
          );
        }
        return new BadRequestException(errors);
      },
    }),
  );

  const corsOrigins = config
    .get<string>('CORS_ORIGIN')
    ?.split(',')
    .map((s) => s.trim()) ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3002',
    ];
  app.enableCors({ origin: corsOrigins, credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('InsureFlow API')
    .setDescription(
      'Backend enterprise: multi-tenant, JWT, RBAC, auditoria e filas (BullMQ).',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addApiKey(
      { type: 'apiKey', name: 'X-Tenant-Slug', in: 'header' },
      'tenant-slug',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  logDtoRuntimeContract();

  const port = config.get<string>('PORT', '4000');
  const runtime = getRuntimeInfo(port);

  const corsList = corsOrigins.join(', ');
  logger.log(`[bootstrap] CORS origins: ${corsList}`);
  logger.log(formatRuntimeBootLine(runtime));

  await app.listen(port, '0.0.0.0');
  logger.log(`HTTP + Swagger http://localhost:${port}/docs`);
  logger.log(`GET http://localhost:${port}/api/v1/health/runtime`);
  if (isRuntimeAudit()) {
    logger.log(
      `[runtime-audit] listening pid=${process.pid} port=${port}`,
      'Bootstrap',
    );
  }
}

void bootstrap();
