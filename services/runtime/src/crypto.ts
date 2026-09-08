import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Signing material for the control plane. The plane refuses to start with a
 * placeholder key in production mode, so a deployment cannot silently sign
 * grants and offline packages with a well-known secret.
 */
export type SigningKeys = {
  enrollment: string;
  grant: string;
  attestation: string;
  offline: string;
  meeting: string;
  checkpoint: string;
};

export function generateSigningKeys(): SigningKeys {
  return {
    enrollment: randomBytes(32).toString('hex'),
    grant: randomBytes(32).toString('hex'),
    attestation: randomBytes(32).toString('hex'),
    offline: randomBytes(32).toString('hex'),
    meeting: randomBytes(32).toString('hex'),
    checkpoint: randomBytes(32).toString('hex'),
  };
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Stable stringify so signatures do not depend on key insertion order. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`;
}

export function sign(key: string, payload: unknown): string {
  return createHmac('sha256', key).update(canonicalize(payload)).digest('hex');
}

export function verifySignature(key: string, payload: unknown, signature: string): boolean {
  const expected = sign(key, payload);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
}

export function nonce(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}

export function fingerprint(parts: readonly string[]): string {
  return sha256(parts.join('\u0000'));
}
