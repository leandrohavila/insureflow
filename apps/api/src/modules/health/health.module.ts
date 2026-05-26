import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { RedisInfraModule } from '../../infrastructure/redis/redis.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, RedisInfraModule],
  controllers: [HealthController],
})
export class HealthModule {}
