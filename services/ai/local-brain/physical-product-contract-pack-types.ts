/**
 * 62L-EO10 — Physical Product Contract Pack (park-and-implement).
 *
 * Contract-ready physical-product framework so government and enterprise
 * opportunities involving hardware, sensors, edge devices, compute appliances,
 * electronics, and related logistics can be planned, priced, simulated, and
 * governed end-to-end — without fabricating cost/savings or claiming quantum
 * hardware without authorized PHYSICAL_QPU evidence.
 *
 * SoT: GitHub EO family / #159 lineage (authoritative). GitLab mirror: not
 * resolved in this environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Soft-wire when PRESENT: EO9, EO8, EO7, EN (#158), EM10, EM1.
 * Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * No autonomous purchase orders, manufacturing commitments, supplier contracts,
 * device shipment/deployment, safety certification claims without evidence,
 * export-control / procurement-rule bypass, or live control of vehicles,
 * weapons, infrastructure, or other high-consequence systems.
 * Quantum hardware claims retain THEORETICAL | SIMULATED | QUANTUM_INSPIRED |
 * PHYSICAL_QPU_VERIFIED (authorized physical-QPU evidence required).
 * CFO pricing compares dimensions only — no fabricated cost or savings figures.
 * Agents return evidence to Home Base; no automatic authority.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EO11 — Virtual Data Warehouse Mission Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 159 as const;
export const GITHUB_SOT_LABEL = '62L-EO10' as const;
export const GITHUB_SOT_TITLE =
  '62L-EO10 Physical Product Contract Pack — contract-ready physical-product framework for hardware, sensors, edge devices, compute appliances, electronics, and logistics lifecycle planning/pricing/simulation/governance' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO10_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO11 — Virtual Data Warehouse Mission Pack — isolated, mission-specific data warehouses with lineage, access controls, retention, compute budgets, and agent-ready analytical layers.' as const;

/**
 * Core product categories (encoded).
 */
export const PHYSICAL_PRODUCT_FAMILIES = [
  'edge_ai_appliances',
  'ruggedized_compute_devices',
  'sensors_telemetry_hardware',
  'networking_communications_equipment',
  'warehouse_industrial_devices',
  'semiconductor_enabled_systems',
  'data_collection_gateways',
  'maintenance_diagnostic_devices',
  'custom_electronics',
  'hybrid_hardware_xiv_software_bundles',
] as const;

export type PhysicalProductFamily = (typeof PHYSICAL_PRODUCT_FAMILIES)[number];

export const PHYSICAL_PRODUCT_FAMILY_LABELS: Readonly<
  Record<PhysicalProductFamily, string>
> = Object.freeze({
  edge_ai_appliances: 'Edge AI Appliances',
  ruggedized_compute_devices: 'Ruggedized Compute Devices',
  sensors_telemetry_hardware: 'Sensors and Telemetry Hardware',
  networking_communications_equipment: 'Networking / Communications Equipment',
  warehouse_industrial_devices: 'Warehouse / Industrial Devices',
  semiconductor_enabled_systems: 'Semiconductor-Enabled Systems',
  data_collection_gateways: 'Data Collection Gateways',
  maintenance_diagnostic_devices: 'Maintenance / Diagnostic Devices',
  custom_electronics: 'Custom Electronics',
  hybrid_hardware_xiv_software_bundles: 'Hybrid Hardware + XIV Software Bundles',
});

/**
 * Solution record fields (encode).
 */
export const PHYSICAL_SOLUTION_RECORD_FIELDS = [
  'requirementId',
  'productFamily',
  'BOM',
  'supplierGraph',
  'manufacturingMethod',
  'qualityRequirements',
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
] as const;

export type PhysicalSolutionRecordField =
  (typeof PHYSICAL_SOLUTION_RECORD_FIELDS)[number];

/**
 * Core lifecycle:
 * Contract requirement → product architecture → BOM → supplier sourcing →
 * prototype → verification testing → manufacturing planning → quality inspection →
 * logistics/distribution → field support → maintenance/spares → end-of-life management
 */
export const PHYSICAL_PRODUCT_CONTRACT_LIFECYCLE = [
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
] as const;

export type PhysicalProductLifecycleHop =
  (typeof PHYSICAL_PRODUCT_CONTRACT_LIFECYCLE)[number];

/**
 * Supply-chain intelligence dimensions (model; no fabricated figures).
 */
export const SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS = [
  'multi_tier_suppliers',
  'lead_times',
  'alternates',
  'chip_shortages',
  'capacity',
  'minimum_order_quantities',
  'quality_risk',
  'country_region_exposure',
  'transportation_dependencies',
  'inventory_buffers',
  'repairability',
  'lifecycle_obsolescence',
] as const;

export type SupplyChainIntelligenceDimension =
  (typeof SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS)[number];

/**
 * CFO / accountant pricing comparison dimensions — structure only;
 * no fabricated cost or savings figures.
 */
export const PHYSICAL_PRICING_DIMENSIONS = [
  'prototype_cost',
  'unit_manufacturing_cost',
  'integration_cost',
  'support_cost',
  'warranty_reserve',
  'spares',
  'transportation',
  'engineering',
  'compliance_testing',
  'margin',
  'volume_discounts',
  'multi_year_economics',
] as const;

export type PhysicalPricingDimension =
  (typeof PHYSICAL_PRICING_DIMENSIONS)[number];

/**
 * Agent team — evidence to Home Base; no auto authority.
 */
export const PHYSICAL_PRODUCT_AGENT_TEAM = [
  'hardware_architect',
  'electrical_systems_research',
  'bom',
  'supplier',
  'manufacturing',
  'quality',
  'logistics',
  'maintenance',
  'cfo_cost',
  'proposal',
] as const;

export type PhysicalProductAgentRole =
  (typeof PHYSICAL_PRODUCT_AGENT_TEAM)[number];

export const PHYSICAL_PRODUCT_AGENT_BOUNDS = Object.freeze({
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  automaticPurchaseOrder: false as const,
  automaticManufacturingCommitment: false as const,
  automaticSupplierContract: false as const,
  automaticDeviceShipment: false as const,
  automaticDeployment: false as const,
  automaticLiveHighConsequenceControl: false as const,
  mayRecommendOnly: true as const,
});

/** Quantum claim ladder — cannot fabricate PHYSICAL_QPU_VERIFIED. */
export const QUANTUM_CLAIM_STATES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumClaimState = (typeof QUANTUM_CLAIM_STATES)[number];

/** Safety / certification claim labels that require evidence. */
export const SAFETY_CERT_CLAIM_LABELS = [
  'safety_certification',
  'ul_ce_equivalent',
  'export_control_clearance',
  'procurement_rule_compliance',
  'production_readiness',
] as const;

export type SafetyCertClaimLabel = (typeof SAFETY_CERT_CLAIM_LABELS)[number];

/** High-consequence live-control domains — always denied from this queue. */
export const HIGH_CONSEQUENCE_LIVE_CONTROL_DOMAINS = [
  'vehicles',
  'weapons',
  'infrastructure',
  'other_high_consequence_systems',
] as const;

export type HighConsequenceLiveControlDomain =
  (typeof HIGH_CONSEQUENCE_LIVE_CONTROL_DOMAINS)[number];

export const PHYSICAL_PRODUCT_CONTRACT_PACK_CYCLE = [
  'honesty_locks',
  'physical_product_pack_bootstrap',
  // A — Product families + solution record fields
  'product_families_encoded',
  'solution_record_fields_encoded',
  // B — Lifecycle
  'physical_product_lifecycle_encoded',
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
  // C — Supply-chain intelligence + pricing dimensions
  'supply_chain_intelligence_encoded',
  'pricing_dimensions_encoded',
  'no_fabricated_cost_or_savings',
  // D — Agent team bounds + Home Base evidence
  'agent_team_bounded',
  'agent_evidence_to_home_base',
  'no_agent_auto_authority',
  // E — Hard autonomy / safety / quantum denies
  'no_autonomous_purchase_orders',
  'no_manufacturing_commitments',
  'no_supplier_contracts',
  'no_device_shipment_or_deployment',
  'no_safety_cert_without_evidence',
  'no_export_control_or_procurement_bypass',
  'no_live_high_consequence_control',
  'quantum_hardware_claim_ladder_enforced',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // F — Soft-wires
  'eo9_soft_wire',
  'eo8_soft_wire',
  'eo7_soft_wire',
  'en158_soft_wire',
  'em10_soft_wire',
  'em1_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eo10Hop = (typeof PHYSICAL_PRODUCT_CONTRACT_PACK_CYCLE)[number];

export type Eo10EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'THEORETICAL'
  | 'SIMULATED'
  | 'QUANTUM_INSPIRED'
  | 'PHYSICAL_QPU_VERIFIED'
  | 'STRUCTURE_ONLY';

export type Eo10HopRecord = {
  hop: Eo10Hop;
  state: Eo10EvidenceState;
  summary: string;
  at: string;
};

export type Eo10ActorKind =
  | PhysicalProductAgentRole
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Eo10Actor = {
  kind: Eo10ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EO10_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_PHYSICAL_PRODUCT_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Hard autonomy denies (physical)
  AUTO_PURCHASE_ORDER: false as const,
  AUTO_MANUFACTURING_COMMITMENT: false as const,
  AUTO_SUPPLIER_CONTRACT: false as const,
  AUTO_DEVICE_SHIPMENT: false as const,
  AUTO_DEVICE_DEPLOYMENT: false as const,
  AUTO_LIVE_HIGH_CONSEQUENCE_CONTROL: false as const,
  AUTO_EXPORT_CONTROL_BYPASS: false as const,
  AUTO_PROCUREMENT_RULE_BYPASS: false as const,

  // Safety / cert claims — deny without evidence
  CLAIM_SAFETY_CERT_WITHOUT_EVIDENCE: false as const,
  CLAIM_UL_CE_WITHOUT_EVIDENCE: false as const,
  CLAIM_EXPORT_CLEARANCE_WITHOUT_EVIDENCE: false as const,
  CLAIM_PROCUREMENT_COMPLIANCE_WITHOUT_EVIDENCE: false as const,
  CLAIM_PRODUCTION_READINESS_WITHOUT_EVIDENCE: false as const,

  // Agent authority bounds
  AGENT_AUTO_AUTHORITY: false as const,
  AGENT_AUTO_PURCHASE_ORDER: false as const,
  AGENT_AUTO_MANUFACTURING_COMMITMENT: false as const,
  AGENT_AUTO_SUPPLIER_CONTRACT: false as const,
  AGENT_AUTO_DEVICE_SHIPMENT: false as const,
  AGENT_AUTO_LIVE_HIGH_CONSEQUENCE_CONTROL: false as const,

  // Pricing honesty
  FABRICATE_COST_FIGURES: false as const,
  FABRICATE_SAVINGS_FIGURES: false as const,
  PRICING_STRUCTURE_ONLY_WITHOUT_EVIDENCE: true as const,

  // Quantum hardware
  AUTO_UPGRADE_QUANTUM_CLAIM_TO_PHYSICAL_QPU_VERIFIED: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  SIMULATED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  THEORETICAL_EQ_OPERATIONAL: false as const,
  CLAIM_QUANTUM_HARDWARE_WITHOUT_AUTHORIZED_PHYSICAL_QPU: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_PURCHASE: false as const,
  RECOMMEND_EQ_MANUFACTURE: false as const,
  RECOMMEND_EQ_SHIP: false as const,
  RECOMMEND_EQ_CONTRACT: false as const,
  RECOMMEND_EQ_DEPLOY: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Human gates
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  HUMAN_AUTHORIZED_COMMITMENT_REQUIRED: true as const,
});

export const EO10_MAY = Object.freeze([
  'register_physical_solution_records',
  'map_requirement_to_product_families',
  'draft_product_architecture',
  'draft_bom_candidates',
  'model_supplier_graph',
  'surface_supply_chain_intelligence',
  'draft_manufacturing_plans',
  'encode_quality_and_testing_requirements',
  'open_pricing_dimension_comparisons',
  'prepare_proposal_evidence_packages',
  'label_quantum_hardware_claim_states',
  'return_agent_evidence_to_home_base',
] as const);

export const EO10_MUST_NOT = Object.freeze([
  'autonomous_purchase_orders',
  'manufacturing_commitments',
  'supplier_contracts',
  'device_shipment_or_deployment',
  'claim_safety_certification_without_evidence',
  'export_control_or_procurement_rule_bypass',
  'live_control_vehicles_weapons_infrastructure',
  'fabricate_cost_or_savings_figures',
  'claim_quantum_hardware_without_authorized_physical_qpu',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo10SoftWireSnapshot = {
  eo9DigitalProductContractPack: SoftWirePresence;
  eo9Report: SoftWirePresence;
  eo8SupplyChainResiliencePack: SoftWirePresence;
  eo8Report: SoftWirePresence;
  eo7Pack: SoftWirePresence;
  eo7Report: SoftWirePresence;
  en158DealOs: SoftWirePresence;
  en158DealRuntime: SoftWirePresence;
  en158Report: SoftWirePresence;
  em10UserAccessEconomy: SoftWirePresence;
  em10Report: SoftWirePresence;
  em1HomeBaseContract: SoftWirePresence;
};

export function assertEo10LocksIntact(): boolean {
  return (
    EO10_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO10_LOCKS.AUTO_PURCHASE_ORDER === false &&
    EO10_LOCKS.AUTO_MANUFACTURING_COMMITMENT === false &&
    EO10_LOCKS.AUTO_SUPPLIER_CONTRACT === false &&
    EO10_LOCKS.AUTO_DEVICE_SHIPMENT === false &&
    EO10_LOCKS.AUTO_DEVICE_DEPLOYMENT === false &&
    EO10_LOCKS.AUTO_LIVE_HIGH_CONSEQUENCE_CONTROL === false &&
    EO10_LOCKS.AUTO_EXPORT_CONTROL_BYPASS === false &&
    EO10_LOCKS.AUTO_PROCUREMENT_RULE_BYPASS === false &&
    EO10_LOCKS.CLAIM_SAFETY_CERT_WITHOUT_EVIDENCE === false &&
    EO10_LOCKS.CLAIM_UL_CE_WITHOUT_EVIDENCE === false &&
    EO10_LOCKS.CLAIM_EXPORT_CLEARANCE_WITHOUT_EVIDENCE === false &&
    EO10_LOCKS.CLAIM_PROCUREMENT_COMPLIANCE_WITHOUT_EVIDENCE === false &&
    EO10_LOCKS.CLAIM_PRODUCTION_READINESS_WITHOUT_EVIDENCE === false &&
    EO10_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EO10_LOCKS.AGENT_AUTO_PURCHASE_ORDER === false &&
    EO10_LOCKS.AGENT_AUTO_MANUFACTURING_COMMITMENT === false &&
    EO10_LOCKS.AGENT_AUTO_SUPPLIER_CONTRACT === false &&
    EO10_LOCKS.AGENT_AUTO_DEVICE_SHIPMENT === false &&
    EO10_LOCKS.AGENT_AUTO_LIVE_HIGH_CONSEQUENCE_CONTROL === false &&
    EO10_LOCKS.FABRICATE_COST_FIGURES === false &&
    EO10_LOCKS.FABRICATE_SAVINGS_FIGURES === false &&
    EO10_LOCKS.PRICING_STRUCTURE_ONLY_WITHOUT_EVIDENCE === true &&
    EO10_LOCKS.AUTO_UPGRADE_QUANTUM_CLAIM_TO_PHYSICAL_QPU_VERIFIED === false &&
    EO10_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO10_LOCKS.SIMULATED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO10_LOCKS.THEORETICAL_EQ_OPERATIONAL === false &&
    EO10_LOCKS.CLAIM_QUANTUM_HARDWARE_WITHOUT_AUTHORIZED_PHYSICAL_QPU ===
      false &&
    EO10_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO10_LOCKS.RECOMMEND_EQ_PURCHASE === false &&
    EO10_LOCKS.RECOMMEND_EQ_MANUFACTURE === false &&
    EO10_LOCKS.RECOMMEND_EQ_SHIP === false &&
    EO10_LOCKS.RECOMMEND_EQ_CONTRACT === false &&
    EO10_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EO10_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EO10_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EO10_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO10_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO10_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO10_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EO10_LOCKS.HUMAN_AUTHORIZED_COMMITMENT_REQUIRED === true &&
    EO10_LOCKS.TIP_LAND === false &&
    EO10_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO10_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO10_LOCKS.FULL_PRODUCTION_PHYSICAL_PRODUCT_PACK_SHIPPED === false &&
    EO10_LOCKS.MANAGE_PULL_REQUEST === false &&
    PHYSICAL_PRODUCT_AGENT_BOUNDS.automaticAuthority === false &&
    PHYSICAL_PRODUCT_AGENT_BOUNDS.automaticPurchaseOrder === false &&
    PHYSICAL_PRODUCT_AGENT_BOUNDS.automaticManufacturingCommitment === false &&
    PHYSICAL_PRODUCT_AGENT_BOUNDS.automaticSupplierContract === false &&
    PHYSICAL_PRODUCT_AGENT_BOUNDS.automaticDeviceShipment === false &&
    PHYSICAL_PRODUCT_AGENT_BOUNDS.automaticDeployment === false &&
    PHYSICAL_PRODUCT_AGENT_BOUNDS.automaticLiveHighConsequenceControl === false
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

/**
 * Soft-wire EO9 / EO8 / EO7 / EN / EM10 / EM1 when present.
 * Presence alone ≠ VERIFIED.
 */
export function eo10SoftWireSnapshot(repoRoot?: string): Eo10SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo9DigitalProductContractPack: softWireFile(
      './digital-product-contract-pack-types.ts',
      'EO9 Digital Product Contract Pack PRESENT (soft-wire).',
      'EO9 Digital Product Contract Pack absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO9_DIGITAL_PRODUCT_CONTRACT_PACK_REPORT.md',
      'EO9 report PRESENT.',
      'EO9 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo8SupplyChainResiliencePack: softWireFile(
      './supply-chain-resilience-pack-types.ts',
      'EO8 Supply Chain Resilience Pack PRESENT (soft-wire).',
      'EO8 Supply Chain Resilience Pack absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo8Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO8_SUPPLY_CHAIN_RESILIENCE_PACK_REPORT.md',
      'EO8 report PRESENT.',
      'EO8 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo7Pack: softWireFile(
      './eo7-pack-types.ts',
      'EO7 pack PRESENT (soft-wire).',
      'EO7 pack absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO7_REPORT.md',
      'EO7 report PRESENT.',
      'EO7 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    en158DealOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN (#158) Deal & Contract Intelligence OS PRESENT (soft-wire).',
      'EN (#158) Deal OS absent — soft-wire WAITING_DATA.',
    ),
    en158DealRuntime: softWireFile(
      './deal-contract-intelligence-os-runtime.ts',
      'EN (#158) deal/gov runtime PRESENT (human-authorized submission only).',
      'EN (#158) deal/gov runtime absent — soft-wire WAITING_DATA.',
    ),
    en158Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EN_DEAL_CONTRACT_INTELLIGENCE_OS_REPORT.md',
      'EN (#158) report PRESENT.',
      'EN (#158) report absent.',
    ),
    em10UserAccessEconomy: softWireFile(
      './user-access-economy.ts',
      'EM10 User Access Economy PRESENT (soft-wire).',
      'EM10 User Access Economy absent.',
    ),
    em10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EM10_USER_ACCESS_ECONOMY_REPORT.md',
      'EM10 report PRESENT.',
      'EM10 report absent.',
    ),
    em1HomeBaseContract: softWireFile(
      './agent-home-base-contract.ts',
      'EM1 agent home base contract PRESENT (agents return evidence).',
      'EM1 agent home base contract absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eo10Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isPhysicalProductAgent(actor: Eo10Actor): boolean {
  return (PHYSICAL_PRODUCT_AGENT_TEAM as readonly string[]).includes(
    actor.kind,
  );
}
