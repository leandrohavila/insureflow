import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisBootstrapService } from '../../infrastructure/redis/redis-bootstrap.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisBootstrap: RedisBootstrapService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness' })
  health() {
    return {
      status: 'ok',
      service: 'insureflow-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('db')
  @ApiOperation({ summary: 'Database connectivity' })
  async db() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Public()
  @Get('redis')
  @ApiOperation({ summary: 'Redis connectivity (BullMQ)' })
  redis() {
    const s = this.redisBootstrap.getRuntimeStatus();
    if (!s.ok) {
      throw new ServiceUnavailableException({
        status: 'error',
        redis: 'disconnected',
        target: s.label,
        error: s.error,
        timestamp: s.checkedAt,
      });
    }
    return {
      status: 'ok',
      redis: 'connected',
      target: s.label,
      timestamp: s.checkedAt,
    };
  }
}
