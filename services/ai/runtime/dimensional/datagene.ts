/**
 * DataGene factory — content-addressed knowledge units.
 * Analogy only: not biological DNA, not cloning, not atomic-scale storage.
 */

import type { DataGene } from './types';
import { BIOLOGICAL_DNA_CLONING_CAPABILITY } from './fabric';

export const DATAGENE_SCHEMA_VERSION = '12d02.1' as const;

export type DataGenePayload = {
  /** Stable logical identity for the knowledge unit. */
  id: string;
  /** Arbitrary JSON-serializable body; hashed for content identity. */
  body: unknown;
  /** Provenance trail (source ids, adapters, operators). */
  provenance?: readonly string[];
  /** Optional createdAt ISO; defaults to now. */
  createdAt?: string;
};

/**
 * Isomorphic FNV-1a 64-bit hex hash (no node:crypto / WebCrypto required).
 * Same bytes → same digests in Node and browsers.
 */
export function isomorphicContentHash(input: string): string {
  let h1 = 0x811c9dc5 >>> 0;
  let h2 = 0x811c9dc5 >>> 0;
  const prime1 = 0x01000193;
  const prime2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 ^= c & 0xff;
    h1 = Math.imul(h1, prime1) >>> 0;
    h2 ^= (c >>> 8) & 0xff;
    h2 = Math.imul(h2, prime2) >>> 0;
    h1 ^= (c >>> 16) & 0xff;
    h1 = Math.imul(h1, prime1) >>> 0;
  }
  const a = h1.toString(16).padStart(8, '0');
  const b = h2.toString(16).padStart(8, '0');
  return `dg1:${a}${b}`;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`;
}

/**
 * Create a DataGene from a payload. Never claims biological DNA capability.
 */
export function createDataGene(payload: DataGenePayload): DataGene {
  if (BIOLOGICAL_DNA_CLONING_CAPABILITY) {
    throw new Error('BIOLOGICAL_DNA_CLONING_CAPABILITY must remain false');
  }
  if (!payload.id || typeof payload.id !== 'string') {
    throw new TypeError('DataGene payload.id must be a non-empty string');
  }
  const canonical = stableSerialize({
    id: payload.id,
    body: payload.body,
    schemaVersion: DATAGENE_SCHEMA_VERSION,
  });
  const provenance = Object.freeze([
    ...(payload.provenance ?? []),
    `datagene:${DATAGENE_SCHEMA_VERSION}`,
    'analogy:data-gene-not-biological-dna',
  ]);
  return {
    contentHash: isomorphicContentHash(canonical),
    schemaVersion: DATAGENE_SCHEMA_VERSION,
    provenance,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };
}