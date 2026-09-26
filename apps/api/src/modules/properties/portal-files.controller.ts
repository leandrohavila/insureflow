import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import {
  mimeFromFilename,
  openLocalPropertyFile,
  resolveLocalPortalFile,
} from './property-storage';

@ApiTags('portal-files')
@Public()
@Controller('files/portal')
export class PortalFilesController {
  @Get(':businessUnitId/:filename')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @Header('Cache-Control', 'public, max-age=86400')
  @ApiOperation({ summary: 'Arquivo de imagem do portal (upload local)' })
  async serve(
    @Param('businessUnitId') businessUnitId: string,
    @Param('filename') filename: string,
  ) {
    const absolute = await resolveLocalPortalFile(businessUnitId, filename);
    if (!absolute) throw new NotFoundException('Arquivo não encontrado');
    return new StreamableFile(openLocalPropertyFile(absolute), {
      type: mimeFromFilename(filename),
      disposition: `inline; filename="${filename}"`,
    });
  }
}
