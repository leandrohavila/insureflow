import {
  BadRequestException,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { getMetadataStorage } from 'class-validator';

import {
  isDealContractDebug,
  isRuntimeAudit,
} from './common/utils/deal-contract-debug';
import { CreateDealDto, UpdateDealDto } from './modules/crm/dto/deal.dto';
import { AppModule } from './app.module';

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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        if (isDealContractDebug() || isRuntimeAudit()) {
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
    .map((s) => s.trim()) ?? ['http://localhost:3000', 'http://127.0.0.1:3000'];
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

  const corsList = corsOrigins.join(', ');
  logger.log(`[bootstrap] CORS origins: ${corsList}`);
  logger.log(`[bootstrap] NODE_ENV=${config.get('NODE_ENV', 'development')}`);

  const port = config.get<string>('PORT', '4000');
  await app.listen(port, '0.0.0.0');
  logger.log(`HTTP + Swagger http://localhost:${port}/docs`);
  if (isRuntimeAudit()) {
    logger.log(
      `[runtime-audit] listening pid=${process.pid} port=${port}`,
      'Bootstrap',
    );
  }
}

void bootstrap();
