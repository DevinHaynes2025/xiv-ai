/**
 * 62L-EM (#157) — Agent Compute Home Base + Universal CPU/GPU/NPU Fabric +
 * Pricing & Negotiation Council + Historical Business Intelligence +
 * Telecom/Satellite Research + Simulation Worlds.
 *
 * SoT: GitHub #157 (authoritative). Letter-collision: prior child branch
 * `cursor/62l-em-local-model-verification-4059` implemented a different EM
 * scope (local model/ONNX/heartbeat/classical benchmarks) without a GitHub #.
 * This module is the lettered EM issue (#157) SoT implementation.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire EL9/EL8/EL7/prior EM local-runtime + EK when PRESENT.
 * Child agents do NOT automatically inherit broader permissions.
 * Recommend ≠ charge/sign. Ambition tracker ≠ valuation. Starlink = candidate
 * adapter only (UNCONNECTED). Sim ≠ fact ≠ physical control.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 157 as const;
export const GITHUB_SOT_TITLE =
  'Agent Compute Home Base + Universal CPU/GPU/NPU Fabric + Pricing & Negotiation Council + Historical Business Intelligence + Telecom/Satellite Research + Simulation Worlds' as const;

/** Letter-collision note — prior EM local-model work is soft-wired, not deleted. */
export const LETTER_COLLISION_NOTE =
  'Prior child branch cursor/62l-em-local-model-verification-4059 implemented a different EM scope (local model/ONNX/heartbeat/classical benchmarks) without a GitHub #. GitHub #157 is SoT for the lettered EM issue; prior local-runtime EM work is soft-wired and preserved.' as const;

export const EM157_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_AWAIT =
  'Await founder paste for next issue/letter (e.g. EL10 Workload Router or next 62L phase).' as const;

/** Home-base pathway cycle (XIV Home Base → mission → fabric/sim → evidence → review → human decision → home). */
export const AGENT_COMPUTE_HOME_BASE_CYCLE = [
  'honesty_locks',
  'home_base_bootstrap',
  // A — Agent Compute Home Base
  'mission_register',
  'mission_branch',
  'child_permission_isolation',
  'mission_return_evidence',
  // B — Universal CPU/GPU/NPU Fabric
  'fabric_route_candidate',
  'el_truth_state_gate',
  'tensorrt_candidate_only',
  'detected_neq_verified',
  // C — Pricing & Negotiation Council
  'pricing_council_recommend',
  'negotiation_strategy',
  'contract_scenario_sim',
  'affordability_guard',
  'ambition_neq_valuation',
  // D — Accountant cost ledger + free-to-premium
  'cost_ledger_record',
  'free_to_premium_gate',
  'enterprise_tier_gated_recommend',
  // E — Historical Business Intelligence
  'historical_lesson_register',
  'provenance_required',
  'correlation_neq_causation',
  // F — Telecom / Satellite research adapters
  'starlink_adapter_candidate',
  'starlink_unconnected_default',
  'satellite_control_deny',
  // G — Simulation Worlds
  'simulation_branch_isolated',
  'sim_neq_fact',
  'sim_neq_physical_control',
  // H — Pathway + human decision + soft-wire
  'neural_pathway_update',
  'cfo_ops_strategy_review',
  'human_decision_gate',
  'el9_el8_em_soft_wire',
  'explicit_non_claims',
  'evidence',
] as const;

export type Em157Hop = (typeof AGENT_COMPUTE_HOME_BASE_CYCLE)[number];

export type Em157EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'STALE'
  | 'UNKNOWN'
  | 'NOT_TESTED'
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
  | 'LABELED_SIMULATION'
  | 'NOT_APPLIED'
  | 'NOT_VERIFIED'
  | 'UNCONNECTED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'PROVENANCE_LABELED'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'AUTHORIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'CONTRACT_ONLY'
  | 'ADVISORY_ONLY'
  | 'APPROVED_BOUNDED';

export type Em157HopRecord = {
  hop: Em157Hop;
  state: Em157EvidenceState;
  summary: string;
  at: string;
};

export type Em157ActorKind =
  | 'home_base_operator'
  | 'mission_agent'
  | 'child_research_agent'
  | 'fabric_router'
  | 'pricing_council'
  | 'cfo_reviewer'
  | 'accountant'
  | 'negotiation_strategist'
  | 'historical_bi_curator'
  | 'telecom_researcher'
  | 'simulation_operator'
  | 'guardian'
  | 'human_approver'
  | 'founder';

export type Em157Actor = {
  kind: Em157ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  /** Explicit permission set — never inherited automatically by children. */
  permissions: readonly string[];
};

export const EM157_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  CHILD_AUTO_INHERIT_BROADER_PERMISSIONS: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SILENT_CPU_FALLBACK_EQ_ACCELERATOR_VERIFIED: false as const,
  ORGS_ALREADY_SAVE_TRILLIONS_CLAIM: false as const,
  LIVE_VEHICLE_CONTROL: false as const,
  SATELLITE_CONTROL: false as const,
  AMD_VERIFIED_WITHOUT_RUNTIME_EVIDENCE: false as const,
  NVIDIA_VERIFIED_WITHOUT_RUNTIME_EVIDENCE: false as const,
  PHYSICAL_QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,
  AUTONOMOUS_CONTRACTS: false as const,
  AUTO_BILLING: false as const,
  AUTO_SIGN_CONTRACT: false as const,
  RECOMMEND_EQ_CHARGE: false as const,
  RECOMMEND_EQ_SIGN: false as const,
  AMBITION_EQ_VALUATION: false as const,
  AMBITION_EQ_VERIFIED_CLAIM: false as const,
  HBR_CASE_EQ_PROOF_STRATEGY_WORKS_TODAY: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  SIM_EQ_FACT: false as const,
  SIM_EQ_PHYSICAL_CONTROL: false as const,
  STARLINK_CONNECTED_WITHOUT_CREDENTIALS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_DECISION_REQUIRED_FOR_CONSEQUENTIAL_PRICING: true as const,
  HUMAN_DECISION_REQUIRED_FOR_CONTRACTS: true as const,
  HUMAN_DECISION_REQUIRED_FOR_SPEND: true as const,
  GUARDIAN_RLS_APPROVAL_UNCHANGED: true as const,
});

export const EM157_NOT_TESTED_CLAIMS = Object.freeze([
  'live_starlink_management_api',
  'amd_gpu_acceleration_verified',
  'nvidia_gpu_acceleration_verified',
  'nvidia_tensorrt_pathway_verified',
  'npu_acceleration_verified',
  'physical_quantum_advantage',
  'live_vehicle_control',
  'satellite_control',
  'autonomous_contract_execution',
  'enterprise_300k_mo_auto_billing',
  'orgs_already_save_trillions',
  '400_trillion_present_valuation',
] as const);

/** Founder ambition tracker only — NOT present valuation / verified claim. */
export const FOUNDER_AMBITION_TRACKER = Object.freeze({
  label: '400_trillion_company_goal' as const,
  amountUsd: 400_000_000_000_000,
  kind: 'founder_ambition_tracker_only' as const,
  isPresentValuation: false as const,
  isVerifiedClaim: false as const,
  state: 'ADVISORY_ONLY' as const,
});

export const ENTERPRISE_TIER_EXAMPLE_USD_PER_MONTH = 300_000 as const;

export type MissionKind =
  | 'research'
  | 'simulation'
  | 'pricing'
  | 'logistics'
  | 'hardware'
  | 'historical_analysis'
  | 'infrastructure'
  | 'telecom_satellite_research'
  | 'negotiation'
  | 'cost_ledger';

export type MissionStatus =
  | 'REGISTERED'
  | 'BRANCHED'
  | 'RUNNING'
  | 'RETURNED'
  | 'DENIED'
  | 'AWAITING_HUMAN'
  | 'CLOSED';

export type FabricRouteKind =
  | 'cpu'
  | 'gpu_amd_candidate'
  | 'gpu_nvidia_candidate'
  | 'npu_candidate'
  | 'onnx_windows_ml_candidate'
  | 'tensorrt_candidate'
  | 'simulation_route'
  | 'cpu_fallback';

export type FabricTruthState =
  | 'UNKNOWN'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'CANDIDATE'
  | 'NOT_TESTED'
  | 'VERIFIED'
  | 'DENIED'
  | 'UNAVAILABLE';

export type AccessTier = 'free' | 'premium' | 'enterprise';

export type EvidenceClass =
  | 'primary_source'
  | 'scholarly_case'
  | 'hbr_style_case'
  | 'internal_ops'
  | 'market_report'
  | 'anecdote'
  | 'simulation_derived'
  | 'unverified_relationship';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Em157SoftWireSnapshot = {
  el9ResourceGovernor: SoftWirePresence;
  el8Honesty: SoftWirePresence;
  el8ModelLoadEvidence: SoftWirePresence;
  priorEmLocalModelHonesty: SoftWirePresence;
  priorEmOnnxAdapter: SoftWirePresence;
  ekCognitiveOsTypes: SoftWirePresence;
  localRuntimeIndex: SoftWirePresence;
};

export function assertEm157LocksIntact(): boolean {
  return (
    EM157_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM157_LOCKS.CHILD_AUTO_INHERIT_BROADER_PERMISSIONS === false &&
    EM157_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EM157_LOCKS.SILENT_CPU_FALLBACK_EQ_ACCELERATOR_VERIFIED === false &&
    EM157_LOCKS.ORGS_ALREADY_SAVE_TRILLIONS_CLAIM === false &&
    EM157_LOCKS.LIVE_VEHICLE_CONTROL === false &&
    EM157_LOCKS.SATELLITE_CONTROL === false &&
    EM157_LOCKS.AMD_VERIFIED_WITHOUT_RUNTIME_EVIDENCE === false &&
    EM157_LOCKS.NVIDIA_VERIFIED_WITHOUT_RUNTIME_EVIDENCE === false &&
    EM157_LOCKS.PHYSICAL_QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
    EM157_LOCKS.AUTONOMOUS_CONTRACTS === false &&
    EM157_LOCKS.AUTO_BILLING === false &&
    EM157_LOCKS.AUTO_SIGN_CONTRACT === false &&
    EM157_LOCKS.RECOMMEND_EQ_CHARGE === false &&
    EM157_LOCKS.RECOMMEND_EQ_SIGN === false &&
    EM157_LOCKS.AMBITION_EQ_VALUATION === false &&
    EM157_LOCKS.AMBITION_EQ_VERIFIED_CLAIM === false &&
    EM157_LOCKS.HBR_CASE_EQ_PROOF_STRATEGY_WORKS_TODAY === false &&
    EM157_LOCKS.CORRELATION_EQ_CAUSATION === false &&
    EM157_LOCKS.SIM_EQ_FACT === false &&
    EM157_LOCKS.SIM_EQ_PHYSICAL_CONTROL === false &&
    EM157_LOCKS.STARLINK_CONNECTED_WITHOUT_CREDENTIALS === false &&
    EM157_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EM157_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EM157_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EM157_LOCKS.HUMAN_DECISION_REQUIRED_FOR_CONSEQUENTIAL_PRICING === true &&
    EM157_LOCKS.HUMAN_DECISION_REQUIRED_FOR_CONTRACTS === true &&
    EM157_LOCKS.HUMAN_DECISION_REQUIRED_FOR_SPEND === true &&
    EM157_LOCKS.TIP_LAND === false &&
    EM157_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EM157_LOCKS.DB_CANDIDATES_APPLIED === false
  );
}

function softWireFile(relFromLocalBrain: string, notePresent: string, noteAbsent: string): SoftWirePresence {
  const pathChecked = join(dirname(fileURLToPath(import.meta.url)), relFromLocalBrain);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

/**
 * Soft-wire EL9/EL8/prior EM local-runtime + EK when present.
 * Presence alone does not imply VERIFIED.
 */
export function em157SoftWireSnapshot(): Em157SoftWireSnapshot {
  return {
    el9ResourceGovernor: softWireFile(
      '../local-runtime/resource-governor.ts',
      'EL9 resource governor present (ceilings apply; not live thermal VERIFIED).',
      'EL9 resource governor absent — soft-wire no-op.',
    ),
    el8Honesty: softWireFile(
      '../local-runtime/el8-honesty.ts',
      'EL8 honesty locks present (DETECTED≠VERIFIED; silent fallback≠accelerator VERIFIED).',
      'EL8 honesty module absent.',
    ),
    el8ModelLoadEvidence: softWireFile(
      '../local-runtime/model-load-evidence.ts',
      'EL8 model-load evidence module present (presence ≠ VERIFIED load).',
      'EL8 model-load evidence absent.',
    ),
    priorEmLocalModelHonesty: softWireFile(
      '../local-runtime/honesty.ts',
      'Prior EM local-model honesty soft-wired (letter-collision scope preserved).',
      'Prior EM local-model honesty absent.',
    ),
    priorEmOnnxAdapter: softWireFile(
      '../local-runtime/onnx-windows-ml-adapter.ts',
      'Prior EM ONNX/Windows ML adapter soft-wired (candidate path; not device VERIFIED).',
      'Prior EM ONNX adapter absent.',
    ),
    ekCognitiveOsTypes: softWireFile(
      './windows-amd-local-cognitive-os-types.ts',
      'EK cognitive OS types present (soft-wire only; not EK VERIFIED).',
      'EK cognitive OS types absent on this branch — soft-wire no-op.',
    ),
    localRuntimeIndex: softWireFile(
      '../local-runtime/index.ts',
      'local-runtime index present for fabric/governor soft-wire.',
      'local-runtime index absent.',
    ),
  };
}
