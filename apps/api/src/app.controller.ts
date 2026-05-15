import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from './common/decorators/public.decorator';
import { AppService } from './app.service';

@ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Root (documentação em /docs)' })
  getHello(): Record<string, string> {
    return {
      name: 'InsureFlow API',
      docs: '/docs',
      health: '/api/v1/health',
    };
  }
}
