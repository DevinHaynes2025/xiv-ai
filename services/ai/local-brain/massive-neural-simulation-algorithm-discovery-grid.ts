/**
 * 62L-CR F — Massive Neural Simulation & Algorithm Discovery Grid
 * Sparse massive neural simulations; algorithm/pathway miner from historical evidence.
 * Activation bounded (no unbounded process spawn).
 * Correlation ≠ causation; learning ≠ permission.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CORRELATION_TO_CAUSATION_DENIED,
  CR_LOCKS,
  HONESTY_BANNER,
  LOGICAL_NEURON_ADDRESS_CEILING,
  LOGICAL_PATHWAY_CEILING,
  MAX_ACTIVE_NEURAL_SIM_WALKERS,
  NEURAL_UNBOUNDED_SPAWN_DENIED,
  type CrActor,
} from './hybrid-supercompute-universe-os-types';

export type NeuralSimScale = {
  logicalNeurons: number;
  materializedNeurons: number;
  runningWalkers: number;
  logicalPathways: number;
  materializedPathways: number;
  note: string;
};

export type NeuralSimActivation = {
  id: string;
  label: string;
  requestedWalkers: number;
  activatedWalkers: number;
  status: 'activated' | 'denied' | 'bounded';
  reason: string;
  scale: NeuralSimScale;
  at: string;
};

export type PathwayFinding = {
  id: string;
  claim: string;
  kind: 'correlation' | 'hypothesis' | 'causation_candidate';
  evidenceRefs: string[];
  verifiedCausation: false;
  status: 'recorded' | 'rejected';
  reason: string;
  at: string;
};

export type CausationPromotionAttempt = {
  id: string;
  findingId: string;
  evidenceSufficient: boolean;
  status: 'denied' | 'candidate_only';
  reason: string;
  at: string;
};

type Store = {
  activations: NeuralSimActivation[];
  findings: PathwayFinding[];
  promotions: CausationPromotionAttempt[];
  activeWalkers: number;
};

function storePath(root: string) {
  return xivLocalPath(root, 'massive-neural-simulation-algorithm-discovery-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    activations: [],
    findings: [],
    promotions: [],
    activeWalkers: 0,
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function neuralDiscoveryHonesty() {
  return {
    banner: HONESTY_BANNER,
    activationBounded: CR_LOCKS.NEURAL_SIM_ACTIVATION_BOUNDED,
    unboundedSpawn: CR_LOCKS.UNBOUNDED_PROCESS_SPAWN,
    correlationEqCausation: CR_LOCKS.PATHWAY_CORRELATION_EQ_CAUSATION,
    causationWithoutEvidence: CR_LOCKS.CAUSATION_WITHOUT_EVIDENCE,
    learningGrantsPermission: CR_LOCKS.LEARNING_GRANTS_PERMISSION,
  };
}

export function buildNeuralScale(input?: {
  logicalNeurons?: number;
  materializedNeurons?: number;
  runningWalkers?: number;
  logicalPathways?: number;
  materializedPathways?: number;
}): NeuralSimScale {
  return {
    logicalNeurons: Math.min(
      input?.logicalNeurons ?? LOGICAL_NEURON_ADDRESS_CEILING,
      LOGICAL_NEURON_ADDRESS_CEILING,
    ),
    materializedNeurons: Math.max(0, input?.materializedNeurons ?? 0),
    runningWalkers: Math.max(0, input?.runningWalkers ?? 0),
    logicalPathways: Math.min(
      input?.logicalPathways ?? LOGICAL_PATHWAY_CEILING,
      LOGICAL_PATHWAY_CEILING,
    ),
    materializedPathways: Math.max(0, input?.materializedPathways ?? 0),
    note: 'SPARSE_LOGICAL_NEURAL_ADDRESS_SPACE_NOT_UNBOUNDED_PROCESS_SPAWN',
  };
}

export async function activateNeuralSim(input: {
  label: string;
  requestedWalkers: number;
  unboundedSpawnRequested?: boolean;
  root: string;
  actor: CrActor;
}): Promise<NeuralSimActivation> {
  const store = await load(input.root);

  if (input.unboundedSpawnRequested === true) {
    const denied: NeuralSimActivation = {
      id: id('nsim'),
      label: input.label,
      requestedWalkers: input.requestedWalkers,
      activatedWalkers: 0,
      status: 'denied',
      reason: NEURAL_UNBOUNDED_SPAWN_DENIED,
      scale: buildNeuralScale({
        runningWalkers: store.activeWalkers,
      }),
      at: new Date().toISOString(),
    };
    void input.actor;
    store.activations.push(denied);
    await save(input.root, store);
    return denied;
  }

  const room = Math.max(0, MAX_ACTIVE_NEURAL_SIM_WALKERS - store.activeWalkers);
  const activate = Math.min(Math.max(0, input.requestedWalkers), room);
  store.activeWalkers += activate;
  const status: NeuralSimActivation['status'] =
    activate === 0
      ? 'denied'
      : activate < input.requestedWalkers
        ? 'bounded'
        : 'activated';
  const activation: NeuralSimActivation = {
    id: id('nsim'),
    label: input.label,
    requestedWalkers: input.requestedWalkers,
    activatedWalkers: activate,
    status,
    reason:
      status === 'denied'
        ? `NEURAL_SIM_BOUNDED_MAX_${MAX_ACTIVE_NEURAL_SIM_WALKERS}`
        : status === 'bounded'
          ? NEURAL_UNBOUNDED_SPAWN_DENIED
          : 'NEURAL_SIM_WALKERS_ACTIVATED_BOUNDED',
    scale: buildNeuralScale({
      logicalNeurons: LOGICAL_NEURON_ADDRESS_CEILING,
      materializedNeurons: activate,
      runningWalkers: store.activeWalkers,
      logicalPathways: LOGICAL_PATHWAY_CEILING,
      materializedPathways: activate,
    }),
    at: new Date().toISOString(),
  };
  store.activations.push(activation);
  await save(input.root, store);
  return activation;
}

export async function recordPathwayFinding(input: {
  claim: string;
  kind: PathwayFinding['kind'];
  evidenceRefs?: string[];
  root: string;
  actor: CrActor;
}): Promise<PathwayFinding> {
  const store = await load(input.root);
  const evidenceRefs = input.evidenceRefs ?? [];
  const finding: PathwayFinding = {
    id: id('pathfind'),
    claim: input.claim,
    kind: input.kind,
    evidenceRefs,
    verifiedCausation: false,
    status: 'recorded',
    reason:
      input.kind === 'causation_candidate'
        ? 'CAUSATION_CANDIDATE_ONLY_NOT_VERIFIED'
        : 'CORRELATION_OR_HYPOTHESIS_RECORDED_NOT_CAUSATION',
    at: new Date().toISOString(),
  };
  void input.actor;
  store.findings.push(finding);
  await save(input.root, store);
  return finding;
}

export async function attemptCausationPromotion(input: {
  findingId: string;
  evidenceSufficient?: boolean;
  root: string;
  actor: CrActor;
}): Promise<CausationPromotionAttempt> {
  const store = await load(input.root);
  const finding = store.findings.find((f) => f.id === input.findingId);
  const evidenceSufficient =
    input.evidenceSufficient === true &&
    !!finding &&
    finding.evidenceRefs.length > 0;

  // Even with evidence, this layer only emits candidates — never auto-verified causation.
  const attempt: CausationPromotionAttempt = {
    id: id('causprom'),
    findingId: input.findingId,
    evidenceSufficient,
    status: evidenceSufficient ? 'candidate_only' : 'denied',
    reason: evidenceSufficient
      ? 'CAUSATION_REMAINS_CANDIDATE_NOT_AUTO_VERIFIED'
      : CORRELATION_TO_CAUSATION_DENIED,
    at: new Date().toISOString(),
  };
  void input.actor;
  store.promotions.push(attempt);
  await save(input.root, store);
  return attempt;
}
