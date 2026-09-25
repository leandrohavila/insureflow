import { REAL_ESTATE_PIPELINE_STAGES } from '../../common/utils/deal-pipeline.util';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

export async function ensureRealEstatePipeline(
  prisma: PrismaService,
  tenantId: string,
  businessUnitId: string,
) {
  const unit = await prisma.businessUnit.findFirst({
    where: { id: businessUnitId, tenantId },
    select: { id: true, type: true, name: true },
  });
  if (!unit || unit.type !== 'REAL_ESTATE') return null;

  const stages = REAL_ESTATE_PIPELINE_STAGES.map((stage) => ({
    slug: stage.slug,
    label: stage.label,
    sortOrder: stage.sortOrder,
    maxDays: stage.maxDays,
    alertTarget: stage.alertTarget,
    color: stage.color,
  }));

  const existing = await prisma.businessUnitPipeline.findUnique({
    where: { businessUnitId },
    include: { stages: { select: { slug: true } } },
  });

  if (!existing) {
    return prisma.businessUnitPipeline.create({
      data: {
        tenantId,
        businessUnitId,
        name: `Pipeline Imobiliária — ${unit.name ?? ''}`.trim(),
        stages: { create: stages },
      },
    });
  }

  const have = new Set(existing.stages.map((stage) => stage.slug));
  const missing = stages.filter((stage) => !have.has(stage.slug));
  if (missing.length > 0) {
    await prisma.pipelineStage.createMany({
      data: missing.map((stage) => ({
        pipelineId: existing.id,
        ...stage,
      })),
    });
  }
  return existing;
}
