/**
 * 62L-EX15 — soft-wire probes via existsSync for EX1–EX14 + integration hosts.
 * Presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL).
 * Integrate with offlinepacks/ if EX14 modules appear; do not block forever.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Ex15SoftWireSnapshot, SoftWirePresence } from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNTIME_DIR = join(HERE, '..');
const AI_ROOT = join(HERE, '../..');
const WORKTREE_ROOT = join(AI_ROOT, '../..');
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

function siblingQuantum(file: string): string[] {
  const wtNames = [
    '.wt-ex1',
    '.wt-ex2',
    '.wt-ex3',
    '.wt-ex6',
    '.wt-ex8',
    '.wt-ex9',
    '.wt-ex14',
  ];
  const out: string[] = [
    join(RUNTIME_DIR, 'quantum', file),
    join(WORKTREE_ROOT, 'services/ai/runtime/quantum', file),
  ];
  for (const wt of wtNames) {
    out.push(join(WORKSPACE_PARENT, wt, 'services/ai/runtime/quantum', file));
    out.push(`/workspace/${wt}/services/ai/runtime/quantum/${file}`);
  }
  return out;
}

export function ex15SoftWireSnapshot(): Ex15SoftWireSnapshot {
  return {
    ex1: firstExisting(
      siblingQuantum('mission.ts'),
      'EX1 mission soft-wired — presence ≠ VERIFIED.',
      'EX1 mission absent → WAITING_DATA.',
    ),
    ex2: firstExisting(
      siblingQuantum('baseline.ts'),
      'EX2 classical baseline soft-wired — presence ≠ VERIFIED.',
      'EX2 baseline absent → WAITING_DATA.',
    ),
    ex3: firstExisting(
      siblingQuantum('algorithm-registry.ts'),
      'EX3 algorithm lab soft-wired — presence ≠ VERIFIED.',
      'EX3 algorithm lab absent → WAITING_DATA.',
    ),
    ex4: firstExisting(
      [
        ...siblingQuantum('simulator-registry.ts'),
        ...siblingQuantum('local-simulator-registry.ts'),
      ],
      'EX4 simulator registry soft-wired — presence ≠ VERIFIED.',
      'EX4 simulator registry absent → WAITING_DATA.',
    ),
    ex5: firstExisting(
      [...siblingQuantum('qpu-registry.ts'), ...siblingQuantum('qpu-types.ts')],
      'EX5 QPU registry soft-wired — presence ≠ VERIFIED.',
      'EX5 QPU registry absent → WAITING_DATA.',
    ),
    ex6: firstExisting(
      siblingQuantum('qpu-receipt.ts'),
      'EX6 physical QPU receipt soft-wired — presence ≠ VERIFIED.',
      'EX6 physical receipt absent → WAITING_DATA.',
    ),
    ex7: firstExisting(
      siblingQuantum('hybrid-router.ts'),
      'EX7 hybrid router soft-wired — presence ≠ VERIFIED.',
      'EX7 hybrid router absent → WAITING_DATA.',
    ),
    ex8: firstExisting(
      siblingQuantum('agent-team.ts'),
      'EX8 offline agent team soft-wired — presence ≠ VERIFIED.',
      'EX8 agent team absent → WAITING_DATA.',
    ),
    ex9: firstExisting(
      siblingQuantum('workload-genome.ts'),
      'EX9 workload genome soft-wired — presence ≠ VERIFIED.',
      'EX9 workload genome absent → WAITING_DATA.',
    ),
    ex10: firstExisting(
      [
        ...siblingQuantum('benchmark-gate.ts'),
        ...siblingQuantum('comparability-gate.ts'),
        '/workspace/.wt-ex10/services/ai/runtime/quantum/benchmark-gate.ts',
      ],
      'EX10 benchmark comparability gate soft-wired — presence ≠ VERIFIED.',
      'EX10 benchmark gate absent → WAITING_DATA.',
    ),
    ex11: firstExisting(
      [
        ...siblingQuantum('evidence-ledger.ts'),
        '/workspace/.wt-ex11/services/ai/runtime/quantum/evidence-ledger.ts',
      ],
      'EX11 evidence ledger soft-wired — presence ≠ VERIFIED.',
      'EX11 evidence ledger absent → WAITING_DATA.',
    ),
    ex12: firstExisting(
      [
        ...siblingQuantum('pathway-graph.ts'),
        '/workspace/.wt-ex12/services/ai/runtime/quantum/pathway-graph.ts',
      ],
      'EX12 pathway graph soft-wired — presence ≠ VERIFIED.',
      'EX12 pathway graph absent → WAITING_DATA.',
    ),
    ex13: firstExisting(
      [
        ...siblingQuantum('pathway-plasticity.ts'),
        '/workspace/.wt-ex13/services/ai/runtime/quantum/pathway-plasticity.ts',
        join(
          WORKSPACE_PARENT,
          '.wt-ex13',
          'services/ai/runtime/quantum/pathway-plasticity.ts',
        ),
      ],
      'EX13 pathway plasticity soft-wired — presence ≠ VERIFIED.',
      'EX13 plasticity absent → WAITING_DATA.',
    ),
    ex14: firstExisting(
      [
        join(RUNTIME_DIR, 'offlinepacks/index.ts'),
        join(RUNTIME_DIR, 'offlinepacks/quantum-research-pack.ts'),
        '/workspace/.wt-ex14/services/ai/runtime/offlinepacks/index.ts',
        '/workspace/.wt-ex14/services/ai/runtime/offlinepacks/quantum-research-pack.ts',
        join(
          WORKSPACE_PARENT,
          '.wt-ex14',
          'services/ai/runtime/offlinepacks/index.ts',
        ),
      ],
      'EX14 offline quantum research pack soft-wired — presence ≠ VERIFIED.',
      'EX14 offlinepacks absent → WAITING_DATA (do not block forever).',
    ),
    agentMesh: softWire(
      join(RUNTIME_DIR, 'agentmesh/types.ts'),
      'Agent Mesh PRESENT (unverified soft-wire; no authority expansion).',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    offlinePacks: softWire(
      join(RUNTIME_DIR, 'offlinepacks'),
      'offlinepacks/ directory PRESENT (may be empty; presence ≠ VERIFIED).',
      'offlinepacks/ absent → WAITING_DATA.',
    ),
    quantum: softWire(
      join(RUNTIME_DIR, 'quantum'),
      'quantum/ PRESENT (unverified soft-wire).',
      'quantum/ absent → WAITING_DATA.',
    ),
    evidence: firstExisting(
      [
        join(RUNTIME_DIR, 'quantum/evidence-ledger.ts'),
        '/workspace/.wt-ex11/services/ai/runtime/quantum/evidence-ledger.ts',
      ],
      'Evidence ledger soft-wired — presence ≠ VERIFIED.',
      'Evidence ledger absent → WAITING_DATA.',
    ),
    pathwayGraph: firstExisting(
      [
        join(RUNTIME_DIR, 'quantum/pathway-graph.ts'),
        '/workspace/.wt-ex12/services/ai/runtime/quantum/pathway-graph.ts',
      ],
      'Pathway graph soft-wired — presence ≠ VERIFIED.',
      'Pathway graph absent → WAITING_DATA.',
    ),
    guardian: softWire(
      join(RUNTIME_DIR, 'guardian/host.ts'),
      'Guardian PRESENT — EX15 must not mutate Guardian/RLS.',
      'Guardian absent → WAITING_DATA.',
    ),
    historicalCompany: softWire(
      join(RUNTIME_DIR, 'historical/types.ts'),
      'Existing runtime/historical company layer PRESENT (distinct from EX15 history/).',
      'runtime/historical absent → WAITING_DATA.',
    ),
  };
}

export function summarizeSoftWires(snap: Ex15SoftWireSnapshot): {
  waitingData: string[];
  presentUnverified: string[];
  anyVerified: false;
} {
  const waitingData: string[] = [];
  const presentUnverified: string[] = [];
  for (const [key, value] of Object.entries(snap) as [
    keyof Ex15SoftWireSnapshot,
    SoftWirePresence,
  ][]) {
    if (value.disposition === 'WAITING_DATA') waitingData.push(String(key));
    else presentUnverified.push(String(key));
  }
  return { waitingData, presentUnverified, anyVerified: false };
}

/**
 * Live-data / network dependency while offline → WAITING_DATA (never FAIL / never fabricate).
 */
export function resolveOfflineLiveDependency(input: {
  requiresNetwork: boolean;
  offline: boolean;
  dependencyName: string;
}): SoftWirePresence {
  if (input.requiresNetwork && input.offline) {
    return {
      present: false,
      pathChecked: `live://${input.dependencyName}`,
      note: `Offline + live dependency "${input.dependencyName}" → WAITING_DATA (not FAIL).`,
      verified: false,
      disposition: 'WAITING_DATA',
    };
  }
  return {
    present: true,
    pathChecked: `live://${input.dependencyName}`,
    note: `Live dependency "${input.dependencyName}" reachable or not required offline.`,
    verified: false,
    disposition: 'PRESENT_UNVERIFIED',
  };
}
