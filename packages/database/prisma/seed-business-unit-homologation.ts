/**
 * Dataset de homologação por Business Unit (BUG-015).
 * Garante mínimos: Corretora 20/5/15 e Imóveis 15/3/10, com origin + M:N.
 */
import { PrismaClient } from '@prisma/client';

const TARGETS = {
  insurance: { leads: 20, customers: 5, deals: 15 },
  realEstate: { leads: 15, customers: 3, deals: 10 },
} as const;

export async function seedBusinessUnitHomologation(
  prisma: PrismaClient,
  tenantId: string,
) {
  const insurance = await prisma.businessUnit.findFirst({
    where: { tenantId, slug: 'corretora-avila' },
  });
  const realEstate = await prisma.businessUnit.findFirst({
    where: { tenantId, slug: 'avila-imoveis' },
  });
  if (!insurance || !realEstate) {
    console.warn('[seed-bu-hml] unidades Corretora/Imóveis ausentes');
    return;
  }

  const owner = await prisma.user.findFirst({
    where: { tenantId, email: 'sales@insureflow.com' },
    select: { id: true },
  });

  await ensureRecords(prisma, tenantId, 'lead', TARGETS.insurance.leads + TARGETS.realEstate.leads, owner?.id);
  await ensureRecords(prisma, tenantId, 'customer', TARGETS.insurance.customers + TARGETS.realEstate.customers, owner?.id);
  await ensureRecords(prisma, tenantId, 'deal', TARGETS.insurance.deals + TARGETS.realEstate.deals, owner?.id);

  const leads = await prisma.lead.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  const deals = await prisma.deal.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  await assignLeads(prisma, leads, insurance.id, realEstate.id);
  await assignCustomers(prisma, customers, insurance.id, realEstate.id);
  await assignDeals(prisma, deals, insurance.id, realEstate.id);

  await prisma.leadFollowUp.updateMany({
    where: { tenantId, lead: { businessUnitId: insurance.id } },
    data: { businessUnitId: insurance.id },
  });
  await prisma.leadFollowUp.updateMany({
    where: { tenantId, lead: { businessUnitId: realEstate.id } },
    data: { businessUnitId: realEstate.id },
  });
  await prisma.policyRenewal.updateMany({
    where: { tenantId, customer: { businessUnitId: insurance.id } },
    data: { businessUnitId: insurance.id },
  });
  await prisma.policyRenewal.updateMany({
    where: { tenantId, customer: { businessUnitId: realEstate.id } },
    data: { businessUnitId: realEstate.id },
  });

  const counts = {
    insuranceLeads: await countLeads(prisma, tenantId, insurance.id),
    realEstateLeads: await countLeads(prisma, tenantId, realEstate.id),
    insuranceCustomers: await countCustomers(prisma, tenantId, insurance.id),
    realEstateCustomers: await countCustomers(prisma, tenantId, realEstate.id),
    insuranceDeals: await prisma.deal.count({
      where: { tenantId, businessUnitId: insurance.id },
    }),
    realEstateDeals: await prisma.deal.count({
      where: { tenantId, businessUnitId: realEstate.id },
    }),
  };

  console.log(
    'Seed BU HML OK —',
    `Corretora leads=${counts.insuranceLeads} customers=${counts.insuranceCustomers} deals=${counts.insuranceDeals};`,
    `Imóveis leads=${counts.realEstateLeads} customers=${counts.realEstateCustomers} deals=${counts.realEstateDeals}`,
  );
}

async function countLeads(prisma: PrismaClient, tenantId: string, unitId: string) {
  return prisma.lead.count({
    where: {
      tenantId,
      OR: [
        { businessUnitId: unitId },
        { businessUnits: { some: { businessUnitId: unitId } } },
      ],
    },
  });
}

async function countCustomers(
  prisma: PrismaClient,
  tenantId: string,
  unitId: string,
) {
  return prisma.customer.count({
    where: {
      tenantId,
      OR: [
        { businessUnitId: unitId },
        { businessUnits: { some: { businessUnitId: unitId } } },
      ],
    },
  });
}

async function assignLeads(
  prisma: PrismaClient,
  rows: Array<{ id: string }>,
  insuranceId: string,
  realEstateId: string,
) {
  for (let index = 0; index < rows.length; index += 1) {
    const unitId = index < TARGETS.insurance.leads ? insuranceId : realEstateId;
    await linkLead(prisma, rows[index]!.id, unitId);
  }
}

async function assignCustomers(
  prisma: PrismaClient,
  rows: Array<{ id: string }>,
  insuranceId: string,
  realEstateId: string,
) {
  for (let index = 0; index < rows.length; index += 1) {
    const unitId = index < TARGETS.insurance.customers ? insuranceId : realEstateId;
    await linkCustomer(prisma, rows[index]!.id, unitId);
  }
}

async function assignDeals(
  prisma: PrismaClient,
  rows: Array<{ id: string }>,
  insuranceId: string,
  realEstateId: string,
) {
  for (let index = 0; index < rows.length; index += 1) {
    const unitId =
      index < TARGETS.insurance.deals
        ? insuranceId
        : index < TARGETS.insurance.deals + TARGETS.realEstate.deals
          ? realEstateId
          : insuranceId;
    await prisma.deal.update({
      where: { id: rows[index]!.id },
      data: { businessUnitId: unitId },
    });
  }
}

async function linkLead(
  prisma: PrismaClient,
  leadId: string,
  businessUnitId: string,
) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { businessUnitId },
  });
  await prisma.leadBusinessUnit.upsert({
    where: { leadId_businessUnitId: { leadId, businessUnitId } },
    create: { leadId, businessUnitId, isOrigin: true },
    update: { isOrigin: true },
  });
  await prisma.leadBusinessUnit.deleteMany({
    where: { leadId, businessUnitId: { not: businessUnitId } },
  });
}

async function linkCustomer(
  prisma: PrismaClient,
  customerId: string,
  businessUnitId: string,
) {
  await prisma.customer.update({
    where: { id: customerId },
    data: { businessUnitId },
  });
  await prisma.customerBusinessUnit.upsert({
    where: { customerId_businessUnitId: { customerId, businessUnitId } },
    create: { customerId, businessUnitId, isOrigin: true },
    update: { isOrigin: true },
  });
  await prisma.customerBusinessUnit.deleteMany({
    where: { customerId, businessUnitId: { not: businessUnitId } },
  });
}

async function ensureRecords(
  prisma: PrismaClient,
  tenantId: string,
  kind: 'lead' | 'customer' | 'deal',
  minimum: number,
  ownerUserId?: string,
) {
  if (kind === 'lead') {
    const current = await prisma.lead.count({ where: { tenantId } });
    for (let i = current; i < minimum; i += 1) {
      await prisma.lead.create({
        data: {
          tenantId,
          name: `Lead HML ${i + 1}`,
          email: `lead.hml.${i + 1}@homologacao.insureflow.test`,
          phone: `+55119900${String(i + 1).padStart(4, '0')}`,
          company: i < TARGETS.insurance.leads ? 'Corretora Ávila' : 'Ávila Imóveis',
          source: 'seed-hml',
          status: 'new',
          assignedTo: ownerUserId,
        },
      });
    }
    return;
  }

  if (kind === 'customer') {
    const current = await prisma.customer.count({ where: { tenantId } });
    for (let i = current; i < minimum; i += 1) {
      const document = `${String(10_000_000_000 + i).slice(0, 12)}`;
      await prisma.customer.create({
        data: {
          tenantId,
          type: 'pf',
          name: `Cliente HML ${i + 1}`,
          document,
          email: `cliente.hml.${i + 1}@homologacao.insureflow.test`,
          phone: `+55119800${String(i + 1).padStart(4, '0')}`,
          status: 'active',
          lifecycleStage: 'active',
        },
      });
    }
    return;
  }

  const current = await prisma.deal.count({ where: { tenantId } });
  for (let i = current; i < minimum; i += 1) {
    await prisma.deal.create({
      data: {
        tenantId,
        title: `Negócio HML ${i + 1}`,
        company: i < TARGETS.insurance.deals ? 'Corretora Ávila' : 'Ávila Imóveis',
        value: 10000 + i * 500,
        stage: 'novo',
        status: 'open',
        pipelineOrder: (i + 1) * 100,
        assignedTo: ownerUserId,
      },
    });
  }
}
