/**
 * 62L-EX2 — Classical Baseline First denial + honesty tests.
 *
 * Script: npm run test:62lex2
 *
 * Covers:
 * 1. quantum candidate without baseline → advantage claim DENIED
 * 2. equivalent inputs → comparison eligible
 * 3. different problem size → NOT_COMPARABLE
 * 4. different success criteria → NOT_COMPARABLE
 * 5. stale baseline blocked from strong claim
 * 6. failed baseline → comparison blocked
 * 7. reproducible repeated baseline → REPRODUCIBLE
 * 8. CPU fallback recorded truthfully
 * 9. unverified GPU/NPU excluded when VERIFIED required
 * 10. cross-tenant baseline DENIED
 * 11. cross-Universe baseline DENIED
 * 12. offline external-data → WAITING_DATA
 * 13. L4 false
 * 14. Guardian/RLS unchanged
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import {
  CANONICAL_PATHWAY,
  CLASSICAL_ALGORITHM_CANDIDATES,
  CLASSICAL_BASELINE_CONTRACT_FIELDS,
  EX2_DB_CANDIDATES_STATUS,
  EX2_LOCKS,
  EX2_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  assertEx2LocksIntact,
  ex2SoftWireSnapshot,
  type CandidateReceipt,
  type ClassicalBaselineReceipt,
  type SuccessCriteria,
} from './types.ts';
import {
  baselineSupportsStrongClaim,
  completeClassicalBaseline,
  createBaselineLibrary,
  createClassicalBaseline,
  indexBaseline,
  markBaselineStale,
  selectExecutionTarget,
} from './baseline.ts';
import {
  denyAdvantageWithoutBaseline,
  evaluateAdvantageClaim,
  evaluateComparability,
} from './comparison.ts';
import {
  applyReproducibility,
  summarizeRepeatability,
} from './reproducibility.ts';
import {
  CLASSICAL_BASELINE_AGENT_ROLE,
  agentKnowledgeAllowed,
  agentRequestExternalData,
  openClassicalBaselineAgent,
} from './agent.ts';
import {
  applyPathwayLearning,
  connectComparisonEdge,
  createCandidatePathway,
  createClassicalPathway,
} from './pathways.ts';
import { buildComparableBenchmark, recordCostProxy } from './benchmark.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../../..');

const successCriteria: SuccessCriteria = {
  criteriaId: 'sc-opt-v1',
  objective: 'minimize_cost',
  accuracyTolerance: 1e-6,
  mustSatisfyConstraints: true,
  outputObjective: 'feasible_min_cost',
};

const inputPayload = {
  graph: 'toy-route',
  nodes: 8,
  edges: 12,
};

function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function makeBaseline(
  overrides: Partial<Parameters<typeof createClassicalBaseline>[0]> = {},
): ClassicalBaselineReceipt {
  const created = createClassicalBaseline({
    baselineId: 'bl-001',
    missionId: 'mission-ex2',
    taskId: 'task-route',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    problemClass: 'routing',
    problemVersion: 'v1',
    algorithmId: 'heuristic',
    algorithmVersion: '1.0.0',
    datasetVersion: 'toy-route/v1',
    problemSize: 8,
    seed: 4059,
    precision: 'fp64',
    tolerance: 1e-6,
    runtimeId: 'node-cpu',
    runtimeVersion: 'v0',
    deviceClass: 'CPU',
    deviceId: 'local-cpu-0',
    deviceEvidenceState: 'VERIFIED',
    successCriteria,
    inputPayload,
    ...overrides,
  });
  assert.equal('denied' in created, false);
  return created as ClassicalBaselineReceipt;
}

function completeOk(
  receipt: ClassicalBaselineReceipt,
  runtimeMs = 42,
): ClassicalBaselineReceipt {
  return completeClassicalBaseline({
    receipt,
    success: true,
    runtimeMs,
    memoryPeakMb: 64,
    outputPayload: { route: [0, 1, 2, 0], cost: 12.5 },
    qualityMetrics: {
      objectiveValue: 12.5,
      accuracy: 1,
      feasibility: true,
      custom: {},
    },
    evidenceRefs: ['ev-baseline-1'],
  });
}

function makeCandidate(
  overrides: Partial<CandidateReceipt> = {},
): CandidateReceipt {
  return {
    candidateId: 'cand-q-001',
    missionId: 'mission-ex2',
    taskId: 'task-route',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    problemClass: 'routing',
    problemVersion: 'v1',
    inputHash: hashPayload(inputPayload),
    datasetVersion: 'toy-route/v1',
    problemSize: 8,
    seed: 4059,
    precision: 'fp64',
    tolerance: 1e-6,
    successCriteria,
    runtimeMs: 40,
    deviceClass: 'CPU',
    deviceEvidenceState: 'NOT_TESTED',
    methodFamily: 'quantum_inspired',
    evidenceRefs: ['ev-cand-1'],
    completed: true,
    ...overrides,
  };
}

test('SoT #170 EX2; next EX3 docs-only; GitLab not invented', () => {
  assert.equal(GITHUB_SOT_ISSUE, 170);
  assert.match(GITHUB_SOT_TITLE, /Classical Baseline First/);
  assert.match(NEXT_PHASE_TITLE, /EX3/);
  assert.match(NEXT_PHASE_TITLE, /Quantum-Inspired Algorithm Lab/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.equal(EX2_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.deepEqual([...CANONICAL_PATHWAY], [
    'HomeBase',
    'AgentMesh',
    'QuantumMission',
    'ClassicalBaseline',
    'Candidate',
    'ComparableBenchmark',
    'EvidenceReview',
    'NeuralPathway',
    'HomeBase',
  ]);
  assert.equal(CLASSICAL_BASELINE_AGENT_ROLE.secondFramework, false);
  assert.equal(EX2_LOCKS.SECOND_AGENT_FRAMEWORK, false);
  for (const f of CLASSICAL_BASELINE_CONTRACT_FIELDS) {
    assert.ok(typeof f === 'string' && f.length > 0);
  }
  assert.ok(CLASSICAL_ALGORITHM_CANDIDATES.includes('monte_carlo'));
});

test('13. L4_AUTONOMY_ENABLED=false + honesty locks intact', () => {
  assert.equal(assertEx2LocksIntact(), true);
  assert.equal(EX2_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EX2_LOCKS.TIP_LAND, false);
  assert.equal(EX2_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EX2_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EX2_LOCKS.COMPLETED_EQ_REPRODUCIBLE, false);
  assert.equal(EX2_LOCKS.CLAIM_ADVANTAGE_FROM_ISOLATED_RESULT, false);
  assert.ok(
    EX2_MUST_NOT.includes(
      'claim_quantum_faster_cheaper_superior_advantage_from_isolated_result',
    ),
  );
});

test('soft-wire Agent Mesh / EX1 mission / chipgraph / benchmarks; presence≠VERIFIED', () => {
  const snap = ex2SoftWireSnapshot(repoRoot);
  assert.equal(snap.agentMesh.present, true);
  assert.equal(snap.agentMesh.verified, false);
  assert.equal(snap.agentMesh.hopState, 'PASS');
  // EX1 mission module may still be absent on this tip.
  assert.equal(snap.ex1QuantumMission.verified, false);
  assert.ok(
    snap.ex1QuantumMission.hopState === 'PASS' ||
      snap.ex1QuantumMission.hopState === 'WAITING_DATA',
  );
  assert.equal(snap.chipgraph.verified, false);
  assert.ok(
    snap.chipgraph.hopState === 'PASS' ||
      snap.chipgraph.hopState === 'WAITING_DATA',
  );
  assert.equal(snap.benchmarks.verified, false);
});

test('1. quantum candidate without baseline → advantage claim DENIED', () => {
  const decision = denyAdvantageWithoutBaseline({
    claimText: 'quantum advantage over classical routing',
    candidateReceipt: makeCandidate(),
  });
  assert.equal(decision.allowed, false);
  assert.equal(decision.decision, 'DENIED');
  assert.ok(
    decision.reasons.some((r) =>
      r.includes('WITHOUT_BASELINE_ADVANTAGE_DENIED'),
    ),
  );
});

test('2. equivalent inputs → comparison eligible', () => {
  const baseline = completeOk(makeBaseline());
  const candidate = makeCandidate({
    inputHash: baseline.inputHash,
    runtimeMs: 40,
  });
  const cmp = evaluateComparability({
    comparisonId: 'cmp-1',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(cmp.comparisonState, 'ELIGIBLE');
  assert.equal(cmp.sameProblemDefinition, true);
  assert.equal(cmp.sameInput, true);
  assert.equal(cmp.sameSuccessCriteria, true);

  const pack = buildComparableBenchmark({
    packId: 'pack-1',
    baseline,
    candidateId: candidate.candidateId,
    candidateRuntimeMs: candidate.runtimeMs,
    candidateQuality: 12.0,
    comparability: cmp,
    cost: recordCostProxy(false, null),
  });
  assert.equal('denied' in pack, false);
});

test('3. different problem size → NOT_COMPARABLE', () => {
  const baseline = completeOk(makeBaseline({ problemSize: 8 }));
  const candidate = makeCandidate({
    inputHash: baseline.inputHash,
    problemSize: 64,
  });
  const cmp = evaluateComparability({
    comparisonId: 'cmp-size',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(cmp.comparisonState, 'NOT_COMPARABLE');
  assert.ok(cmp.reasons.includes('PROBLEM_SIZE_MISMATCH'));
});

test('4. different success criteria → NOT_COMPARABLE', () => {
  const baseline = completeOk(makeBaseline());
  const candidate = makeCandidate({
    inputHash: baseline.inputHash,
    successCriteria: {
      ...successCriteria,
      criteriaId: 'sc-opt-v2',
      objective: 'maximize_throughput',
      outputObjective: 'max_throughput',
    },
  });
  const cmp = evaluateComparability({
    comparisonId: 'cmp-sc',
    baseline,
    candidate,
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(cmp.comparisonState, 'NOT_COMPARABLE');
  assert.ok(cmp.reasons.includes('SUCCESS_CRITERIA_MISMATCH'));
});

test('5. stale baseline blocked from strong claim', () => {
  let baseline = completeOk(makeBaseline());
  baseline = markBaselineStale(baseline, ['algorithm_change', 'dataset_change']);
  assert.equal(baseline.baselineState, 'STALE');
  const strong = baselineSupportsStrongClaim(baseline);
  assert.equal(strong.ok, false);
  assert.match(strong.reason, /STALE_BASELINE_BLOCKED/);

  const claim = evaluateAdvantageClaim({
    claimText: 'quantum faster than classical',
    baselineReceipt: baseline,
    candidateReceipt: makeCandidate({ inputHash: baseline.inputHash }),
    comparabilityReceipt: null,
    repeatRunSummary: null,
    reviewResult: 'APPROVED',
  });
  assert.equal(claim.allowed, false);
  assert.equal(claim.decision, 'DENIED');
});

test('6. failed baseline → comparison blocked', () => {
  const ready = makeBaseline();
  const failed = completeClassicalBaseline({
    receipt: ready,
    success: false,
    runtimeMs: 10,
    outputPayload: { error: 'infeasible' },
    qualityMetrics: {
      objectiveValue: null,
      accuracy: null,
      feasibility: false,
      custom: {},
    },
  });
  assert.equal(failed.baselineState, 'FAILED');
  const cmp = evaluateComparability({
    comparisonId: 'cmp-fail',
    baseline: failed,
    candidate: makeCandidate({ inputHash: failed.inputHash }),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  assert.equal(cmp.comparisonState, 'BLOCKED');
  assert.ok(cmp.reasons.includes('FAILED_BASELINE_COMPARISON_BLOCKED'));
});

test('7. reproducible repeated baseline → REPRODUCIBLE (COMPLETED≠auto)', () => {
  const completed = completeOk(makeBaseline(), 40);
  assert.equal(completed.baselineState, 'COMPLETED');
  assert.equal(completed.reproducibilityState, 'NOT_EVALUATED');

  const summary = summarizeRepeatability({
    observations: [
      { success: true, runtimeMs: 40, quality: 12.5, seed: 4059, samplingShots: null },
      { success: true, runtimeMs: 41, quality: 12.5, seed: 4059, samplingShots: null },
      { success: true, runtimeMs: 39, quality: 12.4, seed: 4059, samplingShots: null },
    ],
    expectedSeed: 4059,
    expectedSamplingShots: null,
    qualityVarianceTolerance: 0.01,
  });
  assert.equal(summary.reproducibilityState, 'REPRODUCIBLE');
  assert.equal(summary.runCount, 3);
  assert.ok(summary.varianceRuntimeMs !== null);

  const repro = applyReproducibility(completed, summary);
  assert.equal(repro.baselineState, 'REPRODUCIBLE');
  assert.equal(repro.reproducibilityState, 'REPRODUCIBLE');
});

test('8+9. CPU fallback recorded; unverified GPU/NPU excluded when VERIFIED required', () => {
  const gpu = selectExecutionTarget({
    preferred: 'GPU',
    deviceEvidenceState: 'DETECTED',
    requireVerifiedAccelerator: true,
  });
  assert.equal(gpu.deviceClass, 'CPU');
  assert.equal(gpu.cpuFallback, true);
  assert.equal(gpu.excludedUnverifiedAccelerator, true);
  assert.match(gpu.note, /CPU fallback/);

  const npu = selectExecutionTarget({
    preferred: 'NPU',
    deviceEvidenceState: 'SUPPORTED',
    requireVerifiedAccelerator: true,
  });
  assert.equal(npu.deviceClass, 'CPU');
  assert.equal(npu.excludedUnverifiedAccelerator, true);

  const receipt = makeBaseline({
    deviceClass: 'GPU',
    deviceEvidenceState: 'NOT_TESTED',
    requireVerifiedAccelerator: true,
  });
  assert.equal(receipt.deviceClass, 'CPU');
  assert.equal(receipt.configuration.cpuFallback, true);
  assert.equal(receipt.configuration.excludedUnverifiedAccelerator, true);
});

test('10. cross-tenant baseline DENIED', () => {
  const baseline = completeOk(makeBaseline({ tenantId: 'tenant-a' }));
  const cmp = evaluateComparability({
    comparisonId: 'cmp-tenant',
    baseline,
    candidate: makeCandidate({
      inputHash: baseline.inputHash,
      tenantId: 'tenant-a',
    }),
    actorTenantId: 'tenant-b',
    actorUniverseId: 'universe-a',
  });
  assert.equal(cmp.comparisonState, 'DENIED');
  assert.ok(cmp.reasons.includes('CROSS_TENANT_BASELINE_DENIED'));
});

test('11. cross-Universe baseline DENIED', () => {
  const baseline = completeOk(makeBaseline({ universeId: 'universe-a' }));
  const cmp = evaluateComparability({
    comparisonId: 'cmp-uni',
    baseline,
    candidate: makeCandidate({
      inputHash: baseline.inputHash,
      universeId: 'universe-a',
    }),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-b',
  });
  assert.equal(cmp.comparisonState, 'DENIED');
  assert.ok(cmp.reasons.includes('CROSS_UNIVERSE_BASELINE_DENIED'));
});

test('12. offline external-data → WAITING_DATA', () => {
  const baseline = completeOk(makeBaseline());
  const cmp = evaluateComparability({
    comparisonId: 'cmp-offline',
    baseline,
    candidate: makeCandidate({ inputHash: baseline.inputHash }),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    networkOnline: false,
    externalDataRequired: true,
  });
  assert.equal(cmp.comparisonState, 'WAITING_DATA');
  assert.ok(cmp.reasons.includes('OFFLINE_EXTERNAL_DATA_WAITING_DATA'));

  const ext = agentRequestExternalData({
    networkOnline: false,
    providerConfigured: true,
  });
  assert.equal(ext.status, 'WAITING_DATA');
});

test('14. Guardian/RLS unchanged (no EX2 mutations)', () => {
  const guardianDir = join(repoRoot, 'services/ai/runtime/guardian');
  assert.equal(existsSync(guardianDir), true);

  // Working tree must not modify guardian paths in this branch tip vs base parent.
  const diffGuardian = execSync(
    'git diff origin/xiv-v2 -- services/ai/runtime/guardian supabase/migrations',
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(
    diffGuardian.trim(),
    '',
    'Guardian/RLS migrations must be unchanged by EX2',
  );

  // Soft sanity: validate.ts still tiny lock surface.
  const validate = readFileSync(
    join(guardianDir, 'validate.ts'),
    'utf8',
  );
  assert.ok(validate.length > 0);
  assert.equal(EX2_LOCKS.WEAKEN_GUARDIAN_RLS, false);
});

test('baseline library index + ClassicalBaselineAgent knowledge/IP policy', () => {
  const lib = createBaselineLibrary();
  const a = completeOk(makeBaseline({ baselineId: 'bl-a' }));
  indexBaseline(lib, a);
  assert.equal(lib.byProblemClass.get('routing')?.length, 1);
  assert.equal(lib.bySize.get(8)?.length, 1);

  const agent = openClassicalBaselineAgent();
  assert.equal(agent.role.framework, 'AgentMesh');
  assert.equal(agent.softwareWormholes.authStillRuns, true);
  assert.equal(
    agentKnowledgeAllowed({ license: 'RESTRICTED_PROPRIETARY' }).allowed,
    false,
  );
  assert.equal(agentKnowledgeAllowed({ license: 'OPEN' }).allowed, true);

  const classical = createClassicalPathway('path-c');
  const candidate = createCandidatePathway('path-q');
  const baseline = completeOk(makeBaseline());
  const cmp = evaluateComparability({
    comparisonId: 'cmp-edge',
    baseline,
    candidate: makeCandidate({ inputHash: baseline.inputHash }),
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
  });
  const edge = connectComparisonEdge({
    edgeId: 'edge-1',
    classicalPathwayId: classical.pathwayId,
    candidatePathwayId: candidate.pathwayId,
    comparability: cmp,
  });
  assert.equal(edge.kind, 'COMPARISON_EDGE');
  const learned = applyPathwayLearning({
    pathway: classical,
    rankingWeight: 1.2,
    confidence: 0.7,
    retestRecommended: true,
  });
  assert.equal(learned.update.permissionsChanged, false);
  assert.equal(learned.update.guardianChanged, false);
  assert.equal(learned.update.rlsChanged, false);
});
