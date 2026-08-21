import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { ListQuestionnaireSubmissionsQueryDto } from './questionnaire.dto';

describe('ListQuestionnaireSubmissionsQueryDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });

  async function validate(query: Record<string, unknown>) {
    try {
      return await pipe.transform(query, {
        type: 'query',
        metatype: ListQuestionnaireSubmissionsQueryDto,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error.getResponse();
      }
      throw error;
    }
  }

  it('accepts lead badge query shape (leadId + page + limit as strings)', async () => {
    const result = await validate({
      leadId: 'clxyz123lead',
      page: '1',
      limit: '5',
    });

    expect(result).toMatchObject({
      leadId: 'clxyz123lead',
      page: 1,
      limit: 5,
    });
  });

  it('accepts leadId only without page/limit', async () => {
    const result = await validate({ leadId: 'clxyz123lead' });

    expect(result).toMatchObject({ leadId: 'clxyz123lead', page: 1, limit: 10 });
  });

  it('coerces page/limit without enableImplicitConversion when @Type is present', async () => {
    const strictPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    const result = await strictPipe.transform(
      { leadId: 'clxyz123lead', page: '1', limit: '5' },
      { type: 'query', metatype: ListQuestionnaireSubmissionsQueryDto },
    );

    expect(result).toMatchObject({
      leadId: 'clxyz123lead',
      page: 1,
      limit: 5,
    });
  });

  it('rejects unknown query params (forbidNonWhitelisted)', async () => {
    await expect(
      validate({
        leadId: 'clxyz123lead',
        page: '1',
        limit: '5',
        enabled: 'true',
      }),
    ).rejects.toMatchObject({
      message: expect.arrayContaining(['property enabled should not exist']),
    });
  });

  it('rejects limit below minimum', async () => {
    await expect(
      validate({
        leadId: 'clxyz123lead',
        page: '1',
        limit: '0',
      }),
    ).rejects.toMatchObject({
      message: expect.arrayContaining(['limit must not be less than 1']),
    });
  });

  it('rejects invalid status enum (e.g. status=all or lead status values)', async () => {
    await expect(
      validate({
        leadId: 'clxyz123lead',
        status: 'all',
      }),
    ).rejects.toMatchObject({
      message: expect.arrayContaining([
        'status must be one of the following values: draft, submitted, reviewed, archived',
      ]),
    });

    await expect(
      validate({
        leadId: 'clxyz123lead',
        status: 'qualified',
      }),
    ).rejects.toMatchObject({
      message: expect.arrayContaining([
        'status must be one of the following values: draft, submitted, reviewed, archived',
      ]),
    });
  });
});
