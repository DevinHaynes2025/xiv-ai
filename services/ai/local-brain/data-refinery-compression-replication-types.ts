import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CF — Global Data Refinery Civilization + Autonomous Archive Research Shifts +
 * Neural Knowledge Compression Engine + Multi-Provider Intelligence Router +
 * Semiconductor/Device Optimization Lab + Distributed Offline Knowledge Replication Fabric.
 *
 * SoT: GitHub #96. GitLab #30 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Authorized sources only; no silent arbitrary DB/web scrape.
 * Local-first; sealed/local-only never silently falls back to cloud.
 * Provider circuit breakers; unconfigured providers UNAVAILABLE.
 * Compression/quantization/placement = research/candidates; security & correctness ahead of size/speed/energy.
 * Offline replication: checksum-based; revocation + conflict handling; no auto-trust unverified packs.
 * Archive research shifts are bounded; rare-knowledge discovery ≠ unauthorized archive access.
 * Learning ≠ permission; write deny-by-default on connectors; Founder-sealed deny-by-default.
 * No soul-resurrection claims in historical material. L4=false. tip-land=NO.
 */

export const DATA_REFINERY_COMPRESSION_REPLICATION_CYCLE = [
  'honesty_locks',
  'raw_intake_authorize',
  'unauthorized_raw_intake_denied',
  'normalize_quality_dedupe_classify',
  'compress_into_knowledge_pack',
  'council_evaluate_local_first',
  'distribute_approved_only',
  'unapproved_universe_device_denied',
  'archive_shift_bounded',
  'archive_authorization_bounds',
  'compression_candidate_not_production',
  'provider_route_local_first',
  'provider_circuit_breaker',
  'unconfigured_provider_unavailable',
  'sealed_never_cloud_route',
  'device_lab_placement_sandbox',
  'quantization_lab_sandbox',
  'offline_replicate_checksum',
  'revoked_pack_rejected',
  'checksum_mismatch_conflict',
  'evidence',
  'learning',
] as const;

export type CfHop = (typeof DATA_REFINERY_COMPRESSION_REPLICATION_CYCLE)[number];

export type CfEvidenceState =
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
  | 'CONFLICT'
  | 'REVOKED'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'CIRCUIT_OPEN'
  | 'LABELED_SIMULATION';

export type CfHopRecord = {
  hop: CfHop;
  state: CfEvidenceState;
  summary: string;
  at: string;
};

export const CF_LOCKS = Object.freeze({
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
  AUTHORIZED_SOURCES_ONLY: true as const,
  ARBITRARY_DB_WEB_SCRAPE: false as const,
  LOCAL_FIRST_ROUTING: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  LOCAL_ONLY_SILENT_CLOUD_FALLBACK: false as const,
  UNCONFIGURED_PROVIDER_AVAILABLE: false as const,
  PROVIDER_CIRCUIT_BREAKERS: true as const,
  COMPRESSION_AUTO_PRODUCTION: false as const,
  QUANTIZATION_AUTO_PRODUCTION: false as const,
  PLACEMENT_AUTO_PRODUCTION: false as const,
  SECURITY_CORRECTNESS_BEATS_SIZE_SPEED_ENERGY: true as const,
  OFFLINE_REPLICATION_CHECKSUM_REQUIRED: true as const,
  AUTO_TRUST_UNVERIFIED_PACKS: false as const,
  REVOKED_PACK_IMPORT_ALLOWED: false as const,
  CHECKSUM_MISMATCH_SILENT_ACCEPT: false as const,
  ARCHIVE_SHIFTS_BOUNDED: true as const,
  RARE_KNOWLEDGE_BYPASSES_AUTHORIZATION: false as const,
  SOUL_RESURRECTION_CLAIMS: false as const,
  CONNECTOR_WRITE_DENY_BY_DEFAULT: true as const,
  UNAPPROVED_UNIVERSE_DISTRIBUTION: false as const,
  UNAPPROVED_DEVICE_DISTRIBUTION: false as const,
  DEVICE_LAB_SANDBOX_ONLY: true as const,
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
  '62L-CG — XIV Deep Knowledge Refinery OS + Autonomous Research Universities + Global Archive Graph Federation + Intelligent Storage/Index Compiler + Multi-Model Reasoning Fabric + Edge Superbrain Deployment Orchestrator' as const;

export const GITHUB_SOT_ISSUE = 96 as const;
export const GITLAB_COORDINATION_ISSUE = 30 as const;

export const UNAUTHORIZED_RAW_INTAKE_DENIED =
  'UNAUTHORIZED_RAW_INTAKE_DENIED' as const;
export const UNAPPROVED_DISTRIBUTION_DENIED =
  'REFINERY_PACK_NOT_DISTRIBUTED_TO_UNAPPROVED_UNIVERSE_OR_DEVICE' as const;
export const PROVIDER_CIRCUIT_OPEN =
  'PROVIDER_CIRCUIT_OPEN_OR_UNAVAILABLE' as const;
export const UNCONFIGURED_PROVIDER_UNAVAILABLE =
  'UNCONFIGURED_PROVIDER_UNAVAILABLE' as const;
export const SEALED_CLOUD_ROUTE_DENIED =
  'SEALED_CONTENT_CANNOT_ROUTE_TO_CLOUD_PROVIDER' as const;
export const COMPRESSION_NOT_PRODUCTION =
  'COMPRESSION_CANDIDATE_NOT_AUTO_PRODUCTION_AUTHORIZED' as const;
export const REVOKED_PACK_REJECTED =
  'REVOKED_PACK_REJECTED_ON_REPLICATE_OR_IMPORT' as const;
export const CHECKSUM_MISMATCH_REJECTED =
  'CHECKSUM_MISMATCH_CONFLICT_OR_REJECT_NOT_SILENT_ACCEPT' as const;
export const QUANTIZATION_LAB_SANDBOX =
  'QUANTIZATION_OR_PLACEMENT_LAB_OUTPUT_REMAINS_SANDBOX' as const;
export const ARCHIVE_SHIFT_BOUNDS =
  'ARCHIVE_RESEARCH_SHIFT_RESPECTS_AUTHORIZATION_BOUNDS' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_RESURRECTION_CLAIM_REJECTED_IN_HISTORICAL_MATERIAL' as const;
export const ARBITRARY_SCRAPE_DENIED =
  'ARBITRARY_DB_OR_WEB_SCRAPE_DENIED' as const;

export const REFINERY_STAGES = [
  'authorize_raw',
  'normalize',
  'quality_check',
  'dedupe',
  'classify',
  'compress_pack',
  'council_evaluate',
  'distribute_approved',
] as const;

export type RefineryStage = (typeof REFINERY_STAGES)[number];

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type CfActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'refinery_agent'
  | 'archive_shift_agent'
  | 'compression_engine'
  | 'intelligence_router'
  | 'device_optimization_lab'
  | 'replication_fabric_agent'
  | 'ordinary_agent'
  | 'impersonator';

export type CfActor = {
  kind: CfActorKind;
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
    CE: {
      tipProbe: hasMod('knowledge-excavation-memory-lake-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CE_KNOWLEDGE_EXCAVATION_MEMORY_LAKE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred CE Knowledge Excavation / Memory Lake tip + report.',
    },
    CD: {
      tipProbe: hasMod('data-root-local-llm-archive-mesh-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CD_DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CD Data-Root / Local LLM / Archive Mesh when CE absent.',
    },
    CA: {
      tipProbe: hasMod('distributed-intelligence-metabolism-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CA_DISTRIBUTED_INTELLIGENCE_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CA/CB/CC may be absent from queue; probe for modules/reports.',
    },
    CB: {
      tipProbe: hasMod('cb-types.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CB_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CB probe (may never have been queued).',
    },
    CC: {
      tipProbe: hasMod('cc-types.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CC_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CC probe (may never have been queued).',
    },
    BZ: {
      tipProbe: hasMod('global-compute-nervous-routing-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BZ_GLOBAL_COMPUTE_NERVOUS_ROUTING_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BZ Global Compute Nervous / Routing fallback base @ ff72b94.',
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
