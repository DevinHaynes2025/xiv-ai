/**
 * 62L-EO5 — Quantum Evidence Boundary (park-and-implement child).
 *
 * Every quantum-related claim must carry an explicit evidence class so
 * government, enterprise, and research proposals never confuse simulation,
 * quantum-inspired optimization, or theory with verified physical-QPU performance.
 *
 * Soft-wire: EO4 AI & Quantum Capability Matrix (preferred predecessor);
 * EO3 watch / EO2 agency graph / EO1 command center / #159 EO umbrella when present.
 * Presence alone ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * No fabricate QPU access, fault-tolerant capability, quantum supremacy/advantage,
 * security clearance, government certification, classified access, or agency endorsement.
 * Quantum demos sandboxed; procurement claims need current evidence; contract
 * submissions human-approved. tip-land=NO. No PR from this phase.
 *
 * Next (report only): EO6 — Classical Baseline Requirement — reusable quantitative
 * benchmark framework that every advanced optimization, AI, and quantum experiment
 * must beat or justify before promotion.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_LABEL = '62L-EO5' as const;
export const GITHUB_SOT_TITLE =
  '62L-EO5 Quantum Evidence Boundary — evidence classes, classical baseline gate, proposal language gate, fabrication denies' as const;

/** Soft-wired predecessor issue refs (presence ≠ VERIFIED). */
export const SOFT_WIRE_EO_ISSUE = 159 as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO5_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO6 — Classical Baseline Requirement — reusable quantitative benchmark framework that every advanced optimization, AI, and quantum experiment must beat or justify before promotion.' as const;

/**
 * Required quantum evidence classes (hard taxonomy).
 * PHYSICAL_QPU_VERIFIED is strongest; THEORETICAL is weakest.
 */
export const QUANTUM_EVIDENCE_CLASSES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumEvidenceClass = (typeof QUANTUM_EVIDENCE_CLASSES)[number];

/** Stronger claim = higher rank. */
export function evidenceClassRank(cls: QuantumEvidenceClass): number {
  return QUANTUM_EVIDENCE_CLASSES.indexOf(cls);
}

/**
 * Artifact fields required on every quantum-related experiment / claim record.
 */
export const QUANTUM_EVIDENCE_ARTIFACT_FIELDS = [
  'experimentId',
  'problemDefinition',
  'algorithm',
  'evidenceClass',
  'dataset',
  'classicalBaseline',
  'backendProvider',
  'hardwareQpu',
  'runtime',
  'shotsOrIterations',
  'latency',
  'solutionQuality',
  'cost',
  'errorUncertainty',
  'reproducibilitySeed',
  'evidenceRefs',
  'verifiedAt',
] as const;

export type QuantumEvidenceArtifactField =
  (typeof QUANTUM_EVIDENCE_ARTIFACT_FIELDS)[number];

export type ClassicalBaselineFamily =
  | 'greedy_heuristic'
  | 'lp_ip'
  | 'constraint_programming'
  | 'graph_algorithms'
  | 'metaheuristics'
  | 'statistical_ml';

export const CLASSICAL_BASELINE_FAMILIES: readonly ClassicalBaselineFamily[] = [
  'greedy_heuristic',
  'lp_ip',
  'constraint_programming',
  'graph_algorithms',
  'metaheuristics',
  'statistical_ml',
] as const;

export type ClassicalComparisonDimension =
  | 'solution_quality'
  | 'runtime'
  | 'scaling'
  | 'memory'
  | 'reliability'
  | 'cost'
  | 'reproducibility';

export const CLASSICAL_COMPARISON_DIMENSIONS: readonly ClassicalComparisonDimension[] =
  [
    'solution_quality',
    'runtime',
    'scaling',
    'memory',
    'reliability',
    'cost',
    'reproducibility',
  ] as const;

export type ClassicalBaselineRecord = {
  present: boolean;
  families: readonly ClassicalBaselineFamily[];
  sameProblemDataset: boolean;
  comparisons: readonly ClassicalComparisonDimension[];
  notes?: string;
};

export type QuantumEvidenceArtifact = {
  experimentId: string;
  problemDefinition: string;
  algorithm: string;
  evidenceClass: QuantumEvidenceClass;
  dataset: string;
  classicalBaseline: ClassicalBaselineRecord;
  backendProvider: string | null;
  hardwareQpu: string | null;
  runtime: string | null;
  shotsOrIterations: number | null;
  latency: string | null;
  solutionQuality: string | null;
  cost: string | null;
  errorUncertainty: string | null;
  reproducibilitySeed: string | null;
  evidenceRefs: readonly string[];
  verifiedAt: string | null;
};

/** Allowed proposal phrasing keyed by evidence class. */
export const ALLOWED_LANGUAGE_BY_EVIDENCE_CLASS = Object.freeze({
  THEORETICAL:
    'researching a quantum formulation…',
  SIMULATED:
    'reproduced the circuit in a classical quantum simulator…',
  QUANTUM_INSPIRED:
    'tested quantum-inspired method against classical baselines…',
  PHYSICAL_QPU_VERIFIED:
    'executed on authorized physical quantum backend with retained reproducible job evidence…',
} as const satisfies Record<QuantumEvidenceClass, string>);

/**
 * Blocked proposal phrases unless PHYSICAL_QPU_VERIFIED + retained evidence +
 * classical baseline improvement is proven (still never auto-claimed here).
 */
export const BLOCKED_PROPOSAL_PHRASES = [
  'quantum advantage achieved',
  'quantum supremacy',
  'demonstrated quantum supremacy',
  'fault-tolerant quantum computer',
  'fault tolerant capability',
  'we have qpu access',
  'fabricated qpu access',
  'security clearance held',
  'government certified',
  'government certification',
  'classified access',
  'agency endorsement',
  'official nist partnership',
  'official nsf partnership',
  'official doe partnership',
] as const;

export const QUANTUM_EVIDENCE_BOUNDARY_CYCLE = [
  'honesty_locks',
  'evidence_boundary_bootstrap',
  // A — taxonomy + artifact contract
  'evidence_class_taxonomy',
  'artifact_fields_encoded',
  // B — classical baseline gate (hard)
  'classical_baseline_required',
  'classical_families_encoded',
  'classical_comparison_dimensions',
  'deny_improvement_without_baseline',
  // C — proposal language gate (hard)
  'allowed_language_by_state',
  'block_advantage_phrases',
  'language_gate_enforce',
  // D — fabrication / government safeguards
  'deny_fabricate_qpu_access',
  'deny_fabricate_fault_tolerance',
  'deny_fabricate_supremacy_advantage',
  'deny_fabricate_clearance',
  'deny_fabricate_certification',
  'deny_fabricate_classified_access',
  'deny_fabricate_agency_endorsement',
  'quantum_demos_sandboxed',
  'procurement_claims_need_current_evidence',
  'contract_submissions_human_approved',
  // E — soft-wire EO4 matrix + predecessors
  'eo4_capability_matrix_soft_wire',
  'eo3_watch_soft_wire',
  'eo2_agency_graph_soft_wire',
  'eo1_command_center_soft_wire',
  'eo159_umbrella_soft_wire',
  'classical_quant_baseline_soft_wire',
  'l4_autonomy_false',
  'evidence',
] as const;

export type Eo5Hop = (typeof QUANTUM_EVIDENCE_BOUNDARY_CYCLE)[number];

export type Eo5EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'DENIED'
  | 'BLOCKED'
  | 'SANDBOXED'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'NOT_APPLIED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'THEORETICAL'
  | 'SIMULATED'
  | 'QUANTUM_INSPIRED'
  | 'PHYSICAL_QPU_VERIFIED';

export type Eo5HopRecord = {
  hop: Eo5Hop;
  state: Eo5EvidenceState;
  summary: string;
  at: string;
};

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo5SoftWireSnapshot = {
  eo4CapabilityMatrix: SoftWirePresence;
  eo4CapabilityMatrixReport: SoftWirePresence;
  eo3Watch: SoftWirePresence;
  eo3WatchReport: SoftWirePresence;
  eo2AgencyGraph: SoftWirePresence;
  eo2AgencyGraphReport: SoftWirePresence;
  eo1CommandCenter: SoftWirePresence;
  eo1CommandCenterReport: SoftWirePresence;
  eoUmbrella: SoftWirePresence;
  eoUmbrellaReport: SoftWirePresence;
  classicalQuantBaseline: SoftWirePresence;
  enDealContractOs: SoftWirePresence;
};

export const EO5_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_EVIDENCE_BOUNDARY_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Classical baseline hard gate
  QUANTUM_IMPROVEMENT_WITHOUT_CLASSICAL_BASELINE: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,
  SIMULATED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  THEORETICAL_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QPU: false as const,
  DETECTED_EQ_VERIFIED: false as const,

  // Language / proposal gate
  ALLOW_BLOCKED_PROPOSAL_PHRASES: false as const,
  AUTO_CLAIM_QUANTUM_ADVANTAGE: false as const,
  AUTO_CLAIM_QUANTUM_SUPREMACY: false as const,

  // Fabrication denies (government safeguards)
  FABRICATE_QPU_ACCESS: false as const,
  FABRICATE_FAULT_TOLERANCE: false as const,
  FABRICATE_QUANTUM_SUPREMACY: false as const,
  FABRICATE_QUANTUM_ADVANTAGE: false as const,
  FABRICATE_SECURITY_CLEARANCE: false as const,
  FABRICATE_GOVERNMENT_CERTIFICATION: false as const,
  FABRICATE_CLASSIFIED_ACCESS: false as const,
  FABRICATE_AGENCY_ENDORSEMENT: false as const,

  // Operational safeguards
  QUANTUM_DEMOS_UNSANDBOXED: false as const,
  PROCUREMENT_CLAIM_WITHOUT_CURRENT_EVIDENCE: false as const,
  AUTO_CONTRACT_SUBMISSION: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_BID: false as const,
  EVIDENCE_LABEL_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Human gates
  HUMAN_APPROVAL_REQUIRED_FOR_CONTRACT_SUBMISSION: true as const,
  HUMAN_APPROVAL_REQUIRED_FOR_PROCUREMENT_CLAIMS: true as const,
});

export const EO5_MAY = Object.freeze([
  'label_quantum_claims_with_evidence_class',
  'record_quantum_evidence_artifacts',
  'require_classical_baselines_before_improvement_claims',
  'gate_proposal_language_by_evidence_class',
  'sandbox_quantum_demos',
  'soft_wire_eo4_capability_matrix',
] as const);

export const EO5_MUST_NOT = Object.freeze([
  'claim_quantum_improvement_without_classical_baseline',
  'use_blocked_advantage_phrases_without_evidence',
  'fabricate_qpu_access_fault_tolerance_supremacy_advantage',
  'fabricate_clearance_certification_classified_agency_endorsement',
  'unsandbox_quantum_demos',
  'auto_submit_contracts',
  'treat_simulated_as_physical_qpu_verified',
] as const);

export function assertEo5LocksIntact(): boolean {
  return (
    EO5_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO5_LOCKS.QUANTUM_IMPROVEMENT_WITHOUT_CLASSICAL_BASELINE === false &&
    EO5_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
    EO5_LOCKS.SIMULATED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO5_LOCKS.THEORETICAL_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO5_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QPU === false &&
    EO5_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EO5_LOCKS.ALLOW_BLOCKED_PROPOSAL_PHRASES === false &&
    EO5_LOCKS.AUTO_CLAIM_QUANTUM_ADVANTAGE === false &&
    EO5_LOCKS.AUTO_CLAIM_QUANTUM_SUPREMACY === false &&
    EO5_LOCKS.FABRICATE_QPU_ACCESS === false &&
    EO5_LOCKS.FABRICATE_FAULT_TOLERANCE === false &&
    EO5_LOCKS.FABRICATE_QUANTUM_SUPREMACY === false &&
    EO5_LOCKS.FABRICATE_QUANTUM_ADVANTAGE === false &&
    EO5_LOCKS.FABRICATE_SECURITY_CLEARANCE === false &&
    EO5_LOCKS.FABRICATE_GOVERNMENT_CERTIFICATION === false &&
    EO5_LOCKS.FABRICATE_CLASSIFIED_ACCESS === false &&
    EO5_LOCKS.FABRICATE_AGENCY_ENDORSEMENT === false &&
    EO5_LOCKS.QUANTUM_DEMOS_UNSANDBOXED === false &&
    EO5_LOCKS.PROCUREMENT_CLAIM_WITHOUT_CURRENT_EVIDENCE === false &&
    EO5_LOCKS.AUTO_CONTRACT_SUBMISSION === false &&
    EO5_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO5_LOCKS.RECOMMEND_EQ_BID === false &&
    EO5_LOCKS.EVIDENCE_LABEL_EQ_PRODUCTION_AUTHORIZED === false &&
    EO5_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO5_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO5_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO5_LOCKS.HUMAN_APPROVAL_REQUIRED_FOR_CONTRACT_SUBMISSION === true &&
    EO5_LOCKS.HUMAN_APPROVAL_REQUIRED_FOR_PROCUREMENT_CLAIMS === true &&
    EO5_LOCKS.TIP_LAND === false &&
    EO5_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO5_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO5_LOCKS.FULL_PRODUCTION_EVIDENCE_BOUNDARY_SHIPPED === false &&
    EO5_LOCKS.MANAGE_PULL_REQUEST === false
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
 * Soft-wire EO4 capability matrix (preferred) plus EO3/EO2/EO1/#159/EN/classical
 * baseline when present. Presence alone ≠ VERIFIED.
 */
export function eo5SoftWireSnapshot(repoRoot?: string): Eo5SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo4CapabilityMatrix: softWireFile(
      './ai-quantum-capability-matrix.ts',
      'EO4 AI & Quantum Capability Matrix PRESENT (soft-wire).',
      'EO4 AI & Quantum Capability Matrix absent — soft-wire WAITING_DATA.',
    ),
    eo4CapabilityMatrixReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EO4_AI_QUANTUM_CAPABILITY_MATRIX_REPORT.md',
      'EO4 capability matrix report PRESENT.',
      'EO4 capability matrix report absent — soft-wire WAITING_DATA.',
    ),
    eo3Watch: softWireFile(
      './quantum-mission-opportunity-watch.ts',
      'EO3 Quantum Mission Opportunity Watch PRESENT (soft-wire).',
      'EO3 Quantum Mission Opportunity Watch absent — soft-wire WAITING_DATA.',
    ),
    eo3WatchReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EO3_QUANTUM_MISSION_OPPORTUNITY_WATCH_REPORT.md',
      'EO3 watch report PRESENT.',
      'EO3 watch report absent — soft-wire WAITING_DATA.',
    ),
    eo2AgencyGraph: softWireFile(
      './government-agency-knowledge-graph.ts',
      'EO2 Government Agency Knowledge Graph PRESENT (soft-wire).',
      'EO2 Agency Knowledge Graph absent — soft-wire WAITING_DATA.',
    ),
    eo2AgencyGraphReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EO2_GOVERNMENT_AGENCY_KNOWLEDGE_GRAPH_REPORT.md',
      'EO2 Agency Graph report PRESENT.',
      'EO2 Agency Graph report absent — soft-wire WAITING_DATA.',
    ),
    eo1CommandCenter: softWireFile(
      './government-contracts-command-center.ts',
      'EO1 Government Contracts Command Center PRESENT (soft-wire).',
      'EO1 Government Contracts Command Center absent — soft-wire WAITING_DATA.',
    ),
    eo1CommandCenterReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EO1_GOVERNMENT_CONTRACTS_COMMAND_CENTER_REPORT.md',
      'EO1 Command Center report PRESENT.',
      'EO1 Command Center report absent — soft-wire WAITING_DATA.',
    ),
    eoUmbrella: softWireFile(
      './government-quantum-ai-mission-os.ts',
      'EO #159 Government Quantum AI Mission OS PRESENT (soft-wire).',
      'EO #159 umbrella absent — soft-wire WAITING_DATA.',
    ),
    eoUmbrellaReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EO_GOVERNMENT_QUANTUM_AI_MISSION_OS_REPORT.md',
      'EO #159 umbrella report PRESENT.',
      'EO #159 umbrella report absent — soft-wire WAITING_DATA.',
    ),
    classicalQuantBaseline: softWireFile(
      '../local-runtime/classical-quant-benchmark.ts',
      'Classical quant baseline PRESENT (required before improvement claims).',
      'Classical quant baseline absent — improvement claims remain DENIED.',
    ),
    enDealContractOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN Deal & Contract Intelligence OS PRESENT (soft-wire).',
      'EN Deal & Contract Intelligence OS absent — soft-wire no-op.',
    ),
  };
}
