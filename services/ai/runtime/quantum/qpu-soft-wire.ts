/**
 * 62L-EX5 — Soft-wire probes for EX1–EX4, Agent Mesh, chipgraph, evidence/benchmark.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Ex5SoftWireSnapshot, SoftWirePresence } from './qpu-types.ts';

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
export function auditEx5SoftWires(): Ex5SoftWireSnapshot {
  return {
    agentMesh: softWire(
      join(AI_ROOT, 'runtime', 'agentmesh'),
      'Agent Mesh present (integrate-in-place; not a second framework).',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    ex1Mission: firstExisting(
      [
        join(HERE, 'mission.ts'),
        join(WORKSPACE_PARENT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
        join(WORKTREE_ROOT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
      ],
      'EX1 mission contract soft-wired — presence ≠ VERIFIED.',
      'EX1 mission absent → WAITING_DATA.',
    ),
    ex2Baseline: firstExisting(
      [
        join(HERE, 'baseline.ts'),
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'baseline.ts'),
        join(WORKTREE_ROOT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'baseline.ts'),
      ],
      'EX2 classical baseline soft-wired — presence ≠ VERIFIED.',
      'EX2 baseline absent → WAITING_DATA.',
    ),
    ex3AlgorithmLab: firstExisting(
      [
        join(HERE, 'algorithm-registry.ts'),
        join(WORKSPACE_PARENT, '.wt-ex3', 'services', 'ai', 'runtime', 'quantum', 'algorithm-registry.ts'),
        join(WORKTREE_ROOT, '.wt-ex3', 'services', 'ai', 'runtime', 'quantum', 'algorithm-registry.ts'),
      ],
      'EX3 algorithm lab soft-wired — presence ≠ VERIFIED.',
      'EX3 algorithm lab absent → WAITING_DATA.',
    ),
    ex4SimulatorRegistry: firstExisting(
      [
        join(HERE, 'simulator-registry.ts'),
        join(HERE, 'local-simulator-registry.ts'),
        '/tmp/62l-ex4-work/services/ai/runtime/quantum/simulator-registry.ts',
        join(WORKSPACE_PARENT, '.wt-ex4', 'services', 'ai', 'runtime', 'quantum', 'simulator-registry.ts'),
      ],
      'EX4 local simulator registry soft-wired — presence ≠ VERIFIED.',
      'EX4 simulator registry absent → WAITING_DATA.',
    ),
    chipgraph: firstExisting(
      [
        join(AI_ROOT, 'runtime', 'chipgraph'),
        join(WORKSPACE_PARENT, '.wt-ew6', 'services', 'ai', 'runtime', 'chipgraph'),
        join(WORKTREE_ROOT, '.wt-ew6', 'services', 'ai', 'runtime', 'chipgraph'),
      ],
      'EW chipgraph present via existsSync — soft-wire only; presence ≠ VERIFIED.',
      'EW chipgraph absent → WAITING_DATA.',
    ),
    evidence: firstExisting(
      [
        join(HERE, 'receipts.ts'),
        join(AI_ROOT, 'runtime', 'evidence'),
        join(WORKSPACE_PARENT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'receipts.ts'),
      ],
      'Evidence/receipts soft-wired — presence ≠ VERIFIED.',
      'Evidence module absent → WAITING_DATA.',
    ),
    benchmark: firstExisting(
      [
        join(HERE, 'benchmark.ts'),
        join(AI_ROOT, 'runtime', 'benchmarks'),
        join(AI_ROOT, 'local-runtime', 'benchmark.ts'),
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'benchmark.ts'),
      ],
      'Benchmark soft-wired — presence ≠ VERIFIED.',
      'Benchmark absent → WAITING_DATA.',
    ),
    guardian: softWire(
      join(AI_ROOT, 'runtime', 'guardian'),
      'Guardian present — EX5 must not mutate Guardian/RLS.',
      'Guardian path absent → WAITING_DATA (policy still enforced in-registry).',
    ),
  };
}
