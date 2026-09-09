/**
 * 62L-EO8 — Supply Chain Resilience Pack (park-and-implement child).
 *
 * Resilience layer that models multi-tier suppliers, shortages, lead-time risk,
 * capacity constraints, alternate sourcing, geopolitical/event scenarios, and
 * recovery options so government and enterprise users can prepare before
 * disruptions become failures.
 *
 * Core model:
 * Supplier → Tier → Material/Component → Facility → Inventory → Transport Lane
 * → Customer/Mission → Risk → Recovery Option
 *
 * Soft-wire: EO6 classical baselines, EO7 logistics pack, EO5 quantum honesty
 * when advanced methods used; #159 EO umbrella logistics advisory; #157 Home Base
 * evidence. Presence alone ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 * Historical disruptions inform scenarios ≠ prove what will happen next.
 * Sim ≠ fact; recommend ≠ act.
 *
 * No autonomous purchasing, supplier switching, contract changes, physical
 * dispatch, or external communications. Consequential recovery actions
 * human-authorized. Authorized data only; no fabricated mission/disruption data.
 * Guardian/RLS/Universe isolation intact. tip-land=NO. No PR from this phase.
 *
 * Next (report only): EO9 — Digital Product Contract Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_LABEL = '62L-EO8' as const;
export const GITHUB_SOT_TITLE =
  '62L-EO8 Supply Chain Resilience Pack — multi-tier graph, scenario library, truth labels, recovery recommendations (human-authorized)' as const;

/** Soft-wired predecessor issue refs (presence ≠ VERIFIED). */
export const SOFT_WIRE_EO_ISSUE = 159 as const;
export const SOFT_WIRE_EN_ISSUE = 158 as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO8_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO9 — Digital Product Contract Pack — government/enterprise contracts for AI software, search, analytics, simulations, agentic workflows, APIs, data platforms, secure knowledge systems.' as const;

/**
 * Truth boundary labels (hard).
 * Historical disruptions inform scenarios ≠ prove what will happen next.
 */
export const TRUTH_BOUNDARY_LABELS = [
  'OBSERVED_EVIDENCE',
  'MODEL_ESTIMATE',
  'SCENARIO_ASSUMPTION',
  'UNKNOWN',
] as const;

export type TruthBoundaryLabel = (typeof TRUTH_BOUNDARY_LABELS)[number];

/** Core resilience graph node kinds. */
export const RESILIENCE_GRAPH_NODE_KINDS = [
  'supplier',
  'tier',
  'material_component',
  'facility',
  'inventory',
  'transport_lane',
  'customer_mission',
  'risk',
  'recovery_option',
] as const;

export type ResilienceGraphNodeKind =
  (typeof RESILIENCE_GRAPH_NODE_KINDS)[number];

/**
 * Core workflow (encoded):
 * Risk signal → affected graph → exposure calculation → historical analogues →
 * classical scenario model → alternate sourcing/capacity options →
 * cost/service tradeoff → recovery recommendation → human approval
 */
export const RESILIENCE_WORKFLOW = [
  'risk_signal',
  'affected_graph',
  'exposure_calculation',
  'historical_analogues',
  'classical_scenario_model',
  'alternate_sourcing_capacity_options',
  'cost_service_tradeoff',
  'recovery_recommendation',
  'human_approval',
] as const;

export type ResilienceWorkflowHop = (typeof RESILIENCE_WORKFLOW)[number];

/**
 * Scenario library (sandbox) — classical scenario models only unless advanced
 * methods carry EO5 honesty labels.
 */
export const SCENARIO_LIBRARY = [
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
] as const;

export type ScenarioLibraryId = (typeof SCENARIO_LIBRARY)[number];

/** Resilience record fields (encode). */
export const RESILIENCE_RECORD_FIELDS = [
  'supplierAndTier',
  'materialComponentBomRelationship',
  'geographicExposure',
  'leadTimeAndVariability',
  'capacity',
  'inventoryBuffers',
  'alternateSources',
  'transportationDependencies',
  'singleSourceRisk',
  'qualityHistory',
  'disruptionHistory',
  'financialOperationalExposureAuthorized',
  'criticality',
  'recoveryTime',
  'evidenceSourceDate',
  'confidence',
  'truthLabel',
] as const;

export type ResilienceRecordField = (typeof RESILIENCE_RECORD_FIELDS)[number];

/**
 * Bounded agent team — evidence to Home Base; no auto authority.
 */
export const RESILIENCE_AGENT_TEAM = [
  'supplier_risk',
  'multi_tier_mapping',
  'inventory_resilience',
  'transportation_risk',
  'geopolitical_event_research',
  'quant_or',
  'historical_disruption',
  'cfo_cost',
  'recovery_simulation',
] as const;

export type ResilienceAgentRole = (typeof RESILIENCE_AGENT_TEAM)[number];

/** Scenario / recovery recommendation output fields. */
export const RESILIENCE_OUTPUT_FIELDS = [
  'impact',
  'affectedNodes',
  'timeToImpact',
  'estimatedServiceLoss',
  'costExposure',
  'recoveryOptions',
  'timeToRecover',
  'confidence',
  'evidenceRefs',
  'truthLabel',
] as const;

export type ResilienceOutputField = (typeof RESILIENCE_OUTPUT_FIELDS)[number];

export const SUPPLY_CHAIN_RESILIENCE_PACK_CYCLE = [
  'honesty_locks',
  'resilience_pack_bootstrap',
  // A — Graph + record fields
  'resilience_graph_register',
  'resilience_record_fields_encoded',
  'truth_boundary_labels_hard',
  // B — Scenario library + workflow
  'scenario_library_sandbox',
  'resilience_workflow_hops',
  'historical_informs_neq_proves_next',
  // C — Agent team (bounded)
  'agent_team_bounded',
  'evidence_to_home_base',
  'no_auto_authority',
  // D — Soft-wire EO6 / EO7 / EO5 / #159 / #157
  'eo6_classical_baseline_soft_wire',
  'eo7_logistics_pack_soft_wire',
  'eo5_quantum_honesty_soft_wire',
  'eo159_logistics_advisory_soft_wire',
  'home_base_evidence_soft_wire',
  // E — Hard autonomy / fabrication denies
  'no_autonomous_purchasing',
  'no_autonomous_supplier_switching',
  'no_autonomous_contract_changes',
  'no_autonomous_physical_dispatch',
  'no_external_communications',
  'no_fabricate_mission_disruption_data',
  'authorized_data_only',
  'sim_neq_fact',
  'recommend_neq_act',
  'consequential_recovery_human_authorized',
  'guardian_rls_tenant_universe_isolation',
  'l4_autonomy_false',
  'evidence',
] as const;

export type Eo8Hop = (typeof SUPPLY_CHAIN_RESILIENCE_PACK_CYCLE)[number];

export type Eo8EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'ADVISORY_ONLY'
  | 'SANDBOX'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_VERIFIED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'REGISTERED'
  | 'OBSERVED_EVIDENCE'
  | 'MODEL_ESTIMATE'
  | 'SCENARIO_ASSUMPTION'
  | 'UNKNOWN';

export type Eo8HopRecord = {
  hop: Eo8Hop;
  state: Eo8EvidenceState;
  summary: string;
  at: string;
};

export type Eo8ActorKind =
  | 'supplier_risk'
  | 'multi_tier_mapping'
  | 'inventory_resilience'
  | 'transportation_risk'
  | 'geopolitical_event_research'
  | 'quant_or'
  | 'historical_disruption'
  | 'cfo_cost'
  | 'recovery_simulation'
  | 'guardian'
  | 'human_approver'
  | 'founder';

export type Eo8Actor = {
  kind: Eo8ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EO8_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_RESILIENCE_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Hard safety — no auto consequential actions
  AUTONOMOUS_PURCHASING: false as const,
  AUTONOMOUS_SUPPLIER_SWITCHING: false as const,
  AUTONOMOUS_CONTRACT_CHANGES: false as const,
  AUTONOMOUS_PHYSICAL_DISPATCH: false as const,
  AUTONOMOUS_EXTERNAL_COMMUNICATIONS: false as const,
  AUTO_FREIGHT_DISPATCH: false as const,
  AUTO_PURCHASE_ORDER: false as const,
  AUTO_PRODUCTION_CHANGE: false as const,

  // Fabrication / authorized data
  FABRICATE_MISSION_DATA: false as const,
  FABRICATE_DISRUPTION_DATA: false as const,
  AUTHORIZED_DATA_ONLY: true as const,

  // Honesty
  HISTORICAL_DISRUPTION_EQ_PROOF_OF_NEXT: false as const,
  SIM_EQ_FACT: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_PURCHASE: false as const,
  RECOMMEND_EQ_SWITCH_SUPPLIER: false as const,
  RECOMMEND_EQ_CHANGE_CONTRACT: false as const,
  RECOMMEND_EQ_DISPATCH: false as const,
  RECOMMEND_EQ_EXTERNAL_COMM: false as const,

  // Agent bounds
  AGENTS_MAY_SELF_EXPAND_AUTHORITY: false as const,
  AGENTS_MAY_AUTO_EXECUTE_RECOVERY: false as const,

  // Isolation unchanged
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Human gates
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_RECOVERY: true as const,
});

export const EO8_MAY = Object.freeze([
  'register_resilience_graph_nodes',
  'encode_resilience_record_fields',
  'label_truth_boundaries',
  'run_sandbox_scenario_library',
  'trace_affected_graph',
  'calculate_exposure_advisory',
  'recall_historical_analogues_informational',
  'run_classical_scenario_models',
  'propose_alternate_sourcing_capacity_options',
  'model_cost_service_tradeoffs',
  'recommend_recovery_options',
  'attach_evidence_refs_to_home_base',
  'require_human_approval_for_consequential_recovery',
] as const);

export const EO8_MUST_NOT = Object.freeze([
  'autonomous_purchasing',
  'autonomous_supplier_switching',
  'autonomous_contract_changes',
  'autonomous_physical_dispatch',
  'autonomous_external_communications',
  'fabricate_mission_or_disruption_data',
  'treat_historical_as_proof_of_next',
  'treat_sim_as_fact',
  'treat_recommend_as_act',
  'self_expand_agent_authority',
  'auto_execute_recovery_without_human',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo8SoftWireSnapshot = {
  eo6ClassicalBaseline: SoftWirePresence;
  eo7LogisticsPack: SoftWirePresence;
  eo5QuantumHonesty: SoftWirePresence;
  eo159MissionOsTypes: SoftWirePresence;
  eo159MissionOsRuntime: SoftWirePresence;
  eo159Report: SoftWirePresence;
  homeBaseRuntime: SoftWirePresence;
  homeBaseReport: SoftWirePresence;
  en158DealOs: SoftWirePresence;
};

export function assertEo8LocksIntact(): boolean {
  return (
    EO8_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO8_LOCKS.AUTONOMOUS_PURCHASING === false &&
    EO8_LOCKS.AUTONOMOUS_SUPPLIER_SWITCHING === false &&
    EO8_LOCKS.AUTONOMOUS_CONTRACT_CHANGES === false &&
    EO8_LOCKS.AUTONOMOUS_PHYSICAL_DISPATCH === false &&
    EO8_LOCKS.AUTONOMOUS_EXTERNAL_COMMUNICATIONS === false &&
    EO8_LOCKS.AUTO_FREIGHT_DISPATCH === false &&
    EO8_LOCKS.AUTO_PURCHASE_ORDER === false &&
    EO8_LOCKS.AUTO_PRODUCTION_CHANGE === false &&
    EO8_LOCKS.FABRICATE_MISSION_DATA === false &&
    EO8_LOCKS.FABRICATE_DISRUPTION_DATA === false &&
    EO8_LOCKS.AUTHORIZED_DATA_ONLY === true &&
    EO8_LOCKS.HISTORICAL_DISRUPTION_EQ_PROOF_OF_NEXT === false &&
    EO8_LOCKS.SIM_EQ_FACT === false &&
    EO8_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO8_LOCKS.RECOMMEND_EQ_PURCHASE === false &&
    EO8_LOCKS.RECOMMEND_EQ_SWITCH_SUPPLIER === false &&
    EO8_LOCKS.RECOMMEND_EQ_CHANGE_CONTRACT === false &&
    EO8_LOCKS.RECOMMEND_EQ_DISPATCH === false &&
    EO8_LOCKS.RECOMMEND_EQ_EXTERNAL_COMM === false &&
    EO8_LOCKS.AGENTS_MAY_SELF_EXPAND_AUTHORITY === false &&
    EO8_LOCKS.AGENTS_MAY_AUTO_EXECUTE_RECOVERY === false &&
    EO8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EO8_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO8_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO8_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO8_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_RECOVERY === true &&
    EO8_LOCKS.TIP_LAND === false &&
    EO8_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO8_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO8_LOCKS.FULL_PRODUCTION_RESILIENCE_PACK_SHIPPED === false &&
    EO8_LOCKS.MANAGE_PULL_REQUEST === false
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(dirname(fileURLToPath(import.meta.url)), relFromLocalBrain);
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

function softWireAnyFile(
  relCandidates: readonly string[],
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  for (const rel of relCandidates) {
    const pathChecked = join(dirname(fileURLToPath(import.meta.url)), rel);
    if (existsSync(pathChecked)) {
      return { present: true, pathChecked, note: notePresent };
    }
  }
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relCandidates[0] ?? './MISSING',
  );
  return { present: false, pathChecked, note: noteAbsent };
}

/**
 * Soft-wire EO6 baselines, EO7 logistics, EO5 quantum honesty, #159, Home Base.
 * Presence alone ≠ VERIFIED.
 */
export function eo8SoftWireSnapshot(repoRoot?: string): Eo8SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo6ClassicalBaseline: softWireAnyFile(
      [
        './classical-baseline-requirement-types.ts',
        './classical-baseline-requirement.ts',
        './eo6-classical-baseline-types.ts',
      ],
      'EO6 classical baseline PRESENT (soft-wire).',
      'EO6 classical baseline absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo7LogisticsPack: softWireAnyFile(
      [
        './government-logistics-mission-pack-types.ts',
        './government-logistics-mission-pack.ts',
        './logistics-modernization-pack-types.ts',
        './logistics-pack-types.ts',
        './eo7-logistics-pack-types.ts',
      ],
      'EO7 logistics pack PRESENT (soft-wire).',
      'EO7 logistics pack absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo5QuantumHonesty: softWireAnyFile(
      [
        './quantum-evidence-boundary-types.ts',
        './quantum-evidence-boundary.ts',
        './eo5-quantum-evidence-boundary-types.ts',
      ],
      'EO5 quantum evidence boundary PRESENT (honesty soft-wire for advanced methods).',
      'EO5 quantum honesty absent on this tip — soft-wire WAITING_DATA; classical scenarios default.',
    ),
    eo159MissionOsTypes: softWireFile(
      './government-quantum-ai-mission-os-types.ts',
      'EO (#159) Mission OS types PRESENT (logistics advisory soft-wire).',
      'EO (#159) Mission OS types absent — soft-wire WAITING_DATA.',
    ),
    eo159MissionOsRuntime: softWireFile(
      './government-quantum-ai-mission-os-runtime.ts',
      'EO (#159) Mission OS runtime PRESENT (adviseLogisticsModernization soft-wire).',
      'EO (#159) Mission OS runtime absent — soft-wire WAITING_DATA.',
    ),
    eo159Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO_GOVERNMENT_QUANTUM_AI_MISSION_OS_REPORT.md',
      'EO (#159) report PRESENT.',
      'EO (#159) report absent on this tip.',
    ),
    homeBaseRuntime: softWireFile(
      './agent-compute-home-base-runtime.ts',
      '#157 agent-compute-home-base runtime PRESENT (evidence ingest soft-wire).',
      '#157 home-base absent — soft-wire WAITING_DATA.',
    ),
    homeBaseReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EM_AGENT_COMPUTE_HOME_BASE_REPORT.md',
      '#157 home-base report PRESENT.',
      '#157 home-base report absent.',
    ),
    en158DealOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN (#158) Deal OS PRESENT (soft-wire).',
      'EN (#158) Deal OS absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eo8Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isBoundedResilienceAgent(actor: Eo8Actor): boolean {
  return (RESILIENCE_AGENT_TEAM as readonly string[]).includes(actor.kind);
}

export function isValidTruthLabel(label: string): label is TruthBoundaryLabel {
  return (TRUTH_BOUNDARY_LABELS as readonly string[]).includes(label);
}
