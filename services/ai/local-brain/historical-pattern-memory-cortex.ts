/**
 * 62L-DJ Historical Pattern Memory Cortex —
 * Historical pattern memory with provenance.
 * Pattern ≠ causation until evidenced; no auto-promotion of correlation to verified causation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DJ_LOCKS,
  HONESTY_BANNER,
  MAX_PATTERN_ENTRIES,
  PATTERN_CAUSATION_AUTO_PROMOTE_DENIED,
  type DjActor,
  type PatternClaimStatus,
} from './personal-intelligence-command-os-types';

export type PatternMemoryCortex = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type PatternMemoryEntry = {
  id: string;
  cortexId: string;
  patternSummary: string;
  provenanceIds: string[];
  claimStatus: PatternClaimStatus;
  autoPromoteAttempted: boolean;
  status: 'RECORDED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = { cortices: PatternMemoryCortex[]; entries: PatternMemoryEntry[] };

function storePath(root: string) {
  return xivLocalPath(root, 'historical-pattern-memory-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { cortices: [], entries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function historicalPatternMemoryCortexHonesty() {
  return {
    banner: HONESTY_BANNER,
    patternAutoPromotesToCausation: DJ_LOCKS.PATTERN_AUTO_PROMOTES_TO_CAUSATION,
    patternIsCorrelationUntilEvidenced: DJ_LOCKS.PATTERN_IS_CORRELATION_UNTIL_EVIDENCED,
    productionAuthorization: DJ_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapHistoricalPatternMemoryCortex(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DjActor;
}): Promise<PatternMemoryCortex> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.cortices.find(
    (c) =>
      c.orgId === input.orgId &&
      c.tenantId === input.tenantId &&
      c.universeId === input.universeId,
  );
  if (existing) return existing;
  const cortex: PatternMemoryCortex = {
    id: id('djpat'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.cortices.push(cortex);
  await save(input.root, store);
  return cortex;
}

export async function recordHistoricalPattern(input: {
  cortexId: string;
  patternSummary: string;
  provenanceIds?: string[];
  autoPromoteToVerifiedCausation?: boolean;
  claimCausationWithoutEvidence?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{ accepted: boolean; reason: string; entry?: PatternMemoryEntry; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const cortex = store.cortices.find((c) => c.id === input.cortexId);
  if (!cortex) return { accepted: false, reason: 'PATTERN_CORTEX_NOT_FOUND', at: now };
  if (store.entries.length >= MAX_PATTERN_ENTRIES) {
    return { accepted: false, reason: 'MAX_PATTERN_ENTRIES_BOUNDED', at: now };
  }

  if (
    input.autoPromoteToVerifiedCausation === true ||
    input.claimCausationWithoutEvidence === true
  ) {
    const entry: PatternMemoryEntry = {
      id: id('djpatn'),
      cortexId: cortex.id,
      patternSummary: input.patternSummary.trim() || 'unnamed-pattern',
      provenanceIds: input.provenanceIds ?? [],
      claimStatus: 'CORRELATION_ONLY',
      autoPromoteAttempted: true,
      status: 'DENIED',
      reason: PATTERN_CAUSATION_AUTO_PROMOTE_DENIED,
      at: now,
    };
    store.entries.push(entry);
    await save(input.root, store);
    return { accepted: false, reason: PATTERN_CAUSATION_AUTO_PROMOTE_DENIED, entry, at: now };
  }

  const provenanceIds = (input.provenanceIds ?? []).filter((p) => p.trim().length > 0);
  const entry: PatternMemoryEntry = {
    id: id('djpatn'),
    cortexId: cortex.id,
    patternSummary: input.patternSummary.trim() || 'unnamed-pattern',
    provenanceIds,
    claimStatus: 'CORRELATION_ONLY',
    autoPromoteAttempted: false,
    status: 'RECORDED',
    reason: 'PATTERN_RECORDED_AS_CORRELATION_WITH_PROVENANCE',
    at: now,
  };
  store.entries.push(entry);
  await save(input.root, store);
  return { accepted: true, reason: entry.reason, entry, at: now };
}
