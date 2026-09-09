/**
 * 62L-EO9 — Digital Product Contract Pack denial + honesty tests.
 *
 * Script: npm run test:62leo9
 * Covers: product families + solution fields; deployment honesty;
 * certification claim denies; no auto deploy/bid/accept/ingest/permission;
 * acceptance checklist; agent bounds; quantum ladder; L4=false;
 * soft-wire EO1/EN/EM10/EO4/EO5/EO8 probes; Guardian isolation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ACCEPTANCE_CHECKLIST_ITEMS,
  CERTIFICATION_CLAIM_LABELS,
  DEPLOYMENT_OPTIONS,
  DIGITAL_PRODUCT_AGENT_BOUNDS,
  DIGITAL_PRODUCT_AGENT_TEAM,
  DIGITAL_PRODUCT_CONTRACT_PACK_CYCLE,
  DIGITAL_PRODUCT_CONTRACT_WORKFLOW,
  DIGITAL_PRODUCT_FAMILIES,
  DIGITAL_PRODUCT_FAMILY_LABELS,
  EO9_DB_CANDIDATES_STATUS,
  EO9_LOCKS,
  EO9_MAY,
  EO9_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_STATES,
  SOLUTION_RECORD_FIELDS,
  assertEo9LocksIntact,
  defaultDeploymentClaimState,
  eo9SoftWireSnapshot,
} from './digital-product-contract-pack-types.ts';
import {
  attemptAgentAutoAuthority,
  attemptAutoBidSubmission,
  attemptAutoContractAcceptance,
  attemptAutoCustomerDataIngest,
  attemptAutoPermissionExpansion,
  attemptAutoProductionDeploy,
  attemptClaimCertification,
  bootstrapDigitalProductContractPack,
  buildAgentTeamRoster,
  draftArchitecturePlan,
  draftDataIntegrationPlan,
  draftImplementationPlan,
  encodeAcceptanceChecklist,
  labelDeploymentClaim,
  labelQuantumClaim,
  mapSolicitationToProductFamilies,
  openPricingScenario,
  prepareProposalEvidence,
  probeGuardianRlsTenantUniverseIsolation,
  registerDigitalSolutionRecord,
  requireHumanApproval,
  returnAgentEvidenceToHomeBase,
  runDigitalProductContractPackCycle,
  sizeCompute,
  surfaceSecurityComplianceGaps,
} from './digital-product-contract-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const architect = {
  kind: 'solution_architect' as const,
  id: 'sa-1',
  orgId: 'org-eo9',
  tenantId: 'ten-eo9',
  universeId: 'uni-eo9',
  permissions: ['draft_architecture', 'map_products'],
};

const human = {
  ...architect,
  kind: 'human_approver' as const,
  id: 'human-1',
  permissions: ['approve_consequential', 'authorize_submission'],
};

test('SoT label EO9; GitLab mirror not invented; next EO10', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EO9');
  assert.equal(GITHUB_SOT_ISSUE, 159);
  assert.match(GITHUB_SOT_TITLE, /Digital Product Contract Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO10/);
  assert.match(NEXT_PHASE_TITLE, /Physical Product Contract Pack/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEo9LocksIntact(), true);
  assert.equal(EO9_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO9_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO9_LOCKS.TIP_LAND, false);
  assert.equal(EO9_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO9_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO9_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO9_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO9_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('product families + solution record fields + workflow encoded', () => {
  assert.equal(DIGITAL_PRODUCT_FAMILIES.length, 11);
  assert.equal(
    DIGITAL_PRODUCT_FAMILY_LABELS.xiv_search_knowledge_os,
    'XIV Search & Knowledge OS',
  );
  assert.equal(
    DIGITAL_PRODUCT_FAMILY_LABELS.api_enterprise_connector_layer,
    'API & Enterprise Connector Layer',
  );

  for (const field of [
    'requirementId',
    'productModule',
    'deploymentModel',
    'dataSources',
    'userRoles',
    'agentRoles',
    'computeRequirements',
    'securityBoundary',
    'integrationRequirements',
    'performanceTargets',
    'acceptanceTests',
    'supportModel',
    'pricingModel',
    'knownLimitations',
    'evidenceState',
  ] as const) {
    assert.ok(SOLUTION_RECORD_FIELDS.includes(field), field);
  }

  assert.deepEqual(
    [...DIGITAL_PRODUCT_CONTRACT_WORKFLOW],
    [
      'solicitation_requirement',
      'digital_product_mapping',
      'architecture',
      'data_integration_plan',
      'security_compliance_gaps',
      'compute_sizing',
      'implementation_plan',
      'test_acceptance_criteria',
      'pricing',
      'proposal_evidence',
    ],
  );
});

test('deployment honesty: untested defaults; TESTED/VERIFIED denied without evidence', () => {
  assert.deepEqual(
    [...DEPLOYMENT_OPTIONS],
    [
      'LOCAL',
      'PRIVATE_CLOUD',
      'PUBLIC_CLOUD',
      'HYBRID',
      'EDGE',
      'DISCONNECTED_OFFLINE',
    ],
  );
  assert.equal(defaultDeploymentClaimState('LOCAL'), 'NOT_TESTED');
  assert.equal(
    defaultDeploymentClaimState('PRIVATE_CLOUD', { architectureListed: true }),
    'CANDIDATE',
  );
  assert.equal(
    defaultDeploymentClaimState('EDGE', { explicitlyUnsupported: true }),
    'NOT_AVAILABLE',
  );

  const denied = labelDeploymentClaim({
    option: 'PUBLIC_CLOUD',
    desiredState: 'VERIFIED',
    testEvidencePresent: false,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const ok = labelDeploymentClaim({
    option: 'LOCAL',
    desiredState: 'CANDIDATE',
  });
  assert.equal('denied' in ok, false);
  if (!('denied' in ok)) {
    assert.equal(ok.claimState, 'CANDIDATE');
  }

  const regDenied = registerDigitalSolutionRecord({
    requirementId: 'req-bad-deploy',
    productModule: 'decision_intelligence',
    actor: architect,
    claimDeploymentTestedWithoutEvidence: true,
  });
  assert.equal('denied' in regDenied && regDenied.denied, true);
});

test('acceptance checklist encodes all required items', () => {
  assert.equal(ACCEPTANCE_CHECKLIST_ITEMS.length, 12);
  for (const item of [
    'exact_measurable_outcome',
    'what_xiv_can_verify_today',
    'what_remains_candidate_research',
    'required_customer_government_data',
    'integrations_and_permissions',
    'expected_users_load',
    'latency_availability_targets',
    'backup_recovery',
    'tenant_universe_isolation',
    'audit_logging',
    'rollback_plan',
    'human_approvals_for_consequential_actions',
  ] as const) {
    assert.ok(ACCEPTANCE_CHECKLIST_ITEMS.includes(item), item);
  }

  const checklist = encodeAcceptanceChecklist({
    checklistId: 'ac-1',
    requirementId: 'req-1',
  });
  assert.equal(checklist.items.length, 12);
  assert.equal(checklist.allItemsEncoded, true);
  assert.ok(
    checklist.items.some(
      (i) =>
        i.item === 'human_approvals_for_consequential_actions' &&
        i.status === 'DOCUMENTED',
    ),
  );
});

test('certification claim denies without evidence (FedRAMP/FISMA/CMMC/clearance/agency/prod)', () => {
  for (const label of CERTIFICATION_CLAIM_LABELS) {
    const result = attemptClaimCertification(label);
    assert.equal(result.state, 'DENIED');
    assert.equal(result.executed, false);
    assert.match(result.reason, /WITHOUT_EVIDENCE/i);
  }

  const gaps = surfaceSecurityComplianceGaps({
    gapId: 'gap-1',
    requirementId: 'req-1',
    gaps: ['auth boundary undefined'],
    attemptClaimCertification: 'FedRAMP',
    certificationEvidencePresent: false,
  });
  assert.equal('denied' in gaps && gaps.denied, true);
});

test('hard autonomy denies: no auto deploy/bid/accept/ingest/permission expansion', () => {
  assert.equal(EO9_LOCKS.AUTO_PRODUCTION_DEPLOY, false);
  assert.equal(EO9_LOCKS.AUTO_BID_SUBMISSION, false);
  assert.equal(EO9_LOCKS.AUTO_CONTRACT_ACCEPTANCE, false);
  assert.equal(EO9_LOCKS.AUTO_CUSTOMER_DATA_INGEST, false);
  assert.equal(EO9_LOCKS.AUTO_PERMISSION_EXPANSION, false);

  const deploy = attemptAutoProductionDeploy();
  assert.equal(deploy.state, 'DENIED');
  assert.equal(deploy.autoDeployed, false);

  const bid = attemptAutoBidSubmission();
  assert.equal(bid.state, 'DENIED');
  assert.equal(bid.autoSubmitted, false);

  const accept = attemptAutoContractAcceptance();
  assert.equal(accept.state, 'DENIED');
  assert.equal(accept.autoAccepted, false);

  const ingest = attemptAutoCustomerDataIngest();
  assert.equal(ingest.state, 'DENIED');
  assert.equal(ingest.ingested, false);

  const expand = attemptAutoPermissionExpansion();
  assert.equal(expand.state, 'DENIED');
  assert.equal(expand.expanded, false);

  assert.ok(EO9_MAY.includes('register_digital_solution_records'));
  assert.ok(EO9_MUST_NOT.includes('autonomous_production_deploy'));
  assert.ok(EO9_MUST_NOT.includes('claim_fedramp_without_evidence'));
});

test('agent team bounded; evidence to Home Base; no auto authority', () => {
  assert.equal(DIGITAL_PRODUCT_AGENT_TEAM.length, 10);
  assert.equal(DIGITAL_PRODUCT_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(DIGITAL_PRODUCT_AGENT_BOUNDS.mayReturnEvidenceToHomeBase, true);

  const roster = buildAgentTeamRoster();
  assert.equal(roster.length, 10);
  assert.ok(roster.every((r) => r.automaticAuthority === false));

  const autoAuth = attemptAgentAutoAuthority(architect);
  assert.equal(autoAuth.state, 'DENIED');

  const evidence = returnAgentEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: architect,
    summary: 'Architecture draft candidate',
  });
  assert.equal('denied' in evidence, false);
  if (!('denied' in evidence)) {
    assert.equal(evidence.returnedToHomeBase, true);
    assert.equal(evidence.authorityGranted, false);
  }
});

test('quantum claim ladder; PHYSICAL_QPU_VERIFIED denied without evidence', () => {
  assert.deepEqual(
    [...QUANTUM_CLAIM_STATES],
    ['THEORETICAL', 'SIMULATED', 'QUANTUM_INSPIRED', 'PHYSICAL_QPU_VERIFIED'],
  );

  const theo = labelQuantumClaim({
    claimId: 'q-1',
    state: 'THEORETICAL',
  });
  assert.equal('denied' in theo, false);

  const denied = labelQuantumClaim({
    claimId: 'q-2',
    state: 'PHYSICAL_QPU_VERIFIED',
    physicalQpuEvidencePresent: false,
  });
  assert.equal('denied' in denied && denied.denied, true);
});

test('workflow surfaces advisory; human approval required; guardian isolation', () => {
  const mapped = mapSolicitationToProductFamilies({
    mappingId: 'map-1',
    requirementId: 'req-1',
    solicitationText: 'AI search and knowledge OS',
    families: ['xiv_search_knowledge_os', 'secure_data_virtual_warehouse_layer'],
  });
  assert.equal('denied' in mapped, false);
  if (!('denied' in mapped)) {
    assert.equal(mapped.advisoryOnly, true);
    assert.equal(mapped.eligibilityImplied, false);
  }

  const arch = draftArchitecturePlan({
    planId: 'arch-1',
    requirementId: 'req-1',
    modules: ['agentic_workflow_platform'],
  });
  assert.equal(arch.productionAuthorized, false);
  assert.ok(arch.deploymentCandidates.every((d) => d.claimState !== 'VERIFIED'));

  const dataDenied = draftDataIntegrationPlan({
    planId: 'data-1',
    requirementId: 'req-1',
    sources: ['customer warehouse'],
    integrations: ['API connector'],
    attemptCustomerDataIngest: true,
  });
  assert.equal('denied' in dataDenied && dataDenied.denied, true);

  const size = sizeCompute({
    sizeId: 'sz-1',
    requirementId: 'req-1',
    estimate: '4x GPU CANDIDATE',
  });
  assert.equal('denied' in size, false);
  if (!('denied' in size)) {
    assert.equal(size.evidenceState, 'CANDIDATE');
  }

  const implDenied = draftImplementationPlan({
    planId: 'impl-1',
    requirementId: 'req-1',
    steps: ['stage', 'deploy'],
    attemptAutoDeploy: true,
  });
  assert.equal('denied' in implDenied && implDenied.denied, true);

  const price = openPricingScenario({
    scenarioId: 'price-1',
    requirementId: 'req-1',
    scenario: 'subscription candidate',
  });
  assert.equal('denied' in price, false);

  const proposalDenied = prepareProposalEvidence({
    packageId: 'prop-1',
    requirementId: 'req-1',
    evidenceRefs: ['arch-1'],
    attemptAutoSubmit: true,
  });
  assert.equal('denied' in proposalDenied && proposalDenied.denied, true);

  const humanDenied = requireHumanApproval({
    approvalId: 'appr-bad',
    requirementId: 'req-1',
    actor: architect,
    action: 'deploy',
  });
  assert.equal('denied' in humanDenied && humanDenied.denied, true);

  const humanOk = requireHumanApproval({
    approvalId: 'appr-ok',
    requirementId: 'req-1',
    actor: human,
    action: 'authorize_proposal_evidence_package',
  });
  assert.equal('denied' in humanOk, false);

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  assert.equal(isolation.unchanged, true);
  assert.equal(isolation.bypassDenied, true);
});

test('soft-wire EO1/EN/EM10/EO4/EO5/EO8 probes; EN+EM10 present on EO8 base tip', () => {
  const snap = eo9SoftWireSnapshot(repoRoot);
  assert.equal(snap.en158DealOs.present, true);
  assert.equal(snap.en158DealRuntime.present, true);
  assert.equal(snap.en158Report.present, true);
  assert.equal(snap.em10UserAccessEconomy.present, true);
  assert.equal(snap.em10Report.present, true);
  assert.equal(snap.em1HomeBaseContract.present, true);
  // Predecessor EO packs may be absent on EN-lineage tip — WAITING_DATA is honest
  assert.equal(typeof snap.eo1GovContractsCommandCenter.present, 'boolean');
  assert.equal(typeof snap.eo4AiQuantumCapabilityMatrix.present, 'boolean');
  assert.equal(typeof snap.eo5QuantumEvidenceBoundary.present, 'boolean');
  assert.equal(typeof snap.eo8SupplyChainResiliencePack.present, 'boolean');
});

test('cycle covers pack surfaces + bootstrap; register solution record', () => {
  for (const required of [
    'product_families_encoded',
    'solution_record_fields_encoded',
    'deployment_claim_only_if_tested',
    'gov_contract_workflow_encoded',
    'acceptance_checklist_encoded',
    'agent_team_bounded',
    'deny_fedramp_without_evidence',
    'no_autonomous_production_deploy',
    'no_autonomous_bid_submission',
    'no_autonomous_contract_acceptance',
    'no_autonomous_customer_data_ingest',
    'no_autonomous_permission_expansion',
    'quantum_claim_ladder_enforced',
    'l4_autonomy_false',
    'eo1_soft_wire',
    'en158_soft_wire',
    'em10_soft_wire',
    'eo4_soft_wire',
    'eo5_soft_wire',
    'eo8_soft_wire',
  ] as const) {
    assert.ok(DIGITAL_PRODUCT_CONTRACT_PACK_CYCLE.includes(required), required);
  }

  const boot = bootstrapDigitalProductContractPack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.families.length, 11);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const solution = registerDigitalSolutionRecord({
    requirementId: 'req-eo9-reg',
    productModule: 'pricing_contract_proposal_intelligence',
    actor: architect,
    deploymentModel: 'PRIVATE_CLOUD',
  });
  assert.equal('denied' in solution, false);
  if (!('denied' in solution)) {
    assert.equal(solution.deploymentClaimState, 'CANDIDATE');
    assert.equal(solution.fedrampClaimed, false);
    assert.equal(solution.productionReadinessClaimed, false);
    assert.equal(solution.autoDeployed, false);
  }

  const cycle = runDigitalProductContractPackCycle({
    actor: architect,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 20);
  assert.equal(cycle.checklistItems, 12);
  assert.ok(cycle.hops.some((h) => h.hop === 'l4_autonomy_false' && h.state === 'PASS'));
  assert.ok(
    cycle.hops.some(
      (h) => h.hop === 'deny_fedramp_without_evidence' && h.state === 'DENIED',
    ),
  );
});
