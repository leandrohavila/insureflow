import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import { CommercialImportService } from './commercial-import.service';
import type {
  ParsedCustomerImportRow,
  ParsedLeadImportRow,
} from './commercial-import.mapping';

@ApiTags('commercial-import')
@ApiBearerAuth('access-token')
@Controller('commercial-import')
export class CommercialImportController {
  constructor(private readonly imports: CommercialImportService) {}

  @Get('leads/template')
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Baixar modelo XLSX de importação de leads' })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename="modelo-leads.xlsx"')
  async leadTemplate() {
    const buffer = Buffer.from(await this.imports.template('leads'));
    return new StreamableFile(buffer);
  }

  @Get('clientes/template')
  @RequirePermissions('clients:view')
  @ApiOperation({ summary: 'Baixar modelo XLSX de importação de clientes' })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename="modelo-clientes.xlsx"')
  async customerTemplate() {
    const buffer = Buffer.from(await this.imports.template('clientes'));
    return new StreamableFile(buffer);
  }

  @Post('leads/preview')
  @RequirePermissions('leads:manage')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Pré-visualizar importação de leads' })
  previewLeads(@UploadedFile() file?: { buffer?: Buffer }) {
    return this.imports.previewLeads(this.requireFile(file));
  }

  @Post('clientes/preview')
  @RequirePermissions('clients:manage')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Pré-visualizar importação de clientes' })
  previewCustomers(@UploadedFile() file?: { buffer?: Buffer }) {
    return this.imports.previewCustomers(this.requireFile(file));
  }

  @Post('leads/commit')
  @RequirePermissions('leads:manage')
  @ApiOperation({ summary: 'Importar leads em lote (upsert por CPF/CNPJ)' })
  commitLeads(
    @CurrentUser() user: JwtAccessPayload,
    @Body() body: { rows?: ParsedLeadImportRow[] },
  ) {
    return this.imports.commitLeads(user.tenantId, body.rows ?? [], {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  @Post('clientes/commit')
  @RequirePermissions('clients:manage')
  @ApiOperation({ summary: 'Importar clientes em lote (upsert por CPF/CNPJ)' })
  commitCustomers(
    @CurrentUser() user: JwtAccessPayload,
    @Body() body: { rows?: ParsedCustomerImportRow[] },
  ) {
    return this.imports.commitCustomers(user.tenantId, body.rows ?? [], {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    });
  }

  private requireFile(file?: { buffer?: Buffer }) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo XLSX é obrigatório');
    }
    return file.buffer;
  }
}
