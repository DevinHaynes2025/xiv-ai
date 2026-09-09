import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BQ — Universal Polyglot Coding Civilization + Recursive Tool Foundry +
 * Problem Decomposition Puzzle Engine + Global Authorized Data/Server Federation +
 * Superbrain Neural Architecture Expansion contracts.
 *
 * SoT: GitHub #81. GitLab #15 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Universal compatibility is the **target**. Label language/runtime VERIFIED only when
 * actual toolchain + tests prove it — otherwise AVAILABLE / DOCUMENTED / UNAVAILABLE.
 * No silent scan or access of arbitrary servers — authorized/configured adapters only.
 * Recursive tool creation / project creation / neural growth: bounded, testable, reviewable.
 * Builder agents ≠ production deploy authority; learning/skill ≠ permission grant.
 * Founder-sealed deny-by-default; Superbrain remains root (coexistence, not swallow).
 */

export const POLYGLOT_CODING_CIVILIZATION_CYCLE = [
  'honesty_locks',
  'polyglot_registry_inventory',
  'language_skill_certify',
  'skill_not_permission_lock',
  'toolchain_verify_gate',
  'tool_foundry_build',
  'tool_foundry_recursion_bound',
  'tool_foundry_review_gate',
  'puzzle_bottleneck_detect',
  'puzzle_decompose_bounded',
  'puzzle_constraint_graph',
  'federation_adapter_probe',
  'federation_deny_arbitrary_scan',
  'federation_unconfigured_unavailable',
  'architecture_pathway_propose',
  'pathway_demand_proven_gate',
  'pathway_reject_redundant',
  'pathway_not_permission_grant',
  'superbrain_coexistence_root',
  'evidence',
] as const;

export type BqHop = (typeof POLYGLOT_CODING_CIVILIZATION_CYCLE)[number];

export type BqEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'REJECTED'
  | 'SANDBOX'
  | 'DOCUMENTED'
  | 'AVAILABLE'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED';

/** Honest compatibility labels — VERIFIED requires proven toolchain + tests. */
export type CompatibilityLabel =
  | 'DOCUMENTED'
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'VERIFIED'
  | 'TARGET';

export type LanguageFamily =
  | 'programming'
  | 'runtime'
  | 'query'
  | 'markup'
  | 'shader'
  | 'hdl'
  | 'configuration'
  | 'framework';

export type FederationAdapterKind =
  | 'online_server'
  | 'offline_server'
  | 'database'
  | 'api'
  | 'object_store'
  | 'queue'
  | 'edge_node'
  | 'local_network';

export type BqHopRecord = {
  hop: BqHop;
  state: BqEvidenceState;
  summary: string;
  at: string;
};

export const BQ_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  BUILDER_IS_DEPLOY_AUTHORITY: false as const,
  SKILL_IS_PERMISSION_GRANT: false as const,
  LEARNING_IS_AUTHORITY: false as const,
  PATHWAY_PROPOSAL_IS_PERMISSION: false as const,
  UNPROVEN_LANGUAGE_LABELED_VERIFIED: false as const,
  SILENT_ARBITRARY_SERVER_SCAN: false as const,
  UNBOUNDED_TOOL_RECURSION: false as const,
  UNBOUNDED_PUZZLE_SPLIT: false as const,
  AUTO_PRODUCTION_NEURAL_GROWTH: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  SWALLOW_SUPERBRAIN_ROOT: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  SUPERBRAIN_REMAINS_ROOT: true as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  INVENTED_PASS: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-BR — Autonomous Software Civilization Sandbox + Cross-Language Architecture Synthesis + AI Micro-Startup Factory + Global Problem-Solving Tournament + Superbrain Knowledge Compiler' as const;

export const SKILL_NOT_PERMISSION =
  'SKILL_CERTIFY_DOES_NOT_ESCALATE_AUTHORITY' as const;

export const PATHWAY_NOT_PERMISSION =
  'PATHWAY_PROPOSAL_DOES_NOT_GRANT_PERMISSIONS' as const;

export const ARBITRARY_SCAN_DENIED =
  'ARBITRARY_UNAUTHORIZED_SERVER_SCAN_ACCESS_DENIED' as const;

export const UNCONFIGURED_ADAPTER_UNAVAILABLE =
  'UNCONFIGURED_SERVER_ADAPTER_UNAVAILABLE' as const;

export const TOOL_RECURSION_BOUND =
  'TOOL_FOUNDRY_RECURSION_HIT_BOUND_REVIEW_REQUIRED' as const;

export const PUZZLE_SPLIT_BOUNDED =
  'PUZZLE_DECOMPOSITION_PRODUCES_BOUNDED_SUBPROBLEMS' as const;

export const UNPROVEN_NOT_VERIFIED =
  'UNPROVEN_LANGUAGE_RUNTIME_NOT_LABELED_VERIFIED' as const;

/** Default hard bounds — reviewable, not unbounded self-replication. */
export const BQ_BOUNDS = Object.freeze({
  MAX_TOOL_RECURSION_DEPTH: 3 as const,
  MAX_PUZZLE_SPLIT_DEPTH: 4 as const,
  MAX_SUBPROBLEMS_PER_NODE: 8 as const,
  MAX_TOTAL_SUBPROBLEMS: 32 as const,
  MAX_PATHWAY_PROPOSALS_PER_CYCLE: 16 as const,
});

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()) {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  return {
    BP: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'Preferred BP tip cursor/62l-bp-cognitive-homeostasis-genome-recovery-4059 used as BQ base (rebased onto latest BP after BN-backed BO gate refresh).',
    },
    BO: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BO ancestor of BP; available after BP landed during BQ backoff wait.',
    },
    BN: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BN tip+report present on BP parent after BN-backed BO rebase; growth rules reused in architecture expansion.',
    },
    BM: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BM tip+report present on BP parent after BM-backed BO rebase; not BQ base.',
    },
    BL: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BL ancestor of BO.',
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
    githubIssue: 81,
    githubRole: 'implementation_source_of_truth' as const,
    gitlabIssue: 15,
    gitlabRole: 'coordination_only' as const,
    note: 'GitHub #81 is SoT; GitLab #15 is coordination only. Issue API may be unreadable.',
  };
}

export function bqHonestyBanner() {
  return {
    banner: HONESTY_BANNER,
    locks: BQ_LOCKS,
    l4AutonomyEnabled: BQ_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: false as const,
    tipLand: false as const,
    universalCompatibilityIsTarget: true as const,
    verifiedRequiresToolchainAndTests: true as const,
  };
}
