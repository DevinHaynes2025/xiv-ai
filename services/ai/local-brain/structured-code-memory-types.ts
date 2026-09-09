import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BR — Structured Code Memory + AI Debugging Academy + Engineering Notebook
 * + Self-Learning Workcells + Superbrain Software Knowledge Compiler.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Auditable-memory policy: record evidence, hypotheses, decisions, commands/results,
 * lessons, provenance, and outcomes only. Do NOT store private hidden reasoning
 * traces / private chain-of-thought. Hypothesis ≠ root cause until verified.
 * Learning / skill ≠ permission grant. Council recommendation ≠ auto-merge/deploy.
 */

export const STRUCTURED_CODE_MEMORY_CYCLE = [
  'codebase_map',
  'architecture_decision_record',
  'failed_approach_retain',
  'bug_reproduce',
  'competing_hypotheses',
  'debug_council_convene',
  'regression_test_generate',
  'bottleneck_identify',
  'notebook_artifact_seal',
  'hidden_trace_reject',
  'verified_outcome_gate',
  'workcell_bounded_update',
  'knowledge_compile_candidate',
  'permission_non_escalation',
  'council_recommend_only',
  'evidence',
  'learning',
] as const;

export type BrHop = (typeof STRUCTURED_CODE_MEMORY_CYCLE)[number];

export type BrEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'HYPOTHESIS'
  | 'REJECTED'
  | 'FAILED'
  | 'CANDIDATE_UNDER_REVIEW';

export type BrHopRecord = {
  hop: BrHop;
  state: BrEvidenceState;
  summary: string;
  at: string;
};

export const BR_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  INVENTED_PASS: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  STORE_HIDDEN_REASONING_TRACES: false as const,
  STORE_PRIVATE_CHAIN_OF_THOUGHT: false as const,
  HYPOTHESIS_EQUALS_ROOT_CAUSE: false as const,
  CORRELATION_EQUALS_CAUSATION: false as const,
  LEARNING_IS_PERMISSION_GRANT: false as const,
  SKILL_IS_PERMISSION_GRANT: false as const,
  EXERCISE_IS_PERMISSION_GRANT: false as const,
  COUNCIL_AUTO_MERGE: false as const,
  COUNCIL_AUTO_DEPLOY: false as const,
  UNVERIFIED_FIX_TRUSTED_KNOWLEDGE: false as const,
  WORKCELL_SELF_EXPANDS_AUTHORITY: false as const,
  COMPILER_SILENT_PRODUCTION_AUTHORITY: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FAILED_APPROACHES_DISCARDED: false as const,
  LEARN_FROM_VERIFIED_OUTCOMES_ONLY: true as const,
  AUDITABLE_ARTIFACTS_ONLY: true as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
});

/** Forbidden private CoT / hidden-trace field names (stripped or DENIED). */
export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export const HIDDEN_TRACE_DENIED = 'HIDDEN_REASONING_TRACE_DENIED';
export const UNVERIFIED_NOT_TRUSTED = 'UNVERIFIED_FIX_NOT_TRUSTED_KNOWLEDGE';
export const FAILED_APPROACH_RETAINED = 'FAILED_APPROACH_RETAINED';
export const COUNCIL_RECOMMENDATION_ONLY = 'COUNCIL_RECOMMENDATION_NOT_AUTO_MERGE';
export const SKILL_NO_PERMISSION_ESCALATION = 'SKILL_OR_EXERCISE_NO_PERMISSION_ESCALATION';
export const HYPOTHESIS_UNTIL_VERIFIED = 'HYPOTHESIS_UNTIL_VERIFIED_EVIDENCE';
export const WORKCELL_AUTHORITY_BOUNDED = 'WORKCELL_NO_AUTHORITY_SELF_EXPANSION';
export const COMPILER_CANDIDATE_ONLY = 'COMPILER_OUTPUT_CANDIDATE_UNDER_REVIEW';

export const NEXT_PHASE_TITLE =
  '62L-BS — AI Software Engineering University + Autonomous Test Laboratory + Code Architecture Evolution + Multi-Agent Code Review Council + Superbrain Engineering Memory Cortex';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const AUDITABLE_MEMORY_POLICY = Object.freeze({
  allowedArtifactKinds: [
    'evidence',
    'hypothesis',
    'decision',
    'command_result',
    'lesson',
    'provenance',
    'outcome',
    'architecture_decision',
    'failed_approach',
    'regression_test_candidate',
    'bottleneck_note',
    'debug_exercise_candidate',
    'skill_candidate',
    'test_helper_candidate',
    'tool_candidate',
  ] as const,
  forbidden: FORBIDDEN_PRIVATE_FIELDS,
  storeHiddenReasoningTraces: false as const,
  note: 'Auditable engineering artifacts only — no private hidden CoT / reasoning traces.',
});

export type PredecessorId =
  | 'BQ'
  | 'BP'
  | 'BO'
  | 'BN'
  | 'BM'
  | 'BL'
  | 'BK'
  | 'BJ'
  | 'BI'
  | 'BH'
  | 'BG'
  | 'BF'
  | 'BE'
  | 'BD'
  | 'BB'
  | 'BA'
  | 'AZ'
  | 'AY'
  | 'AX';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  BQ: 'polyglot-coding-civilization.ts',
  BP: 'cognitive-homeostasis-runtime.ts',
  BO: 'superbrain-neuroplasticity-runtime.ts',
  BN: 'superbrain-neural-growth-runtime.ts',
  BM: 'org-neural-federation-runtime.ts',
  BL: 'org-agent-universe-runtime.ts',
  BK: 'superbrain-coexistence-runtime.ts',
  BJ: 'global-operations-brain-runtime.ts',
  BI: 'superbrain-global-ops-brain-root.ts',
  BH: 'offline-research-civilization.ts',
  BG: 'trillion-path-agent-university.ts',
  BF: 'offline-first-superintelligence-os.ts',
  BE: 'offline-superintelligence-fabric.ts',
  BD: 'cognitive-memory-runtime.ts',
  BB: 'adaptive-compute-fabric.ts',
  BA: 'neural-database-runtime.ts',
  AZ: 'sovereign-identity-kernel.ts',
  AY: 'growth-media-runtime.ts',
  AX: 'sovereign-sealed-runtime.ts',
};

const PREDECESSOR_REPORTS: Record<PredecessorId, string> = {
  BQ: '62L_BQ_POLYGLOT_CODING_CIVILIZATION_REPORT.md',
  BP: '62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md',
  BO: '62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md',
  BN: '62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md',
  BM: '62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md',
  BL: '62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md',
  BK: '62L_BK_SUPERBRAIN_COEXISTENCE_CODING_MESH_REPORT.md',
  BJ: '62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md',
  BI: '62L_BI_SUPERBRAIN_GLOBAL_OPS_BRAIN_ROOT_REPORT.md',
  BH: '62L_BH_OFFLINE_RESEARCH_CIVILIZATION_REPORT.md',
  BG: '62L_BG_TRILLION_PATH_AGENT_UNIVERSITY_REPORT.md',
  BF: '62L_BF_OFFLINE_FIRST_SUPERINTELLIGENCE_OS_REPORT.md',
  BE: '62L_BE_OFFLINE_SUPERINTELLIGENCE_FABRIC_REPORT.md',
  BD: '62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md',
  BB: '62L_BB_ADAPTIVE_COMPUTE_FABRIC_SCHEDULER_REPORT.md',
  BA: '62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md',
  AZ: '62L_AZ_SOVEREIGN_IDENTITY_KERNEL_REPORT.md',
  AY: '62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md',
  AX: '62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md',
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): BrEvidenceState {
  return existsSync(join(cwd, 'docs', 'operations', PREDECESSOR_REPORTS[id]))
    ? 'PASS'
    : 'WAITING_DATA';
}

export function predecessorMap(cwd = process.cwd()) {
  const ids = Object.keys(PREDECESSOR_MODULES) as PredecessorId[];
  return Object.fromEntries(
    ids.map((id) => [
      id,
      {
        module: predecessorModuleState(id),
        report: predecessorReportState(cwd, id),
        path: PREDECESSOR_MODULES[id],
        reportFile: PREDECESSOR_REPORTS[id],
      },
    ]),
  ) as Record<
    PredecessorId,
    {
      module: 'AVAILABLE' | 'WAITING_DATA';
      report: BrEvidenceState;
      path: string;
      reportFile: string;
    }
  >;
}

export type BrActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'coder_agent'
  | 'tester_agent'
  | 'security_agent'
  | 'skeptic_agent'
  | 'workcell'
  | 'compiler'
  | 'ordinary_agent'
  | 'impersonator';

export type BrActor = {
  kind: BrActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role?: string;
};

export type HypothesisStatus = 'hypothesis' | 'supported' | 'refuted' | 'verified_root_cause';
export type ApproachStatus = 'active' | 'failed' | 'rejected' | 'superseded' | 'verified';
export type KnowledgeTrust = 'untrusted' | 'candidate_under_review' | 'verified_reusable';
export type CouncilRole = 'coder' | 'tester' | 'security' | 'skeptic';

export type AuditableArtifactKind = (typeof AUDITABLE_MEMORY_POLICY.allowedArtifactKinds)[number];
