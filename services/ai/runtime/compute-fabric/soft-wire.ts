/**
 * 62L-EX17 — soft-wire probes via existsSync for EX1–EX16 + integration hosts.
 * Presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL).
 * Do not block forever waiting for merge onto xiv-v2.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Ex17SoftWireSnapshot, SoftWirePresence } from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNTIME_DIR = join(HERE, '..');
const AI_ROOT = join(HERE, '../..');
const WORKTREE_ROOT = join(AI_ROOT, '../..');
const WORKSPACE_PARENT = join(WORKTREE_ROOT, '..');

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

const EX_WT = [
  '.wt-ex1',
  '.wt-ex2',
  '.wt-ex3',
  '.wt-ex6',
  '.wt-ex8',
  '.wt-ex9',
  '.wt-ex14',
  '.wt-ex15',
] as const;

function siblingQuantum(file: string): string[] {
  const out: string[] = [
    join(RUNTIME_DIR, 'quantum', file),
    join(WORKTREE_ROOT, 'services/ai/runtime/quantum', file),
  ];
  for (const wt of EX_WT) {
    out.push(join(WORKSPACE_PARENT, wt, 'services/ai/runtime/quantum', file));
    out.push(`/workspace/${wt}/services/ai/runtime/quantum/${file}`);
  }
  out.push(`/tmp/62l-ex10-work/services/ai/runtime/quantum/${file}`);
  out.push(`/tmp/62l-ex11-work/services/ai/runtime/quantum/${file}`);
  out.push(`/tmp/62l-ex12-work/services/ai/runtime/quantum/${file}`);
  out.push(`/tmp/62l-ex16-work/services/ai/runtime/quantum/${file}`);
  return out;
}

function siblingHistory(file: string): string[] {
  return [
    join(RUNTIME_DIR, 'history', file),
    `/workspace/.wt-ex15/services/ai/runtime/history/${file}`,
    join(WORKSPACE_PARENT, '.wt-ex15', 'services/ai/runtime/history', file),
  ];
}

function siblingOfflinePack(file: string): string[] {
  return [
    join(RUNTIME_DIR, 'offlinepacks', file),
    `/workspace/.wt-ex14/services/ai/runtime/offlinepacks/${file}`,
    join(WORKSPACE_PARENT, '.wt-ex14', 'services/ai/runtime/offlinepacks', file),
  ];
}

/** Soft-wire audit — presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL). */
export function auditEx17SoftWires(): Ex17SoftWireSnapshot {
  return ex17SoftWireSnapshot();
}

export function ex17SoftWireSnapshot(): Ex17SoftWireSnapshot {
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
      'EX8 offline quantum agent team soft-wired — presence ≠ VERIFIED.',
      'EX8 agent team absent → WAITING_DATA.',
    ),
    ex9: firstExisting(
      siblingQuantum('workload-genome.ts'),
      'EX9 workload genome soft-wired — presence ≠ VERIFIED.',
      'EX9 workload genome absent → WAITING_DATA.',
    ),
    ex10: firstExisting(
      [
        ...siblingQuantum('comparability.ts'),
        ...siblingQuantum('benchmark-comparability.ts'),
        '/tmp/62l-ex10-work/services/ai/runtime/quantum/comparability.ts',
      ],
      'EX10 benchmark comparability gate soft-wired — presence ≠ VERIFIED.',
      'EX10 benchmark gate absent → WAITING_DATA.',
    ),
    ex11: firstExisting(
      [
        ...siblingQuantum('evidence-ledger.ts'),
        '/tmp/62l-ex11-work/services/ai/runtime/quantum/evidence-ledger.ts',
      ],
      'EX11 evidence ledger soft-wired — presence ≠ VERIFIED.',
      'EX11 evidence ledger absent → WAITING_DATA.',
    ),
    ex12: firstExisting(
      [
        ...siblingQuantum('pathway-graph.ts'),
        '/tmp/62l-ex12-work/services/ai/runtime/quantum/pathway-graph.ts',
      ],
      'EX12 pathway graph soft-wired — presence ≠ VERIFIED.',
      'EX12 pathway graph absent → WAITING_DATA.',
    ),
    ex13: firstExisting(
      [
        ...siblingQuantum('pathway-plasticity.ts'),
        ...siblingQuantum('plasticity.ts'),
        '/tmp/62l-ex13-work/services/ai/runtime/quantum/pathway-plasticity.ts',
      ],
      'EX13 pathway plasticity soft-wired — presence ≠ VERIFIED.',
      'EX13 pathway plasticity absent → WAITING_DATA.',
    ),
    ex14: firstExisting(
      [
        ...siblingOfflinePack('types.ts'),
        ...siblingOfflinePack('pack-builder.ts'),
      ],
      'EX14 offline research pack soft-wired — presence ≠ VERIFIED.',
      'EX14 offline pack absent → WAITING_DATA.',
    ),
    ex15: firstExisting(
      [...siblingHistory('types.ts'), ...siblingHistory('atlas.ts')],
      'EX15 historical atlas soft-wired — presence ≠ VERIFIED.',
      'EX15 historical atlas absent → WAITING_DATA.',
    ),
    ex16: firstExisting(
      [
        ...siblingQuantum('algorithm-translation.ts'),
        ...siblingQuantum('ir/index.ts'),
        join(RUNTIME_DIR, 'quantum', 'ir'),
        '/tmp/62l-ex16-work/services/ai/runtime/quantum/algorithm-translation.ts',
        '/tmp/62l-ex16-work/services/ai/runtime/quantum/ir/index.ts',
        `/workspace/.wt-ex16/services/ai/runtime/quantum/ir/index.ts`,
      ],
      'EX16 quantum algorithm translation / IR soft-wired — presence ≠ VERIFIED.',
      'EX16 translation layer absent → WAITING_DATA.',
    ),
    agentmesh: firstExisting(
      [
        join(RUNTIME_DIR, 'agentmesh'),
        join(RUNTIME_DIR, 'agentmesh', 'types.ts'),
      ],
      'Agent Mesh present via existsSync — soft-wire only; presence ≠ VERIFIED.',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    quantumIr: firstExisting(
      [
        join(RUNTIME_DIR, 'quantum', 'ir'),
        join(RUNTIME_DIR, 'quantum', 'ir', 'index.ts'),
        '/tmp/62l-ex16-work/services/ai/runtime/quantum/ir',
      ],
      'quantum/ir soft-wired — presence ≠ VERIFIED.',
      'quantum/ir absent → WAITING_DATA.',
    ),
    chipgraph: firstExisting(
      [
        join(RUNTIME_DIR, 'chipgraph'),
        join(AI_ROOT, 'compute-graph'),
        '/workspace/.wt-ew6/services/ai/runtime/chipgraph',
      ],
      'chipgraph soft-wired — presence ≠ VERIFIED.',
      'chipgraph absent → WAITING_DATA.',
    ),
    lifecycle: firstExisting(
      [
        join(RUNTIME_DIR, 'cloudworker', 'lifecycle.ts'),
        join(RUNTIME_DIR, 'agentmesh', 'lifecycle.ts'),
      ],
      'lifecycle soft-wired — presence ≠ VERIFIED.',
      'lifecycle absent → WAITING_DATA.',
    ),
    localRuntime: firstExisting(
      [join(AI_ROOT, 'local-runtime'), join(AI_ROOT, 'local-runtime', 'index.ts')],
      'local-runtime soft-wired — presence ≠ VERIFIED.',
      'local-runtime absent → WAITING_DATA.',
    ),
    guardian: firstExisting(
      [join(RUNTIME_DIR, 'guardian'), join(RUNTIME_DIR, 'guardian', 'validate.ts')],
      'Guardian present — EX17 must not weaken RLS; presence ≠ VERIFIED.',
      'Guardian absent → WAITING_DATA.',
    ),
    benchmark: firstExisting(
      [
        join(AI_ROOT, 'local-runtime', 'benchmark.ts'),
        ...siblingQuantum('benchmark.ts'),
        join(RUNTIME_DIR, 'benchmarks'),
      ],
      'benchmark soft-wired — presence ≠ VERIFIED.',
      'benchmark absent → WAITING_DATA.',
    ),
    evidence: firstExisting(
      [
        ...siblingQuantum('evidence-ledger.ts'),
        ...siblingQuantum('receipts.ts'),
        join(AI_ROOT, 'local-runtime', 'evidence-ledger.ts'),
      ],
      'evidence soft-wired — presence ≠ VERIFIED.',
      'evidence absent → WAITING_DATA.',
    ),
  };
}
