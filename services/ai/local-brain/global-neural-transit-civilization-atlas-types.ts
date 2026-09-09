import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DM — XIV Global Neural Transit Grid + Civilization Knowledge Atlas +
 * Verified Offline/Online Agent Workforce + Universal Device Runtime +
 * Heterogeneous Compute Fabric + Inclusive Business OS Ecosystem.
 *
 * SoT: GitHub #130. GitLab #64 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 */

export const GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_CYCLE = [
  'honesty_locks',
  'global_neural_transit_civilization_atlas_os_bootstrap',
  'unconfigured_chatgpt_cursor_plugin_capability_unavailable',
  'plugin_registration_neq_authority_credentials_billing',
  'unverified_mobile_desktop_platform_unavailable_or_not_tested',
  'atlas_intake_without_provenance_rights_denied',
  'user_demographic_profiling_denied',
  'under_18_denied_where_18_plus_required',
  'no_powered_node_waiting_or_offline_stopped',
  'stale_heartbeat_not_running_verified',
  'encrypted_offline_pack_tamper_checksum_fail_rejected',
  'cross_device_continuity_without_enrollment_denied',
  'new_agent_creation_bounded_no_self_grant_production_authority',
  'sealed_private_silent_share_denied',
  'evidence',
  'learning',
] as const;

export type DmHop = (typeof GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_CYCLE)[number];

export type DmEvidenceState =
  | 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'WAITING_NODE' | 'OFFLINE_STOPPED'
  | 'STALE' | 'UNKNOWN' | 'NOT_TESTED' | 'DENIED' | 'REJECTED' | 'SANDBOXED' | 'CANDIDATE'
  | 'DOCUMENTED' | 'IMPLEMENTED' | 'AVAILABLE' | 'VERIFIED' | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY' | 'PLAN_ONLY' | 'BOUNDED' | 'LABELED_SIMULATION' | 'LABELED_FORECAST'
  | 'PROBABILISTIC' | 'CORRELATION_ONLY' | 'NOT_APPLIED' | 'ATTRIBUTION_UNSAFE' | 'LOCAL_PREFERRED'
  | 'APPROVED' | 'CONFIGURED' | 'AUTHORIZED' | 'REGISTERED' | 'RUNNING_VERIFIED' | 'HYPOTHESIS'
  | 'UNPROMOTED' | 'SIGNED' | 'UNSIGNED' | 'CONSENSUS_ONLY' | 'TEST_ONLY' | 'ACCOUNTING_ONLY'
  | 'LOGICAL' | 'ARCHITECTURE_TARGET' | 'CONTRACT_ONLY' | 'ISOLATED_WORKSPACE'
  | 'RESEARCH_KNOWLEDGE_ONLY' | 'OPT_IN_REQUIRED' | 'MODERATED' | 'REVOKABLE' | 'VERIFY_ONLY'
  | 'ENROLLED' | 'TAMPER_REJECTED';

export type DmHopRecord = { hop: DmHop; state: DmEvidenceState; summary: string; at: string };

export const DM_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  FABRICATED_RUNTIME_STATE: false as const,
  LOGICAL_AGENT_EQ_RUNNING_VERIFIED: false as const,
  RUNNING_VERIFIED_REQUIRES_POWERED_AUTHORIZED_NODE: true as const,
  RUNNING_VERIFIED_REQUIRES_HEARTBEAT_EVIDENCE: true as const,
  STALE_HEARTBEAT_NOT_RUNNING_VERIFIED: true as const,
  FAKE_247_RUNNING_WITHOUT_NODE: false as const,
  NO_POWERED_NODE_YIELDS_WAITING_OR_STOPPED: true as const,
  CHATGPT_CURSOR_PLUGIN_VERIFY_ONLY: true as const,
  UNCONFIGURED_CAPABILITY_UNAVAILABLE: true as const,
  PLUGIN_REGISTRATION_EQ_AUTHORITY: false as const,
  PLUGIN_REGISTRATION_EQ_CREDENTIALS: false as const,
  PLUGIN_REGISTRATION_EQ_BILLING: false as const,
  UNVERIFIED_PLATFORM_CYCLE_HONEST: true as const,
  ATLAS_INTAKE_REQUIRES_PROVENANCE_AND_RIGHTS: true as const,
  ATLAS_WITHOUT_PROVENANCE_ALLOWED: false as const,
  USER_DEMOGRAPHIC_PROFILING: false as const,
  PROFILE_BY_RACE: false as const,
  PROFILE_BY_GENDER: false as const,
  PROFILE_BY_CULTURE: false as const,
  PROFILE_BY_BACKGROUND: false as const,
  INCLUSIVE_UX_WITHOUT_DEMOGRAPHIC_PROFILING: true as const,
  ADULT_18_PLUS_REQUIRED: true as const,
  UNDER_18_ONBOARDING_ALLOWED: false as const,
  ENCRYPTED_OFFLINE_PACK_TAMPER_REJECT: true as const,
  CROSS_DEVICE_CONTINUITY_REQUIRES_ENROLLMENT: true as const,
  CROSS_DEVICE_WITHOUT_ENROLLMENT: false as const,
  NEW_AGENT_CREATION_BOUNDED: true as const,
  LEARNING_EQ_PERMISSION: false as const,
  SELF_GRANT_PRODUCTION_AUTHORITY: false as const,
  SEALED_SILENT_PRIVATE_SHARE: false as const,
  PRIVATE_CROSS_TENANT_SILENT_SHARE: false as const,
  BUSINESS_OS_OPT_IN_REQUIRED: true as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  CPU_GPU_NPU_VERIFIED_ONLY: true as const,
  UNVERIFIED_COMPUTE_PLACEMENT: false as const,
  FULL_PRODUCTION_DM_SHIPPED: false as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  DM_IS_COEXISTENCE_LAYER: true as const,
  DM_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DN — XIV Universal Agent Runtime OS + Cross-Platform Device Fabric + Civilization Memory Graph + Global Cultural Intelligence Layer + Verified Autonomous Shift Scheduler + Plugin Intelligence Exchange + Heterogeneous Compute Optimization Brain + Sovereign Privacy & Security Kernel' as const;

export const GITHUB_SOT_ISSUE = 130 as const;
export const GITLAB_COORDINATION_ISSUE = 64 as const;

export const UNCONFIGURED_CAPABILITY_UNAVAILABLE =
  'UNCONFIGURED_CHATGPT_CURSOR_OR_PLUGIN_CAPABILITY_UNAVAILABLE' as const;
export const PLUGIN_REGISTRATION_NEQ_AUTHORITY =
  'PLUGIN_REGISTRATION_DOES_NOT_GRANT_AUTHORITY_CREDENTIALS_OR_BILLING' as const;
export const UNVERIFIED_PLATFORM_UNAVAILABLE_OR_NOT_TESTED =
  'UNVERIFIED_MOBILE_OR_DESKTOP_PLATFORM_UNAVAILABLE_OR_NOT_TESTED' as const;
export const ATLAS_WITHOUT_PROVENANCE_DENIED =
  'CIVILIZATION_ATLAS_INTAKE_WITHOUT_PROVENANCE_OR_RIGHTS_DENIED' as const;
export const DEMOGRAPHIC_PROFILING_DENIED =
  'USER_PROFILING_BY_RACE_GENDER_CULTURE_OR_BACKGROUND_DENIED' as const;
export const UNDER_18_DENIED = 'UNDER_18_DENIED_WHERE_18_PLUS_REQUIRED' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const STALE_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'STALE_HEARTBEAT_NOT_RUNNING_VERIFIED' as const;
export const OFFLINE_PACK_TAMPER_REJECTED =
  'ENCRYPTED_OFFLINE_PACK_TAMPER_OR_CHECKSUM_FAIL_REJECTED' as const;
export const CROSS_DEVICE_WITHOUT_ENROLLMENT_DENIED =
  'CROSS_DEVICE_CONTINUITY_WITHOUT_ENROLLMENT_DENIED' as const;
export const NEW_AGENT_BOUNDED_NO_SELF_GRANT =
  'NEW_AGENT_CREATION_BOUNDED_CANNOT_SELF_GRANT_PRODUCTION_AUTHORITY' as const;
export const SEALED_PRIVATE_SILENT_SHARE_DENIED =
  'SEALED_OR_PRIVATE_SILENT_CROSS_TENANT_SHARE_DENIED' as const;
export const UNVERIFIED_COMPUTE_PLACEMENT_DENIED =
  'UNVERIFIED_CPU_GPU_NPU_PLACEMENT_DENIED' as const;

export const MAX_TRANSIT_CORRIDORS = 2048 as const;
export const MAX_ATLAS_PACKS = 4096 as const;
export const MAX_WORKFORCE_AGENTS = 512 as const;
export const MAX_NEW_AGENTS_PER_CYCLE = 8 as const;
export const MAX_DEVICE_PROFILES = 256 as const;
export const MAX_COMPUTE_PLACEMENTS = 1024 as const;
export const MAX_BUSINESS_SURFACES = 512 as const;
export const MAX_OFFLINE_PACKS = 1024 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;
export const ADULT_MIN_AGE_YEARS = 18 as const;

export const CIVILIZATION_ATLAS_REGIONS = [
  'egypt', 'africa', 'china', 'americas', 'europe', 'middle_east',
  'south_asia', 'southeast_asia', 'pacific', 'indigenous_histories', 'diaspora_histories',
] as const;

export type CivilizationAtlasRegion = (typeof CIVILIZATION_ATLAS_REGIONS)[number];

export type DmActorKind =
  | 'ceo_principal' | 'human_operator' | 'transit_grid_governor' | 'atlas_curator'
  | 'workforce_verifier' | 'device_runtime_governor' | 'compute_fabric_governor'
  | 'inclusive_business_os_curator' | 'ordinary_agent' | 'impersonator';

export type DmActor = {
  kind: DmActorKind;
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

export type DevicePlatform = 'ios' | 'android' | 'web' | 'desktop';
export type ComputeKind = 'cpu' | 'gpu' | 'npu' | 'quantum_honesty';
export type ToolchainCapabilityId = 'chatgpt' | 'cursor' | 'plugin';
export type WorkforceAgentStatus =
  | 'LOGICAL' | 'REGISTERED' | 'WAITING_NODE' | 'OFFLINE_STOPPED'
  | 'RUNNING_VERIFIED' | 'HEARTBEAT_STALE' | 'DENIED' | 'UNKNOWN';

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
    DL: {
      tipProbe: hasMod('neural-transportation-os-types.ts') || has('62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'Preferred DL Neural Transportation OS tip + report. Poll with backoff when WAITING_DATA.',
    },
    DK: {
      tipProbe: hasMod('unified-intelligence-experience-os-types.ts') || has('62L_DK_UNIFIED_INTELLIGENCE_NEURAL_HIGHWAY_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DK_UNIFIED_INTELLIGENCE_NEURAL_HIGHWAY_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DK Unified Intelligence Experience OS fallback when DL absent.',
    },
    DJ: {
      tipProbe: hasMod('personal-intelligence-command-os-types.ts') || has('62L_DJ_PERSONAL_INTELLIGENCE_COMMAND_OS_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DJ_PERSONAL_INTELLIGENCE_COMMAND_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DJ Personal Intelligence Command OS fallback when DK absent.',
    },
    DI: {
      tipProbe: hasMod('personalized-intelligence-companion-os-types.ts') || has('62L_DI_PERSONALIZED_INTELLIGENCE_COMPANION_OS_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DI_PERSONALIZED_INTELLIGENCE_COMPANION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DI Personalized Intelligence Companion OS fallback when DJ absent.',
    },
    DH: {
      tipProbe: hasMod('adaptive-life-business-intelligence-os-types.ts') || has('62L_DH_ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DH_ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DH Adaptive Life & Business Intelligence OS fallback when DI absent.',
    },
    DG: {
      tipProbe: hasMod('universal-personal-business-ai-os-types.ts') || has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DG Universal Personal/Business AI OS fallback when DH absent.',
    },
    DF: {
      tipProbe: hasMod('human-centered-superbrain-ux-types.ts') || has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DF Human-Centered Superbrain UX in lineage.',
    },
    DE: {
      tipProbe: hasMod('knowledge-exchange-gateway-marketplace-types.ts') || has('62L_DE_KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DE_KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DE Knowledge Exchange Gateway Marketplace in lineage.',
    },
    DD: {
      tipProbe: hasMod('cognitive-service-mesh-types.ts') || has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DD Cognitive Service Mesh in lineage.',
    },
    DA: {
      tipProbe: hasMod('superbrain-runtime-kernel-types.ts') || has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DA Superbrain Runtime Kernel in lineage.',
    },
  };
}

export const METAPHOR_ARCHITECTURE = Object.freeze({
  neural_transit_grid:
    'Global sparse logical transit corridors expanding DL neural transportation / DK neural highways — not physical vehicle control',
  civilization_knowledge_atlas:
    'Lawful provenance-backed regional/civilization historical packs — not unauthorized scraping or demographic profiling',
  verified_agent_workforce:
    'Offline-first + online agents with RUNNING_VERIFIED only on powered authorized nodes + fresh heartbeat',
  universal_device_runtime:
    'iOS/Android/web/desktop runtime profiles; unverified platforms UNAVAILABLE/NOT_TESTED; continuity requires enrollment',
  heterogeneous_compute_fabric:
    'CPU/GPU/NPU placement verified-only; quantum claims honesty-bounded research labels',
  inclusive_business_os:
    'Opt-in community ecosystem; recommendation ≠ charge/deploy; ChatGPT/Cursor/plugin = verify-only capabilities',
} as const);
