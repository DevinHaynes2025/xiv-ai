import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BM_LOCKS,
  LAYER_RESOURCE_BOUND,
  SPARSE_BOUNDS,
  UNBOUNDED_SPAWN_DENIED,
  type BmActor,
} from './org-neural-federation-types';

export const SYNAPSE_EXPANSION_FILE = 'multi-layer-synapse-expansion.json';

export type SynapseLayer = {
  id: string;
  federationId: string;
  index: number;
  label: string;
  /** Logical nodes only — not OS processes. */
  nodeCount: number;
  liveProcessSpawn: 0;
  activated: boolean;
  createdAt: string;
};

export type SparseNode = {
  id: string;
  layerId: string;
  kind: 'route' | 'index' | 'workcell' | 'pathway' | 'neuron';
  label: string;
  active: boolean;
  /** Explicit: not a live OS process. */
  liveProcess: false;
};

export type ExpansionAttempt = {
  id: string;
  at: string;
  federationId: string;
  requestedLayers: number;
  requestedNodesPerLayer: number;
  requestedLiveSpawn: number;
  accepted: boolean;
  reason: string;
  layersCreated: number;
  nodesCreated: number;
  liveProcessesSpawned: 0;
};

type ExpansionStore = {
  layers: SynapseLayer[];
  nodes: SparseNode[];
  attempts: ExpansionAttempt[];
};

const MAX_ATTEMPTS = 5_000;

function storePath(root: string) {
  return xivLocalPath(root, SYNAPSE_EXPANSION_FILE);
}

async function load(root: string): Promise<ExpansionStore> {
  const parsed = await readJsonFile<ExpansionStore>(storePath(root), {
    layers: [],
    nodes: [],
    attempts: [],
  });
  return {
    layers: Array.isArray(parsed.layers) ? parsed.layers : [],
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
    attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
  };
}

async function save(root: string, store: ExpansionStore) {
  await writeJsonFileAtomic(storePath(root), {
    layers: store.layers.slice(-(SPARSE_BOUNDS.maxLayers * 64)),
    nodes: store.nodes.slice(-(SPARSE_BOUNDS.maxLayers * SPARSE_BOUNDS.maxNodesPerLayer * 4)),
    attempts: store.attempts.slice(-MAX_ATTEMPTS),
  });
}

/**
 * Multi-layer synapse expansion with hard resource/activation bounds.
 * Neurons/layers are sparse logical graph nodes — never unbounded process spawn.
 */
export async function expandSynapseLayers(input: {
  federationId: string;
  layers?: number;
  nodesPerLayer?: number;
  /** Any request to spawn live OS processes is denied. */
  liveProcessSpawn?: number;
  activate?: boolean;
  actor: BmActor;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const requestedLayers = Math.max(0, Math.floor(input.layers ?? 1));
  const requestedNodes = Math.max(0, Math.floor(input.nodesPerLayer ?? 4));
  const requestedLiveSpawn = Math.max(0, Math.floor(input.liveProcessSpawn ?? 0));
  const existingForFed = store.layers.filter((l) => l.federationId === input.federationId);

  // Hard deny unbounded live process spawn.
  if (requestedLiveSpawn > SPARSE_BOUNDS.maxLiveProcessSpawn) {
    const attempt: ExpansionAttempt = {
      id: `exp_${randomUUID()}`,
      at: new Date(input.now ?? Date.now()).toISOString(),
      federationId: input.federationId,
      requestedLayers,
      requestedNodesPerLayer: requestedNodes,
      requestedLiveSpawn,
      accepted: false,
      reason: UNBOUNDED_SPAWN_DENIED,
      layersCreated: 0,
      nodesCreated: 0,
      liveProcessesSpawned: 0,
    };
    store.attempts.push(attempt);
    await save(root, store);
    return {
      accepted: false as const,
      reason: UNBOUNDED_SPAWN_DENIED,
      attempt,
      liveProcessesSpawned: 0 as const,
      locks: {
        NEURONS_ARE_LIVE_PROCESS_SPAWN: BM_LOCKS.NEURONS_ARE_LIVE_PROCESS_SPAWN,
        NEURONS_ARE_SPARSE_LOGICAL_NODES: BM_LOCKS.NEURONS_ARE_SPARSE_LOGICAL_NODES,
      },
    };
  }

  const room = SPARSE_BOUNDS.maxLayers - existingForFed.length;
  if (room <= 0 || requestedLayers > room || requestedLayers > SPARSE_BOUNDS.maxLayers) {
    const attempt: ExpansionAttempt = {
      id: `exp_${randomUUID()}`,
      at: new Date(input.now ?? Date.now()).toISOString(),
      federationId: input.federationId,
      requestedLayers,
      requestedNodesPerLayer: requestedNodes,
      requestedLiveSpawn,
      accepted: false,
      reason: LAYER_RESOURCE_BOUND,
      layersCreated: 0,
      nodesCreated: 0,
      liveProcessesSpawned: 0,
    };
    store.attempts.push(attempt);
    await save(root, store);
    return {
      accepted: false as const,
      reason: LAYER_RESOURCE_BOUND,
      attempt,
      bounds: SPARSE_BOUNDS,
    };
  }

  if (requestedNodes > SPARSE_BOUNDS.maxNodesPerLayer) {
    const attempt: ExpansionAttempt = {
      id: `exp_${randomUUID()}`,
      at: new Date(input.now ?? Date.now()).toISOString(),
      federationId: input.federationId,
      requestedLayers,
      requestedNodesPerLayer: requestedNodes,
      requestedLiveSpawn,
      accepted: false,
      reason: LAYER_RESOURCE_BOUND,
      layersCreated: 0,
      nodesCreated: 0,
      liveProcessesSpawned: 0,
    };
    store.attempts.push(attempt);
    await save(root, store);
    return {
      accepted: false as const,
      reason: LAYER_RESOURCE_BOUND,
      attempt,
      bounds: SPARSE_BOUNDS,
    };
  }

  const activate = input.activate === true;
  const activeWorkcells = store.nodes.filter((n) => n.kind === 'workcell' && n.active).length;
  if (activate && activeWorkcells + requestedLayers * requestedNodes > SPARSE_BOUNDS.maxActiveWorkcells) {
    // Cap activation — still allow declaring inactive logical nodes within layer/node bounds.
  }

  const createdLayers: SynapseLayer[] = [];
  const createdNodes: SparseNode[] = [];
  const nowIso = new Date(input.now ?? Date.now()).toISOString();

  for (let i = 0; i < requestedLayers; i++) {
    const layer: SynapseLayer = {
      id: `layer_${randomUUID()}`,
      federationId: input.federationId,
      index: existingForFed.length + i,
      label: `sparse-layer-${existingForFed.length + i}`,
      nodeCount: requestedNodes,
      liveProcessSpawn: 0,
      activated: activate,
      createdAt: nowIso,
    };
    createdLayers.push(layer);
    store.layers.push(layer);

    for (let j = 0; j < requestedNodes; j++) {
      const kind =
        j % 5 === 0
          ? 'workcell'
          : j % 5 === 1
            ? 'route'
            : j % 5 === 2
              ? 'index'
              : j % 5 === 3
                ? 'pathway'
                : 'neuron';
      const active =
        activate &&
        kind === 'workcell' &&
        store.nodes.filter((n) => n.kind === 'workcell' && n.active).length +
          createdNodes.filter((n) => n.kind === 'workcell' && n.active).length <
          SPARSE_BOUNDS.maxActiveWorkcells;
      const node: SparseNode = {
        id: `node_${randomUUID()}`,
        layerId: layer.id,
        kind,
        label: `${kind}-${j}`,
        active,
        liveProcess: false,
      };
      createdNodes.push(node);
      store.nodes.push(node);
    }
  }

  const attempt: ExpansionAttempt = {
    id: `exp_${randomUUID()}`,
    at: nowIso,
    federationId: input.federationId,
    requestedLayers,
    requestedNodesPerLayer: requestedNodes,
    requestedLiveSpawn,
    accepted: true,
    reason: 'SPARSE_LOGICAL_LAYER_EXPANSION',
    layersCreated: createdLayers.length,
    nodesCreated: createdNodes.length,
    liveProcessesSpawned: 0,
  };
  store.attempts.push(attempt);
  await save(root, store);

  return {
    accepted: true as const,
    reason: 'SPARSE_LOGICAL_LAYER_EXPANSION',
    layers: createdLayers,
    nodes: createdNodes,
    attempt,
    liveProcessesSpawned: 0 as const,
    bounds: SPARSE_BOUNDS,
    locks: {
      NEURONS_ARE_SPARSE_LOGICAL_NODES: BM_LOCKS.NEURONS_ARE_SPARSE_LOGICAL_NODES,
      UNBOUNDED_LAYER_EXPANSION: BM_LOCKS.UNBOUNDED_LAYER_EXPANSION,
    },
  };
}

export async function listSynapseLayers(input: { federationId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.layers.filter((l) => l.federationId === input.federationId);
}

export function synapseExpansionHonesty() {
  return {
    neuronsAreLiveProcessSpawn: BM_LOCKS.NEURONS_ARE_LIVE_PROCESS_SPAWN,
    neuronsAreSparseLogicalNodes: BM_LOCKS.NEURONS_ARE_SPARSE_LOGICAL_NODES,
    unboundedLayerExpansion: BM_LOCKS.UNBOUNDED_LAYER_EXPANSION,
    bounds: SPARSE_BOUNDS,
    maxLiveProcessSpawn: SPARSE_BOUNDS.maxLiveProcessSpawn,
    productionAuthorization: false as const,
  };
}
