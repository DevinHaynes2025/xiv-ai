import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

/**
 * Deterministic serialization so a signature computed on a node and a signature
 * recomputed by the control plane cannot disagree because of key ordering.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalJson(entryValue)}`);
  return `{${entries.join(',')}}`;
}

export function digest(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
}

export function sign(key: string, value: unknown): string {
  return createHmac('sha256', key).update(canonicalJson(value)).digest('hex');
}

export function verify(key: string, value: unknown, signature: string): boolean {
  const expected = Buffer.from(sign(key, value), 'utf8');
  const provided = Buffer.from(signature ?? '', 'utf8');
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export function newSecret(): string {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
}
