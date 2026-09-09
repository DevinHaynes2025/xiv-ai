/**
 * 62L-EX9 — soft-wire probes via existsSync.
 * Soft-wire EX1–EX8, Agent Mesh, hybrid router, baselines, QI lab,
 * simulators, QPU registry, chipgraph, benchmarks.
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

function probe(pathChecked: string, notePresent: string, noteAbsent: string): SoftWirePresence {
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
    verified: false,
    disposition: present ? 'PRESENT_UNVERIFIED' : 'WAITING_DATA',
  };
}

export type Ex9SoftWireSnapshot = {
  ex1MissionContract: SoftWirePresence;
  ex2ClassicalBaseline: SoftWirePresence;
  ex3AlgorithmLab: SoftWirePresence;
  ex4SimulatorRegistry: SoftWirePresence;
  ex5QpuProviderRegistry: SoftWirePresence;
  ex6PhysicalQpuReceipt: SoftWirePresence;
  ex7HybridRouter: SoftWirePresence;
  ex8OfflineAgentTeam: SoftWirePresence;
  agentMesh: SoftWirePresence;
  classicalBaselineHost: SoftWirePresence;
  qiLab: SoftWirePresence;
  simulators: SoftWirePresence;
  qpuRegistry: SoftWirePresence;
  chipgraph: SoftWirePresence;
  benchmarks: SoftWirePresence;
  guardian: SoftWirePresence;
  homeBase: SoftWirePresence;
};

export function ex9SoftWireSnapshot(repoRoot = repoRootFromHere()): Ex9SoftWireSnapshot {
  const quantumDir = join(repoRoot, 'services/ai/runtime/quantum');
  const runtimeDir = join(repoRoot, 'services/ai/runtime');
  return {
    ex1MissionContract: probe(
      join(quantumDir, 'mission.ts'),
      'EX1 mission contract PRESENT (unverified soft-wire).',
      'EX1 mission.ts absent — WAITING_DATA.',
    ),
    ex2ClassicalBaseline: probe(
      join(quantumDir, 'baseline.ts'),
      'EX2 classical baseline PRESENT (unverified soft-wire).',
      'EX2 baseline.ts absent — WAITING_DATA.',
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
    ex5QpuProviderRegistry: probe(
      join(quantumDir, 'qpu-types.ts'),
      'EX5 QPU provider truth registry PRESENT (unverified soft-wire).',
      'EX5 qpu-types.ts absent — WAITING_DATA.',
    ),
    ex6PhysicalQpuReceipt: probe(
      join(quantumDir, 'qpu-receipt.ts'),
      'EX6 physical QPU receipt PRESENT (unverified soft-wire).',
      'EX6 qpu-receipt.ts absent — WAITING_DATA.',
    ),
    ex7HybridRouter: probe(
      join(quantumDir, 'hybrid-router.ts'),
      'EX7 hybrid classical/quantum router PRESENT (unverified soft-wire).',
      'EX7 hybrid-router.ts absent — WAITING_DATA.',
    ),
    ex8OfflineAgentTeam: probe(
      join(quantumDir, 'agent-team.ts'),
      'EX8 offline quantum agent team PRESENT (unverified soft-wire).',
      'EX8 agent-team.ts absent — WAITING_DATA.',
    ),
    agentMesh: probe(
      join(runtimeDir, 'agentmesh/types.ts'),
      'Agent Mesh PRESENT (unverified soft-wire).',
      'Agent Mesh absent — WAITING_DATA.',
    ),
    classicalBaselineHost: probe(
      join(quantumDir, 'baseline.ts'),
      'Classical baseline host PRESENT (unverified soft-wire).',
      'Classical baseline host absent — WAITING_DATA.',
    ),
    qiLab: probe(
      join(quantumDir, 'quantum-inspired.ts'),
      'QI lab PRESENT (unverified soft-wire).',
      'QI lab absent — WAITING_DATA.',
    ),
    simulators: probe(
      join(quantumDir, 'simulation.ts'),
      'Simulators PRESENT (unverified soft-wire).',
      'Simulators absent — WAITING_DATA.',
    ),
    qpuRegistry: probe(
      join(quantumDir, 'qpu-registry.ts'),
      'QPU registry PRESENT (unverified soft-wire).',
      'QPU registry absent — WAITING_DATA.',
    ),
    chipgraph: probe(
      join(runtimeDir, 'compute/chipgraph.ts'),
      'Chipgraph PRESENT (unverified soft-wire).',
      'Chipgraph absent — WAITING_DATA.',
    ),
    benchmarks: probe(
      join(runtimeDir, 'benchmarks/index.ts'),
      'Benchmarks PRESENT (unverified soft-wire).',
      'Benchmarks absent — WAITING_DATA.',
    ),
    guardian: probe(
      join(runtimeDir, 'guardian/validate.ts'),
      'Guardian PRESENT — EX9 must not mutate Guardian/RLS.',
      'Guardian absent — WAITING_DATA.',
    ),
    homeBase: probe(
      join(runtimeDir, 'agentmesh/index.ts'),
      'Home Base / Agent Mesh facade PRESENT (unverified soft-wire).',
      'Home Base facade absent — WAITING_DATA.',
    ),
  };
}

export function softWireHopState(presence: SoftWirePresence): 'PASS' | 'WAITING_DATA' {
  return presence.present ? 'PASS' : 'WAITING_DATA';
}

/** Any soft-wire absence is WAITING_DATA, never FAIL / never fabricated. */
export function summarizeSoftWires(snap: Ex9SoftWireSnapshot): {
  waitingData: string[];
  presentUnverified: string[];
  anyVerified: false;
} {
  const waitingData: string[] = [];
  const presentUnverified: string[] = [];
  for (const [key, value] of Object.entries(snap) as [
    keyof Ex9SoftWireSnapshot,
    SoftWirePresence,
  ][]) {
    if (value.disposition === 'WAITING_DATA') waitingData.push(String(key));
    else presentUnverified.push(String(key));
  }
  return { waitingData, presentUnverified, anyVerified: false };
}

/**
 * Offline web dependency → WAITING_DATA (never fabricate remote payload).
 */
export function resolveOfflineWebDependency(input: {
  requiresWeb: boolean;
  offline: boolean;
  dependencyName: string;
}): SoftWirePresence {
  if (input.requiresWeb && input.offline) {
    return {
      present: false,
      pathChecked: `web://${input.dependencyName}`,
      note: `Offline + web dependency "${input.dependencyName}" → WAITING_DATA (not FAIL).`,
      verified: false,
      disposition: 'WAITING_DATA',
    };
  }
  return {
    present: true,
    pathChecked: `web://${input.dependencyName}`,
    note: `Web dependency "${input.dependencyName}" reachable or not required offline.`,
    verified: false,
    disposition: 'PRESENT_UNVERIFIED',
  };
}
