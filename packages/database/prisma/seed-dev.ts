/**
 * Seed DEV — dados operacionais de demonstração (CRM).
 * Executado quando SEED_DEV_DATA=1 (após seed base de tenant/users).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEV_LEADS = [
  {
    key: 'lead-marina',
    name: 'Marina Oliveira',
    email: 'marina.oliveira@empresa-demo.com.br',
    phone: '+5511987654321',
    company: 'Oliveira Logística',
    source: 'indicacao',
    status: 'qualified',
  },
  {
    key: 'lead-carlos',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@techcorp.io',
    phone: '+5511976543210',
    company: 'TechCorp Brasil',
    source: 'site',
    status: 'new',
  },
  {
    key: 'lead-patricia',
    name: 'Patricia Rocha',
    email: 'p.rocha@construmax.com.br',
    phone: '+5511965432109',
    company: 'Construmax Engenharia',
    source: 'whatsapp',
    status: 'contacted',
  },
] as const;

const DEV_DEALS = [
  {
    key: 'deal-oliveira',
    title: 'RC Empresarial — Oliveira Logística',
    company: 'Oliveira Logística',
    value: 48000,
    stage: 'proposta',
    status: 'open',
    pipelineOrder: 1000,
    leadKey: 'lead-marina' as const,
  },
  {
    key: 'deal-techcorp',
    title: 'Cyber + D&O — TechCorp',
    company: 'TechCorp Brasil',
    value: 125000,
    stage: 'negociacao',
    status: 'open',
    pipelineOrder: 2000,
    leadKey: 'lead-carlos' as const,
  },
  {
    key: 'deal-construmax',
    title: 'Riscos de Engenharia — Construmax',
    company: 'Construmax Engenharia',
    value: 89000,
    stage: 'qualificacao',
    status: 'open',
    pipelineOrder: 3000,
    leadKey: 'lead-patricia' as const,
  },
  {
    key: 'deal-fechado',
    title: 'Frota — Transportes Silva',
    company: 'Transportes Silva Ltda',
    value: 62000,
    stage: 'fechado',
    status: 'won',
    pipelineOrder: 4000,
    leadKey: null,
  },
] as const;

const DEV_CUSTOMERS = [
  {
    key: 'customer-silva',
    type: 'pj',
    name: 'Transportes Silva Ltda',
    document: '12.345.678/0001-90',
    email: 'contato@transportessilva.com.br',
    phone: '+5511933334444',
    lifecycleStage: 'won',
    renewalDateDays: 45,
    renewalStatus: 'pending',
    dealKey: 'deal-fechado' as const,
  },
  {
    key: 'customer-oliveira',
    type: 'pj',
    name: 'Oliveira Logística',
    document: '98.765.432/0001-10',
    email: 'marina.oliveira@empresa-demo.com.br',
    phone: '+5511987654321',
    lifecycleStage: 'active',
    renewalDateDays: 120,
    renewalStatus: 'in_progress',
    dealKey: 'deal-oliveira' as const,
  },
] as const;

const DEV_POLICIES = [
  {
    key: 'policy-silva-frota',
    customerKey: 'customer-silva' as const,
    dealKey: 'deal-fechado' as const,
    insurer: 'Porto Seguro',
    policyNumber: 'DEV-FROTA-2026-001',
    productLine: 'Automóvel Frota',
    premiumValue: 62000,
    commissionValue: 6200,
    status: 'active' as const,
    renewalStatus: 'pending' as const,
    effectiveToDays: 45,
  },
  {
    key: 'policy-oliveira-rc',
    customerKey: 'customer-oliveira' as const,
    dealKey: 'deal-oliveira' as const,
    insurer: 'Allianz',
    policyNumber: 'DEV-RC-2026-002',
    productLine: 'RC Empresarial',
    premiumValue: 48000,
    commissionValue: 4800,
    status: 'pending' as const,
    renewalStatus: 'in_progress' as const,
    effectiveToDays: 120,
  },
] as const;

export async function seedDevData() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'insureflow' } });
  if (!tenant) {
    throw new Error('Seed base ausente — rode seed.ts antes de seed-dev');
  }

  const performer = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: 'sales@insureflow.com' },
  });
  if (!performer) {
    throw new Error('Usuário sales@insureflow.com não encontrado');
  }

  const leadIds = new Map<string, string>();
  for (const lead of DEV_LEADS) {
    const existing = await prisma.lead.findFirst({
      where: { tenantId: tenant.id, email: lead.email },
    });
    const record =
      existing ??
      (await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: lead.source,
          status: lead.status,
          assignedTo: performer.id,
          lastContactAt: new Date(),
        },
      }));
    leadIds.set(lead.key, record.id);
  }

  const dealIds = new Map<string, string>();
  for (const deal of DEV_DEALS) {
    const existing = await prisma.deal.findFirst({
      where: { tenantId: tenant.id, title: deal.title },
    });
    const record =
      existing ??
      (await prisma.deal.create({
        data: {
          tenantId: tenant.id,
          title: deal.title,
          company: deal.company,
          value: deal.value,
          stage: deal.stage,
          status: deal.status,
          pipelineOrder: deal.pipelineOrder,
          assignedTo: performer.id,
          wonAt: deal.status === 'won' ? new Date() : null,
        },
      }));
    dealIds.set(deal.key, record.id);

    if (deal.leadKey) {
      const leadId = leadIds.get(deal.leadKey);
      if (leadId) {
        await prisma.lead.update({
          where: { id: leadId },
          data: { dealId: record.id },
        });
      }
    }
  }

  const customerIds = new Map<string, string>();
  for (const customer of DEV_CUSTOMERS) {
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + customer.renewalDateDays);

    const dealId = customer.dealKey ? dealIds.get(customer.dealKey) : undefined;

    const record = await prisma.customer.upsert({
      where: {
        tenantId_document: {
          tenantId: tenant.id,
          document: customer.document,
        },
      },
      create: {
        tenantId: tenant.id,
        type: customer.type,
        name: customer.name,
        document: customer.document,
        email: customer.email,
        phone: customer.phone,
        status: 'active',
        lifecycleStage: customer.lifecycleStage,
        renewalDate,
        renewalStatus: customer.renewalStatus,
        sourceDealId: dealId,
      },
      update: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        lifecycleStage: customer.lifecycleStage,
        renewalDate,
        renewalStatus: customer.renewalStatus,
        sourceDealId: dealId,
      },
    });
    customerIds.set(customer.key, record.id);

    if (dealId) {
      await prisma.deal.update({
        where: { id: dealId },
        data: { customerId: record.id },
      });
    }
  }

  for (const policy of DEV_POLICIES) {
    const customerId = customerIds.get(policy.customerKey);
    const dealId = dealIds.get(policy.dealKey);
    if (!customerId) continue;

    const effectiveTo = new Date();
    effectiveTo.setDate(effectiveTo.getDate() + policy.effectiveToDays);
    const effectiveFrom = new Date();
    effectiveFrom.setMonth(effectiveFrom.getMonth() - 11);

    await prisma.policy.upsert({
      where: {
        tenantId_policyNumber: {
          tenantId: tenant.id,
          policyNumber: policy.policyNumber,
        },
      },
      create: {
        tenantId: tenant.id,
        customerId,
        dealId,
        insurer: policy.insurer,
        policyNumber: policy.policyNumber,
        productLine: policy.productLine,
        premiumValue: policy.premiumValue,
        commissionValue: policy.commissionValue,
        status: policy.status,
        renewalStatus: policy.renewalStatus,
        brokerUserId: performer.id,
        issuedAt: effectiveFrom,
        effectiveFrom,
        effectiveTo,
      },
      update: {
        customerId,
        dealId,
        insurer: policy.insurer,
        productLine: policy.productLine,
        premiumValue: policy.premiumValue,
        commissionValue: policy.commissionValue,
        status: policy.status,
        renewalStatus: policy.renewalStatus,
        effectiveTo,
      },
    });
  }

  const policySilva = await prisma.policy.findFirst({
    where: { tenantId: tenant.id, policyNumber: 'DEV-FROTA-2026-001' },
  });

  const activities = [
    {
      type: 'call',
      subject: 'Qualificação inicial — Marina Oliveira',
      leadKey: 'lead-marina',
      daysAgo: 2,
    },
    {
      type: 'email',
      subject: 'Envio de proposta RC Empresarial',
      dealKey: 'deal-oliveira',
      daysAgo: 1,
    },
    {
      type: 'meeting',
      subject: 'Demo D&O com diretoria TechCorp',
      dealKey: 'deal-techcorp',
      daysAgo: 3,
    },
    {
      type: 'follow_up',
      subject: 'Renovação frota — Transportes Silva',
      customerKey: 'customer-silva',
      policyId: policySilva?.id,
      daysAgo: 0,
      nextFollowUpDays: 7,
    },
    {
      type: 'note',
      subject: 'Lead Construmax — aguardando planta do empreendimento',
      leadKey: 'lead-patricia',
      daysAgo: 5,
    },
  ] as const;

  for (const activity of activities) {
    const occurredAt = new Date();
    occurredAt.setDate(occurredAt.getDate() - activity.daysAgo);

    const nextFollowUpAt =
      'nextFollowUpDays' in activity
        ? new Date(Date.now() + activity.nextFollowUpDays * 86400000)
        : null;

    const existing = await prisma.activity.findFirst({
      where: {
        tenantId: tenant.id,
        subject: activity.subject,
      },
    });
    if (existing) continue;

    await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        type: activity.type,
        status: activity.type === 'follow_up' ? 'pending' : 'completed',
        subject: activity.subject,
        description: 'Registro gerado pelo seed DEV',
        occurredAt,
        nextFollowUpAt,
        leadId: 'leadKey' in activity ? leadIds.get(activity.leadKey) : undefined,
        dealId: 'dealKey' in activity ? dealIds.get(activity.dealKey) : undefined,
        customerId:
          'customerKey' in activity ? customerIds.get(activity.customerKey) : undefined,
        policyId: 'policyId' in activity ? activity.policyId ?? undefined : undefined,
        performedById: performer.id,
      },
    });
  }

  console.log(
    'Seed DEV OK —',
    `${DEV_LEADS.length} leads,`,
    `${DEV_DEALS.length} deals,`,
    `${DEV_CUSTOMERS.length} customers,`,
    `${DEV_POLICIES.length} policies,`,
    `${activities.length} activities`,
  );
}
