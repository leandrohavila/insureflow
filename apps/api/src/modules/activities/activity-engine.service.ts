import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { isActivityEventKind } from '../../common/utils/activity-event-kinds.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { PublishActivityEventInput } from './activity-engine.types';
import { encodeActivityEventMetadata } from './activity-event-metadata.util';
import type {
  ActivityEventPublisher,
  PublishActivityEventResult,
} from './activity-event-publisher.interface';
import {
  assertActivityPerformer,
  assertActivityRelations,
  syncLeadLastContactFromActivities,
  type PrismaClientLike,
} from './activity-write.util';

export type { PublishActivityEventInput } from './activity-engine.types';

@Injectable()
export class ActivityEngineService implements ActivityEventPublisher {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Publica um evento de sistema na timeline comercial/operacional.
   * Usar em transações de domínio — nunca expor via API pública de Activities.
   */
  async publish(
    input: PublishActivityEventInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PublishActivityEventResult> {
    if (!isActivityEventKind(input.operationalEventKind)) {
      throw new BadRequestException('Tipo de evento inválido');
    }

    const client = tx ?? this.prisma;

    await assertActivityRelations(client, input.tenantId, input);
    await assertActivityPerformer(client, input.tenantId, input.performedById);

    if (input.idempotencyKey) {
      const existing = await this.findIdempotentEvent(client, input);
      if (existing) {
        return { id: existing.id, created: false };
      }
    }

    const activity = await client.activity.create({
      data: {
        tenantId: input.tenantId,
        type: 'note',
        status: 'completed',
        subject: input.subject.trim(),
        description: input.description?.trim() || null,
        outcome: encodeActivityEventMetadata(input.metadata),
        operationalEventKind: input.operationalEventKind,
        occurredAt: input.occurredAt ?? new Date(),
        leadId: input.leadId ?? null,
        dealId: input.dealId ?? null,
        customerId: input.customerId ?? null,
        policyId: input.policyId ?? null,
        performedById: input.performedById,
      },
      select: { id: true, leadId: true },
    });

    await syncLeadLastContactFromActivities(
      client,
      input.tenantId,
      activity.leadId,
    );

    return { id: activity.id, created: true };
  }

  /** Propaga dealId para atividades do lead na conversão comercial. */
  async linkLeadActivitiesToDeal(
    tx: Prisma.TransactionClient,
    tenantId: string,
    leadId: string,
    dealId: string,
  ): Promise<number> {
    const result = await tx.activity.updateMany({
      where: { tenantId, leadId, dealId: null },
      data: { dealId },
    });
    return result.count;
  }

  private async findIdempotentEvent(
    client: PrismaClientLike,
    input: PublishActivityEventInput,
  ) {
    const key = input.idempotencyKey;
    if (!key) return null;

    return client.activity.findFirst({
      where: {
        tenantId: input.tenantId,
        operationalEventKind: key.operationalEventKind,
        ...(key.leadId ? { leadId: key.leadId } : {}),
        ...(key.dealId ? { dealId: key.dealId } : {}),
        ...(key.customerId ? { customerId: key.customerId } : {}),
        ...(key.policyId ? { policyId: key.policyId } : {}),
      },
      select: { id: true },
    });
  }
}
