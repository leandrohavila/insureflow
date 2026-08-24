import { Controller, Get, Header, NotFoundException, Param, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import {
  mimeFromFilename,
  openLocalPropertyFile,
  resolveLocalPropertyFile,
} from './property-storage';

@ApiTags('property-files')
@Public()
@Controller('files/properties')
export class PropertyFilesController {
  @Get(':propertyId/:filename')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @Header('Cache-Control', 'public, max-age=86400')
  @ApiOperation({ summary: 'Arquivo de imagem do imóvel (upload local)' })
  serve(
    @Param('propertyId') propertyId: string,
    @Param('filename') filename: string,
  ) {
    const absolute = resolveLocalPropertyFile(propertyId, filename);
    if (!absolute) throw new NotFoundException('Arquivo não encontrado');
    return new StreamableFile(openLocalPropertyFile(absolute), {
      type: mimeFromFilename(filename),
      disposition: `inline; filename="${filename}"`,
    });
  }
}
