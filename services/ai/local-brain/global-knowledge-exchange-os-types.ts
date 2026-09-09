import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CO — XIV Global Knowledge Exchange OS + Regional Micro-Cloud Fabric +
 * International Archive Discovery Engine + Historical Trade/Technology Civilization Graph +
 * Cross-Cloud Knowledge Compression + Worldwide Research Coordination Grid.
 *
 * SoT: GitHub #105. GitLab #39 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Exchange only across approved regional micro-clouds, servers, databases, archives,
 * APIs, edge nodes, offline packs. Preserve provenance, residency, classification,
 * and explicit UNKNOWN gaps (never invent coverage). No arbitrary discovery; no
 * all-world claims without evidence. No default raw private pooling; signed/revocable
 * packs/deltas. Cross-cloud compression = candidates; security/correctness/residency
 * beat size/speed. Local-first; sealed never silent cloud fallback. Worldwide research
 * coordination = bounded regional workcells; learning ≠ permission; no autonomous spend.
 * Historical trade/technology graph: facts ≠ correlations ≠ hypotheses ≠ sims.
 * Founder-sealed deny-by-default. L4=false. tip-land=NO.
 */

export const GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE = [
  'honesty_locks',
  'exchange_approved_endpoint',
  'exchange_unapproved_endpoint_denied',
  'missing_residency_classification_provenance_denied_or_unknown',
  'unknown_gap_preserved',
  'micro_cloud_fabric_enroll',
  'archive_discovery_authorized',
  'unauthorized_archive_discovery_denied',
  'compression_candidate_gated',
  'compression_not_auto_production_authorized',
  'sealed_no_silent_cross_cloud',
  'unsigned_or_revoked_pack_rejected',
  'research_workcell_bounded',
  'research_permission_spend_escalation_denied',
  'trade_tech_graph_provenance_typed',
  'graph_reject_correlation_sim_to_verified_fact',
  'all_world_coverage_without_evidence_not_verified',
  'evidence',
  'learning',
] as const;

export type CoHop = (typeof GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE)[number];

export type CoEvidenceState =
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
  | 'LABELED_CORRELATION'
  | 'LABELED_HYPOTHESIS'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'ENROLLED'
  | 'APPROVED'
  | 'SIGNED'
  | 'REVOKED'
  | 'COMPRESSED_CANDIDATE';

export type CoHopRecord = {
  hop: CoHop;
  state: CoEvidenceState;
  summary: string;
  at: string;
};

export const CO_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  EXCHANGE_REQUIRES_APPROVED_ENDPOINT: true as const,
  UNAPPROVED_ENDPOINT_EXCHANGE: false as const,
  REQUIRE_RESIDENCY: true as const,
  REQUIRE_CLASSIFICATION: true as const,
  REQUIRE_PROVENANCE: true as const,
  MISSING_META_SILENT_ALLOW: false as const,
  INVENT_COVERAGE_FOR_UNKNOWN_GAP: false as const,
  PRESERVE_EXPLICIT_UNKNOWN_GAPS: true as const,
  ARBITRARY_ARCHIVE_DISCOVERY: false as const,
  ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE: false as const,
  RAW_PRIVATE_POOLING_DEFAULT: false as const,
  COMPRESSION_AUTO_PRODUCTION_AUTHORIZED: false as const,
  COMPRESSION_IS_CANDIDATE_ONLY: true as const,
  SECURITY_CORRECTNESS_RESIDENCY_BEATS_SIZE_SPEED: true as const,
  SEALED_SILENT_CROSS_CLOUD: false as const,
  UNSIGNED_PACK_ACCEPT: false as const,
  REVOKED_PACK_ACCEPT: false as const,
  PACK_REQUIRES_SIGNATURE: true as const,
  PACK_REVOCABLE: true as const,
  RESEARCH_WORKCELL_BOUNDED: true as const,
  RESEARCH_PERMISSION_ESCALATION: false as const,
  RESEARCH_AUTONOMOUS_SPEND: false as const,
  LEARNING_IS_PERMISSION: false as const,
  FACTS_EQ_CORRELATIONS: false as const,
  CORRELATIONS_EQ_HYPOTHESES: false as const,
  HYPOTHESES_EQ_SIMULATIONS: false as const,
  SIMULATIONS_EQ_VERIFIED_FACTS: false as const,
  CORRELATION_PROMOTE_TO_VERIFIED_FACT: false as const,
  SIM_PROMOTE_TO_VERIFIED_FACT: false as const,
  AUTONOMOUS_SPENDING: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CP — XIV Global Knowledge Supply Chain + Regional Data Refinery Nodes + International Institutional Memory Graph + Historical Economic/Industrial Pathway Engine + Multi-Cloud Knowledge Distribution Network + Global Agent Research Operations Center' as const;

export const GITHUB_SOT_ISSUE = 105 as const;
export const GITLAB_COORDINATION_ISSUE = 39 as const;

export const UNAPPROVED_ENDPOINT_EXCHANGE_DENIED =
  'EXCHANGE_TO_UNAPPROVED_ENDPOINT_DENIED' as const;
export const MISSING_META_DENIED_OR_UNKNOWN =
  'MISSING_RESIDENCY_CLASSIFICATION_OR_PROVENANCE_DENIED_OR_UNKNOWN' as const;
export const UNKNOWN_GAP_PRESERVED =
  'EXPLICIT_UNKNOWN_GAP_PRESERVED_NOT_FABRICATED' as const;
export const UNAUTHORIZED_ARCHIVE_DISCOVERY_DENIED =
  'UNAUTHORIZED_ARCHIVE_DISCOVERY_DENIED' as const;
export const COMPRESSION_NOT_PRODUCTION_AUTHORIZED =
  'COMPRESSION_CANDIDATE_NOT_AUTO_PRODUCTION_AUTHORIZED' as const;
export const SEALED_CROSS_CLOUD_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_CROSS_CLOUD' as const;
export const UNSIGNED_OR_REVOKED_PACK_REJECTED =
  'UNSIGNED_OR_REVOKED_PACK_REJECTED' as const;
export const RESEARCH_AUTHORITY_DENIED =
  'RESEARCH_WORKCELL_CANNOT_ESCALATE_PERMISSIONS_OR_SPEND' as const;
export const GRAPH_PROMOTE_REJECTED =
  'TRADE_TECH_GRAPH_REJECTS_PROMOTING_CORRELATION_OR_SIM_TO_VERIFIED_FACT' as const;
export const ALL_WORLD_COVERAGE_NOT_VERIFIED =
  'ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE_NOT_VERIFIED' as const;
export const GRAPH_HARD_SEPARATION =
  'FACTS_NE_CORRELATIONS_NE_HYPOTHESES_NE_SIMULATIONS' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type CoActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'exchange_os'
  | 'micro_cloud_fabric'
  | 'archive_discovery'
  | 'trade_tech_graph'
  | 'compression_engine'
  | 'research_coordinator'
  | 'ordinary_agent'
  | 'impersonator';

export type CoActor = {
  kind: CoActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type EndpointKind =
  | 'regional_micro_cloud'
  | 'server'
  | 'database'
  | 'archive'
  | 'api'
  | 'edge_node'
  | 'offline_pack';

export type GraphEdgeKind =
  | 'fact'
  | 'correlation'
  | 'hypothesis'
  | 'simulation';

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
    CN: {
      tipProbe:
        hasMod('world-knowledge-routing-os-types.ts') ||
        has('62L_CN_WORLD_KNOWLEDGE_ROUTING_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CN_WORLD_KNOWLEDGE_ROUTING_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CN World Knowledge Routing OS tip + report. Exchange builds on CN routing when PRESENT.',
    },
    CM: {
      tipProbe:
        hasMod('sovereign-regional-knowledge-clouds-types.ts') ||
        has('62L_CM_SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CM_SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CM Sovereign Regional Knowledge Clouds when CN absent.',
    },
    CL: {
      tipProbe:
        hasMod('global-knowledge-server-constellation-types.ts') ||
        has('62L_CL_GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CL_GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CL Global Knowledge Server Constellation — used as base when CN/CM WAITING_DATA.',
    },
    CK: {
      tipProbe:
        hasMod('cognitive-infra-mini-cloud-history-types.ts') ||
        has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CK Cognitive Infra / Mini-Cloud / History when CL absent.',
    },
    CJ: {
      tipProbe:
        hasMod('intelligence-resource-grid-apprenticeship-types.ts') ||
        has('62L_CJ_INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CJ_INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CJ Intelligence Resource Grid / Apprenticeship fallback.',
    },
    CI: {
      tipProbe:
        hasMod('persistent-intelligence-economy-types.ts') ||
        has('62L_CI_PERSISTENT_INTELLIGENCE_ECONOMY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CI_PERSISTENT_INTELLIGENCE_ECONOMY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CI Persistent Intelligence Economy ancestor.',
    },
    CH: {
      tipProbe:
        hasMod('knowledge-civilization-dept-universities-types.ts') ||
        has('62L_CH_KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CH_KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CH Knowledge Civilization / Dept Universities lineage.',
    },
    CG: {
      tipProbe:
        hasMod('deep-knowledge-refinery-os-types.ts') ||
        has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CG Deep Knowledge Refinery OS @ 87fdf05 lineage.',
    },
    CF: {
      tipProbe:
        hasMod('data-refinery-compression-replication-types.ts') ||
        has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CF Data Refinery / Compression / Replication lineage.',
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
