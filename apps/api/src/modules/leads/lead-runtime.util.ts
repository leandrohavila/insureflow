import { Logger } from '@nestjs/common';

const logger = new Logger('lead-runtime');

function enabled() {
  return (
    process.env.LEAD_RUNTIME_DEBUG === '1' ||
    process.env.NODE_ENV !== 'production'
  );
}

export function logLeadQuery(phase: string, payload?: Record<string, unknown>) {
  if (!enabled()) return;
  logger.log(`[lead-query] ${phase} ${JSON.stringify(payload ?? {})}`);
}

export function logLeadSerialize(
  phase: string,
  payload?: Record<string, unknown>,
) {
  if (!enabled()) return;
  logger.log(`[lead-serialize] ${phase} ${JSON.stringify(payload ?? {})}`);
}

export function logLeadValidation(
  phase: string,
  payload?: Record<string, unknown>,
) {
  if (!enabled()) return;
  logger.warn(`[lead-validation] ${phase} ${JSON.stringify(payload ?? {})}`);
}

export function logLeadRuntime(
  phase: string,
  error: unknown,
  payload?: Record<string, unknown>,
) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(
    `[lead-runtime] ${phase} ${message} ${JSON.stringify(payload ?? {})}`,
    error instanceof Error ? error.stack : undefined,
  );
}
