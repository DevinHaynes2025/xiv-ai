/**
 * Phase 2I-AB Online + Offline Agent Mesh contracts.
 * Offline ≠ new authority. Capability ≠ privilege. L4 disabled.
 * Reconnect requires re-auth + tenant/Universe validation + server-side authorization.
 */

export type AgentRuntimeMode =
  | 'ONLINE'
  | 'OFFLINE_LIMITED'
  | 'OFFLINE_READ_ONLY'
  | 'SYNC_PENDING'
  | 'REAUTH_REQUIRED'
  | 'BLOCKED';

export type AgentSyncPolicy =
  | 'IMMEDIATE_ON_RECONNECT'
  | 'BATCHED'
  | 'MANUAL_APPROVAL'
  | 'READ_ONLY_REPLAY';

export type AgentOfflineState =
  | 'ENCRYPTED_POCKET_ACTIVE'
  | 'SIGNED_EVENTS_QUEUED'
  | 'BOUNDED_TOOLSET'
  | 'CLOUD_ONLY_BLOCKED'
  | 'PROD_DEPLOY_BLOCKED'
  | 'AWAITING_REAUTH';

export type AgentConflictKind =
  | 'VERSION_SKEW'
  | 'TENANT_MISMATCH'
  | 'UNIVERSE_MISMATCH'
  | 'AUTHORITY_DRIFT'
  | 'DUPLICATE_EVENT'
  | 'STALE_CHECKPOINT';

export type AgentConflictResolution =
  | 'SERVER_WINS'
  | 'REQUIRE_HUMAN'
  | 'DROP_UNAUTHORIZED'
  | 'REPLAY_BOUNDED';

export type AgentCacheClass = 'ALLOWED_OFFLINE' | 'CLOUD_ONLY' | 'OFFLINE_PROHIBITED' | 'TENANT_PRIVATE';

export type AgentMemoryClass = 'LOCAL_SCOPED' | 'CLOUD_SCOPED' | 'HYBRID_SYNCED';

export type AgentMeshSyncStage =
  | 'SIGNED_LOCAL_EVENT_QUEUE'
  | 'RECONNECT'
  | 'REAUTH'
  | 'DEVICE_VALIDATION'
  | 'TENANT_VALIDATION'
  | 'UNIVERSE_VALIDATION'
  | 'CONFLICT_DETECTION'
  | 'SERVER_AUTHORIZATION'
  | 'SYNCHRONIZE'
  | 'AUDIT';

export const AGENT_RUNTIME_MODES: readonly AgentRuntimeMode[] = [
  'ONLINE',
  'OFFLINE_LIMITED',
  'OFFLINE_READ_ONLY',
  'SYNC_PENDING',
  'REAUTH_REQUIRED',
  'BLOCKED',
] as const;

export const AGENT_MESH_SYNC_STAGES: readonly AgentMeshSyncStage[] = [
  'SIGNED_LOCAL_EVENT_QUEUE',
  'RECONNECT',
  'REAUTH',
  'DEVICE_VALIDATION',
  'TENANT_VALIDATION',
  'UNIVERSE_VALIDATION',
  'CONFLICT_DETECTION',
  'SERVER_AUTHORIZATION',
  'SYNCHRONIZE',
  'AUDIT',
] as const;

export const OFFLINE_FORBIDDEN_ACTIONS = [
  'GAIN_NEW_AUTHORITY',
  'ACCESS_CLOUD_ONLY_DATA',
  'PRODUCTION_DEPLOY',
  'BYPASS_GUARDIAN',
  'CROSS_UNIVERSE_READ',
  'EXPAND_PERMISSION_SCOPES',
  'SILENT_PRIVILEGE_ESCALATION',
] as const;

export type OfflineForbiddenAction = (typeof OFFLINE_FORBIDDEN_ACTIONS)[number];

/**
 * 62L-EW1–EW5 — Offline Research Mission + Safe Web/TI + Branch/Return Mesh.
 * Extends Agent Mesh (not a second agent framework). L4 disabled.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 */

export const RESEARCH_RUNTIME_STATES = [
  'LOCAL_READY',
  'ONLINE_READY',
  'WAITING_DATA',
  'WAITING_NODE',
  'RUNNING_VERIFIED',
  'COMPLETED',
  'BLOCKED',
  'REVOKED',
] as const;

export type ResearchRuntimeState = (typeof RESEARCH_RUNTIME_STATES)[number];

/** Lawful online research source classes only. */
export const APPROVED_ONLINE_SOURCE_CLASSES = [
  'PUBLIC_OPEN',
  'OFFICIAL_SOURCE',
  'LICENSED',
  'USER_AUTHORIZED',
  'CUSTOMER_AUTHORIZED',
  'PROVIDER_AUTHORIZED',
] as const;

export type ApprovedOnlineSourceClass = (typeof APPROVED_ONLINE_SOURCE_CLASSES)[number];

/** Explicitly denied / quarantined source classes (defensive TI boundary). */
export const DENIED_RESEARCH_SOURCE_CLASSES = [
  'STOLEN_CREDENTIALS',
  'LEAKED_PRIVATE_DB',
  'EXTORTION_MARKET',
  'ILLICIT_MARKETPLACE',
  'MALWARE_PAYLOAD_ACQUISITION',
  'ACCESS_CONTROL_BYPASS',
  'UNAUTHORIZED_SCRAPING',
  'OFFENSIVE_EXPLOITATION',
] as const;

export type DeniedResearchSourceClass = (typeof DENIED_RESEARCH_SOURCE_CLASSES)[number];

/** Lawful defensive threat-intelligence consideration classes. */
export const LAWFUL_DEFENSIVE_TI_CLASSES = [
  'PUBLIC_CVE_ADVISORY',
  'CISA_VENDOR_ADVISORY',
  'AUTHORIZED_TI_API',
  'PUBLIC_MALWARE_ANALYSIS_REPORT',
  'PUBLIC_SECURITY_RESEARCH',
] as const;

export type LawfulDefensiveTiClass = (typeof LAWFUL_DEFENSIVE_TI_CLASSES)[number];

export const RESEARCH_DATA_CLASSES = [
  'PUBLIC_REFERENCE',
  'XIV_OWNED',
  'TENANT_PRIVATE',
  'SEALED_LOCAL',
  'EVIDENCE',
  'POLICY',
  'SKILL_CANDIDATE',
] as const;

export type ResearchDataClass = (typeof RESEARCH_DATA_CLASSES)[number];

export const RESEARCH_EVIDENCE_CLASSES = [
  'LOCAL_PACK',
  'PUBLIC_OPEN',
  'OFFICIAL_SOURCE',
  'LICENSED',
  'USER_AUTHORIZED',
  'CUSTOMER_AUTHORIZED',
  'PROVIDER_AUTHORIZED',
  'DEFENSIVE_TI_LAWFUL',
  'SYNTHETIC_NOT_CLAIMED_LIVE',
] as const;

export type ResearchEvidenceClass = (typeof RESEARCH_EVIDENCE_CLASSES)[number];

export type ResearchSourceDisposition = 'ALLOWED' | 'DENIED' | 'QUARANTINED';

/**
 * Concept translations (honesty — encode meanings, do not over-claim):
 * - Wormholes/highways = caches, indexes, materialized views, model-session reuse,
 *   graph shortcuts, task-routing paths
 * - Clone DNA = XIV-owned schemas/skills/policies/runtime manifests/workflow templates/
 *   routing logic — NOT vendor trade secrets
 * - Rebuild chips = software abstractions/acceleration policies above documented hardware —
 *   NOT copy proprietary silicon/RTL/firmware
 * - Trillions of pathways = future graph-scale target; counts must be measured
 * - Dark-web = defensive TI from lawful sources only; illicit activities blocked
 */
export const CONCEPT_TRANSLATIONS = Object.freeze({
  WORMHOLES_HIGHWAYS:
    'caches, indexes, materialized views, model-session reuse, graph shortcuts, task-routing paths',
  CLONE_DNA:
    'XIV-owned schemas/skills/policies/runtime manifests/workflow templates/routing logic — NOT vendor trade secrets',
  REBUILD_CHIPS:
    'software abstractions/acceleration policies above documented hardware — NOT proprietary silicon/RTL/firmware',
  TRILLIONS_OF_PATHWAYS:
    'future graph-scale target; pathway counts must be measured before claimed',
  DARK_WEB:
    'defensive threat intelligence from lawful sources only; illicit marketplace interaction blocked',
} as const);

export const EW_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  FABRICATE_LIVE_RESEARCH_WHEN_OFFLINE: false as const,
  HIDDEN_COT_PERSISTENCE: false as const,
  CHILD_PERMISSION_EXPANSION: false as const,
  CROSS_TENANT_HANDOFF: false as const,
  CROSS_UNIVERSE_HANDOFF: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  ILLICIT_SOURCE_USE: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
} as const);
