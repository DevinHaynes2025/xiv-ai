/**
 * 62L-EX1 — Offline Quantum Mission Contract required honesty tests.
 * Script: npm run test:62lex1
 * Deterministic. No network. No fabricated QPU. L4 remains false.
 * Do not report unrun tests as PASS.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EX1_LOCKS,
  advanceQuantumMission,
  applyNeuralPathwayLesson,
  applyReclassification,
  assertEx1LocksIntact,
  attachClassicalBaseline,
  auditEx1SoftWires,
  completeMissionWithReceipt,
  createExecutionReceipt,
  createQuantumMissionContract,
  evaluateClassicalBaselineGate,
  evaluateQuantumAdvantageGate,
  evaluateQuantumHandoff,
  ex1L4AutonomyEnabled,
  guardianRlsUnchangedByEx1,
  reclassifyExecution,
  routeOfflineDevice,
  setQuantumAdvantageFlag,
  spawnQuantumChild,
  type QuantumMissionContract,
} from './quantum';
import { openAgentRuntime } from './agentmesh';

const NOW = '2026-09-09T22:00:00.000Z';
const FUTURE = '2026-12-31T00:00:00.000Z';
const PAST = '2026-01-01T00:00:00.000Z';
const HERE = dirname(fileURLToPath(import.meta.url));

function baseInput(
  overrides: Partial<Parameters<typeof createQuantumMissionContract>[0]> = {},
): Parameters<typeof createQuantumMissionContract>[0] {
  return {
    missionId: 'qm-ex1-1',
    taskId: 'qt-parent-1',
    agentId: 'agent-q-research-1',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    problemClass: 'OPTIMIZATION',
    objective: 'minimize routing cost under offline constraints',
    inputDataClass: 'BENCHMARK_FIXTURE',
    privacyClass: 'TENANT_PRIVATE',
    allowedExecutionClasses: [
      'CLASSICAL',
      'QUANTUM_INSPIRED',
      'SIMULATED_QUANTUM',
      'PHYSICAL_QPU_VERIFIED',
    ],
    preferredExecutionClass: 'CLASSICAL',
    classicalBaselineRequired: true,
    computeBudget: { maxCpuMs: 60_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
    memoryBudget: { maxMb: 512 },
    timeBudget: { maxWallClockMs: 120_000 },
    externalCostBudget: { maxUsd: 0 },
    allowedProviders: [],
    allowedDevices: ['LOCAL_CPU', 'LOCAL_QUANTUM_SIMULATOR', 'QUANTUM_INSPIRED_CLASSICAL_RUNTIME'],
    evidenceRequirements: ['receipt', 'classification', 'actualDevice'],
    benchmarkRequirements: ['classical_baseline'],
    returnPath: 'home-base://quantum/returns',
    expiresAt: FUTURE,
    agentRole: 'QuantumResearchAgent',
    offlineDisconnected: true,
    physicalQpuAvailable: false,
    poweredOff: false,
    requestedDevice: 'LOCAL_CPU',
    now: NOW,
    ...overrides,
  };
}

function requireMission(
  result: ReturnType<typeof createQuantumMissionContract>,
): QuantumMissionContract {
  assert.equal(result.ok, true, result.ok === false ? result.reason : 'expected ok');
  return result.mission;
}

// --- 1. offline QPU → WAITING_PROVIDER ---
{
  const result = createQuantumMissionContract(
    baseInput({
      preferredExecutionClass: 'PHYSICAL_QPU_VERIFIED',
      requestedDevice: 'PHYSICAL_QPU',
      offlineDisconnected: true,
      physicalQpuAvailable: false,
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.mission.workState, 'WAITING_PROVIDER');
  assert.match(result.ok === false ? result.reason : '', /PHYSICAL_QPU/);

  const route = routeOfflineDevice({
    requestedDevice: 'CLOUD_QPU',
    offlineDisconnected: true,
    physicalQpuAvailable: false,
  });
  assert.equal(route.workState, 'WAITING_PROVIDER');
  assert.equal(route.fabricated, false);
  console.log('PASS: 1 offline QPU → WAITING_PROVIDER (no fabricate)');
}

// --- 2. local CPU → CLASSICAL ---
{
  const mission = requireMission(
    createQuantumMissionContract(
      baseInput({
        preferredExecutionClass: 'CLASSICAL',
        requestedDevice: 'LOCAL_CPU',
      }),
    ),
  );
  assert.equal(mission.classification, 'CLASSICAL');
  assert.equal(mission.workState, 'LOCAL_READY');
  const running = advanceQuantumMission(mission, { markRunning: true, now: NOW });
  assert.equal(running.ok, true);
  assert.equal(running.mission.workState, 'RUNNING_CLASSICAL');
  console.log('PASS: 2 local CPU → CLASSICAL');
}

// --- 3. quantum-inspired CPU/GPU → QUANTUM_INSPIRED ---
{
  const cpu = requireMission(
    createQuantumMissionContract(
      baseInput({
        preferredExecutionClass: 'QUANTUM_INSPIRED',
        requestedDevice: 'LOCAL_CPU',
        agentRole: 'QuantumInspiredAgent',
        problemClass: 'ANNEALING_INSPIRED',
      }),
    ),
  );
  assert.equal(cpu.classification, 'QUANTUM_INSPIRED');

  const gpuRoute = routeOfflineDevice({
    requestedDevice: 'VERIFIED_LOCAL_GPU',
    preferredExecutionClass: 'QUANTUM_INSPIRED',
    offlineDisconnected: true,
    physicalQpuAvailable: false,
  });
  assert.equal(gpuRoute.classification, 'QUANTUM_INSPIRED');
  console.log('PASS: 3 quantum-inspired CPU/GPU → QUANTUM_INSPIRED');
}

// --- 4. simulator → SIMULATED_QUANTUM ---
{
  const mission = requireMission(
    createQuantumMissionContract(
      baseInput({
        preferredExecutionClass: 'SIMULATED_QUANTUM',
        requestedDevice: 'LOCAL_QUANTUM_SIMULATOR',
        agentRole: 'SimulationAgent',
      }),
    ),
  );
  assert.equal(mission.classification, 'SIMULATED_QUANTUM');
  const running = advanceQuantumMission(mission, { markRunning: true, now: NOW });
  assert.equal(running.mission.workState, 'RUNNING_SIMULATOR');
  console.log('PASS: 4 simulator → SIMULATED_QUANTUM');
}

// --- 5. simulator cannot become PHYSICAL_QPU_VERIFIED ---
{
  const mission = requireMission(
    createQuantumMissionContract(
      baseInput({
        preferredExecutionClass: 'SIMULATED_QUANTUM',
        requestedDevice: 'LOCAL_QUANTUM_SIMULATOR',
      }),
    ),
  );
  const denied = reclassifyExecution(mission, 'PHYSICAL_QPU_VERIFIED', {
    explicit: true,
    physicalQpuVerified: true,
  });
  assert.equal(denied.ok, false);
  assert.match(denied.ok === false ? denied.reason : '', /SIMULATOR_CANNOT_BECOME_PHYSICAL/);
  const silent = reclassifyExecution(mission, 'CLASSICAL', { explicit: false });
  assert.equal(silent.ok, false);
  assert.match(silent.ok === false ? silent.reason : '', /SILENT_RECLASSIFICATION/);
  const applied = applyReclassification(mission, 'PHYSICAL_QPU_VERIFIED', {
    explicit: true,
    physicalQpuVerified: true,
  });
  assert.equal(applied.ok, false);
  console.log('PASS: 5 simulator cannot become PHYSICAL_QPU_VERIFIED');
}

// --- 6. missing classical baseline blocks advantage claim ---
{
  const mission = requireMission(createQuantumMissionContract(baseInput()));
  const blocked = evaluateClassicalBaselineGate({
    mission,
    claimKind: 'FASTER',
    quantumCandidatePresent: true,
  });
  assert.equal(blocked.allowed, false);
  assert.match(blocked.reason, /MISSING_CLASSICAL_BASELINE/);

  const withBaseline = attachClassicalBaseline(mission, {
    baselineId: 'bl-1',
    algorithm: 'dijkstra',
    input: 'graph-fixture-a',
    problemSize: 128,
    seedOrConfig: 'seed=42',
    precisionOrTolerance: '1e-6',
    hardware: 'LOCAL_CPU',
    runtimeMs: 12,
    latencyMs: 12,
    memoryMb: 64,
    outputQuality: 'optimal_path',
    successCriteria: 'cost_min',
    recorded: true,
  });
  const okBase = evaluateClassicalBaselineGate({
    mission: withBaseline,
    claimKind: 'FASTER',
    quantumCandidatePresent: true,
  });
  assert.equal(okBase.allowed, true);

  const adv = evaluateQuantumAdvantageGate({
    mission: withBaseline,
    physicalQpuVerified: false,
    classicalBaselineEquivalent: true,
    reproducibleComparableBenchmark: true,
    reviewGatePassed: true,
  });
  assert.equal(adv.quantumAdvantageVerified, false);
  assert.equal(adv.allowed, false);
  const flagged = setQuantumAdvantageFlag(withBaseline, adv);
  assert.equal(flagged.quantumAdvantageVerified, false);
  console.log('PASS: 6 missing classical baseline blocks advantage claim');
}

// --- 7. child permission expansion denied ---
{
  const parent = requireMission(createQuantumMissionContract(baseInput()));
  const expandClass = spawnQuantumChild(parent, {
    childTaskId: 'qt-child-expand',
    childAgentId: 'agent-child-1',
    parentTaskId: parent.taskId,
    purpose: 'expand classes illegally',
    allowedTools: ['local_cpu'],
    allowedData: ['BENCHMARK_FIXTURE'],
    executionClasses: ['CLASSICAL', 'PHYSICAL_QPU_VERIFIED'],
    computeBudget: { maxCpuMs: 10_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
    expiry: FUTURE,
    expectedOutput: 'result',
    evidenceRequirements: ['receipt'],
    returnPath: parent.returnPath,
    tenantId: parent.tenantId,
    universeId: parent.universeId,
    agentRole: 'ClassicalBaselineAgent',
  });
  // PHYSICAL is in parent allowed — tighten parent first
  const tightParent = requireMission(
    createQuantumMissionContract(
      baseInput({
        allowedExecutionClasses: ['CLASSICAL', 'QUANTUM_INSPIRED'],
      }),
    ),
  );
  const expand = spawnQuantumChild(tightParent, {
    childTaskId: 'qt-child-expand-2',
    childAgentId: 'agent-child-2',
    parentTaskId: tightParent.taskId,
    purpose: 'expand classes',
    allowedTools: ['local_cpu'],
    allowedData: ['BENCHMARK_FIXTURE'],
    executionClasses: ['CLASSICAL', 'SIMULATED_QUANTUM'],
    computeBudget: { maxCpuMs: 10_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
    expiry: FUTURE,
    expectedOutput: 'result',
    evidenceRequirements: ['receipt'],
    returnPath: tightParent.returnPath,
    tenantId: tightParent.tenantId,
    universeId: tightParent.universeId,
    agentRole: 'ClassicalBaselineAgent',
  });
  assert.equal(expand.allowed, false);
  if (expand.allowed === false) {
    assert.match(expand.reason, /PERMISSION_EXPANSION|EXECUTION_CLASS/);
  }
  const budget = spawnQuantumChild(parent, {
    childTaskId: 'qt-child-budget',
    childAgentId: 'agent-child-3',
    parentTaskId: parent.taskId,
    purpose: 'budget expand',
    allowedTools: ['local_cpu'],
    allowedData: ['BENCHMARK_FIXTURE'],
    executionClasses: ['CLASSICAL'],
    computeBudget: { maxCpuMs: 999_999, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
    expiry: FUTURE,
    expectedOutput: 'result',
    evidenceRequirements: ['receipt'],
    returnPath: parent.returnPath,
    tenantId: parent.tenantId,
    universeId: parent.universeId,
    agentRole: 'ClassicalBaselineAgent',
  });
  assert.equal(budget.allowed, false);
  void expandClass;
  console.log('PASS: 7 child permission expansion denied');
}

// --- 8. cross-tenant denied ---
{
  const handoff = evaluateQuantumHandoff({
    fromTenantId: 'tenant-a',
    toTenantId: 'tenant-b',
    fromUniverseId: 'universe-a',
    toUniverseId: 'universe-a',
  });
  assert.equal(handoff.allowed, false);
  if (handoff.allowed === false) {
    assert.equal(handoff.reason, 'CROSS_TENANT_HANDOFF_DENIED');
  }
  const parent = requireMission(createQuantumMissionContract(baseInput()));
  const child = spawnQuantumChild(parent, {
    childTaskId: 'qt-x-tenant',
    childAgentId: 'agent-x',
    parentTaskId: parent.taskId,
    purpose: 'cross tenant',
    allowedTools: [],
    allowedData: ['BENCHMARK_FIXTURE'],
    executionClasses: ['CLASSICAL'],
    computeBudget: { maxCpuMs: 100, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
    expiry: FUTURE,
    expectedOutput: 'x',
    evidenceRequirements: ['receipt'],
    returnPath: parent.returnPath,
    tenantId: 'tenant-other',
    universeId: parent.universeId,
    agentRole: 'ReviewerAgent',
  });
  assert.equal(child.allowed, false);
  console.log('PASS: 8 cross-tenant denied');
}

// --- 9. cross-Universe denied ---
{
  const handoff = evaluateQuantumHandoff({
    fromTenantId: 'tenant-a',
    toTenantId: 'tenant-a',
    fromUniverseId: 'universe-a',
    toUniverseId: 'universe-b',
  });
  assert.equal(handoff.allowed, false);
  if (handoff.allowed === false) {
    assert.equal(handoff.reason, 'CROSS_UNIVERSE_HANDOFF_DENIED');
  }
  console.log('PASS: 9 cross-Universe denied');
}

// --- 10. expired mission stops ---
{
  const result = createQuantumMissionContract(baseInput({ expiresAt: PAST, now: NOW }));
  assert.equal(result.ok, false);
  assert.equal(result.mission.workState, 'EXPIRED');

  const live = requireMission(createQuantumMissionContract(baseInput()));
  const advanced = advanceQuantumMission(live, { now: '2027-01-01T00:00:00.000Z' });
  assert.equal(advanced.ok, false);
  assert.equal(advanced.state, 'EXPIRED');
  console.log('PASS: 10 expired mission stops');
}

// --- 11. powered-off → OFFLINE_STOPPED ---
{
  const powered = createQuantumMissionContract(baseInput({ poweredOff: true }));
  assert.equal(powered.ok, false);
  assert.equal(powered.mission.workState, 'OFFLINE_STOPPED');

  const live = requireMission(createQuantumMissionContract(baseInput()));
  const stopped = advanceQuantumMission(live, { poweredOff: true, now: NOW });
  assert.equal(stopped.ok, false);
  assert.equal(stopped.state, 'OFFLINE_STOPPED');
  assert.match(stopped.ok === false ? stopped.reason : '', /NEVER_CLAIM_CONTINUED/);
  console.log('PASS: 11 powered-off → OFFLINE_STOPPED');
}

// --- 12. receipt records actual device/runtime ---
{
  const mission = requireMission(
    createQuantumMissionContract(
      baseInput({
        preferredExecutionClass: 'CLASSICAL',
        requestedDevice: 'LOCAL_CPU',
      }),
    ),
  );
  const receipt = createExecutionReceipt({
    receiptId: 'rcpt-1',
    mission,
    requestedDevice: 'LOCAL_CPU',
    actualDevice: 'LOCAL_CPU',
    requestedRuntime: 'classical-v1',
    actualRuntime: 'classical-v1',
    modelOrAlgorithm: 'dijkstra',
    version: '0.0.1',
    inputHash: 'sha256:abc',
    startedAt: NOW,
    completedAt: NOW,
    runtimeMs: 15,
    memoryUsage: 32,
    resultState: 'COMPLETED',
    outputEvidence: ['path-cost=12'],
    limitations: ['offline-only'],
  });
  assert.equal(receipt.ok, true);
  if (receipt.ok) {
    assert.equal(receipt.receipt.actualDevice, 'LOCAL_CPU');
    assert.equal(receipt.receipt.actualRuntime, 'classical-v1');
    assert.equal(receipt.receipt.fabricated, false);
  }

  const completed = completeMissionWithReceipt(mission, {
    receiptId: 'rcpt-2',
    requestedDevice: 'LOCAL_CPU',
    actualDevice: 'LOCAL_CPU',
    requestedRuntime: 'classical-v1',
    actualRuntime: 'classical-v1',
    modelOrAlgorithm: 'dijkstra',
    version: '0.0.1',
    inputHash: 'sha256:abc',
    startedAt: NOW,
    completedAt: NOW,
    runtimeMs: 15,
    memoryUsage: 32,
    resultState: 'COMPLETED',
    outputEvidence: ['path-cost=12'],
  });
  assert.equal(completed.ok, true);
  if (completed.ok) {
    assert.equal(completed.mission.workState, 'COMPLETED');
    assert.equal(completed.receipt.actualDevice, 'LOCAL_CPU');
  }

  const fabricate = createExecutionReceipt({
    receiptId: 'rcpt-bad',
    mission: { ...mission, offlineDisconnected: true, physicalQpuAvailable: false },
    requestedDevice: 'PHYSICAL_QPU',
    actualDevice: 'PHYSICAL_QPU',
    requestedRuntime: 'qpu',
    actualRuntime: 'qpu',
    modelOrAlgorithm: 'qaoa',
    version: '0.0.1',
    inputHash: 'sha256:x',
    startedAt: NOW,
    completedAt: NOW,
    runtimeMs: 1,
    memoryUsage: 1,
    resultState: 'COMPLETED',
    outputEvidence: [],
    claimPhysicalQpu: true,
  });
  assert.equal(fabricate.ok, false);
  console.log('PASS: 12 receipt records actual device/runtime');
}

// --- 13. L4 false ---
{
  assert.equal(ex1L4AutonomyEnabled(), false);
  assert.equal(EX1_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx1LocksIntact(), true);
  const mesh = openAgentRuntime({
    runtimeId: 'rt-ex1',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    agentId: 'agent-q-research-1',
    mode: 'OFFLINE_LIMITED',
  });
  assert.equal(mesh.l4Enabled, false);
  console.log('PASS: 13 L4_AUTONOMY_ENABLED=false');
}

// --- 14. Guardian/RLS unchanged ---
{
  assert.equal(guardianRlsUnchangedByEx1(), true);
  assert.equal(EX1_LOCKS.BYPASS_GUARDIAN_RLS, false);
  const lessonDenied = applyNeuralPathwayLesson({
    stage: 'LESSON',
    mayChangeRouting: true,
    mayChangeResearchPriority: true,
    mayChangeConfidence: true,
    mayChangeRetest: true,
    mayChangeGuardian: true,
    mayChangeRls: false,
    mayChangePermissions: false,
    mayChangeTenant: false,
    mayChangeUniverse: false,
    mayChangeFinancialAuthority: false,
    mayChangeProductionAuthority: false,
  });
  assert.equal(lessonDenied.allowed, false);
  const guardianDir = join(HERE, 'guardian');
  assert.equal(existsSync(guardianDir), true, 'guardian module must remain present/unmutated');
  console.log('PASS: 14 Guardian/RLS unchanged');
}

// Soft-wire honesty (presence ≠ VERIFIED)
{
  const wires = auditEx1SoftWires();
  assert.equal(wires.agentMesh.verified, false);
  assert.equal(wires.agentMesh.present, true);
  assert.ok(
    wires.chipgraph.disposition === 'PRESENT_UNVERIFIED' ||
      wires.chipgraph.disposition === 'WAITING_DATA',
  );
  assert.equal(wires.chipgraph.verified, false);
  console.log('PASS: soft-wire audit (presence ≠ VERIFIED; absent → WAITING_DATA)');
}

console.log('\n62L-EX1: all required tests PASS');
