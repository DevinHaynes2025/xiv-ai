/**
 * 62L-EX6 — soft-wire probes via existsSync.
 * Soft-wire EX1–EX5, Agent Mesh, evidence/audit.
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

export type Ex6SoftWireSnapshot = {
  ex1MissionContract: SoftWirePresence;
  ex2ClassicalBaseline: SoftWirePresence;
  ex3AlgorithmLab: SoftWirePresence;
  ex4SimulatorRegistry: SoftWirePresence;
  ex5QpuProviderRegistry: SoftWirePresence;
  agentMesh: SoftWirePresence;
  evidenceAudit: SoftWirePresence;
  guardian: SoftWirePresence;
  homeBase: SoftWirePresence;
};

export function ex6SoftWireSnapshot(repoRoot = repoRootFromHere()): Ex6SoftWireSnapshot {
  const quantumDir = join(repoRoot, 'services/ai/runtime/quantum');
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
      'EX5 qpu-types.ts absent — WAITING_DATA (soft-wire only; presence≠VERIFIED).',
    ),
    agentMesh: probe(
      join(repoRoot, 'services/ai/runtime/agentmesh/types.ts'),
      'Agent Mesh PRESENT (unverified soft-wire).',
      'Agent Mesh absent — WAITING_DATA.',
    ),
    evidenceAudit: probe(
      join(repoRoot, 'services/ai/runtime/audit.ts'),
      'Evidence/audit host PRESENT (unverified soft-wire).',
      'Evidence/audit absent — WAITING_DATA.',
    ),
    guardian: probe(
      join(repoRoot, 'services/ai/runtime/guardian/validate.ts'),
      'Guardian PRESENT — EX6 must not mutate Guardian/RLS.',
      'Guardian absent — WAITING_DATA.',
    ),
    homeBase: probe(
      join(repoRoot, 'services/ai/runtime/agentmesh/index.ts'),
      'Home Base / Agent Mesh facade PRESENT (unverified soft-wire).',
      'Home Base facade absent — WAITING_DATA.',
    ),
  };
}

export function softWireHopState(presence: SoftWirePresence): 'PASS' | 'WAITING_DATA' {
  return presence.present ? 'PASS' : 'WAITING_DATA';
}

/** Any soft-wire absence is WAITING_DATA, never FAIL / never fabricated. */
export function summarizeSoftWires(snap: Ex6SoftWireSnapshot): {
  waitingData: string[];
  presentUnverified: string[];
  anyVerified: false;
} {
  const waitingData: string[] = [];
  const presentUnverified: string[] = [];
  for (const [key, value] of Object.entries(snap) as [keyof Ex6SoftWireSnapshot, SoftWirePresence][]) {
    if (value.disposition === 'WAITING_DATA') waitingData.push(String(key));
    else presentUnverified.push(String(key));
  }
  return { waitingData, presentUnverified, anyVerified: false };
}
