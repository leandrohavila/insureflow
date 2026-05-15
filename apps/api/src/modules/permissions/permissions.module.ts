import { Module } from '@nestjs/common';

import { PermissionsController } from './permissions.controller';
import { PermissionsCatalogService } from './permissions.service';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsCatalogService],
})
export class PermissionsModule {}
