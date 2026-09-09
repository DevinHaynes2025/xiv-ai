/**
 * 62L-EO10 — Physical Product Contract Pack denial + honesty tests.
 *
 * Script: npm run test:62leo10
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EO10_DB_CANDIDATES_STATUS,
  EO10_LOCKS,
  EO10_MAY,
  EO10_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HIGH_CONSEQUENCE_LIVE_CONTROL_DOMAINS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PHYSICAL_PRICING_DIMENSIONS,
  PHYSICAL_PRODUCT_AGENT_BOUNDS,
  PHYSICAL_PRODUCT_AGENT_TEAM,
  PHYSICAL_PRODUCT_CONTRACT_LIFECYCLE,
  PHYSICAL_PRODUCT_CONTRACT_PACK_CYCLE,
  PHYSICAL_PRODUCT_FAMILIES,
  PHYSICAL_SOLUTION_RECORD_FIELDS,
  PHYSICAL_CONTRACT_READY_ACCEPTANCE_ITEMS,
  QUANTUM_CLAIM_STATES,
  SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS,
  assertEo10LocksIntact,
  eo10SoftWireSnapshot,
  type PhysicalContractReadyEvidence,
  type Eo10Actor,
} from './physical-product-contract-pack-types.ts';

import {
  attemptAgentAutoAuthority,
  attemptAutonomousPurchaseOrder,
  attemptClaimSafetyCertification,
  attemptDeviceShipmentOrDeployment,
  attemptExportControlOrProcurementBypass,
  attemptLiveHighConsequenceControl,
  attemptManufacturingCommitment,
  attemptSupplierContract,
  bootstrapPhysicalProductContractPack,
  buildAgentTeamRoster,
  draftBomCandidate,
  draftManufacturingPlan,
  draftProductArchitecture,
  labelQuantumHardwareClaim,
  mapRequirementToProductFamilies,
  modelSupplierGraph,
  openPricingDimensionComparison,
  prepareProposalEvidence,
  probeGuardianRlsTenantUniverseIsolation,
  registerPhysicalSolutionRecord,
  requireHumanApproval,
  returnAgentEvidenceToHomeBase,
  runPhysicalProductContractPackCycle,
  surfaceSupplyChainIntelligence,
} from './physical-product-contract-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const architect: Eo10Actor = {
  kind: 'hardware_architect',
  id: 'hw-arch-1',
  orgId: 'org-eo10',
  tenantId: 'ten-eo10',
  universeId: 'uni-eo10',
  permissions: ['draft'],
};

const human: Eo10Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eo10',
  tenantId: 'ten-eo10',
  universeId: 'uni-eo10',
  permissions: ['approve_consequential', 'authorize_commitment'],
};

test('SoT label EO10; GitLab mirror not invented; next EO11', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EO10');
  assert.equal(GITHUB_SOT_ISSUE, 159);
  assert.match(GITHUB_SOT_TITLE, /Physical Product Contract Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO11/);
  assert.match(NEXT_PHASE_TITLE, /Virtual Data Warehouse Mission Pack/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEo10LocksIntact(), true);
  assert.equal(EO10_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO10_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO10_LOCKS.TIP_LAND, false);
  assert.equal(EO10_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO10_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO10_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO10_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO10_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.equal(EO10_LOCKS.FABRICATE_COST_FIGURES, false);
  assert.equal(EO10_LOCKS.FABRICATE_SAVINGS_FIGURES, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('product families + solution fields + lifecycle + SC/pricing dims encoded', () => {
  assert.equal(PHYSICAL_PRODUCT_FAMILIES.length, 10);
  assert.ok(PHYSICAL_PRODUCT_FAMILIES.includes('edge_ai_appliances'));
  assert.ok(
    PHYSICAL_PRODUCT_FAMILIES.includes('hybrid_hardware_xiv_software_bundles'),
  );

  for (const field of [
    'requirementId',
    'programId',
    'agencyCustomer',
    'requirementIds',
    'productCategory',
    'productFamily',
    'BOM',
    'approvedSuppliers',
    'supplierGraph',
    'countryRegionOfOrigin',
    'leadTimes',
    'manufacturingCapacity',
    'qualityStandards',
    'manufacturingMethod',
    'qualityRequirements',
    'edgeOfflineRequirements',
    'testingRequirements',
    'firmwareSoftwareDependencies',
    'computeRequirements',
    'securityRequirements',
    'packaging',
    'transportation',
    'maintenance',
    'warranty',
    'spares',
    'lifecycle',
    'unitCost',
    'volumePricing',
    'acceptanceCriteria',
    'evidenceState',
  ] as const) {
    assert.ok(PHYSICAL_SOLUTION_RECORD_FIELDS.includes(field), field);
  }

  assert.deepEqual(
    [...PHYSICAL_PRODUCT_CONTRACT_LIFECYCLE],
    [
      'contract_requirement',
      'product_architecture',
      'bom',
      'supplier_sourcing',
      'prototype',
      'verification_testing',
      'manufacturing_planning',
      'quality_inspection',
      'logistics_distribution',
      'field_support',
      'maintenance_spares',
      'end_of_life_management',
    ],
  );

  assert.equal(SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS.length, 12);
  assert.ok(SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS.includes('chip_shortages'));
  assert.ok(
    SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS.includes('lifecycle_obsolescence'),
  );

  assert.equal(PHYSICAL_PRICING_DIMENSIONS.length, 12);
  assert.ok(PHYSICAL_PRICING_DIMENSIONS.includes('prototype_cost'));
  assert.ok(PHYSICAL_PRICING_DIMENSIONS.includes('multi_year_economics'));
});

test('hard autonomy denies: no PO / manufacturing / supplier contract / shipment / export bypass / live control', () => {
  assert.equal(EO10_LOCKS.AUTO_PURCHASE_ORDER, false);
  assert.equal(EO10_LOCKS.AUTO_MANUFACTURING_COMMITMENT, false);
  assert.equal(EO10_LOCKS.AUTO_SUPPLIER_CONTRACT, false);
  assert.equal(EO10_LOCKS.AUTO_DEVICE_SHIPMENT, false);
  assert.equal(EO10_LOCKS.AUTO_DEVICE_DEPLOYMENT, false);
  assert.equal(EO10_LOCKS.AUTO_LIVE_HIGH_CONSEQUENCE_CONTROL, false);
  assert.equal(EO10_LOCKS.AUTO_EXPORT_CONTROL_BYPASS, false);
  assert.equal(EO10_LOCKS.AUTO_PROCUREMENT_RULE_BYPASS, false);

  const po = attemptAutonomousPurchaseOrder();
  assert.equal(po.state, 'DENIED');
  assert.equal(po.purchaseOrderIssued, false);

  const mfg = attemptManufacturingCommitment();
  assert.equal(mfg.state, 'DENIED');
  assert.equal(mfg.committed, false);

  const contract = attemptSupplierContract();
  assert.equal(contract.state, 'DENIED');
  assert.equal(contract.signed, false);

  const ship = attemptDeviceShipmentOrDeployment();
  assert.equal(ship.state, 'DENIED');
  assert.equal(ship.shipped, false);
  assert.equal(ship.deployed, false);

  const bypass = attemptExportControlOrProcurementBypass();
  assert.equal(bypass.state, 'DENIED');
  assert.equal(bypass.bypassed, false);

  for (const domain of HIGH_CONSEQUENCE_LIVE_CONTROL_DOMAINS) {
    const live = attemptLiveHighConsequenceControl(domain);
    assert.equal(live.state, 'DENIED');
    assert.equal(live.liveControlEnabled, false);
  }

  assert.ok(EO10_MAY.includes('register_physical_solution_records'));
  assert.ok(EO10_MUST_NOT.includes('autonomous_purchase_orders'));
  assert.ok(EO10_MUST_NOT.includes('live_control_vehicles_weapons_infrastructure'));
});

test('safety cert without evidence denied; BOM/supplier/mfg attempts that commit denied', () => {
  for (const label of [
    'safety_certification',
    'ul_ce_equivalent',
    'export_control_clearance',
    'procurement_rule_compliance',
    'production_readiness',
  ] as const) {
    const result = attemptClaimSafetyCertification(label);
    assert.equal(result.state, 'DENIED');
    assert.equal(result.executed, false);
    assert.match(result.reason, /WITHOUT_EVIDENCE/i);
  }

  const bomDenied = draftBomCandidate({
    bomId: 'bom-1',
    requirementId: 'req-1',
    lineItems: ['SoC', 'sensor'],
    attemptIssuePurchaseOrder: true,
  });
  assert.equal('denied' in bomDenied && bomDenied.denied, true);

  const graphDenied = modelSupplierGraph({
    graphId: 'sg-1',
    requirementId: 'req-1',
    tiers: [{ tier: 1, suppliers: ['candidate-a'] }],
    attemptSignSupplierContract: true,
  });
  assert.equal('denied' in graphDenied && graphDenied.denied, true);

  const mfgDenied = draftManufacturingPlan({
    planId: 'mfg-1',
    requirementId: 'req-1',
    method: 'CMT candidate',
    attemptCommit: true,
  });
  assert.equal('denied' in mfgDenied && mfgDenied.denied, true);
});

test('pricing: dimensions structure-only; fabricated cost/savings denied', () => {
  const ok = openPricingDimensionComparison({
    scenarioId: 'price-1',
    requirementId: 'req-1',
  });
  assert.equal('denied' in ok, false);
  if (!('denied' in ok)) {
    assert.equal(ok.figuresFabricated, false);
    assert.equal(ok.numericValues, null);
    assert.equal(ok.evidenceState, 'STRUCTURE_ONLY');
    assert.equal(ok.dimensions.length, 12);
  }

  const fabCost = openPricingDimensionComparison({
    scenarioId: 'price-bad',
    requirementId: 'req-1',
    fabricatedPrototypeCost: 12345,
  });
  assert.equal('denied' in fabCost && fabCost.denied, true);

  const fabSave = openPricingDimensionComparison({
    scenarioId: 'price-bad2',
    requirementId: 'req-1',
    fabricatedSavings: 999,
  });
  assert.equal('denied' in fabSave && fabSave.denied, true);

  const regDenied = registerPhysicalSolutionRecord({
    requirementId: 'req-fab',
    productFamily: 'sensors_telemetry_hardware',
    actor: architect,
    attemptFabricateCostFigures: true,
  });
  assert.equal('denied' in regDenied && regDenied.denied, true);

  const sc = surfaceSupplyChainIntelligence({
    surfaceId: 'sc-1',
    requirementId: 'req-1',
  });
  assert.equal(sc.figuresFabricated, false);
  assert.equal(sc.dimensions.length, 12);
});

test('contract-ready evidence gate: VERIFIED without evidence denied', () => {
  const denied = registerPhysicalSolutionRecord({
    requirementId: 'req-evidence-1',
    productFamily: 'edge_ai_appliances',
    actor: architect,
    attemptContractReadyRepresentationWithoutEvidence: true,
  });
  assert.equal('denied' in denied && denied.denied, true);
});

test('contract-ready evidence gate: VERIFIED when all required evidence present', () => {
  const evidence: PhysicalContractReadyEvidence = {
    verifiedBomEvidencePresent: true,
    supplierAvailabilityEvidencePresent: true,
    unitCostEstimateEvidencePresent: true,
    prototypeTestEvidencePresent: true,
    manufacturingFeasibilityEvidencePresent: true,
    qualityInspectionPlanEvidencePresent: true,
    secureFirmwareSoftwareUpdatePlanEvidencePresent: true,
    packagingTransportationPlanEvidencePresent: true,
    warrantySupportAssumptionsEvidencePresent: true,
    acceptanceTestProcedureEvidencePresent: true,
    rollbackRecallPlanEvidencePresent: true,
  };

  const verified = registerPhysicalSolutionRecord({
    requirementId: 'req-verified-1',
    productFamily: 'edge_ai_appliances',
    actor: architect,
    programId: 'prog-verified-1',
    agencyCustomer: 'Agency/X',
    requirementIds: ['req-verified-1', 'req-verified-2'],
    approvedSuppliers: ['sup-1'],
    contractReadyEvidence: evidence,
  });

  assert.equal('denied' in verified, false);
  if (!('denied' in verified)) {
    assert.equal(verified.evidenceState, 'VERIFIED');
    assert.equal(typeof verified.unitCost, 'string');
    assert.match(verified.unitCost ?? '', /UNIT_COST_ESTIMATE_EVIDENCED/i);
    assert.ok(verified.acceptanceCriteria.includes('verified_bom'));
  }
});

test('truth boundary: claiming origin/lead-times/supplier availability without evidence denied', () => {
  const originDenied = registerPhysicalSolutionRecord({
    requirementId: 'req-origin-1',
    productFamily: 'sensors_telemetry_hardware',
    actor: architect,
    countryRegionOfOrigin: 'US',
  });
  assert.equal('denied' in originDenied && originDenied.denied, true);

  const leadTimesDenied = registerPhysicalSolutionRecord({
    requirementId: 'req-lead-1',
    productFamily: 'ruggedized_compute_devices',
    actor: architect,
    leadTimes: ['12-18 weeks'],
  });
  assert.equal(
    'denied' in leadTimesDenied && leadTimesDenied.denied,
    true,
  );

  const supplierDenied = registerPhysicalSolutionRecord({
    requirementId: 'req-supp-1',
    productFamily: 'networking_communications_equipment',
    actor: architect,
    approvedSuppliers: ['supplier-a'],
  });
  assert.equal(
    'denied' in supplierDenied && supplierDenied.denied,
    true,
  );
});

test('agent team bounded; evidence to Home Base; no auto authority', () => {
  assert.equal(PHYSICAL_PRODUCT_AGENT_TEAM.length, 10);
  assert.equal(PHYSICAL_PRODUCT_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(PHYSICAL_PRODUCT_AGENT_BOUNDS.mayReturnEvidenceToHomeBase, true);
  assert.equal(PHYSICAL_PRODUCT_AGENT_BOUNDS.automaticPurchaseOrder, false);

  const roster = buildAgentTeamRoster();
  assert.equal(roster.length, 10);
  assert.ok(roster.every((r) => r.automaticAuthority === false));

  const autoAuth = attemptAgentAutoAuthority(architect);
  assert.equal(autoAuth.state, 'DENIED');

  const evidence = returnAgentEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: architect,
    summary: 'BOM candidate draft',
  });
  assert.equal('denied' in evidence, false);
  if (!('denied' in evidence)) {
    assert.equal(evidence.returnedToHomeBase, true);
    assert.equal(evidence.authorityGranted, false);
  }
});

test('quantum hardware claim ladder; PHYSICAL_QPU_VERIFIED denied without authorized evidence', () => {
  assert.deepEqual(
    [...QUANTUM_CLAIM_STATES],
    ['THEORETICAL', 'SIMULATED', 'QUANTUM_INSPIRED', 'PHYSICAL_QPU_VERIFIED'],
  );

  const theo = labelQuantumHardwareClaim({
    claimId: 'q-1',
    state: 'THEORETICAL',
  });
  assert.equal('denied' in theo, false);
  if (!('denied' in theo)) {
    assert.equal(theo.aiAccelerationPathAllowed, true);
  }

  const denied = labelQuantumHardwareClaim({
    claimId: 'q-2',
    state: 'PHYSICAL_QPU_VERIFIED',
    authorizedPhysicalQpuEvidencePresent: false,
  });
  assert.equal('denied' in denied && denied.denied, true);
});

test('workflow surfaces advisory; human approval required; guardian isolation', () => {
  const mapped = mapRequirementToProductFamilies({
    mappingId: 'map-1',
    requirementId: 'req-1',
    requirementText: 'rugged edge AI appliance with sensors',
    families: ['edge_ai_appliances', 'sensors_telemetry_hardware'],
  });
  assert.equal('denied' in mapped, false);
  if (!('denied' in mapped)) {
    assert.equal(mapped.advisoryOnly, true);
    assert.equal(mapped.eligibilityImplied, false);
  }

  const arch = draftProductArchitecture({
    planId: 'arch-1',
    requirementId: 'req-1',
    families: ['ruggedized_compute_devices'],
  });
  assert.equal(arch.productionAuthorized, false);
  assert.equal(arch.manufacturingAuthorized, false);

  const bom = draftBomCandidate({
    bomId: 'bom-ok',
    requirementId: 'req-1',
    lineItems: ['MCU', 'enclosure'],
  });
  assert.equal('denied' in bom, false);
  if (!('denied' in bom)) {
    assert.equal(bom.purchaseOrderIssued, false);
  }

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
    action: 'issue_po',
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

test('soft-wire EO9/EO8/EO7/EN/EM10/EM1 probes; EO9+EN+EM10 present on EO9 base tip', () => {
  const snap = eo10SoftWireSnapshot(repoRoot);
  assert.equal(snap.eo9DigitalProductContractPack.present, true);
  assert.equal(snap.eo9Report.present, true);
  assert.equal(snap.en158DealOs.present, true);
  assert.equal(snap.en158DealRuntime.present, true);
  assert.equal(snap.en158Report.present, true);
  assert.equal(snap.em10UserAccessEconomy.present, true);
  assert.equal(snap.em10Report.present, true);
  assert.equal(typeof snap.em1HomeBaseContract.present, 'boolean');
  assert.equal(typeof snap.eo8SupplyChainResiliencePack.present, 'boolean');
  assert.equal(typeof snap.eo7Pack.present, 'boolean');
});

test('cycle covers pack surfaces + bootstrap; register solution record', () => {
  for (const required of [
    'product_families_encoded',
    'solution_record_fields_encoded',
    'contract_ready_acceptance_criteria_encoded',
    'physical_product_lifecycle_encoded',
    'supply_chain_intelligence_encoded',
    'pricing_dimensions_encoded',
    'no_fabricated_cost_or_savings',
    'agent_team_bounded',
    'no_autonomous_purchase_orders',
    'no_manufacturing_commitments',
    'no_supplier_contracts',
    'no_device_shipment_or_deployment',
    'no_safety_cert_without_evidence',
    'no_export_control_or_procurement_bypass',
    'no_live_high_consequence_control',
    'quantum_hardware_claim_ladder_enforced',
    'l4_autonomy_false',
    'eo9_soft_wire',
    'eo8_soft_wire',
    'eo7_soft_wire',
    'en158_soft_wire',
    'em10_soft_wire',
    'em1_soft_wire',
  ] as const) {
    assert.ok(PHYSICAL_PRODUCT_CONTRACT_PACK_CYCLE.includes(required), required);
  }

  const boot = bootstrapPhysicalProductContractPack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.families.length, 10);
  assert.equal(boot.lifecycle.length, 12);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const solution = registerPhysicalSolutionRecord({
    requirementId: 'req-eo10-reg',
    productFamily: 'hybrid_hardware_xiv_software_bundles',
    actor: architect,
    BOM: ['compute module', 'XIV runtime image candidate'],
  });
  assert.equal('denied' in solution, false);
  if (!('denied' in solution)) {
    assert.equal(solution.unitCost, null);
    assert.equal(solution.volumePricing, null);
    assert.equal(solution.pricingFiguresFabricated, false);
    assert.equal(solution.purchaseOrderIssued, false);
    assert.equal(solution.manufacturingCommitted, false);
    assert.equal(solution.safetyCertClaimed, false);
    assert.equal(solution.liveHighConsequenceControlEnabled, false);
  }

  const cycle = runPhysicalProductContractPackCycle({
    actor: architect,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 20);
  assert.equal('denied' in cycle.solution, false);
  assert.equal(cycle.softWire.eo9DigitalProductContractPack.present, true);
});
