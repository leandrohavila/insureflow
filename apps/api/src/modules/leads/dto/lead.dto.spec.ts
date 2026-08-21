import 'reflect-metadata';

import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';
import { CreateLeadDto, ListLeadsQueryDto } from './lead.dto';

describe('ListLeadsQueryDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => new BadRequestException(errors),
  });

  it('accepts relationship workspace limit', async () => {
    const result = (await pipe.transform(
      { page: '1', limit: String(LIST_QUERY_MAX_LIMIT) },
      { type: 'query', metatype: ListLeadsQueryDto },
    )) as ListLeadsQueryDto;

    expect(result.limit).toBe(LIST_QUERY_MAX_LIMIT);
    expect(result.page).toBe(1);
  });

  it('rejects limit above workspace cap', async () => {
    await expect(
      pipe.transform(
        { page: '1', limit: String(LIST_QUERY_MAX_LIMIT + 1) },
        { type: 'query', metatype: ListLeadsQueryDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('CreateLeadDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => new BadRequestException(errors),
  });

  const basePayload = { name: 'Marina Costa' };

  async function validate(body: Record<string, unknown>) {
    return pipe.transform(body, {
      type: 'body',
      metatype: CreateLeadDto,
    }) as Promise<CreateLeadDto>;
  }

  it('accepts payload without status (defaults applied in service)', async () => {
    const result = await validate(basePayload);

    expect(result).toMatchObject({ name: 'Marina Costa' });
    expect(result.status).toBeUndefined();
  });

  it('accepts payload with empty status string as omitted', async () => {
    const result = await validate({ ...basePayload, status: '' });

    expect(result.status).toBeUndefined();
  });

  it('accepts payload with empty status string as omitted', async () => {
    const result = await validate({ ...basePayload, status: '' });

    expect(result.status).toBeUndefined();
  });

  it('accepts payload with empty optional strings as omitted', async () => {
    const result = await validate({
      ...basePayload,
      email: '',
      phone: '',
      company: '',
      source: '',
      notes: '',
      assignedTo: '',
    });

    expect(result).toMatchObject({ name: 'Marina Costa' });
    expect(result.email).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.assignedTo).toBeUndefined();
  });

  it('accepts payload with valid status', async () => {
    const result = await validate({ ...basePayload, status: 'qualified' });

    expect(result.status).toBe('qualified');
  });

  it('accepts interest categories and business unit', async () => {
    const result = await validate({
      ...basePayload,
      businessUnitId: 'bu-1',
      interestCategories: ['AUTO_INSURANCE', 'PROPERTY_BUY'],
    });

    expect(result.businessUnitId).toBe('bu-1');
    expect(result.interestCategories).toEqual([
      'AUTO_INSURANCE',
      'PROPERTY_BUY',
    ]);
  });

  it('accepts follow-up scheduling on create', async () => {
    const result = await validate({
      ...basePayload,
      followUpDays: 3,
      followUpType: 'WHATSAPP',
    });
    expect(result.followUpDays).toBe(3);
    expect(result.followUpType).toBe('WHATSAPP');
  });

  it('rejects payload with invalid status', async () => {
    await expect(
      validate({ ...basePayload, status: 'all' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});