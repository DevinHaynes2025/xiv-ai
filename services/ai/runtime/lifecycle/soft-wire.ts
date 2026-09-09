/**
 * 62L-EX13 — Soft-wire EX1–EX12, Agent Mesh, hybrid router, evidence, pathway, Guardian.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Ex13SoftWireSnapshot, SoftWirePresence } from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNTIME = join(HERE, '..');
const AI_ROOT = join(RUNTIME, '..');
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

function quantumCandidates(file: string, exN: number): string[] {
  return [
    join(RUNTIME, 'quantum', file),
    `/tmp/62l-ex${exN}-work/services/ai/runtime/quantum/${file}`,
    `/workspace/.wt-ex${exN}/services/ai/runtime/quantum/${file}`,
    join(WORKSPACE_PARENT, `.wt-ex${exN}`, 'services', 'ai', 'runtime', 'quantum', file),
    join(WORKTREE_ROOT, `.wt-ex${exN}`, 'services', 'ai', 'runtime', 'quantum', file),
  ];
}

export function auditEx13SoftWires(): Ex13SoftWireSnapshot {
  return {
    agentMesh: softWire(
      join(RUNTIME, 'agentmesh'),
      'Agent Mesh present — integrate-in-place; not a second agent system.',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    hybridRouter: firstExisting(
      [
        join(RUNTIME, 'quantum', 'hybrid-router.ts'),
        '/tmp/62l-ex7-work/services/ai/runtime/quantum/hybrid-router.ts',
        '/workspace/.wt-ex7/services/ai/runtime/quantum/hybrid-router.ts',
      ],
      'EX7 hybrid router soft-wired — presence ≠ VERIFIED.',
      'Hybrid router absent → WAITING_DATA.',
    ),
    evidenceLedger: firstExisting(
      [
        join(RUNTIME, 'quantum', 'evidence-ledger.ts'),
        '/tmp/62l-ex11-work/services/ai/runtime/quantum/evidence-ledger.ts',
      ],
      'EX11 evidence ledger soft-wired — presence ≠ VERIFIED.',
      'Evidence ledger absent → WAITING_DATA.',
    ),
    pathwayGraph: firstExisting(
      [
        join(RUNTIME, 'quantum', 'pathway-graph.ts'),
        '/tmp/62l-ex12-work/services/ai/runtime/quantum/pathway-graph.ts',
      ],
      'EX12 pathway graph soft-wired — presence ≠ VERIFIED.',
      'Pathway graph absent → WAITING_DATA.',
    ),
    pathwayWeight: firstExisting(
      [
        join(RUNTIME, 'quantum', 'pathway-weight.ts'),
        '/tmp/62l-ex12-work/services/ai/runtime/quantum/pathway-weight.ts',
      ],
      'EX12 pathway-weight soft-wired — extend via plasticity-bridge; presence ≠ VERIFIED.',
      'Pathway weight absent → WAITING_DATA (local plasticity-bridge still bounded).',
    ),
    guardian: softWire(
      join(RUNTIME, 'guardian'),
      'Guardian present — EX13 must not mutate Guardian/RLS.',
      'Guardian path absent → WAITING_DATA (policy still enforced in lifecycle).',
    ),
    ex1: firstExisting(quantumCandidates('mission.ts', 1), 'EX1 soft-wired.', 'EX1 WAITING_DATA.'),
    ex2: firstExisting(quantumCandidates('baseline.ts', 2), 'EX2 soft-wired.', 'EX2 WAITING_DATA.'),
    ex3: firstExisting(
      quantumCandidates('algorithm-registry.ts', 3),
      'EX3 soft-wired.',
      'EX3 WAITING_DATA.',
    ),
    ex4: firstExisting(
      [
        ...quantumCandidates('simulator-registry.ts', 4),
        ...quantumCandidates('local-simulator-registry.ts', 4),
      ],
      'EX4 soft-wired.',
      'EX4 WAITING_DATA.',
    ),
    ex5: firstExisting(quantumCandidates('qpu-registry.ts', 5), 'EX5 soft-wired.', 'EX5 WAITING_DATA.'),
    ex6: firstExisting(quantumCandidates('qpu-receipt.ts', 6), 'EX6 soft-wired.', 'EX6 WAITING_DATA.'),
    ex7: firstExisting(quantumCandidates('hybrid-router.ts', 7), 'EX7 soft-wired.', 'EX7 WAITING_DATA.'),
    ex8: firstExisting(
      [...quantumCandidates('agent-team.ts', 8), ...quantumCandidates('quantum-agent-team.ts', 8)],
      'EX8 soft-wired.',
      'EX8 WAITING_DATA.',
    ),
    ex9: firstExisting(quantumCandidates('workload-genome.ts', 9), 'EX9 soft-wired.', 'EX9 WAITING_DATA.'),
    ex10: firstExisting(
      [
        ...quantumCandidates('comparability.ts', 10),
        ...quantumCandidates('benchmark-comparability.ts', 10),
      ],
      'EX10 soft-wired.',
      'EX10 WAITING_DATA.',
    ),
    ex11: firstExisting(
      quantumCandidates('evidence-ledger.ts', 11),
      'EX11 soft-wired.',
      'EX11 WAITING_DATA.',
    ),
    ex12: firstExisting(
      quantumCandidates('pathway-graph.ts', 12),
      'EX12 soft-wired.',
      'EX12 WAITING_DATA.',
    ),
  };
}

export function softWireAbsenceIsWaitingDataNotFail(snapshot: Ex13SoftWireSnapshot): boolean {
  for (const value of Object.values(snapshot)) {
    if (!value.present && value.disposition !== 'WAITING_DATA') return false;
    if (value.verified !== false) return false;
  }
  return true;
}
