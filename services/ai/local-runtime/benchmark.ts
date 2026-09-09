/**
 * 62L-EL EL4 — Classical CPU baseline benchmark gate.
 * Classical baselines required before quantum-inspired comparison.
 * No quantum advantage claims. Soft-wires EK quantum truth states when PRESENT.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ClassicalBenchmarkResult, EvidenceState } from './types';

export type ClassicalBenchmarkInput = {
  iterations?: number;
  injectedDurationMs?: number;
  maxDurationMs?: number;
};

const DEFAULT_ITERATIONS = 25_000;
const DEFAULT_MAX_MS = 30_000;

function id() {
  return `elbench_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function ekTypesPresent(): boolean {
  const ekPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../local-brain/windows-amd-local-cognitive-os-types.ts',
  );
  return existsSync(ekPath);
}

export function runClassicalCpuBenchmark(
  input: ClassicalBenchmarkInput = {},
): ClassicalBenchmarkResult {
  const iterations = input.iterations ?? DEFAULT_ITERATIONS;
  const maxDurationMs = input.maxDurationMs ?? DEFAULT_MAX_MS;

  let durationMs: number;
  if (typeof input.injectedDurationMs === 'number') {
    durationMs = input.injectedDurationMs;
  } else {
    const start = performance.now();
    let acc = 0;
    for (let i = 0; i < iterations; i += 1) {
      acc = (acc + Math.sin(i) * Math.cos(i * 0.5)) % 1000;
    }
    if (acc === Number.POSITIVE_INFINITY) durationMs = 0;
    else durationMs = performance.now() - start;
  }

  const passed = durationMs >= 0 && durationMs <= maxDurationMs;
  return {
    id: id(),
    target: 'cpu',
    metric: 'classical_cpu_loop_duration',
    value: Number(durationMs.toFixed(3)),
    unit: 'ms',
    passed,
    state: passed ? 'PASS' : 'FAIL',
    quantumComparisonAllowed: false,
    reason: passed
      ? 'CLASSICAL_CPU_BASELINE_RECORDED_QUANTUM_COMPARISON_NOT_ALLOWED_YET'
      : 'CLASSICAL_CPU_BASELINE_FAILED',
    at: new Date().toISOString(),
  };
}

export type QuantumComparisonGate = {
  allowed: boolean;
  state: EvidenceState;
  reason: string;
  classicalBaselineRequired: true;
  quantumAdvantageClaimed: false;
  ekQuantumTruthStatesSoftWired: boolean;
};

export function gateQuantumInspiredCompare(input: {
  classicalBaselinePresent: boolean;
  classicalBaselinePassed: boolean;
}): QuantumComparisonGate {
  const ekPresent = ekTypesPresent();

  if (!input.classicalBaselinePresent || !input.classicalBaselinePassed) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: 'CLASSICAL_BASELINE_REQUIRED_BEFORE_QUANTUM_INSPIRED_COMPARISON',
      classicalBaselineRequired: true,
      quantumAdvantageClaimed: false,
      ekQuantumTruthStatesSoftWired: ekPresent,
    };
  }

  return {
    allowed: true,
    state: 'PASS',
    reason: 'CLASSICAL_BASELINE_PRESENT_COMPARISON_BOUNDED_NO_ADVANTAGE_CLAIM',
    classicalBaselineRequired: true,
    quantumAdvantageClaimed: false,
    ekQuantumTruthStatesSoftWired: ekPresent,
  };
}

export function classicalBenchmarkHonesty() {
  return {
    cpuPathOnlyForEl4: true as const,
    quantumAdvantageWithoutBaseline: false as const,
    quantumComparisonAllowedByDefault: false as const,
  };
}
