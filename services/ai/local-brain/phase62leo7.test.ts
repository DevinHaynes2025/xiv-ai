/**
 * 62L-EO7 — Government Logistics Mission Pack denial + honesty tests.
 *
 * Script: npm run test:62leo7
 * Covers: mission/KPI/agent contracts; no auto dispatch/purchase/commit;
 * no fabricated/classified data; correlation≠causation; sim≠fact; recommend≠act;
 * EO6 classical-baseline quantum gate; EM1/EO5/EO6 soft-wire probes; L4=false.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EO7_DB_CANDIDATES_STATUS,
  EO7_LOCKS,
  EO7_MAY,
  EO7_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOVERNMENT_LOGISTICS_MISSION_PACK_CYCLE,
  HONESTY_BANNER,
  LOGISTICS_AGENT_BOUNDS,
  LOGISTICS_AGENT_TEAM,
  LOGISTICS_KPI_KEYS,
  LOGISTICS_MISSION_AREAS,
  LOGISTICS_MISSION_CORE_FLOW,
  LOGISTICS_PROBLEM_FIELDS,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_STATES,
  QUANTUM_COMPARISON_LADDER,
  assertEo7LocksIntact,
  eo7SoftWireSnapshot,
} from './government-logistics-mission-pack-types.ts';
import {
  analyzeBottleneckRootCause,
  assertTenantUniverseIsolation,
  attemptAutonomousPurchasing,
  attemptAutonomousShipmentDispatch,
  attemptAutonomousSupplierCommitment,
  attemptClassifiedAssumption,
  attemptFabricateMissionData,
  attachBaselineKpis,
  bootstrapGovernmentLogisticsMissionPack,
  compareQuantumLadder,
  compareScenarios,
  intakeLogisticsEvidence,
  issueLogisticsRecommendation,
  registerLogisticsMission,
  requireHumanAuthorization,
  returnAgentEvidenceToHomeBase,
  runAgenticSimulation,
  runClassicalOptimization,
  runGovernmentLogisticsMissionPackDemoCycle,
} from './government-logistics-mission-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const planner = {
  kind: 'logistics_planner' as const,
  id: 'lp-1',
  orgId: 'org-eo7',
  tenantId: 'ten-eo7',
  universeId: 'uni-eo7',
  permissions: ['register_logistics_missions', 'return_agent_evidence_to_home_base'],
};

const inventoryAnalyst = {
  kind: 'inventory_analyst' as const,
  id: 'ia-1',
  orgId: 'org-eo7',
  tenantId: 'ten-eo7',
  universeId: 'uni-eo7',
  permissions: ['return_agent_evidence_to_home_base'],
};

const human = {
  kind: 'human_approver' as const,
  id: 'hum-1',
  orgId: 'org-eo7',
  tenantId: 'ten-eo7',
  universeId: 'uni-eo7',
  permissions: ['authorize_logistics_actions'],
};

test('SoT is GitHub #159 EO family / EO7 label; GitLab mirror not invented; next is EO8', () => {
  assert.equal(GITHUB_SOT_ISSUE, 159);
  assert.equal(GITHUB_SOT_LABEL, '62L-EO7');
  assert.match(GITHUB_SOT_TITLE, /Government Logistics Mission Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO8/);
  assert.match(NEXT_PHASE_TITLE, /Supply Chain Resilience/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEo7LocksIntact(), true);
  assert.equal(EO7_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO7_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO7_LOCKS.TIP_LAND, false);
  assert.equal(EO7_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO7_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO7_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO7_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO7_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('contracts: mission areas, problem fields, KPI schema, core flow, agent team', () => {
  assert.ok(LOGISTICS_MISSION_AREAS.includes('transportation_routing'));
  assert.ok(LOGISTICS_MISSION_AREAS.includes('cold_chain'));
  assert.ok(LOGISTICS_MISSION_AREAS.includes('emergency_disaster_logistics'));
  assert.ok(LOGISTICS_MISSION_AREAS.includes('last_mile_distribution'));
  assert.equal(LOGISTICS_MISSION_AREAS.length, 15);

  assert.ok(LOGISTICS_PROBLEM_FIELDS.includes('missionId'));
  assert.ok(LOGISTICS_PROBLEM_FIELDS.includes('baselineKpis'));
  assert.ok(LOGISTICS_PROBLEM_FIELDS.includes('approvalState'));
  assert.equal(LOGISTICS_PROBLEM_FIELDS.length, 15);

  assert.ok(LOGISTICS_KPI_KEYS.includes('fill_rate'));
  assert.ok(LOGISTICS_KPI_KEYS.includes('otif'));
  assert.ok(LOGISTICS_KPI_KEYS.includes('supplier_concentration'));
  assert.ok(LOGISTICS_KPI_KEYS.includes('demand_service_risk'));
  assert.equal(LOGISTICS_KPI_KEYS.length, 15);

  assert.deepEqual([...LOGISTICS_MISSION_CORE_FLOW], [
    'mission_requirement',
    'data_evidence_intake',
    'current_state_baseline',
    'bottleneck_root_cause',
    'classical_optimization',
    'advanced_agentic_simulation',
    'scenario_comparison',
    'recommendation',
    'human_authorization',
  ]);

  assert.equal(LOGISTICS_AGENT_TEAM.length, 10);
  assert.ok(LOGISTICS_AGENT_TEAM.includes('quant_or_agent'));
  assert.ok(LOGISTICS_AGENT_TEAM.includes('supplier_risk_agent'));
  assert.ok(LOGISTICS_AGENT_TEAM.includes('cfo_cost_agent'));
  assert.equal(LOGISTICS_AGENT_BOUNDS.automaticPurchasing, false);
  assert.equal(LOGISTICS_AGENT_BOUNDS.automaticDispatch, false);
  assert.equal(LOGISTICS_AGENT_BOUNDS.automaticContractAuthority, false);
  assert.equal(LOGISTICS_AGENT_BOUNDS.mayReturnEvidenceToHomeBase, true);
});

test('cycle covers flow + agent bounds + EO6 gate + safety + soft-wires', () => {
  for (const required of [
    'mission_areas_encoded',
    'kpi_schema_encoded',
    'core_flow_encoded',
    'classical_optimization',
    'agent_evidence_to_home_base',
    'no_agent_purchasing_authority',
    'eo6_classical_baseline_gate',
    'deny_quantum_without_eo6_baseline',
    'no_autonomous_shipment_dispatch',
    'no_autonomous_purchasing',
    'no_autonomous_supplier_commitments',
    'no_fabricated_mission_data',
    'no_classified_data_assumptions',
    'correlation_neq_causation',
    'sim_neq_fact',
    'recommend_neq_act',
    'em1_home_base_soft_wire',
    'eo5_quantum_evidence_boundary_soft_wire',
    'eo6_classical_baseline_soft_wire',
    'l4_autonomy_false',
  ] as const) {
    assert.ok(
      GOVERNMENT_LOGISTICS_MISSION_PACK_CYCLE.includes(required),
      required,
    );
  }
  assert.ok(EO7_MAY.includes('return_agent_evidence_to_home_base'));
  assert.ok(EO7_MUST_NOT.includes('autonomous_shipment_dispatch'));
  assert.ok(EO7_MUST_NOT.includes('bypass_eo6_classical_baseline_for_quantum_claims'));
});

test('A: register mission; deny fabricate / classified / universal compliance / hidden assumptions', () => {
  const ok = registerLogisticsMission({
    actor: planner,
    missionId: 'm1',
    agencyOrganizationScope: 'Agency X / Bureau Y',
    missionAreas: ['warehousing', 'inventory_positioning'],
    scenarioAssumptions: ['fixture'],
  });
  assert.ok(!('denied' in ok));
  if (!('denied' in ok)) {
    assert.equal(ok.fabricated, false);
    assert.equal(ok.classifiedAssumed, false);
    assert.equal(ok.complianceNote, 'solicitation_specific');
    assert.ok(ok.assumptionsExposed.length > 0);
  }

  const fab = registerLogisticsMission({
    actor: planner,
    missionId: 'm-fab',
    agencyOrganizationScope: 'Agency X',
    missionAreas: ['warehousing'],
    fabricateMissionData: true,
  });
  assert.equal('denied' in fab && fab.denied, true);
  assert.match(('reason' in fab && fab.reason) || '', /FABRICATED/);

  const clas = registerLogisticsMission({
    actor: planner,
    missionId: 'm-class',
    agencyOrganizationScope: 'Agency X',
    missionAreas: ['warehousing'],
    assumeClassifiedData: true,
  });
  assert.equal('denied' in clas && clas.denied, true);
  assert.match(('reason' in clas && clas.reason) || '', /CLASSIFIED/);

  const univ = registerLogisticsMission({
    actor: planner,
    missionId: 'm-comp',
    agencyOrganizationScope: 'Agency X',
    missionAreas: ['warehousing'],
    claimUniversalCompliance: true,
  });
  assert.equal('denied' in univ && univ.denied, true);
  assert.match(('reason' in univ && univ.reason) || '', /SOLICITATION_SPECIFIC/);

  const hide = registerLogisticsMission({
    actor: planner,
    missionId: 'm-hide',
    agencyOrganizationScope: 'Agency X',
    missionAreas: ['warehousing'],
    hideAssumptions: true,
  });
  assert.equal('denied' in hide && hide.denied, true);
});

test('B: evidence intake + baseline KPIs; tenant/universe isolation enforced', () => {
  const mission = registerLogisticsMission({
    actor: planner,
    missionId: 'm2',
    agencyOrganizationScope: 'Agency Z',
    missionAreas: ['fleet_scheduling'],
  });
  assert.ok(!('denied' in mission));
  if ('denied' in mission) return;

  const badEvidence = intakeLogisticsEvidence({
    mission,
    evidenceRefs: ['x'],
    unauthorized: true,
  });
  assert.equal('denied' in badEvidence && badEvidence.denied, true);

  const evidence = intakeLogisticsEvidence({
    mission,
    evidenceRefs: ['ev-1'],
  });
  assert.ok(!('denied' in evidence));

  const baseline = attachBaselineKpis({
    mission,
    kpis: [
      {
        key: 'transportation_cost',
        value: 12000,
        unit: 'usd',
        uncertaintyNote: 'Incomplete lane cost sample',
      },
    ],
  });
  assert.ok(!('denied' in baseline));
  if (!('denied' in baseline)) {
    assert.equal(baseline.baselineKpis[0]?.isSimulated, false);
  }

  const cross = assertTenantUniverseIsolation({
    actor: planner,
    missionTenantId: 'other-tenant',
    missionUniverseId: 'uni-eo7',
  });
  assert.equal('denied' in cross && cross.denied, true);
  assert.match(('reason' in cross && cross.reason) || '', /TENANT_UNIVERSE/);
});

test('C: correlation≠causation; sim≠fact; recommend≠act; human gate', () => {
  const causal = analyzeBottleneckRootCause({
    missionId: 'm3',
    observedCorrelation: 'A with B',
    assertCausation: true,
  });
  assert.equal('denied' in causal && causal.denied, true);
  assert.match(('reason' in causal && causal.reason) || '', /CAUSATION/);

  const hyp = analyzeBottleneckRootCause({
    missionId: 'm3',
    observedCorrelation: 'A with B',
  });
  assert.ok(!('denied' in hyp));
  if (!('denied' in hyp)) {
    assert.equal(hyp.causalClaimAllowed, false);
    assert.equal(hyp.labeledAs, 'correlation_hypothesis');
  }

  const simFact = runAgenticSimulation({
    missionId: 'm3',
    scenarioId: 's1',
    simulatedKpis: [
      {
        key: 'otif',
        value: 0.99,
        unit: 'ratio',
        uncertaintyNote: 'sim',
      },
    ],
    treatSimAsFact: true,
  });
  assert.equal('denied' in simFact && simFact.denied, true);

  const sim = runAgenticSimulation({
    missionId: 'm3',
    scenarioId: 's1',
    simulatedKpis: [
      {
        key: 'otif',
        value: 0.93,
        unit: 'ratio',
        uncertaintyNote: 'sim only',
      },
    ],
  });
  assert.ok(!('denied' in sim));
  if (!('denied' in sim)) {
    assert.equal(sim.simEqFact, false);
    assert.equal(sim.simulatedKpis[0]?.isSimulated, true);
  }

  const act = issueLogisticsRecommendation({
    missionId: 'm3',
    summary: 'do thing',
    assumptionsExposed: ['a'],
    uncertaintyNotes: ['u'],
    treatRecommendAsAct: true,
  });
  assert.equal('denied' in act && act.denied, true);

  const rec = issueLogisticsRecommendation({
    missionId: 'm3',
    summary: 'rebalance inventory',
    assumptionsExposed: ['demand stationary'],
    uncertaintyNotes: ['±10%'],
  });
  assert.ok(!('denied' in rec));
  if ('denied' in rec) return;

  const agentAuth = requireHumanAuthorization({
    actor: planner,
    missionId: 'm3',
    recommendation: rec,
  });
  assert.equal('denied' in agentAuth && agentAuth.denied, true);

  const humAuth = requireHumanAuthorization({
    actor: human,
    missionId: 'm3',
    recommendation: rec,
  });
  assert.ok(!('denied' in humAuth));
  if (!('denied' in humAuth)) {
    assert.equal(humAuth.stillNoAutoDispatch, true);
    assert.equal(humAuth.stillNoAutoPurchase, true);
    assert.equal(humAuth.stillNoAutoCommit, true);
  }
});

test('D: agent evidence to Home Base; deny purchase/dispatch/contract authority', () => {
  const ok = returnAgentEvidenceToHomeBase({
    actor: inventoryAnalyst,
    missionId: 'm4',
    evidenceSummary: 'fill_rate baseline packet',
  });
  assert.ok(!('denied' in ok));
  if (!('denied' in ok)) {
    assert.equal(ok.returnedToHomeBase, true);
    assert.equal(ok.automaticPurchasing, false);
    assert.equal(ok.automaticDispatch, false);
    assert.equal(ok.automaticContractAuthority, false);
  }

  const buy = returnAgentEvidenceToHomeBase({
    actor: inventoryAnalyst,
    missionId: 'm4',
    evidenceSummary: 'x',
    attemptPurchase: true,
  });
  assert.equal('denied' in buy && buy.denied, true);
  assert.match(('reason' in buy && buy.reason) || '', /PURCHASING/);

  const disp = returnAgentEvidenceToHomeBase({
    actor: inventoryAnalyst,
    missionId: 'm4',
    evidenceSummary: 'x',
    attemptDispatch: true,
  });
  assert.equal('denied' in disp && disp.denied, true);
  assert.match(('reason' in disp && disp.reason) || '', /DISPATCH/);

  const contract = returnAgentEvidenceToHomeBase({
    actor: inventoryAnalyst,
    missionId: 'm4',
    evidenceSummary: 'x',
    attemptContract: true,
  });
  assert.equal('denied' in contract && contract.denied, true);
  assert.match(('reason' in contract && contract.reason) || '', /CONTRACT/);
});

test('E: quantum ladder — EO6 classical baseline required; physical QPU only if verified', () => {
  assert.deepEqual([...QUANTUM_COMPARISON_LADDER], [
    'classical_or',
    'heuristics_metaheuristics',
    'ml_assisted',
    'quantum_inspired',
    'physical_qpu',
  ]);
  assert.ok(QUANTUM_CLAIM_STATES.includes('PHYSICAL_QPU_VERIFIED'));

  const denied = compareQuantumLadder({
    missionId: 'm5',
    rung: 'quantum_inspired',
    claimState: 'QUANTUM_INSPIRED',
    eo6ClassicalBaselineVerified: false,
  });
  assert.equal('denied' in denied && denied.denied, true);
  assert.match(('reason' in denied && denied.reason) || '', /EO6_CLASSICAL_BASELINE/);

  const classical = compareQuantumLadder({
    missionId: 'm5',
    rung: 'classical_or',
    claimState: 'THEORETICAL',
    eo6ClassicalBaselineVerified: true,
  });
  assert.ok(!('denied' in classical));

  const qi = compareQuantumLadder({
    missionId: 'm5',
    rung: 'quantum_inspired',
    claimState: 'QUANTUM_INSPIRED',
    eo6ClassicalBaselineVerified: true,
  });
  assert.ok(!('denied' in qi));

  const qpuNo = compareQuantumLadder({
    missionId: 'm5',
    rung: 'physical_qpu',
    claimState: 'PHYSICAL_QPU_VERIFIED',
    eo6ClassicalBaselineVerified: true,
    physicalQpuVerified: false,
  });
  assert.equal('denied' in qpuNo && qpuNo.denied, true);
  assert.match(('reason' in qpuNo && qpuNo.reason) || '', /PHYSICAL_QPU/);

  const qpuYes = compareQuantumLadder({
    missionId: 'm5',
    rung: 'physical_qpu',
    claimState: 'PHYSICAL_QPU_VERIFIED',
    eo6ClassicalBaselineVerified: true,
    physicalQpuVerified: true,
  });
  assert.ok(!('denied' in qpuYes));
});

test('F: autonomy denials — dispatch / purchasing / supplier commitments / fabricate / classified', () => {
  const d1 = attemptAutonomousShipmentDispatch();
  assert.equal(d1.denied, true);
  assert.equal(d1.executed, false);
  assert.match(d1.reason, /SHIPMENT_DISPATCH/);

  const d2 = attemptAutonomousPurchasing();
  assert.equal(d2.denied, true);
  assert.match(d2.reason, /PURCHASING/);

  const d3 = attemptAutonomousSupplierCommitment();
  assert.equal(d3.denied, true);
  assert.match(d3.reason, /SUPPLIER_COMMITMENT/);

  const d4 = attemptFabricateMissionData();
  assert.equal(d4.denied, true);
  const d5 = attemptClassifiedAssumption();
  assert.equal(d5.denied, true);

  assert.equal(EO7_LOCKS.AUTO_SHIPMENT_DISPATCH, false);
  assert.equal(EO7_LOCKS.AUTO_PURCHASING, false);
  assert.equal(EO7_LOCKS.AUTO_SUPPLIER_COMMITMENT, false);
  assert.equal(EO7_LOCKS.RECOMMEND_EQ_ACT, false);
  assert.equal(EO7_LOCKS.SIM_EQ_FACT, false);
  assert.equal(EO7_LOCKS.CORRELATION_EQ_CAUSATION, false);
  assert.equal(EO7_LOCKS.QUANTUM_WITHOUT_EO6_CLASSICAL_BASELINE, false);
});

test('G: soft-wire EM1 PRESENT; EO5/EO6/EO#159 WAITING_DATA or PRESENT without claiming VERIFIED', () => {
  const snap = eo7SoftWireSnapshot(repoRoot);
  assert.equal(snap.em1HomeBaseContract.present, true);
  assert.match(snap.em1HomeBaseContract.note, /PRESENT/);
  // EO5/EO6/EO parent may be absent on EO5-based tip — presence ≠ VERIFIED either way.
  assert.equal(typeof snap.eo5QuantumEvidenceBoundary.present, 'boolean');
  assert.equal(typeof snap.eo6ClassicalBaselineGate.present, 'boolean');
  assert.equal(typeof snap.eo159MissionOsTypes.present, 'boolean');
  assert.equal(snap.classicalQuantBenchmark.present, true);
});

test('H: bootstrap + demo cycle PASS path; classical OR advisory; scenario compare', () => {
  const boot = bootstrapGovernmentLogisticsMissionPack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.l4AutonomyEnabled, false);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.softWire.em1HomeBaseContract.present, true);
  assert.match(boot.next, /EO8/);

  const classical = runClassicalOptimization({
    missionId: 'm6',
    objective: 'minimize_transportation_cost',
    assumptions: ['fixed demand'],
  });
  assert.equal(classical.autoApplied, false);
  assert.equal(classical.state, 'ADVISORY_ONLY');

  const cmp = compareScenarios({
    missionId: 'm6',
    scenarioIds: ['a', 'b'],
  });
  assert.ok(!('denied' in cmp));

  const demo = runGovernmentLogisticsMissionPackDemoCycle({
    actor: inventoryAnalyst,
    human,
  });
  assert.ok(!('denied' in demo.mission));
  assert.ok(!('denied' in demo.recommendation));
  assert.ok(!('denied' in demo.authorization));
  assert.equal(demo.dispatchDeny.denied, true);
  assert.equal(demo.purchaseDeny.denied, true);
  assert.equal(demo.commitDeny.denied, true);
  assert.equal('denied' in demo.quantumDenied && demo.quantumDenied.denied, true);
  assert.ok(!('denied' in demo.quantumClassical));
  assert.ok(demo.hops.length >= 10);
});
