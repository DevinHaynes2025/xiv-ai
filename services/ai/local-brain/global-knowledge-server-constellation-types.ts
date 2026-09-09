import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CL — XIV Global Knowledge Server Constellation + International Archive
 * Mining Network + Multi-Cloud Data Highway Compiler + Historical Civilization
 * Knowledge Graph + Regional Agent Research Bureaus + Offline/Cloud Superbrain
 * Sync Fabric.
 *
 * SoT: GitHub #102. GitLab #36 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Regional cloud service cells = enrolled/isolated cells (builds on CK mini cells).
 * No arbitrary server discovery. No unsupported “all-world” coverage claims —
 * coverage labeled by enrolled/verified regions/sources only.
 * Archive intake: authorized sources only; provenance required.
 * Multi-cloud highways: configured+authorized only; sealed never silent cloud.
 * Offline/cloud sync: signed and revocable; conflict/checksum handling;
 * no auto-trust unverified packs.
 * Research bureaus bounded; learning ≠ permission; no autonomous spend.
 * Civilization temporal graphs: facts ≠ correlations ≠ hypotheses ≠ sims;
 * no soul claims. Founder-sealed deny-by-default. L4=false. tip-land=NO.
 */

export const GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_CYCLE = [
  'honesty_locks',
  'constellation_bootstrap',
  'enroll_regional_cell',
  'unenrolled_cell_unavailable',
  'arbitrary_server_discovery_denied',
  'all_world_coverage_rejected',
  'archive_intake_authorized',
  'unauthorized_archive_denied',
  'highway_compile_authorized',
  'unconfigured_highway_denied',
  'sealed_no_silent_cloud_highway',
  'civilization_graph_typed',
  'reject_sim_to_verified_fact',
  'bureau_open_bounded',
  'bureau_skill_no_permission',
  'sync_pack_signed',
  'unsigned_or_revoked_pack_rejected',
  'checksum_conflict_not_silent',
  'evidence',
  'learning',
] as const;

export type ClHop = (typeof GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_CYCLE)[number];

export type ClEvidenceState =
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
  | 'LOCAL_PREFERRED'
  | 'ENROLLED'
  | 'ISOLATED'
  | 'SIGNED'
  | 'REVOKED'
  | 'CONFLICT';

export type ClHopRecord = {
  hop: ClHop;
  state: ClEvidenceState;
  summary: string;
  at: string;
};

export const CL_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  ARBITRARY_SERVER_DISCOVERY: false as const,
  ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE: false as const,
  UNENROLLED_CELL_ALLOWED: false as const,
  REGIONAL_CELLS_REQUIRE_ENROLLMENT: true as const,
  REGIONAL_CELLS_ISOLATED_BY_DEFAULT: true as const,
  ARCHIVE_REQUIRES_AUTHORIZATION: true as const,
  ARCHIVE_REQUIRES_PROVENANCE: true as const,
  UNAUTHORIZED_ARCHIVE_INTAKE: false as const,
  HIGHWAY_REQUIRES_CONFIG_AUTH: true as const,
  HIGHWAY_UNCONFIGURED_ALLOWED: false as const,
  SEALED_SILENT_CLOUD_HIGHWAY: false as const,
  SYNC_REQUIRES_SIGNATURE: true as const,
  SYNC_REVOKABLE: true as const,
  AUTO_TRUST_UNVERIFIED_PACKS: false as const,
  SILENT_CHECKSUM_CONFLICT_ACCEPT: false as const,
  LEARNING_IS_PERMISSION: false as const,
  BUREAU_SKILL_IS_PERMISSION: false as const,
  BUREAU_SKILL_IS_AUTHORITY: false as const,
  AUTONOMOUS_SPEND: false as const,
  FACTS_EQ_CORRELATIONS: false as const,
  CORRELATIONS_EQ_HYPOTHESES: false as const,
  HYPOTHESES_EQ_SIMULATIONS: false as const,
  SIMULATIONS_EQ_VERIFIED_FACTS: false as const,
  SIM_PROMOTE_TO_VERIFIED_FACT: false as const,
  SOUL_RESURRECTION_CLAIMS: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  OS_IS_COEXISTENCE_LAYER: true as const,
  OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CM — XIV Sovereign Regional Knowledge Clouds + Global Archive Observatory + International Business/Law/Health/Supply Intelligence Grid + Knowledge Route Optimization Engine + Agent Embassy Network + Planetary Offline Knowledge Cache Fabric' as const;

export const GITHUB_SOT_ISSUE = 102 as const;
export const GITLAB_COORDINATION_ISSUE = 36 as const;

export const ARBITRARY_SERVER_DISCOVERY_DENIED =
  'ARBITRARY_SERVER_DISCOVERY_DENIED_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;
export const ALL_WORLD_COVERAGE_REJECTED =
  'ALL_WORLD_COVERAGE_CLAIM_WITHOUT_EVIDENCE_REJECTED_NOT_VERIFIED' as const;
export const UNENROLLED_REGIONAL_CELL_UNAVAILABLE =
  'UNENROLLED_REGIONAL_CELL_UNAVAILABLE' as const;
export const UNAUTHORIZED_ARCHIVE_INTAKE_DENIED =
  'UNAUTHORIZED_ARCHIVE_INTAKE_DENIED_PROVENANCE_REQUIRED' as const;
export const UNCONFIGURED_HIGHWAY_DENIED =
  'HIGHWAY_TO_UNCONFIGURED_CLOUD_DENIED_OR_UNAVAILABLE' as const;
export const SEALED_SILENT_CLOUD_HIGHWAY_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_ONTO_CLOUD_HIGHWAY' as const;
export const UNSIGNED_OR_REVOKED_SYNC_PACK_REJECTED =
  'UNSIGNED_OR_REVOKED_SYNC_PACK_REJECTED' as const;
export const CHECKSUM_CONFLICT_NOT_SILENT =
  'CHECKSUM_OR_CONFLICT_MISMATCH_NOT_SILENTLY_ACCEPTED' as const;
export const BUREAU_SKILL_NOT_PERMISSION =
  'BUREAU_SKILL_GRANT_DOES_NOT_ESCALATE_PERMISSIONS' as const;
export const SIM_TO_VERIFIED_FACT_REJECTED =
  'CIVILIZATION_GRAPH_REJECTS_PROMOTING_SIMULATION_TO_VERIFIED_FACT' as const;
export const COVERAGE_LABEL_ENROLLED_ONLY =
  'COVERAGE_LABELED_BY_ENROLLED_OR_VERIFIED_REGIONS_SOURCES_ONLY' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_RESURRECTION_CLAIM_REJECTED_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;

export const GRAPH_HARD_SEPARATION =
  'FACTS_NE_CORRELATIONS_NE_HYPOTHESES_NE_SIMULATIONS' as const;

export type CivilizationGraphNodeKind =
  | 'fact'
  | 'correlation'
  | 'hypothesis'
  | 'simulation';

export type CivilizationGraphTrustState =
  | 'recorded'
  | 'supported'
  | 'verified_fact'
  | 'rejected'
  | 'labeled_simulation';

export type CoverageClaimScope =
  | 'enrolled_regions'
  | 'verified_sources'
  | 'all_world'
  | 'unspecified';

export type ClActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'constellation_curator'
  | 'archive_miner'
  | 'highway_compiler'
  | 'graph_curator'
  | 'bureau_director'
  | 'sync_fabric_operator'
  | 'ordinary_agent'
  | 'impersonator';

export type ClActor = {
  kind: ClActorKind;
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

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()): Record<string, PredecessorProbe> {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  const localBrain = join(root, 'services/ai/local-brain');
  const hasMod = (file: string) => existsSync(join(localBrain, file));

  return {
    CK: {
      tipProbe:
        hasMod('cognitive-infra-mini-cloud-history-types.ts') ||
        has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CK Cognitive Infra / Mini-Cloud / History tip + report. Regional cells build on CK mini cells when PRESENT.',
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
      note: 'CJ Intelligence Resource Grid / Apprenticeship when CK absent.',
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
      note: 'CI Persistent Intelligence Economy when CJ/CK absent.',
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
      note: 'CH Knowledge Civilization / Dept Universities — used as scaffold base when CK/CJ/CI WAITING_DATA.',
    },
    CG: {
      tipProbe:
        hasMod('deep-knowledge-refinery-os-types.ts') ||
        has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CG Deep Knowledge Refinery OS tip + report.',
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
      note: 'CF Data Refinery / Compression / Replication @ 5daacde lineage.',
    },
    CE: {
      tipProbe:
        hasMod('knowledge-excavation-memory-lake-types.ts') ||
        has('62L_CE_KNOWLEDGE_EXCAVATION_MEMORY_LAKE_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CE_KNOWLEDGE_EXCAVATION_MEMORY_LAKE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CE Knowledge Excavation / Memory Lake @ 4a902ca lineage.',
    },
  };
}
