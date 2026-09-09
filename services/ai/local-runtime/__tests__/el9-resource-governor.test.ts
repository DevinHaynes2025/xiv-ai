/**
 * 62L-EL9 — Resource governor acceptance tests.
 *
 * These tests MUST execute. Workloads above configured ceilings must be
 * rejected or throttled here — do not mark PASS without running.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EL9_POLICY,
  EL9_GOVERNOR_STATES,
  EL9_LOCKS,
  assertEl9LocksIntact,
  el9SoftWireSnapshot,
  estimateResourceNeed,
  evaluateGovernedRequest,
  evaluateResourceRequest,
  governTaskRequest,
  monitorRunningTask,
  type HostResourceObservation,
  type ResourceGovernorPolicy,
  type TaskResourceRequest,
} from '../resource-governor';

function idleObservation(overrides: Partial<HostResourceObservation> = {}): HostResourceObservation {
  return {
    cpuUtilizationPercent: 10,
    activeWorkers: 0,
    memoryUsedBytes: 256 * 1024 * 1024,
    memoryTotalBytes: 16 * 1024 * 1024 * 1024,
    gpuMemoryUsedBytes: 0,
    gpuMemoryMeasurable: true,
    npuMemoryUsedBytes: 0,
    npuMemoryMeasurable: true,
    activeModelSessions: 0,
    localCacheBytes: 100 * 1024 * 1024,
    queueDepth: 0,
    batteryPercent: 90,
    onAcPower: true,
    thermalState: 'nominal',
    heartbeatState: 'RUNNING_VERIFIED',
    userWorkloadActive: false,
    systemCriticalActive: false,
    ...overrides,
  };
}

const tightPolicy: ResourceGovernorPolicy = {
  ...DEFAULT_EL9_POLICY,
  maxCpuUtilizationPercent: 50,
  maxWorkerCount: 2,
  maxMemoryBytes: 512 * 1024 * 1024,
  maxGpuMemoryBytes: 256 * 1024 * 1024,
  maxNpuMemoryBytes: 128 * 1024 * 1024,
  maxConcurrentModelSessions: 1,
  maxLocalCacheBytes: 1024 * 1024 * 1024,
  maxNetworkBytesPerTask: 10 * 1024 * 1024,
  maxTaskDurationMs: 60_000,
  maxQueueSize: 2,
  minBatteryPercentForBackground: 30,
  offlineResearchBudgetFactor: 0.5,
  cloudSpilloverAuthorized: false,
};

test('EL9 governor states include NORMAL through DENIED plus heartbeat soft-wires', () => {
  for (const state of [
    'NORMAL',
    'THROTTLED',
    'RESOURCE_PRESSURE',
    'THERMAL_LIMIT',
    'BATTERY_SAVER',
    'MEMORY_LIMIT',
    'QUEUE_FULL',
    'DENIED',
    'WAITING_NODE',
    'OFFLINE_STOPPED',
  ] as const) {
    assert.ok(EL9_GOVERNOR_STATES.includes(state));
  }
});

test('EL9 locks: L4 off, no thermal disable, no BIOS/OC/undervolt/fan/power-limit, no unlimited, no auto cloud', () => {
  assert.equal(assertEl9LocksIntact(), true);
  assert.equal(EL9_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EL9_LOCKS.WINDOWS_THERMAL_PROTECTION_DISABLE_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.BIOS_MODIFICATION_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.OVERCLOCK_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.UNDERVOLT_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.FAN_CONTROL_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.POWER_LIMIT_MODIFICATION_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.UNLIMITED_CPU_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.UNLIMITED_GPU_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.UNLIMITED_RAM_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.AUTOMATIC_CLOUD_SPILLOVER_FORBIDDEN, true);
  assert.equal(EL9_LOCKS.GUARDIAN_RLS_APPROVAL_UNCHANGED, true);
});

test('legacy ceiling API still rejects above concurrency/RAM ceilings', () => {
  const result = evaluateResourceRequest(
    { concurrentTasks: 9, estimatedMemoryBytes: 9_000 },
    { maxConcurrentTasks: 4, maxMemoryBytes: 8_000 },
  );
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.length >= 2);
});

test('DEFAULT policy has finite ceilings (no unlimited CPU/GPU/RAM)', () => {
  assert.ok(Number.isFinite(DEFAULT_EL9_POLICY.maxCpuUtilizationPercent));
  assert.ok(DEFAULT_EL9_POLICY.maxCpuUtilizationPercent < Infinity);
  assert.ok(Number.isFinite(DEFAULT_EL9_POLICY.maxWorkerCount));
  assert.ok(Number.isFinite(DEFAULT_EL9_POLICY.maxMemoryBytes));
  assert.ok(DEFAULT_EL9_POLICY.maxGpuMemoryBytes != null);
  assert.ok(Number.isFinite(DEFAULT_EL9_POLICY.maxGpuMemoryBytes as number));
  assert.notEqual(DEFAULT_EL9_POLICY.maxMemoryBytes, Infinity);
});

test('ALLOW within ceilings → NORMAL', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-ok',
      kind: 'search',
      estimatedCpuWorkers: 1,
      estimatedCpuPercent: 5,
      estimatedMemoryBytes: 64 * 1024 * 1024,
      estimatedDurationMs: 5_000,
      costEstimated: true,
    },
    idleObservation(),
    tightPolicy,
  );
  assert.equal(decision.action, 'ALLOW');
  assert.equal(decision.state, 'NORMAL');
  assert.equal(decision.allowed, true);
});

test('ceiling reject: memory above policy → MEMORY_LIMIT DENY', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-mem',
      kind: 'model_session',
      estimatedMemoryBytes: 2 * 1024 * 1024 * 1024,
      modelSessions: 1,
      costEstimated: true,
    },
    idleObservation(),
    tightPolicy,
  );
  assert.equal(decision.allowed, false);
  assert.ok(decision.action === 'DENY' || decision.action === 'QUEUE');
  assert.equal(decision.state, 'MEMORY_LIMIT');
  assert.ok(decision.reasons.some((r) => /memory/i.test(r)));
});

test('ceiling reject: workers above policy → DENY', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-workers',
      kind: 'xiv_background',
      estimatedCpuWorkers: 8,
      estimatedMemoryBytes: 32 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation(),
    tightPolicy,
  );
  assert.equal(decision.allowed, false);
  assert.equal(decision.action, 'DENY');
  assert.equal(decision.state, 'DENIED');
  assert.ok(decision.reasons.some((r) => /worker/i.test(r)));
});

test('concurrency pressure with headroom → QUEUE RESOURCE_PRESSURE', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-queue',
      kind: 'search',
      estimatedCpuWorkers: 1,
      estimatedMemoryBytes: 32 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation({ activeWorkers: 2 }),
    tightPolicy,
  );
  assert.equal(decision.action, 'QUEUE');
  assert.equal(decision.state, 'RESOURCE_PRESSURE');
  assert.equal(decision.allowed, false);
});

test('queue full → QUEUE_FULL DENY', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-qf',
      kind: 'search',
      estimatedCpuWorkers: 1,
      estimatedMemoryBytes: 32 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation({ queueDepth: 2 }),
    tightPolicy,
  );
  assert.equal(decision.action, 'DENY');
  assert.equal(decision.state, 'QUEUE_FULL');
});

test('CPU soft overshoot → THROTTLE THROTTLED', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-throttle',
      kind: 'user',
      estimatedCpuWorkers: 1,
      estimatedCpuPercent: 20,
      estimatedMemoryBytes: 32 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation({ cpuUtilizationPercent: 40 }),
    tightPolicy,
  );
  assert.equal(decision.action, 'THROTTLE');
  assert.equal(decision.state, 'THROTTLED');
  assert.equal(decision.allowed, true);
  assert.ok(decision.throttle);
  assert.ok(decision.throttle.maxWorkers < tightPolicy.maxWorkerCount || decision.throttle.maxCpuPercent < tightPolicy.maxCpuUtilizationPercent);
});

test('thermal critical → THERMAL_LIMIT DENY; protections not disabled', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-thermal',
      kind: 'search',
      estimatedMemoryBytes: 32 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation({ thermalState: 'critical' }),
    tightPolicy,
  );
  assert.equal(decision.action, 'DENY');
  assert.equal(decision.state, 'THERMAL_LIMIT');
  assert.ok(decision.reasons.some((r) => /thermal protections remain enabled/i.test(r)));
  assert.equal(decision.locks.WINDOWS_THERMAL_PROTECTION_DISABLE_FORBIDDEN, true);
  assert.equal(decision.locks.FAN_CONTROL_FORBIDDEN, true);
});

test('battery low on DC for background → BATTERY_SAVER QUEUE', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-batt',
      kind: 'offline_research',
      estimatedMemoryBytes: 32 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation({ onAcPower: false, batteryPercent: 10 }),
    tightPolicy,
  );
  assert.equal(decision.action, 'QUEUE');
  assert.equal(decision.state, 'BATTERY_SAVER');
  assert.equal(decision.priorityDeferred, true);
});

test('no automatic cloud spillover without separate authorization → DENY', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-cloud',
      kind: 'simulation',
      estimatedMemoryBytes: 64 * 1024 * 1024,
      costEstimated: true,
      requestsCloudSpillover: true,
    },
    idleObservation(),
    { ...tightPolicy, cloudSpilloverAuthorized: false },
  );
  assert.equal(decision.action, 'DENY');
  assert.equal(decision.state, 'DENIED');
  assert.equal(decision.cloudSpillover, 'DENIED_NO_AUTHORIZATION');
});

test('simulation without cost estimate → DENY', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-sim',
      kind: 'simulation',
      // no estimatedMemoryBytes / costEstimated
    },
    idleObservation(),
    tightPolicy,
  );
  assert.equal(decision.action, 'DENY');
  assert.ok(decision.reasons.some((r) => /estimate/i.test(r)));
});

test('offline research uses bounded budget factor (stricter ceilings)', () => {
  const request: TaskResourceRequest = {
    taskId: 't-offline',
    kind: 'offline_research',
    estimatedMemoryBytes: 300 * 1024 * 1024, // under full 512MiB, over 50% budget
    costEstimated: true,
  };
  const decision = governTaskRequest(request, idleObservation(), tightPolicy);
  assert.equal(decision.allowed, false);
  assert.ok(
    decision.state === 'MEMORY_LIMIT' || decision.state === 'DENIED' || decision.action === 'QUEUE',
  );
});

test('GPU memory not measurable → QUEUE rather than destabilize', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-gpu',
      kind: 'model_session',
      estimatedMemoryBytes: 64 * 1024 * 1024,
      estimatedGpuMemoryBytes: 128 * 1024 * 1024,
      modelSessions: 1,
      costEstimated: true,
    },
    idleObservation({ gpuMemoryMeasurable: false }),
    tightPolicy,
  );
  assert.equal(decision.action, 'QUEUE');
  assert.equal(decision.state, 'RESOURCE_PRESSURE');
  assert.ok(decision.reasons.some((r) => /GPU memory is not measurable/i.test(r)));
});

test('user/system-critical priority defers XIV background', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-prio',
      kind: 'xiv_background',
      estimatedMemoryBytes: 32 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation({ userWorkloadActive: true }),
    tightPolicy,
  );
  assert.equal(decision.action, 'QUEUE');
  assert.equal(decision.priorityDeferred, true);
  assert.ok(decision.reasons.some((r) => /priority/i.test(r)));
});

test('heartbeat OFFLINE_STOPPED / WAITING_NODE soft-wire', () => {
  const offline = governTaskRequest(
    {
      taskId: 't-off',
      kind: 'search',
      estimatedMemoryBytes: 16 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation({ heartbeatState: 'OFFLINE_STOPPED' }),
    tightPolicy,
  );
  assert.equal(offline.state, 'OFFLINE_STOPPED');
  assert.equal(offline.action, 'DENY');

  const waiting = governTaskRequest(
    {
      taskId: 't-wait',
      kind: 'search',
      estimatedMemoryBytes: 16 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation({ heartbeatState: 'WAITING_NODE' }),
    tightPolicy,
  );
  assert.equal(waiting.state, 'WAITING_NODE');
  assert.equal(waiting.action, 'DENY');
});

test('monitor stops safely on memory / thermal / duration exceed', () => {
  const mem = monitorRunningTask({
    ...idleObservation(),
    taskId: 'run-1',
    elapsedMs: 1_000,
    memoryBytesInUse: tightPolicy.maxMemoryBytes + 1,
    cpuPercentInUse: 10,
  }, tightPolicy);
  assert.equal(mem.action, 'STOP_SAFE');
  assert.equal(mem.state, 'MEMORY_LIMIT');

  const thermal = monitorRunningTask({
    ...idleObservation({ thermalState: 'critical' }),
    taskId: 'run-2',
    elapsedMs: 1_000,
    memoryBytesInUse: 10,
    cpuPercentInUse: 10,
  }, tightPolicy);
  assert.equal(thermal.action, 'STOP_SAFE');
  assert.equal(thermal.state, 'THERMAL_LIMIT');

  const dur = monitorRunningTask({
    ...idleObservation(),
    taskId: 'run-3',
    elapsedMs: tightPolicy.maxTaskDurationMs + 1,
    memoryBytesInUse: 10,
    cpuPercentInUse: 10,
  }, tightPolicy);
  assert.equal(dur.action, 'STOP_SAFE');
});

test('estimateResourceNeed marks large simulations', () => {
  const est = estimateResourceNeed({
    taskId: 'sim-large',
    kind: 'simulation',
    estimatedMemoryBytes: 2 * 1024 * 1024 * 1024,
    estimatedDurationMs: 20 * 60 * 1000,
    costEstimated: true,
  });
  assert.equal(est.largeSimulation, true);
  assert.equal(est.costEstimated, true);
});

test('evaluateGovernedRequest is the estimate→compare pipeline entry', () => {
  const decision = evaluateGovernedRequest(
    {
      taskId: 'pipe',
      kind: 'search',
      estimatedMemoryBytes: 16 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation(),
    tightPolicy,
  );
  assert.equal(decision.action, 'ALLOW');
});

test('model session ceiling → QUEUE or DENY', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-model',
      kind: 'model_session',
      estimatedMemoryBytes: 32 * 1024 * 1024,
      modelSessions: 1,
      costEstimated: true,
    },
    idleObservation({ activeModelSessions: 1 }),
    tightPolicy,
  );
  assert.equal(decision.allowed, false);
  assert.ok(decision.action === 'QUEUE' || decision.action === 'DENY');
});

test('cache growth above ceiling → DENY', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-cache',
      kind: 'search',
      estimatedMemoryBytes: 16 * 1024 * 1024,
      estimatedCacheBytes: 2 * 1024 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation({ localCacheBytes: 0, memoryUsedBytes: 32 * 1024 * 1024 }),
    tightPolicy,
  );
  assert.equal(decision.action, 'DENY');
  assert.ok(decision.reasons.some((r) => /cache/i.test(r)));
});

test('network above per-task ceiling → DENY', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-net',
      kind: 'search',
      estimatedMemoryBytes: 16 * 1024 * 1024,
      estimatedNetworkBytes: 50 * 1024 * 1024,
      costEstimated: true,
    },
    idleObservation(),
    tightPolicy,
  );
  assert.equal(decision.action, 'DENY');
});

test('duration above ceiling → DENY', () => {
  const decision = governTaskRequest(
    {
      taskId: 't-dur',
      kind: 'simulation',
      estimatedMemoryBytes: 32 * 1024 * 1024,
      estimatedDurationMs: 120_000,
      costEstimated: true,
    },
    idleObservation(),
    tightPolicy,
  );
  assert.equal(decision.action, 'DENY');
});

test('unlimited policy rejected', () => {
  const bad: ResourceGovernorPolicy = {
    ...tightPolicy,
    maxMemoryBytes: Infinity,
  };
  const decision = governTaskRequest(
    {
      taskId: 't-inf',
      kind: 'search',
      estimatedMemoryBytes: 1,
      costEstimated: true,
    },
    idleObservation(),
    bad,
  );
  assert.equal(decision.action, 'DENY');
  assert.ok(decision.reasons.some((r) => /unlimited RAM/i.test(r)));
});

test('soft-wire snapshot for EL7 adapter + EL8 evidence (presence only)', () => {
  const snap = el9SoftWireSnapshot();
  assert.equal(typeof snap.el7AdapterPresent, 'boolean');
  assert.equal(typeof snap.el7SoftWirePresent, 'boolean');
  assert.equal(typeof snap.el8EvidencePresent, 'boolean');
  assert.match(snap.note, /Presence soft-wire only/);
  // After rebase onto EL8 tip: model-load-evidence + el7-soft-wire are expected present.
  assert.equal(snap.el8EvidencePresent, true);
  assert.equal(snap.el7SoftWirePresent, true);
});
