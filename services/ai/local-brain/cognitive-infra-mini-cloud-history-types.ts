import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CK — XIV Cognitive Infrastructure Grid + Mini Cloud Server Cells +
 * Authorized Server/Database Federation + Global Historical Pathway Mining +
 * Agent Operating Companies + Distributed Device Intelligence Fabric.
 *
 * SoT: GitHub #101. GitLab #35 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Cognitive Infrastructure Grid coordinates mini cells, federation, history mining,
 * agent companies, and device fabric — coexistence façade, not mega-delta swallow.
 * Mini cloud server cells = isolated service cells (queues, search/vector/graph shards,
 * caches, knowledge stores, telemetry, model gateways, archive workers, sync relays) —
 * not stealth infra takeover; enrollment required to bind production network.
 * Enterprise server/DB federation: explicit enrollment, least-privilege scopes,
 * network allowlists, auditing, revocation — no arbitrary discovery/scan.
 * Write deny-by-default on DB connectors; no production auto-alter.
 * Historical pathways feed root graph only after provenance + evidence checks.
 * Agent operating companies = bounded org/agent structures; no autonomous spend;
 * learning ≠ permission.
 * Device fabric: enrolled devices only; explicit handoff; no hidden deploy.
 * Local-first; sealed never silent cloud fallback; unconfigured UNAVAILABLE.
 * No soul-resurrection claims; Founder-sealed deny-by-default. L4=false. tip-land=NO.
 */

export const COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE = [
  'honesty_locks',
  'grid_register_subsystems',
  'grid_reject_mega_delta_swallow',
  'mini_cell_enroll_isolated',
  'mini_cell_unenrolled_prod_bind_denied',
  'federation_enroll_server_db',
  'federation_unenrolled_denied',
  'federation_arbitrary_discovery_denied',
  'federation_write_by_default_denied',
  'history_source_atlas_authorize',
  'history_unauthorized_region_mining_denied',
  'history_pathway_without_evidence_denied_root',
  'history_soul_claim_rejected',
  'agent_co_bounded_register',
  'agent_co_spend_bill_denied',
  'agent_co_permission_escalate_denied',
  'device_fabric_enroll',
  'device_fabric_unenrolled_join_denied',
  'sealed_no_silent_cloud_cell',
  'unconfigured_unavailable',
  'evidence',
  'learning',
] as const;

export type CkHop = (typeof COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE)[number];

export type CkEvidenceState =
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
  | 'ENROLLED'
  | 'ISOLATED'
  | 'AUDITED';

export type CkHopRecord = {
  hop: CkHop;
  state: CkEvidenceState;
  summary: string;
  at: string;
};

export const CK_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  DB_WRITE_DENIED_BY_DEFAULT: true as const,
  DB_WRITE_DEFAULT: false as const,
  ARBITRARY_SERVER_DISCOVERY: false as const,
  ARBITRARY_DB_SCAN: false as const,
  UNENROLLED_FEDERATION_AVAILABLE: false as const,
  MINI_CELL_STEALTH_INFRA_TAKEOVER: false as const,
  MINI_CELL_UNENROLLED_PROD_BIND: false as const,
  MINI_CELLS_ARE_ISOLATED_SERVICE_CELLS: true as const,
  HISTORY_WITHOUT_PROVENANCE_ENTERS_ROOT: false as const,
  HISTORY_WITHOUT_EVIDENCE_ENTERS_ROOT: false as const,
  UNAUTHORIZED_ARCHIVE_REGION_MINING: false as const,
  SOUL_RESURRECTION_CLAIMS: false as const,
  AFTERLIFE_CAPABILITY_CLAIMS: false as const,
  AGENT_CO_AUTONOMOUS_SPEND: false as const,
  AGENT_CO_BILLING_AUTHORITY: false as const,
  AGENT_CO_PURCHASE_AUTHORITY: false as const,
  AGENT_CO_SELF_PERMISSION_ESCALATION: false as const,
  LEARNING_IS_PERMISSION: false as const,
  DEVICE_FABRIC_UNENROLLED_JOIN: false as const,
  DEVICE_HIDDEN_DEPLOY: false as const,
  DEVICE_ENROLLMENT_REQUIRED: true as const,
  LOCAL_FIRST_ROUTING: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  UNCONFIGURED_PROVIDER_AVAILABLE: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  GRID_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
  GRID_IS_COEXISTENCE_LAYER: true as const,
  SECURITY_AHEAD_OF_SPEED: true as const,
  SECURITY_AHEAD_OF_ENERGY: true as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
  PRODUCTION_AUTO_ALTER: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CL — XIV Global Knowledge Server Constellation + International Archive Mining Network + Multi-Cloud Data Highway Compiler + Historical Civilization Knowledge Graph + Regional Agent Research Bureaus + Offline/Cloud Superbrain Sync Fabric' as const;

export const GITHUB_SOT_ISSUE = 101 as const;
export const GITLAB_COORDINATION_ISSUE = 35 as const;

export const MEGA_DELTA_SWALLOW_DENIED =
  'COGNITIVE_INFRA_GRID_REJECTS_UNRELATED_MEGA_DELTA_SWALLOW' as const;
export const GRID_COEXISTENCE_LAYER =
  'COGNITIVE_INFRASTRUCTURE_GRID_COEXISTENCE_LAYER' as const;
export const MINI_CELL_PROD_BIND_DENIED =
  'MINI_CLOUD_CELL_WITHOUT_ENROLLMENT_CANNOT_BIND_PRODUCTION_NETWORK' as const;
export const UNENROLLED_FEDERATION_DENIED =
  'UNENROLLED_SERVER_OR_DB_FEDERATION_DENIED_OR_UNAVAILABLE' as const;
export const ARBITRARY_DISCOVERY_DENIED =
  'ARBITRARY_SERVER_OR_DB_DISCOVERY_SCAN_DENIED' as const;
export const WRITE_BY_DEFAULT_DENIED =
  'FEDERATION_DB_WRITE_DENIED_BY_DEFAULT' as const;
export const HISTORY_ROOT_WITHOUT_EVIDENCE_DENIED =
  'HISTORICAL_PATHWAY_WITHOUT_PROVENANCE_OR_EVIDENCE_CANNOT_ENTER_ROOT_GRAPH' as const;
export const UNAUTHORIZED_REGION_MINING_DENIED =
  'UNAUTHORIZED_ARCHIVE_REGION_MINING_DENIED' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_OR_AFTERLIFE_CAPABILITY_CLAIM_REJECTED' as const;
export const AGENT_CO_SPEND_DENIED =
  'AGENT_OPERATING_COMPANY_CANNOT_SPEND_OR_BILL' as const;
export const AGENT_CO_PERMISSION_DENIED =
  'AGENT_OPERATING_COMPANY_CANNOT_ESCALATE_PERMISSIONS' as const;
export const UNENROLLED_DEVICE_JOIN_DENIED =
  'UNENROLLED_DEVICE_FABRIC_JOIN_DENIED_OR_UNAVAILABLE' as const;
export const SEALED_CLOUD_CELL_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_TO_CLOUD_CELL_OR_GATEWAY' as const;
export const UNCONFIGURED_UNAVAILABLE =
  'UNCONFIGURED_PROVIDER_OR_CELL_UNAVAILABLE' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type CkActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'cognitive_infra_curator'
  | 'mini_cloud_cell_operator'
  | 'federation_broker'
  | 'historical_pathway_miner'
  | 'agent_operating_company_officer'
  | 'device_fabric_broker'
  | 'ordinary_agent'
  | 'impersonator';

export type CkActor = {
  kind: CkActorKind;
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
    CJ: {
      tipProbe: hasMod('intelligence-resource-grid-apprenticeship-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CJ_INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CJ Intelligence Resource Grid / Apprenticeship tip + report. WAITING_DATA until pushed with report.',
    },
    CI: {
      tipProbe: hasMod('persistent-intelligence-economy-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CI_PERSISTENT_INTELLIGENCE_ECONOMY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CI Persistent Intelligence Economy when CJ absent. WAITING_DATA until pushed with report.',
    },
    CH: {
      tipProbe: hasMod('knowledge-civilization-dept-universities-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CH_KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CH Knowledge Civilization / Dept Universities when CI absent.',
    },
    CG: {
      tipProbe: hasMod('deep-knowledge-refinery-os-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'CG Deep Knowledge Refinery OS used as CK base when CJ/CI/CH WAITING_DATA.',
    },
    CF: {
      tipProbe: hasMod('data-refinery-compression-replication-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CF Data Refinery / Compression / Replication ancestor.',
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
      note: 'CD Data-Root / Local LLM / Archive Mesh ancestor (DB connector patterns).',
    },
    BZ: {
      tipProbe: hasMod('global-compute-nervous-routing-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BZ_GLOBAL_COMPUTE_NERVOUS_ROUTING_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BZ Global Compute Nervous / Device Federation ancestor.',
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
