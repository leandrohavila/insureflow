export const AUDIT_QUEUE = 'audit-log';

export type AuditJobPayload = {
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};
