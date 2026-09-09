/**
 * 62L-EO4 — AI & Quantum Capability Matrix (park-and-implement).
 *
 * SoT: GitHub #159 EO family (authoritative). GitLab mirror: not resolved in
 * this environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Never sell ahead of evidence —
 * theoretical ≠ operational capability.
 *
 * Soft-wire: EO3 Quantum Mission Opportunity Watch (no solicitation-driven
 * upgrades), EO1 Command Center, EM quantum truth states, classical baselines,
 * EN Deal OS / EO Mission OS when PRESENT.
 *
 * Guardian / RLS / tenant / Universe unchanged.
 * Consequential submissions human-authorized only.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 159 as const;
export const GITHUB_SOT_TITLE =
  '62L-EO4 AI & Quantum Capability Matrix — map every government requirement against what XIV can prove; separate current capability from research ambition' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO4_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO5 — Quantum Evidence Boundary — formalize how XIV labels, tests, benchmarks, and communicates every quantum-related claim across demos, proposals, simulations, and research.' as const;

/** Classical / general capability mapping labels. */
export const CAPABILITY_MAPPING_LABELS = [
  'VERIFIED',
  'SUPPORTED',
  'CANDIDATE',
  'NOT_AVAILABLE',
] as const;

export type CapabilityMappingLabel =
  (typeof CAPABILITY_MAPPING_LABELS)[number];

/** Quantum evidence labels — soft-wire EM quantum truth states. */
export const QUANTUM_EVIDENCE_LABELS = [
  'PHYSICAL_QPU_VERIFIED',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'THEORETICAL',
] as const;

export type QuantumEvidenceLabel = (typeof QUANTUM_EVIDENCE_LABELS)[number];

/** Prototype / production readiness without selling ahead. */
export const READINESS_LABELS = [
  'NOT_STARTED',
  'PROTOTYPE',
  'LAB_ONLY',
  'PILOT_CANDIDATE',
  'PRODUCTION_CANDIDATE',
  'PRODUCTION_AUTHORIZED',
  'NOT_AUTHORIZED',
] as const;

export type ReadinessLabel = (typeof READINESS_LABELS)[number];

/**
 * Capability record fields (required contract surface).
 */
export type CapabilityRecord = {
  requirementId: string;
  capabilityName: string;
  xivModuleService: string;
  evidenceState: CapabilityMappingLabel;
  hardwareRuntimeDependency: string;
  benchmarkTestEvidence: string;
  classicalBaseline: string;
  securityComplianceDependencies: string;
  staffingPartnerDependency: string;
  dataRequirements: string;
  knownLimitations: string;
  prototypeReadiness: ReadinessLabel;
  productionReadiness: ReadinessLabel;
  evidenceOwner: string;
  lastVerifiedDate: string | null;
  /** Present when the capability is quantum-adjacent. */
  quantumEvidenceState?: QuantumEvidenceLabel | null;
};

/** Auto-flag kinds — must be tested. */
export const AUTO_FLAG_KINDS = [
  'unsupported_proposal_language',
  'stale_benchmarks',
  'missing_evidence',
  'certification_gaps',
  'hardware_assumptions',
  'unverified_partner_dependencies',
  'quantum_claims_without_classical_comparison',
  'requirements_needing_human_technical_review',
] as const;

export type AutoFlagKind = (typeof AUTO_FLAG_KINDS)[number];

export type AutoFlag = {
  kind: AutoFlagKind;
  severity: 'block' | 'warn' | 'review';
  message: string;
  requirementId?: string;
  capabilityName?: string;
};

export const AI_QUANTUM_CAPABILITY_MATRIX_CYCLE = [
  'honesty_locks',
  'capability_matrix_bootstrap',
  // A — Mapping + quantum labels
  'capability_mapping_labels',
  'quantum_evidence_labels',
  'capability_record_fields',
  // B — Fixture mapping (multi-echelon logistics)
  'multi_echelon_logistics_fixture',
  'classical_or_supported',
  'agentic_decomposition_candidate_or_supported',
  'quantum_inspired_simulated',
  'physical_qpu_not_available_without_backend',
  // C — Proposal language gate (hard)
  'proposal_language_gate',
  'deny_unsupported_claim_language',
  'never_sell_ahead_of_evidence',
  'theoretical_neq_operational',
  // D — Auto-flags
  'auto_flag_unsupported_proposal_language',
  'auto_flag_stale_benchmarks',
  'auto_flag_missing_evidence',
  'auto_flag_certification_gaps',
  'auto_flag_hardware_assumptions',
  'auto_flag_unverified_partner_dependencies',
  'auto_flag_quantum_without_classical',
  'auto_flag_human_technical_review',
  // E — Soft-wires
  'eo3_watch_soft_wire',
  'eo1_command_center_soft_wire',
  'em_quantum_truth_soft_wire',
  'classical_baseline_soft_wire',
  'en_deal_os_soft_wire',
  'eo_mission_os_soft_wire',
  // F — Autonomy / honesty
  'no_auto_submission',
  'l4_autonomy_false',
  'guardian_rls_tenant_universe_unchanged',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eo4Hop = (typeof AI_QUANTUM_CAPABILITY_MATRIX_CYCLE)[number];

export type Eo4EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'WAITING_DATA'
  | 'NOT_APPLIED'
  | 'ALLOWED'
  | 'FLAGGED';

export type Eo4HopRecord = {
  hop: Eo4Hop;
  state: Eo4EvidenceState;
  summary: string;
  at: string;
};

export type Eo4ActorKind =
  | 'capability_curator'
  | 'proposal_agent'
  | 'quantum_analyst'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'technical_reviewer';

export type Eo4Actor = {
  kind: Eo4ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EO4_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_CAPABILITY_MATRIX_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Critical: never sell ahead of evidence
  SELL_AHEAD_OF_EVIDENCE: false as const,
  THEORETICAL_EQ_OPERATIONAL: false as const,
  RESEARCH_AMBITION_EQ_CURRENT_CAPABILITY: false as const,

  // Quantum honesty
  QUANTUM_CLAIM_WITHOUT_CLASSICAL_BASELINE: false as const,
  PHYSICAL_QPU_WITHOUT_BACKEND_EVIDENCE: false as const,
  SIMULATED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  THEORETICAL_EQ_PHYSICAL_QPU_VERIFIED: false as const,

  // Proposal language gate
  PROPOSAL_LANGUAGE_WITHOUT_MATRIX_SUPPORT: false as const,
  UNSUPPORTED_CLAIM_LANGUAGE_ALLOWED: false as const,

  // Autonomy
  AUTO_SUBMISSION: false as const,
  AUTO_CERTIFY: false as const,
  AUTO_BID: false as const,
  RECOMMEND_EQ_ACT: false as const,

  // Soft-wire honesty
  EO3_WATCH_SOLICITATION_DRIVEN_UPGRADE: false as const,
  PRESENCE_EQ_VERIFIED: false as const,

  // Guardian / tenancy (unchanged — do not mutate)
  GUARDIAN_BYPASSED: false as const,
  RLS_BYPASSED: false as const,
  TENANT_SCOPE_MUTATED: false as const,
  UNIVERSE_SCOPE_MUTATED: false as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_SUBMISSIONS: true as const,
  HUMAN_TECHNICAL_REVIEW_REQUIRED_FOR_FLAGGED_REQUIREMENTS: true as const,
});

export const EO4_MAY = Object.freeze([
  'register_capability_records',
  'map_requirements_to_evidence_states',
  'label_quantum_evidence_honestly',
  'gate_proposal_language_to_matrix',
  'raise_auto_flags_for_gaps',
  'require_human_technical_review',
  'soft_wire_eo3_eo1_em_classical',
  'separate_current_capability_from_research_ambition',
] as const);

export const EO4_MUST_NOT = Object.freeze([
  'sell_ahead_of_evidence',
  'present_theoretical_as_operational',
  'claim_physical_qpu_without_backend_evidence',
  'claim_quantum_advantage_without_classical_comparison',
  'use_unsupported_proposal_language',
  'auto_submit_proposals_or_bids',
  'bypass_guardian_rls_tenant_universe',
  'upgrade_capability_from_eo3_solicitation_pressure',
  'treat_soft_wire_presence_as_verified',
] as const);

/**
 * Proposal language allowed per mapping label — hard gate inventory.
 * Agents may only emit language at or below the record's evidence state.
 */
export const PROPOSAL_LANGUAGE_BY_EVIDENCE = Object.freeze({
  VERIFIED: Object.freeze([
    'verified against recorded evidence',
    'evidence-backed capability',
    'last verified on record',
  ]),
  SUPPORTED: Object.freeze([
    'supported classical capability',
    'available as supported module',
    'classical baseline supported',
  ]),
  CANDIDATE: Object.freeze([
    'candidate capability pending further tests',
    'research or prototype candidate',
    'not yet verified for operational use',
  ]),
  NOT_AVAILABLE: Object.freeze([
    'not available',
    'no proven XIV capability for this requirement facet',
    'cannot claim operational delivery',
  ]),
} as const);

/** Claim phrases that always require elevated evidence (deny unless matched). */
export const BLOCKED_PROPOSAL_PHRASES = Object.freeze([
  'operational quantum advantage',
  'production qpu deployed',
  'physical quantum computer in production',
  'guaranteed quantum speedup',
  'we deliver quantum optimization at scale',
  'verified quantum supremacy for this rfp',
  'fully autonomous bid submission',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo4SoftWireSnapshot = {
  eo3Watch: SoftWirePresence;
  eo3Report: SoftWirePresence;
  eo1CommandCenter: SoftWirePresence;
  eo1Report: SoftWirePresence;
  eo2AgencyKg: SoftWirePresence;
  eoMissionOsTypes: SoftWirePresence;
  eoMissionOsRuntime: SoftWirePresence;
  eoReport: SoftWirePresence;
  enDealOs: SoftWirePresence;
  enReport: SoftWirePresence;
  emQuantumTruthLabels: SoftWirePresence;
  emCapabilityTruth: SoftWirePresence;
  classicalQuantBaseline: SoftWirePresence;
};

export function assertEo4LocksIntact(): boolean {
  return (
    EO4_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO4_LOCKS.SELL_AHEAD_OF_EVIDENCE === false &&
    EO4_LOCKS.THEORETICAL_EQ_OPERATIONAL === false &&
    EO4_LOCKS.RESEARCH_AMBITION_EQ_CURRENT_CAPABILITY === false &&
    EO4_LOCKS.QUANTUM_CLAIM_WITHOUT_CLASSICAL_BASELINE === false &&
    EO4_LOCKS.PHYSICAL_QPU_WITHOUT_BACKEND_EVIDENCE === false &&
    EO4_LOCKS.SIMULATED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO4_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO4_LOCKS.THEORETICAL_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO4_LOCKS.PROPOSAL_LANGUAGE_WITHOUT_MATRIX_SUPPORT === false &&
    EO4_LOCKS.UNSUPPORTED_CLAIM_LANGUAGE_ALLOWED === false &&
    EO4_LOCKS.AUTO_SUBMISSION === false &&
    EO4_LOCKS.AUTO_CERTIFY === false &&
    EO4_LOCKS.AUTO_BID === false &&
    EO4_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO4_LOCKS.EO3_WATCH_SOLICITATION_DRIVEN_UPGRADE === false &&
    EO4_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EO4_LOCKS.GUARDIAN_BYPASSED === false &&
    EO4_LOCKS.RLS_BYPASSED === false &&
    EO4_LOCKS.TENANT_SCOPE_MUTATED === false &&
    EO4_LOCKS.UNIVERSE_SCOPE_MUTATED === false &&
    EO4_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO4_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO4_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO4_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_SUBMISSIONS ===
      true &&
    EO4_LOCKS.HUMAN_TECHNICAL_REVIEW_REQUIRED_FOR_FLAGGED_REQUIREMENTS ===
      true &&
    EO4_LOCKS.TIP_LAND === false &&
    EO4_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO4_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO4_LOCKS.FULL_PRODUCTION_CAPABILITY_MATRIX_SHIPPED === false &&
    EO4_LOCKS.MANAGE_PULL_REQUEST === false
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
 * Soft-wire EO3 watch, EO1 Command Center, EM quantum truth, classical baselines,
 * EN / EO when present. Presence alone ≠ VERIFIED. EO3 watch must not drive
 * solicitation-based capability upgrades.
 */
export function eo4SoftWireSnapshot(repoRoot?: string): Eo4SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo3Watch: softWireFile(
      './quantum-mission-opportunity-watch.ts',
      'EO3 Quantum Mission Opportunity Watch PRESENT (soft-wire; no solicitation-driven upgrades).',
      'EO3 watch absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo3Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO3_QUANTUM_MISSION_OPPORTUNITY_WATCH_REPORT.md',
      'EO3 report PRESENT.',
      'EO3 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo1CommandCenter: softWireFile(
      './government-contracts-command-center.ts',
      'EO1 Government Contracts Command Center PRESENT (soft-wire).',
      'EO1 Command Center absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO1_GOVERNMENT_CONTRACTS_COMMAND_CENTER_REPORT.md',
      'EO1 report PRESENT.',
      'EO1 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo2AgencyKg: softWireFile(
      './government-agency-knowledge-graph.ts',
      'EO2 Agency Knowledge Graph PRESENT (soft-wire).',
      'EO2 Agency KG absent on this tip — soft-wire WAITING_DATA.',
    ),
    eoMissionOsTypes: softWireFile(
      './government-quantum-ai-mission-os-types.ts',
      '#159 EO Mission OS types PRESENT (EM quantum truth labels soft-wire).',
      '#159 EO Mission OS types absent — soft-wire WAITING_DATA.',
    ),
    eoMissionOsRuntime: softWireFile(
      './government-quantum-ai-mission-os-runtime.ts',
      '#159 EO Mission OS runtime PRESENT (soft-wire).',
      '#159 EO Mission OS runtime absent — soft-wire WAITING_DATA.',
    ),
    eoReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EO_GOVERNMENT_QUANTUM_AI_MISSION_OS_REPORT.md',
      '#159 EO report PRESENT.',
      '#159 EO report absent — soft-wire WAITING_DATA.',
    ),
    enDealOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN (#158) Deal & Contract Intelligence OS PRESENT (soft-wire).',
      'EN (#158) Deal OS absent — soft-wire WAITING_DATA.',
    ),
    enReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EN_DEAL_CONTRACT_INTELLIGENCE_OS_REPORT.md',
      'EN (#158) report PRESENT.',
      'EN (#158) report absent.',
    ),
    emQuantumTruthLabels: softWireFile(
      './government-quantum-ai-mission-os-types.ts',
      'EM/EO QPU evidence labels PRESENT (PHYSICAL_QPU_VERIFIED|SIMULATED|QUANTUM_INSPIRED|THEORETICAL).',
      'EM/EO QPU evidence labels absent — EO4 encodes local quantum label set.',
    ),
    emCapabilityTruth: softWireFile(
      '../local-runtime/capability-truth.ts',
      'EM capability-truth progression PRESENT (soft-wire).',
      'EM capability-truth absent.',
    ),
    classicalQuantBaseline: softWireFile(
      '../local-runtime/classical-quant-benchmark.ts',
      'Classical quant baseline PRESENT (required before quantum-inspired claims).',
      'Classical quant baseline absent — quantum comparison claims remain DENIED.',
    ),
  };
}

export function isHumanApprover(actor: Eo4Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isProposalAgent(actor: Eo4Actor): boolean {
  return actor.kind === 'proposal_agent';
}

/** Required capability record field names (contract inventory). */
export const CAPABILITY_RECORD_FIELDS = Object.freeze([
  'requirementId',
  'capabilityName',
  'xivModuleService',
  'evidenceState',
  'hardwareRuntimeDependency',
  'benchmarkTestEvidence',
  'classicalBaseline',
  'securityComplianceDependencies',
  'staffingPartnerDependency',
  'dataRequirements',
  'knownLimitations',
  'prototypeReadiness',
  'productionReadiness',
  'evidenceOwner',
  'lastVerifiedDate',
] as const);
