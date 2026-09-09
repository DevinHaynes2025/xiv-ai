import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CN — XIV World Knowledge Routing OS + International Data Corridor Graph +
 * Regional Mini-Server Mesh + Historical Infrastructure Intelligence Atlas +
 * Cross-Border Agent Research Network + Distributed Global Memory Exchange.
 *
 * SoT: GitHub #104. GitLab #38 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Policy-aware routing of approved knowledge only among configured endpoints.
 * No arbitrary discovery; no unsupported all-world coverage claims.
 * No raw private data pooling by default — compact signed memory deltas only.
 * Atlas: provenance required for VERIFIED; sim/incomplete labeled.
 * Cross-border research bounded; learning ≠ permission; no deal/spend approval.
 * Local-first; sealed never silent cloud/corridor fallback; trust/policy beat speed/cost.
 * Revocable deltas; checksum/conflict handling; Founder-sealed deny-by-default.
 * L4=false. tip-land=NO.
 */

export const WORLD_KNOWLEDGE_ROUTING_OS_CYCLE = [
  'honesty_locks',
  'configure_endpoint',
  'route_unconfigured_endpoint_denied',
  'approve_knowledge_for_corridor',
  'unapproved_knowledge_corridor_denied',
  'register_corridor',
  'arbitrary_endpoint_discovery_denied',
  'mesh_register_mini_server',
  'atlas_upsert_with_provenance',
  'atlas_without_provenance_not_verified',
  'all_world_coverage_claim_rejected',
  'cross_border_research_open_bounded',
  'cross_border_research_no_permission_or_spend',
  'memory_exchange_signed_delta',
  'raw_private_pooling_denied',
  'unsigned_or_revoked_delta_rejected',
  'sealed_no_silent_international_corridor',
  'policy_trust_beats_speed_cost',
  'evidence',
  'learning',
] as const;

export type CnHop = (typeof WORLD_KNOWLEDGE_ROUTING_OS_CYCLE)[number];

export type CnEvidenceState =
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
  | 'LABELED_INCOMPLETE'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'ENROLLED'
  | 'CONFIGURED'
  | 'APPROVED'
  | 'REVOKED'
  | 'SIGNED';

export type CnHopRecord = {
  hop: CnHop;
  state: CnEvidenceState;
  summary: string;
  at: string;
};

export const CN_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  AUTONOMOUS_SPENDING: false as const,
  PURCHASE_AUTHORITY: false as const,
  BILLING_AUTHORITY: false as const,
  DEAL_APPROVAL_AUTHORITY: false as const,
  EMBASSY_BUREAU_CAN_APPROVE_DEALS: false as const,
  EMBASSY_BUREAU_CAN_APPROVE_SPEND: false as const,
  LEARNING_IS_PERMISSION: false as const,
  LOCAL_FIRST: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  SEALED_SILENT_INTERNATIONAL_CORRIDOR: false as const,
  UNCONFIGURED_ENDPOINT_AVAILABLE: false as const,
  ARBITRARY_ENDPOINT_DISCOVERY: false as const,
  UNAPPROVED_KNOWLEDGE_IN_CORRIDOR: false as const,
  RAW_PRIVATE_POOLING_DEFAULT: false as const,
  MEMORY_DELTA_REQUIRES_SIGNATURE: true as const,
  MEMORY_DELTA_REVOKABLE: true as const,
  UNSIGNED_DELTA_ACCEPTED: false as const,
  REVOKED_DELTA_ACCEPTED: false as const,
  ATLAS_WITHOUT_PROVENANCE_VERIFIED: false as const,
  ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE: false as const,
  POLICY_TRUST_BEATS_SPEED_COST: true as const,
  CROSS_BORDER_RESEARCH_BOUNDED: true as const,
  CROSS_BORDER_PERMISSION_ESCALATION: false as const,
  CROSS_BORDER_SPEND_ESCALATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
  APPROVED_KNOWLEDGE_ONLY: true as const,
  CONFIGURED_ENDPOINTS_ONLY: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CO — XIV Global Knowledge Exchange OS + Regional Micro-Cloud Fabric + International Archive Discovery Engine + Historical Trade/Technology Civilization Graph + Cross-Cloud Knowledge Compression + Worldwide Research Coordination Grid' as const;

export const GITHUB_SOT_ISSUE = 104 as const;
export const GITLAB_COORDINATION_ISSUE = 38 as const;

export const UNCONFIGURED_ENDPOINT_DENIED =
  'ROUTE_TO_UNCONFIGURED_ENDPOINT_DENIED_OR_UNAVAILABLE' as const;
export const UNAPPROVED_KNOWLEDGE_CORRIDOR_DENIED =
  'UNAPPROVED_KNOWLEDGE_CANNOT_ENTER_CORRIDOR' as const;
export const ARBITRARY_DISCOVERY_DENIED =
  'ARBITRARY_ENDPOINT_DISCOVERY_DENIED' as const;
export const RAW_PRIVATE_POOLING_DENIED =
  'RAW_PRIVATE_POOLING_VIA_MEMORY_EXCHANGE_DENIED_BY_DEFAULT' as const;
export const UNSIGNED_DELTA_REJECTED =
  'UNSIGNED_MEMORY_DELTA_REJECTED' as const;
export const REVOKED_DELTA_REJECTED =
  'REVOKED_MEMORY_DELTA_REJECTED' as const;
export const ATLAS_NOT_VERIFIED_WITHOUT_PROVENANCE =
  'ATLAS_ENTRY_WITHOUT_PROVENANCE_NOT_LABELED_VERIFIED' as const;
export const ALL_WORLD_COVERAGE_REJECTED =
  'ALL_WORLD_INFRASTRUCTURE_COVERAGE_CLAIM_WITHOUT_EVIDENCE_REJECTED' as const;
export const CROSS_BORDER_PERMISSION_DENIED =
  'CROSS_BORDER_RESEARCH_CANNOT_ESCALATE_PERMISSIONS_OR_SPEND' as const;
export const SEALED_CORRIDOR_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_ONTO_INTERNATIONAL_CORRIDOR' as const;
export const POLICY_BEATS_SPEED =
  'FASTER_LOW_TRUST_CORRIDOR_LOSES_TO_POLICY_SEALED_WEIGHTS' as const;
export const CHECKSUM_CONFLICT =
  'MEMORY_DELTA_CHECKSUM_OR_CONFLICT_REJECTED' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
  'raw_private_pool',
  'raw_pii_dump',
] as const);

export type CnEndpointKind =
  | 'cloud'
  | 'server'
  | 'database'
  | 'api'
  | 'archive'
  | 'edge'
  | 'mini_server'
  | 'regional_cell';

export type CnKnowledgeClass =
  | 'open'
  | 'approved'
  | 'local_only'
  | 'sealed'
  | 'unapproved'
  | 'raw_private';

export type CnActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'world_knowledge_router'
  | 'corridor_graph_agent'
  | 'mini_server_mesh'
  | 'atlas_curator'
  | 'cross_border_research_agent'
  | 'embassy_bureau'
  | 'memory_exchange_agent'
  | 'ordinary_agent'
  | 'impersonator';

export type CnActor = {
  kind: CnActorKind;
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
    CM: {
      tipProbe: hasMod('sovereign-regional-knowledge-clouds-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CM_SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred CM Sovereign Regional Knowledge Clouds — used as pushed base tip (report may still WAITING_DATA).',
    },
    CL: {
      tipProbe: hasMod('global-knowledge-server-constellation-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CL_GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CL Global Knowledge Server Constellation — ancestor of CM base tip.',
    },
    CK: {
      tipProbe: hasMod('cognitive-infra-mini-cloud-history-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CK Cognitive Infra Mini-Cloud / History when CL/CM absent.',
    },
    CJ: {
      tipProbe: hasMod('intelligence-resource-grid-apprenticeship-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CJ_INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CJ Intelligence Resource Grid / Apprenticeship — sibling lineage (may not be ancestor of CL base).',
    },
    CI: {
      tipProbe: hasMod('persistent-intelligence-economy-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CI_PERSISTENT_INTELLIGENCE_ECONOMY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CI Persistent Intelligence Economy sibling / ancestor patterns.',
    },
    CH: {
      tipProbe: hasMod('knowledge-civilization-dept-universities-types.ts')
        ? 'PRESENT'
        : hasMod('enterprise-knowledge-os-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CH_KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_REPORT.md')
        ? 'PRESENT'
        : has('62L_CH_ENTERPRISE_KNOWLEDGE_OS_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'CH Knowledge Civilization / Enterprise Knowledge OS fallback.',
    },
    CG: {
      tipProbe: hasMod('deep-knowledge-refinery-os-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CG Deep Knowledge Refinery OS ancestor.',
    },
    CF: {
      tipProbe: hasMod('data-refinery-compression-replication-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CF Data Refinery / Compression / Replication in-tree on CJ base.',
    },
    CE: {
      tipProbe: hasMod('knowledge-excavation-memory-lake-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CE_KNOWLEDGE_EXCAVATION_MEMORY_LAKE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CE Knowledge Excavation / Memory Lake ancestor.',
    },
    CD: {
      tipProbe: hasMod('data-root-local-llm-archive-mesh-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CD_DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CD Data-Root / Local LLM / Archive Mesh ancestor.',
    },
  };
}

export function containsForbiddenPrivateFields(payload?: Record<string, unknown>): boolean {
  if (!payload) return false;
  const keys = Object.keys(payload).map((k) => k.toLowerCase());
  return keys.some((k) =>
    (FORBIDDEN_PRIVATE_FIELDS as readonly string[]).some(
      (f) => k === f || k.includes(f) || k.includes('hidden_reasoning') || k.includes('private_cot') || k.includes('raw_private'),
    ),
  );
}
