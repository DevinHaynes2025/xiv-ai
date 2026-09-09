/**
 * 62L-DT Module H — Neural growth nodes.
 * Soft-wire DS/DR/DQ/DP; private Universes; deny-by-default;
 * offline WAITING_NODE / OFFLINE_STOPPED; wedge-first gate.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  detectPredecessorLayer,
  MAX_NEURAL_GROWTH_NODES,
  NEURAL_GROWTH_SEALED_DENIED,
  OFFLINE_WAITING_OR_STOPPED,
  predecessorMap,
  WEDGE_FIRST_GATED,
  type DtActor,
  type DtEvidenceState,
} from './growth-operating-system-types';

export type NeuralGrowthNode = {
  id: string;
  kind: 'growth' | 'revenue' | 'customer' | 'partnership' | 'pricing' | 'launch' | 'retention';
  universeId: string;
  sealed: boolean;
  grantsAuthority: false;
  softWiredPredecessors: string[];
  createdAt: string;
};

export type SealedGrowthAccess = {
  id: string;
  nodeId: string;
  explicitGrant: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

export type OfflineNodeProbe = {
  id: string;
  poweredAuthorizedNode: boolean;
  state: Extract<DtEvidenceState, 'WAITING_NODE' | 'OFFLINE_STOPPED' | 'AVAILABLE'>;
  reason: string;
  at: string;
};

export type WedgeGate = {
  id: string;
  wedgeProofPresent: boolean;
  attemptBroaderNetwork: boolean;
  status: 'allowed_wedge' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  nodes: NeuralGrowthNode[];
  sealedAccess: SealedGrowthAccess[];
  offlineProbes: OfflineNodeProbe[];
  wedgeGates: WedgeGate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'neural-growth-nodes.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    sealedAccess: [],
    offlineProbes: [],
    wedgeGates: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function softWireList(repoRoot?: string): string[] {
  const map = predecessorMap(repoRoot);
  return (['DS', 'DR', 'DQ', 'DP'] as const).filter((k) => map[k].tipProbe === 'PRESENT');
}

export function neuralGrowthNodesHonesty(repoRoot?: string) {
  return {
    founderSealedDenyByDefault: true,
    labelAloneEqAccess: false,
    grantsAuthorityOnCreate: false,
    wedgeFirst: true,
    broaderNetworkBeforeWedgeProof: false,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    softWiredPredecessors: softWireList(repoRoot),
    predecessorMap: predecessorMap(repoRoot),
  };
}

export async function createNeuralGrowthNode(input: {
  kind: NeuralGrowthNode['kind'];
  universeId: string;
  sealed?: boolean;
  root: string;
  actor: DtActor;
  repoRoot?: string;
}): Promise<NeuralGrowthNode> {
  const store = await load(input.root);
  void input.actor;
  if (store.nodes.length >= MAX_NEURAL_GROWTH_NODES) {
    throw new Error('MAX_NEURAL_GROWTH_NODES_REACHED');
  }
  const node: NeuralGrowthNode = {
    id: id('dtnode'),
    kind: input.kind,
    universeId: input.universeId,
    sealed: input.sealed !== false,
    grantsAuthority: false,
    softWiredPredecessors: softWireList(input.repoRoot),
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function accessSealedGrowthNode(input: {
  nodeId: string;
  explicitGrant: boolean;
  root: string;
  actor: DtActor;
}): Promise<SealedGrowthAccess> {
  const store = await load(input.root);
  void input.actor;
  const access: SealedGrowthAccess = {
    id: id('dtseal'),
    nodeId: input.nodeId,
    explicitGrant: input.explicitGrant,
    status: input.explicitGrant ? 'allowed' : 'denied',
    reason: input.explicitGrant
      ? 'SEALED_GROWTH_NODE_EXPLICIT_GRANT'
      : NEURAL_GROWTH_SEALED_DENIED,
    at: new Date().toISOString(),
  };
  store.sealedAccess.push(access);
  await save(input.root, store);
  return access;
}

export async function probeOfflineGrowthNode(input: {
  poweredAuthorizedNode: boolean;
  preferWaiting?: boolean;
  root: string;
  actor: DtActor;
}): Promise<OfflineNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  let state: OfflineNodeProbe['state'];
  let reason: string;
  if (input.poweredAuthorizedNode) {
    state = 'AVAILABLE';
    reason = 'POWERED_AUTHORIZED_NODE_PRESENT';
  } else if (input.preferWaiting !== false) {
    state = 'WAITING_NODE';
    reason = OFFLINE_WAITING_OR_STOPPED;
  } else {
    state = 'OFFLINE_STOPPED';
    reason = OFFLINE_WAITING_OR_STOPPED;
  }
  const probe: OfflineNodeProbe = {
    id: id('dtoff'),
    poweredAuthorizedNode: input.poweredAuthorizedNode,
    state,
    reason,
    at: new Date().toISOString(),
  };
  store.offlineProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function evaluateWedgeFirstGate(input: {
  wedgeProofPresent: boolean;
  attemptBroaderNetwork?: boolean;
  root: string;
  actor: DtActor;
}): Promise<WedgeGate> {
  const store = await load(input.root);
  void input.actor;
  const broader = input.attemptBroaderNetwork === true;
  const allowed = !broader || input.wedgeProofPresent;
  const gate: WedgeGate = {
    id: id('dtwedge'),
    wedgeProofPresent: input.wedgeProofPresent,
    attemptBroaderNetwork: broader,
    status: allowed ? 'allowed_wedge' : 'denied',
    reason: allowed
      ? input.wedgeProofPresent && broader
        ? 'WEDGE_PROOF_PRESENT_BROADER_NETWORK_CANDIDATE'
        : 'WEDGE_FIRST_PATH_ALLOWED'
      : WEDGE_FIRST_GATED,
    at: new Date().toISOString(),
  };
  store.wedgeGates.push(gate);
  await save(input.root, store);
  return gate;
}

/** Soft-wire helper: detect DP plugin civilization presence (always expected on this base). */
export function detectDpSoftWire(repoRoot?: string): boolean {
  const brain = repoRoot
    ? join(repoRoot, 'services/ai/local-brain')
    : join(process.cwd(), 'services/ai/local-brain');
  return (
    existsSync(join(brain, 'plugin-civilization-os-types.ts')) ||
    existsSync(join(brain, 'plugin-civilization-os.ts'))
  );
}
