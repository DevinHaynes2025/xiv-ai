/**
 * 62L-EX18 — Soft-wire EX1–EX17 + compute-fabric/quantum/agentmesh/pathway/evidence.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL). Do not block forever.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Ex18SoftWireSnapshot, SoftWirePresence } from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNTIME = join(HERE, '..');
const AI_ROOT = join(RUNTIME, '..');
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

function quantumCandidates(file: string, exN: number): string[] {
  return [
    join(RUNTIME, 'quantum', file),
    `/tmp/62l-ex${exN}-work/services/ai/runtime/quantum/${file}`,
    `/workspace/.wt-ex${exN}/services/ai/runtime/quantum/${file}`,
    join(WORKSPACE_PARENT, `.wt-ex${exN}`, 'services', 'ai', 'runtime', 'quantum', file),
    join(WORKTREE_ROOT, `.wt-ex${exN}`, 'services', 'ai', 'runtime', 'quantum', file),
  ];
}

function lifecycleCandidates(file: string): string[] {
  return [
    join(RUNTIME, 'lifecycle', file),
    '/tmp/62l-ex13-work/services/ai/runtime/lifecycle/' + file,
    '/workspace/.wt-ex13/services/ai/runtime/lifecycle/' + file,
  ];
}

function historyCandidates(file: string): string[] {
  return [
    join(RUNTIME, 'history', file),
    '/tmp/62l-ex15-work/services/ai/runtime/history/' + file,
    '/workspace/.wt-ex15/services/ai/runtime/history/' + file,
  ];
}

function offlinePackCandidates(file: string): string[] {
  return [
    join(RUNTIME, 'offlinepacks', file),
    '/tmp/62l-ex14-work/services/ai/runtime/offlinepacks/' + file,
    '/workspace/.wt-ex14/services/ai/runtime/offlinepacks/' + file,
  ];
}

function fabricCandidates(file: string): string[] {
  return [
    join(RUNTIME, 'compute-fabric', file),
    '/tmp/62l-ex17-work/services/ai/runtime/compute-fabric/' + file,
    '/workspace/.wt-ex17/services/ai/runtime/compute-fabric/' + file,
  ];
}

function irCandidates(file: string): string[] {
  return [
    join(RUNTIME, 'quantum', 'ir', file),
    `/tmp/62l-ex16-work/services/ai/runtime/quantum/ir/${file}`,
    `/workspace/.wt-ex16/services/ai/runtime/quantum/ir/${file}`,
  ];
}

export function auditEx18SoftWires(): Ex18SoftWireSnapshot {
  return {
    agentMesh: softWire(
      join(RUNTIME, 'agentmesh'),
      'Agent Mesh PRESENT (unverified soft-wire; no authority expansion).',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    computeFabric: firstExisting(
      [
        join(RUNTIME, 'compute-fabric'),
        ...fabricCandidates('index.ts'),
        ...fabricCandidates('types.ts'),
      ],
      'EX17 compute-fabric soft-wired — presence ≠ VERIFIED.',
      'EX17 compute-fabric absent → WAITING_DATA (do not block forever).',
    ),
    quantum: softWire(
      join(RUNTIME, 'quantum'),
      'quantum/ PRESENT (unverified soft-wire).',
      'quantum/ absent → WAITING_DATA.',
    ),
    evidence: firstExisting(
      [
        join(RUNTIME, 'quantum', 'evidence-ledger.ts'),
        '/tmp/62l-ex11-work/services/ai/runtime/quantum/evidence-ledger.ts',
      ],
      'EX11 evidence ledger soft-wired — presence ≠ VERIFIED.',
      'Evidence ledger absent → WAITING_DATA.',
    ),
    pathway: firstExisting(
      [
        join(RUNTIME, 'quantum', 'pathway-graph.ts'),
        '/tmp/62l-ex12-work/services/ai/runtime/quantum/pathway-graph.ts',
      ],
      'EX12 pathway graph soft-wired — presence ≠ VERIFIED.',
      'Pathway graph absent → WAITING_DATA.',
    ),
    plasticity: firstExisting(
      [
        ...lifecycleCandidates('plasticity-bridge.ts'),
        ...lifecycleCandidates('types.ts'),
      ],
      'EX13 pathway plasticity soft-wired — never alters authority/permissions/Guardian/RLS.',
      'EX13 plasticity absent → WAITING_DATA.',
    ),
    guardian: softWire(
      join(RUNTIME, 'guardian'),
      'Guardian present — EX18 must not mutate Guardian/RLS.',
      'Guardian path absent → WAITING_DATA (policy still enforced in wormhole router).',
    ),
    ex1: firstExisting(
      [...quantumCandidates('mission.ts', 1), ...quantumCandidates('mission-contract.ts', 1)],
      'EX1 soft-wired — presence ≠ VERIFIED.',
      'EX1 WAITING_DATA.',
    ),
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
    ex9: firstExisting(
      quantumCandidates('workload-genome.ts', 9),
      'EX9 soft-wired.',
      'EX9 WAITING_DATA.',
    ),
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
      'EX12 pathway soft-wired — connection only; presence ≠ VERIFIED.',
      'EX12 WAITING_DATA.',
    ),
    ex13: firstExisting(
      lifecycleCandidates('plasticity-bridge.ts'),
      'EX13 plasticity soft-wired.',
      'EX13 WAITING_DATA.',
    ),
    ex14: firstExisting(
      offlinePackCandidates('types.ts'),
      'EX14 offlinepacks soft-wired.',
      'EX14 WAITING_DATA.',
    ),
    ex15: firstExisting(historyCandidates('types.ts'), 'EX15 atlas soft-wired.', 'EX15 WAITING_DATA.'),
    ex16: firstExisting(
      [...irCandidates('types.ts'), ...irCandidates('index.ts'), join(RUNTIME, 'quantum', 'ir')],
      'EX16 translation IR soft-wired.',
      'EX16 WAITING_DATA.',
    ),
    ex17: firstExisting(
      [
        join(RUNTIME, 'compute-fabric'),
        ...fabricCandidates('types.ts'),
        ...fabricCandidates('index.ts'),
      ],
      'EX17 pre/post fabric soft-wired — presence ≠ VERIFIED.',
      'EX17 WAITING_DATA (do not block forever waiting for merge onto xiv-v2).',
    ),
  };
}

export function softWireAbsenceIsWaitingDataNotFail(
  snapshot: Ex18SoftWireSnapshot,
): boolean {
  for (const value of Object.values(snapshot)) {
    if (!value.present && value.disposition !== 'WAITING_DATA') return false;
    if (value.verified !== false) return false;
  }
  return true;
}

export function softWireHonestySummary(snapshot: Ex18SoftWireSnapshot): {
  presentUnverified: string[];
  waitingData: string[];
} {
  const presentUnverified: string[] = [];
  const waitingData: string[] = [];
  for (const [key, value] of Object.entries(snapshot)) {
    if (value.disposition === 'WAITING_DATA') waitingData.push(key);
    else presentUnverified.push(key);
  }
  return { presentUnverified, waitingData };
}
