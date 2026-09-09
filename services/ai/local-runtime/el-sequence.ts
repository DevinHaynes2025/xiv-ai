/**
 * 62L-EL — Orchestrate EL1→EL4 pass sequence.
 */

import { runHardwareProbe, toPrivacyMinimalProbe, hardwareProbeHonesty } from './hardware-probe';
import type { RawProbeInput } from './hardware-probe';
import { assertNoSensitiveLeak } from './privacy';
import {
  createInitialRuntimeState,
  recordGateResult,
  assertEl1El4Pass,
  type LocalRuntimeState,
} from './runtime-state';
import {
  runClassicalCpuBenchmark,
  classicalBenchmarkHonesty,
} from './benchmark';
import type { ClassicalBenchmarkResult } from './types';
import { heartbeatHonesty } from './heartbeat';
import { onnxAdapterHonesty } from './onnx-adapter';
import { probeSoftWires } from './soft-wire';
import {
  defaultCapabilityFlags,
  defaultCapabilityStates,
  EL_LOCKS,
  HONESTY_BANNER,
  GITHUB_SOT_ISSUE,
  type CapabilityRegistry,
} from './types';

export type ElSequenceResult = {
  runtime: LocalRuntimeState;
  registry: CapabilityRegistry;
  classicalBenchmark: ClassicalBenchmarkResult;
  softWire: ReturnType<typeof probeSoftWires>;
  el1El4Pass: boolean;
  githubSot: typeof GITHUB_SOT_ISSUE;
  honesty: {
    banner: typeof HONESTY_BANNER;
    locks: typeof EL_LOCKS;
    hardwareProbe: ReturnType<typeof hardwareProbeHonesty>;
    heartbeat: ReturnType<typeof heartbeatHonesty>;
    classicalBenchmark: ReturnType<typeof classicalBenchmarkHonesty>;
    onnx: ReturnType<typeof onnxAdapterHonesty>;
  };
};

export function runEl1El4Sequence(probeInput: RawProbeInput = {}): ElSequenceResult {
  let runtime = createInitialRuntimeState();

  const flags = defaultCapabilityFlags();
  const states = defaultCapabilityStates();
  const el1Ok =
    flags.MODEL_LOAD_VERIFIED === false &&
    flags.ONNX_LOAD_VERIFIED === false &&
    flags.CPU_DETECTED === 'unknown' &&
    states.GPU === 'NOT_TESTED' &&
    states.NPU === 'NOT_TESTED' &&
    states.AMD_EP === 'NOT_TESTED' &&
    states.MODEL_LOAD === 'NOT_TESTED';
  runtime = recordGateResult(
    runtime,
    'EL1',
    el1Ok ? 'PASS' : 'FAIL',
    el1Ok ? 'CAPABILITY_REGISTRY_DEFAULTS_UNKNOWN_FALSE_NOT_TESTED' : 'EL1_DEFAULTS_INVALID',
  );

  const probe = runHardwareProbe(probeInput);
  const el2Ok =
    probe.readOnly === true &&
    probe.stealthPersistence === false &&
    probe.permissionBypass === false &&
    probe.registry.flags.CPU_DETECTED === true;
  runtime = recordGateResult(
    runtime,
    'EL2',
    el2Ok ? 'PASS' : 'FAIL',
    el2Ok ? 'READ_ONLY_PROBE_CONTRACT_OK' : 'EL2_PROBE_CONTRACT_FAILED',
  );

  const minimal = toPrivacyMinimalProbe(probe, probeInput);
  const el3Ok = minimal.privacyMinimal === true && assertNoSensitiveLeak(minimal, probeInput);
  runtime = recordGateResult(
    runtime,
    'EL3',
    el3Ok ? 'PASS' : 'FAIL',
    el3Ok ? 'PRIVACY_MINIMAL_OUTPUT_REDACTS_SENSITIVE_IDS' : 'EL3_PRIVACY_LEAK_OR_FAIL',
  );

  const classicalBenchmark = runClassicalCpuBenchmark({ iterations: 10_000 });
  const el4Ok = classicalBenchmark.passed && classicalBenchmark.target === 'cpu';
  runtime = recordGateResult(
    runtime,
    'EL4',
    el4Ok ? 'PASS' : 'FAIL',
    el4Ok ? 'CLASSICAL_CPU_BASELINE_PASS' : 'EL4_CPU_BASELINE_FAIL',
  );

  return {
    runtime,
    registry: probe.registry,
    classicalBenchmark,
    softWire: probeSoftWires(),
    el1El4Pass: assertEl1El4Pass(runtime),
    githubSot: GITHUB_SOT_ISSUE,
    honesty: {
      banner: HONESTY_BANNER,
      locks: EL_LOCKS,
      hardwareProbe: hardwareProbeHonesty(),
      heartbeat: heartbeatHonesty(),
      classicalBenchmark: classicalBenchmarkHonesty(),
      onnx: onnxAdapterHonesty(),
    },
  };
}
