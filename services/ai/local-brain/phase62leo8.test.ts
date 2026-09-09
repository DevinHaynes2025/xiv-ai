/**
 * 62L-EO8 — Supply Chain Resilience Pack denial + honesty tests.
 *
 * Script: npm run test:62leo8
 * Covers: truth labels; scenario library; agent bounds; no auto purchase/
 * supplier-switch/contract/dispatch/external-comm; L4=false; sim≠fact;
 * historical≠proof; soft-wire EO6/EO7/EO5/#159/Home Base probes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EO8_DB_CANDIDATES_STATUS,
  EO8_LOCKS,
  EO8_MAY,
  EO8_MUST_NOT,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RESILIENCE_AGENT_TEAM,
  RESILIENCE_GRAPH_NODE_KINDS,
  RESILIENCE_OUTPUT_FIELDS,
  RESILIENCE_RECORD_FIELDS,
  RESILIENCE_WORKFLOW,
  SCENARIO_LIBRARY,
  SUPPLY_CHAIN_RESILIENCE_PACK_CYCLE,
  TRUTH_BOUNDARY_LABELS,
  assertEo8LocksIntact,
  eo8SoftWireSnapshot,
} from './supply-chain-resilience-pack-types.ts';
import {
  advanceResilienceWorkflow,
  attachEvidenceToHomeBase,
  attemptAgentSelfExpandAuthority,
  attemptAutoExecuteRecovery,
  attemptAutonomousContractChanges,
  attemptAutonomousExternalCommunications,
  attemptAutonomousPhysicalDispatch,
  attemptAutonomousPurchasing,
  attemptAutonomousSupplierSwitching,
  attemptFabricateMissionDisruptionData,
  attemptL4Autonomy,
  attemptTreatHistoricalAsProofOfNext,
  attemptTreatRecommendAsAct,
  attemptTreatSimAsFact,
  bootstrapSupplyChainResiliencePack,
  listResilienceAgentTeam,
  listResilienceRecordFields,
  listScenarioLibrary,
  listTruthBoundaryLabels,
  recommendRecovery,
  registerResilienceGraph,
  requireHumanRecoveryApproval,
  runSandboxScenario,
} from './supply-chain-resilience-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const analyst = {
  kind: 'supplier_risk' as const,
  id: 'agent-sr-1',
  orgId: 'org-eo8',
  tenantId: 'ten-eo8',
  universeId: 'uni-eo8',
  permissions: ['model_risk', 'recommend'],
};

const human = {
  ...analyst,
  kind: 'human_approver' as const,
  id: 'human-1',
  permissions: ['approve_consequential_recovery'],
};

test('SoT is 62L-EO8; GitLab mirror not invented; next is EO9', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EO8');
  assert.match(GITHUB_SOT_TITLE, /Supply Chain Resilience Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO9/);
  assert.match(NEXT_PHASE_TITLE, /Digital Product Contract Pack/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEo8LocksIntact(), true);
  assert.equal(EO8_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO8_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO8_LOCKS.TIP_LAND, false);
  assert.equal(EO8_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO8_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO8_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO8_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO8_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);

  const l4 = attemptL4Autonomy();
  assert.equal(l4.state, 'DENIED');
  assert.equal(l4.l4Enabled, false);
});

test('truth boundary labels hard-encoded', () => {
  const labels = listTruthBoundaryLabels();
  assert.deepEqual([...labels], [
    'OBSERVED_EVIDENCE',
    'MODEL_ESTIMATE',
    'SCENARIO_ASSUMPTION',
    'UNKNOWN',
  ]);
  assert.equal(TRUTH_BOUNDARY_LABELS.length, 4);
});

test('resilience graph node kinds + record fields + output fields encoded', () => {
  assert.deepEqual([...RESILIENCE_GRAPH_NODE_KINDS], [
    'supplier',
    'tier',
    'material_component',
    'facility',
    'inventory',
    'transport_lane',
    'customer_mission',
    'risk',
    'recovery_option',
  ]);
  const fields = listResilienceRecordFields();
  for (const required of [
    'supplierAndTier',
    'leadTimeAndVariability',
    'alternateSources',
    'singleSourceRisk',
    'truthLabel',
    'confidence',
  ] as const) {
    assert.ok(fields.includes(required));
  }
  assert.ok(RESILIENCE_RECORD_FIELDS.length >= 16);
  for (const out of [
    'impact',
    'affectedNodes',
    'timeToImpact',
    'estimatedServiceLoss',
    'costExposure',
    'recoveryOptions',
    'timeToRecover',
    'confidence',
    'evidenceRefs',
  ] as const) {
    assert.ok(RESILIENCE_OUTPUT_FIELDS.includes(out));
  }
});

test('scenario library covers required sandbox disruptions', () => {
  const lib = listScenarioLibrary();
  assert.equal(lib.length, 14);
  for (const id of [
    'supplier_failure',
    'port_closure',
    'semiconductor_shortage',
    'raw_material_shortage',
    'carrier_failure',
    'warehouse_outage',
    'extreme_weather',
    'cyber_related_operational_outage',
    'demand_spike',
    'equipment_failure',
    'regional_instability',
    'regulatory_export_disruption',
    'energy_constraint',
    'telecommunications_outage',
  ] as const) {
    assert.ok(SCENARIO_LIBRARY.includes(id), id);
  }
});

test('workflow hops + cycle cover graph/scenario/agent/safety', () => {
  assert.deepEqual([...RESILIENCE_WORKFLOW], [
    'risk_signal',
    'affected_graph',
    'exposure_calculation',
    'historical_analogues',
    'classical_scenario_model',
    'alternate_sourcing_capacity_options',
    'cost_service_tradeoff',
    'recovery_recommendation',
    'human_approval',
  ]);
  for (const required of [
    'resilience_graph_register',
    'truth_boundary_labels_hard',
    'scenario_library_sandbox',
    'agent_team_bounded',
    'eo6_classical_baseline_soft_wire',
    'eo7_logistics_pack_soft_wire',
    'eo5_quantum_honesty_soft_wire',
    'no_autonomous_purchasing',
    'no_autonomous_supplier_switching',
    'no_autonomous_contract_changes',
    'no_autonomous_physical_dispatch',
    'no_external_communications',
    'sim_neq_fact',
    'recommend_neq_act',
    'l4_autonomy_false',
  ] as const) {
    assert.ok(SUPPLY_CHAIN_RESILIENCE_PACK_CYCLE.includes(required), required);
  }
});

test('bounded agent team (9) — no auto authority', () => {
  const team = listResilienceAgentTeam();
  assert.equal(team.length, 9);
  for (const role of [
    'supplier_risk',
    'multi_tier_mapping',
    'inventory_resilience',
    'transportation_risk',
    'geopolitical_event_research',
    'quant_or',
    'historical_disruption',
    'cfo_cost',
    'recovery_simulation',
  ] as const) {
    assert.ok(RESILIENCE_AGENT_TEAM.includes(role));
  }
  const expand = attemptAgentSelfExpandAuthority(analyst);
  assert.equal(expand.state, 'DENIED');
  assert.equal(expand.authorityExpanded, false);
  const autoRec = attemptAutoExecuteRecovery();
  assert.equal(autoRec.state, 'DENIED');
  assert.equal(autoRec.recoveryExecuted, false);
});

test('hard autonomy denies: purchase / switch / contract / dispatch / external comm', () => {
  assert.equal(EO8_LOCKS.AUTONOMOUS_PURCHASING, false);
  assert.equal(EO8_LOCKS.AUTONOMOUS_SUPPLIER_SWITCHING, false);
  assert.equal(EO8_LOCKS.AUTONOMOUS_CONTRACT_CHANGES, false);
  assert.equal(EO8_LOCKS.AUTONOMOUS_PHYSICAL_DISPATCH, false);
  assert.equal(EO8_LOCKS.AUTONOMOUS_EXTERNAL_COMMUNICATIONS, false);

  const purchase = attemptAutonomousPurchasing();
  assert.equal(purchase.state, 'DENIED');
  assert.equal(purchase.autoPurchase, false);

  const sw = attemptAutonomousSupplierSwitching();
  assert.equal(sw.state, 'DENIED');
  assert.equal(sw.autoSupplierSwitch, false);

  const contract = attemptAutonomousContractChanges();
  assert.equal(contract.state, 'DENIED');
  assert.equal(contract.autoContractChange, false);

  const dispatch = attemptAutonomousPhysicalDispatch();
  assert.equal(dispatch.state, 'DENIED');
  assert.equal(dispatch.autoDispatch, false);

  const ext = attemptAutonomousExternalCommunications();
  assert.equal(ext.state, 'DENIED');
  assert.equal(ext.autoExternalComm, false);

  assert.ok(EO8_MAY.includes('recommend_recovery_options'));
  assert.ok(EO8_MUST_NOT.includes('autonomous_purchasing'));
  assert.ok(EO8_MUST_NOT.includes('autonomous_supplier_switching'));
  assert.ok(EO8_MUST_NOT.includes('autonomous_external_communications'));
});

test('fabrication denied; historical≠proof; sim≠fact; recommend≠act', () => {
  const fab = attemptFabricateMissionDisruptionData();
  assert.equal(fab.state, 'DENIED');
  assert.equal(fab.fabricated, false);

  const hist = attemptTreatHistoricalAsProofOfNext();
  assert.equal(hist.state, 'DENIED');
  assert.equal(hist.historicalProvesNext, false);

  const sim = attemptTreatSimAsFact();
  assert.equal(sim.state, 'DENIED');
  assert.equal(sim.simIsFact, false);

  const rec = attemptTreatRecommendAsAct();
  assert.equal(rec.state, 'DENIED');
  assert.equal(rec.recommendIsAct, false);

  assert.equal(EO8_LOCKS.AUTHORIZED_DATA_ONLY, true);
  assert.equal(EO8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED, true);
});

test('sandbox scenario → recovery recommend → human approval (no auto execute)', () => {
  const graph = registerResilienceGraph({
    graphId: 'graph-eo8-1',
    orgId: 'org-eo8',
    tenantId: 'ten-eo8',
    universeId: 'uni-eo8',
    nodes: [
      {
        nodeId: 'sup-1',
        kind: 'supplier',
        label: 'Tier-1 semiconductor supplier (sandbox fixture)',
        attributes: { tier: 1 },
        truthLabel: 'SCENARIO_ASSUMPTION',
        evidenceRefs: ['fixture:sandbox'],
        evidenceSourceDate: null,
        confidence: 0.4,
      },
      {
        nodeId: 'mat-1',
        kind: 'material_component',
        label: 'ASIC package',
        attributes: { singleSource: true },
        truthLabel: 'MODEL_ESTIMATE',
        evidenceRefs: [],
        evidenceSourceDate: null,
        confidence: 0.5,
      },
      {
        nodeId: 'lane-1',
        kind: 'transport_lane',
        label: 'Port corridor (sandbox)',
        attributes: {},
        truthLabel: 'UNKNOWN',
        evidenceRefs: [],
        evidenceSourceDate: null,
        confidence: null,
      },
    ],
    edges: [
      {
        edgeId: 'e1',
        fromNodeId: 'sup-1',
        toNodeId: 'mat-1',
        relation: 'supplies',
        truthLabel: 'SCENARIO_ASSUMPTION',
      },
      {
        edgeId: 'e2',
        fromNodeId: 'mat-1',
        toNodeId: 'lane-1',
        relation: 'ships_via',
        truthLabel: 'MODEL_ESTIMATE',
      },
    ],
  });
  assert.equal(graph.status, 'REGISTERED');
  assert.equal(graph.advisoryOnly, true);
  assert.equal(graph.fabricatedData, false);

  const run = runSandboxScenario({
    runId: 'run-1',
    scenarioId: 'semiconductor_shortage',
    graphId: graph.graphId,
    actor: analyst,
    seedNodeIds: ['sup-1'],
    impact: 'Sandbox semiconductor shortage — advisory exposure only.',
    timeToImpact: 'P14D',
    estimatedServiceLoss: 'partial_fulfillment_risk',
    costExposure: 1_000_000,
    confidence: 0.45,
    truthLabel: 'SCENARIO_ASSUMPTION',
    evidenceRefs: ['fixture:sandbox'],
    historicalAnalogues: [
      {
        analogueId: 'hist-1',
        summary: 'Prior industry shortage pattern (informational)',
        year: 2021,
        truthLabel: 'OBSERVED_EVIDENCE',
        provesNextOutcome: false,
        evidenceRefs: ['fixture:public-history'],
      },
    ],
    recoveryOptions: [
      {
        optionId: 'opt-alt-source',
        description: 'Qualify alternate source (recommendation only)',
        estimatedTimeToRecover: 'P90D',
        estimatedCost: 250_000,
        serviceImpactDelta: 'reduce_single_source_risk',
        truthLabel: 'MODEL_ESTIMATE',
      },
    ],
  });

  assert.equal(run.status, 'SANDBOX');
  assert.equal(run.classicalModelOnly, true);
  assert.equal(run.simIsFact, false);
  assert.equal(run.recommendIsAct, false);
  assert.equal(run.historicalProvesNext, false);
  assert.equal(run.autoPurchase, false);
  assert.equal(run.autoSupplierSwitch, false);
  assert.equal(run.autoContractChange, false);
  assert.equal(run.autoDispatch, false);
  assert.equal(run.autoExternalComm, false);
  assert.ok(run.affectedNodes.includes('sup-1'));
  assert.ok(run.affectedNodes.includes('mat-1'));
  assert.equal(run.historicalAnalogues[0]?.provesNextOutcome, false);

  const rec = recommendRecovery({ scenario: run });
  assert.equal(rec.status, 'RECOMMENDATION_ONLY');
  assert.equal(rec.autoExecutable, false);
  assert.equal(rec.humanApprovalRequired, true);
  assert.equal(rec.recommendIsAct, false);
  assert.equal(rec.options[0]?.autoExecutable, false);

  const deniedAgent = requireHumanRecoveryApproval({
    actor: analyst,
    runId: run.runId,
    optionIds: ['opt-alt-source'],
    approve: true,
  });
  assert.equal(deniedAgent.state, 'DENIED');
  assert.deepEqual(deniedAgent.executedActions, []);

  const approved = requireHumanRecoveryApproval({
    actor: human,
    runId: run.runId,
    optionIds: ['opt-alt-source'],
    approve: true,
  });
  assert.equal(approved.state, 'APPROVED_BOUNDED');
  assert.deepEqual(approved.approvedOptionIds, ['opt-alt-source']);
  assert.deepEqual(approved.executedActions, []);
  assert.equal(approved.autoPurchase, false);
  assert.equal(approved.autoSupplierSwitch, false);
  assert.equal(approved.autoDispatch, false);

  const advanced = advanceResilienceWorkflow(run, 'human_approval');
  assert.equal(advanced.workflowPosition, 'human_approval');
  assert.equal(advanced.status, 'HUMAN_APPROVAL_REQUIRED');
});

test('bootstrap + soft-wire EO6/EO7/EO5/#159/Home Base (presence ≠ VERIFIED)', () => {
  const boot = bootstrapSupplyChainResiliencePack(repoRoot);
  assert.equal(boot.status, 'IMPLEMENTED');
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.l4AutonomyEnabled, false);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.scenarioLibrary.length, 14);
  assert.equal(boot.agentTeam.length, 9);

  const soft = eo8SoftWireSnapshot(repoRoot);
  // On EO6 tip (EN lineage): Home Base + EN deal OS typically PRESENT; EO5/EO6/EO7/EO159 often WAITING_DATA.
  assert.equal(typeof soft.eo6ClassicalBaseline.present, 'boolean');
  assert.equal(typeof soft.eo7LogisticsPack.present, 'boolean');
  assert.equal(typeof soft.eo5QuantumHonesty.present, 'boolean');
  assert.equal(typeof soft.eo159MissionOsRuntime.present, 'boolean');
  assert.equal(typeof soft.homeBaseRuntime.present, 'boolean');

  if (soft.homeBaseRuntime.present) {
    const attach = attachEvidenceToHomeBase({
      runId: 'run-attach',
      evidenceRefs: ['fixture:sandbox'],
      repoRoot,
    });
    assert.equal(attach.status, 'ATTACHED_ADVISORY');
    assert.equal(attach.homeBasePresent, true);
  } else {
    const attach = attachEvidenceToHomeBase({
      runId: 'run-attach',
      evidenceRefs: ['fixture:sandbox'],
      repoRoot,
    });
    assert.equal(attach.status, 'WAITING_DATA');
  }

  const eo6Hop = boot.hops.find((h) => h.hop === 'eo6_classical_baseline_soft_wire');
  const eo7Hop = boot.hops.find((h) => h.hop === 'eo7_logistics_pack_soft_wire');
  const eo5Hop = boot.hops.find((h) => h.hop === 'eo5_quantum_honesty_soft_wire');
  assert.ok(eo6Hop);
  assert.ok(eo7Hop);
  assert.ok(eo5Hop);
  assert.ok(['AVAILABLE', 'WAITING_DATA'].includes(eo6Hop!.state));
  assert.ok(['AVAILABLE', 'WAITING_DATA'].includes(eo7Hop!.state));
  assert.ok(['AVAILABLE', 'WAITING_DATA'].includes(eo5Hop!.state));
});
