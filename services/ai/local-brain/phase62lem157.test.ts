/**
 * 62L-EM GitHub #157 — Agent Compute Home Base denial + truth-boundary tests.
 *
 * Script: npm run test:62lem-home  (alias: test:62lem157)
 * Preserves prior npm run test:62lem (local-runtime EM local-model scope).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_COMPUTE_HOME_BASE_CYCLE,
  EM157_DB_CANDIDATES_STATUS,
  EM157_LOCKS,
  EM157_NOT_TESTED_CLAIMS,
  ENTERPRISE_TIER_EXAMPLE_USD_PER_MONTH,
  FOUNDER_AMBITION_TRACKER,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  HONESTY_BANNER,
  LETTER_COLLISION_NOTE,
  assertEm157LocksIntact,
  em157SoftWireSnapshot,
} from './agent-compute-home-base-types.ts';
import {
  affordabilityGuard,
  ambitionTrackerSnapshot,
  bootstrapHomeBase,
  branchMission,
  denyQuantumAdvantageWithoutEvidence,
  denyVehicleControl,
  evaluateStarlinkAdapter,
  freeToPremiumGate,
  negotiateStrategy,
  openSimulationWorld,
  pricingCouncilRecommend,
  recordCost,
  createCostLedger,
  registerHistoricalLesson,
  requireHumanDecision,
  returnMissionEvidence,
  routeComputeFabric,
  runHomeBaseMissionPathway,
  simulateContractScenario,
} from './agent-compute-home-base-runtime.ts';

const parent = {
  kind: 'home_base_operator' as const,
  id: 'hb-1',
  orgId: 'org-1',
  tenantId: 'ten-1',
  universeId: 'uni-1',
  permissions: ['research', 'simulate', 'price_recommend', 'ledger_write'],
};

test('SoT is GitHub #157 with letter-collision note', () => {
  assert.equal(GITHUB_SOT_ISSUE, 157);
  assert.match(GITHUB_SOT_TITLE, /Agent Compute Home Base/);
  assert.match(LETTER_COLLISION_NOTE, /62l-em-local-model-verification-4059/);
  assert.match(LETTER_COLLISION_NOTE, /#157/);
});

test('H: honesty locks intact + L4 false + DB NOT_APPLIED + banner', () => {
  assert.equal(assertEm157LocksIntact(), true);
  assert.equal(EM157_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM157_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EM157_LOCKS.TIP_LAND, false);
  assert.equal(EM157_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EM157_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EM157_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EM157_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
});

test('cycle covers A–H hops', () => {
  for (const required of [
    'mission_branch',
    'child_permission_isolation',
    'fabric_route_candidate',
    'pricing_council_recommend',
    'cost_ledger_record',
    'historical_lesson_register',
    'starlink_adapter_candidate',
    'simulation_branch_isolated',
    'human_decision_gate',
    'el9_el8_em_soft_wire',
  ] as const) {
    assert.ok(AGENT_COMPUTE_HOME_BASE_CYCLE.includes(required), required);
  }
});

test('A: child agents do not auto-inherit broader permissions', () => {
  const deniedInherit = branchMission({
    missionId: 'm-inherit',
    kind: 'research',
    objective: 'probe',
    parent,
    requestedChildPermissions: ['research'],
    attemptBroaderInheritance: true,
  });
  assert.equal(deniedInherit.allowed, false);
  assert.equal(deniedInherit.state, 'DENIED');

  const deniedEscalate = branchMission({
    missionId: 'm-esc',
    kind: 'research',
    objective: 'probe',
    parent,
    requestedChildPermissions: ['research', 'satellite_control'],
  });
  assert.equal(deniedEscalate.allowed, false);

  const ok = branchMission({
    missionId: 'm-ok',
    kind: 'research',
    objective: 'bounded research',
    parent,
    requestedChildPermissions: ['research'],
  });
  assert.equal(ok.allowed, true);
  assert.equal(ok.mission?.inheritedBroaderPermissions, false);

  const returned = returnMissionEvidence({
    mission: ok.mission!,
    evidence: ['note-1'],
    results: { findings: 1 },
  });
  assert.equal(returned.status, 'RETURNED');
  assert.deepEqual(returned.evidence, ['note-1']);
});

test('B: DETECTED ≠ VERIFIED; silent CPU fallback ≠ accelerator; TensorRT candidate', () => {
  const detected = routeComputeFabric({
    preferred: 'gpu_amd_candidate',
    detected: true,
  });
  assert.equal(detected.verified, false);
  assert.equal(detected.truthState, 'DETECTED');
  assert.equal(detected.route, 'cpu_fallback');
  assert.equal(detected.elCeilingsApply, true);

  const fakeAmd = routeComputeFabric({
    preferred: 'gpu_amd_candidate',
    claimAmdVerified: true,
  });
  assert.equal(fakeAmd.verified, false);
  assert.equal(fakeAmd.truthState, 'DENIED');

  const fakeNvidia = routeComputeFabric({
    preferred: 'gpu_nvidia_candidate',
    claimNvidiaVerified: true,
  });
  assert.equal(fakeNvidia.verified, false);

  const silent = routeComputeFabric({
    preferred: 'npu_candidate',
    silentCpuFallbackOccurred: true,
  });
  assert.equal(silent.verified, false);
  assert.equal(EM157_LOCKS.SILENT_CPU_FALLBACK_EQ_ACCELERATOR_VERIFIED, false);

  const tensorrt = routeComputeFabric({ preferred: 'tensorrt_candidate', detected: true });
  assert.equal(tensorrt.tensorrtPathway, 'CANDIDATE');
  assert.equal(tensorrt.verified, false);

  const withEvidence = routeComputeFabric({
    preferred: 'gpu_nvidia_candidate',
    runtimeEvidence: ['measured_infer_12ms_on_authorized_device'],
  });
  assert.equal(withEvidence.verified, true);
  assert.equal(withEvidence.truthState, 'VERIFIED');
});

test('C: pricing council recommend ≠ charge/sign; ambition ≠ valuation; affordability', () => {
  const auto = pricingCouncilRecommend({
    tier: 'premium',
    monthlyUsd: 100,
    costToServeUsd: 40,
    measurableCustomerValueUsd: 200,
    customerBudgetUsd: 150,
    attemptAutoCharge: true,
  });
  assert.equal('denied' in auto && auto.denied, true);

  const guard = affordabilityGuard({
    proposedMonthlyUsd: 500,
    customerBudgetUsd: 100,
    costToServeUsd: 50,
  });
  assert.equal(guard.allowedToRecommend, false);

  const enterpriseUnjustified = pricingCouncilRecommend({
    tier: 'enterprise',
    monthlyUsd: ENTERPRISE_TIER_EXAMPLE_USD_PER_MONTH,
    costToServeUsd: 10,
    measurableCustomerValueUsd: 20,
    customerBudgetUsd: 1_000_000,
  });
  assert.equal('denied' in enterpriseUnjustified && enterpriseUnjustified.denied, true);

  const ok = pricingCouncilRecommend({
    tier: 'premium',
    monthlyUsd: 100,
    costToServeUsd: 40,
    measurableCustomerValueUsd: 200,
    customerBudgetUsd: 150,
  });
  assert.ok(!('denied' in ok));
  if (!('denied' in ok)) {
    assert.equal(ok.state, 'RECOMMENDATION_ONLY');
    assert.equal(ok.autoCharge, false);
    assert.equal(ok.autoSign, false);
    assert.equal(ok.humanDecisionRequired, true);
  }

  const ambition = ambitionTrackerSnapshot();
  assert.equal(ambition.isPresentValuation, false);
  assert.equal(ambition.isVerifiedClaim, false);
  assert.equal(ambition.isValuation, false);
  assert.equal(ambition.claimOrgsSaveTrillions, false);
  assert.equal(FOUNDER_AMBITION_TRACKER.kind, 'founder_ambition_tracker_only');
  assert.equal(EM157_LOCKS.ORGS_ALREADY_SAVE_TRILLIONS_CLAIM, false);
  assert.equal(EM157_LOCKS.AMBITION_EQ_VALUATION, false);

  const strategy = negotiateStrategy({
    strategyId: 'n1',
    posture: 'principled',
    levers: ['value_metric', 'term_length'],
  });
  assert.equal(strategy.autoExecute, false);

  const contractAuto = simulateContractScenario({
    scenarioId: 'c1',
    outcomeSummary: 'should deny',
    attemptAutoSign: true,
  });
  assert.equal('denied' in contractAuto && contractAuto.denied, true);

  const contractSim = simulateContractScenario({
    scenarioId: 'c2',
    outcomeSummary: 'labeled sim only',
  });
  assert.ok(!('denied' in contractSim));
  if (!('denied' in contractSim)) {
    assert.equal(contractSim.isBindingContract, false);
    assert.equal(contractSim.state, 'LABELED_SIMULATION');
  }
});

test('D: cost ledger + free-to-premium gates (no auto-billing)', () => {
  let ledger = createCostLedger();
  ledger = recordCost(ledger, {
    entryId: 'e1',
    category: 'compute',
    amountUsd: 12.5,
    note: 'bounded research cpu',
  });
  assert.equal(ledger.totalUsd, 12.5);

  const autoUp = freeToPremiumGate({
    currentTier: 'free',
    requestedFeature: 'premium_analytics',
    attemptAutoUpgrade: true,
  });
  assert.equal(autoUp.allowed, false);
  assert.equal(autoUp.autoUpgrade, false);

  const denied = freeToPremiumGate({
    currentTier: 'free',
    requestedFeature: 'enterprise_council',
  });
  assert.equal(denied.allowed, false);

  const basic = freeToPremiumGate({
    currentTier: 'free',
    requestedFeature: 'basic_research',
  });
  assert.equal(basic.allowed, true);
});

test('E: historical BI provenance; case ≠ proof today; correlation ≠ causation', () => {
  const noProv = registerHistoricalLesson({
    lessonId: 'h0',
    title: 'x',
    domain: 'pricing',
    evidenceClass: 'hbr_style_case',
    provenance: '   ',
    lessonSummary: 'y',
  });
  assert.equal('denied' in noProv && noProv.denied, true);

  const proofToday = registerHistoricalLesson({
    lessonId: 'h1',
    title: 'Case',
    domain: 'turnarounds',
    evidenceClass: 'hbr_style_case',
    provenance: 'HBR-style teaching case archive id=demo',
    lessonSummary: 'lesson',
    claimProofWorksToday: true,
  });
  assert.equal('denied' in proofToday && proofToday.denied, true);

  const causation = registerHistoricalLesson({
    lessonId: 'h2',
    title: 'Case',
    domain: 'operations',
    evidenceClass: 'scholarly_case',
    provenance: 'lawful case material',
    lessonSummary: 'lesson',
    claimCausationFromCorrelation: true,
  });
  assert.equal('denied' in causation && causation.denied, true);

  const ok = registerHistoricalLesson({
    lessonId: 'h3',
    title: 'Procurement lesson',
    domain: 'procurement',
    evidenceClass: 'hbr_style_case',
    provenance: 'lawful teaching case with citation',
    lessonSummary: 'Structured lesson only',
  });
  assert.ok(!('denied' in ok));
  if (!('denied' in ok)) {
    assert.equal(ok.provesStrategyWorksToday, false);
    assert.equal(ok.correlationEqualsCausation, false);
    assert.equal(ok.state, 'PROVENANCE_LABELED');
  }
});

test('F: Starlink UNCONNECTED; no satellite/vehicle control; quantum deny', () => {
  const def = evaluateStarlinkAdapter();
  assert.ok(!('denied' in def));
  if (!('denied' in def)) {
    assert.equal(def.connectionState, 'UNCONNECTED');
    assert.equal(def.liveApiConnected, false);
    assert.equal(def.satelliteControlEnabled, false);
  }

  const fakeConnect = evaluateStarlinkAdapter({ claimConnectedWithoutCredentials: true });
  assert.equal('denied' in fakeConnect && fakeConnect.denied, true);

  const sat = evaluateStarlinkAdapter({ attemptSatelliteControl: true });
  assert.equal('denied' in sat && sat.denied, true);

  const vehicle = denyVehicleControl();
  assert.equal(vehicle.denied, true);

  const q = denyQuantumAdvantageWithoutEvidence();
  assert.equal(q.denied, true);

  assert.ok(EM157_NOT_TESTED_CLAIMS.includes('live_starlink_management_api'));
  assert.ok(EM157_NOT_TESTED_CLAIMS.includes('amd_gpu_acceleration_verified'));
  assert.ok(EM157_NOT_TESTED_CLAIMS.includes('nvidia_gpu_acceleration_verified'));
});

test('G: simulation isolated; sim ≠ fact ≠ physical control', () => {
  const phys = openSimulationWorld({
    worldId: 'w1',
    scenario: 'logistics',
    attemptPhysicalControl: true,
  });
  assert.equal('denied' in phys && phys.denied, true);

  const fact = openSimulationWorld({
    worldId: 'w2',
    scenario: 'pricing',
    claimAsFact: true,
  });
  assert.equal('denied' in fact && fact.denied, true);

  const ok = openSimulationWorld({ worldId: 'w3', scenario: 'market stress' });
  assert.ok(!('denied' in ok));
  if (!('denied' in ok)) {
    assert.equal(ok.isolated, true);
    assert.equal(ok.isFact, false);
    assert.equal(ok.physicalControlEnabled, false);
    assert.equal(ok.label, 'LABELED_SIMULATION');
  }
});

test('H: human decision gate + soft-wire EL9/EL8/prior EM; pathway returns to home', () => {
  const soft = em157SoftWireSnapshot();
  assert.equal(soft.el9ResourceGovernor.present, true);
  assert.equal(soft.el8Honesty.present, true);
  assert.equal(soft.priorEmLocalModelHonesty.present, true);
  assert.equal(soft.localRuntimeIndex.present, true);
  // EK may be absent on this EL-lineage branch — presence check only
  assert.equal(typeof soft.ekCognitiveOsTypes.present, 'boolean');

  const auto = requireHumanDecision({
    decisionId: 'd1',
    kind: 'contract',
    recommendationSummary: 'sign',
    attemptAutonomousExecute: true,
  });
  assert.equal(auto.state, 'DENIED');
  assert.equal(auto.executed, false);

  const gate = requireHumanDecision({
    decisionId: 'd2',
    kind: 'pricing',
    recommendationSummary: 'premium recommend',
  });
  assert.equal(gate.state, 'HUMAN_APPROVAL_REQUIRED');
  assert.equal(gate.autoCharged, false);

  const boot = bootstrapHomeBase();
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.sotIssue, 157);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.ok(boot.hops.length >= 5);

  const path = runHomeBaseMissionPathway({
    parent,
    missionId: 'mission-path-1',
    kind: 'historical_analysis',
    objective: 'bounded historical pricing lesson',
    childPermissions: ['research'],
    fabricPreferred: 'cpu',
    evidence: ['lesson-ref-1'],
    results: { lessons: 1 },
  });
  assert.equal(path.branch.allowed, true);
  assert.equal(path.returned?.status, 'RETURNED');
  assert.equal(path.humanGate.state, 'HUMAN_APPROVAL_REQUIRED');
  assert.equal(path.pathway?.strengthensAuthorityAutomatically, false);
});
