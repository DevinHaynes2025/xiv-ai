/**
 * 62L-EB Module D — Civilization/Scientific Memory Cortex.
 * Governed memory; ACL deny-by-default; label alone ≠ access.
 * Speculative cosmology/ET/metaphysics → RESEARCH_SIM quarantine.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  LABEL_NEQ_MEMORY_ACCESS,
  MAX_MEMORY_EVENTS,
  MEMORY_CORTEX_ACL_DENIED,
  SPECULATIVE_QUARANTINED,
  type EbActor,
  type EbEvidenceState,
} from './multi-model-superbrain-federation-types';

const SPECULATIVE_TOPICS = [
  'dark_matter',
  'black_hole',
  'extraterrestrial',
  'parallel_universe',
  'metaphysics',
  'cosmology_speculation',
] as const;

export type MemoryAccess = {
  id: string;
  memoryId: string;
  contextId: string;
  aclGranted: boolean;
  labelPresent: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type SpeculativeQuarantine = {
  id: string;
  topic: string;
  status: 'quarantined';
  state: EbEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  accesses: MemoryAccess[];
  quarantines: SpeculativeQuarantine[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'civilization-scientific-memory-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    accesses: [],
    quarantines: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function civilizationScientificMemoryCortexHonesty() {
  return {
    aclDenyByDefault: true,
    labelAloneNeqAccess: true,
    speculativeQuarantinedResearchSim: true,
    authorizedPublicLicensedCustomerOwnedOnly: true,
    noConsciousnessClaims: true,
  };
}

export function isSpeculativeTopic(topic: string): boolean {
  const t = topic.toLowerCase();
  return SPECULATIVE_TOPICS.some((s) => t.includes(s));
}

export async function accessMemoryCortex(input: {
  memoryId: string;
  contextId: string;
  aclGranted: boolean;
  labelPresent?: boolean;
  root: string;
  actor: EbActor;
}): Promise<MemoryAccess> {
  const store = await load(input.root);
  void input.actor;
  if (store.accesses.length >= MAX_MEMORY_EVENTS) {
    throw new Error('MAX_MEMORY_EVENTS_REACHED');
  }
  if (!input.aclGranted) {
    const denied: MemoryAccess = {
      id: id('ebmem'),
      memoryId: input.memoryId.trim(),
      contextId: input.contextId.trim(),
      aclGranted: false,
      labelPresent: Boolean(input.labelPresent),
      status: 'denied',
      reason: input.labelPresent
        ? LABEL_NEQ_MEMORY_ACCESS
        : MEMORY_CORTEX_ACL_DENIED,
      at: new Date().toISOString(),
    };
    store.accesses.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: MemoryAccess = {
    id: id('ebmem'),
    memoryId: input.memoryId.trim(),
    contextId: input.contextId.trim(),
    aclGranted: true,
    labelPresent: Boolean(input.labelPresent),
    status: 'ok',
    reason: 'MEMORY_CORTEX_ACL_GRANTED',
    at: new Date().toISOString(),
  };
  store.accesses.push(ok);
  await save(input.root, store);
  return ok;
}

export async function quarantineSpeculativeTopic(input: {
  topic: string;
  root: string;
  actor: EbActor;
}): Promise<SpeculativeQuarantine> {
  const store = await load(input.root);
  void input.actor;
  const quarantine: SpeculativeQuarantine = {
    id: id('ebspec'),
    topic: input.topic.trim(),
    status: 'quarantined',
    state: 'RESEARCH_SIM',
    reason: SPECULATIVE_QUARANTINED,
    at: new Date().toISOString(),
  };
  store.quarantines.push(quarantine);
  await save(input.root, store);
  return quarantine;
}
