/**
 * 62L-CF Neural Knowledge Compression Engine — retrieval-aware compression candidates.
 * Honesty: research/candidates; not auto production-authorized.
 * Security & correctness ahead of size/speed/energy.
 */

import { createHash } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CF_LOCKS,
  COMPRESSION_NOT_PRODUCTION,
  HONESTY_BANNER,
  type CfActor,
} from './data-refinery-compression-replication-types';

export type CompressionCandidate = {
  id: string;
  sourcePackId: string;
  method: 'retrieval_aware_digest' | 'sparse_summary' | 'quantized_embedding_sketch';
  originalBytes: number;
  compressedBytes: number;
  checksumSha256: string;
  retrievalHints: string[];
  status: 'sandbox_candidate' | 'denied';
  productionAuthorized: false;
  reason: string;
  createdAt: string;
};

type Store = {
  candidates: CompressionCandidate[];
  productionAttempts: Array<{
    id: string;
    candidateId: string;
    denied: true;
    reason: string;
    at: string;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'neural-knowledge-compression-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { candidates: [], productionAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function compressionHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CF_LOCKS.L4_AUTONOMY_ENABLED,
    compressionAutoProduction: CF_LOCKS.COMPRESSION_AUTO_PRODUCTION,
    securityCorrectnessBeatsSizeSpeedEnergy:
      CF_LOCKS.SECURITY_CORRECTNESS_BEATS_SIZE_SPEED_ENERGY,
    productionAuthorization: CF_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function createCompressionCandidate(input: {
  sourcePackId: string;
  content: string;
  method?: CompressionCandidate['method'];
  retrievalHints?: string[];
  forceProductionAuthorize?: boolean;
  root: string;
  actor: CfActor;
}): Promise<{
  candidate: CompressionCandidate;
  productionAuthorized: false;
}> {
  const store = await load(input.root);
  const originalBytes = Buffer.byteLength(input.content, 'utf8');
  // Retrieval-aware: keep a short digest + hints; never claim lossless production readiness.
  const digest = createHash('sha256').update(input.content).digest('hex');
  const sketch = digest.slice(0, 32);
  const compressedBytes = Buffer.byteLength(sketch, 'utf8');

  if (input.forceProductionAuthorize) {
    const denied: CompressionCandidate = {
      id: id('comp'),
      sourcePackId: input.sourcePackId,
      method: input.method ?? 'retrieval_aware_digest',
      originalBytes,
      compressedBytes,
      checksumSha256: digest,
      retrievalHints: input.retrievalHints ?? [],
      status: 'denied',
      productionAuthorized: false,
      reason: COMPRESSION_NOT_PRODUCTION,
      createdAt: new Date().toISOString(),
    };
    store.candidates.push(denied);
    await save(input.root, store);
    return { candidate: denied, productionAuthorized: false };
  }

  const candidate: CompressionCandidate = {
    id: id('comp'),
    sourcePackId: input.sourcePackId,
    method: input.method ?? 'retrieval_aware_digest',
    originalBytes,
    compressedBytes,
    checksumSha256: digest,
    retrievalHints: input.retrievalHints ?? [],
    status: 'sandbox_candidate',
    productionAuthorized: false,
    reason: COMPRESSION_NOT_PRODUCTION,
    createdAt: new Date().toISOString(),
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return { candidate, productionAuthorized: false };
}

export async function attemptCompressionProductionAuthorize(input: {
  candidateId: string;
  root: string;
  actor: CfActor;
}): Promise<{
  accepted: false;
  denied: true;
  reason: typeof COMPRESSION_NOT_PRODUCTION;
}> {
  const store = await load(input.root);
  store.productionAttempts.push({
    id: id('compprod'),
    candidateId: input.candidateId,
    denied: true,
    reason: COMPRESSION_NOT_PRODUCTION,
    at: new Date().toISOString(),
  });
  await save(input.root, store);
  return { accepted: false, denied: true, reason: COMPRESSION_NOT_PRODUCTION };
}

/** Prefer secure/correct route over smaller/faster/lower-energy compression. */
export function preferSecurityOverCompressionGain(input: {
  sizeGainPct: number;
  energyGainPct: number;
  securityRisk: boolean;
  correctnessRisk: boolean;
}): { preferCompression: false; reason: string } | { preferCompression: true; reason: string } {
  if (input.securityRisk || input.correctnessRisk) {
    return {
      preferCompression: false,
      reason: 'SECURITY_CORRECTNESS_BEATS_SIZE_SPEED_ENERGY',
    };
  }
  return {
    preferCompression: true,
    reason: 'COMPRESSION_GAIN_WITHIN_SAFE_BOUNDS_STILL_CANDIDATE',
  };
}
