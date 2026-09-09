/**
 * 62L-EX11 — Soft-wire probes for EX1–EX10, Agent Mesh, audit/evidence/persistence.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 * Soft-wires existing evidence ledgers (orchestration / local-runtime / EO5) —
 * does not invent a second identity/Guardian/Agent Mesh/tenant/benchmark system.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SoftWirePresence } from './evidence-types.ts';

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

export type Ex11SoftWireSnapshot = {
  ex1Mission: SoftWirePresence;
  ex2Baseline: SoftWirePresence;
  ex3AlgorithmLab: SoftWirePresence;
  ex4SimulatorRegistry: SoftWirePresence;
  ex5QpuProviderRegistry: SoftWirePresence;
  ex6PhysicalReceipt: SoftWirePresence;
  ex7HybridRouter: SoftWirePresence;
  ex8OfflineQuantumTeam: SoftWirePresence;
  ex9WorkloadGenome: SoftWirePresence;
  ex10BenchmarkComparability: SoftWirePresence;
  agentMesh: SoftWirePresence;
  audit: SoftWirePresence;
  orchestrationEvidenceLedger: SoftWirePresence;
  localRuntimeEvidenceLedger: SoftWirePresence;
  eo5QuantumEvidenceBoundary: SoftWirePresence;
  persistence: SoftWirePresence;
  guardian: SoftWirePresence;
};

/** Soft-wire audit — never treat presence as VERIFIED. */
export function auditEx11SoftWires(): Ex11SoftWireSnapshot {
  return {
    ex1Mission: firstExisting(
      [
        join(HERE, 'mission.ts'),
        join(WORKSPACE_PARENT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
        join(WORKTREE_ROOT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
        '/tmp/62l-ex1-work/services/ai/runtime/quantum/mission.ts',
      ],
      'EX1 mission contract soft-wired — presence ≠ VERIFIED.',
      'EX1 mission absent → WAITING_DATA.',
    ),
    ex2Baseline: firstExisting(
      [
        join(HERE, 'baseline.ts'),
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'baseline.ts'),
        join(WORKTREE_ROOT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'baseline.ts'),
        '/tmp/62l-ex2-work/services/ai/runtime/quantum/baseline.ts',
      ],
      'EX2 classical baseline soft-wired — presence ≠ VERIFIED.',
      'EX2 baseline absent → WAITING_DATA.',
    ),
    ex3AlgorithmLab: firstExisting(
      [
        join(HERE, 'algorithm-registry.ts'),
        join(WORKSPACE_PARENT, '.wt-ex3', 'services', 'ai', 'runtime', 'quantum', 'algorithm-registry.ts'),
        join(WORKTREE_ROOT, '.wt-ex3', 'services', 'ai', 'runtime', 'quantum', 'algorithm-registry.ts'),
        '/tmp/62l-ex3-work/services/ai/runtime/quantum/algorithm-registry.ts',
      ],
      'EX3 algorithm lab soft-wired — presence ≠ VERIFIED.',
      'EX3 algorithm lab absent → WAITING_DATA.',
    ),
    ex4SimulatorRegistry: firstExisting(
      [
        join(HERE, 'simulator-registry.ts'),
        '/tmp/62l-ex4-work/services/ai/runtime/quantum/simulator-registry.ts',
        join(WORKSPACE_PARENT, '.wt-ex4', 'services', 'ai', 'runtime', 'quantum', 'simulator-registry.ts'),
      ],
      'EX4 simulator registry soft-wired — presence ≠ VERIFIED.',
      'EX4 simulator registry absent → WAITING_DATA.',
    ),
    ex5QpuProviderRegistry: firstExisting(
      [
        join(HERE, 'qpu-types.ts'),
        '/tmp/62l-ex5-work/services/ai/runtime/quantum/qpu-types.ts',
        join(WORKSPACE_PARENT, '.wt-ex5', 'services', 'ai', 'runtime', 'quantum', 'qpu-types.ts'),
      ],
      'EX5 QPU provider truth registry soft-wired — presence ≠ VERIFIED.',
      'EX5 QPU registry absent → WAITING_DATA.',
    ),
    ex6PhysicalReceipt: firstExisting(
      [
        join(HERE, 'qpu-receipt.ts'),
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
        join(WORKSPACE_PARENT, '.wt-ex7', 'services', 'ai', 'runtime', 'quantum', 'hybrid-router.ts'),
      ],
      'EX7 hybrid router soft-wired — presence ≠ VERIFIED.',
      'EX7 hybrid router absent → WAITING_DATA.',
    ),
    ex8OfflineQuantumTeam: firstExisting(
      [
        join(HERE, 'offline-team.ts'),
        join(WORKSPACE_PARENT, '.wt-ex8', 'services', 'ai', 'runtime', 'quantum', 'types.ts'),
        '/tmp/62l-ex8-work/services/ai/runtime/quantum/types.ts',
      ],
      'EX8 offline quantum agent team soft-wired — presence ≠ VERIFIED.',
      'EX8 offline team absent → WAITING_DATA.',
    ),
    ex9WorkloadGenome: firstExisting(
      [
        join(HERE, 'workload-genome.ts'),
        join(WORKSPACE_PARENT, '.wt-ex9', 'services', 'ai', 'runtime', 'quantum', 'types.ts'),
        '/tmp/62l-ex9-work/services/ai/runtime/quantum/types.ts',
      ],
      'EX9 quantum workload genome soft-wired — presence ≠ VERIFIED.',
      'EX9 workload genome absent → WAITING_DATA.',
    ),
    ex10BenchmarkComparability: firstExisting(
      [
        join(HERE, 'benchmark-comparability.ts'),
        '/tmp/62l-ex10-work/services/ai/runtime/quantum/benchmark-comparability.ts',
        join(HERE, 'benchmark.ts'),
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'benchmark.ts'),
      ],
      'EX10 benchmark comparability soft-wired (or EX2 benchmark fallback) — presence ≠ VERIFIED.',
      'EX10 benchmark comparability absent → WAITING_DATA.',
    ),
    agentMesh: softWire(
      join(AI_ROOT, 'runtime', 'agentmesh'),
      'Agent Mesh present (integrate-in-place; not a second framework).',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    audit: firstExisting(
      [
        join(AI_ROOT, 'runtime', 'audit.ts'),
        join(AI_ROOT, 'audit.ts'),
      ],
      'Audit host soft-wired — presence ≠ VERIFIED.',
      'Audit absent → WAITING_DATA.',
    ),
    orchestrationEvidenceLedger: firstExisting(
      [
        join(AI_ROOT, 'orchestration', 'evidence-ledger.ts'),
      ],
      'Orchestration evidence-ledger present — soft-wire only; EX11 extends quantum path, does not replace.',
      'Orchestration evidence-ledger absent → WAITING_DATA.',
    ),
    localRuntimeEvidenceLedger: firstExisting(
      [
        join(AI_ROOT, 'local-runtime', 'evidence-ledger.ts'),
      ],
      'Local-runtime evidence-ledger present — soft-wire only.',
      'Local-runtime evidence-ledger absent → WAITING_DATA.',
    ),
    eo5QuantumEvidenceBoundary: firstExisting(
      [
        join(AI_ROOT, 'local-brain', 'quantum-evidence-boundary-runtime.ts'),
        '/tmp/62l-eo5-work/services/ai/local-brain/quantum-evidence-boundary-runtime.ts',
      ],
      'EO5 quantum evidence boundary soft-wired — presence ≠ VERIFIED; EX11 does not fork EO5.',
      'EO5 quantum evidence boundary absent → WAITING_DATA.',
    ),
    persistence: firstExisting(
      [
        join(AI_ROOT, 'persistence.ts'),
        join(AI_ROOT, 'runtime', 'persistence.ts'),
      ],
      'Persistence host soft-wired — presence ≠ VERIFIED.',
      'Persistence absent → WAITING_DATA.',
    ),
    guardian: softWire(
      join(AI_ROOT, 'runtime', 'guardian', 'validate.ts'),
      'Guardian PRESENT — EX11 must not mutate Guardian/RLS.',
      'Guardian absent → WAITING_DATA.',
    ),
  };
}

export function softWireHopState(presence: SoftWirePresence): 'PASS' | 'WAITING_DATA' {
  return presence.present ? 'PASS' : 'WAITING_DATA';
}

export function summarizeSoftWires(snap: Ex11SoftWireSnapshot): {
  waitingData: string[];
  presentUnverified: string[];
  anyVerified: false;
} {
  const waitingData: string[] = [];
  const presentUnverified: string[] = [];
  for (const [key, value] of Object.entries(snap) as [keyof Ex11SoftWireSnapshot, SoftWirePresence][]) {
    if (value.disposition === 'WAITING_DATA') waitingData.push(String(key));
    else presentUnverified.push(String(key));
  }
  return { waitingData, presentUnverified, anyVerified: false };
}
