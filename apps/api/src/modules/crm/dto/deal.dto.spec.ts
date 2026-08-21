import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { CreateDealDto, UpdateDealDto } from './deal.dto';

describe('Deal DTO contract (pipelineOrder)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => new BadRequestException(errors),
  });

  it('accepts pipelineOrder on CreateDealDto when explicitly provided', async () => {
    const result = (await pipe.transform(
      {
        title: 'Test',
        company: 'Co',
        value: 100,
        stage: 'novo',
        status: 'open',
        pipelineOrder: 1500,
      },
      { type: 'body', metatype: CreateDealDto },
    )) as CreateDealDto;
    expect(result).toMatchObject({ pipelineOrder: 1500 });
  });

  it('accepts create without pipelineOrder (server assigns order)', async () => {
    const result = (await pipe.transform(
      {
        title: 'Test',
        company: 'Co',
        value: 100,
        stage: 'novo',
        status: 'open',
      },
      { type: 'body', metatype: CreateDealDto },
    )) as CreateDealDto;
    expect(result.pipelineOrder).toBeUndefined();
  });

  it('accepts fractional pipelineOrder on UpdateDealDto (PATCH Kanban)', async () => {
    const result = (await pipe.transform(
      { stage: 'negociacao', pipelineOrder: 2500.5 },
      { type: 'body', metatype: UpdateDealDto },
    )) as UpdateDealDto;
    expect(result).toMatchObject({
      stage: 'negociacao',
      pipelineOrder: 2500.5,
    });
  });

  it('rejects unknown fields (forbidNonWhitelisted)', async () => {
    await expect(
      pipe.transform(
        { stage: 'novo', unknownField: true },
        { type: 'body', metatype: UpdateDealDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects display-only frontend fields on create', async () => {
    await expect(
      pipe.transform(
        {
          title: 'Test',
          company: 'Co',
          value: 100,
          stage: 'novo',
          status: 'open',
          owner: 'Ana',
          tags: ['Aberto'],
        },
        { type: 'body', metatype: CreateDealDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
