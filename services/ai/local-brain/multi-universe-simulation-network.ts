/**
 * 62L-EG Module G — Multi-Universe Simulation Network.
 * Isolated simulation branches — NOT literal alternate realities.
 * “Wormholes” = low-latency routing / cache / index shortcuts —
 * NOT literal spacetime wormholes. Sim ≠ verified fact.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARCHITECTURE_TRANSLATIONS,
  ISOLATED_SIM_NEQ_LITERAL,
  MAX_SIM_NETWORK,
  SIM_NEQ_FACT,
  WORMHOLE_EQ_ROUTING_SHORTCUT,
  type EgActor,
  type EgEvidenceState,
} from './cognitive-operations-backbone-types';

export type IsolatedSimBranch = {
  id: string;
  branchId: string;
  claimLiteralUniverse: boolean;
  status: 'isolated_sim' | 'denied';
  state: EgEvidenceState;
  reason: string;
  literalUniverse: false;
  translation: typeof ARCHITECTURE_TRANSLATIONS.parallelUniversesMeans;
  at: string;
};

export type WormholeShortcut = {
  id: string;
  shortcutId: string;
  kind: 'routing' | 'cache' | 'index';
  claimSpacetimeWormhole: boolean;
  status: 'routing_shortcut' | 'denied';
  state: EgEvidenceState;
  reason: string;
  spacetimeWormhole: false;
  translation: typeof ARCHITECTURE_TRANSLATIONS.wormholesMeans;
  at: string;
};

export type SimFactProbe = {
  id: string;
  simId: string;
  claimVerifiedFact: boolean;
  status: 'labeled_simulation' | 'denied';
  state: EgEvidenceState;
  reason: string;
  verifiedFact: false;
  at: string;
};

type Store = {
  branches: IsolatedSimBranch[];
  wormholes: WormholeShortcut[];
  sims: SimFactProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-universe-simulation-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    branches: [],
    wormholes: [],
    sims: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function multiUniverseSimulationNetworkHonesty() {
  return {
    isolatedSimBranchesOnly: true,
    literalUniverses: false,
    wormholeMeansRoutingCacheIndexShortcut: true,
    spacetimeWormholes: false,
    simNeqVerifiedFact: true,
    translations: {
      universes: ARCHITECTURE_TRANSLATIONS.parallelUniversesMeans,
      wormholes: ARCHITECTURE_TRANSLATIONS.wormholesMeans,
    },
  };
}

export async function registerIsolatedSimBranch(input: {
  branchId: string;
  claimLiteralUniverse?: boolean;
  root: string;
  actor: EgActor;
}): Promise<IsolatedSimBranch> {
  const store = await load(input.root);
  void input.actor;
  if (store.branches.length >= MAX_SIM_NETWORK) {
    throw new Error('MAX_SIM_NETWORK_REACHED');
  }
  const claim = Boolean(input.claimLiteralUniverse);
  const branch: IsolatedSimBranch = {
    id: id('egbranch'),
    branchId: input.branchId.trim(),
    claimLiteralUniverse: claim,
    status: claim ? 'denied' : 'isolated_sim',
    state: claim ? 'DENIED' : 'ISOLATED_SIM_BRANCH',
    reason: ISOLATED_SIM_NEQ_LITERAL,
    literalUniverse: false,
    translation: ARCHITECTURE_TRANSLATIONS.parallelUniversesMeans,
    at: new Date().toISOString(),
  };
  store.branches.push(branch);
  await save(input.root, store);
  return branch;
}

export async function registerWormholeShortcut(input: {
  shortcutId: string;
  kind: 'routing' | 'cache' | 'index';
  claimSpacetimeWormhole?: boolean;
  root: string;
  actor: EgActor;
}): Promise<WormholeShortcut> {
  const store = await load(input.root);
  void input.actor;
  if (store.wormholes.length >= MAX_SIM_NETWORK) {
    throw new Error('MAX_SIM_NETWORK_REACHED');
  }
  const claim = Boolean(input.claimSpacetimeWormhole);
  const shortcut: WormholeShortcut = {
    id: id('egwh'),
    shortcutId: input.shortcutId.trim(),
    kind: input.kind,
    claimSpacetimeWormhole: claim,
    status: claim ? 'denied' : 'routing_shortcut',
    state: claim ? 'DENIED' : 'ROUTING_SHORTCUT',
    reason: WORMHOLE_EQ_ROUTING_SHORTCUT,
    spacetimeWormhole: false,
    translation: ARCHITECTURE_TRANSLATIONS.wormholesMeans,
    at: new Date().toISOString(),
  };
  store.wormholes.push(shortcut);
  await save(input.root, store);
  return shortcut;
}

export async function probeSimAsFact(input: {
  simId: string;
  claimVerifiedFact?: boolean;
  root: string;
  actor: EgActor;
}): Promise<SimFactProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.sims.length >= MAX_SIM_NETWORK) {
    throw new Error('MAX_SIM_NETWORK_REACHED');
  }
  const claim = Boolean(input.claimVerifiedFact);
  const probe: SimFactProbe = {
    id: id('egsim'),
    simId: input.simId.trim(),
    claimVerifiedFact: claim,
    status: claim ? 'denied' : 'labeled_simulation',
    state: claim ? 'DENIED' : 'LABELED_SIMULATION',
    reason: SIM_NEQ_FACT,
    verifiedFact: false,
    at: new Date().toISOString(),
  };
  store.sims.push(probe);
  await save(input.root, store);
  return probe;
}
