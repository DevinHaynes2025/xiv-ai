import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CD — Data-Root Intelligence Fabric + Local LLM Agent Society +
 * Historical Archive Mining + Authorized Database Connector Mesh +
 * Google AI Studio Adapter + Global Governance Knowledge Cortex +
 * Hardware / Edge Intelligence Profiles.
 *
 * SoT: GitHub #94. GitLab #28 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Local-first: sealed/local-only information must NEVER silently fall back to a cloud model.
 * Google AI Studio adapter: UNAVAILABLE until configured, authorized, and verified.
 * DB connectors: explicitly authorized systems only; write DENIED by default.
 * Mini XIV = lightweight compatibility profile, not stealth installation.
 * Archive persona simulations clearly labeled — no soul-resurrection / afterlife claims.
 * Unknown consent/license/jurisdiction → DENIED or WAITING_DATA.
 * Learning ≠ permission; Founder-sealed deny-by-default. L4=false.
 */

export const DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_CYCLE = [
  'honesty_locks',
  'data_root_pipeline_govern',
  'temporal_knowledge_graph_bound',
  'local_llm_agent_shift',
  'sealed_local_never_cloud_fallback',
  'google_ai_studio_unconfigured_unavailable',
  'archive_source_authorize',
  'unauthorized_archive_mining_denied',
  'archive_persona_label_simulation',
  'soul_afterlife_claim_rejected',
  'governance_knowledge_pack_load',
  'unknown_consent_denied_or_waiting',
  'db_connector_enroll',
  'unenrolled_connector_unavailable',
  'unauthorized_db_connect_denied',
  'db_write_default_denied',
  'db_revocation_provenance',
  'hardware_edge_profile_plan',
  'mini_xiv_no_stealth_install',
  'evidence',
  'learning',
] as const;

export type CdHop = (typeof DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_CYCLE)[number];

export type CdEvidenceState =
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
  | 'LABELED_SIMULATION'
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED'
  | 'BOUNDED'
  | 'SPARSE'
  | 'COMPATIBILITY_PROFILE_ONLY';

export type CdHopRecord = {
  hop: CdHop;
  state: CdEvidenceState;
  summary: string;
  at: string;
};

export const CD_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
  LEARNING_IS_PERMISSION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST_ROUTING: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  LOCAL_ONLY_SILENT_CLOUD_FALLBACK: false as const,
  GOOGLE_AI_STUDIO_AVAILABLE_WHEN_UNCONFIGURED: false as const,
  GOOGLE_AI_STUDIO_REQUIRES_CONFIG_AUTH_VERIFY: true as const,
  ARBITRARY_DB_SCAN: false as const,
  CONNECT_EVERY_DATABASE: false as const,
  DB_WRITE_DEFAULT: false as const,
  DB_WRITE_DENIED_BY_DEFAULT: true as const,
  UNAUTHORIZED_DB_CONNECT: false as const,
  UNENROLLED_CONNECTOR_AVAILABLE: false as const,
  UNKNOWN_CONSENT_SILENT_PASS: false as const,
  SOUL_RESURRECTION_CAPABILITY: false as const,
  AFTERLIFE_COMMUNICATION_CAPABILITY: false as const,
  ARCHIVE_PERSONA_MUST_LABEL_SIMULATION: true as const,
  UNAUTHORIZED_ARCHIVE_MINING: false as const,
  MINI_XIV_STEALTH_INSTALL: false as const,
  MINI_XIV_IS_COMPATIBILITY_PROFILE_ONLY: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CE — XIV Global Knowledge Excavation Grid + Multi-LLM Research Council + Historical Civilization Memory Lake + Universal Data Pipeline Factory + Hardware Intelligence Compiler + Low-Energy Edge Agent Network' as const;

export const GITHUB_SOT_ISSUE = 94 as const;
export const GITLAB_COORDINATION_ISSUE = 28 as const;

export const SEALED_CLOUD_FALLBACK_DENIED =
  'SEALED_OR_LOCAL_ONLY_NEVER_SILENT_CLOUD_FALLBACK' as const;
export const GOOGLE_AI_STUDIO_UNAVAILABLE =
  'GOOGLE_AI_STUDIO_UNAVAILABLE_UNTIL_CONFIGURED_AUTHORIZED_VERIFIED' as const;
export const UNAUTHORIZED_DB_DENIED =
  'UNAUTHORIZED_DATABASE_CONNECT_DENIED' as const;
export const DB_WRITE_DENIED_DEFAULT =
  'DATABASE_WRITE_DENIED_BY_DEFAULT' as const;
export const UNENROLLED_CONNECTOR_UNAVAILABLE =
  'UNENROLLED_DATABASE_CONNECTOR_UNAVAILABLE' as const;
export const UNAUTHORIZED_ARCHIVE_DENIED =
  'UNAUTHORIZED_HISTORICAL_ARCHIVE_MINING_DENIED' as const;
export const ARCHIVE_PERSONA_SIMULATION_LABEL =
  'ARCHIVAL_PERSONA_LABELED_SIMULATION_NOT_PERSON' as const;
export const SOUL_AFTERLIFE_REJECTED =
  'SOUL_RESURRECTION_OR_AFTERLIFE_COMMUNICATION_CLAIM_REJECTED' as const;
export const UNKNOWN_CONSENT_DENIED =
  'UNKNOWN_CONSENT_LICENSE_OR_JURISDICTION_DENIED_OR_WAITING_DATA' as const;
export const MINI_XIV_NO_STEALTH =
  'MINI_XIV_COMPATIBILITY_PROFILE_ONLY_NO_STEALTH_INSTALL' as const;
export const ARBITRARY_DB_SCAN_DENIED =
  'ARBITRARY_DATABASE_SCAN_OR_CONNECT_EVERY_DB_DENIED' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type CdActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'data_root_curator'
  | 'local_llm_agent'
  | 'archive_miner'
  | 'governance_cortex_agent'
  | 'db_connector_broker'
  | 'google_ai_studio_adapter'
  | 'edge_profile_planner'
  | 'ordinary_agent'
  | 'impersonator';

export type CdActor = {
  kind: CdActorKind;
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
    CC: {
      tipProbe: hasMod('cc-placeholder-types.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CC_REPORT.md') || has('62L_CC_CROSS_DOMAIN_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred CC tip + report. Not present on origin after fetch-with-backoff → WAITING_DATA.',
    },
    CB: {
      tipProbe: hasMod('cb-placeholder-types.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CB_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'Preferred CB tip + report when CC absent. WAITING_DATA if never queued.',
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
      note: 'Preferred CA tip + report when CC/CB absent. WAITING_DATA if never queued.',
    },
    BZ: {
      tipProbe: hasMod('global-compute-nervous-routing-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BZ_GLOBAL_COMPUTE_NERVOUS_ROUTING_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BZ Global Compute Nervous Routing used as CD base when CA/CB/CC WAITING_DATA.',
    },
    BY: {
      tipProbe: hasMod('hardware-cortex-synapse-compiler-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BY_HARDWARE_CORTEX_SYNAPSE_COMPILER_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BY Hardware Cortex / Synapse Compiler ancestor of BZ.',
    },
    BX: {
      tipProbe: hasMod('neural-chip-os-semiconductor-twin-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BX_NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BX Neural Chip OS / Semiconductor Twin ancestor.',
    },
    BW: {
      tipProbe: hasMod('planetary-chip-founder-avatar-ethics-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BW_PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BW Planetary Chip / Founder Avatar / Ethics ancestor.',
    },
    BU: {
      tipProbe: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BU Code Research / Benchmark / Strategy ancestor.',
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
