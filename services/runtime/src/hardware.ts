import { arch, cpus, platform, totalmem } from 'node:os';

import { sha256 } from './crypto';
import { RuntimeError } from './errors';
import type { Accelerator, HardwareClass, HardwareClassId, HardwareProfile, HardwareRequirement } from './types';

export type ReferenceWorkloadInput = {
  seed: number;
  iterations: number;
};

export type ReferenceWorkloadResult = {
  classId: HardwareClassId;
  value: number;
  checksum: string;
  opsExecuted: number;
  durationMs: number;
};

/**
 * Bounded reference workload used for hardware portability checks. It mixes
 * integer and floating point work so a runtime that reorders or approximates
 * arithmetic shows up as a result difference instead of passing silently.
 */
export function runReferenceWorkload(classId: HardwareClassId, input: ReferenceWorkloadInput): ReferenceWorkloadResult {
  const startedAt = performance.now();
  let integerAccumulator = 0;
  let floatAccumulator = 0;
  let state = input.seed >>> 0;
  for (let index = 0; index < input.iterations; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    integerAccumulator = (integerAccumulator + (state % 9973)) % 1_000_000_007;
    floatAccumulator += Math.sqrt((state % 4096) + 1) / (index + 1);
  }
  const value = integerAccumulator + Math.round(floatAccumulator * 1e6) / 1e6;
  return {
    classId,
    value,
    checksum: sha256(`${integerAccumulator}:${floatAccumulator.toFixed(9)}`),
    opsExecuted: input.iterations,
    durationMs: performance.now() - startedAt,
  };
}

export type ContractTestResult = {
  name: string;
  passed: boolean;
  detail: string;
};

/**
 * Contract tests every runtime adapter must satisfy before its hardware class
 * can be called supported. These are behavioural, not declarative.
 */
export function runAdapterContractTests(adapter: RuntimeAdapter): ContractTestResult[] {
  const results: ContractTestResult[] = [];
  const check = (name: string, fn: () => string | true) => {
    try {
      const detail = fn();
      results.push({ name, passed: true, detail: detail === true ? 'ok' : detail });
    } catch (error) {
      results.push({ name, passed: false, detail: error instanceof Error ? error.message : 'unknown_failure' });
    }
  };

  check('reference_workload_deterministic', () => {
    const first = adapter.runReference({ seed: 7, iterations: 5_000 });
    const second = adapter.runReference({ seed: 7, iterations: 5_000 });
    if (first.checksum !== second.checksum) throw new Error('checksum drift between identical runs');
    return first.checksum.slice(0, 12);
  });

  check('reference_workload_seed_sensitive', () => {
    const a = adapter.runReference({ seed: 7, iterations: 2_000 });
    const b = adapter.runReference({ seed: 8, iterations: 2_000 });
    if (a.checksum === b.checksum) throw new Error('different seeds produced identical results');
    return 'distinct';
  });

  check('model_substitution_refused', () => {
    try {
      adapter.resolveModel('model_that_does_not_exist');
    } catch (error) {
      if (error instanceof RuntimeError && error.code === 'model_unavailable') return 'refused';
      throw error;
    }
    throw new Error('adapter silently substituted an unavailable model');
  });

  check('accelerator_claims_bounded', () => {
    const declared = adapter.accelerators;
    const unsupported = declared.filter((item) => !adapter.supportsAccelerator(item));
    if (unsupported.length) throw new Error(`declared unsupported accelerators: ${unsupported.join(',')}`);
    return declared.length ? declared.join(',') : 'none';
  });

  check('resource_accounting_present', () => {
    const usage = adapter.measure({ seed: 3, iterations: 1_000 });
    if (usage.cpuMillis <= 0) throw new Error('adapter reported no CPU usage for real work');
    return `cpuMillis=${usage.cpuMillis.toFixed(3)}`;
  });

  return results;
}

export type RuntimeAdapter = {
  classId: HardwareClassId;
  accelerators: readonly Accelerator[];
  supportsAccelerator: (accelerator: Accelerator) => boolean;
  resolveModel: (modelId: string) => string;
  runReference: (input: ReferenceWorkloadInput) => ReferenceWorkloadResult;
  measure: (input: ReferenceWorkloadInput) => { cpuMillis: number; ramMb: number };
};

const HARDWARE_LABELS: Record<HardwareClassId, string> = {
  cpu_x86_intel: 'Intel x86-64 CPU',
  cpu_x86_amd: 'AMD x86-64 CPU',
  cpu_arm64: 'ARM64 / Apple silicon CPU',
  gpu_nvidia: 'NVIDIA GPU',
  gpu_apple: 'Apple GPU (Metal)',
  edge_arm32: 'ARM32 edge device',
  mobile_ios: 'iOS mobile runtime',
  mobile_android: 'Android mobile runtime',
};

export const ALL_HARDWARE_CLASS_IDS: readonly HardwareClassId[] = Object.keys(HARDWARE_LABELS) as HardwareClassId[];

/** Detects the host class from real CPU data. No guessing beyond vendor strings. */
export function detectHostHardwareClass(): { classId: HardwareClassId; profile: HardwareProfile } {
  const model = (cpus()[0]?.model ?? '').toLowerCase();
  const architecture = arch();
  let classId: HardwareClassId = 'cpu_arm64';
  if (architecture === 'x64' || architecture === 'ia32') {
    classId = model.includes('amd') || model.includes('epyc') || model.includes('ryzen') ? 'cpu_x86_amd' : 'cpu_x86_intel';
  } else if (architecture === 'arm') {
    classId = 'edge_arm32';
  }
  const accelerators: Accelerator[] =
    classId === 'cpu_arm64' ? ['neon'] : classId === 'edge_arm32' ? ['neon'] : ['avx2'];
  return {
    classId,
    profile: {
      classId,
      vendor: cpus()[0]?.model ?? `${platform()}/${architecture}`,
      cores: cpus().length,
      ramMb: Math.round(totalmem() / (1024 * 1024)),
      accelerators,
    },
  };
}

/**
 * Hardware class registry.
 *
 * A class is only `configured` when an adapter is registered for it. Everything
 * else answers UNAVAILABLE with a reason, which keeps the release from claiming
 * hardware coverage it has never executed on.
 */
export class HardwareRegistry {
  private readonly classes = new Map<HardwareClassId, HardwareClass>();
  private readonly adapters = new Map<HardwareClassId, RuntimeAdapter>();

  constructor(configuredModelIds: readonly string[] = []) {
    for (const classId of ALL_HARDWARE_CLASS_IDS) {
      this.classes.set(classId, {
        classId,
        label: HARDWARE_LABELS[classId],
        configured: false,
        accelerators: [],
        resultTolerance: 0,
        unavailableReason: 'no_runtime_adapter_configured',
      });
    }
    this.configuredModelIds = new Set(configuredModelIds);
  }

  private readonly configuredModelIds: Set<string>;

  registerLocalAdapter(input: {
    classId: HardwareClassId;
    accelerators: readonly Accelerator[];
    resultTolerance?: number;
  }): RuntimeAdapter {
    const adapter: RuntimeAdapter = {
      classId: input.classId,
      accelerators: [...input.accelerators],
      supportsAccelerator: (accelerator) => input.accelerators.includes(accelerator),
      resolveModel: (modelId) => {
        if (!this.configuredModelIds.has(modelId)) {
          throw new RuntimeError('model_unavailable', 'This runtime has no adapter for the requested model.', {
            modelId,
            classId: input.classId,
          });
        }
        return modelId;
      },
      runReference: (workload) => runReferenceWorkload(input.classId, workload),
      measure: (workload) => {
        const before = process.cpuUsage();
        runReferenceWorkload(input.classId, workload);
        const after = process.cpuUsage(before);
        return {
          cpuMillis: (after.user + after.system) / 1000,
          ramMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        };
      },
    };
    this.adapters.set(input.classId, adapter);
    this.classes.set(input.classId, {
      classId: input.classId,
      label: HARDWARE_LABELS[input.classId],
      configured: true,
      accelerators: [...input.accelerators],
      resultTolerance: input.resultTolerance ?? 1e-6,
    });
    return adapter;
  }

  adapterFor(classId: HardwareClassId): RuntimeAdapter {
    const adapter = this.adapters.get(classId);
    if (!adapter) {
      throw new RuntimeError('hardware_unavailable', 'This hardware class is UNAVAILABLE in this release.', {
        classId,
        reason: this.classes.get(classId)?.unavailableReason ?? 'unknown_class',
      });
    }
    return adapter;
  }

  describe(classId: HardwareClassId): HardwareClass {
    const entry = this.classes.get(classId);
    if (!entry) {
      throw new RuntimeError('hardware_unavailable', 'Unknown hardware class.', { classId });
    }
    return entry;
  }

  isConfigured(classId: HardwareClassId): boolean {
    return this.classes.get(classId)?.configured === true;
  }

  configuredClasses(): HardwareClass[] {
    return [...this.classes.values()].filter((entry) => entry.configured);
  }

  unavailableClasses(): HardwareClass[] {
    return [...this.classes.values()].filter((entry) => !entry.configured);
  }

  all(): HardwareClass[] {
    return [...this.classes.values()];
  }

  /** Requirement match used by the router's hard filter. */
  satisfies(profile: HardwareProfile, requirement: HardwareRequirement): { ok: boolean; reason?: string } {
    if (!this.isConfigured(profile.classId)) return { ok: false, reason: 'hardware_unconfigured' };
    if (requirement.classIds && !requirement.classIds.includes(profile.classId)) {
      return { ok: false, reason: 'unsupported_hardware' };
    }
    if (requirement.accelerator && !profile.accelerators.includes(requirement.accelerator)) {
      return { ok: false, reason: 'unsupported_hardware' };
    }
    if (requirement.minCores && profile.cores < requirement.minCores) {
      return { ok: false, reason: 'unsupported_hardware' };
    }
    if (requirement.minRamMb && profile.ramMb < requirement.minRamMb) {
      return { ok: false, reason: 'unsupported_hardware' };
    }
    return { ok: true };
  }
}
