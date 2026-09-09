import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CM — XIV Sovereign Regional Knowledge Clouds + Global Archive Observatory +
 * International Business/Law/Health/Supply Intelligence Grid + Knowledge Route Optimization Engine +
 * Agent Embassy Network + Planetary Offline Knowledge Cache Fabric.
 *
 * SoT: GitHub #103. GitLab #37 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Region-scoped knowledge clouds: sovereign isolation defaults; no raw cross-region private pooling.
 * Global Archive Observatory: authorized sources only; no arbitrary discovery; no unsupported all-world claims.
 * Intelligence grids: provenance-aware; forecast/sim ≠ verified fact.
 * Route optimization: approved nodes only; trust/policy beat speed/cost.
 * Agent embassies: regional multilingual workcells; learning ≠ permission; no autonomous spend/deal authority.
 * Offline knowledge caches: signed; enrolled devices only; revocable.
 * Local-first; sealed never silent cloud fallback; Founder-sealed deny-by-default.
 * L4=false. tip-land=NO.
 */

export const SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_CYCLE = [
  'honesty_locks',
  'region_cloud_enroll',
  'cross_region_raw_private_pooling_denied',
  'archive_authorized_intake',
  'archive_unauthorized_intake_denied',
  'archive_all_world_without_evidence_not_verified',
  'intel_grid_emit_with_honesty_labels',
  'intel_forecast_sim_not_verified_fact',
  'route_exclude_unapproved_node',
  'route_trust_policy_beats_speed',
  'sealed_no_silent_regional_cloud',
  'embassy_open_bounded_workcell',
  'embassy_deal_spend_permission_denied',
  'offline_cache_signed_enrolled_install',
  'offline_cache_unsigned_or_revoked_rejected',
  'offline_cache_unenrolled_device_denied',
  'evidence',
  'learning',
] as const;

export type CmHop = (typeof SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_CYCLE)[number];

export type CmEvidenceState =
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
  | 'LABELED_FORECAST'
  | 'LABELED_HYPOTHESIS'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'ENROLLED'
  | 'AUTHORIZED'
  | 'ROUTED'
  | 'ISOLATED'
  | 'SIGNED'
  | 'REVOKED';

export type CmHopRecord = {
  hop: CmHop;
  state: CmEvidenceState;
  summary: string;
  at: string;
};

export const CM_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  CROSS_REGION_RAW_PRIVATE_POOLING: false as const,
  SOVEREIGN_ISOLATION_DEFAULT: true as const,
  ARBITRARY_ARCHIVE_DISCOVERY: false as const,
  ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE: false as const,
  FORECAST_EQ_VERIFIED_FACT: false as const,
  SIMULATION_EQ_VERIFIED_FACT: false as const,
  UNAPPROVED_NODE_IN_ROUTE_OPTIMIZATION: false as const,
  SPEED_BEATS_TRUST_POLICY: false as const,
  TRUST_POLICY_BEATS_SPEED_COST: true as const,
  SEALED_SILENT_REGIONAL_CLOUD_FALLBACK: false as const,
  LOCAL_FIRST: true as const,
  EMBASSY_DEAL_AUTHORITY: false as const,
  EMBASSY_SPEND_AUTHORITY: false as const,
  EMBASSY_PERMISSION_ESCALATION: false as const,
  LEARNING_IS_PERMISSION: false as const,
  UNSIGNED_CACHE_INSTALL: false as const,
  REVOKED_CACHE_INSTALL: false as const,
  UNENROLLED_DEVICE_CACHE_INSTALL: false as const,
  OFFLINE_CACHE_REQUIRES_SIGNATURE: true as const,
  OFFLINE_CACHE_REQUIRES_ENROLLMENT: true as const,
  OFFLINE_CACHE_REVOCABLE: true as const,
  AUTONOMOUS_SPENDING: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CN — XIV World Knowledge Routing OS + International Data Corridor Graph + Regional Mini-Server Mesh + Historical Infrastructure Intelligence Atlas + Cross-Border Agent Research Network + Distributed Global Memory Exchange' as const;

export const GITHUB_SOT_ISSUE = 103 as const;
export const GITLAB_COORDINATION_ISSUE = 37 as const;

export const CROSS_REGION_POOLING_DENIED =
  'CROSS_REGION_RAW_PRIVATE_POOLING_DENIED_BY_DEFAULT' as const;
export const UNAUTHORIZED_ARCHIVE_INTAKE_DENIED =
  'UNAUTHORIZED_ARCHIVE_OBSERVATORY_INTAKE_DENIED' as const;
export const ALL_WORLD_COVERAGE_NOT_VERIFIED =
  'ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE_NOT_VERIFIED' as const;
export const FORECAST_SIM_NOT_FACT =
  'INTELLIGENCE_FORECAST_OR_SIMULATION_NOT_VERIFIED_FACT' as const;
export const UNAPPROVED_NODE_EXCLUDED =
  'UNAPPROVED_NODE_EXCLUDED_FROM_ROUTE_OPTIMIZATION' as const;
export const TRUST_POLICY_ROUTE_WINS =
  'FASTER_LOW_TRUST_ROUTE_LOSES_TO_SEALED_POLICY' as const;
export const SEALED_REGIONAL_CLOUD_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_TO_REGIONAL_CLOUD' as const;
export const EMBASSY_AUTHORITY_DENIED =
  'EMBASSY_CANNOT_APPROVE_DEALS_SPEND_OR_ESCALATE_PERMISSIONS' as const;
export const UNSIGNED_OR_REVOKED_CACHE_REJECTED =
  'UNSIGNED_OR_REVOKED_OFFLINE_CACHE_REJECTED' as const;
export const UNENROLLED_CACHE_INSTALL_DENIED =
  'UNENROLLED_DEVICE_CACHE_INSTALL_DENIED' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type CmActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'regional_cloud_agent'
  | 'archive_observatory'
  | 'intelligence_grid_agent'
  | 'route_optimizer'
  | 'embassy_workcell'
  | 'offline_cache_fabric'
  | 'ordinary_agent'
  | 'impersonator';

export type CmActor = {
  kind: CmActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  regionId?: string;
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
    CL: {
      tipProbe: hasMod('global-knowledge-server-constellation-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CL_GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred CL Global Knowledge Server Constellation tip + report.',
    },
    CK: {
      tipProbe: hasMod('cognitive-infra-mini-cloud-history-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CK Cognitive Infrastructure / Mini-Cloud / History when CL absent.',
    },
    CJ: {
      tipProbe: hasMod('intelligence-resource-grid-apprenticeship-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CJ_INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CJ Intelligence Resource Grid / Apprenticeship — alternate predecessor when CL/CK absent.',
    },
    CI: {
      tipProbe: hasMod('persistent-intelligence-economy-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CI_PERSISTENT_INTELLIGENCE_ECONOMY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CI Persistent Intelligence Economy ancestor when present.',
    },
    CH: {
      tipProbe: hasMod('knowledge-civilization-dept-universities-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CH_KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CH Knowledge Civilization / Department Universities when present.',
    },
    CG: {
      tipProbe: hasMod('deep-knowledge-refinery-os-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CG Deep Knowledge Refinery OS @ 87fdf05 when present.',
    },
    CF: {
      tipProbe: hasMod('data-refinery-compression-replication-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CF Data Refinery / Compression / Replication @ 5daacde lineage.',
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
