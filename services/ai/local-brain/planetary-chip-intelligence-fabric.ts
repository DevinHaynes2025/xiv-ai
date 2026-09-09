/**
 * 62L-BW Planetary Chip Intelligence Fabric — semiconductor supply/history mapping,
 * workload-to-chip optimization (verified targets only), quantum-informed research
 * with classical baselines. No quantum advantage without evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BW_LOCKS,
  CAPACITY_UNVERIFIED,
  CHIP_TARGET_UNVERIFIED,
  HONESTY_BANNER,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED,
  QUANTUM_NO_ADVANTAGE_WITHOUT_EVIDENCE,
  type BwActor,
} from './planetary-chip-founder-avatar-ethics-types';

export type ChipClass =
  | 'cpu'
  | 'gpu'
  | 'npu'
  | 'tpu'
  | 'fpga'
  | 'asic'
  | 'mcu'
  | 'quantum_simulator'
  | 'quantum_qpu'
  | 'unknown';

export type ChipRecord = {
  id: string;
  vendor: string;
  family: string;
  chipClass: ChipClass;
  processNm?: number;
  supplyRegion?: string;
  historyNotes: string[];
  verifiedTarget: boolean;
  evidenceRefs: string[];
  productionAuthorization: false;
  createdAt: string;
};

export type WorkloadChipCandidate = {
  id: string;
  workloadId: string;
  chipId: string;
  status: 'candidate' | 'verified_target' | 'denied';
  reason: string;
  recommendationOnly: true;
  autoDeploy: false;
};

export type QuantumChipRoute = {
  id: string;
  objective: string;
  classicalBaselineId: string | null;
  classicalBaselinePresent: boolean;
  quantumBackend: 'classical_simulator' | 'quantum_simulator' | 'quantum_qpu' | 'unavailable';
  backendVerified: boolean;
  status: 'candidate' | 'denied' | 'unavailable' | 'compared';
  claimsQuantumAdvantage: false;
  reason: string;
};

type Store = {
  chips: ChipRecord[];
  candidates: WorkloadChipCandidate[];
  quantumRoutes: QuantumChipRoute[];
  capacityBenchmarks: Array<{
    id: string;
    claim: string;
    metric: string;
    value: number;
    unit: string;
    evidenceRefs: string[];
    labeledVerified: boolean;
    createdAt: string;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'planetary-chip-intelligence-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    chips: [],
    candidates: [],
    quantumRoutes: [],
    capacityBenchmarks: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function chipFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BW_LOCKS.L4_AUTONOMY_ENABLED,
    quantumAdvantageWithoutEvidence: BW_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE,
    quantumWithoutClassicalBaseline: BW_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE,
    capacityRequiresBenchmark: BW_LOCKS.CAPACITY_REQUIRES_BENCHMARK,
    sparseLogicalOnly: BW_LOCKS.SPARSE_LOGICAL_ONLY,
  };
}

export async function registerChipIntelligence(input: {
  vendor: string;
  family: string;
  chipClass: ChipClass;
  processNm?: number;
  supplyRegion?: string;
  historyNotes?: string[];
  verifiedTarget?: boolean;
  evidenceRefs?: string[];
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const verified =
    input.verifiedTarget === true &&
    Array.isArray(input.evidenceRefs) &&
    input.evidenceRefs.length > 0;
  const chip: ChipRecord = {
    id: id('chip'),
    vendor: input.vendor.trim(),
    family: input.family.trim(),
    chipClass: input.chipClass,
    processNm: input.processNm,
    supplyRegion: input.supplyRegion,
    historyNotes: input.historyNotes ?? [],
    verifiedTarget: verified,
    evidenceRefs: input.evidenceRefs ?? [],
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  store.chips.push(chip);
  await save(root, store);
  return {
    accepted: true as const,
    chip,
    labeledVerified: verified,
    reason: verified ? 'CHIP_VERIFIED_TARGET_WITH_EVIDENCE' : 'CHIP_DOCUMENTED_CANDIDATE',
  };
}

export async function listChipIntelligence(root?: string) {
  const store = await load(root ?? process.cwd());
  return store.chips;
}

/**
 * Workload→chip optimization returns candidates; only verified targets may be labeled verified.
 */
export async function optimizeWorkloadToChip(input: {
  workloadId: string;
  chipId: string;
  claimVerifiedWithoutProof?: boolean;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const chip = store.chips.find((c) => c.id === input.chipId);
  if (!chip) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      reason: 'CHIP_NOT_FOUND',
      recommendationOnly: true as const,
      autoDeploy: false as const,
    };
  }
  if (input.claimVerifiedWithoutProof && !chip.verifiedTarget) {
    const candidate: WorkloadChipCandidate = {
      id: id('wchip'),
      workloadId: input.workloadId,
      chipId: chip.id,
      status: 'denied',
      reason: CHIP_TARGET_UNVERIFIED,
      recommendationOnly: true,
      autoDeploy: false,
    };
    store.candidates.push(candidate);
    await save(root, store);
    return {
      accepted: false as const,
      candidate,
      status: 'denied' as const,
      labeledVerified: false as const,
      reason: CHIP_TARGET_UNVERIFIED,
      recommendationOnly: true as const,
      autoDeploy: false as const,
    };
  }
  const status = chip.verifiedTarget ? 'verified_target' : 'candidate';
  const candidate: WorkloadChipCandidate = {
    id: id('wchip'),
    workloadId: input.workloadId,
    chipId: chip.id,
    status,
    reason:
      status === 'verified_target'
        ? 'VERIFIED_CHIP_TARGET'
        : CHIP_TARGET_UNVERIFIED,
    recommendationOnly: true,
    autoDeploy: false,
  };
  store.candidates.push(candidate);
  await save(root, store);
  return {
    accepted: true as const,
    candidate,
    status,
    labeledVerified: status === 'verified_target',
    reason: candidate.reason,
    recommendationOnly: true as const,
    autoDeploy: false as const,
  };
}

/**
 * Quantum-informed research requires classical baseline; QPU/simulator only when
 * available+verified; no quantum advantage without evidence.
 */
export async function routeQuantumInformedResearch(input: {
  objective: string;
  classicalBaselineId?: string | null;
  classicalBaselinePresent?: boolean;
  quantumBackend?: QuantumChipRoute['quantumBackend'];
  backendVerified?: boolean;
  claimQuantumAdvantage?: boolean;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const baselinePresent =
    input.classicalBaselinePresent === true ||
    (!!input.classicalBaselineId && input.classicalBaselineId.trim().length > 0);

  if (!baselinePresent) {
    const route: QuantumChipRoute = {
      id: id('qroute'),
      objective: input.objective,
      classicalBaselineId: input.classicalBaselineId ?? null,
      classicalBaselinePresent: false,
      quantumBackend: input.quantumBackend ?? 'unavailable',
      backendVerified: false,
      status: 'denied',
      claimsQuantumAdvantage: false,
      reason: QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    };
    store.quantumRoutes.push(route);
    await save(root, store);
    return {
      accepted: false as const,
      route,
      reason: QUANTUM_CLASSICAL_BASELINE_REQUIRED,
      claimsQuantumAdvantage: false as const,
    };
  }

  if (input.claimQuantumAdvantage) {
    const route: QuantumChipRoute = {
      id: id('qroute'),
      objective: input.objective,
      classicalBaselineId: input.classicalBaselineId ?? null,
      classicalBaselinePresent: true,
      quantumBackend: input.quantumBackend ?? 'classical_simulator',
      backendVerified: input.backendVerified === true,
      status: 'denied',
      claimsQuantumAdvantage: false,
      reason: QUANTUM_NO_ADVANTAGE_WITHOUT_EVIDENCE,
    };
    store.quantumRoutes.push(route);
    await save(root, store);
    return {
      accepted: false as const,
      route,
      reason: QUANTUM_NO_ADVANTAGE_WITHOUT_EVIDENCE,
      claimsQuantumAdvantage: false as const,
    };
  }

  const backend = input.quantumBackend ?? 'classical_simulator';
  const needsExternal = backend === 'quantum_simulator' || backend === 'quantum_qpu';
  if (needsExternal && input.backendVerified !== true) {
    const route: QuantumChipRoute = {
      id: id('qroute'),
      objective: input.objective,
      classicalBaselineId: input.classicalBaselineId ?? null,
      classicalBaselinePresent: true,
      quantumBackend: 'unavailable',
      backendVerified: false,
      status: 'unavailable',
      claimsQuantumAdvantage: false,
      reason: 'QUANTUM_BACKEND_UNAVAILABLE_UNTIL_VERIFIED',
    };
    store.quantumRoutes.push(route);
    await save(root, store);
    return {
      accepted: false as const,
      route,
      status: 'unavailable' as const,
      reason: route.reason,
      claimsQuantumAdvantage: false as const,
    };
  }

  const route: QuantumChipRoute = {
    id: id('qroute'),
    objective: input.objective,
    classicalBaselineId: input.classicalBaselineId ?? 'classical_baseline',
    classicalBaselinePresent: true,
    quantumBackend: backend,
    backendVerified: needsExternal ? true : backend === 'classical_simulator',
    status: 'compared',
    claimsQuantumAdvantage: false,
    reason: 'QUANTUM_ROUTE_COMPARED_WITH_CLASSICAL_BASELINE',
  };
  store.quantumRoutes.push(route);
  await save(root, store);
  return {
    accepted: true as const,
    route,
    reason: route.reason,
    claimsQuantumAdvantage: false as const,
  };
}

/**
 * Capacity / partition claims require benchmark evidence else not VERIFIED.
 */
export async function recordCapacityPartitionClaim(input: {
  claim: string;
  metric: string;
  value: number;
  unit: string;
  evidenceRefs?: string[];
  forceVerifiedWithoutBenchmark?: boolean;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const hasBench =
    Array.isArray(input.evidenceRefs) &&
    input.evidenceRefs.some((r) => /bench|benchmark|measure/i.test(r));

  if (input.forceVerifiedWithoutBenchmark || !hasBench) {
    return {
      accepted: input.forceVerifiedWithoutBenchmark ? (false as const) : (true as const),
      labeledVerified: false as const,
      reason: CAPACITY_UNVERIFIED,
      record: null,
    };
  }

  const record = {
    id: id('cap'),
    claim: input.claim,
    metric: input.metric,
    value: input.value,
    unit: input.unit,
    evidenceRefs: input.evidenceRefs ?? [],
    labeledVerified: true,
    createdAt: new Date().toISOString(),
  };
  store.capacityBenchmarks.push(record);
  await save(root, store);
  return {
    accepted: true as const,
    labeledVerified: true as const,
    reason: 'CAPACITY_CLAIM_VERIFIED_WITH_BENCHMARK',
    record,
  };
}
