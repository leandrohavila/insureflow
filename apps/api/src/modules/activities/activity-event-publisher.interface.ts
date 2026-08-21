import type { Prisma } from '@prisma/client';

import type { PublishActivityEventInput } from './activity-engine.types';

export type PublishActivityEventResult = {
  id: string;
  created: boolean;
};

/**
 * Contrato estável para publicação de eventos comerciais/operacionais.
 * `ActivityEngineService` implementa hoje; futuras versões podem delegar
 * para fila/worker (Event Bus) sem alterar consumidores de domínio.
 */
export interface ActivityEventPublisher {
  publish(
    input: PublishActivityEventInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PublishActivityEventResult>;
}

export const ACTIVITY_EVENT_PUBLISHER = Symbol('ACTIVITY_EVENT_PUBLISHER');
