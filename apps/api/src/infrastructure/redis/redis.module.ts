import { Global, Module } from '@nestjs/common';

import { RedisBootstrapService } from './redis-bootstrap.service';

@Global()
@Module({
  providers: [RedisBootstrapService],
  exports: [RedisBootstrapService],
})
export class RedisInfraModule {}
