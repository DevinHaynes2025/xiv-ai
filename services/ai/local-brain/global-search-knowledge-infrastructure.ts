/**
 * 62L-EB Module H — Global Search & Knowledge Infrastructure.
 * Permission-aware search; ACL; no cross-context leakage.
 * Soft-wire EA/DZ; neural nodes evidence-gated.
 * Anti-malware OS soft-wire: stealth install denied.
 * Digital Twin ≠ founder.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_SEARCH_EVENTS,
  NEURAL_NODES_EVIDENCE_GATED,
  SEARCH_ACL_DENIED,
  SEARCH_CROSS_CONTEXT_DENIED,
  STEALTH_INSTALL_DENIED,
  TWIN_NEQ_FOUNDER,
  predecessorMap,
  type EbActor,
  type EbEvidenceState,
} from './multi-model-superbrain-federation-types';

export type GlobalSearchEvent = {
  id: string;
  queryId: string;
  contextId: string;
  aclGranted: boolean;
  crossContextAttempt: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type NeuralNodeProbe = {
  id: string;
  nodeId: string;
  evidencePresent: boolean;
  status: 'ok' | 'denied';
  state: EbEvidenceState;
  reason: string;
  at: string;
};

export type StealthInstallDenial = {
  id: string;
  attemptKind:
    | 'stealth_install'
    | 'unauthorized_takeover'
    | 'permission_bypass'
    | 'silent_persistence';
  status: 'denied';
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorId: string;
  claimFounderAuthority: boolean;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  searches: GlobalSearchEvent[];
  neuralNodes: NeuralNodeProbe[];
  stealthDenials: StealthInstallDenial[];
  twinProbes: TwinAuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-search-knowledge-infrastructure.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    searches: [],
    neuralNodes: [],
    stealthDenials: [],
    twinProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalSearchKnowledgeInfrastructureHonesty(repoRoot?: string) {
  const preds = predecessorMap(repoRoot);
  return {
    permissionAwareSearchAcl: true,
    noCrossContextLeakage: true,
    neuralNodesEvidenceGated: true,
    antiMalwareNoStealthInstall: true,
    digitalTwinNeqFounder: true,
    softWiredPredecessors: Object.entries(preds)
      .filter(([, v]) => v.tipProbe === 'PRESENT')
      .map(([k]) => k),
    predecessors: preds,
  };
}

export async function permissionAwareSearch(input: {
  queryId: string;
  contextId: string;
  aclGranted: boolean;
  crossContextAttempt?: boolean;
  root: string;
  actor: EbActor;
}): Promise<GlobalSearchEvent> {
  const store = await load(input.root);
  void input.actor;
  if (store.searches.length >= MAX_SEARCH_EVENTS) {
    throw new Error('MAX_SEARCH_EVENTS_REACHED');
  }
  if (input.crossContextAttempt) {
    const denied: GlobalSearchEvent = {
      id: id('ebgs'),
      queryId: input.queryId.trim(),
      contextId: input.contextId.trim(),
      aclGranted: input.aclGranted,
      crossContextAttempt: true,
      status: 'denied',
      reason: SEARCH_CROSS_CONTEXT_DENIED,
      at: new Date().toISOString(),
    };
    store.searches.push(denied);
    await save(input.root, store);
    return denied;
  }
  if (!input.aclGranted) {
    const denied: GlobalSearchEvent = {
      id: id('ebgs'),
      queryId: input.queryId.trim(),
      contextId: input.contextId.trim(),
      aclGranted: false,
      crossContextAttempt: false,
      status: 'denied',
      reason: SEARCH_ACL_DENIED,
      at: new Date().toISOString(),
    };
    store.searches.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: GlobalSearchEvent = {
    id: id('ebgs'),
    queryId: input.queryId.trim(),
    contextId: input.contextId.trim(),
    aclGranted: true,
    crossContextAttempt: false,
    status: 'ok',
    reason: 'PERMISSION_AWARE_SEARCH_GRANTED',
    at: new Date().toISOString(),
  };
  store.searches.push(ok);
  await save(input.root, store);
  return ok;
}

export async function probeNeuralNode(input: {
  nodeId: string;
  evidencePresent: boolean;
  root: string;
  actor: EbActor;
}): Promise<NeuralNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: NeuralNodeProbe = {
    id: id('ebnn'),
    nodeId: input.nodeId.trim(),
    evidencePresent: input.evidencePresent,
    status: input.evidencePresent ? 'ok' : 'denied',
    state: input.evidencePresent ? 'VERIFIED' : 'NOT_VERIFIED',
    reason: input.evidencePresent
      ? 'NEURAL_NODE_EVIDENCE_PRESENT'
      : NEURAL_NODES_EVIDENCE_GATED,
    at: new Date().toISOString(),
  };
  store.neuralNodes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function denyStealthInstall(input: {
  attemptKind?:
    | 'stealth_install'
    | 'unauthorized_takeover'
    | 'permission_bypass'
    | 'silent_persistence';
  root: string;
  actor: EbActor;
}): Promise<StealthInstallDenial> {
  const store = await load(input.root);
  void input.actor;
  const denial: StealthInstallDenial = {
    id: id('ebsi'),
    attemptKind: input.attemptKind ?? 'stealth_install',
    status: 'denied',
    reason: STEALTH_INSTALL_DENIED,
    at: new Date().toISOString(),
  };
  store.stealthDenials.push(denial);
  await save(input.root, store);
  return denial;
}

export async function probeDigitalTwinAuthority(input: {
  actor: EbActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  const probe: TwinAuthorityProbe = {
    id: id('ebtwin'),
    actorId: input.actor.id,
    claimFounderAuthority: input.claimFounderAuthority,
    status: 'denied',
    reason: TWIN_NEQ_FOUNDER,
    at: new Date().toISOString(),
  };
  store.twinProbes.push(probe);
  await save(input.root, store);
  return probe;
}
