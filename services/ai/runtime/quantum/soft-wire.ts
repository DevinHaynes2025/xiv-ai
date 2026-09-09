/**
 * 62L-EX3 — soft-wire probes (existsSync). Presence ≠ VERIFIED; absent → WAITING_DATA.
 * Soft-wires EX1 mission, EX2 baseline/comparison, Agent Mesh, chipgraph, benchmarks, Guardian.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Ex3SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: 'PRESENT_UNVERIFIED' | 'WAITING_DATA';
};

export type Ex3SoftWireSnapshot = {
  ex1Mission: Ex3SoftWirePresence;
  ex2Baseline: Ex3SoftWirePresence;
  ex2Comparison: Ex3SoftWirePresence;
  agentMesh: Ex3SoftWirePresence;
  chipgraph: Ex3SoftWirePresence;
  benchmarks: Ex3SoftWirePresence;
  guardian: Ex3SoftWirePresence;
  evidenceHost: Ex3SoftWirePresence;
};

function probe(pathChecked: string, notePresent: string, noteAbsent: string): Ex3SoftWirePresence {
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
    verified: false,
    disposition: present ? 'PRESENT_UNVERIFIED' : 'WAITING_DATA',
  };
}

export function ex3SoftWireSnapshot(repoRoot?: string): Ex3SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const runtime = join(here, '..');
  const root = repoRoot ?? join(here, '../../../..');

  return {
    ex1Mission: probe(
      join(here, 'mission.ts'),
      'EX1 mission.ts PRESENT (unverified soft-wire).',
      'EX1 mission.ts absent — WAITING_DATA.',
    ),
    ex2Baseline: probe(
      join(here, 'baseline.ts'),
      'EX2 baseline.ts PRESENT — reuse comparison layer; do not duplicate.',
      'EX2 baseline.ts absent — WAITING_DATA.',
    ),
    ex2Comparison: probe(
      join(here, 'comparison.ts'),
      'EX2 comparison.ts PRESENT — EX3 uses EX2 comparison gate.',
      'EX2 comparison.ts absent — WAITING_DATA.',
    ),
    agentMesh: probe(
      join(runtime, 'agentmesh/types.ts'),
      'Agent Mesh PRESENT (unverified soft-wire).',
      'Agent Mesh absent — WAITING_DATA.',
    ),
    chipgraph: probe(
      join(runtime, 'chipgraph/types.ts'),
      'chipgraph PRESENT (unverified soft-wire).',
      'chipgraph absent — WAITING_DATA.',
    ),
    benchmarks: probe(
      join(root, 'services/ai/local-runtime/classical-quant-benchmark.ts'),
      'Benchmark pack PRESENT (unverified soft-wire).',
      'Benchmark pack absent — WAITING_DATA.',
    ),
    guardian: probe(
      join(runtime, 'guardian/validate.ts'),
      'Guardian PRESENT — EX3 must not mutate Guardian/RLS.',
      'Guardian absent — WAITING_DATA.',
    ),
    evidenceHost: probe(
      join(runtime, 'cloudworker/evidence.ts'),
      'Evidence host PRESENT (unverified soft-wire).',
      'Evidence host absent — WAITING_DATA.',
    ),
  };
}

export function ex3SoftWireHopState(
  presence: Ex3SoftWirePresence,
): 'PASS' | 'WAITING_DATA' {
  return presence.present ? 'PASS' : 'WAITING_DATA';
}
