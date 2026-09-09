import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BU — AI Code Research Institute + Automated Benchmark Arena +
 * Cross-Language Compiler Intelligence + Software Design Pattern Genome +
 * Superbrain Engineering Strategy Cortex.
 *
 * SoT: GitHub #85. GitLab #19 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Benchmark/compare only on verified languages/toolchains; unconfigured = UNAVAILABLE.
 * Measured result ≠ production mandate; strategy priorities are recommendations.
 * Anti-patterns preserved as negative knowledge (not discarded).
 * Findings → Engineering University / Tool Foundry as sandboxed gated candidates only.
 * No private hidden reasoning traces; learning ≠ permission grant; Founder-sealed deny-by-default.
 */

export const CODE_RESEARCH_BENCHMARK_STRATEGY_CYCLE = [
  'honesty_locks',
  'research_compare_scope',
  'toolchain_verified_gate',
  'unverified_benchmark_unavailable',
  'benchmark_arena_bounded_run',
  'regression_detect_evidence',
  'regression_no_auto_production_block',
  'compiler_adapter_candidate',
  'compiler_verified_only_with_proof',
  'pattern_genome_version',
  'anti_pattern_retain_negative',
  'abi_ffi_portability_provenance',
  'strategy_cortex_recommend',
  'strategy_not_auto_deploy',
  'university_foundry_sandbox_candidate',
  'promotion_gate_required',
  'skill_tool_no_permission_escalation',
  'hidden_reasoning_trace_reject',
  'evidence',
  'learning',
] as const;

export type BuHop = (typeof CODE_RESEARCH_BENCHMARK_STRATEGY_CYCLE)[number];

export type BuEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'REJECTED'
  | 'SANDBOXED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED'
  | 'NEGATIVE_KNOWLEDGE';

export type BuHopRecord = {
  hop: BuHop;
  state: BuEvidenceState;
  summary: string;
  at: string;
};

export const BU_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  UNPROVEN_LANGUAGE_LABELED_VERIFIED: false as const,
  BENCHMARK_UNVERIFIED_TOOLCHAIN: false as const,
  MEASURED_RESULT_IS_PRODUCTION_MANDATE: false as const,
  STRATEGY_IS_AUTO_DEPLOY: false as const,
  REGRESSION_AUTO_PRODUCTION_BLOCK_AUTHORITY: false as const,
  ANTI_PATTERN_DISCARDED: false as const,
  FINDING_AUTO_PROMOTES_TO_PRODUCTION: false as const,
  UNIVERSITY_FOUNDRY_BYPASS_GATE: false as const,
  SKILL_IS_PERMISSION_GRANT: false as const,
  TOOL_CANDIDATE_ESCALATES_PERMISSIONS: false as const,
  LEARNING_IS_AUTHORITY: false as const,
  HIDDEN_REASONING_TRACES_ALLOWED: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  ANTI_PATTERNS_PRESERVED: true as const,
  STRATEGY_RECOMMENDATION_ONLY: true as const,
  SANDBOXED_GATED_CANDIDATES_ONLY: true as const,
  AUDITABLE_ARTIFACTS_ONLY: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-BV — AI Systems Architecture Institute + Distributed Build Intelligence + Runtime Optimization Laboratory + Cross-Platform Compatibility Matrix + Superbrain Technical Planning Engine' as const;

export const GITHUB_SOT_ISSUE = 85 as const;
export const GITLAB_COORDINATION_ISSUE = 19 as const;

export const UNVERIFIED_TOOLCHAIN_UNAVAILABLE =
  'UNVERIFIED_LANGUAGE_TOOLCHAIN_BENCHMARK_UNAVAILABLE' as const;
export const UNPROVEN_NOT_VERIFIED =
  'UNPROVEN_LANGUAGE_RUNTIME_COMPILER_NOT_LABELED_VERIFIED' as const;
export const REGRESSION_EVIDENCE_ONLY =
  'REGRESSION_LABELED_WITH_EVIDENCE_NO_AUTO_PRODUCTION_BLOCK' as const;
export const ANTI_PATTERN_RETAINED =
  'ANTI_PATTERN_RETAINED_AS_NEGATIVE_KNOWLEDGE' as const;
export const STRATEGY_RECOMMENDATION_ONLY =
  'STRATEGY_CORTEX_OUTPUT_IS_RECOMMENDATION_NOT_DEPLOY' as const;
export const UNIVERSITY_FOUNDRY_SANDBOXED =
  'UNIVERSITY_TOOL_FOUNDRY_PROMOTION_SANDBOXED_UNTIL_GATE' as const;
export const SKILL_TOOL_NO_PERMISSION =
  'RESEARCH_SKILL_OR_TOOL_CANDIDATE_DOES_NOT_ESCALATE_PERMISSIONS' as const;
export const ABI_FFI_REQUIRES_PROVENANCE =
  'ABI_FFI_PORTABILITY_FINDING_REQUIRES_PROVENANCE_AND_CONFIDENCE' as const;
export const HIDDEN_REASONING_TRACE_REJECTED =
  'HIDDEN_REASONING_TRACE_REJECTED' as const;
export const COMPILER_CANDIDATE_ONLY =
  'COMPILER_ADAPTER_INTELLIGENCE_CANDIDATE_UNTIL_PROOF' as const;

/** Forbidden private CoT / hidden-trace field names. */
export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type CompatibilityLabel =
  | 'DOCUMENTED'
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'VERIFIED'
  | 'TARGET';

export type ConfidenceLabel =
  | 'low'
  | 'medium'
  | 'high'
  | 'unverified'
  | 'evidence_backed';

export type ResearchCompareKind =
  | 'algorithm'
  | 'runtime'
  | 'compiler'
  | 'build_system'
  | 'architecture'
  | 'design_pattern'
  | 'abi_ffi'
  | 'portability';

export type PatternKind = 'pattern' | 'anti_pattern';

export type StrategyPriority = {
  id: string;
  title: string;
  rationale: string;
  evidenceRefs: string[];
  recommendationOnly: true;
  productionMandate: false;
  autoDeploy: false;
  priority: number;
};

export type BuActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'researcher_agent'
  | 'benchmark_agent'
  | 'compiler_agent'
  | 'pattern_curator'
  | 'strategy_cortex'
  | 'university_gate'
  | 'tool_foundry'
  | 'ordinary_agent'
  | 'impersonator';

export type BuActor = {
  kind: BuActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type PredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA' | 'MISSING';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()): Record<string, PredecessorProbe> {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  const localBrain = join(root, 'services/ai/local-brain');
  const hasMod = (file: string) => existsSync(join(localBrain, file));

  return {
    BT: {
      tipProbe: has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred BT tip + report; WAITING_DATA until pushed. Extends apprenticeship/experiment layers when present.',
    },
    BS: {
      tipProbe:
        has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md') ||
        hasMod('software-engineering-university.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred BS Engineering University / Memory Cortex tip used as BU base when BT absent. Report may still be landing.',
    },
    BR: {
      tipProbe: hasMod('structured-code-memory.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_BR_STRUCTURED_CODE_MEMORY_DEBUG_ACADEMY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BR Structured Code Memory / Debug Academy tip used as base when BT/BS absent; report may still be landing.',
    },
    BQ: {
      tipProbe:
        has('62L_BQ_POLYGLOT_CODING_CIVILIZATION_REPORT.md') ||
        hasMod('polyglot-language-registry.ts')
          ? has('62L_BQ_POLYGLOT_CODING_CIVILIZATION_REPORT.md')
            ? 'PRESENT'
            : 'WAITING_DATA'
          : 'WAITING_DATA',
      report: has('62L_BQ_POLYGLOT_CODING_CIVILIZATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BQ polyglot honesty (VERIFIED only with proof) reused conceptually; tip may be WAITING_DATA.',
    },
    BP: {
      tipProbe: has('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BP Cognitive Homeostasis tip may be present on origin; not selected when BR preferred.',
    },
    BO: {
      tipProbe: has('62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BO Superbrain Neuroplasticity / Immune ancestor when available.',
    },
    BN: {
      tipProbe: has('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BN tip may remain WAITING_DATA.',
    },
    BM: {
      tipProbe: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BM tip @ 4a6d128 may be present; preference order selects higher letters first.',
    },
    BL: {
      tipProbe: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BL ancestor of BR base.',
    },
    BJ: {
      tipProbe: has('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BJ Offline Intelligence OS / Exec Cortex ancestor.',
    },
  };
}

export function containsForbiddenPrivateFields(payload?: Record<string, unknown>): boolean {
  if (!payload) return false;
  const keys = Object.keys(payload).map((k) => k.toLowerCase());
  return keys.some((k) =>
    (FORBIDDEN_PRIVATE_FIELDS as readonly string[]).some(
      (f) => k === f || k.includes(f) || k.includes('hidden_reasoning') || k.includes('private_cot'),
    ),
  );
}
