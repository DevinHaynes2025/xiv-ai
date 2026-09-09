/**
 * 62L-EW7 — AMD Local Communication Adapter honesty + denial tests.
 *
 * Script: npm run test:62lew7
 * Parent: Global Operations Brain / #169 / 62L-EW
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EW7_LOCKS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  NEXT_STORY_TITLE,
  amdEnvironmentHonesty,
  assertEw7LocksIntact,
  createAmdLocalCommunicationAdapter,
  createComputeEnvelope,
  defaultAmdDeviceTable,
  defaultPressureForTests,
  missingReceiptOutcome,
  runAmdLocalCommunicationAdapterCycle,
  type AmdDeviceRecord,
  type AmdDevice,
  type ComputeRequestEnvelope,
  type TenantScope,
} from './index.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

const scopeA: TenantScope = {
  orgId: 'org-a',
  tenantId: 'tenant-a',
  universeId: 'uni-a',
};

const scopeB: TenantScope = {
  orgId: 'org-b',
  tenantId: 'tenant-b',
  universeId: 'uni-b',
};

function baseEnvelope(
  overrides?: Partial<ComputeRequestEnvelope>,
): ComputeRequestEnvelope {
  const now = Date.now();
  return createComputeEnvelope({
    requestId: 'req-1',
    missionId: 'mission-1',
    taskId: 'task-1',
    agentId: 'agent-1',
    tenantId: scopeA.tenantId,
    universeId: scopeA.universeId,
    orgId: scopeA.orgId,
    modelId: 'model-local-cpu',
    workloadId: 'wl-1',
    inputDataClass: 'TENANT_PRIVATE',
    preferredDevice: 'AMD_CPU',
    minimumVerificationState: 'VERIFIED',
    privacyMode: 'TENANT_PRIVATE',
    maxMemoryMb: 512,
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
  overrides: Partial<Record<AmdDevice, Partial<AmdDeviceRecord>>>,
): Record<AmdDevice, AmdDeviceRecord> {
  const base = defaultAmdDeviceTable();
  for (const key of Object.keys(overrides) as AmdDevice[]) {
    base[key] = { ...base[key], ...overrides[key]! };
  }
  return base;
}

test('1. AMD CPU eligible when VERIFIED', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const result = adapter.execute({
    envelope: baseEnvelope({ preferredDevice: 'AMD_CPU' }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    repoRoot,
  });
  assert.equal(result.allowed, true);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.actualDevice, 'AMD_CPU');
  assert.equal(result.receipt!.fallbackUsed, false);
  assert.equal(result.receipt!.resultState, 'PASS');
  assert.equal(result.deviceStatesAfter.AMD_CPU.state, 'VERIFIED');
});

test('2. AMD GPU DETECTED but NOT_TESTED cannot satisfy VERIFIED request', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  // DETECTED without verification — still cannot meet VERIFIED minimum
  // unless fallback. Use DENY_IF_UNAVAILABLE to assert hard deny.
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-gpu-detected',
      preferredDevice: 'AMD_GPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'DENY_IF_UNAVAILABLE',
    }),
    expectedScope: scopeA,
    devices: devicesWith({
      AMD_GPU: {
        state: 'DETECTED',
        detected: true,
        note: 'Radeon detected ≠ GPU inference VERIFIED',
      },
    }),
    repoRoot,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.failureClass, 'MINIMUM_STATE_UNMET');
  assert.notEqual(result.deviceStatesAfter.AMD_GPU.state, 'VERIFIED');
});

test('3. AMD NPU NOT_TESTED cannot satisfy VERIFIED request', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-npu-nt',
      preferredDevice: 'AMD_NPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'DENY_IF_UNAVAILABLE',
    }),
    expectedScope: scopeA,
    devices: devicesWith({
      AMD_NPU: { state: 'NOT_TESTED', detected: false },
    }),
    repoRoot,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.failureClass, 'MINIMUM_STATE_UNMET');
  assert.equal(result.deviceStatesAfter.AMD_NPU.state, 'NOT_TESTED');
});

test('4. GPU→CPU fallback recorded truthfully', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-gpu-fb',
      preferredDevice: 'AMD_GPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'CPU_SAFE',
    }),
    expectedScope: scopeA,
    devices: devicesWith({
      AMD_GPU: { state: 'DETECTED', detected: true },
      AMD_CPU: { state: 'VERIFIED', detected: true },
    }),
    repoRoot,
  });
  assert.equal(result.allowed, true);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.requestedDevice, 'AMD_GPU');
  assert.equal(result.receipt!.actualDevice, 'AMD_CPU');
  assert.equal(result.receipt!.fallbackUsed, true);
  assert.ok(result.receipt!.fallbackReason);
  assert.equal(result.receipt!.requestedDeviceVerified, false);
  // GPU must not become VERIFIED via fallback.
  assert.notEqual(result.deviceStatesAfter.AMD_GPU.state, 'VERIFIED');
  assert.equal(result.deviceStatesAfter.AMD_CPU.state, 'VERIFIED');
});

test('5. NPU→CPU fallback recorded truthfully', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-npu-fb',
      preferredDevice: 'AMD_NPU',
      minimumVerificationState: 'VERIFIED',
      fallbackPolicy: 'CPU_SAFE',
    }),
    expectedScope: scopeA,
    devices: devicesWith({
      AMD_NPU: { state: 'NOT_TESTED' },
      AMD_CPU: { state: 'VERIFIED' },
    }),
    repoRoot,
  });
  assert.equal(result.allowed, true);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.requestedDevice, 'AMD_NPU');
  assert.equal(result.receipt!.actualDevice, 'AMD_CPU');
  assert.equal(result.receipt!.fallbackUsed, true);
  assert.equal(result.receipt!.requestedDeviceVerified, false);
  assert.equal(result.deviceStatesAfter.AMD_NPU.state, 'NOT_TESTED');
});

test('6. expired request denied', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const now = Date.now();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-expired',
      expiresAt: new Date(now - 1000).toISOString(),
    }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    nowMs: now,
    repoRoot,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.failureClass, 'EXPIRED');
});

test('7. over-budget request denied', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-budget',
      computeBudget: 9999,
    }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    maxComputeBudget: 100,
    repoRoot,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.failureClass, 'OVER_BUDGET');
});

test('8. tenant mismatch denied', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-tenant',
      tenantId: 'tenant-evil',
    }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    repoRoot,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.failureClass, 'TENANT_MISMATCH');
});

test('9. Universe mismatch denied', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-uni',
      universeId: 'uni-evil',
    }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    repoRoot,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.failureClass, 'UNIVERSE_MISMATCH');
});

test('10. stale device evidence rejected', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const now = Date.now();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-stale',
      preferredDevice: 'AMD_CPU',
    }),
    expectedScope: scopeA,
    devices: devicesWith({
      AMD_CPU: {
        state: 'VERIFIED',
        lastEvidenceAt: new Date(now - 10_000).toISOString(),
        evidenceMaxAgeMs: 1000,
      },
    }),
    nowMs: now,
    repoRoot,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.failureClass, 'STALE_EVIDENCE');
  assert.equal(result.deviceStatesAfter.AMD_CPU.state, 'STALE');
});

test('11. offline local compute possible where verified', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-offline-local',
      preferredDevice: 'AMD_CPU',
      cloudRequired: false,
      nodePowerState: 'OFFLINE',
    }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    pressure: defaultPressureForTests({ networkAvailable: false }),
    repoRoot,
  });
  assert.equal(result.allowed, true);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.actualDevice, 'AMD_CPU');
  assert.equal(result.receipt!.resultState, 'PASS');
});

test('12. offline cloud-required → WAITING_DATA', () => {
  const adapter = createAmdLocalCommunicationAdapter();
  const result = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-offline-cloud',
      cloudRequired: true,
      nodePowerState: 'OFFLINE',
    }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    pressure: defaultPressureForTests({ networkAvailable: false }),
    repoRoot,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.receipt);
  assert.equal(result.receipt!.resultState, 'WAITING_DATA');
  assert.equal(result.receipt!.failureClass, 'CLOUD_REQUIRED_OFFLINE');
});

test('13. L4 false', () => {
  assert.equal(EW7_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEw7LocksIntact(), true);
  const cycle = runAmdLocalCommunicationAdapterCycle({ repoRoot });
  assert.equal(cycle.l4AutonomyEnabled, false);
  const l4Hop = cycle.hops.find((h) => h.hop === 'l4_autonomy_false');
  assert.ok(l4Hop);
  assert.equal(l4Hop!.state, 'PASS');
});

test('14. Guardian/RLS unchanged (locks) + cross-scope deny + missing receipt UNVERIFIED', () => {
  assert.equal(
    EW7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    true,
  );
  assert.equal(EW7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE, false);
  assert.equal(EW7_LOCKS.CROSS_TENANT_ADAPTER_ACCESS, false);
  assert.equal(EW7_LOCKS.CROSS_UNIVERSE_ADAPTER_ACCESS, false);
  assert.equal(EW7_LOCKS.SEPARATE_AMD_AGENT_SYSTEM, false);
  assert.equal(EW7_LOCKS.MAY_DISABLE_THERMAL_PROTECTIONS, false);
  assert.equal(EW7_LOCKS.FABRICATE_AMD_GPU_VERIFIED, false);
  assert.equal(EW7_LOCKS.FABRICATE_AMD_NPU_VERIFIED, false);

  const env = amdEnvironmentHonesty();
  assert.equal(env.gpuVerified, false);
  assert.equal(env.npuVerified, false);
  assert.equal(env.gpuState, 'NOT_TESTED');
  assert.equal(env.npuState, 'NOT_TESTED');

  // Shared adapter — second agent, same adapter, no extra authority.
  const adapter = createAmdLocalCommunicationAdapter();
  assert.equal(adapter.shared, true);
  assert.equal(adapter.separateAmdAgentSystem, false);

  const a1 = adapter.execute({
    envelope: baseEnvelope({ requestId: 'req-agent1', agentId: 'agent-1' }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    repoRoot,
  });
  const a2 = adapter.execute({
    envelope: baseEnvelope({ requestId: 'req-agent2', agentId: 'agent-2' }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    repoRoot,
  });
  assert.equal(a1.allowed, true);
  assert.equal(a2.allowed, true);

  // Cross-tenant denied.
  const cross = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-cross',
      tenantId: scopeB.tenantId,
      universeId: scopeB.universeId,
      orgId: scopeB.orgId,
    }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    repoRoot,
  });
  assert.equal(cross.allowed, false);

  const missing = missingReceiptOutcome('req-missing');
  assert.equal(missing.verification, 'UNVERIFIED');
  assert.equal(missing.failureClass, 'MISSING_RECEIPT');

  // Sleep/shutdown RUNNING_VERIFIED → OFFLINE_STOPPED
  const stopped = adapter.execute({
    envelope: baseEnvelope({
      requestId: 'req-shutdown',
      nodePowerState: 'SHUTDOWN',
      priorExecutionState: 'RUNNING_VERIFIED',
    }),
    expectedScope: scopeA,
    devices: defaultAmdDeviceTable(),
    repoRoot,
  });
  assert.equal(stopped.allowed, false);
  assert.equal(stopped.receipt!.resultState, 'OFFLINE_STOPPED');

  // Software acceleration may; silicon claim denied.
  const soft = adapter.applySoftwareAcceleration('batching and caching');
  assert.equal(soft.allowed, true);
  const silicon = adapter.applySoftwareAcceleration('overclock GPU voltage');
  assert.equal(silicon.allowed, false);

  assert.equal(GITHUB_SOT_LABEL, '62L-EW7');
  assert.equal(GITHUB_SOT_ISSUE, 169);
  assert.match(NEXT_STORY_TITLE, /EW8/);

  const cycle = runAmdLocalCommunicationAdapterCycle({ repoRoot });
  assert.equal(cycle.guardianRlsUnchanged, true);
  assert.equal(cycle.tipLand, false);
  assert.equal(cycle.managePullRequest, false);
  assert.equal(cycle.amdGpuVerified, false);
  assert.equal(cycle.amdNpuVerified, false);
  // Soft-wires: absent → WAITING_DATA not FAIL
  for (const h of cycle.hops) {
    if (h.hop.endsWith('_soft_wire')) {
      assert.ok(
        h.state === 'PASS' || h.state === 'WAITING_DATA',
        `${h.hop} must be PASS or WAITING_DATA, got ${h.state}`,
      );
    }
  }
});
