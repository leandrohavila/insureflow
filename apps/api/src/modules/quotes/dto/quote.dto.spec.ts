import { BadRequestException, ValidationPipe } from '@nestjs/common';

import {
  CreateQuoteComparisonDto,
  CreateQuoteLineDto,
  PROPOSAL_STATUSES,
  UpdateQuoteLineDto,
} from './quote.dto';

describe('Quote DTO contract', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => new BadRequestException(errors),
  });

  it('accepts CreateQuoteComparisonDto with optional relations', async () => {
    const result = (await pipe.transform(
      {
        title: 'Comparativo Auto',
        leadId: 'lead_1',
        dealId: 'deal_1',
      },
      { type: 'body', metatype: CreateQuoteComparisonDto },
    )) as CreateQuoteComparisonDto;

    expect(result).toMatchObject({
      title: 'Comparativo Auto',
      leadId: 'lead_1',
      dealId: 'deal_1',
    });
  });

  it('accepts CreateQuoteLineDto with premiumValue transform', async () => {
    const result = (await pipe.transform(
      {
        insurer: 'Porto Seguro',
        premiumValue: '1250.5',
        coverages: ['colisao', 'terceiros'],
      },
      { type: 'body', metatype: CreateQuoteLineDto },
    )) as CreateQuoteLineDto;

    expect(result).toMatchObject({
      insurer: 'Porto Seguro',
      premiumValue: 1250.5,
      coverages: ['colisao', 'terceiros'],
    });
  });

  it('accepts partial UpdateQuoteLineDto for PATCH', async () => {
    const result = (await pipe.transform(
      { premiumValue: 999, isSelected: true },
      { type: 'body', metatype: UpdateQuoteLineDto },
    )) as UpdateQuoteLineDto;

    expect(result).toMatchObject({
      premiumValue: 999,
      isSelected: true,
    });
    expect(result.insurer).toBeUndefined();
  });

  it('rejects unknown fields on create comparison', async () => {
    await expect(
      pipe.transform(
        { title: 'Test', unknownField: true },
        { type: 'body', metatype: CreateQuoteComparisonDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('expõe workflow completo de propostas com viewed e expired', () => {
    expect(PROPOSAL_STATUSES).toEqual([
      'draft',
      'sent',
      'viewed',
      'accepted',
      'rejected',
      'expired',
    ]);
  });
});
