/**
 * 62L-EO7 — Government Logistics Mission Pack (park-and-implement).
 *
 * Dedicated logistics mission pack for government / public-sector operations:
 * transportation, warehousing, inventory, maintenance, readiness, procurement,
 * and supplier-risk problems → measurable optimization workflows.
 *
 * SoT: GitHub EO family / #159 lineage (authoritative). GitLab mirror: not
 * resolved in this environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Soft-wire: EM1 Home Base (evidence return); EO5 Quantum Evidence Boundary /
 * EO6 classical-baseline gate when PRESENT. Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * None of the logistics agents get automatic purchasing, dispatch, or contract
 * authority. Sim ≠ fact; recommend ≠ act; correlation ≠ causation.
 * No fabricated mission data; no classified-data assumptions.
 * Government compliance remains solicitation-specific.
 * Quantum claims cannot bypass EO6 classical-baseline requirement.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EO8 — Supply Chain Resilience Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 159 as const;
export const GITHUB_SOT_LABEL = '62L-EO7' as const;
export const GITHUB_SOT_TITLE =
  '62L-EO7 Government Logistics Mission Pack — transportation, warehousing, inventory, maintenance, readiness, procurement, and supplier-risk optimization workflows for public-sector missions' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO7_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO8 — Supply Chain Resilience Pack — multi-tier suppliers, shortages, lead-time risk, alternate sourcing, capacity constraints, disruption scenarios, recovery strategies.' as const;

/**
 * Core mission areas (encoded).
 */
export const LOGISTICS_MISSION_AREAS = [
  'transportation_routing',
  'fleet_scheduling',
  'warehousing',
  'inventory_positioning',
  'spare_parts_availability',
  'maintenance_planning',
  'procurement_lead_times',
  'supplier_resilience',
  'cold_chain',
  'asset_visibility',
  'emergency_disaster_logistics',
  'contingency_planning',
  'facility_network_capacity',
  'last_mile_distribution',
  'readiness_service_level_analysis',
] as const;

export type LogisticsMissionArea = (typeof LOGISTICS_MISSION_AREAS)[number];

/**
 * Core flow:
 * Mission requirement → data/evidence intake → current-state baseline →
 * bottleneck/root cause → classical optimization → advanced/agentic simulation →
 * scenario comparison → recommendation → human authorization
 */
export const LOGISTICS_MISSION_CORE_FLOW = [
  'mission_requirement',
  'data_evidence_intake',
  'current_state_baseline',
  'bottleneck_root_cause',
  'classical_optimization',
  'advanced_agentic_simulation',
  'scenario_comparison',
  'recommendation',
  'human_authorization',
] as const;

export type LogisticsMissionFlowHop =
  (typeof LOGISTICS_MISSION_CORE_FLOW)[number];

/** Logistics problem fields (contract surface). */
export const LOGISTICS_PROBLEM_FIELDS = [
  'missionId',
  'agencyOrganizationScope',
  'assetsFacilities',
  'suppliers',
  'inventory',
  'routes',
  'capacity',
  'leadTimes',
  'serviceTargets',
  'costConstraints',
  'riskFactors',
  'dataRights',
  'baselineKpis',
  'scenarioAssumptions',
  'approvalState',
] as const;

export type LogisticsProblemField = (typeof LOGISTICS_PROBLEM_FIELDS)[number];

/** KPI schema keys. */
export const LOGISTICS_KPI_KEYS = [
  'fill_rate',
  'otif',
  'lead_time',
  'cycle_time',
  'inventory_turns',
  'stockout_rate',
  'readiness_rate',
  'asset_availability',
  'transportation_cost',
  'cost_to_serve',
  'warehouse_utilization',
  'maintenance_backlog',
  'supplier_concentration',
  'recovery_time',
  'demand_service_risk',
] as const;

export type LogisticsKpiKey = (typeof LOGISTICS_KPI_KEYS)[number];

export type LogisticsKpiValue = {
  key: LogisticsKpiKey;
  value: number | null;
  unit: string;
  source: 'baseline' | 'scenario' | 'simulated' | 'unknown';
  uncertaintyNote: string;
  /** Sim ≠ fact — simulated KPIs must not be treated as measured fact. */
  isSimulated: boolean;
};

/**
 * Bounded agent team — return evidence to Home Base.
 * None get automatic purchasing, dispatch, or contract authority.
 */
export const LOGISTICS_AGENT_TEAM = [
  'logistics_planner',
  'inventory_analyst',
  'transportation_optimizer',
  'warehouse_engineer',
  'maintenance_analyst',
  'supplier_risk_agent',
  'quant_or_agent',
  'historical_case_agent',
  'simulation_agent',
  'cfo_cost_agent',
] as const;

export type LogisticsAgentRole = (typeof LOGISTICS_AGENT_TEAM)[number];

export const LOGISTICS_AGENT_BOUNDS = Object.freeze({
  mayReturnEvidenceToHomeBase: true as const,
  automaticPurchasing: false as const,
  automaticDispatch: false as const,
  automaticContractAuthority: false as const,
  mayRecommendOnly: true as const,
});

/**
 * Quantum comparison ladder — physical QPU only if verified.
 * No quantum claim can bypass EO6 classical-baseline requirement.
 */
export const QUANTUM_COMPARISON_LADDER = [
  'classical_or',
  'heuristics_metaheuristics',
  'ml_assisted',
  'quantum_inspired',
  'physical_qpu',
] as const;

export type QuantumComparisonRung = (typeof QUANTUM_COMPARISON_LADDER)[number];

export const QUANTUM_CLAIM_STATES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumClaimState = (typeof QUANTUM_CLAIM_STATES)[number];

export const GOVERNMENT_LOGISTICS_MISSION_PACK_CYCLE = [
  'honesty_locks',
  'logistics_mission_pack_bootstrap',
  // A — Mission areas + problem fields + KPI schema
  'mission_areas_encoded',
  'problem_fields_encoded',
  'kpi_schema_encoded',
  // B — Core flow
  'core_flow_encoded',
  'mission_requirement',
  'data_evidence_intake',
  'current_state_baseline',
  'bottleneck_root_cause',
  'classical_optimization',
  'advanced_agentic_simulation',
  'scenario_comparison',
  'recommendation',
  'human_authorization',
  // C — Agent team bounds + Home Base evidence return
  'agent_team_bounded',
  'agent_evidence_to_home_base',
  'no_agent_purchasing_authority',
  'no_agent_dispatch_authority',
  'no_agent_contract_authority',
  // D — Classical OR + quantum/EO6 gate
  'classical_or_baseline_required',
  'quantum_comparison_ladder',
  'eo6_classical_baseline_gate',
  'deny_quantum_without_eo6_baseline',
  'physical_qpu_only_if_verified',
  // E — Safety / truth denials
  'no_autonomous_shipment_dispatch',
  'no_autonomous_purchasing',
  'no_autonomous_supplier_commitments',
  'no_fabricated_mission_data',
  'no_classified_data_assumptions',
  'assumptions_and_uncertainty_exposed',
  'compliance_solicitation_specific',
  'guardian_rls_tenant_universe_isolation',
  'correlation_neq_causation',
  'sim_neq_fact',
  'recommend_neq_act',
  'l4_autonomy_false',
  // F — Soft-wires
  'em1_home_base_soft_wire',
  'eo5_quantum_evidence_boundary_soft_wire',
  'eo6_classical_baseline_soft_wire',
  'eo_159_mission_os_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eo7Hop = (typeof GOVERNMENT_LOGISTICS_MISSION_PACK_CYCLE)[number];

export type Eo7EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'WAITING_DATA'
  | 'NOT_APPLIED'
  | 'SIMULATED'
  | 'THEORETICAL'
  | 'BASELINE_REQUIRED'
  | 'HUMAN_GATE';

export type Eo7HopRecord = {
  hop: Eo7Hop;
  state: Eo7EvidenceState;
  summary: string;
  at: string;
};

export type Eo7ActorKind =
  | LogisticsAgentRole
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Eo7Actor = {
  kind: Eo7ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EO7_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_LOGISTICS_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Agent authority bounds
  AGENT_AUTO_PURCHASING: false as const,
  AGENT_AUTO_DISPATCH: false as const,
  AGENT_AUTO_CONTRACT: false as const,
  AGENT_AUTO_SUPPLIER_COMMITMENT: false as const,

  // Logistics autonomy denies
  AUTO_SHIPMENT_DISPATCH: false as const,
  AUTO_PURCHASING: false as const,
  AUTO_SUPPLIER_COMMITMENT: false as const,
  AUTO_FREIGHT_DISPATCH: false as const,
  AUTO_PURCHASE_ORDER: false as const,

  // Truth / epistemology
  FABRICATE_MISSION_DATA: false as const,
  CLASSIFIED_DATA_ASSUMPTIONS: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  SIM_EQ_FACT: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_DISPATCH: false as const,
  RECOMMEND_EQ_PURCHASE: false as const,
  RECOMMEND_EQ_COMMIT: false as const,

  // Quantum / EO6 gate
  QUANTUM_WITHOUT_EO6_CLASSICAL_BASELINE: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,
  PHYSICAL_QPU_WITHOUT_VERIFICATION: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  SIMULATED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  THEORETICAL_EQ_OPERATIONAL: false as const,

  // Isolation / compliance
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  UNIVERSAL_COMPLIANCE_WITHOUT_SOLICITATION: false as const,
  HIDE_ASSUMPTIONS_OR_UNCERTAINTY: false as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Human gates
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  HUMAN_AUTHORIZATION_REQUIRED_FOR_DISPATCH_PURCHASE_COMMIT: true as const,
});

export const EO7_MAY = Object.freeze([
  'register_logistics_missions',
  'intake_authorized_evidence',
  'build_current_state_baselines',
  'analyze_bottlenecks_with_uncertainty',
  'run_classical_or_optimization',
  'run_agentic_simulation_labeled',
  'compare_scenarios',
  'recommend_with_assumptions_exposed',
  'return_agent_evidence_to_home_base',
  'compare_quantum_ladder_after_eo6_baseline',
] as const);

export const EO7_MUST_NOT = Object.freeze([
  'autonomous_shipment_dispatch',
  'autonomous_purchasing',
  'autonomous_supplier_commitments',
  'fabricate_mission_data',
  'assume_classified_data',
  'treat_correlation_as_causation',
  'treat_simulation_as_fact',
  'treat_recommend_as_act',
  'bypass_eo6_classical_baseline_for_quantum_claims',
  'claim_physical_qpu_without_verification',
  'bypass_guardian_rls_tenant_universe',
  'assert_universal_gov_compliance_without_solicitation',
  'hide_assumptions_or_uncertainty',
  'grant_agents_purchasing_dispatch_or_contract_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo7SoftWireSnapshot = {
  em1HomeBaseContract: SoftWirePresence;
  em1HomeBaseSoftWire: SoftWirePresence;
  em1Report: SoftWirePresence;
  eo5QuantumEvidenceBoundary: SoftWirePresence;
  eo5Report: SoftWirePresence;
  eo6ClassicalBaselineGate: SoftWirePresence;
  eo6Report: SoftWirePresence;
  classicalQuantBenchmark: SoftWirePresence;
  eo159MissionOsTypes: SoftWirePresence;
  eo159MissionOsRuntime: SoftWirePresence;
  eo159Report: SoftWirePresence;
};

export function assertEo7LocksIntact(): boolean {
  return (
    EO7_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO7_LOCKS.AGENT_AUTO_PURCHASING === false &&
    EO7_LOCKS.AGENT_AUTO_DISPATCH === false &&
    EO7_LOCKS.AGENT_AUTO_CONTRACT === false &&
    EO7_LOCKS.AGENT_AUTO_SUPPLIER_COMMITMENT === false &&
    EO7_LOCKS.AUTO_SHIPMENT_DISPATCH === false &&
    EO7_LOCKS.AUTO_PURCHASING === false &&
    EO7_LOCKS.AUTO_SUPPLIER_COMMITMENT === false &&
    EO7_LOCKS.AUTO_FREIGHT_DISPATCH === false &&
    EO7_LOCKS.AUTO_PURCHASE_ORDER === false &&
    EO7_LOCKS.FABRICATE_MISSION_DATA === false &&
    EO7_LOCKS.CLASSIFIED_DATA_ASSUMPTIONS === false &&
    EO7_LOCKS.CORRELATION_EQ_CAUSATION === false &&
    EO7_LOCKS.SIM_EQ_FACT === false &&
    EO7_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO7_LOCKS.RECOMMEND_EQ_DISPATCH === false &&
    EO7_LOCKS.RECOMMEND_EQ_PURCHASE === false &&
    EO7_LOCKS.RECOMMEND_EQ_COMMIT === false &&
    EO7_LOCKS.QUANTUM_WITHOUT_EO6_CLASSICAL_BASELINE === false &&
    EO7_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
    EO7_LOCKS.PHYSICAL_QPU_WITHOUT_VERIFICATION === false &&
    EO7_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO7_LOCKS.SIMULATED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO7_LOCKS.THEORETICAL_EQ_OPERATIONAL === false &&
    EO7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EO7_LOCKS.UNIVERSAL_COMPLIANCE_WITHOUT_SOLICITATION === false &&
    EO7_LOCKS.HIDE_ASSUMPTIONS_OR_UNCERTAINTY === false &&
    EO7_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO7_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO7_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO7_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EO7_LOCKS.HUMAN_AUTHORIZATION_REQUIRED_FOR_DISPATCH_PURCHASE_COMMIT ===
      true &&
    EO7_LOCKS.TIP_LAND === false &&
    EO7_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO7_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO7_LOCKS.FULL_PRODUCTION_LOGISTICS_PACK_SHIPPED === false &&
    EO7_LOCKS.MANAGE_PULL_REQUEST === false &&
    LOGISTICS_AGENT_BOUNDS.automaticPurchasing === false &&
    LOGISTICS_AGENT_BOUNDS.automaticDispatch === false &&
    LOGISTICS_AGENT_BOUNDS.automaticContractAuthority === false
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

/**
 * Soft-wire EM1 Home Base, EO5/EO6 gates, #159 EO Mission OS when present.
 * Presence alone ≠ VERIFIED.
 */
export function eo7SoftWireSnapshot(repoRoot?: string): Eo7SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    em1HomeBaseContract: softWireFile(
      './agent-home-base-contract.ts',
      'EM1 agent home base contract PRESENT (soft-wire; agents return evidence).',
      'EM1 agent home base contract absent — soft-wire WAITING_DATA.',
    ),
    em1HomeBaseSoftWire: softWireFile(
      './agent-home-base-soft-wire.ts',
      'EM1 home base soft-wire module PRESENT.',
      'EM1 home base soft-wire module absent.',
    ),
    em1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EM1_AGENT_HOME_BASE_CONTRACT_REPORT.md',
      'EM1 report PRESENT.',
      'EM1 report absent.',
    ),
    eo5QuantumEvidenceBoundary: softWireFile(
      './quantum-evidence-boundary.ts',
      'EO5 Quantum Evidence Boundary PRESENT (soft-wire).',
      'EO5 Quantum Evidence Boundary absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO5_QUANTUM_EVIDENCE_BOUNDARY_REPORT.md',
      'EO5 report PRESENT.',
      'EO5 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo6ClassicalBaselineGate: softWireFile(
      './classical-baseline-eo6-gate.ts',
      'EO6 classical-baseline gate PRESENT (soft-wire).',
      'EO6 classical-baseline gate absent on this tip — soft-wire WAITING_DATA; quantum claims still require classical baseline.',
    ),
    eo6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO6_CLASSICAL_BASELINE_GATE_REPORT.md',
      'EO6 report PRESENT.',
      'EO6 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    classicalQuantBenchmark: softWireFile(
      '../local-runtime/classical-quant-benchmark.ts',
      'Classical quant benchmark PRESENT (EO6-aligned classical baseline soft-wire).',
      'Classical quant benchmark absent — quantum advantage / QPU claims remain DENIED.',
    ),
    eo159MissionOsTypes: softWireFile(
      './government-quantum-ai-mission-os-types.ts',
      '#159 EO Mission OS types PRESENT (soft-wire).',
      '#159 EO Mission OS types absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo159MissionOsRuntime: softWireFile(
      './government-quantum-ai-mission-os-runtime.ts',
      '#159 EO Mission OS runtime PRESENT (soft-wire).',
      '#159 EO Mission OS runtime absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo159Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO_GOVERNMENT_QUANTUM_AI_MISSION_OS_REPORT.md',
      '#159 EO report PRESENT.',
      '#159 EO report absent on this tip — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eo7Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isLogisticsAgent(actor: Eo7Actor): boolean {
  return (LOGISTICS_AGENT_TEAM as readonly string[]).includes(actor.kind);
}
