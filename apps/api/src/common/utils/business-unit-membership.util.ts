import type { Prisma, PrismaClient } from '@prisma/client';

type MembershipClient = PrismaClient | Prisma.TransactionClient;

export async function syncLeadBusinessUnits(
  tx: MembershipClient,
  leadId: string,
  unitIds: string[],
  originId?: string | null,
) {
  const unique = [...new Set(unitIds.filter(Boolean))];
  const origin =
    originId && unique.includes(originId) ? originId : (unique[0] ?? null);

  if (unique.length === 0) {
    await tx.leadBusinessUnit.deleteMany({ where: { leadId } });
    await tx.lead.update({
      where: { id: leadId },
      data: { businessUnitId: null },
    });
    return { originId: null, unitIds: [] as string[] };
  }

  await tx.leadBusinessUnit.deleteMany({
    where: { leadId, businessUnitId: { notIn: unique } },
  });

  for (const businessUnitId of unique) {
    await tx.leadBusinessUnit.upsert({
      where: { leadId_businessUnitId: { leadId, businessUnitId } },
      create: {
        leadId,
        businessUnitId,
        isOrigin: businessUnitId === origin,
      },
      update: { isOrigin: businessUnitId === origin },
    });
  }

  await tx.lead.update({
    where: { id: leadId },
    data: { businessUnitId: origin },
  });

  return { originId: origin, unitIds: unique };
}

export async function syncCustomerBusinessUnits(
  tx: MembershipClient,
  customerId: string,
  unitIds: string[],
  originId?: string | null,
) {
  const unique = [...new Set(unitIds.filter(Boolean))];
  const origin =
    originId && unique.includes(originId) ? originId : (unique[0] ?? null);

  if (unique.length === 0) {
    await tx.customerBusinessUnit.deleteMany({ where: { customerId } });
    await tx.customer.update({
      where: { id: customerId },
      data: { businessUnitId: null },
    });
    return { originId: null, unitIds: [] as string[] };
  }

  await tx.customerBusinessUnit.deleteMany({
    where: { customerId, businessUnitId: { notIn: unique } },
  });

  for (const businessUnitId of unique) {
    await tx.customerBusinessUnit.upsert({
      where: { customerId_businessUnitId: { customerId, businessUnitId } },
      create: {
        customerId,
        businessUnitId,
        isOrigin: businessUnitId === origin,
      },
      update: { isOrigin: businessUnitId === origin },
    });
  }

  await tx.customer.update({
    where: { id: customerId },
    data: { businessUnitId: origin },
  });

  return { originId: origin, unitIds: unique };
}

export function resolveBusinessUnitIds(params: {
  businessUnitId?: string | null;
  businessUnitIds?: string[] | null;
  existingOriginId?: string | null;
  existingUnitIds?: string[];
}): { originId: string | null; unitIds: string[] } {
  const fromArray = params.businessUnitIds ?? params.existingUnitIds ?? [];
  const origin =
    params.businessUnitId ?? params.existingOriginId ?? fromArray[0] ?? null;
  const unitIds = [...new Set([origin, ...fromArray].filter(Boolean))] as string[];
  return { originId: origin, unitIds };
}
