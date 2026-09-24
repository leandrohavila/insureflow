import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { PublicPropertyQueryDto } from './dto/public-property.dto';
import { PortalConfigService } from './portal-config.service';

@ApiTags('public-portal')
@Public()
@Controller('public/portal')
export class PublicPortalController {
  constructor(private readonly portal: PortalConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Configuração e banners públicos do portal' })
  get(@Query() query: PublicPropertyQueryDto) {
    return this.portal.publicPortal(query);
  }
}
