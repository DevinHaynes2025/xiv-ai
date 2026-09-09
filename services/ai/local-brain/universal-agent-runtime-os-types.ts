import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DN — XIV Universal Agent Runtime OS + Cross-Platform Device Fabric +
 * Civilization Memory Graph + Global Cultural Intelligence Layer +
 * Verified Autonomous Shift Scheduler + Plugin Intelligence Exchange +
 * Heterogeneous Compute Optimization Brain + Sovereign Privacy & Security Kernel.
 *
 * SoT: GitHub #131. GitLab #65 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Unify device, civilization-history, plugin, agent-workforce, compute into
 * runtime layer — coexistence, not unsafe mega-merge.
 * Installed plugins are not automatically trusted; compatibility testing required;
 * registration ≠ authority.
 * Device compatibility must be tested; unverified → UNAVAILABLE/NOT_TESTED.
 * Historical/civilization datasets require provenance and rights.
 * Culturally respectful 18+ UX; no profiling by race/gender/culture/background.
 * RUNNING_VERIFIED only with fresh runtime evidence; else WAITING_NODE/OFFLINE_STOPPED.
 * Bounded offline/online agent shifts; learning ≠ permission.
 * CPU/GPU/NPU optimization: verified targets only; no spend authority.
 * Sovereign privacy/security kernel: deny-by-default; sealed never silent leak.
 * Local-first; Founder-sealed deny-by-default.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const UNIVERSAL_AGENT_RUNTIME_OS_CYCLE = [
  'honesty_locks',
  'universal_agent_runtime_os_bootstrap',
  'installed_plugin_without_compat_trust_gate_not_auto_trusted',
  'plugin_cannot_elevate_permissions_without_trust',
  'unverified_device_platform_unavailable_or_not_tested',
  'civilization_memory_without_provenance_rights_denied',
  'demographic_profiling_feature_denied',
  'under_18_denied_where_18_plus_required',
  'shift_scheduler_no_powered_node_waiting_or_offline_stopped',
  'stale_heartbeat_not_running_verified',
  'unconfigured_accelerator_unavailable',
  'optimizer_cannot_spend_or_bill',
  'sealed_silent_leak_via_plugin_or_device_fabric_denied',
  'plugin_exchange_registration_neq_credentials_billing_deploy',
  'evidence',
  'learning',
] as const;

export type DnHop = (typeof UNIVERSAL_AGENT_RUNTIME_OS_CYCLE)[number];

export type DnEvidenceState =
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
  | 'REVOKABLE'
  | 'COMPAT_REQUIRED'
  | 'UNTRUSTED'
  | 'TRUSTED_COMPAT'
  | 'ENROLLED';

export type DnHopRecord = {
  hop: DnHop;
  state: DnEvidenceState;
  summary: string;
  at: string;
};

export const DN_LOCKS = Object.freeze({
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
  INSTALLED_PLUGIN_AUTO_TRUSTED: false as const,
  PLUGIN_COMPAT_TRUST_GATE_REQUIRED: true as const,
  PLUGIN_ELEVATE_WITHOUT_TRUST: false as const,
  PLUGIN_REGISTRATION_EQ_AUTHORITY: false as const,
  PLUGIN_REGISTRATION_EQ_CREDENTIALS: false as const,
  PLUGIN_REGISTRATION_EQ_BILLING: false as const,
  PLUGIN_REGISTRATION_EQ_DEPLOY: false as const,
  UNVERIFIED_DEVICE_AVAILABLE: false as const,
  UNVERIFIED_DEVICE_UNAVAILABLE_OR_NOT_TESTED: true as const,
  CIVILIZATION_MEMORY_REQUIRES_PROVENANCE_AND_RIGHTS: true as const,
  CIVILIZATION_WITHOUT_PROVENANCE_ALLOWED: false as const,
  USER_DEMOGRAPHIC_PROFILING: false as const,
  PROFILE_BY_RACE: false as const,
  PROFILE_BY_GENDER: false as const,
  PROFILE_BY_CULTURE: false as const,
  PROFILE_BY_BACKGROUND: false as const,
  DEMOGRAPHIC_PROFILING_FEATURE_OFFERED: false as const,
  INCLUSIVE_UX_WITHOUT_DEMOGRAPHIC_PROFILING: true as const,
  ADULT_18_PLUS_REQUIRED: true as const,
  UNDER_18_ONBOARDING_ALLOWED: false as const,
  UNCONFIGURED_ACCELERATOR_AVAILABLE: false as const,
  UNVERIFIED_ACCELERATOR_AVAILABLE: false as const,
  CPU_GPU_NPU_VERIFIED_ONLY: true as const,
  OPTIMIZER_SPEND_AUTHORITY: false as const,
  OPTIMIZER_BILLING_AUTHORITY: false as const,
  SEALED_SILENT_LEAK: false as const,
  SEALED_SILENT_LEAK_VIA_PLUGIN: false as const,
  SEALED_SILENT_LEAK_VIA_DEVICE_FABRIC: false as const,
  PRIVACY_KERNEL_DENY_BY_DEFAULT: true as const,
  LEARNING_EQ_PERMISSION: false as const,
  SHIFTS_BOUNDED: true as const,
  FULL_PRODUCTION_DN_SHIPPED: false as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  DN_IS_COEXISTENCE_LAYER: true as const,
  DN_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
  UNSAFE_MEGA_MERGE: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DO — XIV Distributed Cognitive Runtime Fabric + Universal Device/Chip Capability Graph + Global Civilization & Innovation Memory Lake + Agent Skill Exchange Network + Adaptive Offline/Cloud Workload Brain + Zero-Trust Data Highway + Cross-Cultural Business Intelligence Engine + Runtime Health & Evolution Command Center' as const;

export const GITHUB_SOT_ISSUE = 131 as const;
export const GITLAB_COORDINATION_ISSUE = 65 as const;

export const PLUGIN_NOT_AUTO_TRUSTED =
  'INSTALLED_PLUGIN_WITHOUT_COMPAT_TRUST_GATE_NOT_AUTO_TRUSTED' as const;
export const PLUGIN_ELEVATE_DENIED =
  'PLUGIN_CANNOT_ELEVATE_PERMISSIONS_WITHOUT_TRUST_GATE' as const;
export const UNVERIFIED_DEVICE_UNAVAILABLE_OR_NOT_TESTED =
  'UNVERIFIED_DEVICE_PLATFORM_UNAVAILABLE_OR_NOT_TESTED' as const;
export const CIVILIZATION_WITHOUT_PROVENANCE_DENIED =
  'CIVILIZATION_MEMORY_INTAKE_WITHOUT_PROVENANCE_OR_RIGHTS_DENIED' as const;
export const DEMOGRAPHIC_PROFILING_DENIED =
  'DEMOGRAPHIC_PROFILING_FEATURE_DENIED_NOT_OFFERED' as const;
export const UNDER_18_DENIED = 'UNDER_18_DENIED_WHERE_18_PLUS_REQUIRED' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const STALE_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'STALE_HEARTBEAT_NOT_RUNNING_VERIFIED' as const;
export const UNCONFIGURED_ACCELERATOR_UNAVAILABLE =
  'UNCONFIGURED_ACCELERATOR_UNAVAILABLE' as const;
export const OPTIMIZER_SPEND_BILL_DENIED =
  'OPTIMIZER_CANNOT_SPEND_OR_BILL' as const;
export const SEALED_SILENT_LEAK_DENIED =
  'SEALED_DATA_SILENT_LEAK_VIA_PLUGIN_OR_DEVICE_FABRIC_DENIED' as const;
export const PLUGIN_REGISTRATION_NEQ_CREDENTIALS_BILLING_DEPLOY =
  'PLUGIN_EXCHANGE_REGISTRATION_NEQ_CREDENTIALS_BILLING_OR_DEPLOY' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;

export const MAX_RUNTIME_SURFACES = 512 as const;
export const MAX_DEVICE_PROFILES = 256 as const;
export const MAX_CIVILIZATION_NODES = 8192 as const;
export const MAX_CULTURAL_PACKS = 2048 as const;
export const MAX_SHIFT_SLOTS = 2048 as const;
export const MAX_PLUGIN_EXCHANGE_ENTRIES = 2048 as const;
export const MAX_COMPUTE_PLANS = 1024 as const;
export const MAX_SEALED_ATTEMPTS = 4096 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;
export const ADULT_MIN_AGE_YEARS = 18 as const;
export const MAX_NEW_SHIFTS_PER_CYCLE = 16 as const;

export const CIVILIZATION_MEMORY_REGIONS = [
  'egypt',
  'africa',
  'china',
  'americas',
  'europe',
  'middle_east',
  'south_asia',
  'southeast_asia',
  'pacific',
  'indigenous_histories',
  'diaspora_histories',
] as const;

export type CivilizationMemoryRegion = (typeof CIVILIZATION_MEMORY_REGIONS)[number];

export type DnActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'runtime_os_governor'
  | 'device_fabric_governor'
  | 'civilization_memory_curator'
  | 'cultural_intelligence_curator'
  | 'shift_scheduler_governor'
  | 'plugin_exchange_governor'
  | 'compute_optimization_governor'
  | 'sovereign_privacy_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type DnActor = {
  kind: DnActorKind;
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

export type DevicePlatform = 'ios' | 'android' | 'web' | 'desktop' | 'edge';

export type ComputeAcceleratorKind = 'cpu' | 'gpu' | 'npu' | 'quantum_honesty';

export type ShiftAgentStatus =
  | 'LOGICAL'
  | 'REGISTERED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'RUNNING_VERIFIED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN'
  | 'BOUNDED_SHIFT';

export type PluginTrustState =
  | 'INSTALLED_UNTRUSTED'
  | 'COMPAT_PENDING'
  | 'COMPAT_FAILED'
  | 'TRUSTED_COMPAT'
  | 'DENIED'
  | 'REGISTERED_ONLY';

export type RuntimeSurfaceId =
  | 'universal_runtime_home'
  | 'device_fabric_map'
  | 'civilization_memory_graph'
  | 'cultural_intelligence'
  | 'shift_scheduler'
  | 'plugin_exchange'
  | 'compute_optimization'
  | 'sovereign_privacy_kernel'
  | 'evidence_drawer';

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
    DM: {
      tipProbe:
        hasMod('global-neural-transit-civilization-atlas-types.ts') ||
        has('62L_DM_GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DM_GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred DM Global Neural Transit + Civilization Atlas tip + report. Poll with backoff when WAITING_DATA.',
    },
    DL: {
      tipProbe:
        hasMod('neural-transportation-os-types.ts') ||
        has('62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DL Neural Transportation OS fallback when DM absent.',
    },
    DK: {
      tipProbe:
        hasMod('unified-intelligence-experience-os-types.ts') ||
        has('62L_DK_UNIFIED_INTELLIGENCE_NEURAL_HIGHWAY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DK_UNIFIED_INTELLIGENCE_NEURAL_HIGHWAY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DK Unified Intelligence Experience OS fallback when DL absent.',
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
      note: 'DF Human-Centered Superbrain UX in lineage.',
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

export const METAPHOR_ARCHITECTURE = Object.freeze({
  universal_agent_runtime_os:
    'Unified coexistence runtime layer for agents across environments — not unsafe mega-merge of unrelated deltas',
  cross_platform_device_fabric:
    'Verified portability profiles for mobile/desktop/edge; unverified → UNAVAILABLE/NOT_TESTED',
  civilization_memory_graph:
    'Lawful provenance-backed civilization-memory graphs extending DM atlas — rights required',
  global_cultural_intelligence:
    'Culturally respectful inclusive intelligence; no demographic profiling by race/gender/culture/background',
  verified_autonomous_shift_scheduler:
    'Bounded offline/online agent shifts; RUNNING_VERIFIED only with fresh evidence on powered authorized nodes',
  plugin_intelligence_exchange:
    'Plugin compatibility testing/exchange; installed ≠ trusted; registration ≠ credentials/billing/deploy',
  heterogeneous_compute_optimization_brain:
    'CPU/GPU/NPU optimization on verified targets only; no spend/billing authority',
  sovereign_privacy_security_kernel:
    'Deny-by-default kernel; sealed never silent leak via plugin or device fabric',
} as const);
