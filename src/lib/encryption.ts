import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.PAN_ENCRYPTION_SECRET || 'primeipo_super_secret_key_32bytes!';

/**
 * Encrypt PAN number using AES-256
 */
export function encryptPan(pan: string): string {
  const cleanPan = pan.trim().toUpperCase();
  return CryptoJS.AES.encrypt(cleanPan, SECRET_KEY).toString();
}

/**
 * Decrypt PAN number
 */
export function decryptPan(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Hash PAN using SHA-256 for fast indexed lookups without exposing plain text PAN
 */
export function hashPan(pan: string): string {
  const cleanPan = pan.trim().toUpperCase();
  return CryptoJS.SHA256(cleanPan + SECRET_KEY).toString();
}

/**
 * Mask PAN for UI display (e.g. ABCDE1234F -> ABC** **34F)
 */
export function maskPan(pan: string): string {
  const clean = pan.trim().toUpperCase();
  if (clean.length !== 10) return '••••••••••';
  return `${clean.substring(0, 3)}••••${clean.substring(7)}`;
}
