import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type ActivityRelationInput = {
  leadId?: string | null;
  dealId?: string | null;
  customerId?: string | null;
  policyId?: string | null;
};

export type PrismaClientLike = PrismaService | Prisma.TransactionClient;

export async function assertActivityRelations(
  client: PrismaClientLike,
  tenantId: string,
  input: ActivityRelationInput,
): Promise<void> {
  const leadId = input.leadId ?? undefined;
  const dealId = input.dealId ?? undefined;
  const customerId = input.customerId ?? undefined;
  const policyId = input.policyId ?? undefined;

  if (!leadId && !dealId && !customerId && !policyId) {
    throw new BadRequestException(
      'Informe pelo menos um vínculo: leadId, dealId, customerId ou policyId',
    );
  }

  if (leadId) {
    const lead = await client.lead.findFirst({
      where: { id: leadId, tenantId },
      select: { id: true },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');
  }

  if (dealId) {
    const deal = await client.deal.findFirst({
      where: { id: dealId, tenantId },
      select: { id: true },
    });
    if (!deal) throw new NotFoundException('Negócio não encontrado');
  }

  if (customerId) {
    const customer = await client.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
  }

  if (policyId) {
    const policy = await client.policy.findFirst({
      where: { id: policyId, tenantId },
      select: { id: true },
    });
    if (!policy) throw new NotFoundException('Apólice não encontrada');
  }
}

export async function assertActivityPerformer(
  client: PrismaClientLike,
  tenantId: string,
  userId: string,
): Promise<void> {
  const user = await client.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true },
  });
  if (!user) throw new NotFoundException('Usuário não encontrado');
}

export async function syncLeadLastContactFromActivities(
  client: PrismaClientLike,
  tenantId: string,
  leadId: string | null,
): Promise<void> {
  if (!leadId) return;

  const aggregate = await client.activity.aggregate({
    where: { tenantId, leadId },
    _max: { occurredAt: true },
  });

  await client.lead.update({
    where: { id: leadId },
    data: { lastContactAt: aggregate._max.occurredAt ?? null },
  });
}
