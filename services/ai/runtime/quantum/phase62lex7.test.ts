/**
 * 62L-EX7 — Hybrid Classical/Quantum Router denial + honesty tests.
 *
 * Script: npm run test:62lex7
 *
 * Covers required cases 1–18.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import {
  EX7_CANONICAL_FLOW,
  EX7_DB_CANDIDATES_STATUS,
  EX7_LOCKS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  ROUTE_CLASSES,
  assertEx7LocksIntact,
  ex7L4AutonomyEnabled,
  ex7SoftWireSnapshot,
  guardianRlsUnchangedByEx7,
  type HardwareDeviceRecord,
  type HybridExecutionRequest,
  type RouteClass,
} from './types.ts';
import {
  applyRouteLearning,
  meshRoleMayGrantProductionAuth,
  meshRoleMayModifyPermissions,
  recordExplicitFallback,
  wormholeRequiresAuth,
} from './route-receipt.ts';
import {
  executeHybridRouteDecision,
  selectHybridRoute,
} from './hybrid-router.ts';
import { rankCandidates, scoreRouteCandidate } from './route-score.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../../..');

function isoOffset(msFromNow: number): string {
  return new Date(Date.now() + msFromNow).toISOString();
}

function baseRequest(
  overrides: Partial<HybridExecutionRequest> = {},
): HybridExecutionRequest {
  return {
    requestId: 'req-ex7-001',
    missionId: 'mission-ex7',
    taskId: 'task-route',
    parentMissionId: null,
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    agentId: 'agent-hybrid-1',
    problemClass: 'routing',
    workloadGenomeId: 'genome-route-v1',
    inputDataClass: 'TENANT_SCOPED',
    privacyClass: 'INTERNAL',
    localOnly: false,
    allowedRouteClasses: [...ROUTE_CLASSES],
    preferredRouteClasses: ['CLASSICAL_CPU'],
    minimumEvidenceState: 'VERIFIED',
    latencyBudgetMs: 5000,
    runtimeBudgetMs: 60_000,
    memoryBudgetMb: 256,
    computeBudgetUnits: 10,
    externalCostBudget: 1.0,
    baselineRequired: true,
    qualityTarget: 0.9,
    precision: 'fp64',
    tolerance: 1e-6,
    fallbackPolicy: 'EXPLICIT_CHAIN',
    explicitFallbackChain: ['CLASSICAL_CPU', 'QUANTUM_INSPIRED_CPU'],
    humanApprovalRequired: false,
    returnPath: 'XivHomeBase',
    createdAt: isoOffset(-1000),
    expiresAt: isoOffset(3_600_000),
    callerTenantId: 'tenant-a',
    callerUniverseId: 'universe-a',
    offline: false,
    webFreshRequired: false,
    estimatedExternalCost: 0,
    costBearingPhysicalQpu: false,
    ...overrides,
  };
}

function device(
  partial: Partial<HardwareDeviceRecord> &
    Pick<HardwareDeviceRecord, 'deviceId' | 'routeClass'>,
): HardwareDeviceRecord {
  return {
    vendor: 'GENERIC',
    evidenceState: 'VERIFIED',
    locality: 'LOCAL',
    available: true,
    memoryMb: 8192,
    queueDepth: 0,
    energyProxy: 10,
    estimatedCost: 0,
    startupMs: 50,
    historicalSuccessRate: 0.95,
    benchmarkFreshness: 'FRESH',
    providerAvailable: null,
    runtimeId: 'runtime-local-v0',
    ...partial,
  };
}

test('SoT #170 EX7; next EX8 docs-only; GitLab not invented', () => {
  assert.equal(GITHUB_SOT_ISSUE, 170);
  assert.match(GITHUB_SOT_TITLE, /EX7/);
  assert.match(NEXT_PHASE_TITLE, /EX8/);
  assert.match(GITLAB_MIRROR_NOTE, /needsAuth|not resolved/i);
  assert.equal(EX7_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.ok(EX7_CANONICAL_FLOW.includes('RouteScoring'));
  assert.ok(HONESTY_BANNER.includes('PHYSICAL_QPU_CANDIDATE'));
  assert.equal(assertEx7LocksIntact(), true);
  assert.equal(EX7_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK, false);
  assert.equal(EX7_LOCKS.COLLAPSE_CLASSES_INTO_VAGUE_QUANTUM, false);
  // Never collapse classes — PHYSICAL_QPU_CANDIDATE is distinct.
  assert.ok(ROUTE_CLASSES.includes('PHYSICAL_QPU_CANDIDATE'));
  assert.ok(ROUTE_CLASSES.includes('SIMULATED_QUANTUM_CPU'));
  assert.ok(ROUTE_CLASSES.includes('QUANTUM_INSPIRED_GPU'));
  assert.equal(
    ROUTE_CLASSES.includes('QUANTUM' as RouteClass),
    false,
  );
});

test('soft-wire EX1–EX6 / Agent Mesh / chipgraph / baselines; presence≠VERIFIED', () => {
  const snap = ex7SoftWireSnapshot(repoRoot);
  assert.equal(snap.agentMesh.verified, false);
  assert.equal(snap.ex1Mission.verified, false);
  assert.equal(snap.ex2Baseline.verified, false);
  assert.equal(snap.ex3QuantumInspired.verified, false);
  assert.equal(snap.ex4SimulatorRegistry.verified, false);
  assert.equal(snap.ex5QpuRegistry.verified, false);
  assert.equal(snap.ex6PhysicalReceipt.verified, false);
  assert.equal(snap.chipgraph.verified, false);
  assert.equal(snap.baselines.verified, false);
  // Agent Mesh + Guardian present on xiv-v2 tip; quantum predecessors often WAITING_DATA.
  assert.equal(snap.agentMesh.present, true);
  assert.equal(snap.agentMesh.hopState, 'PASS');
  assert.equal(snap.guardian.present, true);
  if (!snap.ex1Mission.present) {
    assert.equal(snap.ex1Mission.hopState, 'WAITING_DATA');
  }
  if (!snap.ex6PhysicalReceipt.present) {
    assert.equal(snap.ex6PhysicalReceipt.hopState, 'WAITING_DATA');
  }
  if (!snap.chipgraph.present) {
    assert.equal(snap.chipgraph.hopState, 'WAITING_DATA');
  }
});

test('1. verified local CPU eligible', () => {
  const req = baseRequest();
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'local-cpu-0',
        routeClass: 'CLASSICAL_CPU',
        evidenceState: 'VERIFIED',
        locality: 'LOCAL',
      }),
    ],
    baselinePresent: true,
  });
  assert.equal(decision.state, 'ROUTE_SELECTED');
  assert.equal(decision.selectedRouteClass, 'CLASSICAL_CPU');
  assert.equal(decision.selectedDeviceId, 'local-cpu-0');
  assert.ok(decision.eligible.length >= 1);
});

test('2. detected-but-unverified GPU excluded from VERIFIED request', () => {
  const req = baseRequest({
    minimumEvidenceState: 'VERIFIED',
    preferredRouteClasses: ['CLASSICAL_GPU'],
    allowedRouteClasses: ['CLASSICAL_GPU', 'CLASSICAL_CPU'],
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'gpu-detected',
        routeClass: 'CLASSICAL_GPU',
        vendor: 'NVIDIA',
        evidenceState: 'DETECTED',
        locality: 'LOCAL',
      }),
      device({
        deviceId: 'local-cpu-0',
        routeClass: 'CLASSICAL_CPU',
        evidenceState: 'VERIFIED',
      }),
    ],
  });
  assert.ok(
    decision.ineligible.some(
      (i) => i.deviceId === 'gpu-detected' && i.gate === 'EVIDENCE',
    ),
  );
  assert.notEqual(decision.selectedRouteClass, 'CLASSICAL_GPU');
  assert.equal(decision.selectedRouteClass, 'CLASSICAL_CPU');
});

test('3. offline physical QPU → WAITING_PROVIDER', () => {
  const req = baseRequest({
    offline: true,
    preferredRouteClasses: ['PHYSICAL_QPU_CANDIDATE'],
    allowedRouteClasses: ['PHYSICAL_QPU_CANDIDATE'],
    explicitFallbackChain: ['PHYSICAL_QPU_CANDIDATE'],
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'qpu-remote-1',
        routeClass: 'PHYSICAL_QPU_CANDIDATE',
        vendor: 'QPU_PROVIDER',
        locality: 'REMOTE',
        evidenceState: 'VERIFIED',
        providerAvailable: true,
        estimatedCost: 0,
      }),
    ],
    remoteReasons: { 'qpu-remote-1': 'authorized_research_candidate' },
  });
  assert.equal(decision.state, 'WAITING_PROVIDER');
  assert.equal(decision.selected, null);
});

test('4. local simulator remains SIMULATED_QUANTUM', () => {
  const req = baseRequest({
    preferredRouteClasses: ['SIMULATED_QUANTUM_CPU'],
    allowedRouteClasses: ['SIMULATED_QUANTUM_CPU', 'CLASSICAL_CPU'],
    explicitFallbackChain: ['SIMULATED_QUANTUM_CPU'],
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'sim-cpu-0',
        routeClass: 'SIMULATED_QUANTUM_CPU',
        evidenceState: 'VERIFIED',
        locality: 'LOCAL',
      }),
    ],
    baselinePresent: true,
  });
  assert.equal(decision.state, 'ROUTE_SELECTED');
  assert.equal(decision.selectedRouteClass, 'SIMULATED_QUANTUM_CPU');
  assert.ok(
    decision.reasons.some((r) => r.includes('SIMULATED_QUANTUM')),
  );
  assert.notEqual(decision.selectedRouteClass, 'PHYSICAL_QPU_CANDIDATE');
});

test('5. QI GPU remains QUANTUM_INSPIRED', () => {
  const req = baseRequest({
    preferredRouteClasses: ['QUANTUM_INSPIRED_GPU'],
    allowedRouteClasses: ['QUANTUM_INSPIRED_GPU', 'CLASSICAL_CPU'],
    explicitFallbackChain: ['QUANTUM_INSPIRED_GPU'],
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'qi-gpu-0',
        routeClass: 'QUANTUM_INSPIRED_GPU',
        vendor: 'AMD',
        evidenceState: 'VERIFIED',
        locality: 'LOCAL',
      }),
    ],
    baselinePresent: true,
  });
  assert.equal(decision.selectedRouteClass, 'QUANTUM_INSPIRED_GPU');
  assert.ok(decision.reasons.some((r) => r.includes('QUANTUM_INSPIRED')));
  assert.equal(
    decision.selectedRouteClass === ('QUANTUM' as RouteClass),
    false,
  );
});

test('6. missing baseline blocks advantage claim', () => {
  const req = baseRequest({
    baselineRequired: true,
    preferredRouteClasses: ['QUANTUM_INSPIRED_CPU'],
    allowedRouteClasses: ['QUANTUM_INSPIRED_CPU'],
    explicitFallbackChain: ['QUANTUM_INSPIRED_CPU'],
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'qi-cpu-0',
        routeClass: 'QUANTUM_INSPIRED_CPU',
        evidenceState: 'VERIFIED',
      }),
    ],
    baselinePresent: false,
  });
  assert.equal(decision.advantageClaimAllowed, false);
  assert.match(
    decision.advantageClaimBlockReason ?? '',
    /INSUFFICIENT_EVIDENCE|baseline/i,
  );
});

test('7. private local-only data cannot route to cloud/QPU', () => {
  const req = baseRequest({
    localOnly: true,
    privacyClass: 'PRIVATE_LOCAL_ONLY',
    inputDataClass: 'PRIVATE_LOCAL',
    preferredRouteClasses: ['PHYSICAL_QPU_CANDIDATE', 'CLASSICAL_CPU'],
    allowedRouteClasses: ['PHYSICAL_QPU_CANDIDATE', 'CLASSICAL_CPU'],
    explicitFallbackChain: ['PHYSICAL_QPU_CANDIDATE', 'CLASSICAL_CPU'],
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'qpu-cloud',
        routeClass: 'PHYSICAL_QPU_CANDIDATE',
        locality: 'REMOTE',
        vendor: 'QPU_PROVIDER',
        evidenceState: 'VERIFIED',
        providerAvailable: true,
        estimatedCost: 0,
      }),
      device({
        deviceId: 'local-cpu-0',
        routeClass: 'CLASSICAL_CPU',
        evidenceState: 'VERIFIED',
        locality: 'LOCAL',
      }),
    ],
    remoteReasons: { 'qpu-cloud': 'would_need_reason' },
  });
  assert.ok(
    decision.ineligible.some(
      (i) => i.deviceId === 'qpu-cloud' && i.gate === 'DATA_PRIVACY',
    ),
  );
  assert.equal(decision.selectedRouteClass, 'CLASSICAL_CPU');
});

test('8. cost over budget → denied', () => {
  const req = baseRequest({
    externalCostBudget: 1.0,
    estimatedExternalCost: 5.0,
    preferredRouteClasses: ['CLASSICAL_GPU'],
    allowedRouteClasses: ['CLASSICAL_GPU'],
    explicitFallbackChain: ['CLASSICAL_GPU'],
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'remote-gpu',
        routeClass: 'CLASSICAL_GPU',
        locality: 'REMOTE',
        evidenceState: 'VERIFIED',
        estimatedCost: 5.0,
      }),
    ],
    remoteReasons: { 'remote-gpu': 'burst_capacity' },
  });
  assert.ok(
    decision.state === 'ROUTE_DENIED' ||
      decision.state === 'NO_ELIGIBLE_ROUTE' ||
      decision.state === 'RESOURCE_LIMITED',
  );
  assert.equal(decision.selected, null);
  assert.ok(
    decision.ineligible.some((i) => i.gate === 'COST') ||
      decision.reasons.some((r) => /cost|budget/i.test(r)),
  );
});

test('9. cost-bearing physical QPU → HUMAN_APPROVAL_REQUIRED', () => {
  const req = baseRequest({
    costBearingPhysicalQpu: true,
    estimatedExternalCost: 12.5,
    externalCostBudget: 100,
    preferredRouteClasses: ['PHYSICAL_QPU_CANDIDATE'],
    allowedRouteClasses: ['PHYSICAL_QPU_CANDIDATE'],
    explicitFallbackChain: ['PHYSICAL_QPU_CANDIDATE'],
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'qpu-1',
        routeClass: 'PHYSICAL_QPU_CANDIDATE',
        locality: 'REMOTE',
        vendor: 'QPU_PROVIDER',
        evidenceState: 'VERIFIED',
        providerAvailable: true,
        estimatedCost: 12.5,
      }),
    ],
    remoteReasons: { 'qpu-1': 'research_candidate' },
  });
  assert.equal(decision.state, 'HUMAN_APPROVAL_REQUIRED');
  assert.equal(decision.selected, null);
  assert.ok(
    decision.approvalsRequired.includes(
      'HUMAN_APPROVAL_REQUIRED_PHYSICAL_QPU',
    ),
  );
});

test('10. stale benchmark lowers eligibility/confidence', () => {
  const req = baseRequest({
    preferredRouteClasses: ['CLASSICAL_CPU'],
    allowedRouteClasses: ['CLASSICAL_CPU'],
    explicitFallbackChain: [],
    fallbackPolicy: 'NONE',
  });
  const fresh = device({
    deviceId: 'cpu-fresh',
    routeClass: 'CLASSICAL_CPU',
    benchmarkFreshness: 'FRESH',
    historicalSuccessRate: 0.9,
  });
  const stale = device({
    deviceId: 'cpu-stale',
    routeClass: 'CLASSICAL_CPU',
    benchmarkFreshness: 'STALE',
    historicalSuccessRate: 0.99,
  });
  const ranked = rankCandidates(req, [
    {
      candidateId: 'a',
      routeClass: 'CLASSICAL_CPU',
      device: stale,
      localFirstTier: 1,
      remoteReason: null,
    },
    {
      candidateId: 'b',
      routeClass: 'CLASSICAL_CPU',
      device: fresh,
      localFirstTier: 1,
      remoteReason: null,
    },
  ]);
  assert.equal(ranked[0]!.candidate.device.deviceId, 'cpu-fresh');
  const staleScore = scoreRouteCandidate(req, {
    candidateId: 'a',
    routeClass: 'CLASSICAL_CPU',
    device: stale,
    localFirstTier: 1,
    remoteReason: null,
  });
  assert.ok(staleScore.freshness < 0.5);
  assert.ok(staleScore.total < 0.95);
});

test('11. fallback records requested vs actual', () => {
  const req = baseRequest({
    fallbackPolicy: 'EXPLICIT_CHAIN',
    preferredRouteClasses: ['CLASSICAL_GPU'],
    explicitFallbackChain: ['CLASSICAL_GPU', 'CLASSICAL_CPU'],
    allowedRouteClasses: ['CLASSICAL_GPU', 'CLASSICAL_CPU'],
    minimumEvidenceState: 'VERIFIED',
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'gpu-detected',
        routeClass: 'CLASSICAL_GPU',
        evidenceState: 'DETECTED',
      }),
      device({
        deviceId: 'local-cpu-0',
        routeClass: 'CLASSICAL_CPU',
        evidenceState: 'VERIFIED',
      }),
    ],
  });
  assert.equal(decision.state, 'ROUTE_SELECTED');
  assert.deepEqual([...decision.fallbackRequested], [
    'CLASSICAL_GPU',
    'CLASSICAL_CPU',
  ]);
  assert.equal(decision.fallbackActual, 'CLASSICAL_CPU');
  assert.equal(decision.fallbackRecorded, true);
  assert.equal(decision.selectedRouteClass, 'CLASSICAL_CPU');

  const recorded = recordExplicitFallback({
    requested: ['CLASSICAL_GPU', 'CLASSICAL_CPU'],
    actual: 'CLASSICAL_CPU',
    silent: false,
  });
  assert.equal(recorded.ok, true);
  assert.equal(recorded.fallbackRecorded, true);

  const silent = recordExplicitFallback({
    requested: ['CLASSICAL_GPU'],
    actual: 'CLASSICAL_CPU',
    silent: true,
  });
  assert.equal(silent.ok, false);
});

test('12. expired → EXPIRED', () => {
  const req = baseRequest({
    expiresAt: isoOffset(-60_000),
    createdAt: isoOffset(-120_000),
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({ deviceId: 'local-cpu-0', routeClass: 'CLASSICAL_CPU' }),
    ],
  });
  assert.equal(decision.state, 'EXPIRED');
  assert.equal(decision.selected, null);
});

test('13. cross-tenant DENIED', () => {
  const req = baseRequest({
    tenantId: 'tenant-a',
    callerTenantId: 'tenant-b',
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({ deviceId: 'local-cpu-0', routeClass: 'CLASSICAL_CPU' }),
    ],
  });
  assert.equal(decision.state, 'ROUTE_DENIED');
  assert.match(decision.reasons.join(' '), /CROSS_TENANT/);
});

test('14. cross-Universe DENIED', () => {
  const req = baseRequest({
    universeId: 'universe-a',
    callerUniverseId: 'universe-b',
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({ deviceId: 'local-cpu-0', routeClass: 'CLASSICAL_CPU' }),
    ],
  });
  assert.equal(decision.state, 'ROUTE_DENIED');
  assert.match(decision.reasons.join(' '), /CROSS_UNIVERSE/);
});

test('15. no eligible → NO_ELIGIBLE_ROUTE', () => {
  const req = baseRequest({
    allowedRouteClasses: ['CLASSICAL_NPU'],
    preferredRouteClasses: ['CLASSICAL_NPU'],
    explicitFallbackChain: ['CLASSICAL_NPU'],
    minimumEvidenceState: 'VERIFIED',
  });
  const decision = selectHybridRoute(req, {
    devices: [
      device({
        deviceId: 'npu-doc',
        routeClass: 'CLASSICAL_NPU',
        evidenceState: 'DOCUMENTED',
      }),
    ],
  });
  assert.equal(decision.state, 'NO_ELIGIBLE_ROUTE');
  assert.equal(decision.selected, null);
});

test('16. route learning cannot modify permissions', () => {
  const update = applyRouteLearning({
    routeClass: 'CLASSICAL_CPU',
    deviceId: 'local-cpu-0',
    success: true,
    priorState: 'RANKED',
  });
  assert.equal(update.learningState, 'PREFERRED');
  assert.equal(update.permissionsModified, false);
  assert.equal(update.guardianRlsModified, false);
  assert.equal(update.productionAuthGranted, false);
  assert.equal(EX7_LOCKS.ROUTE_LEARNING_MODIFIES_PERMISSIONS, false);
  assert.equal(EX7_LOCKS.PREFERRED_EQ_PRODUCTION_AUTH, false);
  assert.equal(meshRoleMayModifyPermissions('HybridRouterAgent'), false);
  assert.equal(meshRoleMayGrantProductionAuth('HybridRouterAgent'), false);

  const req = baseRequest();
  const decision = selectHybridRoute(req, {
    devices: [
      device({ deviceId: 'local-cpu-0', routeClass: 'CLASSICAL_CPU' }),
    ],
  });
  const receipt = executeHybridRouteDecision(req, decision);
  assert.equal(receipt.permissionsUnchanged, true);
  assert.equal(receipt.guardianRlsUnchanged, true);
  assert.equal(wormholeRequiresAuth('ROUTE_SELECTED'), true);
});

test('17. L4 false', () => {
  assert.equal(EX7_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ex7L4AutonomyEnabled(), false);
  assert.equal(assertEx7LocksIntact(), true);
});

test('18. Guardian/RLS unchanged', () => {
  assert.equal(guardianRlsUnchangedByEx7(), true);
  assert.equal(EX7_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  assert.equal(EX7_LOCKS.BROADEN_PERMISSIONS, false);

  const changed = execSync(
    'git diff --name-only origin/xiv-v2 -- supabase/migrations services/ai/runtime/guardian',
    { cwd: repoRoot, encoding: 'utf8' },
  )
    .trim()
    .split('\n')
    .filter(Boolean);
  assert.deepEqual(
    changed,
    [],
    'Guardian/RLS migrations must be unchanged by EX7',
  );

  const guardianValidate = join(
    repoRoot,
    'services/ai/runtime/guardian/validate.ts',
  );
  assert.equal(existsSync(guardianValidate), true);
  const body = readFileSync(guardianValidate, 'utf8');
  assert.ok(body.length > 0);
});
