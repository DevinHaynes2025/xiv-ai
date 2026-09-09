/**
 * 62L-EX12 — Soft-wire probes for EX1–EX11, Agent Mesh, evidence ledger,
 * benchmarks, chipgraph via existsSync.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Ex12SoftWireSnapshot, SoftWirePresence } from './pathway-types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const AI_ROOT = join(HERE, '..', '..');
const WORKTREE_ROOT = join(AI_ROOT, '..', '..');
const WORKSPACE_PARENT = join(WORKTREE_ROOT, '..');

function softWire(pathChecked: string, notePresent: string, noteAbsent: string): SoftWirePresence {
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
    verified: false,
    disposition: present ? 'PRESENT_UNVERIFIED' : 'WAITING_DATA',
  };
}

function firstExisting(candidates: string[], notePresent: string, noteAbsent: string): SoftWirePresence {
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

/** Soft-wire audit — never treat presence as VERIFIED. */
export function auditEx12SoftWires(): Ex12SoftWireSnapshot {
  return {
    agentMesh: softWire(
      join(AI_ROOT, 'runtime', 'agentmesh'),
      'Agent Mesh present (integrate-in-place; not a second framework).',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    ex1Mission: firstExisting(
      [
        join(HERE, 'mission.ts'),
        '/workspace/.wt-ex1/services/ai/runtime/quantum/mission.ts',
        join(WORKSPACE_PARENT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
        '/tmp/62l-ex1-work/services/ai/runtime/quantum/mission.ts',
        join(WORKTREE_ROOT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
      ],
      'EX1 mission contract soft-wired — presence ≠ VERIFIED.',
      'EX1 mission absent → WAITING_DATA.',
    ),
    ex2Baseline: firstExisting(
      [
        join(HERE, 'baseline.ts'),
        '/workspace/.wt-ex2/services/ai/runtime/quantum/baseline.ts',
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'baseline.ts'),
        '/tmp/62l-ex2-work/services/ai/runtime/quantum/baseline.ts',
      ],
      'EX2 classical baseline soft-wired — presence ≠ VERIFIED.',
      'EX2 baseline absent → WAITING_DATA.',
    ),
    ex3AlgorithmLab: firstExisting(
      [
        join(HERE, 'algorithm-registry.ts'),
        '/workspace/.wt-ex3/services/ai/runtime/quantum/algorithm-registry.ts',
        join(WORKSPACE_PARENT, '.wt-ex3', 'services', 'ai', 'runtime', 'quantum', 'algorithm-registry.ts'),
        '/tmp/62l-ex3-work/services/ai/runtime/quantum/algorithm-registry.ts',
      ],
      'EX3 algorithm lab soft-wired — presence ≠ VERIFIED.',
      'EX3 algorithm lab absent → WAITING_DATA.',
    ),
    ex4SimulatorRegistry: firstExisting(
      [
        join(HERE, 'simulator-registry.ts'),
        join(HERE, 'local-simulator-registry.ts'),
        '/tmp/62l-ex4-work/services/ai/runtime/quantum/simulator-registry.ts',
        '/workspace/.wt-ex4/services/ai/runtime/quantum/simulator-registry.ts',
        join(WORKSPACE_PARENT, '.wt-ex4', 'services', 'ai', 'runtime', 'quantum', 'simulator-registry.ts'),
      ],
      'EX4 local simulator registry soft-wired — presence ≠ VERIFIED.',
      'EX4 simulator registry absent → WAITING_DATA.',
    ),
    ex5QpuRegistry: firstExisting(
      [
        join(HERE, 'qpu-registry.ts'),
        '/tmp/62l-ex5-work/services/ai/runtime/quantum/qpu-registry.ts',
      ],
      'EX5 QPU provider truth registry soft-wired — presence ≠ VERIFIED.',
      'EX5 QPU registry absent → WAITING_DATA.',
    ),
    ex6PhysicalReceipt: firstExisting(
      [
        join(HERE, 'qpu-receipt.ts'),
        '/workspace/.wt-ex6/services/ai/runtime/quantum/qpu-receipt.ts',
        join(WORKSPACE_PARENT, '.wt-ex6', 'services', 'ai', 'runtime', 'quantum', 'qpu-receipt.ts'),
        '/tmp/62l-ex6-work/services/ai/runtime/quantum/qpu-receipt.ts',
      ],
      'EX6 physical QPU receipt soft-wired — presence ≠ VERIFIED.',
      'EX6 physical receipt absent → WAITING_DATA.',
    ),
    ex7HybridRouter: firstExisting(
      [
        join(HERE, 'hybrid-router.ts'),
        '/tmp/62l-ex7-work/services/ai/runtime/quantum/hybrid-router.ts',
        '/workspace/.wt-ex7/services/ai/runtime/quantum/hybrid-router.ts',
        join(WORKSPACE_PARENT, '.wt-ex7', 'services', 'ai', 'runtime', 'quantum', 'hybrid-router.ts'),
      ],
      'EX7 hybrid classical/quantum router soft-wired — presence ≠ VERIFIED.',
      'EX7 hybrid router absent → WAITING_DATA.',
    ),
    ex8AgentTeam: firstExisting(
      [
        join(HERE, 'quantum-agent-team.ts'),
        join(HERE, 'agent-team.ts'),
        '/workspace/.wt-ex8/services/ai/runtime/quantum/agent-team.ts',
        join(WORKSPACE_PARENT, '.wt-ex8', 'services', 'ai', 'runtime', 'quantum', 'agent-team.ts'),
        '/tmp/62l-ex8-work/services/ai/runtime/quantum/agent-team.ts',
      ],
      'EX8 offline quantum agent team soft-wired — presence ≠ VERIFIED.',
      'EX8 agent team absent → WAITING_DATA.',
    ),
    ex9WorkloadGenome: firstExisting(
      [
        join(HERE, 'workload-genome.ts'),
        join(HERE, 'problem-genome.ts'),
        '/workspace/.wt-ex9/services/ai/runtime/quantum/workload-genome.ts',
        join(WORKSPACE_PARENT, '.wt-ex9', 'services', 'ai', 'runtime', 'quantum', 'workload-genome.ts'),
        '/tmp/62l-ex9-work/services/ai/runtime/quantum/workload-genome.ts',
      ],
      'EX9 quantum workload genome soft-wired — presence ≠ VERIFIED.',
      'EX9 workload genome absent → WAITING_DATA.',
    ),
    ex10BenchmarkGate: firstExisting(
      [
        join(HERE, 'benchmark-comparability.ts'),
        join(HERE, 'comparability.ts'),
        '/tmp/62l-ex10-work/services/ai/runtime/quantum/comparability.ts',
        '/tmp/62l-ex10-work/services/ai/runtime/quantum/benchmark-comparability.ts',
        '/workspace/.wt-ex10/services/ai/runtime/quantum/comparability.ts',
        join(WORKSPACE_PARENT, '.wt-ex10', 'services', 'ai', 'runtime', 'quantum', 'comparability.ts'),
      ],
      'EX10 benchmark comparability gate soft-wired — presence ≠ VERIFIED.',
      'EX10 benchmark gate absent → WAITING_DATA.',
    ),
    ex11EvidenceLedger: firstExisting(
      [
        join(HERE, 'evidence-ledger.ts'),
        join(HERE, 'evidence-types.ts'),
        '/tmp/62l-ex11-work/services/ai/runtime/quantum/evidence-ledger.ts',
        '/tmp/62l-ex11-work/services/ai/runtime/quantum/evidence-types.ts',
      ],
      'EX11 quantum evidence ledger soft-wired — presence ≠ VERIFIED.',
      'EX11 evidence ledger absent → WAITING_DATA.',
    ),
    chipgraph: firstExisting(
      [
        join(AI_ROOT, 'runtime', 'chipgraph'),
        '/workspace/.wt-ew6/services/ai/runtime/chipgraph',
        join(WORKSPACE_PARENT, '.wt-ew6', 'services', 'ai', 'runtime', 'chipgraph'),
        join(WORKTREE_ROOT, '.wt-ew6', 'services', 'ai', 'runtime', 'chipgraph'),
      ],
      'EW chipgraph present via existsSync — soft-wire only; presence ≠ VERIFIED.',
      'EW chipgraph absent → WAITING_DATA.',
    ),
    evidence: firstExisting(
      [
        join(HERE, 'receipts.ts'),
        join(HERE, 'evidence-types.ts'),
        join(AI_ROOT, 'runtime', 'evidence'),
        '/workspace/.wt-ex1/services/ai/runtime/quantum/receipts.ts',
        join(WORKSPACE_PARENT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'receipts.ts'),
        '/tmp/62l-ex11-work/services/ai/runtime/quantum/evidence-types.ts',
      ],
      'Evidence/receipts soft-wired — presence ≠ VERIFIED (does not duplicate Evidence Ledger).',
      'Evidence module absent → WAITING_DATA.',
    ),
    benchmark: firstExisting(
      [
        join(HERE, 'benchmark.ts'),
        join(AI_ROOT, 'runtime', 'benchmarks'),
        join(AI_ROOT, 'local-runtime', 'benchmark.ts'),
        '/workspace/.wt-ex2/services/ai/runtime/quantum/benchmark.ts',
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'benchmark.ts'),
      ],
      'Benchmark soft-wired — presence ≠ VERIFIED (does not duplicate Benchmark subsystem).',
      'Benchmark absent → WAITING_DATA.',
    ),
    guardian: softWire(
      join(AI_ROOT, 'runtime', 'guardian'),
      'Guardian present — EX12 must not mutate Guardian/RLS.',
      'Guardian path absent → WAITING_DATA (policy still enforced in-graph).',
    ),
  };
}
