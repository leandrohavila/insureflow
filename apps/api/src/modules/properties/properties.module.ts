import { Module } from '@nestjs/common';

import { LeadsModule } from '../leads/leads.module';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyFeatureDefinitionsController } from './property-feature-definitions.controller';
import { PropertyFeatureDefinitionsService } from './property-feature-definitions.service';
import { PropertyFeaturesService } from './property-features.service';
import { PropertyFilesController } from './property-files.controller';
import { PropertyOwnersService } from './property-owners.service';
import { PublicCatalogContextService } from './public-catalog-context.service';
import { PublicPropertiesController } from './public-properties.controller';
import { PublicPropertiesService } from './public-properties.service';
import { PublicPropertyLeadsController } from './public-property-leads.controller';
import { PropertyLeadsService } from './property-leads.service';
import { PersonsRepository } from './repositories/persons.repository';
import { PropertiesRepository } from './repositories/properties.repository';
import { PropertyFeatureDefinitionsRepository } from './repositories/property-feature-definitions.repository';
import { PropertyFeaturesRepository } from './repositories/property-features.repository';
import { PropertyImagesRepository } from './repositories/property-images.repository';
import { PropertyLeadsRepository } from './repositories/property-leads.repository';
import { PropertyOwnersRepository } from './repositories/property-owners.repository';

@Module({
  imports: [LeadsModule],
  controllers: [
    PublicPropertiesController,
    PublicPropertyLeadsController,
    PropertyFilesController,
    PersonsController,
    PropertyFeatureDefinitionsController,
    PropertiesController,
  ],
  providers: [
    PropertiesRepository,
    PropertyImagesRepository,
    PropertyLeadsRepository,
    PersonsRepository,
    PropertyOwnersRepository,
    PropertyFeatureDefinitionsRepository,
    PropertyFeaturesRepository,
    PublicCatalogContextService,
    PropertiesService,
    PublicPropertiesService,
    PropertyLeadsService,
    PersonsService,
    PropertyOwnersService,
    PropertyFeatureDefinitionsService,
    PropertyFeaturesService,
  ],
  exports: [
    PropertiesService,
    PublicPropertiesService,
    PropertyLeadsService,
    PersonsService,
  ],
})
export class PropertiesModule {}
