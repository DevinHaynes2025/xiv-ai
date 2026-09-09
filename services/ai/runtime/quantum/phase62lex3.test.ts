/**
 * 62L-EX3 — Quantum-Inspired Algorithm Lab required honesty tests.
 * Script: npm run test:62lex3
 *
 * 1. CPU QI run → QUANTUM_INSPIRED
 * 2. GPU QI run → QUANTUM_INSPIRED
 * 3. classical hardware never PHYSICAL_QPU_VERIFIED
 * 4. missing baseline blocks superiority claim
 * 5. mismatched problem size → NOT_COMPARABLE
 * 6. deterministic experiment reproduces within tolerance
 * 7. failed experiment does not strengthen pathway
 * 8. regression lowers route confidence
 * 9. unverified accelerator excluded
 * 10. CPU fallback recorded truthfully
 * 11. cross-tenant denied
 * 12. cross-Universe denied
 * 13. offline external-data → WAITING_DATA
 * 14. child permission expansion denied
 * 15. L4 false
 * 16. Guardian/RLS unchanged
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ALGORITHM_FAMILIES,
  EX3_CANONICAL_FLOW,
  EX3_LOCKS,
  EX3_NEXT_PHASE_TITLE,
  EX3_SOT_ISSUE,
  EX3_SOT_LABEL,
  EXPERIMENT_RESULT_STATES,
  FORBIDDEN_MUTATION_TARGETS,
  EX3_PROBLEM_CLASSES,
  applyQiPathwayOutcome,
  assertEx3LocksIntact,
  assertEx3Scope,
  attemptChildPermissionExpansion,
  buildWorkloadGenome,
  checkReproducibility,
  classicalHardwareMayClaimPhysicalQpu,
  compareQiWithBaseline,
  completeClassicalBaseline,
  createAlgorithmRegistry,
  createClassicalBaseline,
  createEx3Lab,
  createQiCandidate,
  createQiPathway,
  createSoftwareWormhole,
  ex3SoftWireHopState,
  ex3SoftWireSnapshot,
  queryOfflineKnowledge,
  registerAlgorithm,
  routeByGenome,
  routeLocalHardware,
  runDeterministicQiKernel,
  runQiExperiment,
  runQuantumInspiredAlgorithmLabCycle,
  seedExampleQiAlgorithms,
  type ClassicalBaselineReceipt,
  type Ex3TenantScope,
} from './index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../../..');

const scopeA: Ex3TenantScope = {
  orgId: 'org-a',
  tenantId: 'tenant-a',
  universeId: 'uni-a',
};

const scopeB: Ex3TenantScope = {
  orgId: 'org-b',
  tenantId: 'tenant-b',
  universeId: 'uni-b',
};

const scopeAUniB: Ex3TenantScope = {
  orgId: 'org-a',
  tenantId: 'tenant-a',
  universeId: 'uni-b',
};

const GUARDIAN_TREE_SHA_AT_BASE = '57a13d6ab1b812a32a4907de326b27b9a3663fa0';
const GUARDIAN_CONTENT_FP =
  '943901d641a14bcbfa486d74214ead4730f32745a0cacb0ab2de08002f70cf4d';

const criteria = {
  criteriaId: 'crit-1',
  objective: 'min_cost',
  accuracyTolerance: 1e-6,
  mustSatisfyConstraints: true,
  outputObjective: 'minimize',
};

function makeBaseline(problemSize: number): ClassicalBaselineReceipt {
  const ready = createClassicalBaseline({
    baselineId: `bl-${problemSize}`,
    missionId: 'mission-1',
    taskId: 'task-1',
    tenantId: scopeA.tenantId,
    universeId: scopeA.universeId,
    problemClass: 'VEHICLE_ROUTING',
    problemVersion: 'v1',
    algorithmId: 'classical-greedy-v1',
    algorithmVersion: '1.0.0',
    datasetVersion: 'ds-v1',
    problemSize,
    seed: 1,
    precision: 'float64',
    tolerance: 1e-6,
    runtimeId: 'runtime-local',
    runtimeVersion: '1.0.0',
    deviceClass: 'CPU',
    deviceId: 'cpu-1',
    deviceEvidenceState: 'VERIFIED',
    successCriteria: criteria,
    inputPayload: { size: problemSize },
  });
  assert.ok(!('denied' in ready));
  return completeClassicalBaseline({
    receipt: ready,
    success: true,
    runtimeMs: 40,
    memoryPeakMb: 64,
    throughput: 1,
    latency: 40,
    outputPayload: { score: 0.5 },
    qualityMetrics: {
      objectiveValue: 0.5,
      accuracy: 0.9,
      feasibility: true,
      custom: {},
    },
  });
}

function genome(problemSize: number) {
  const g = buildWorkloadGenome({
    problemClass: 'VEHICLE_ROUTING',
    variables: problemSize,
    constraints: 3,
    objectiveFunctions: ['min_cost'],
    graphStructure: 'sparse',
    matrixStructure: 'sparse',
    sparsity: 0.8,
    searchSpaceSize: problemSize * 1000,
    precision: 'float64',
    stochasticity: 'deterministic',
    parallelism: 'data',
    memoryRequirementMb: 128,
    latencyTargetMs: 100,
    problemSize,
  });
  assert.ok(!('denied' in g));
  return g;
}

test('SoT EX3 / #170; next EX4; locks; families; flow', () => {
  assert.equal(EX3_SOT_LABEL, '62L-EX3');
  assert.equal(EX3_SOT_ISSUE, 170);
  assert.match(EX3_NEXT_PHASE_TITLE, /EX4/);
  assert.match(EX3_NEXT_PHASE_TITLE, /Local Quantum Simulator Registry/);
  assert.equal(assertEx3LocksIntact(), true);
  assert.equal(ALGORITHM_FAMILIES.length, 12);
  assert.ok(ALGORITHM_FAMILIES.includes('ANNEALING_INSPIRED'));
  assert.equal(EX3_PROBLEM_CLASSES.length, 16);
  assert.ok(EX3_CANONICAL_FLOW.includes('ClassicalBaseline'));
  assert.ok(EXPERIMENT_RESULT_STATES.includes('PROMOTION_CANDIDATE'));
  assert.ok(FORBIDDEN_MUTATION_TARGETS.includes('GUARDIAN'));
});

test('1) CPU QI run → QUANTUM_INSPIRED', () => {
  const route = routeLocalHardware({
    preferred: 'VERIFIED_CPU',
    available: [
      { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
    ],
  });
  const exp = runQiExperiment({
    experimentId: 't1-cpu',
    algorithmId: 'qi-annealing-v1',
    genome: genome(10),
    baseline: makeBaseline(10),
    route,
    metrics: runDeterministicQiKernel({ seed: 7, problemSize: 10 }),
    seed: 7,
    datasetVersion: 'ds-v1',
    scope: scopeA,
  });
  assert.ok(!('denied' in exp));
  assert.equal(exp.classification, 'QUANTUM_INSPIRED');
  assert.equal(exp.route.actual, 'VERIFIED_CPU');
  assert.equal(exp.physicalQpuVerified, false);
});

test('2) GPU QI run → QUANTUM_INSPIRED', () => {
  const route = routeLocalHardware({
    preferred: 'VERIFIED_AMD_GPU',
    available: [
      { deviceId: 'gpu', hardwareClass: 'VERIFIED_AMD_GPU', evidenceState: 'VERIFIED' },
      { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
    ],
  });
  const exp = runQiExperiment({
    experimentId: 't2-gpu',
    algorithmId: 'qi-annealing-v1',
    genome: genome(10),
    baseline: makeBaseline(10),
    route,
    metrics: runDeterministicQiKernel({ seed: 8, problemSize: 10 }),
    seed: 8,
    datasetVersion: 'ds-v1',
    scope: scopeA,
  });
  assert.ok(!('denied' in exp));
  assert.equal(exp.classification, 'QUANTUM_INSPIRED');
  assert.equal(exp.route.actual, 'VERIFIED_AMD_GPU');
  assert.equal(exp.quantumAdvantageVerified, false);
});

test('3) classical hardware never PHYSICAL_QPU_VERIFIED', () => {
  assert.equal(classicalHardwareMayClaimPhysicalQpu('VERIFIED_CPU'), false);
  assert.equal(classicalHardwareMayClaimPhysicalQpu('VERIFIED_AMD_GPU'), false);
  const route = routeLocalHardware({
    preferred: 'VERIFIED_CPU',
    available: [
      { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
    ],
  });
  assert.equal(route.physicalQpuVerified, false);
  const denied = runQiExperiment({
    experimentId: 't3-deny-qpu',
    algorithmId: 'qi-annealing-v1',
    genome: genome(10),
    baseline: makeBaseline(10),
    route,
    metrics: runDeterministicQiKernel({ seed: 1, problemSize: 10 }),
    seed: 1,
    datasetVersion: 'ds-v1',
    scope: scopeA,
    claimPhysicalQpu: true,
  });
  assert.equal(denied.denied, true);
  assert.match(denied.reason, /PHYSICAL_QPU/);
});

test('4) missing baseline blocks superiority claim', () => {
  const route = routeLocalHardware({
    preferred: 'VERIFIED_CPU',
    available: [
      { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
    ],
  });
  const exp = runQiExperiment({
    experimentId: 't4-no-bl',
    algorithmId: 'qi-annealing-v1',
    genome: genome(10),
    baseline: null,
    route,
    metrics: runDeterministicQiKernel({ seed: 2, problemSize: 10 }),
    seed: 2,
    datasetVersion: 'ds-v1',
    scope: scopeA,
  });
  assert.ok(!('denied' in exp));
  const cmp = compareQiWithBaseline(exp, { claimSuperiority: true });
  assert.equal(cmp.superiorityClaimAllowed, false);
  assert.match(cmp.reason, /MISSING_BASELINE/);
});

test('5) mismatched problem size → NOT_COMPARABLE', () => {
  const route = routeLocalHardware({
    preferred: 'VERIFIED_CPU',
    available: [
      { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
    ],
  });
  const exp = runQiExperiment({
    experimentId: 't5-size',
    algorithmId: 'qi-annealing-v1',
    genome: genome(40),
    baseline: makeBaseline(10),
    route,
    metrics: runDeterministicQiKernel({ seed: 3, problemSize: 40 }),
    seed: 3,
    datasetVersion: 'ds-v1',
    scope: scopeA,
  });
  assert.ok(!('denied' in exp));
  const cmp = compareQiWithBaseline(exp);
  assert.equal(cmp.state, 'NOT_COMPARABLE');
});

test('6) deterministic experiment reproduces within tolerance', () => {
  const a = runDeterministicQiKernel({ seed: 99, problemSize: 25, iterations: 64 });
  const b = runDeterministicQiKernel({ seed: 99, problemSize: 25, iterations: 64 });
  const check = checkReproducibility(a, b, 1e-12);
  assert.equal(check.reproducible, true);
  assert.equal(check.state, 'REPRODUCIBLE');
  assert.equal(check.maxAbsDelta, 0);
});

test('7) failed experiment does not strengthen pathway', () => {
  const path = createQiPathway('cpu-annealing');
  const beforeConf = path.confidence;
  const after = applyQiPathwayOutcome(path, 'FAIL');
  assert.ok(after.confidence <= beforeConf);
  assert.equal(EX3_LOCKS.STRENGTHEN_PATHWAY_ON_FAILURE, false);
});

test('8) regression lowers route confidence', () => {
  const path = createQiPathway('gpu-annealing');
  const boosted = applyQiPathwayOutcome(path, 'PASS');
  const regressed = applyQiPathwayOutcome(boosted, 'REGRESSED');
  assert.ok(regressed.confidence < boosted.confidence);

  const route = routeLocalHardware({
    preferred: 'VERIFIED_CPU',
    available: [
      { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
    ],
  });
  const baseline = makeBaseline(10);
  const exp = runQiExperiment({
    experimentId: 't8-reg',
    algorithmId: 'qi-annealing-v1',
    genome: genome(10),
    baseline,
    route,
    metrics: {
      latencyMs: 200,
      solutionQuality: 0.1,
      memoryMb: 64,
      reliability: 0.99,
      costEnergyProxy: 2,
    },
    seed: 4,
    datasetVersion: 'ds-v1',
    scope: scopeA,
  });
  assert.ok(!('denied' in exp));
  assert.equal(compareQiWithBaseline(exp).state, 'REGRESSED');
});

test('9) unverified accelerator excluded', () => {
  const route = routeLocalHardware({
    preferred: 'VERIFIED_AMD_NPU',
    available: [
      { deviceId: 'npu-u', hardwareClass: 'UNVERIFIED_NPU', evidenceState: 'DETECTED' },
      { deviceId: 'gpu-u', hardwareClass: 'UNVERIFIED_GPU', evidenceState: 'DOCUMENTED' },
      { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
    ],
    requireVerified: true,
  });
  assert.ok(route.excludedUnverified.includes('UNVERIFIED_NPU'));
  assert.ok(route.excludedUnverified.includes('UNVERIFIED_GPU'));
  assert.equal(route.actual, 'VERIFIED_CPU');
  assert.equal(route.fallbackUsed, true);
});

test('10) CPU fallback recorded truthfully', () => {
  const route = routeLocalHardware({
    preferred: 'VERIFIED_AMD_NPU',
    available: [
      { deviceId: 'npu', hardwareClass: 'VERIFIED_AMD_NPU', evidenceState: 'NOT_TESTED' },
      { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
    ],
    requireVerified: true,
  });
  assert.equal(route.preferred, 'VERIFIED_AMD_NPU');
  assert.equal(route.actual, 'VERIFIED_CPU');
  assert.equal(route.fallbackUsed, true);
  assert.equal(route.passOnActual, true);
  assert.equal(route.preferredRemainsNotTested, true);
  assert.equal(route.classification, 'QUANTUM_INSPIRED');
});

test('11) cross-tenant denied', () => {
  const registry = createAlgorithmRegistry();
  seedExampleQiAlgorithms(registry, scopeA);
  const denied = registerAlgorithm(
    registry,
    {
      algorithmId: 'x-tenant',
      algorithmFamily: 'HYBRID_HEURISTIC',
      version: '1.0.0',
      problemClasses: ['SEARCH'],
      inputContract: 'x',
      outputContract: 'y',
      parameterSchema: {},
      deterministic: true,
      seedRequired: true,
      precisionRequirements: 'float64',
      minimumHardwareState: 'VERIFIED',
      supportedDeviceClasses: ['VERIFIED_CPU'],
      baselineAlgorithmId: 'classical-greedy-v1',
      baselineRequired: true,
      sourceClass: 'PUBLIC_LITERATURE',
      sourceRefs: ['lit'],
      license: 'Apache-2.0',
      implementationOwner: 'x',
      orgId: scopeB.orgId,
      tenantId: scopeB.tenantId,
      universeId: scopeB.universeId,
    },
    scopeA,
  );
  assert.equal(denied.denied, true);
  assert.match(denied.reason, /CROSS_TENANT/);

  const scopeCheck = assertEx3Scope(scopeA, scopeB, 'tenant');
  assert.notEqual(scopeCheck, true);
  if (scopeCheck !== true) assert.match(scopeCheck.reason, /CROSS_TENANT/);
});

test('12) cross-Universe denied', () => {
  const scopeCheck = assertEx3Scope(scopeA, scopeAUniB, 'universe');
  assert.notEqual(scopeCheck, true);
  if (scopeCheck !== true) assert.match(scopeCheck.reason, /CROSS_UNIVERSE/);
});

test('13) offline external-data → WAITING_DATA', () => {
  const result = queryOfflineKnowledge({
    offline: true,
    topic: 'licensed-annealing-corpus',
    family: 'ANNEALING_INSPIRED',
    localCorpusHit: false,
  });
  assert.equal(result.state, 'WAITING_DATA');

  const deniedExp = runQiExperiment({
    experimentId: 't13-offline',
    algorithmId: 'qi-annealing-v1',
    genome: genome(10),
    baseline: makeBaseline(10),
    route: routeLocalHardware({
      preferred: 'VERIFIED_CPU',
      available: [
        { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
      ],
    }),
    metrics: runDeterministicQiKernel({ seed: 5, problemSize: 10 }),
    seed: 5,
    datasetVersion: 'ds-v1',
    scope: scopeA,
    requireExternalDataOffline: true,
  });
  assert.equal(deniedExp.denied, true);
  assert.match(deniedExp.reason, /WAITING_DATA/);
});

test('14) child permission expansion denied', () => {
  const denied = attemptChildPermissionExpansion();
  assert.equal(denied.denied, true);
  assert.equal(EX3_LOCKS.CHILD_PERMISSION_EXPANSION, false);
});

test('15) L4 false', () => {
  assert.equal(EX3_LOCKS.L4_AUTONOMY_ENABLED, false);
  const cycle = runQuantumInspiredAlgorithmLabCycle({ scope: scopeA, repoRoot });
  assert.equal(cycle.l4Enabled, false);
  assert.equal(cycle.locksIntact, true);
});

test('16) Guardian/RLS unchanged', () => {
  const treeSha = execSync('git rev-parse HEAD:services/ai/runtime/guardian', {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  assert.equal(treeSha, GUARDIAN_TREE_SHA_AT_BASE);

  const listing = execSync(
    'find services/ai/runtime/guardian -type f | sort | xargs sha256sum',
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const fingerprint = createHash('sha256').update(listing).digest('hex');
  assert.equal(fingerprint, GUARDIAN_CONTENT_FP);
  assert.equal(EX3_LOCKS.BYPASS_GUARDIAN_RLS, false);
});

test('soft-wire EX1/EX2/mesh; presence≠VERIFIED; no second framework', () => {
  const soft = ex3SoftWireSnapshot(repoRoot);
  assert.equal(soft.ex2Baseline.present, true);
  assert.equal(soft.ex2Comparison.present, true);
  assert.equal(soft.ex2Baseline.verified, false);
  assert.equal(soft.agentMesh.present, true);
  assert.equal(soft.guardian.present, true);
  assert.equal(
    ex3SoftWireHopState(soft.ex1Mission),
    soft.ex1Mission.present ? 'PASS' : 'WAITING_DATA',
  );
  assert.equal(EX3_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK, false);
  assert.equal(routeByGenome(genome(15)).vendorHardCoded, false);
});

test('candidate ≠ preferred; forbidden mutations blocked; wormholes safe', () => {
  const lab = createEx3Lab();
  const seeded = seedExampleQiAlgorithms(lab.registry, scopeA);
  const cand = createQiCandidate({
    parent: seeded[0]!,
    mutationType: 'PARAMETER_TUNE',
    parametersChanged: ['temperatureSchedule'],
    hypothesis: 'slower cool improves quality',
    expectedTradeoff: 'higher latency',
    testPlan: 'compare vs classical greedy on ds-v1',
    baselineRef: 'classical-greedy-v1',
    scope: scopeA,
  });
  assert.ok(!('denied' in cand));
  assert.equal(cand.preferred, false);

  const forbidden = createQiCandidate({
    parent: seeded[0]!,
    mutationType: 'PARAMETER_TUNE',
    parametersChanged: ['x'],
    hypothesis: 'x',
    expectedTradeoff: 'x',
    testPlan: 'x',
    baselineRef: 'classical-greedy-v1',
    scope: scopeA,
    forbiddenTarget: 'FIRMWARE',
  });
  assert.equal(forbidden.denied, true);

  const wh = createSoftwareWormhole('MEMOIZATION', 'warm-start kernel');
  assert.equal(wh.bypassesAuth, false);
  assert.equal(wh.bypassesTenantIsolation, false);
});

test('advantage claim without physical evidence denied; cycle runs; EX2 tests still green host', () => {
  const route = routeLocalHardware({
    preferred: 'VERIFIED_CPU',
    available: [
      { deviceId: 'cpu', hardwareClass: 'VERIFIED_CPU', evidenceState: 'VERIFIED' },
    ],
  });
  const denied = runQiExperiment({
    experimentId: 'adv-deny',
    algorithmId: 'qi-annealing-v1',
    genome: genome(10),
    baseline: makeBaseline(10),
    route,
    metrics: runDeterministicQiKernel({ seed: 6, problemSize: 10 }),
    seed: 6,
    datasetVersion: 'ds-v1',
    scope: scopeA,
    claimQuantumAdvantage: true,
  });
  assert.equal(denied.denied, true);

  const cycle = runQuantumInspiredAlgorithmLabCycle({ scope: scopeA, repoRoot });
  assert.equal(cycle.label, '62L-EX3');
  assert.ok(cycle.hops.some((h) => h.hop === 'soft_wire_ex2_baseline'));
  assert.ok(cycle.softWires.ex2Comparison.present);
});
