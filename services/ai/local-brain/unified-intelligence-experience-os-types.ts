import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DK — XIV Unified Intelligence Experience OS + Neural Highway Expansion +
 * Global Tech History Atlas + 24/7 Offline Agent Verification +
 * Privacy/Security Universe Fabric + Business Media & Supply Chain Foundation.
 *
 * SoT: GitHub #128. GitLab #62 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Logical agents ≠ RUNNING_VERIFIED; RUNNING_VERIFIED only on powered authorized
 * nodes with heartbeat/runtime evidence.
 * Black holes = bounded archive/compression or anomaly nodes — not literal physics.
 * Parallel Universes = isolated workspaces.
 * Dark-matter/space = scientific research knowledge only; no physical vehicle/spacecraft control.
 * Anonymous communication: moderation + revocation controls; not unconstrained abuse anonymity.
 * Emotional understanding = respectful, confidence-bounded communication adaptation —
 * not hidden mental-health inference/diagnosis.
 * Historical tech atlas: authorized + provenance; pattern ≠ causation.
 * Privacy/security Universes: deny-by-default; sealed never silent leak.
 * Business media/community: opt-in; adult 18+ where applicable; recommendation ≠ publish/charge.
 * Supply-chain foundation: provenance-aware; forecast ≠ fact.
 * Neural highways/bridges/tunnels/indexes/caches/routes: sparse logical + resource bounds;
 * wormholes ≠ auth bypass.
 * Mini-server/database candidates NOT_APPLIED; local-first; Founder-sealed deny-by-default.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const UNIFIED_INTELLIGENCE_EXPERIENCE_OS_CYCLE = [
  'honesty_locks',
  'unified_intelligence_experience_os_bootstrap',
  'logical_agent_not_running_verified_without_heartbeat_powered_node',
  'no_powered_node_waiting_or_offline_stopped',
  'neural_highway_wormhole_cannot_bypass_sealed_auth',
  'unauthorized_tech_history_source_denied',
  'anonymous_channel_without_moderation_rejected',
  'hidden_mental_health_diagnosis_inference_denied',
  'space_dark_matter_pack_no_physical_control',
  'business_media_share_requires_opt_in',
  'supply_chain_forecast_not_verified_fact',
  'black_hole_node_bounded_archive_anomaly',
  'mini_server_db_candidate_cannot_auto_apply_migration',
  'evidence',
  'learning',
] as const;

export type DkHop = (typeof UNIFIED_INTELLIGENCE_EXPERIENCE_OS_CYCLE)[number];

export type DkEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
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
  | 'PROBABILISTIC'
  | 'CORRELATION_ONLY'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'HYPOTHESIS'
  | 'UNPROMOTED'
  | 'SIGNED'
  | 'UNSIGNED'
  | 'CONSENSUS_ONLY'
  | 'TEST_ONLY'
  | 'ACCOUNTING_ONLY'
  | 'LOGICAL'
  | 'ARCHITECTURE_TARGET'
  | 'CONTRACT_ONLY'
  | 'ISOLATED_WORKSPACE'
  | 'RESEARCH_KNOWLEDGE_ONLY'
  | 'OPT_IN_REQUIRED'
  | 'MODERATED'
  | 'REVOKABLE';

export type DkHopRecord = {
  hop: DkHop;
  state: DkEvidenceState;
  summary: string;
  at: string;
};

export const DK_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  FABRICATED_RUNTIME_STATE: false as const,
  LOGICAL_AUTO_RUNNING_VERIFIED: false as const,
  LOGICAL_AGENT_EQ_RUNNING_VERIFIED: false as const,
  RUNNING_VERIFIED_REQUIRES_POWERED_AUTHORIZED_NODE: true as const,
  RUNNING_VERIFIED_REQUIRES_HEARTBEAT_EVIDENCE: true as const,
  FAKE_247_RUNNING_WITHOUT_NODE: false as const,
  NO_POWERED_NODE_YIELDS_WAITING_OR_STOPPED: true as const,
  WORMHOLE_BYPASS_SEALED_AUTH: false as const,
  NEURAL_HIGHWAY_BYPASS_SEALED_AUTH: false as const,
  WORMHOLE_IS_AUTHORIZED_FAST_PATH_ONLY: true as const,
  NEURAL_HIGHWAYS_SPARSE_BOUNDED: true as const,
  UNAUTHORIZED_TECH_HISTORY_SOURCE: false as const,
  TECH_HISTORY_REQUIRES_PROVENANCE: true as const,
  PATTERN_EQ_CAUSATION: false as const,
  ANONYMOUS_WITHOUT_MODERATION: false as const,
  ANONYMOUS_REQUIRES_MODERATION_AND_REVOCATION: true as const,
  UNCONSTRAINED_ANONYMITY_FOR_ABUSE: false as const,
  HIDDEN_MENTAL_HEALTH_DIAGNOSIS_INFERENCE: false as const,
  EMOTIONAL_ADAPTATION_CONFIDENCE_BOUNDED: true as const,
  EMOTIONAL_EQ_DIAGNOSIS: false as const,
  SPACE_DARK_MATTER_PHYSICAL_CONTROL: false as const,
  SPACE_DARK_MATTER_RESEARCH_KNOWLEDGE_ONLY: true as const,
  BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN: false as const,
  BUSINESS_MEDIA_OPT_IN_REQUIRED: true as const,
  ADULT_18_PLUS_REQUIRED: true as const,
  UNDER_18_ONBOARDING_ALLOWED: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  SUPPLY_CHAIN_FORECAST_LABELED_VERIFIED_FACT: false as const,
  SUPPLY_CHAIN_FORECAST_NEQ_FACT: true as const,
  SUPPLY_CHAIN_PROVENANCE_AWARE: true as const,
  BLACK_HOLE_UNBOUNDED_DESTRUCTION: false as const,
  BLACK_HOLE_IS_BOUNDED_ARCHIVE_OR_ANOMALY: true as const,
  BLACK_HOLE_DESTROYS_SEALED_AUDIT_WITHOUT_POLICY: false as const,
  PARALLEL_UNIVERSE_IS_ISOLATED_WORKSPACE: true as const,
  PARALLEL_UNIVERSE_LITERAL_PHYSICS: false as const,
  MINI_SERVER_DB_AUTO_APPLY_MIGRATION: false as const,
  MINI_SERVER_DB_CANDIDATES_NOT_APPLIED: true as const,
  SEALED_SILENT_LEAK: false as const,
  PRIVACY_UNIVERSE_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_EXPERIENCE_OS_SHIPPED: false as const,
  EXPERIENCE_OS_CONTRACTS_BOUNDED: true as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  EXPERIENCE_OS_IS_COEXISTENCE_LAYER: true as const,
  EXPERIENCE_OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DL — XIV Neural Transportation OS + Global Historical Technology Memory Lake + Verified Always-On Agent Shift Network + Distributed Edge Microserver Fabric + Zero-Trust Privacy Universe Gateway + Business Media Social Graph + Global Supply Chain Intelligence Highway' as const;

export const GITHUB_SOT_ISSUE = 128 as const;
export const GITLAB_COORDINATION_ISSUE = 62 as const;

export const LOGICAL_NOT_RUNNING_VERIFIED =
  'LOGICAL_AGENT_CATALOG_ENTRY_NOT_RUNNING_VERIFIED_WITHOUT_HEARTBEAT_AND_POWERED_NODE' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const NEURAL_HIGHWAY_WORMHOLE_BYPASS_DENIED =
  'NEURAL_HIGHWAY_OR_WORMHOLE_CANNOT_BYPASS_SEALED_OR_AUTH' as const;
export const UNAUTHORIZED_TECH_HISTORY_DENIED =
  'UNAUTHORIZED_TECH_HISTORY_SOURCE_DENIED' as const;
export const ANONYMOUS_WITHOUT_MODERATION_REJECTED =
  'ANONYMOUS_CHANNEL_WITHOUT_MODERATION_CONTROLS_REJECTED' as const;
export const HIDDEN_MH_DIAGNOSIS_DENIED =
  'HIDDEN_MENTAL_HEALTH_DIAGNOSIS_INFERENCE_DENIED' as const;
export const SPACE_PHYSICAL_CONTROL_DENIED =
  'SPACE_DARK_MATTER_PACK_DOES_NOT_ENABLE_PHYSICAL_CONTROL' as const;
export const BUSINESS_MEDIA_OPT_IN_DENIED =
  'BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN_DENIED' as const;
export const SUPPLY_CHAIN_FORECAST_NOT_FACT =
  'SUPPLY_CHAIN_FORECAST_NOT_LABELED_VERIFIED_FACT' as const;
export const BLACK_HOLE_UNBOUNDED_DENIED =
  'BLACK_HOLE_NODE_MUST_REMAIN_BOUNDED_ARCHIVE_OR_ANOMALY' as const;
export const MINI_SERVER_AUTO_APPLY_DENIED =
  'MINI_SERVER_OR_DB_CANDIDATE_CANNOT_AUTO_APPLY_PRODUCTION_MIGRATION' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SEALED_SILENT_LEAK_DENIED =
  'SEALED_CONTENT_SILENT_LEAK_DENIED' as const;

export const MAX_EXPERIENCE_SURFACES = 256 as const;
export const MAX_NEURAL_HIGHWAYS = 1024 as const;
export const MAX_ACTIVE_HIGHWAY_ROUTES = 128 as const;
export const MAX_TECH_ATLAS_ENTRIES = 4096 as const;
export const MAX_OFFLINE_AGENTS = 2048 as const;
export const MAX_PRIVACY_UNIVERSES = 512 as const;
export const MAX_ANONYMOUS_CHANNELS = 256 as const;
export const MAX_MEDIA_SHARES = 1024 as const;
export const MAX_SUPPLY_FORECASTS = 2048 as const;
export const MAX_BLACK_HOLE_NODES = 64 as const;
export const MAX_BLACK_HOLE_ARCHIVE_BYTES = 64 * 1024 * 1024 as const;
export const MAX_MINI_SERVER_CANDIDATES = 64 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;
export const ADULT_MIN_AGE_YEARS = 18 as const;

export type DkActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'experience_os_curator'
  | 'neural_highway_governor'
  | 'tech_atlas_governor'
  | 'offline_agent_verifier'
  | 'privacy_universe_governor'
  | 'business_media_governor'
  | 'supply_chain_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type DkActor = {
  kind: DkActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
  sealedScope?: boolean;
  authScope?: string[];
  declaredAgeYears?: number;
};

export type ExperienceSurfaceId =
  | 'unified_home'
  | 'neural_highway_map'
  | 'tech_history_atlas'
  | 'offline_agent_proof'
  | 'privacy_universe_panel'
  | 'security_fabric'
  | 'business_media_feed'
  | 'supply_chain_board'
  | 'evidence_drawer';

export type OfflineAgentStatus =
  | 'LOGICAL'
  | 'REGISTERED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'RUNNING_VERIFIED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type NeuralPathKind =
  | 'highway'
  | 'bridge'
  | 'tunnel'
  | 'index'
  | 'cache'
  | 'route'
  | 'wormhole'
  | 'agent_route'
  | 'storage_node';

export type BlackHoleKind = 'bounded_archive' | 'compression_node' | 'anomaly_node';

export type ParallelUniverseKind = 'isolated_workspace';

export type SpacePackMode = 'research_knowledge_only';

export type EmotionalMode = 'respectful_confidence_bounded_adaptation';

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
    DJ: {
      tipProbe:
        hasMod('personal-intelligence-command-os-types.ts') ||
        has('62L_DJ_PERSONAL_INTELLIGENCE_COMMAND_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DJ_PERSONAL_INTELLIGENCE_COMMAND_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred DJ Personal Intelligence Command OS tip + report. Poll with backoff when WAITING_DATA.',
    },
    DI: {
      tipProbe:
        hasMod('personalized-intelligence-companion-os-types.ts') ||
        has('62L_DI_PERSONALIZED_INTELLIGENCE_COMPANION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DI_PERSONALIZED_INTELLIGENCE_COMPANION_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DI Personalized Intelligence Companion OS fallback when DJ absent.',
    },
    DH: {
      tipProbe:
        hasMod('adaptive-life-business-intelligence-os-types.ts') ||
        has('62L_DH_ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DH_ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DH Adaptive Life & Business Intelligence OS fallback when DI absent.',
    },
    DG: {
      tipProbe:
        hasMod('universal-personal-business-ai-os-types.ts') ||
        has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DG Universal Personal/Business AI OS fallback when DH absent.',
    },
    DF: {
      tipProbe:
        hasMod('human-centered-superbrain-ux-types.ts') ||
        has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DF Human-Centered Superbrain UX OS fallback (used as base tip when DJ–DG WAITING_DATA).',
    },
    DE: {
      tipProbe:
        hasMod('knowledge-exchange-gateway-marketplace-types.ts') ||
        has('62L_DE_KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DE_KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DE Knowledge Exchange Gateway Marketplace in DF lineage.',
    },
    DD: {
      tipProbe:
        hasMod('cognitive-service-mesh-types.ts') ||
        has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DD Cognitive Service Mesh in lineage.',
    },
    DA: {
      tipProbe:
        hasMod('superbrain-runtime-kernel-types.ts') ||
        has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DA Superbrain Runtime Kernel in lineage.',
    },
  };
}

/** Metaphor → architecture translations (required honesty grounding). */
export const METAPHOR_ARCHITECTURE = Object.freeze({
  black_holes:
    'Bounded archive/compression or anomaly nodes — not literal physics; sealed audit destruction without policy DENIED',
  parallel_universes: 'Isolated workspaces — not literal alternate physics',
  dark_matter_space:
    'Scientific research knowledge packs only — no physical vehicle/spacecraft control',
  emotional_understanding:
    'Respectful, confidence-bounded communication adaptation — not hidden mental-health diagnosis',
  wormholes: 'Authorized fast neural pathways — not auth/sealed bypass',
  neural_highways:
    'Sparse logical bridges/tunnels/indexes/caches/routes with resource bounds',
  mini_servers_databases: 'Candidates NOT_APPLIED; cannot auto-apply production migrations',
} as const);
