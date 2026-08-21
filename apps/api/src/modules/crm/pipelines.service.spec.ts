import { computeDealScore } from '../../common/utils/deal-score.util';
import { PipelinesService } from './pipelines.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('PipelinesService', () => {
  it('cria pipeline padrão da corretora com SLA de cotação em 3 dias', async () => {
    const created = {
      id: 'pl-1',
      tenantId: 't1',
      name: 'Pipeline Seguros — Corretora',
      businessUnit: {
        id: 'bu-1',
        name: 'Corretora',
        slug: 'corretora',
        type: 'INSURANCE',
        isActive: true,
      },
      stages: [
        { slug: 'cotacao', label: 'Cotação', sortOrder: 2, maxDays: 3, alertTarget: 'OWNER', color: 'primary' },
      ],
    };
    const prisma = {
      businessUnitPipeline: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(created),
      },
      deal: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    } as unknown as PrismaService;
    const service = new PipelinesService(prisma, {
      resolveIds: jest.fn(),
    } as never);

    const pipeline = await service.ensureForBusinessUnit('t1', {
      id: 'bu-1',
      type: 'INSURANCE',
      name: 'Corretora',
    });

    expect(prisma.businessUnitPipeline.create).toHaveBeenCalled();
    const createArg = (prisma.businessUnitPipeline.create as jest.Mock).mock
      .calls[0][0];
    expect(createArg.data.stages.create).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: 'cotacao', maxDays: 3, alertTarget: 'OWNER' }),
        expect.objectContaining({ slug: 'proposta', maxDays: 7, alertTarget: 'MANAGER' }),
      ]),
    );
    expect(pipeline.id).toBe('pl-1');
    expect(computeDealScore('RENEWAL')).toBe('HIGH');
  });
});
