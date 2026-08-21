import type { ActivityEventKind } from '../../common/utils/activity-event-kinds.util';

export type PublishActivityEventInput = {
  tenantId: string;
  performedById: string;
  operationalEventKind: ActivityEventKind;
  subject: string;
  description?: string | null;
  occurredAt?: Date;
  leadId?: string | null;
  dealId?: string | null;
  customerId?: string | null;
  policyId?: string | null;
  /** Metadados extensíveis — persistidos em `outcome` (JSON) para eventos de sistema. */
  metadata?: Record<string, unknown>;
  /** Evita duplicatas quando o mesmo marco comercial é reprocessado. */
  idempotencyKey?: {
    operationalEventKind: ActivityEventKind;
    leadId?: string | null;
    dealId?: string | null;
    customerId?: string | null;
    policyId?: string | null;
  };
};
