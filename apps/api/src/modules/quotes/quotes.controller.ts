import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  BulkCreateQuoteLinesDto,
  CreateProposalDto,
  CreateQuoteComparisonDto,
  CreateQuoteLineDto,
  ListProposalsQueryDto,
  ListQuoteComparisonsQueryDto,
  UpdateProposalDto,
  UpdateQuoteComparisonDto,
  UpdateQuoteLineDto,
} from './dto/quote.dto';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiBearerAuth('access-token')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  private actorFrom(user: JwtAccessPayload) {
    return {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      currentBusinessUnitId: user.currentBusinessUnitId,
    };
  }

  @Get()
  @RequirePermissions('quotes:view')
  @ApiOperation({ summary: 'Listar comparativos de cotação do tenant' })
  findComparisons(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListQuoteComparisonsQueryDto,
  ) {
    return this.quotes.findComparisons(
      user.tenantId,
      query,
      this.actorFrom(user),
    );
  }

  @Get('metrics')
  @RequirePermissions('quotes:view')
  @ApiOperation({ summary: 'Métricas de cotações para dashboard' })
  getMetrics(@CurrentUser() user: JwtAccessPayload) {
    return this.quotes.getMetrics(user.tenantId, this.actorFrom(user));
  }

  @Get('proposals')
  @RequirePermissions('quotes:view')
  @ApiOperation({ summary: 'Listar propostas comerciais do tenant' })
  findProposals(
    @CurrentUser() user: JwtAccessPayload,
    @Query() query: ListProposalsQueryDto,
  ) {
    return this.quotes.findProposals(
      user.tenantId,
      query,
      this.actorFrom(user),
    );
  }

  @Get('proposals/:proposalId')
  @RequirePermissions('quotes:view')
  @ApiOperation({ summary: 'Detalhe da proposta comercial' })
  @ApiParam({ name: 'proposalId', description: 'ID da proposta' })
  findProposal(
    @CurrentUser() user: JwtAccessPayload,
    @Param('proposalId') proposalId: string,
  ) {
    return this.quotes.findProposal(
      user.tenantId,
      proposalId,
      this.actorFrom(user),
    );
  }

  @Get('comparisons/:id')
  @RequirePermissions('quotes:view')
  @ApiOperation({ summary: 'Detalhe do comparativo de cotações' })
  @ApiParam({ name: 'id', description: 'ID do comparativo' })
  findComparison(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.quotes.findComparison(
      user.tenantId,
      id,
      this.actorFrom(user),
    );
  }

  @Post('comparisons')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Criar comparativo de cotações' })
  createComparison(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateQuoteComparisonDto,
  ) {
    return this.quotes.createComparison(user.tenantId, user.sub, dto);
  }

  @Patch('comparisons/:id')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Atualizar comparativo de cotações' })
  @ApiParam({ name: 'id', description: 'ID do comparativo' })
  updateComparison(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteComparisonDto,
  ) {
    return this.quotes.updateComparison(user.tenantId, id, user.sub, dto);
  }

  @Post('comparisons/:id/quotes')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Adicionar linha de cotação ao comparativo' })
  @ApiParam({ name: 'id', description: 'ID do comparativo' })
  addQuoteLine(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: CreateQuoteLineDto,
  ) {
    return this.quotes.addQuoteLine(user.tenantId, id, user.sub, dto);
  }

  @Post('comparisons/:id/quotes/bulk')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Adicionar linhas de cotação em lote' })
  @ApiParam({ name: 'id', description: 'ID do comparativo' })
  bulkAddQuoteLines(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: BulkCreateQuoteLinesDto,
  ) {
    return this.quotes.bulkAddQuoteLines(user.tenantId, id, user.sub, dto);
  }

  @Patch('comparisons/:comparisonId/quotes/:quoteId')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Atualizar linha de cotação' })
  @ApiParam({ name: 'comparisonId', description: 'ID do comparativo' })
  @ApiParam({ name: 'quoteId', description: 'ID da linha de cotação' })
  updateQuoteLine(
    @CurrentUser() user: JwtAccessPayload,
    @Param('comparisonId') comparisonId: string,
    @Param('quoteId') quoteId: string,
    @Body() dto: UpdateQuoteLineDto,
  ) {
    return this.quotes.updateQuoteLine(
      user.tenantId,
      comparisonId,
      quoteId,
      user.sub,
      dto,
    );
  }

  @Post('comparisons/:comparisonId/quotes/:quoteId/select')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Selecionar linha de cotação no comparativo' })
  @ApiParam({ name: 'comparisonId', description: 'ID do comparativo' })
  @ApiParam({ name: 'quoteId', description: 'ID da linha de cotação' })
  selectQuoteLine(
    @CurrentUser() user: JwtAccessPayload,
    @Param('comparisonId') comparisonId: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.quotes.selectQuoteLine(
      user.tenantId,
      comparisonId,
      quoteId,
      user.sub,
    );
  }

  @Post('comparisons/:id/send')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Marcar comparativo como enviado' })
  @ApiParam({ name: 'id', description: 'ID do comparativo' })
  markComparisonSent(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.quotes.markComparisonSent(user.tenantId, id, user.sub);
  }

  @Post('comparisons/:id/viewed')
  @RequirePermissions('quotes:view')
  @ApiOperation({ summary: 'Registrar visualização do comparativo' })
  @ApiParam({ name: 'id', description: 'ID do comparativo' })
  recordComparisonViewed(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
  ) {
    return this.quotes.recordComparisonViewed(user.tenantId, id, user.sub);
  }

  @Post('comparisons/:id/proposals')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Criar proposta comercial' })
  @ApiParam({ name: 'id', description: 'ID do comparativo' })
  createProposal(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') id: string,
    @Body() dto: CreateProposalDto,
  ) {
    return this.quotes.createProposal(user.tenantId, id, user.sub, dto);
  }

  @Patch('comparisons/:comparisonId/proposals/:proposalId')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Atualizar proposta comercial' })
  @ApiParam({ name: 'comparisonId', description: 'ID do comparativo' })
  @ApiParam({ name: 'proposalId', description: 'ID da proposta' })
  updateProposal(
    @CurrentUser() user: JwtAccessPayload,
    @Param('comparisonId') comparisonId: string,
    @Param('proposalId') proposalId: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.quotes.updateProposal(
      user.tenantId,
      comparisonId,
      proposalId,
      user.sub,
      dto,
    );
  }

  @Post('comparisons/:comparisonId/proposals/:proposalId/generate-pdf')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Gerar PDF da proposta comercial' })
  generateProposalPdf(
    @CurrentUser() user: JwtAccessPayload,
    @Param('comparisonId') comparisonId: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.quotes.generateProposalPdf(
      user.tenantId,
      comparisonId,
      proposalId,
      user.sub,
    );
  }

  @Get('comparisons/:comparisonId/proposals/:proposalId/pdf')
  @RequirePermissions('quotes:view')
  @ApiOperation({ summary: 'Download do PDF da proposta' })
  async downloadProposalPdf(
    @CurrentUser() user: JwtAccessPayload,
    @Param('comparisonId') comparisonId: string,
    @Param('proposalId') proposalId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename } = await this.quotes.getProposalPdfBuffer(
      user.tenantId,
      comparisonId,
      proposalId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Post('comparisons/:comparisonId/proposals/:proposalId/send')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Marcar proposta como enviada' })
  markProposalSent(
    @CurrentUser() user: JwtAccessPayload,
    @Param('comparisonId') comparisonId: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.quotes.markProposalSent(
      user.tenantId,
      comparisonId,
      proposalId,
      user.sub,
    );
  }

  @Post('comparisons/:comparisonId/proposals/:proposalId/viewed')
  @RequirePermissions('quotes:view')
  @ApiOperation({ summary: 'Registrar visualização da proposta' })
  markProposalViewed(
    @CurrentUser() user: JwtAccessPayload,
    @Param('comparisonId') comparisonId: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.quotes.markProposalViewed(
      user.tenantId,
      comparisonId,
      proposalId,
      user.sub,
    );
  }

  @Post('comparisons/:comparisonId/proposals/:proposalId/expire')
  @RequirePermissions('quotes:manage')
  @ApiOperation({ summary: 'Marcar proposta como expirada' })
  markProposalExpired(
    @CurrentUser() user: JwtAccessPayload,
    @Param('comparisonId') comparisonId: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.quotes.markProposalExpired(
      user.tenantId,
      comparisonId,
      proposalId,
      user.sub,
    );
  }
}
