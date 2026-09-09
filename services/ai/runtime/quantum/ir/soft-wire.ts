/**
 * 62L-EX16 — soft-wire probes via existsSync for EX1–EX15 +
 * history / offlinepacks / quantum / agentmesh / chipgraph / workload-genome.
 * Presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL).
 * Historical atlas soft-wire → CANDIDATE not VERIFIED.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SoftWirePresence } from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const QUANTUM_DIR = join(HERE, '..');
const RUNTIME_DIR = join(HERE, '..', '..');
const AI_ROOT = join(RUNTIME_DIR, '..');
const WORKTREE_ROOT = join(AI_ROOT, '..', '..');
const WORKSPACE_PARENT = join(WORKTREE_ROOT, '..');

function softWire(
  pathChecked: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
    verified: false,
    disposition: present ? 'PRESENT_UNVERIFIED' : 'WAITING_DATA',
  };
}

function firstExisting(
  candidates: string[],
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  for (const pathChecked of candidates) {
    if (existsSync(pathChecked)) {
      return {
        present: true,
        pathChecked,
        note: notePresent,
        verified: false,
        disposition: 'PRESENT_UNVERIFIED',
      };
    }
  }
  return {
    present: false,
    pathChecked: candidates[0]!,
    note: noteAbsent,
    verified: false,
    disposition: 'WAITING_DATA',
  };
}

export type Ex16SoftWireSnapshot = {
  ex1Mission: SoftWirePresence;
  ex2Baseline: SoftWirePresence;
  ex3AlgorithmLab: SoftWirePresence;
  ex4SimulatorRegistry: SoftWirePresence;
  ex5QpuRegistry: SoftWirePresence;
  ex6PhysicalReceipt: SoftWirePresence;
  ex7HybridRouter: SoftWirePresence;
  ex8AgentTeam: SoftWirePresence;
  ex9WorkloadGenome: SoftWirePresence;
  ex10BenchmarkGate: SoftWirePresence;
  ex11EvidenceLedger: SoftWirePresence;
  ex12PathwayGraph: SoftWirePresence;
  ex13PathwayPlasticity: SoftWirePresence;
  ex14OfflineResearchPack: SoftWirePresence;
  ex15HistoricalAtlas: SoftWirePresence;
  historyRuntime: SoftWirePresence;
  offlinePacks: SoftWirePresence;
  agentMesh: SoftWirePresence;
  chipgraph: SoftWirePresence;
  guardian: SoftWirePresence;
  hybridRouter: SoftWirePresence;
};

export function auditEx16SoftWires(): Ex16SoftWireSnapshot {
  return {
    ex1Mission: firstExisting(
      [
        join(QUANTUM_DIR, 'mission.ts'),
        '/workspace/.wt-ex1/services/ai/runtime/quantum/mission.ts',
        join(WORKSPACE_PARENT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
        '/tmp/62l-ex1-work/services/ai/runtime/quantum/mission.ts',
      ],
      'EX1 mission contract soft-wired — presence ≠ VERIFIED.',
      'EX1 mission absent → WAITING_DATA.',
    ),
    ex2Baseline: firstExisting(
      [
        join(QUANTUM_DIR, 'baseline.ts'),
        '/workspace/.wt-ex2/services/ai/runtime/quantum/baseline.ts',
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'baseline.ts'),
        '/tmp/62l-ex2-work/services/ai/runtime/quantum/baseline.ts',
      ],
      'EX2 classical baseline soft-wired — presence ≠ VERIFIED.',
      'EX2 baseline absent → WAITING_DATA.',
    ),
    ex3AlgorithmLab: firstExisting(
      [
        join(QUANTUM_DIR, 'algorithm-registry.ts'),
        '/workspace/.wt-ex3/services/ai/runtime/quantum/algorithm-registry.ts',
        join(WORKSPACE_PARENT, '.wt-ex3', 'services', 'ai', 'runtime', 'quantum', 'algorithm-registry.ts'),
        '/tmp/62l-ex3-work/services/ai/runtime/quantum/algorithm-registry.ts',
      ],
      'EX3 algorithm lab soft-wired — presence ≠ VERIFIED.',
      'EX3 algorithm lab absent → WAITING_DATA.',
    ),
    ex4SimulatorRegistry: firstExisting(
      [
        join(QUANTUM_DIR, 'simulator-registry.ts'),
        '/tmp/62l-ex4-work/services/ai/runtime/quantum/simulator-registry.ts',
        '/workspace/.wt-ex4/services/ai/runtime/quantum/simulator-registry.ts',
      ],
      'EX4 simulator registry soft-wired — presence ≠ VERIFIED.',
      'EX4 simulator registry absent → WAITING_DATA.',
    ),
    ex5QpuRegistry: firstExisting(
      [
        join(QUANTUM_DIR, 'qpu-registry.ts'),
        join(QUANTUM_DIR, 'qpu-types.ts'),
        '/tmp/62l-ex5-work/services/ai/runtime/quantum/qpu-registry.ts',
      ],
      'EX5 QPU registry soft-wired — presence ≠ VERIFIED.',
      'EX5 QPU registry absent → WAITING_DATA.',
    ),
    ex6PhysicalReceipt: firstExisting(
      [
        join(QUANTUM_DIR, 'qpu-receipt.ts'),
        '/workspace/.wt-ex6/services/ai/runtime/quantum/qpu-receipt.ts',
        '/tmp/62l-ex6-work/services/ai/runtime/quantum/qpu-receipt.ts',
      ],
      'EX6 physical QPU receipt soft-wired — presence ≠ VERIFIED.',
      'EX6 physical receipt absent → WAITING_DATA.',
    ),
    ex7HybridRouter: firstExisting(
      [
        join(QUANTUM_DIR, 'hybrid-router.ts'),
        '/tmp/62l-ex7-work/services/ai/runtime/quantum/hybrid-router.ts',
        '/workspace/.wt-ex7/services/ai/runtime/quantum/hybrid-router.ts',
        '/workspace/.wt-ex8/services/ai/runtime/quantum/hybrid-router.ts',
      ],
      'EX7 hybrid router soft-wired — presence ≠ VERIFIED.',
      'EX7 hybrid router absent → WAITING_DATA.',
    ),
    ex8AgentTeam: firstExisting(
      [
        join(QUANTUM_DIR, 'agent-team.ts'),
        '/workspace/.wt-ex8/services/ai/runtime/quantum/agent-team.ts',
        '/tmp/62l-ex8-work/services/ai/runtime/quantum/agent-team.ts',
      ],
      'EX8 offline quantum agent team soft-wired — presence ≠ VERIFIED.',
      'EX8 agent team absent → WAITING_DATA.',
    ),
    ex9WorkloadGenome: firstExisting(
      [
        join(QUANTUM_DIR, 'workload-genome.ts'),
        '/workspace/.wt-ex9/services/ai/runtime/quantum/workload-genome.ts',
        '/tmp/62l-ex9-work/services/ai/runtime/quantum/workload-genome.ts',
      ],
      'EX9 workload genome soft-wired — presence ≠ VERIFIED.',
      'EX9 workload genome absent → WAITING_DATA.',
    ),
    ex10BenchmarkGate: firstExisting(
      [
        join(QUANTUM_DIR, 'benchmark-comparability.ts'),
        join(QUANTUM_DIR, 'comparability.ts'),
        '/tmp/62l-ex10-work/services/ai/runtime/quantum/comparability.ts',
        '/tmp/62l-ex10-work/services/ai/runtime/quantum/benchmark-comparability.ts',
      ],
      'EX10 benchmark gate soft-wired — presence ≠ VERIFIED.',
      'EX10 benchmark gate absent → WAITING_DATA.',
    ),
    ex11EvidenceLedger: firstExisting(
      [
        join(QUANTUM_DIR, 'evidence-ledger.ts'),
        join(QUANTUM_DIR, 'evidence-types.ts'),
        '/tmp/62l-ex11-work/services/ai/runtime/quantum/evidence-ledger.ts',
      ],
      'EX11 evidence ledger soft-wired — presence ≠ VERIFIED (do not duplicate).',
      'EX11 evidence ledger absent → WAITING_DATA.',
    ),
    ex12PathwayGraph: firstExisting(
      [
        join(QUANTUM_DIR, 'pathway-graph.ts'),
        join(QUANTUM_DIR, 'pathway-types.ts'),
        '/tmp/62l-ex12-work/services/ai/runtime/quantum/pathway-graph.ts',
      ],
      'EX12 pathway graph soft-wired — presence ≠ VERIFIED (do not duplicate).',
      'EX12 pathway graph absent → WAITING_DATA.',
    ),
    ex13PathwayPlasticity: firstExisting(
      [
        join(QUANTUM_DIR, 'pathway-plasticity.ts'),
        '/workspace/.wt-ex13/services/ai/runtime/quantum/pathway-plasticity.ts',
        '/tmp/62l-ex13-work/services/ai/runtime/quantum/pathway-plasticity.ts',
        join(WORKSPACE_PARENT, '.wt-ex13', 'services', 'ai', 'runtime', 'quantum', 'pathway-plasticity.ts'),
      ],
      'EX13 pathway plasticity soft-wired — presence ≠ VERIFIED.',
      'EX13 pathway plasticity absent → WAITING_DATA.',
    ),
    ex14OfflineResearchPack: firstExisting(
      [
        join(RUNTIME_DIR, 'offlinepacks'),
        join(RUNTIME_DIR, 'offlinepacks', 'types.ts'),
        '/workspace/.wt-ex14/services/ai/runtime/offlinepacks',
        '/workspace/.wt-ex14/services/ai/runtime/offlinepacks/types.ts',
        '/tmp/62l-ex14-work/services/ai/runtime/offlinepacks',
      ],
      'EX14 offline research pack soft-wired — presence ≠ VERIFIED.',
      'EX14 offline research pack absent → WAITING_DATA.',
    ),
    ex15HistoricalAtlas: firstExisting(
      [
        join(RUNTIME_DIR, 'history'),
        join(RUNTIME_DIR, 'history', 'types.ts'),
        '/workspace/.wt-ex15/services/ai/runtime/history',
        '/workspace/.wt-ex15/services/ai/runtime/history/types.ts',
        '/tmp/62l-ex15-work/services/ai/runtime/history',
      ],
      'EX15 historical atlas PRESENT (soft-wire) → CANDIDATE not VERIFIED.',
      'EX15 historical atlas absent → WAITING_DATA.',
    ),
    historyRuntime: softWire(
      join(RUNTIME_DIR, 'historical'),
      'runtime/historical PRESENT (soft-wire) — presence ≠ VERIFIED.',
      'runtime/historical absent → WAITING_DATA.',
    ),
    offlinePacks: firstExisting(
      [
        join(RUNTIME_DIR, 'offlinepacks'),
        '/workspace/.wt-ex14/services/ai/runtime/offlinepacks',
      ],
      'offlinepacks PRESENT (soft-wire) — presence ≠ VERIFIED.',
      'offlinepacks absent → WAITING_DATA.',
    ),
    agentMesh: softWire(
      join(RUNTIME_DIR, 'agentmesh'),
      'Agent Mesh PRESENT (integrate-in-place; not a second framework).',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    chipgraph: firstExisting(
      [
        join(RUNTIME_DIR, 'chipgraph'),
        join(RUNTIME_DIR, 'compute', 'chipgraph.ts'),
        '/workspace/.wt-ew6/services/ai/runtime/chipgraph',
        '/workspace/.wt-ew8/services/ai/runtime/chipgraph',
        join(WORKSPACE_PARENT, '.wt-ew6', 'services', 'ai', 'runtime', 'chipgraph'),
      ],
      'Chipgraph PRESENT (soft-wire) — presence ≠ VERIFIED.',
      'Chipgraph absent → WAITING_DATA.',
    ),
    guardian: softWire(
      join(RUNTIME_DIR, 'guardian', 'validate.ts'),
      'Guardian PRESENT — EX16 must not mutate Guardian/RLS.',
      'Guardian absent → WAITING_DATA.',
    ),
    hybridRouter: firstExisting(
      [
        join(QUANTUM_DIR, 'hybrid-router.ts'),
        '/tmp/62l-ex7-work/services/ai/runtime/quantum/hybrid-router.ts',
        '/workspace/.wt-ex8/services/ai/runtime/quantum/hybrid-router.ts',
      ],
      'Hybrid router soft-wired — adapters do not own mission authority.',
      'Hybrid router absent → WAITING_DATA.',
    ),
  };
}

export function summarizeSoftWires(snap: Ex16SoftWireSnapshot): {
  waitingData: string[];
  presentUnverified: string[];
  anyVerified: false;
  historicalAtlasDisposition: SoftWirePresence['disposition'];
  historicalAtlasAsCandidateOnly: true;
} {
  const waitingData: string[] = [];
  const presentUnverified: string[] = [];
  for (const [key, value] of Object.entries(snap) as [
    keyof Ex16SoftWireSnapshot,
    SoftWirePresence,
  ][]) {
    if (value.disposition === 'WAITING_DATA') waitingData.push(String(key));
    else presentUnverified.push(String(key));
  }
  return {
    waitingData,
    presentUnverified,
    anyVerified: false,
    historicalAtlasDisposition: snap.ex15HistoricalAtlas.disposition,
    historicalAtlasAsCandidateOnly: true,
  };
}

/**
 * Soft-wire EX15 historical atlas → always CANDIDATE, never VERIFIED.
 */
export function historicalAtlasResearchStatus(
  snap: Ex16SoftWireSnapshot = auditEx16SoftWires(),
): 'CANDIDATE' | 'WAITING_DATA' {
  if (!snap.ex15HistoricalAtlas.present) return 'WAITING_DATA';
  return 'CANDIDATE';
}

export function resolveOfflineProviderNeed(input: {
  offline: boolean;
  requiresExternalProvider: boolean;
  providerName: string;
}): SoftWirePresence {
  if (input.offline && input.requiresExternalProvider) {
    return {
      present: false,
      pathChecked: `provider://${input.providerName}`,
      note: `Offline + external provider "${input.providerName}" → WAITING_PROVIDER (not FAIL).`,
      verified: false,
      disposition: 'WAITING_DATA',
    };
  }
  return {
    present: true,
    pathChecked: `provider://${input.providerName}`,
    note: `Provider "${input.providerName}" not required offline or available locally.`,
    verified: false,
    disposition: 'PRESENT_UNVERIFIED',
  };
}
