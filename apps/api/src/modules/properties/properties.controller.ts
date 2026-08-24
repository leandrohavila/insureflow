import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  CreatePropertyDto,
  ListPropertiesQueryDto,
  PropertyImageInputDto,
  UpdatePropertyDto,
} from './dto/property.dto';
import {
  ReplacePropertyFeaturesDto,
  ReorderPropertyImagesDto,
} from './dto/property-feature.dto';
import {
  CreatePropertyOwnerDto,
  UpdatePropertyOwnerDto,
} from './dto/property-owner.dto';
import { MAX_IMAGE_BYTES, MAX_UPLOAD_FILES, type MemoryUpload } from './property-storage';
import { PropertiesService } from './properties.service';
import { PropertyFeaturesService } from './property-features.service';
import { PropertyOwnersService } from './property-owners.service';

@ApiTags('properties')
@ApiBearerAuth('access-token')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly properties: PropertiesService,
    private readonly owners: PropertyOwnersService,
    private readonly features: PropertyFeaturesService,
  ) {}

  @Get()
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Listar inventário imobiliário (admin)' })
  findAll(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListPropertiesQueryDto,
  ) {
    return this.properties.findAll(user, query);
  }

  @Get(':id/leads')
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Leads do portal para um imóvel' })
  listLeads(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.properties.listLeads(user, id);
  }

  @Get(':id/owners')
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Proprietários do imóvel' })
  listOwners(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.owners.list(user, id);
  }

  @Get(':id')
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Detalhe do imóvel (admin, inclui não publicados)' })
  findOne(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.properties.findOne(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Cadastrar imóvel (não publica automaticamente)' })
  create(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.properties.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Atualizar imóvel' })
  update(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.properties.update(user, id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Publicar imóvel no portal' })
  publish(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.properties.publish(user, id);
  }

  @Post(':id/unpublish')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Despublicar imóvel' })
  unpublish(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.properties.unpublish(user, id);
  }

  @Post(':id/owners')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Vincular proprietário ao imóvel' })
  addOwner(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: CreatePropertyOwnerDto,
  ) {
    return this.owners.add(user, id, dto);
  }

  @Patch(':id/owners/:ownerId')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Atualizar vínculo de proprietário' })
  updateOwner(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('ownerId') ownerId: string,
    @Body() dto: UpdatePropertyOwnerDto,
  ) {
    return this.owners.update(user, id, ownerId, dto);
  }

  @Post(':id/owners/:ownerId/primary')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Definir proprietário principal' })
  setPrimaryOwner(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('ownerId') ownerId: string,
  ) {
    return this.owners.setPrimary(user, id, ownerId);
  }

  @Delete(':id/owners/:ownerId')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Remover proprietário do imóvel' })
  removeOwner(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('ownerId') ownerId: string,
  ) {
    return this.owners.remove(user, id, ownerId);
  }

  @Put(':id/features')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Substituir características do imóvel' })
  replaceFeatures(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: ReplacePropertyFeaturesDto,
  ) {
    return this.features.replace(user, id, dto);
  }

  @Post(':id/images/upload')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('properties:manage')
  @UseInterceptors(
    FilesInterceptor('files', MAX_UPLOAD_FILES, {
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiOperation({ summary: 'Upload múltiplo de imagens (local)' })
  uploadImages(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @UploadedFiles() files?: MemoryUpload[],
  ) {
    return this.properties.uploadImages(user, id, files ?? []);
  }

  @Patch(':id/images/order')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Ordenar imagens manualmente' })
  reorderImages(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: ReorderPropertyImagesDto,
  ) {
    return this.properties.reorderImages(user, id, dto.imageIds);
  }

  @Post(':id/images/:imageId/cover')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Definir imagem de capa' })
  setCover(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.properties.setCoverImage(user, id, imageId);
  }

  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Adicionar imagem por URL (fluxo já validado)' })
  addImage(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: PropertyImageInputDto,
  ) {
    return this.properties.addImage(user, id, dto);
  }

  @Delete(':id/images/:imageId')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Remover imagem' })
  removeImage(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.properties.removeImage(user, id, imageId);
  }

  @Delete(':id')
  @RequirePermissions('properties:manage')
  @ApiOperation({ summary: 'Excluir imóvel' })
  remove(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.properties.remove(user, id);
  }
}
