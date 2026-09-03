import { randomInt } from 'crypto';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type EmailOtp = {
  code: string;
  expiresAt: number;
  attempts: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __EMAIL_OTP_STORE__: Map<string, EmailOtp> | undefined;
}

const store = global.__EMAIL_OTP_STORE__ ?? new Map<string, EmailOtp>();
global.__EMAIL_OTP_STORE__ = store;

export function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function createEmailOtp(email: string) {
  const code = randomInt(100000, 1000000).toString();
  store.set(email, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  return code;
}

export function consumeEmailOtp(email: string, code: string) {
  const stored = store.get(email);
  if (!stored) return { valid: false, error: 'Invalid or expired code.' };

  if (Date.now() > stored.expiresAt) {
    store.delete(email);
    return { valid: false, error: 'This code has expired. Request a new one.' };
  }

  stored.attempts += 1;
  if (stored.attempts > MAX_ATTEMPTS) {
    store.delete(email);
    return { valid: false, error: 'Too many attempts. Request a new code.' };
  }

  if (stored.code !== code) return { valid: false, error: 'Invalid or expired code.' };

  store.delete(email);
  return { valid: true };
}