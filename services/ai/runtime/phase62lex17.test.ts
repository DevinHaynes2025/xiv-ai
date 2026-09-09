/**
 * 62L-EX17 — CPU/GPU/NPU Quantum Pre/Post-Processing Fabric honesty tests.
 * Script: npm run test:62lex17
 * Deterministic. No network. No real QPU.
 * Do not report unrun tests as PASS. L4 remains false.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EX17_LOCKS,
  agentMeshComputeRoleBinding,
  assertEx17LocksIntact,
  auditEx17SoftWires,
  buildComputeStageRequest,
  createAgentMeetingBrief,
  createCrossChipBridge,
  createVirtualChip,
  deviceSatisfiesRequiredTruth,
  ex17L4AutonomyEnabled,
  ex17SoftWireSnapshot,
  guardianRlsUnchangedByEx17,
  isEx17Denial,
  openSoftwareWormhole,
  runComputePipeline,
  validateCheckpointResume,
  type DeviceProfile,
} from './compute-fabric/index.ts';

const NOW = '2026-09-09T23:10:00.000Z';
const HERE = dirname(fileURLToPath(import.meta.url));
const GUARDIAN_DIR = join(HERE, 'guardian');

function hashGuardianTree(dir: string): string {
  const hash = createHash('sha256');
  const walk = (p: string) => {
    if (!existsSync(p)) return;
    for (const name of readdirSync(p).sort()) {
      const full = join(p, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else {
        hash.update(full);
        hash.update(readFileSync(full));
      }
    }
  };
  walk(dir);
  return hash.digest('hex');
}

const GUARDIAN_HASH_BEFORE = hashGuardianTree(GUARDIAN_DIR);

function baseDevices(overrides: Partial<DeviceProfile>[] = []): DeviceProfile[] {
  const base: DeviceProfile[] = [
    {
      deviceId: 'cpu-1',
      computeClass: 'CPU',
      truthState: 'VERIFIED',
      tenantId: 'tenant-a',
      universeId: 'universe-a',
      memoryBytesAvailable: 16_000_000_000,
    },
    {
      deviceId: 'gpu-1',
      computeClass: 'GPU',
      truthState: 'DETECTED',
      tenantId: 'tenant-a',
      universeId: 'universe-a',
      memoryBytesAvailable: 8_000_000_000,
    },
    {
      deviceId: 'npu-1',
      computeClass: 'NPU',
      truthState: 'DETECTED',
      tenantId: 'tenant-a',
      universeId: 'universe-a',
      memoryBytesAvailable: 4_000_000_000,
      npuRuntimeId: 'npu-rt-1',
      npuModelId: 'model-a',
      npuEvidenceCompatible: true,
    },
    {
      deviceId: 'sim-cpu',
      computeClass: 'SIMULATOR_CPU',
      truthState: 'SUPPORTED',
      tenantId: 'tenant-a',
      universeId: 'universe-a',
      memoryBytesAvailable: 8_000_000_000,
    },
  ];
  for (const o of overrides) {
    const idx = base.findIndex(
      (d) => d.deviceId === o.deviceId || d.computeClass === o.computeClass,
    );
    if (idx >= 0) base[idx] = { ...base[idx]!, ...o };
    else base.push(o as DeviceProfile);
  }
  return base;
}

function req(
  overrides: Partial<ReturnType<typeof buildComputeStageRequest>> = {},
): ReturnType<typeof buildComputeStageRequest> {
  return buildComputeStageRequest({
    requestId: 'req-1',
    missionId: 'mission-1',
    stage: 'EXECUTE',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    agentId: 'agent-1',
    requestedDevice: 'CPU',
    requiredTruthState: 'VERIFIED',
    allowCpuFallback: true,
    memoryBudgetBytes: 4_000_000_000,
    estimatedMemoryBytes: 1_000_000_000,
    powerState: 'ON',
    networkOnline: true,
    requiresWebData: false,
    qpuAvailable: false,
    preferredExecutionProfile: 'CPU',
    majorStagesClassical: true,
    offlineLocalEligible: true,
    createdAt: NOW,
    ...overrides,
  });
}

// --- 1. verified CPU route eligibility ---
{
  const result = runComputePipeline({
    request: req({ requestedDevice: 'CPU', requiredTruthState: 'VERIFIED' }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.actualDevice, 'CPU');
    assert.equal(result.fallbackUsed, false);
    assert.equal(result.decision, 'RUN');
  }
  console.log('PASS: 1 verified CPU route eligibility');
}

// --- 2. DETECTED GPU cannot satisfy VERIFIED request ---
{
  assert.equal(deviceSatisfiesRequiredTruth('DETECTED', 'VERIFIED'), false);
  const result = runComputePipeline({
    request: req({
      requestId: 'req-gpu-det',
      requestedDevice: 'GPU',
      requiredTruthState: 'VERIFIED',
      allowCpuFallback: false,
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.equal(result.ok, undefined);
  assert.ok(isEx17Denial(result));
  assert.match(result.reason, /TRUTH|INSUFFICIENT/);
  console.log('PASS: 2 DETECTED GPU cannot satisfy VERIFIED request');
}

// --- 3. DETECTED NPU cannot satisfy VERIFIED request ---
{
  const result = runComputePipeline({
    request: req({
      requestId: 'req-npu-det',
      requestedDevice: 'NPU',
      requiredTruthState: 'VERIFIED',
      allowCpuFallback: false,
      npuRuntimeId: 'npu-rt-1',
      npuModelId: 'model-a',
      npuEvidenceCompatible: true,
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.ok(isEx17Denial(result));
  assert.equal(deviceSatisfiesRequiredTruth('DETECTED', 'VERIFIED'), false);
  console.log('PASS: 3 DETECTED NPU cannot satisfy VERIFIED request');
}

// --- 4. GPU failure → explicit CPU fallback ---
{
  const result = runComputePipeline({
    request: req({
      requestId: 'req-gpu-fb',
      requestedDevice: 'GPU',
      requiredTruthState: 'VERIFIED',
      allowCpuFallback: true,
    }),
    devices: baseDevices([{ computeClass: 'GPU', truthState: 'DEGRADED' }]),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.actualDevice, 'CPU');
    assert.equal(result.fallbackUsed, true);
    assert.ok(result.fallbackReason);
    assert.equal(result.receipt.requestedDevice, 'GPU');
    assert.equal(result.receipt.actualDevice, 'CPU');
  }
  console.log('PASS: 4 GPU failure → explicit CPU fallback');
}

// --- 5. NPU failure → explicit CPU fallback ---
{
  const result = runComputePipeline({
    request: req({
      requestId: 'req-npu-fb',
      requestedDevice: 'NPU',
      requiredTruthState: 'SUPPORTED',
      allowCpuFallback: true,
      npuRuntimeId: 'wrong-rt',
      npuModelId: 'wrong-model',
      npuEvidenceCompatible: false,
    }),
    devices: baseDevices([{ computeClass: 'NPU', truthState: 'SUPPORTED' }]),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.actualDevice, 'CPU');
    assert.equal(result.fallbackUsed, true);
    assert.match(String(result.fallbackReason), /NPU/);
  }
  console.log('PASS: 5 NPU failure → explicit CPU fallback');
}

// --- 6. CPU fallback does not verify accelerator ---
{
  const result = runComputePipeline({
    request: req({
      requestId: 'req-no-verify',
      requestedDevice: 'GPU',
      requiredTruthState: 'VERIFIED',
      allowCpuFallback: true,
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.fallbackUsed, true);
    assert.equal(result.acceleratorVerified, false);
    assert.equal(result.receipt.acceleratorVerified, false);
    assert.equal(EX17_LOCKS.CPU_FALLBACK_VERIFIES_ACCELERATOR, false);
  }
  console.log('PASS: 6 CPU fallback does not verify accelerator');
}

// --- 7. memory-over-budget → denied/reduced ---
{
  const denied = runComputePipeline({
    request: req({
      requestId: 'req-mem-deny',
      estimatedMemoryBytes: 10_000_000_000,
      memoryBudgetBytes: 1_000_000_000,
      allowCpuFallback: false,
      offlineLocalEligible: false,
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.ok(isEx17Denial(denied));
  assert.equal(denied.state, 'DENY_RESOURCE_LIMIT');

  const reduced = runComputePipeline({
    request: req({
      requestId: 'req-mem-reduce',
      estimatedMemoryBytes: 10_000_000_000,
      memoryBudgetBytes: 1_000_000_000,
      allowCpuFallback: true,
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.equal(reduced.ok, true);
  if (reduced.ok) {
    assert.ok(
      reduced.decision === 'THROTTLE' ||
        reduced.receipt.note.includes('REDUCE_SCOPE'),
    );
  }
  console.log('PASS: 7 memory-over-budget → denied/reduced');
}

// --- 8. oversized simulator → denied/reduced ---
{
  const denied = runComputePipeline({
    request: req({
      requestId: 'req-sim-deny',
      requestedDevice: 'SIMULATOR_CPU',
      requiredTruthState: 'SUPPORTED',
      simulatorQubitEstimate: 10_000,
      simulatorQubitBudget: 64,
      allowCpuFallback: false,
      offlineLocalEligible: false,
      estimatedMemoryBytes: 100,
      memoryBudgetBytes: 1_000_000_000,
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.ok(isEx17Denial(denied));
  assert.equal(denied.state, 'DENY_RESOURCE_LIMIT');

  const reduced = runComputePipeline({
    request: req({
      requestId: 'req-sim-reduce',
      requestedDevice: 'SIMULATOR_CPU',
      requiredTruthState: 'SUPPORTED',
      simulatorQubitEstimate: 10_000,
      simulatorQubitBudget: 64,
      allowCpuFallback: true,
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.equal(reduced.ok, true);
  console.log('PASS: 8 oversized simulator → denied/reduced');
}

// --- 9. offline local workload eligible ---
{
  const result = runComputePipeline({
    request: req({
      requestId: 'req-offline-local',
      networkOnline: false,
      requiresWebData: false,
      offlineLocalEligible: true,
      requestedDevice: 'CPU',
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.equal(result.ok, true);
  console.log('PASS: 9 offline local workload eligible');
}

// --- 10. offline web → WAITING_DATA ---
{
  const result = runComputePipeline({
    request: req({
      requestId: 'req-offline-web',
      networkOnline: false,
      requiresWebData: true,
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.ok(isEx17Denial(result));
  assert.equal(result.state, 'WAITING_DATA');
  console.log('PASS: 10 offline web → WAITING_DATA');
}

// --- 11. offline QPU → WAITING_PROVIDER ---
{
  const result = runComputePipeline({
    request: req({
      requestId: 'req-qpu',
      requestedDevice: 'PHYSICAL_QPU_CANDIDATE',
      requiredTruthState: 'DETECTED',
      qpuAvailable: false,
      waitingProvider: true,
      networkOnline: false,
    }),
    devices: baseDevices([
      {
        deviceId: 'qpu-1',
        computeClass: 'PHYSICAL_QPU_CANDIDATE',
        truthState: 'UNAVAILABLE',
        tenantId: 'tenant-a',
        universeId: 'universe-a',
        memoryBytesAvailable: 0,
      },
    ]),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.ok(isEx17Denial(result));
  assert.equal(result.state, 'WAITING_PROVIDER');
  console.log('PASS: 11 offline QPU → WAITING_PROVIDER');
}

// --- 12. powered-off → OFFLINE_STOPPED ---
{
  const result = runComputePipeline({
    request: req({
      requestId: 'req-poweroff',
      powerState: 'OFF',
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.ok(isEx17Denial(result));
  assert.equal(result.state, 'OFFLINE_STOPPED');
  assert.ok(result.checkpoint);
  assert.equal(result.checkpoint!.continuedComputeAfterPowerOff, false);
  const resume = validateCheckpointResume(result.checkpoint!, 'OFF');
  assert.equal(resume.resumable, false);
  assert.equal(resume.continuedComputeAfterPowerOff, false);
  console.log('PASS: 12 powered-off → OFFLINE_STOPPED');
}

// --- 13. pre/execution/post times separate ---
{
  const result = runComputePipeline({
    request: req({ requestId: 'req-timing' }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
    timings: {
      preprocessingMs: 11,
      executionMs: 22,
      postprocessingMs: 7,
      queueMs: 3,
      networkMs: 1,
    },
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    const t = result.benchmark.timing;
    assert.equal(t.preprocessingMs, 11);
    assert.equal(t.executionMs, 22);
    assert.equal(t.postprocessingMs, 7);
    assert.equal(t.queueMs, 3);
    assert.equal(t.networkMs, 1);
    assert.equal(t.totalMs, 11 + 22 + 7 + 3 + 1);
    assert.notEqual(t.preprocessingMs, t.executionMs);
    assert.notEqual(t.executionMs, t.postprocessingMs);
  }
  console.log('PASS: 13 pre/execution/post times separate');
}

// --- 14. failed route creates evidence ---
{
  const result = runComputePipeline({
    request: req({
      requestId: 'req-ev',
      requestedDevice: 'GPU',
      requiredTruthState: 'VERIFIED',
      allowCpuFallback: false,
    }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.ok(isEx17Denial(result));
  assert.ok(result.evidence);
  assert.equal(result.evidence.kind, 'ROUTE_FAILURE');
  assert.equal(result.evidenceCreated, true);
  console.log('PASS: 14 failed route creates evidence');
}

// --- 15. learning cannot modify permissions ---
{
  const result = runComputePipeline({
    request: req({ requestId: 'req-learn' }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.ok(result.learning);
    assert.equal(result.learning!.permissionsModified, false);
    assert.equal(EX17_LOCKS.LEARNING_MODIFIES_PERMISSIONS, false);
  }
  console.log('PASS: 15 learning cannot modify permissions');
}

// --- 16. cross-tenant DENIED ---
{
  const result = runComputePipeline({
    request: req({ requestId: 'req-xt' }),
    devices: baseDevices(),
    actorTenantId: 'tenant-b',
    actorUniverseId: 'universe-a',
    nowIso: NOW,
  });
  assert.ok(isEx17Denial(result));
  assert.match(result.reason, /CROSS_TENANT/);
  console.log('PASS: 16 cross-tenant DENIED');
}

// --- 17. cross-Universe DENIED ---
{
  const result = runComputePipeline({
    request: req({ requestId: 'req-xu' }),
    devices: baseDevices(),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-b',
    nowIso: NOW,
  });
  assert.ok(isEx17Denial(result));
  assert.match(result.reason, /CROSS_UNIVERSE/);
  console.log('PASS: 17 cross-Universe DENIED');
}

// --- 18. no hidden CoT persistence ---
{
  const brief = createAgentMeetingBrief({
    briefId: 'brief-1',
    missionId: 'mission-1',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    structuredSummary: 'CPU route preferred; GPU DETECTED only.',
    evidenceRefs: ['ev-1'],
    chainOfThought: 'SECRET_COT_MUST_NOT_PERSIST',
    hiddenCot: 'also-secret',
  });
  assert.ok(!isEx17Denial(brief));
  if (!isEx17Denial(brief)) {
    assert.equal(brief.hiddenCotPersisted, false);
    assert.equal(brief.chainOfThought, null);
    assert.equal(
      JSON.stringify(brief).includes('SECRET_COT_MUST_NOT_PERSIST'),
      false,
    );
  }
  assert.equal(EX17_LOCKS.HIDDEN_COT_PERSISTENCE, false);
  const role = agentMeshComputeRoleBinding('DEVICE_ROUTER');
  assert.equal(role.viaAgentMeshOnly, true);
  assert.equal(role.secondFramework, false);
  console.log('PASS: 18 no hidden CoT persistence');
}

// --- 19. L4 false ---
{
  assert.equal(ex17L4AutonomyEnabled(), false);
  assert.equal(EX17_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx17LocksIntact(), true);
  console.log('PASS: 19 L4 false');
}

// --- 20. Guardian/RLS unchanged ---
{
  assert.equal(guardianRlsUnchangedByEx17(), true);
  assert.equal(EX17_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  const after = hashGuardianTree(GUARDIAN_DIR);
  assert.equal(after, GUARDIAN_HASH_BEFORE);
  // Soft-wire honesty: presence ≠ VERIFIED; absent → WAITING_DATA
  const wires = auditEx17SoftWires();
  for (const key of Object.keys(wires) as (keyof typeof wires)[]) {
    assert.equal(wires[key].verified, false);
    assert.ok(
      wires[key].disposition === 'PRESENT_UNVERIFIED' ||
        wires[key].disposition === 'WAITING_DATA',
    );
  }
  // Soft-wire snapshot helper remains available for ops reports.
  assert.equal(typeof ex17SoftWireSnapshot, 'function');
  void ex17SoftWireSnapshot;
  // Virtual chip + wormhole auth
  const chip = createVirtualChip('vc-1', 'CPU');
  assert.equal(chip.proprietaryInternalsExposed, false);
  const bridge = createCrossChipBridge('br-1', 'CPU', 'GPU');
  assert.equal(bridge.proprietaryInternals, false);
  const deniedWh = openSoftwareWormhole({
    wormholeId: 'wh-1',
    fromNode: 'a',
    toNode: 'b',
    scope: { tenantId: 'tenant-a', universeId: 'universe-a' },
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    guardianActive: true,
    runtimeAuthorized: true,
    bypassAuth: true,
  });
  assert.ok(isEx17Denial(deniedWh));
  console.log('PASS: 20 Guardian/RLS unchanged');
}

console.log('\n62L-EX17: 20/20 PASS');
