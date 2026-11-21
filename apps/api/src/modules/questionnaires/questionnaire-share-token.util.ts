import { createHash, randomBytes } from 'crypto';

const DEFAULT_SHARE_DAYS = 14;
const MAX_SHARE_DAYS = 30;

export function generateQuestionnaireShareToken() {
  return randomBytes(32).toString('base64url');
}

export function hashQuestionnaireShareToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function resolveQuestionnaireShareDays(days?: number) {
  if (days === undefined) return DEFAULT_SHARE_DAYS;
  if (!Number.isInteger(days) || days < 1 || days > MAX_SHARE_DAYS) {
    return null;
  }
  return days;
}

export function questionnaireShareExpiry(days: number, now = new Date()) {
  const expiresAt = new Date(now.getTime());
  expiresAt.setUTCDate(expiresAt.getUTCDate() + days);
  return expiresAt;
}
