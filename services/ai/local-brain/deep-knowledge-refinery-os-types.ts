import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CG — XIV Deep Knowledge Refinery OS + Autonomous Research Universities +
 * Global Archive Graph Federation + Intelligent Storage/Index Compiler +
 * Multi-Model Reasoning Fabric + Edge Superbrain Deployment Orchestrator.
 *
 * SoT: GitHub #97. GitLab #31 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Unifies refinery/archive/search/storage/model-routing/agent-training/edge-runtime
 * as a deeper OS layer under Superbrain — coexistence façade, not unsafe mega-merge.
 * Research universities = bounded agent learning; learning ≠ permission/authority.
 * Federated archive graph: authorized sources only; no raw private pooling by default.
 * Storage/index compiler: recommend/test candidates; no automatic production DB alter.
 * Multi-model reasoning: local-first; sealed never silent cloud fallback; unconfigured UNAVAILABLE.
 * Edge deployment orchestrator: approved PCs/mobile/edge only; profile ≠ stealth install;
 * deploy candidate ≠ production authority.
 * Founder-sealed deny-by-default; security/correctness ahead of speed/energy. L4=false.
 */

export const DEEP_KNOWLEDGE_REFINERY_OS_CYCLE = [
  'honesty_locks',
  'os_register_subsystems',
  'os_reject_mega_delta_swallow',
  'university_curriculum_bound',
  'university_skill_no_permission_escalation',
  'archive_federation_authorize',
  'unauthorized_archive_edge_denied',
  'no_raw_private_pooling',
  'storage_index_compile_candidate',
  'storage_index_dry_run_recommend',
  'storage_index_auto_apply_denied',
  'reasoning_local_first',
  'sealed_never_silent_cloud',
  'unconfigured_provider_unavailable',
  'edge_profile_approve_only',
  'unapproved_edge_deploy_denied',
  'edge_profile_not_stealth',
  'deploy_candidate_not_production_authority',
  'evidence',
  'learning',
] as const;

export type CgHop = (typeof DEEP_KNOWLEDGE_REFINERY_OS_CYCLE)[number];

export type CgEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'STALE'
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
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'DRY_RUN'
  | 'COMPATIBILITY_PROFILE_ONLY'
  | 'COEXISTENCE_LAYER';

export type CgHopRecord = {
  hop: CgHop;
  state: CgEvidenceState;
  summary: string;
  at: string;
};

export const CG_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  STORAGE_INDEX_AUTO_APPLY: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
  LEARNING_IS_PERMISSION: false as const,
  UNIVERSITY_SKILL_IS_PERMISSION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST_ROUTING: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  LOCAL_ONLY_SILENT_CLOUD_FALLBACK: false as const,
  UNCONFIGURED_PROVIDER_AVAILABLE: false as const,
  RAW_PRIVATE_ARCHIVE_POOLING: false as const,
  UNAUTHORIZED_ARCHIVE_FEDERATION: false as const,
  UNAPPROVED_EDGE_DEPLOY: false as const,
  EDGE_PROFILE_STEALTH_INSTALL: false as const,
  EDGE_PROFILE_IS_COMPATIBILITY_ONLY: true as const,
  DEPLOY_CANDIDATE_IS_PRODUCTION_AUTHORITY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
  OS_IS_COEXISTENCE_LAYER: true as const,
  SECURITY_AHEAD_OF_SPEED: true as const,
  SECURITY_AHEAD_OF_ENERGY: true as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CH — XIV Knowledge Civilization OS + Agent Department Universities + Historical World Model Graph + Adaptive Database/Memory Fabric + Multi-Model Expert Councils + Distributed Edge Intelligence Colony' as const;

export const GITHUB_SOT_ISSUE = 97 as const;
export const GITLAB_COORDINATION_ISSUE = 31 as const;

export const UNIVERSITY_SKILL_NOT_PERMISSION =
  'UNIVERSITY_SKILL_GRANT_DOES_NOT_ESCALATE_PERMISSIONS' as const;
export const UNAUTHORIZED_ARCHIVE_FEDERATION_DENIED =
  'UNAUTHORIZED_ARCHIVE_FEDERATION_EDGE_DENIED' as const;
export const RAW_PRIVATE_POOLING_DENIED =
  'RAW_PRIVATE_ARCHIVE_POOLING_DENIED_BY_DEFAULT' as const;
export const STORAGE_INDEX_AUTO_APPLY_DENIED =
  'STORAGE_INDEX_COMPILER_CANNOT_AUTO_APPLY_PRODUCTION_DDL' as const;
export const SEALED_CLOUD_FALLBACK_DENIED =
  'SEALED_PROMPT_CANNOT_SILENT_ROUTE_TO_CLOUD_MODEL' as const;
export const UNCONFIGURED_PROVIDER_UNAVAILABLE =
  'UNCONFIGURED_PROVIDER_UNAVAILABLE' as const;
export const UNAPPROVED_EDGE_DEPLOY_DENIED =
  'UNAPPROVED_EDGE_DEVICE_DEPLOYMENT_DENIED_OR_UNAVAILABLE' as const;
export const EDGE_PROFILE_NOT_STEALTH =
  'EDGE_PROFILE_IS_NOT_STEALTH_INSTALL' as const;
export const DEPLOY_CANDIDATE_NOT_AUTHORITY =
  'EDGE_DEPLOY_CANDIDATE_IS_NOT_PRODUCTION_AUTHORITY' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'OS_UNIFICATION_REJECTS_UNRELATED_MEGA_DELTA_SWALLOW' as const;
export const OS_COEXISTENCE_LAYER =
  'DEEP_KNOWLEDGE_REFINERY_OS_COEXISTENCE_LAYER_UNDER_SUPERBRAIN' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type CgActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'refinery_os_curator'
  | 'research_university_dean'
  | 'archive_federation_broker'
  | 'storage_index_compiler'
  | 'reasoning_fabric_router'
  | 'edge_deploy_orchestrator'
  | 'ordinary_agent'
  | 'impersonator';

export type CgActor = {
  kind: CgActorKind;
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
    CF: {
      tipProbe: hasMod('data-refinery-compression-replication-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CF Data Refinery / Compression / Replication tip + report. WAITING_DATA until pushed with report.',
    },
    CE: {
      tipProbe: hasMod('knowledge-excavation-memory-lake-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CE_KNOWLEDGE_EXCAVATION_MEMORY_LAKE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CE Knowledge Excavation / Memory Lake when CF absent. WAITING_DATA until pushed with report.',
    },
    CD: {
      tipProbe: hasMod('data-root-local-llm-archive-mesh-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CD_DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'CD Data-Root / Local LLM / Archive Mesh used as CG base when CF/CE WAITING_DATA. Modules PRESENT; formal CD report may still be MISSING.',
    },
    CC: {
      tipProbe: hasMod('cc-placeholder-types.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CC_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CC tip + report preference when CD absent. WAITING_DATA if never queued.',
    },
    CB: {
      tipProbe: hasMod('cb-placeholder-types.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CB_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CB tip + report preference when CC absent. WAITING_DATA if never queued.',
    },
    CA: {
      tipProbe:
        hasMod('distributed-intelligence-metabolism-types.ts') ||
        hasMod('ca-placeholder-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CA_DISTRIBUTED_INTELLIGENCE_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CA tip + report preference when CC/CB absent.',
    },
    BZ: {
      tipProbe: hasMod('global-compute-nervous-routing-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BZ_GLOBAL_COMPUTE_NERVOUS_ROUTING_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BZ ancestor of CD lineage.',
    },
    BY: {
      tipProbe: hasMod('hardware-cortex-synapse-compiler-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BY_HARDWARE_CORTEX_SYNAPSE_COMPILER_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BY Hardware Cortex / Synapse Compiler ancestor.',
    },
    BU: {
      tipProbe: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BU Code Research / Benchmark / Strategy ancestor (university patterns).',
    },
    BS: {
      tipProbe: hasMod('engineering-university-memory-cortex-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BS Engineering University patterns reused for bounded research universities.',
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
