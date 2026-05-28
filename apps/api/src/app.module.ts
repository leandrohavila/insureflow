import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { buildRedisConnection } from './infrastructure/redis/redis-connection.util';
import { RedisInfraModule } from './infrastructure/redis/redis.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AccessModule } from './modules/access/access.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { CrmModule } from './modules/crm/crm.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HealthModule } from './modules/health/health.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { QuestionnairesModule } from './modules/questionnaires/questionnaires.module';
import { QueueModule } from './modules/queue/queue.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
        '.env',
        '../../.env.local',
        '../../.env',
        '../../.env.development',
        '../../.env.staging',
        '../../.env.production',
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        {
          ttl: cfg.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: cfg.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        connection: buildRedisConnection({
          redisUrl: cfg.get<string>('REDIS_URL'),
          host: cfg.get<string>('REDIS_HOST'),
          port: cfg.get<number>('REDIS_PORT'),
        }).connection,
      }),
    }),
    RedisInfraModule,
    PrismaModule,
    QueueModule,
    AccessModule,
    AuthModule,
    CrmModule,
    CustomersModule,
    LeadsModule,
    ActivitiesModule,
    PoliciesModule,
    QuestionnairesModule,
    UsersModule,
    TenantsModule,
    PermissionsModule,
    AuditLogsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
