import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DL — XIV Neural Transportation OS + Global Historical Technology Memory Lake +
 * Verified Always-On Agent Shift Network + Distributed Edge Microserver Fabric +
 * Zero-Trust Privacy Universe Gateway + Business Media Social Graph +
 * Global Supply Chain Intelligence Highway.
 *
 * SoT: GitHub #129. GitLab #63 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Neural highways move knowledge/tasks/events/handoffs/storage/community/supply-chain
 * intelligence with explicit route policies, congestion control, recovery, revocation, audit.
 * Wormholes/fast paths ≠ auth/sealed bypass.
 * RUNNING_VERIFIED only with authorized powered node + fresh heartbeat/runtime proof;
 * else WAITING_NODE or OFFLINE_STOPPED — no pretend 24/7 work.
 * Historical technology memory lake: authorized + provenance.
 * Edge microserver fabric: candidates/enrollment; NOT_APPLIED to production infra; no stealth install.
 * Zero-trust Privacy Universe gateway; deny-by-default; moderated anonymity if present.
 * Business Media social graph: opt-in; adult 18+ where applicable.
 * Supply-chain intelligence highway: provenance-aware; forecast ≠ fact.
 * Local-first; Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const NEURAL_TRANSPORTATION_OS_CYCLE = [
  'honesty_locks',
  'neural_transportation_os_bootstrap',
  'route_without_policy_allowlist_denied',
  'congestion_control_engages_under_pressure',
  'revoked_route_rejected',
  'unsigned_unaudited_transport_rejected',
  'sealed_raw_private_cannot_silent_route',
  'no_powered_node_waiting_or_offline_stopped',
  'stale_heartbeat_not_running_verified',
  'unauthorized_tech_history_lake_intake_denied',
  'unenrolled_microserver_unavailable',
  'business_media_share_without_opt_in_denied',
  'supply_chain_forecast_not_verified_fact',
  'wormhole_cannot_bypass_zero_trust_gateway',
  'evidence',
  'learning',
] as const;

export type DlHop = (typeof NEURAL_TRANSPORTATION_OS_CYCLE)[number];

export type DlEvidenceState =
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
  | 'ENROLLED'
  | 'OPT_IN_REQUIRED'
  | 'MODERATED'
  | 'REVOKABLE'
  | 'AUDITED'
  | 'CONGESTED';

export type DlHopRecord = {
  hop: DlHop;
  state: DlEvidenceState;
  summary: string;
  at: string;
};

export const DL_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  ROUTE_WITHOUT_POLICY_ALLOWLIST: false as const,
  ROUTE_REQUIRES_EXPLICIT_POLICY: true as const,
  UNBOUNDED_TRANSPORT_SPAWN: false as const,
  CONGESTION_CONTROL_REQUIRED: true as const,
  REVOKED_ROUTE_ACCEPTED: false as const,
  UNSIGNED_UNAUDITED_TRANSPORT_WHERE_REQUIRED: false as const,
  SIGNATURE_AUDIT_REQUIRED_WHEN_POLICY: true as const,
  SEALED_RAW_PRIVATE_SILENT_ROUTE: false as const,
  WORMHOLE_BYPASS_ZERO_TRUST_GATEWAY: false as const,
  WORMHOLE_IS_AUTHORIZED_FAST_PATH_ONLY: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  FABRICATED_RUNTIME_STATE: false as const,
  FAKE_247_RUNNING_WITHOUT_NODE: false as const,
  RUNNING_VERIFIED_REQUIRES_POWERED_AUTHORIZED_NODE: true as const,
  RUNNING_VERIFIED_REQUIRES_FRESH_HEARTBEAT: true as const,
  NO_POWERED_NODE_YIELDS_WAITING_OR_STOPPED: true as const,
  STALE_HEARTBEAT_EQ_RUNNING_VERIFIED: false as const,
  UNAUTHORIZED_TECH_HISTORY_LAKE_INTAKE: false as const,
  TECH_HISTORY_LAKE_REQUIRES_PROVENANCE: true as const,
  UNENROLLED_MICROSERVER_AVAILABLE: false as const,
  EDGE_MICROSERVER_STEALTH_INSTALL: false as const,
  EDGE_MICROSERVER_CANDIDATES_NOT_APPLIED: true as const,
  EDGE_MICROSERVER_AUTO_APPLY_PROD_INFRA: false as const,
  PRIVACY_GATEWAY_DENY_BY_DEFAULT: true as const,
  ANONYMOUS_WITHOUT_MODERATION: false as const,
  BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN: false as const,
  BUSINESS_MEDIA_OPT_IN_REQUIRED: true as const,
  ADULT_18_PLUS_REQUIRED: true as const,
  SUPPLY_CHAIN_FORECAST_LABELED_VERIFIED_FACT: false as const,
  SUPPLY_CHAIN_FORECAST_NEQ_FACT: true as const,
  SUPPLY_CHAIN_PROVENANCE_AWARE: true as const,
  LEARNING_EQ_PERMISSION: false as const,
  LEARNING_CANNOT_SELF_GRANT: true as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_TRANSPORT_OS_SHIPPED: false as const,
  TRANSPORT_OS_CONTRACTS_BOUNDED: true as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  TRANSPORT_OS_IS_COEXISTENCE_LAYER: true as const,
  TRANSPORT_OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DM — XIV Global Neural Transit Grid + Historical Enterprise/Technology Intelligence Warehouse + Verified Agent Operations Center + Edge Data Center Federation + Sovereign Privacy Routing Layer + Business Media Intelligence Network + End-to-End Supply Chain Digital Twin Highway' as const;

export const GITHUB_SOT_ISSUE = 129 as const;
export const GITLAB_COORDINATION_ISSUE = 63 as const;

export const ROUTE_WITHOUT_POLICY_DENIED =
  'ROUTE_WITHOUT_POLICY_OR_ALLOWLIST_DENIED' as const;
export const CONGESTION_CONTROL_ENGAGED =
  'CONGESTION_CONTROL_ENGAGED_BOUNDED_NO_UNBOUNDED_SPAWN' as const;
export const REVOKED_ROUTE_REJECTED = 'REVOKED_ROUTE_REJECTED' as const;
export const UNSIGNED_UNAUDITED_REJECTED =
  'UNSIGNED_OR_UNAUDITED_TRANSPORT_REJECTED_WHERE_SIGNATURES_REQUIRED' as const;
export const SEALED_SILENT_ROUTE_DENIED =
  'SEALED_OR_RAW_PRIVATE_CANNOT_SILENT_ROUTE_ON_HIGHWAY' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const STALE_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'STALE_HEARTBEAT_NOT_RUNNING_VERIFIED' as const;
export const UNAUTHORIZED_TECH_LAKE_DENIED =
  'UNAUTHORIZED_TECH_HISTORY_LAKE_INTAKE_DENIED' as const;
export const UNENROLLED_MICROSERVER_UNAVAILABLE =
  'UNENROLLED_MICROSERVER_UNAVAILABLE' as const;
export const EDGE_STEALTH_INSTALL_DENIED =
  'EDGE_MICROSERVER_STEALTH_INSTALL_DENIED' as const;
export const EDGE_AUTO_APPLY_DENIED =
  'EDGE_MICROSERVER_AUTO_APPLY_PRODUCTION_INFRA_DENIED' as const;
export const BUSINESS_MEDIA_OPT_IN_DENIED =
  'BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN_DENIED' as const;
export const SUPPLY_CHAIN_FORECAST_NOT_FACT =
  'SUPPLY_CHAIN_FORECAST_NOT_LABELED_VERIFIED_FACT' as const;
export const WORMHOLE_ZERO_TRUST_BYPASS_DENIED =
  'WORMHOLE_CANNOT_BYPASS_ZERO_TRUST_PRIVACY_UNIVERSE_GATEWAY' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const LEARNING_AUTHORITY_SELF_GRANT_DENIED =
  'LEARNING_CANNOT_SELF_GRANT_PERMISSION' as const;

export const MAX_TRANSPORT_OS_SURFACES = 256 as const;
export const MAX_ROUTE_POLICIES = 1024 as const;
export const MAX_ACTIVE_TRANSPORTS = 64 as const;
export const MAX_TRANSPORT_AUDIT_EVENTS = 8192 as const;
export const MAX_TECH_LAKE_ENTRIES = 8192 as const;
export const MAX_AGENT_SHIFTS = 2048 as const;
export const MAX_EDGE_MICROSERVERS = 256 as const;
export const MAX_PRIVACY_GATEWAYS = 512 as const;
export const MAX_SOCIAL_GRAPH_EDGES = 4096 as const;
export const MAX_SUPPLY_HIGHWAY_ROUTES = 1024 as const;
export const MAX_SUPPLY_FORECASTS = 2048 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;
export const ADULT_MIN_AGE_YEARS = 18 as const;

export type DlActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'transport_os_governor'
  | 'neural_highway_governor'
  | 'tech_lake_governor'
  | 'shift_network_verifier'
  | 'edge_fabric_governor'
  | 'privacy_gateway_governor'
  | 'business_media_governor'
  | 'supply_chain_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type DlActor = {
  kind: DlActorKind;
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

export type TransportCargoKind =
  | 'knowledge'
  | 'task'
  | 'event'
  | 'agent_handoff'
  | 'storage'
  | 'community_object'
  | 'supply_chain_intelligence';

export type TransportSurfaceId =
  | 'transport_os_home'
  | 'highway_policy_board'
  | 'tech_memory_lake'
  | 'agent_shift_board'
  | 'edge_microserver_fabric'
  | 'privacy_universe_gateway'
  | 'business_media_graph'
  | 'supply_chain_highway'
  | 'evidence_drawer';

export type AgentShiftStatus =
  | 'LOGICAL'
  | 'REGISTERED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'RUNNING_VERIFIED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

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
    DK: {
      tipProbe:
        hasMod('unified-intelligence-experience-os-types.ts') ||
        has('62L_DK_UNIFIED_INTELLIGENCE_NEURAL_HIGHWAY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DK_UNIFIED_INTELLIGENCE_NEURAL_HIGHWAY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred DK Unified Intelligence Neural Highway tip + report. Poll with backoff when WAITING_DATA.',
    },
    DJ: {
      tipProbe:
        hasMod('personal-intelligence-command-os-types.ts') ||
        has('62L_DJ_PERSONAL_INTELLIGENCE_COMMAND_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DJ_PERSONAL_INTELLIGENCE_COMMAND_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DJ Personal Intelligence Command OS fallback when DK absent.',
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
      note: 'DF Human-Centered Superbrain UX OS fallback.',
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
      note: 'DE Knowledge Exchange Gateway Marketplace in lineage.',
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
