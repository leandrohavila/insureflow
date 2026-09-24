import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  CreatePortalBannerDto,
  UpdatePortalBannerDto,
  UpsertPortalConfigDto,
} from './dto/portal-config.dto';
import { PortalConfigService } from './portal-config.service';
import { MAX_IMAGE_BYTES, type MemoryUpload } from './property-storage';

class BusinessUnitQuery {
  @IsString()
  @MaxLength(40)
  businessUnitId!: string;
}

@ApiTags('portal-config')
@ApiBearerAuth('access-token')
@Controller()
export class PortalConfigController {
  constructor(private readonly portal: PortalConfigService) {}

  @Get('portal-config')
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Ler configuração comercial do portal' })
  get(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: BusinessUnitQuery,
  ) {
    return this.portal.getForUser(user, query.businessUnitId);
  }

  @Put('portal-config')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Salvar configuração comercial do portal' })
  upsert(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: UpsertPortalConfigDto,
  ) {
    return this.portal.upsert(user, dto);
  }

  @Get('portal-banners')
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Listar banners do portal' })
  listBanners(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: BusinessUnitQuery,
  ) {
    return this.portal.listBanners(user, query.businessUnitId);
  }

  @Post('portal-banners')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Criar banner do portal' })
  createBanner(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreatePortalBannerDto,
  ) {
    return this.portal.createBanner(user, dto);
  }

  @Patch('portal-banners/:id')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Atualizar banner do portal' })
  updateBanner(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePortalBannerDto,
  ) {
    return this.portal.updateBanner(user, id, dto);
  }

  @Post('portal-media')
  @RequirePermissions('properties:manage')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'businessUnitId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        businessUnitId: { type: 'string' },
        previousUrl: { type: 'string' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload de imagem do portal (logo, hero, institucional ou banner)',
  })
  uploadMedia(
    @CurrentUser() user: JwtAccessPayload,
    @UploadedFile() file: MemoryUpload | undefined,
    @Body('businessUnitId') businessUnitId: string,
    @Body('previousUrl') previousUrl?: string,
  ) {
    return this.portal.uploadMedia(user, businessUnitId, file, previousUrl);
  }

  @Delete('portal-banners/:id')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Remover banner do portal' })
  deleteBanner(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.portal.deleteBanner(user, id);
  }
}
