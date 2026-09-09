import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CE — XIV Global Knowledge Excavation Grid + Multi-LLM Research Council +
 * Historical Civilization Memory Lake + Universal Data Pipeline Factory +
 * Hardware Intelligence Compiler + Low-Energy Edge Agent Network.
 *
 * SoT: GitHub #95. GitLab #29 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Local LLMs first; cloud council members only when configured+authorized+verified.
 * Sealed/local-only never silently falls back to cloud.
 * Pipeline stages move approved information only; unauthorized archive mining DENIED.
 * Memory lake: time-aware; persona/archive sims labeled; no soul-resurrection claims.
 * Hardware Intelligence Compiler: verified combos only; else UNAVAILABLE.
 * Quantization/compression = research candidates; not auto production deploy.
 * Energy savings never override security/correctness.
 * Learning ≠ permission; Founder-sealed deny-by-default; write-to-DB deny-by-default if touching CD mesh.
 * L4=false. tip-land=NO.
 */

export const KNOWLEDGE_EXCAVATION_MEMORY_LAKE_CYCLE = [
  'honesty_locks',
  'excavation_authorize_source',
  'unauthorized_archive_denied',
  'council_local_first',
  'unconfigured_cloud_unavailable',
  'sealed_no_cloud_fallback',
  'memory_lake_ingest_time_aware',
  'persona_sim_labeled',
  'soul_claim_rejected',
  'pipeline_extract_normalize_validate',
  'pipeline_reject_unapproved_before_enrichment',
  'pipeline_dedupe_enrich_index_retain_recover',
  'hardware_combo_verify',
  'unverified_hardware_unavailable',
  'compression_research_candidate',
  'edge_energy_profile',
  'energy_loses_to_security_correctness',
  'cd_mesh_write_deny_by_default',
  'evidence',
  'learning',
] as const;

export type CeHop = (typeof KNOWLEDGE_EXCAVATION_MEMORY_LAKE_CYCLE)[number];

export type CeEvidenceState =
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
  | 'LABELED_SIMULATION'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED';

export type CeHopRecord = {
  hop: CeHop;
  state: CeEvidenceState;
  summary: string;
  at: string;
};

export const CE_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
  LEARNING_IS_PERMISSION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_LLM_FIRST: true as const,
  CLOUD_COUNCIL_REQUIRES_CONFIG_AUTH_VERIFY: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  UNAUTHORIZED_ARCHIVE_MINING: false as const,
  PIPELINE_UNAPPROVED_ENRICHMENT: false as const,
  PIPELINE_APPROVED_ONLY: true as const,
  SOUL_RESURRECTION_CLAIMS: false as const,
  PERSONA_MUST_BE_LABELED_SIMULATION: true as const,
  MEMORY_LAKE_TIME_AWARE: true as const,
  UNVERIFIED_HARDWARE_LABELED_VERIFIED: false as const,
  COMPRESSION_AUTO_PRODUCTION_DEPLOY: false as const,
  QUANTIZATION_AUTO_PRODUCTION_DEPLOY: false as const,
  ENERGY_OVERRIDES_SECURITY: false as const,
  ENERGY_OVERRIDES_CORRECTNESS: false as const,
  CD_MESH_WRITE_DENY_BY_DEFAULT: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CF — Global Data Refinery Civilization + Autonomous Archive Research Shifts + Neural Knowledge Compression Engine + Multi-Provider Intelligence Router + Semiconductor/Device Optimization Lab + Distributed Offline Knowledge Replication Fabric' as const;

export const GITHUB_SOT_ISSUE = 95 as const;
export const GITLAB_COORDINATION_ISSUE = 29 as const;

export const UNAUTHORIZED_ARCHIVE_DENIED =
  'UNAUTHORIZED_ARCHIVE_FEED_DENIED' as const;
export const UNCONFIGURED_CLOUD_COUNCIL_UNAVAILABLE =
  'UNCONFIGURED_CLOUD_COUNCIL_MEMBER_UNAVAILABLE' as const;
export const SEALED_NO_CLOUD_FALLBACK =
  'SEALED_LOCAL_ONLY_NO_SILENT_CLOUD_FALLBACK' as const;
export const LOCAL_PREFERRED_OVER_CLOUD =
  'LOCAL_LLM_PREFERRED_OVER_CLOUD_WHEN_BOTH_AVAILABLE' as const;
export const PIPELINE_UNAPPROVED_REJECTED =
  'PIPELINE_REJECTS_UNAPPROVED_SOURCE_BEFORE_ENRICHMENT' as const;
export const UNVERIFIED_HARDWARE_UNAVAILABLE =
  'UNVERIFIED_HARDWARE_COMBO_UNAVAILABLE_NOT_VERIFIED' as const;
export const COMPRESSION_RESEARCH_CANDIDATE =
  'COMPRESSION_QUANTIZATION_RESEARCH_CANDIDATE_NOT_AUTO_DEPLOY' as const;
export const ENERGY_LOSES_TO_SECURITY =
  'LOWER_ENERGY_UNSAFE_ROUTE_LOSES_TO_SECURITY_CORRECTNESS_POLICY' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_RESURRECTION_CLAIM_REJECTED_PERSONA_IS_LABELED_SIMULATION' as const;
export const PERSONA_LABELED_SIMULATION =
  'HISTORICAL_PERSONA_LABELED_SIMULATION_NOT_RESURRECTION' as const;
export const CD_MESH_WRITE_DENIED =
  'CD_MESH_WRITE_TO_DB_DENY_BY_DEFAULT_NOT_APPLIED' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export const PIPELINE_STAGES = [
  'extraction',
  'normalization',
  'validation',
  'dedupe',
  'enrichment',
  'indexing',
  'retention',
  'recovery',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type CeActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'excavation_grid_agent'
  | 'research_council_chair'
  | 'memory_lake_curator'
  | 'pipeline_factory_agent'
  | 'hardware_intelligence_compiler'
  | 'edge_energy_agent'
  | 'ordinary_agent'
  | 'impersonator';

export type CeActor = {
  kind: CeActorKind;
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
    CD: {
      tipProbe: hasMod('data-root-local-llm-archive-mesh-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CD_DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred CD Data Root / Local LLM / Archive Mesh tip + report. WAITING_DATA until origin tip lands.',
    },
    CC: {
      tipProbe: hasMod('cc-types.ts') || has('62L_CC_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CC_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CC preferred after CD when CD absent.',
    },
    CB: {
      tipProbe: has('62L_CB_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CB_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CB when CD/CC absent.',
    },
    CA: {
      tipProbe:
        has('62L_CA_DISTRIBUTED_INTELLIGENCE_METABOLISM_REPORT.md') ||
        hasMod('distributed-intelligence-metabolism-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CA_DISTRIBUTED_INTELLIGENCE_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CA when CD→CC→CB absent.',
    },
    BZ: {
      tipProbe: hasMod('global-compute-nervous-routing-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BZ_GLOBAL_COMPUTE_NERVOUS_ROUTING_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BZ Global Compute Nervous Routing tip @ ff72b94 used when CD→CA WAITING_DATA.',
    },
    BY: {
      tipProbe: hasMod('hardware-cortex-synapse-compiler-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BY_HARDWARE_CORTEX_SYNAPSE_COMPILER_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BY ancestor of BZ base.',
    },
    BX: {
      tipProbe: hasMod('neural-chip-os-semiconductor-twin-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BX_NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BX ancestor.',
    },
    BU: {
      tipProbe: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BU ancestor in preference chain.',
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
