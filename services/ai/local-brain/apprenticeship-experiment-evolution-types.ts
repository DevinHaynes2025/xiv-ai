import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BT — AI Engineering Apprenticeship Network + Continuous Code Experiment Factory +
 * Architecture Puzzle Laboratory + Cross-Language Refactoring Engine +
 * Superbrain Software Evolution Graph contracts.
 *
 * SoT: GitHub #84. GitLab #18 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Mentor/apprentice cannot transfer or expand production authority.
 * Experiments are sandboxed; success ≠ auto-merge/deploy.
 * Cross-language refactor requires behavior-equivalence evidence.
 * Failed experiments preserved as negative knowledge with provenance.
 * No private hidden reasoning traces — auditable artifacts only.
 * Learning/skill ≠ permission grant; Founder-sealed deny-by-default.
 */

export const APPRENTICESHIP_EXPERIMENT_EVOLUTION_CYCLE = [
  'honesty_locks',
  'apprenticeship_pair_session',
  'apprentice_permission_transfer_deny',
  'guided_debugging_workcell',
  'experiment_sandbox_open',
  'experiment_apply_to_main_deny',
  'negative_knowledge_preserve',
  'negative_knowledge_block_reproposal',
  'architecture_puzzle_decompose',
  'puzzle_hop_depth_bounds',
  'cross_language_refactor_candidate',
  'behavior_equivalence_gate',
  'unverified_refactor_not_verified',
  'evolution_graph_record',
  'provenance_link_cortex',
  'hidden_reasoning_trace_reject',
  'evidence',
] as const;

export type BtHop = (typeof APPRENTICESHIP_EXPERIMENT_EVOLUTION_CYCLE)[number];

export type BtEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'REJECTED'
  | 'FAILED'
  | 'SANDBOXED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED'
  | 'PREVIOUSLY_FAILED';

export type BtHopRecord = {
  hop: BtHop;
  state: BtEvidenceState;
  summary: string;
  at: string;
};

export const BT_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  APPRENTICE_GAINS_MENTOR_PERMISSIONS: false as const,
  APPRENTICE_GAINS_PRODUCTION_AUTHORITY: false as const,
  MENTOR_TRANSFERS_PRODUCTION_AUTHORITY: false as const,
  PAIR_SESSION_EXPANDS_AUTHORITY: false as const,
  EXPERIMENT_AUTO_MERGE: false as const,
  EXPERIMENT_AUTO_DEPLOY: false as const,
  EXPERIMENT_APPLY_TO_MAIN_WITHOUT_REVIEW: false as const,
  SUCCESS_EQUALS_AUTO_MERGE: false as const,
  FAILED_EXPERIMENT_DISCARDED: false as const,
  FAILED_EXPERIMENT_AUTO_BEST_PRACTICE: false as const,
  REFACTOR_VERIFIED_WITHOUT_EQUIVALENCE: false as const,
  HIDDEN_REASONING_TRACES_ALLOWED: false as const,
  LEARNING_IS_PERMISSION_GRANT: false as const,
  SKILL_IS_PERMISSION_GRANT: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  EXPERIMENTS_SANDBOXED: true as const,
  NEGATIVE_KNOWLEDGE_PRESERVED: true as const,
  AUDITABLE_ARTIFACTS_ONLY: true as const,
  BEHAVIOR_EQUIVALENCE_REQUIRED_FOR_VERIFIED: true as const,
  PUZZLE_DECOMPOSITION_BOUNDED: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-BU — AI Code Research Institute + Automated Benchmark Arena + Cross-Language Compiler Intelligence + Software Design Pattern Genome + Superbrain Engineering Strategy Cortex' as const;

export const GITHUB_SOT_ISSUE = 84 as const;
export const GITLAB_COORDINATION_ISSUE = 18 as const;

export const APPRENTICE_PERMISSION_TRANSFER_DENIED = 'APPRENTICE_CANNOT_GAIN_MENTOR_OR_PRODUCTION_PERMISSIONS';
export const EXPERIMENT_APPLY_TO_MAIN_DENIED = 'EXPERIMENT_APPLY_TO_MAIN_DENIED_WITHOUT_REVIEW_GATE';
export const NEGATIVE_KNOWLEDGE_STORED = 'FAILED_EXPERIMENT_STORED_AS_NEGATIVE_KNOWLEDGE';
export const REFACTOR_NOT_VERIFIED_WITHOUT_EQUIVALENCE =
  'REFACTOR_WITHOUT_BEHAVIOR_EQUIVALENCE_NOT_VERIFIED';
export const PUZZLE_BOUNDS_EXCEEDED = 'ARCHITECTURE_PUZZLE_HOP_OR_DEPTH_BOUNDS_EXCEEDED';
export const HIDDEN_REASONING_TRACE_REJECTED = 'HIDDEN_REASONING_TRACE_REJECTED';
export const NEGATIVE_KNOWLEDGE_BLOCKS_REPROPOSAL = 'NEGATIVE_KNOWLEDGE_BLOCKS_OR_MARKS_PREVIOUSLY_FAILED';

/** Default max architecture puzzle decomposition depth (bounded; not infinite). */
export const DEFAULT_PUZZLE_MAX_DEPTH = 4 as const;
/** Default max hops for puzzle decomposition. */
export const DEFAULT_PUZZLE_MAX_HOPS = 8 as const;

export type AgentRoleInPair = 'mentor' | 'apprentice';

export type PermissionTier = 'none' | 'sandbox' | 'review' | 'mentor' | 'production';

export type ExperimentStatus =
  | 'proposed'
  | 'running_sandboxed'
  | 'succeeded_sandboxed'
  | 'failed'
  | 'rejected'
  | 'negative_knowledge'
  | 'awaiting_review'
  | 'apply_denied';

export type RefactorVerificationLabel = 'CANDIDATE' | 'IMPLEMENTED' | 'VERIFIED' | 'REJECTED';

export type EvolutionNodeKind =
  | 'code'
  | 'api'
  | 'test'
  | 'bug'
  | 'fix'
  | 'tool'
  | 'skill'
  | 'experiment'
  | 'architecture_change'
  | 'negative_knowledge'
  | 'engineering_memory_link';

export type ProvenanceKind =
  | 'evidence_ref'
  | 'cortex_trace'
  | 'experiment_id'
  | 'pair_session'
  | 'refactor_candidate'
  | 'puzzle_node'
  | 'learning_ledger';

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()) {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  return {
    BS: {
      tipProbe: (has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'Preferred BS tip cursor/62l-bs-engineering-university-memory-cortex-4059 + report; WAITING_DATA until pushed.',
    },
    BR: {
      tipProbe: (has('62L_BR_CODE_INTELLIGENCE_ENGINEERING_MEMORY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BR_CODE_INTELLIGENCE_ENGINEERING_MEMORY_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'Preferred BR tip; WAITING_DATA until pushed with report.',
    },
    BQ: {
      tipProbe: (has('62L_BQ_REPORT.md') || has('62L_BQ_SOFTWARE_ENGINEERING_INTELLIGENCE_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report:
        has('62L_BQ_REPORT.md') || has('62L_BQ_SOFTWARE_ENGINEERING_INTELLIGENCE_REPORT.md')
          ? ('PRESENT' as const)
          : ('MISSING' as const),
      note: 'BQ tip; WAITING_DATA in preference chain.',
    },
    BP: {
      tipProbe: (has('62L_BP_SUPERBRAIN_COGNITIVE_HOMEOSTASIS_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BP_SUPERBRAIN_COGNITIVE_HOMEOSTASIS_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BP tip; WAITING_DATA in preference chain.',
    },
    BO: {
      tipProbe: (has('62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BO tip used as base when BS→BP still WAITING_DATA after fetch with backoff.',
    },
    BN: {
      tipProbe: (has('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BN tip; WAITING_DATA.',
    },
    BM: {
      tipProbe: (has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BM tip may be present on origin; preference BO > BM when BO available.',
    },
    BL: {
      tipProbe: (has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BL ancestor on BO tip.',
    },
    BK: {
      tipProbe: (has('62L_BK_SUPERBRAIN_COEXISTENCE_CODING_MESH_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BK_SUPERBRAIN_COEXISTENCE_CODING_MESH_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BK coding mesh ancestor available for apprenticeship workcell patterns.',
    },
    BJ: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BJ ancestor.',
    },
    BD: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BD ancestor.',
    },
    BA: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BA ancestor.',
    },
    AY: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'AY ancestor.',
    },
    AX: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'AX ancestor.',
    },
  };
}

export function githubIssueSot() {
  return {
    githubIssue: GITHUB_SOT_ISSUE,
    githubRole: 'implementation_source_of_truth' as const,
    gitlabIssue: GITLAB_COORDINATION_ISSUE,
    gitlabRole: 'coordination_only' as const,
    note: 'GitHub #84 is SoT; GitLab #18 is coordination only. Issue API may be unreadable.',
  };
}
