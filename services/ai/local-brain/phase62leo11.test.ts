/**
 * 62L-EO11 — Virtual Data Warehouse Mission Pack denial + honesty tests.
 *
 * Script: npm run test:62leo11
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  AGENT_ACCESS_GATE_FLOW,
  AGENT_ACCESS_REQUEST_FIELDS,
  EO11_DB_CANDIDATES_STATUS,
  EO11_LOCKS,
  EO11_MAY,
  EO11_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MISSION_WAREHOUSE_TYPES,
  NEURAL_PATHWAY_NODE_KINDS,
  NEXT_PHASE_TITLE,
  VIRTUAL_DATA_WAREHOUSE_MISSION_PACK_CYCLE,
  VIRTUAL_WAREHOUSE_AGENT_BOUNDS,
  VIRTUAL_WAREHOUSE_CORE_FLOW,
  WAREHOUSE_DEFINITION_FIELDS,
  WAREHOUSE_RELIABILITY_STATES,
  assertEo11LocksIntact,
  eo11SoftWireSnapshot,
  mayTreatAsCurrentTruth,
  type Eo11Actor,
} from './virtual-data-warehouse-mission-pack-types.ts';

import {
  attemptAgentAutoAuthority,
  attemptBlanketAgentDatabaseAccess,
  attemptLeakRestrictedDataset,
  attemptProductionDatabaseMutation,
  attemptRawPrivateCrossTenantPooling,
  attemptSilentCloudReplication,
  attemptTreatStaleAsCurrentTruth,
  attemptUnauthorizedIngestion,
  attachNeuralPathwayNode,
  bootstrapVirtualDataWarehouseMissionPack,
  openAgentAccessRequest,
  planDeletionRevocationPropagation,
  probeGuardianRlsTenantUniverseIsolation,
  registerMissionWarehouse,
  requireHumanApproval,
  returnAgentEvidenceToHomeBase,
  returnBoundedQueryResult,
  runPolicyRlsGuardianGate,
  runVirtualDataWarehouseMissionPackCycle,
} from './virtual-data-warehouse-mission-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const architect: Eo11Actor = {
  kind: 'warehouse_architect',
  id: 'wh-arch-1',
  orgId: 'org-eo11',
  tenantId: 'ten-eo11',
  universeId: 'uni-eo11',
  permissions: ['draft'],
};

const human: Eo11Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eo11',
  tenantId: 'ten-eo11',
  universeId: 'uni-eo11',
  permissions: ['approve_consequential', 'authorize_ingestion'],
};

test('SoT label EO11; GitLab mirror not invented; next EO12', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EO11');
  assert.equal(GITHUB_SOT_ISSUE, 159);
  assert.match(GITHUB_SOT_TITLE, /Virtual Data Warehouse Mission Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO12/);
  assert.match(NEXT_PHASE_TITLE, /Virtual Universe Mission Simulator/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEo11LocksIntact(), true);
  assert.equal(EO11_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO11_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO11_LOCKS.TIP_LAND, false);
  assert.equal(EO11_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO11_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO11_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO11_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO11_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('warehouse types + definition fields + core flow + reliability encoded', () => {
  assert.equal(MISSION_WAREHOUSE_TYPES.length, 10);
  assert.ok(MISSION_WAREHOUSE_TYPES.includes('logistics_warehouse'));
  assert.ok(
    MISSION_WAREHOUSE_TYPES.includes('historical_business_case_study_warehouse'),
  );

  assert.equal(WAREHOUSE_DEFINITION_FIELDS.length, 20);
  for (const field of [
    'warehouseId',
    'missionOrganization',
    'tenantUniverse',
    'dataOwners',
    'sourceSystems',
    'schemaCatalog',
    'dataClassifications',
    'lineage',
    'retention',
    'residencyLocation',
    'encryptionState',
    'accessRoles',
    'connectorScopes',
    'computeBudget',
    'storageBudget',
    'freshnessSLOs',
    'backupRecoveryState',
    'deletionRevocationPolicy',
    'auditState',
    'evidenceStatus',
  ] as const) {
    assert.ok(WAREHOUSE_DEFINITION_FIELDS.includes(field), field);
  }

  assert.deepEqual(
    [...VIRTUAL_WAREHOUSE_CORE_FLOW],
    [
      'source',
      'authorized_connector',
      'ingestion_gate',
      'mission_warehouse',
      'search_analytics_agents',
      'decision_object',
      'outcome',
    ],
  );

  assert.deepEqual(
    [...WAREHOUSE_RELIABILITY_STATES],
    ['FRESH', 'STALE', 'DEGRADED', 'UNAVAILABLE', 'UNKNOWN'],
  );
  assert.equal(mayTreatAsCurrentTruth('FRESH'), true);
  assert.equal(mayTreatAsCurrentTruth('STALE'), false);
  assert.equal(mayTreatAsCurrentTruth('UNKNOWN'), false);
});

test('agent access model: scoped requests; blanket access denied; gate flow encoded', () => {
  assert.deepEqual(
    [...AGENT_ACCESS_REQUEST_FIELDS],
    [
      'agentId',
      'purpose',
      'allowedDataset',
      'fields',
      'dataClass',
      'timeWindow',
      'taskId',
      'expiry',
    ],
  );
  assert.deepEqual(
    [...AGENT_ACCESS_GATE_FLOW],
    [
      'policy_rls_guardian',
      'approved_query',
      'bounded_result',
      'evidence_receipt',
    ],
  );
  assert.equal(VIRTUAL_WAREHOUSE_AGENT_BOUNDS.blanketDatabaseAccess, false);

  const blanket = attemptBlanketAgentDatabaseAccess();
  assert.equal(blanket.state, 'DENIED');
  assert.equal(blanket.granted, false);

  const denied = openAgentAccessRequest({
    agentId: 'a1',
    purpose: 'analysis',
    allowedDataset: 'shipments',
    fields: ['id'],
    dataClass: 'internal',
    timeWindow: '2026-01/2026-03',
    taskId: 't1',
    expiry: '2026-09-10T00:00:00Z',
    warehouseId: 'wh-1',
    actor: architect,
    attemptBlanketAccess: true,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const ok = openAgentAccessRequest({
    agentId: 'a1',
    purpose: 'analysis',
    allowedDataset: 'shipments',
    fields: ['id', 'status'],
    dataClass: 'internal',
    timeWindow: '2026-01/2026-03',
    taskId: 't1',
    expiry: '2026-09-10T00:00:00Z',
    warehouseId: 'wh-1',
    actor: architect,
  });
  assert.equal('denied' in ok, false);
});

test('critical boundaries denied: cross-tenant, prod mutate, ingest, leak, silent replicate', () => {
  assert.equal(EO11_LOCKS.RAW_PRIVATE_CROSS_TENANT_POOLING, false);
  assert.equal(EO11_LOCKS.PRODUCTION_DATABASE_MUTATIONS, false);
  assert.equal(EO11_LOCKS.UNAUTHORIZED_INGESTION, false);
  assert.equal(EO11_LOCKS.LEAK_RESTRICTED_DATASETS, false);
  assert.equal(EO11_LOCKS.SILENT_CLOUD_REPLICATION, false);

  const pool = attemptRawPrivateCrossTenantPooling();
  assert.equal(pool.state, 'DENIED');
  assert.equal(pool.pooled, false);

  const mutate = attemptProductionDatabaseMutation();
  assert.equal(mutate.state, 'DENIED');
  assert.equal(mutate.mutated, false);

  const ingest = attemptUnauthorizedIngestion();
  assert.equal(ingest.state, 'DENIED');
  assert.equal(ingest.ingested, false);

  const leak = attemptLeakRestrictedDataset();
  assert.equal(leak.state, 'DENIED');
  assert.equal(leak.leaked, false);

  const replicate = attemptSilentCloudReplication();
  assert.equal(replicate.state, 'DENIED');
  assert.equal(replicate.replicated, false);

  const regDenied = registerMissionWarehouse({
    warehouseId: 'wh-bad',
    missionOrganization: 'x',
    warehouseType: 'finance_cost_warehouse',
    actor: architect,
    attemptCrossTenantPool: true,
  });
  assert.equal('denied' in regDenied && regDenied.denied, true);

  assert.ok(EO11_MAY.includes('register_mission_warehouse_definitions'));
  assert.ok(EO11_MUST_NOT.includes('raw_private_cross_tenant_pooling'));
  assert.ok(EO11_MUST_NOT.includes('treat_stale_or_missing_as_current_truth'));
});

test('stale/missing ≠ current truth; deletion/revocation propagation required', () => {
  for (const state of ['STALE', 'DEGRADED', 'UNAVAILABLE', 'UNKNOWN'] as const) {
    const denied = attemptTreatStaleAsCurrentTruth(state);
    assert.equal(denied.state, 'DENIED');
    assert.equal(denied.treatedAsCurrentTruth, false);
  }

  const skip = planDeletionRevocationPropagation({
    planId: 'del-bad',
    warehouseId: 'wh-1',
    targets: ['cache'],
    attemptSkipPropagation: true,
  });
  assert.equal('denied' in skip && skip.denied, true);

  const plan = planDeletionRevocationPropagation({
    planId: 'del-ok',
    warehouseId: 'wh-1',
    targets: ['derived_index', 'cache'],
  });
  assert.equal('denied' in plan, false);
  if (!('denied' in plan)) {
    assert.equal(plan.propagationRequired, true);
    assert.equal(plan.executed, false);
  }
});

test('policy gate + bounded result + neural pathway provenance', () => {
  const request = openAgentAccessRequest({
    agentId: 'analytics-1',
    purpose: 'analysis',
    allowedDataset: 'lanes',
    fields: ['laneId', 'status'],
    dataClass: 'internal',
    timeWindow: 'P30D',
    taskId: 'task-1',
    expiry: '2026-09-10T00:00:00Z',
    warehouseId: 'wh-1',
    actor: architect,
  });
  assert.equal('denied' in request, false);
  if ('denied' in request) return;

  const gate = runPolicyRlsGuardianGate({
    request,
    reliabilityState: 'FRESH',
  });
  assert.equal('denied' in gate, false);
  if (!('denied' in gate)) {
    assert.equal(gate.approved, true);
    assert.equal(gate.currentTruthEligible, true);
  }

  const staleTruth = runPolicyRlsGuardianGate({
    request: { ...request, purpose: 'assert_current_truth' },
    reliabilityState: 'STALE',
  });
  assert.equal('denied' in staleTruth && staleTruth.denied, true);

  const restricted = runPolicyRlsGuardianGate({
    request,
    reliabilityState: 'FRESH',
    restrictedDataset: true,
  });
  assert.equal('denied' in restricted && restricted.denied, true);

  const result = returnBoundedQueryResult({
    resultId: 'r1',
    request,
    rows: [{ laneId: 'L1', status: 'ok', secret: 'nope' }],
    reliabilityState: 'FRESH',
  });
  assert.equal('denied' in result, false);
  if (!('denied' in result)) {
    assert.equal(result.bounded, true);
    assert.equal(result.fieldScope.includes('secret'), false);
  }

  assert.deepEqual(
    [...NEURAL_PATHWAY_NODE_KINDS],
    [
      'source_fact',
      'business_logistics_pattern',
      'experiment',
      'recommendation',
      'decision',
      'outcome',
    ],
  );

  const nodeDenied = attachNeuralPathwayNode({
    nodeId: 'n-bad',
    kind: 'recommendation',
    warehouseId: 'wh-1',
    resultId: 'r1',
    provenance: '',
    permissionScope: '',
    attemptStripProvenance: true,
  });
  assert.equal('denied' in nodeDenied && nodeDenied.denied, true);

  const node = attachNeuralPathwayNode({
    nodeId: 'n1',
    kind: 'source_fact',
    warehouseId: 'wh-1',
    resultId: 'r1',
    provenance: 'wh-1/r1',
    permissionScope: 'tenant=ten-eo11;fields=laneId,status',
  });
  assert.equal('denied' in node, false);
  if (!('denied' in node)) {
    assert.equal(node.edgeKeepsProvenanceAndPermissionScope, true);
  }
});

test('agent bounds; evidence to Home Base; guardian isolation; human gate', () => {
  assert.equal(VIRTUAL_WAREHOUSE_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(VIRTUAL_WAREHOUSE_AGENT_BOUNDS.mayReturnEvidenceToHomeBase, true);

  const autoAuth = attemptAgentAutoAuthority(architect);
  assert.equal(autoAuth.state, 'DENIED');

  const evidence = returnAgentEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: architect,
    summary: 'Warehouse definition candidate',
  });
  assert.equal('denied' in evidence, false);
  if (!('denied' in evidence)) {
    assert.equal(evidence.returnedToHomeBase, true);
    assert.equal(evidence.authorityGranted, false);
  }

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  assert.equal(isolation.unchanged, true);
  assert.equal(isolation.bypassDenied, true);

  const humanDenied = requireHumanApproval({
    approvalId: 'appr-bad',
    warehouseId: 'wh-1',
    actor: architect,
    action: 'ingest',
  });
  assert.equal('denied' in humanDenied && humanDenied.denied, true);

  const humanOk = requireHumanApproval({
    approvalId: 'appr-ok',
    warehouseId: 'wh-1',
    actor: human,
    action: 'authorize_bounded_ingestion_plan',
  });
  assert.equal('denied' in humanOk, false);
});

test('soft-wire EO10/EO9/EO8/EN/EM10/EM1 probes; EO10+EO9+EN+EM10 present on EO10 tip', () => {
  const snap = eo11SoftWireSnapshot(repoRoot);
  assert.equal(snap.eo10PhysicalProductContractPack.present, true);
  assert.equal(snap.eo10Report.present, true);
  assert.equal(snap.eo9DigitalProductContractPack.present, true);
  assert.equal(snap.eo9Report.present, true);
  assert.equal(snap.en158DealOs.present, true);
  assert.equal(snap.en158DealRuntime.present, true);
  assert.equal(snap.en158Report.present, true);
  assert.equal(snap.em10UserAccessEconomy.present, true);
  assert.equal(snap.em10Report.present, true);
  assert.equal(typeof snap.eo8SupplyChainResiliencePack.present, 'boolean');
  assert.equal(typeof snap.em1HomeBaseContract.present, 'boolean');
});

test('cycle covers pack surfaces + bootstrap; register warehouse', () => {
  for (const required of [
    'mission_warehouse_types_encoded',
    'warehouse_definition_fields_encoded',
    'core_flow_encoded',
    'reliability_states_encoded',
    'stale_or_missing_neq_current_truth',
    'no_blanket_database_access',
    'no_raw_private_cross_tenant_pooling',
    'no_production_database_mutations',
    'no_unauthorized_ingestion',
    'no_leaked_restricted_datasets',
    'no_silent_cloud_replication',
    'deletion_revocation_propagates',
    'l4_autonomy_false',
    'eo10_soft_wire',
    'eo9_soft_wire',
    'en158_soft_wire',
    'em10_soft_wire',
  ] as const) {
    assert.ok(
      VIRTUAL_DATA_WAREHOUSE_MISSION_PACK_CYCLE.includes(required),
      required,
    );
  }

  const boot = bootstrapVirtualDataWarehouseMissionPack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.warehouseTypes.length, 10);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const warehouse = registerMissionWarehouse({
    warehouseId: 'wh-eo11-reg',
    missionOrganization: 'mission-alpha',
    warehouseType: 'proposal_evidence_warehouse',
    actor: architect,
    sourceSystems: ['deal-os-candidate'],
    reliabilityState: 'UNKNOWN',
  });
  assert.equal('denied' in warehouse, false);
  if (!('denied' in warehouse)) {
    assert.equal(warehouse.crossTenantPooled, false);
    assert.equal(warehouse.productionMutated, false);
    assert.equal(warehouse.blanketAgentAccess, false);
    assert.equal(warehouse.reliabilityState, 'UNKNOWN');
    assert.match(warehouse.deletionRevocationPolicy, /PROPAGATE/);
  }

  const cycle = runVirtualDataWarehouseMissionPackCycle({
    actor: architect,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 20);
  assert.equal('denied' in cycle.warehouse, false);
  assert.equal(cycle.softWire.eo10PhysicalProductContractPack.present, true);
});
