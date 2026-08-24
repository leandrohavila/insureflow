import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { CreatePublicPropertyLeadDto } from './dto/property-lead.dto';
import { PropertyLeadsService } from './property-leads.service';

@ApiTags('public-leads')
@Public()
@Controller('public/leads')
export class PublicPropertyLeadsController {
  constructor(private readonly leads: PropertyLeadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Capturar interesse em imóvel publicado' })
  create(@Body() dto: CreatePublicPropertyLeadDto) {
    return this.leads.createPublic(dto);
  }
}
