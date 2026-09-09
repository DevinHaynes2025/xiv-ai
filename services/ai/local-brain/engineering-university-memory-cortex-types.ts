import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BS — AI Software Engineering University + Autonomous Test Laboratory +
 * Code Architecture Evolution + Multi-Agent Code Review Council +
 * Superbrain Engineering Memory Cortex contracts.
 *
 * SoT: GitHub #83. GitLab #17 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Skill certification ≠ permission/authority grant; learning ≠ self-escalation.
 * Refactor/architecture candidates ≠ auto-merge/deploy.
 * Review council = recommendation only.
 * No private hidden reasoning traces — auditable engineering artifacts only
 * (reuse BR Software Knowledge Compiler / notebooks policy when BR present).
 * Flaky/regression/drift detections are evidence-labeled; false positives possible
 * → not auto production block without policy.
 * Founder-sealed deny-by-default.
 */

export const ENGINEERING_UNIVERSITY_MEMORY_CORTEX_CYCLE = [
  'honesty_locks',
  'curriculum_bind',
  'kata_lab_exam',
  'skill_certify',
  'skill_decay_retrain',
  'skill_not_permission_lock',
  'test_lab_bounded_run',
  'regression_detect',
  'flaky_suspect_label',
  'architecture_drift_signal',
  'refactor_candidate_gate',
  'evolution_proposal_review',
  'review_council_convene',
  'review_recommendation_only',
  'auto_merge_deny',
  'memory_cortex_link',
  'hidden_reasoning_reject',
  'unverified_not_promoted',
  'evidence',
] as const;

export type BsHop = (typeof ENGINEERING_UNIVERSITY_MEMORY_CORTEX_CYCLE)[number];

export type BsEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'RECOMMENDATION_ONLY'
  | 'SUSPECTED'
  | 'VERIFIED'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'PRODUCTION_AUTHORIZED'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE';

export type BsHopRecord = {
  hop: BsHop;
  state: BsEvidenceState;
  summary: string;
  at: string;
};

export const BS_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  SKILL_CERTIFICATION_IS_PERMISSION_GRANT: false as const,
  SKILL_CERTIFICATION_IS_AUTHORITY_GRANT: false as const,
  LEARNING_IS_SELF_ESCALATION: false as const,
  REVIEW_COUNCIL_AUTO_MERGE: false as const,
  REFACTOR_CANDIDATE_AUTO_APPLY: false as const,
  ARCHITECTURE_DRIFT_AUTO_DEPLOY: false as const,
  HIDDEN_REASONING_TRACES_ALLOWED: false as const,
  UNVERIFIED_OUTCOME_PROMOTED_TO_TRUSTED: false as const,
  FLAKY_AUTO_PRODUCTION_BLOCK: false as const,
  UNBOUNDED_CI_MUTATION_OF_PRODUCTION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
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
  '62L-BT — AI Engineering Apprenticeship Network + Continuous Code Experiment Factory + Architecture Puzzle Laboratory + Cross-Language Refactoring Engine + Superbrain Software Evolution Graph' as const;

export const GITHUB_SOT_ISSUE = 83 as const;
export const GITLAB_COORDINATION_ISSUE = 17 as const;

export const SKILL_CERT_NOT_PERMISSION = 'SKILL_CERTIFICATION_IS_NOT_PERMISSION_GRANT';
export const SKILL_DECAY_RETRAIN_REQUIRED = 'SKILL_DECAY_RETRAINING_REQUIRED_BEFORE_TRUSTED_USE';
export const REVIEW_AUTO_MERGE_DENIED = 'REVIEW_COUNCIL_CANNOT_AUTO_MERGE';
export const REFACTOR_REMAINS_CANDIDATE = 'REFACTOR_CANDIDATE_NOT_APPLIED';
export const DRIFT_NO_AUTO_DEPLOY = 'ARCHITECTURE_DRIFT_DOES_NOT_AUTO_DEPLOY';
export const HIDDEN_REASONING_REJECTED = 'HIDDEN_REASONING_TRACE_REJECTED';
export const UNVERIFIED_NOT_PROMOTED = 'UNVERIFIED_OUTCOME_NOT_PROMOTED_TO_TRUSTED_CORTEX';
export const FLAKE_SUSPECTED_UNTIL_VERIFIED = 'FLAKY_TEST_LABELED_SUSPECTED_UNTIL_VERIFIED';

export type OutcomeVerification =
  | 'verified'
  | 'unverified'
  | 'forecast'
  | 'simulation'
  | 'recommendation'
  | 'suspected';

export type SkillTrustState = 'trusted' | 'stale' | 'decayed' | 'retraining_required' | 'uncertified';

export type ReviewCouncilRole = 'coder' | 'tester' | 'security' | 'skeptic';

export type EngineeringLinkKind =
  | 'code_note'
  | 'bug'
  | 'fix'
  | 'architecture_decision'
  | 'test'
  | 'review'
  | 'pattern'
  | 'failure'
  | 'agent_skill'
  | 'outcome';

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()) {
  const ops = join(root, 'docs/operations');
  const lb = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));
  const hasOps = (file: string) => has(ops, file);
  const hasLb = (file: string) => has(lb, file);
  const brModules =
    hasLb('structured-code-memory.ts') &&
    hasLb('engineering-notebook.ts') &&
    hasLb('superbrain-software-knowledge-compiler.ts');
  return {
    BR: {
      tipProbe: (brModules || hasOps('62L_BR_STRUCTURED_CODE_MEMORY_DEBUG_ACADEMY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: hasOps('62L_BR_STRUCTURED_CODE_MEMORY_DEBUG_ACADEMY_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'Preferred BR tip cursor/62l-br-structured-code-memory-debug-academy-4059 + report; modules may be PRESENT while report still WAITING_DATA. Extends BR code-memory/compiler/notebook.',
    },
    BQ: {
      tipProbe: (hasOps('62L_BQ_SOFTWARE_FACTORY_CODE_INTELLIGENCE_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: hasOps('62L_BQ_SOFTWARE_FACTORY_CODE_INTELLIGENCE_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'Preferred BQ tip absent or report missing after fetch with backoff.',
    },
    BP: {
      tipProbe: (hasOps('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md') ||
        hasOps('62L_BP_SUPERBRAIN_COGNITIVE_HOMEOSTASIS_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report:
        hasOps('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md') ||
        hasOps('62L_BP_SUPERBRAIN_COGNITIVE_HOMEOSTASIS_REPORT.md')
          ? ('PRESENT' as const)
          : ('MISSING' as const),
      note: 'Preferred BP tip may be on origin; in-tree report PRESENT only when landed on base.',
    },
    BO: {
      tipProbe: (hasOps('62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md') ||
        hasLb('superbrain-neuroplasticity-runtime.ts')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: hasOps('62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BO tip + report preferred when BR/BQ/BP still WAITING_DATA; may be parallel lineage vs BR.',
    },
    BN: {
      tipProbe: (hasOps('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: hasOps('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BN tip may remain WAITING_DATA on BR base; preference BR→BQ→BP→BO→BN→BM→BL.',
    },
    BM: {
      tipProbe: (hasOps('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: hasOps('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BM tip may be present on origin; preference order may select BR/BO over BM.',
    },
    BL: {
      tipProbe: (hasOps('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: hasOps('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BL ancestor of BR tip used as base.',
    },
    BJ: {
      tipProbe: 'PRESENT' as const,
      report: hasOps('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BJ ancestor / included on BL tip.',
    },
    BD: {
      tipProbe: 'PRESENT' as const,
      report: hasOps('62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BD ancestor.',
    },
    BA: {
      tipProbe: 'PRESENT' as const,
      report: hasOps('62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BA ancestor.',
    },
    AY: {
      tipProbe: 'PRESENT' as const,
      report: hasOps('62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'AY ancestor.',
    },
    AX: {
      tipProbe: 'PRESENT' as const,
      report: hasOps('62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md')
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
    note: 'GitHub #83 is SoT; GitLab #17 is coordination only. Issue API may be unreadable.',
  };
}
