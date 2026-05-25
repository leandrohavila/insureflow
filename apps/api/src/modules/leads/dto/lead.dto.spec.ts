import 'reflect-metadata';

import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';
import { ListLeadsQueryDto } from './lead.dto';

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
