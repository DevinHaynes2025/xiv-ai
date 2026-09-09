/**
 * 62L-EX10 — soft-wire probes via existsSync.
 * Soft-wire EX1–EX9, Agent Mesh, Classical Baseline, Hybrid Router,
 * simulators, QPU registry/receipts, chipgraph, evidence.
 * Presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL).
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SoftWirePresence } from './types.ts';

function repoRootFromHere(): string {
  // services/ai/runtime/quantum → repo root is ../../../../
  return join(dirname(fileURLToPath(import.meta.url)), '../../../..');
}

function probe(
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
    pathChecked: candidates[0] ?? '',
    note: noteAbsent,
    verified: false,
    disposition: 'WAITING_DATA',
  };
}

export type Ex10SoftWireSnapshot = {
  ex1MissionContract: SoftWirePresence;
  ex2ClassicalBaseline: SoftWirePresence;
  ex3AlgorithmLab: SoftWirePresence;
  ex4SimulatorRegistry: SoftWirePresence;
  ex5QpuProviderRegistry: SoftWirePresence;
  ex6PhysicalQpuReceipt: SoftWirePresence;
  ex7HybridRouter: SoftWirePresence;
  ex8OfflineAgentTeam: SoftWirePresence;
  ex9WorkloadGenome: SoftWirePresence;
  agentMesh: SoftWirePresence;
  chipgraph: SoftWirePresence;
  evidenceAudit: SoftWirePresence;
  guardian: SoftWirePresence;
  homeBase: SoftWirePresence;
};

export function ex10SoftWireSnapshot(
  repoRoot = repoRootFromHere(),
): Ex10SoftWireSnapshot {
  const quantumDir = join(repoRoot, 'services/ai/runtime/quantum');
  const runtime = join(repoRoot, 'services/ai/runtime');

  return {
    ex1MissionContract: probe(
      join(quantumDir, 'mission.ts'),
      'EX1 mission contract PRESENT (unverified soft-wire).',
      'EX1 mission.ts absent — WAITING_DATA.',
    ),
    ex2ClassicalBaseline: firstExisting(
      [join(quantumDir, 'baseline.ts'), join(quantumDir, 'comparison.ts')],
      'EX2 classical baseline / comparison PRESENT (unverified soft-wire).',
      'EX2 baseline/comparison absent — WAITING_DATA.',
    ),
    ex3AlgorithmLab: probe(
      join(quantumDir, 'algorithm-registry.ts'),
      'EX3 algorithm lab PRESENT (unverified soft-wire).',
      'EX3 algorithm-registry.ts absent — WAITING_DATA.',
    ),
    ex4SimulatorRegistry: probe(
      join(quantumDir, 'simulator-registry.ts'),
      'EX4 simulator registry PRESENT (unverified soft-wire).',
      'EX4 simulator-registry.ts absent — WAITING_DATA.',
    ),
    ex5QpuProviderRegistry: firstExisting(
      [join(quantumDir, 'qpu-types.ts'), join(quantumDir, 'qpu-registry.ts')],
      'EX5 QPU provider truth registry PRESENT (unverified soft-wire).',
      'EX5 QPU registry absent — WAITING_DATA.',
    ),
    ex6PhysicalQpuReceipt: firstExisting(
      [
        join(quantumDir, 'qpu-receipt.ts'),
        join(quantumDir, 'qpu-verification.ts'),
      ],
      'EX6 physical QPU receipt PRESENT (unverified soft-wire).',
      'EX6 physical QPU receipt absent — WAITING_DATA.',
    ),
    ex7HybridRouter: firstExisting(
      [join(quantumDir, 'route-policy.ts'), join(quantumDir, 'route-score.ts')],
      'EX7 hybrid classical/quantum router PRESENT (unverified soft-wire).',
      'EX7 hybrid router absent — WAITING_DATA.',
    ),
    ex8OfflineAgentTeam: firstExisting(
      [
        join(quantumDir, 'agent-team.ts'),
        join(quantumDir, 'offline-agent-team.ts'),
      ],
      'EX8 offline quantum agent team PRESENT (unverified soft-wire).',
      'EX8 offline agent team absent — WAITING_DATA.',
    ),
    ex9WorkloadGenome: firstExisting(
      [
        join(quantumDir, 'workload-genome.ts'),
        join(quantumDir, 'problem-genome.ts'),
      ],
      'EX9 quantum workload genome PRESENT (unverified soft-wire).',
      'EX9 workload genome absent — WAITING_DATA.',
    ),
    agentMesh: probe(
      join(runtime, 'agentmesh/types.ts'),
      'Agent Mesh PRESENT (unverified soft-wire) — do not duplicate.',
      'Agent Mesh absent — WAITING_DATA.',
    ),
    chipgraph: firstExisting(
      [
        join(runtime, 'chipgraph/types.ts'),
        join(runtime, 'chipgraph/ew9-types.ts'),
      ],
      'chipgraph PRESENT (unverified soft-wire).',
      'chipgraph absent — WAITING_DATA.',
    ),
    evidenceAudit: probe(
      join(runtime, 'audit.ts'),
      'Evidence/audit host PRESENT (unverified soft-wire).',
      'Evidence/audit absent — WAITING_DATA.',
    ),
    guardian: probe(
      join(runtime, 'guardian/validate.ts'),
      'Guardian PRESENT — EX10 must not mutate Guardian/RLS.',
      'Guardian absent — WAITING_DATA.',
    ),
    homeBase: probe(
      join(runtime, 'agentmesh/index.ts'),
      'Home Base / Agent Mesh facade PRESENT (unverified soft-wire).',
      'Home Base facade absent — WAITING_DATA.',
    ),
  };
}

export function softWireHopState(
  presence: SoftWirePresence,
): 'PRESENT_UNVERIFIED' | 'WAITING_DATA' {
  return presence.disposition;
}

/** Any soft-wire absence is WAITING_DATA, never FAIL / never fabricated. */
export function summarizeSoftWires(snap: Ex10SoftWireSnapshot): {
  waitingData: string[];
  presentUnverified: string[];
  anyVerified: false;
} {
  const waitingData: string[] = [];
  const presentUnverified: string[] = [];
  for (const [key, value] of Object.entries(snap) as [
    keyof Ex10SoftWireSnapshot,
    SoftWirePresence,
  ][]) {
    if (value.disposition === 'WAITING_DATA') waitingData.push(String(key));
    else presentUnverified.push(String(key));
  }
  return { waitingData, presentUnverified, anyVerified: false };
}
