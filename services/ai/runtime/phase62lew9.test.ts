/**
 * 62L-EW9 — Intel Adapter Candidate required honesty / denial tests.
 * Run: npm run test:62lew9
 */

import assert from 'node:assert/strict';
import {
  EW9_LOCKS,
  assertEw9LocksIntact,
  createIntelComputeEnvelope,
  createIntelAdapterCandidate,
  defaultIntelDeviceTable,
  defaultIntelRuntimeTable,
  defaultIntelPressureForTests,
  resolveIntelRuntime,
  runIntelAdapterCandidateCycle,
  attemptSilentRuntimeInstall,
  type IntelComputeRequestEnvelope,
  type IntelDeviceCapability,
  type TenantScope,
} from './chipgraph/index.ts';

const SCOPE: TenantScope = {
  orgId: 'org-ew9',
  tenantId: 'tenant-ew9',
  universeId: 'uni-ew9',
};

function baseEnvelope(
  overrides: Partial<IntelComputeRequestEnvelope> = {},
): IntelComputeRequestEnvelope {
  const now = Date.now();
  return createIntelComputeEnvelope({
    requestId: overrides.requestId ?? `req-${now}`,
    missionId: 'mission-ew9',
    taskId: 'task-ew9',
    parentTaskId: null,
    agentId: 'agent-ew9',
    tenantId: SCOPE.tenantId,
    universeId: SCOPE.universeId,
    orgId: SCOPE.orgId,
    workloadId: 'wl-ew9',
    modelId: 'model-ew9',
    inputDataClass: 'XIV_OWNED',
    privacyMode: 'TENANT_PRIVATE',
    preferredDevice: 'INTEL_CPU',
    minimumVerificationState: 'VERIFIED',
    precisionRequirements: ['fp32'],
    memoryRequirementMb: 512,
    maxRuntimeMs: 30_000,
    computeBudget: 100,
    fallbackPolicy: 'CPU_SAFE',
    returnPath: 'xiv-home-base',
    expiresAt: new Date(now + 60_000).toISOString(),
    cloudRequired: false,
    nodePowerState: 'ONLINE',
    priorExecutionState: 'NONE',
    ...overrides,
  });
}

function devicesWith(
  patch: Partial<Record<'INTEL_CPU' | 'INTEL_GPU' | 'INTEL_NPU', Partial<IntelDeviceCapability>>>,
): Record<'INTEL_CPU' | 'INTEL_GPU' | 'INTEL_NPU', IntelDeviceCapability> {
  const base = defaultIntelDeviceTable();
  for (const key of Object.keys(patch) as Array<keyof typeof patch>) {
    base[key] = { ...base[key], ...patch[key]! };
  }
  return base;
}

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

check('1. DOCUMENTED Intel cannot satisfy VERIFIED', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't1',
      preferredDevice: 'INTEL_GPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'DENY_IF_UNAVAILABLE',
    }),
    expectedScope: SCOPE,
    devices: devicesWith({
      INTEL_GPU: {
        state: 'DOCUMENTED',
        detected: false,
        note: 'catalog only',
      },
    }),
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, false);
  assert.notEqual(result.deviceStatesAfter.INTEL_GPU.state, 'VERIFIED');
  assert.ok(
    result.denialReason?.includes('DOCUMENTED') ||
      result.receipt?.failureClass === 'MINIMUM_STATE_UNMET' ||
      result.receipt?.failureClass === 'DEVICE_NOT_ELIGIBLE' ||
      result.receipt?.failureClass === 'RUNTIME_NOT_CONFIGURED',
  );
});

check('2. DETECTED Intel GPU cannot satisfy VERIFIED', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't2',
      preferredDevice: 'INTEL_GPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'DENY_IF_UNAVAILABLE',
    }),
    expectedScope: SCOPE,
    devices: devicesWith({
      INTEL_GPU: {
        state: 'DETECTED',
        detected: true,
        note: 'device seen — not inference verified',
      },
    }),
    runtimes: {
      ...defaultIntelRuntimeTable(),
      INTEL_GPU_RUNTIME: {
        runtimeId: 'INTEL_GPU_RUNTIME',
        state: 'DETECTED',
        configured: true,
        installAttempted: false,
        note: 'detected only',
      },
    },
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, false);
  assert.notEqual(result.deviceStatesAfter.INTEL_GPU.state, 'VERIFIED');
  assert.equal(EW9_LOCKS.DETECTED_EQ_VERIFIED, false);
});

check('3. DETECTED Intel NPU cannot satisfy VERIFIED', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't3',
      preferredDevice: 'INTEL_NPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'DENY_IF_UNAVAILABLE',
    }),
    expectedScope: SCOPE,
    devices: devicesWith({
      INTEL_NPU: {
        state: 'DETECTED',
        detected: true,
        note: 'NPU detected ≠ inference verified',
      },
    }),
    runtimes: {
      ...defaultIntelRuntimeTable(),
      INTEL_NPU_RUNTIME: {
        runtimeId: 'INTEL_NPU_RUNTIME',
        state: 'DETECTED',
        configured: true,
        installAttempted: false,
        note: 'detected only',
      },
    },
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, false);
  assert.notEqual(result.deviceStatesAfter.INTEL_NPU.state, 'VERIFIED');
  assert.equal(EW9_LOCKS.NPU_DETECTED_IMPLIES_NPU_INFERENCE_VERIFIED, false);
});

check('4. CPU verified path can execute', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't4',
      preferredDevice: 'INTEL_CPU',
      minimumVerificationState: 'VERIFIED',
    }),
    expectedScope: SCOPE,
    devices: defaultIntelDeviceTable(),
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, true);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.actualDevice, 'INTEL_CPU');
  assert.equal(result.receipt!.resultState, 'PASS');
  assert.equal(result.deviceStatesAfter.INTEL_CPU.state, 'VERIFIED');
  assert.notEqual(result.deviceStatesAfter.INTEL_GPU.state, 'VERIFIED');
  assert.notEqual(result.deviceStatesAfter.INTEL_NPU.state, 'VERIFIED');
  assert.equal(result.ingest.verification, 'VERIFIED');
});

check('5. GPU→CPU fallback truth', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't5',
      preferredDevice: 'INTEL_GPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'CPU_SAFE',
    }),
    expectedScope: SCOPE,
    devices: devicesWith({
      INTEL_GPU: { state: 'DETECTED', detected: true },
    }),
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, true);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.requestedDevice, 'INTEL_GPU');
  assert.equal(result.receipt!.actualDevice, 'INTEL_CPU');
  assert.equal(result.receipt!.fallbackUsed, true);
  assert.equal(result.receipt!.requestedDeviceVerified, false);
  assert.notEqual(result.deviceStatesAfter.INTEL_GPU.state, 'VERIFIED');
  assert.equal(result.ingest.verification, 'PASS_WITH_FALLBACK');
});

check('6. NPU→CPU fallback truth', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't6',
      preferredDevice: 'INTEL_NPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'CPU_SAFE',
    }),
    expectedScope: SCOPE,
    devices: devicesWith({
      INTEL_NPU: { state: 'DETECTED', detected: true },
    }),
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, true);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.requestedDevice, 'INTEL_NPU');
  assert.equal(result.receipt!.actualDevice, 'INTEL_CPU');
  assert.equal(result.receipt!.fallbackUsed, true);
  assert.equal(result.receipt!.requestedDeviceVerified, false);
  assert.notEqual(result.deviceStatesAfter.INTEL_NPU.state, 'VERIFIED');
});

check('7. missing runtime → NOT_CONFIGURED/UNAVAILABLE', () => {
  const resolved = resolveIntelRuntime({
    preferredDevice: 'INTEL_GPU',
    runtimes: defaultIntelRuntimeTable(),
  });
  assert.equal(resolved.eligible, false);
  assert.ok(
    resolved.failureClass === 'RUNTIME_NOT_CONFIGURED' ||
      resolved.failureClass === 'RUNTIME_UNAVAILABLE',
  );
  assert.ok(
    resolved.runtime.state === 'NOT_CONFIGURED' ||
      resolved.runtime.state === 'UNAVAILABLE',
  );

  const unavailable = resolveIntelRuntime({
    preferredDevice: 'INTEL_NPU',
    runtimes: {
      ...defaultIntelRuntimeTable(),
      INTEL_NPU_RUNTIME: {
        runtimeId: 'INTEL_NPU_RUNTIME',
        state: 'UNAVAILABLE',
        configured: false,
        installAttempted: false,
        note: 'unavailable',
      },
      OPENVINO_COMPATIBLE: {
        runtimeId: 'OPENVINO_COMPATIBLE',
        state: 'UNAVAILABLE',
        configured: false,
        installAttempted: false,
        note: 'unavailable',
      },
    },
  });
  assert.equal(unavailable.eligible, false);
  assert.equal(unavailable.failureClass, 'RUNTIME_UNAVAILABLE');

  const silent = attemptSilentRuntimeInstall();
  assert.equal(silent.attempted, false);
  assert.equal(silent.denied, true);
});

check('8. stale runtime evidence excluded', () => {
  const adapter = createIntelAdapterCandidate();
  const nowMs = Date.now();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't8',
      preferredDevice: 'INTEL_GPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'DENY_IF_UNAVAILABLE',
    }),
    expectedScope: SCOPE,
    devices: devicesWith({
      INTEL_GPU: {
        state: 'VERIFIED',
        detected: true,
        lastEvidenceAt: new Date(nowMs - 10_000_000).toISOString(),
        evidenceMaxAgeMs: 1000,
        note: 'stale',
      },
    }),
    nowMs,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.receipt?.failureClass, 'STALE_EVIDENCE');
  assert.equal(result.deviceStatesAfter.INTEL_GPU.state, 'STALE');
});

check('9. expired task denied', () => {
  const adapter = createIntelAdapterCandidate();
  const nowMs = Date.now();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't9',
      expiresAt: new Date(nowMs - 1000).toISOString(),
    }),
    expectedScope: SCOPE,
    devices: defaultIntelDeviceTable(),
    nowMs,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.receipt?.failureClass, 'EXPIRED');
  assert.ok(result.denialReason?.includes('EXPIRED'));
});

check('10. resource limit → queue/fallback/deny', () => {
  const adapter = createIntelAdapterCandidate();
  const deny = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't10a',
      memoryRequirementMb: 16_000,
    }),
    expectedScope: SCOPE,
    devices: defaultIntelDeviceTable(),
    pressure: defaultIntelPressureForTests({ ramMbAvailable: 1024 }),
    nowMs: Date.now(),
  });
  assert.equal(deny.allowed, false);
  assert.equal(deny.policy?.result, 'DENY');

  const queue = adapter.execute({
    envelope: baseEnvelope({ requestId: 't10b' }),
    expectedScope: SCOPE,
    devices: defaultIntelDeviceTable(),
    pressure: defaultIntelPressureForTests({
      concurrencyInFlight: 4,
      maxConcurrency: 4,
      queueDepth: 0,
      maxQueueDepth: 8,
    }),
    nowMs: Date.now(),
  });
  assert.equal(queue.allowed, false);
  assert.equal(queue.policy?.result, 'QUEUE');

  const fallback = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't10c',
      preferredDevice: 'INTEL_GPU',
      memoryRequirementMb: 4096,
      fallbackPolicy: 'CPU_SAFE',
    }),
    expectedScope: SCOPE,
    devices: devicesWith({
      INTEL_GPU: { state: 'DETECTED', detected: true },
    }),
    pressure: defaultIntelPressureForTests({
      ramMbAvailable: 8192,
      gpuMemoryMbAvailable: 512,
    }),
    nowMs: Date.now(),
  });
  assert.ok(
    fallback.policy?.result === 'FALLBACK' ||
      fallback.receipt?.fallbackUsed === true,
  );
});

check('11. tenant mismatch denied', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't11',
      tenantId: 'other-tenant',
    }),
    expectedScope: SCOPE,
    devices: defaultIntelDeviceTable(),
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, false);
  assert.equal(result.receipt?.failureClass, 'TENANT_MISMATCH');
});

check('12. Universe mismatch denied', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't12',
      universeId: 'other-universe',
    }),
    expectedScope: SCOPE,
    devices: defaultIntelDeviceTable(),
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, false);
  assert.equal(result.receipt?.failureClass, 'UNIVERSE_MISMATCH');
});

check('13. offline web → WAITING_DATA', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't13',
      cloudRequired: true,
      nodePowerState: 'OFFLINE',
    }),
    expectedScope: SCOPE,
    devices: defaultIntelDeviceTable(),
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, false);
  assert.equal(result.receipt?.resultState, 'WAITING_DATA');
  assert.equal(result.receipt?.failureClass, 'CLOUD_REQUIRED_OFFLINE');
});

check('14. hardware shutdown → OFFLINE_STOPPED', () => {
  const adapter = createIntelAdapterCandidate();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 't14',
      nodePowerState: 'SHUTDOWN',
      priorExecutionState: 'RUNNING_VERIFIED',
    }),
    expectedScope: SCOPE,
    devices: defaultIntelDeviceTable(),
    nowMs: Date.now(),
  });
  assert.equal(result.allowed, false);
  assert.equal(result.receipt?.resultState, 'OFFLINE_STOPPED');
  assert.equal(EW9_LOCKS.CLAIM_WORK_WHILE_POWERED_OFF, false);
});

check('15. L4 false', () => {
  assert.equal(EW9_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEw9LocksIntact(), true);
  const cycle = runIntelAdapterCandidateCycle({ scope: SCOPE });
  assert.equal(cycle.l4AutonomyEnabled, false);
  assert.equal(cycle.locksIntact, true);
});

check('16. Guardian/RLS unchanged', () => {
  assert.equal(EW9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE, false);
  assert.equal(EW9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED, true);
  assert.equal(EW9_LOCKS.CROSS_TENANT_ADAPTER_ACCESS, false);
  assert.equal(EW9_LOCKS.CROSS_UNIVERSE_ADAPTER_ACCESS, false);
  assert.equal(EW9_LOCKS.NEURAL_PATHWAY_MAY_INCREASE_PERMISSIONS, false);
  assert.equal(EW9_LOCKS.FABRICATE_INTEL_GPU_VERIFIED, false);
  assert.equal(EW9_LOCKS.FABRICATE_INTEL_NPU_VERIFIED, false);

  const cycle = runIntelAdapterCandidateCycle({ scope: SCOPE });
  assert.equal(cycle.intelGpuVerified, false);
  assert.equal(cycle.intelNpuVerified, false);
  assert.equal(cycle.separateIntelBrain, false);
  assert.equal(cycle.tipLand, false);
  assert.equal(cycle.managePullRequest, false);
});

console.log(`\nAll ${passed} Phase 62L-EW9 Intel adapter unit cases passed.`);
