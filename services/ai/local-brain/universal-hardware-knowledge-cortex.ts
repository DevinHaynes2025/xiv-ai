/**
 * 62L-BY Universal Hardware Knowledge Cortex — structured hardware knowledge
 * with provenance and freshness. Unverified hardware → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BY_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  UNVERIFIED_HARDWARE_UNAVAILABLE,
  containsForbiddenPrivateFields,
  type ByActor,
  type ConfidenceLabel,
  type FreshnessLabel,
} from './hardware-cortex-synapse-compiler-types';

export type HardwareKnowledgeEntry = {
  id: string;
  deviceFamily: string;
  vendor: string;
  model: string;
  capabilities: string[];
  provenanceRefs: string[];
  confidence: ConfidenceLabel;
  freshness: FreshnessLabel;
  labeledVerified: boolean;
  available: boolean;
  productionAuthorized: false;
  createdAt: string;
  actorId: string;
  reason: string;
};

type Store = { entries: HardwareKnowledgeEntry[] };

function storePath(root: string) {
  return xivLocalPath(root, 'universal-hardware-knowledge-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { entries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function hardwareCortexHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4: BY_LOCKS.L4_AUTONOMY_ENABLED,
    unverifiedAvailable: BY_LOCKS.UNVERIFIED_HARDWARE_AVAILABLE,
    productionAuthorized: BY_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

/**
 * Ingest hardware knowledge. Force-VERIFIED without provenance/evidence is denied.
 * Unverified entries stay DOCUMENTED/AVAILABLE=false for runtime use.
 */
export async function ingestHardwareKnowledge(input: {
  deviceFamily: string;
  vendor: string;
  model: string;
  capabilities?: string[];
  provenanceRefs?: string[];
  freshness?: FreshnessLabel;
  evidenceBacked?: boolean;
  forceVerified?: boolean;
  payload?: Record<string, unknown>;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      labeledVerified: false,
      available: false,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      entry: null,
    };
  }

  const provenance = input.provenanceRefs ?? [];
  const evidenceBacked = Boolean(input.evidenceBacked && provenance.length > 0);
  if (input.forceVerified && !evidenceBacked) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      labeledVerified: false,
      available: false,
      reason: UNVERIFIED_HARDWARE_UNAVAILABLE,
      entry: null,
    };
  }

  const freshness = input.freshness ?? (evidenceBacked ? 'fresh' : 'unknown');
  const labeledVerified = evidenceBacked && freshness !== 'stale' && freshness !== 'waiting_data';
  const entry: HardwareKnowledgeEntry = {
    id: id('hw'),
    deviceFamily: input.deviceFamily.trim().toLowerCase(),
    vendor: input.vendor.trim(),
    model: input.model.trim(),
    capabilities: input.capabilities ?? [],
    provenanceRefs: provenance,
    confidence: labeledVerified ? 'evidence_backed' : 'unverified',
    freshness,
    labeledVerified,
    available: labeledVerified,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: labeledVerified
      ? 'HARDWARE_KNOWLEDGE_VERIFIED_WITH_PROVENANCE'
      : UNVERIFIED_HARDWARE_UNAVAILABLE,
  };

  const store = await load(root);
  store.entries.push(entry);
  await save(root, store);

  return {
    accepted: true as const,
    status: labeledVerified ? ('verified' as const) : ('documented' as const),
    labeledVerified,
    available: entry.available,
    reason: entry.reason,
    entry,
  };
}

export async function resolveHardwareKnowledge(
  deviceFamily: string,
  root = process.cwd(),
): Promise<HardwareKnowledgeEntry | null> {
  const store = await load(root);
  const key = deviceFamily.trim().toLowerCase();
  const matches = store.entries.filter((e) => e.deviceFamily === key);
  return matches[matches.length - 1] ?? null;
}

/**
 * Runtime use of hardware knowledge. Unverified → UNAVAILABLE.
 */
export async function useHardwareForRuntime(input: {
  deviceFamily: string;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const entry = await resolveHardwareKnowledge(input.deviceFamily, root);
  if (!entry || !entry.labeledVerified || !entry.available) {
    return {
      accepted: false as const,
      status: 'unavailable' as const,
      labeledVerified: false,
      reason: UNVERIFIED_HARDWARE_UNAVAILABLE,
      entry,
    };
  }
  if (entry.freshness === 'stale' || entry.freshness === 'waiting_data') {
    return {
      accepted: false as const,
      status: entry.freshness === 'stale' ? ('stale' as const) : ('waiting_data' as const),
      labeledVerified: false,
      reason: UNVERIFIED_HARDWARE_UNAVAILABLE,
      entry,
    };
  }
  return {
    accepted: true as const,
    status: 'available' as const,
    labeledVerified: true,
    reason: 'HARDWARE_RUNTIME_AVAILABLE_VERIFIED',
    entry,
  };
}

export async function listHardwareKnowledge(root = process.cwd()) {
  return (await load(root)).entries;
}
