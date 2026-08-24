import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import {
  PublicPropertyQueryDto,
  PublicPropertySearchQueryDto,
} from './dto/public-property.dto';
import { PublicPropertiesService } from './public-properties.service';

@ApiTags('public-properties')
@Public()
@Controller('public/properties')
export class PublicPropertiesController {
  constructor(private readonly catalog: PublicPropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar imóveis publicados' })
  list(@Query() query: PublicPropertyQueryDto) {
    return this.catalog.list(query);
  }

  @Get('highlights')
  @ApiOperation({ summary: 'Imóveis em destaque publicados' })
  highlights(@Query() query: PublicPropertyQueryDto) {
    return this.catalog.highlights(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar imóveis publicados' })
  search(@Query() query: PublicPropertySearchQueryDto) {
    return this.catalog.search(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalhe de imóvel publicado' })
  findBySlug(
    @Param('slug') slug: string,
    @Query() query: PublicPropertyQueryDto,
  ) {
    return this.catalog.findBySlug(slug, query);
  }
}
