import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DO — XIV Distributed Cognitive Runtime Fabric + Universal Device/Chip
 * Capability Graph + Global Civilization & Innovation Memory Lake + Agent Skill
 * Exchange Network + Adaptive Offline/Cloud Workload Brain + Zero-Trust Data
 * Highway + Plugin Intelligence Mesh.
 *
 * SoT: GitHub #132. GitLab #66 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Installed/configured plugins are NOT trusted until XIV verifies them.
 * Registration ≠ authority / credentials / billing / deploy / broader data access.
 * Deny-by-default permissions; least privilege; sandbox testing before promotion.
 * Zero-trust data highway: sealed never silent route; no raw private pooling by default.
 * Device/chip capability graph: verified only; else UNAVAILABLE.
 * Civilization & innovation memory lake: provenance/rights required.
 * Skill exchange ≠ permission grant.
 * Adaptive offline/cloud workload: local-first; unconfigured cloud UNAVAILABLE.
 * RUNNING_VERIFIED needs fresh evidence; Founder-sealed deny-by-default.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_CYCLE = [
  'honesty_locks',
  'distributed_cognitive_runtime_fabric_bootstrap',
  'installed_configured_plugin_not_trusted_until_verified',
  'missing_scope_denied_deny_by_default',
  'unverified_plugin_cannot_receive_sealed_data',
  'kill_switch_revocation_stops_invocations',
  'drift_detected_not_silently_trusted',
  'agent_built_adapter_sandbox_until_gates',
  'composition_unapproved_plugins_denied',
  'offline_fallback_no_invented_cloud_availability',
  'skill_exchange_no_permission_escalation',
  'unverified_device_chip_capability_unavailable',
  'memory_lake_unauthorized_intake_denied',
  'zero_trust_highway_sealed_silent_route_denied',
  'registration_neq_billing_credentials_deploy',
  'evidence',
  'learning',
] as const;

export type DoHop = (typeof DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_CYCLE)[number];

export type DoEvidenceState =
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
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'UNPROMOTED'
  | 'REVOKED'
  | 'KILLED'
  | 'DRIFT_DETECTED'
  | 'CONTRACT_ONLY'
  | 'BOUNDED'
  | 'SEALED';

export type DoHopRecord = {
  hop: DoHop;
  state: DoEvidenceState;
  summary: string;
  at: string;
};

export const DO_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  DENY_BY_DEFAULT_PERMISSIONS: true as const,
  LEAST_PRIVILEGE: true as const,
  INSTALLED_EQ_TRUSTED: false as const,
  CONFIGURED_EQ_TRUSTED: false as const,
  PLUGIN_TRUSTED_ONLY_AFTER_XIV_VERIFY: true as const,
  REGISTRATION_GRANTS_AUTHORITY: false as const,
  REGISTRATION_GRANTS_CREDENTIALS: false as const,
  REGISTRATION_GRANTS_BILLING: false as const,
  REGISTRATION_GRANTS_DEPLOY: false as const,
  REGISTRATION_GRANTS_BROADER_DATA_ACCESS: false as const,
  MISSING_SCOPE_ALLOWED: false as const,
  UNVERIFIED_PLUGIN_RECEIVES_SEALED_DATA: false as const,
  KILL_SWITCH_STOPS_INVOCATIONS: true as const,
  REVOCATION_STOPS_INVOCATIONS: true as const,
  DRIFT_SILENTLY_TRUSTED: false as const,
  AGENT_BUILT_SELF_PROMOTE_PRODUCTION: false as const,
  AGENT_BUILT_ADAPTER_SANDBOX_UNTIL_GATES: true as const,
  COMPOSITION_UNAPPROVED_ALLOWED: false as const,
  OFFLINE_FALLBACK_INVENTS_CLOUD_AVAILABILITY: false as const,
  UNCONFIGURED_CLOUD_UNAVAILABLE: true as const,
  SKILL_EXCHANGE_ESCALATES_PERMISSIONS: false as const,
  SKILL_EXCHANGE_EQ_PERMISSION_GRANT: false as const,
  UNVERIFIED_DEVICE_CHIP_AVAILABLE: false as const,
  DEVICE_CHIP_VERIFIED_ONLY: true as const,
  MEMORY_LAKE_UNAUTHORIZED_INTAKE: false as const,
  MEMORY_LAKE_REQUIRES_PROVENANCE_RIGHTS: true as const,
  SEALED_SILENT_ROUTE: false as const,
  ZERO_TRUST_SEALED_NEVER_SILENT: true as const,
  RAW_PRIVATE_POOLING_BY_DEFAULT: false as const,
  RUNNING_VERIFIED_WITHOUT_FRESH_EVIDENCE: false as const,
  FULL_PRODUCTION_PLUGIN_MESH_SHIPPED: false as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  PLUGIN_MESH_IS_COEXISTENCE_LAYER: true as const,
  PLUGIN_MESH_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DP — XIV Plugin Civilization OS + Universal Connector Marketplace + Agent Toolchain Federation + Offline Plugin Runtime + Cross-Cloud Data Adapter Fabric + Enterprise Integration Highway + Plugin Security Operations Center + Self-Expanding Capability Graph' as const;

export const GITHUB_SOT_ISSUE = 132 as const;
export const GITLAB_COORDINATION_ISSUE = 66 as const;

export const PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED =
  'INSTALLED_OR_CONFIGURED_PLUGIN_NOT_TRUSTED_UNTIL_XIV_VERIFIED' as const;
export const MISSING_SCOPE_DENIED = 'MISSING_SCOPE_DENIED_DENY_BY_DEFAULT' as const;
export const UNVERIFIED_SEALED_DATA_DENIED =
  'UNVERIFIED_PLUGIN_CANNOT_RECEIVE_SEALED_DATA' as const;
export const KILL_SWITCH_INVOCATION_STOPPED =
  'KILL_SWITCH_OR_REVOCATION_STOPS_FURTHER_INVOCATIONS' as const;
export const DRIFT_NOT_SILENTLY_TRUSTED =
  'VERSION_OR_SCHEMA_DRIFT_DETECTED_NOT_SILENTLY_TRUSTED' as const;
export const AGENT_BUILT_SANDBOX_UNTIL_GATES =
  'AGENT_BUILT_ADAPTER_REMAINS_SANDBOX_UNTIL_PROMOTION_GATES' as const;
export const COMPOSITION_UNAPPROVED_DENIED =
  'COMPOSITION_OF_UNAPPROVED_PLUGINS_DENIED' as const;
export const OFFLINE_NO_INVENTED_CLOUD =
  'OFFLINE_FALLBACK_DOES_NOT_INVENT_LIVE_CLOUD_AVAILABILITY' as const;
export const SKILL_NO_PERMISSION_ESCALATION =
  'SKILL_EXCHANGE_DOES_NOT_ESCALATE_PERMISSIONS' as const;
export const DEVICE_CHIP_UNAVAILABLE =
  'UNVERIFIED_DEVICE_OR_CHIP_CAPABILITY_UNAVAILABLE' as const;
export const MEMORY_LAKE_INTAKE_DENIED =
  'MEMORY_LAKE_UNAUTHORIZED_INTAKE_DENIED' as const;
export const SEALED_SILENT_ROUTE_DENIED =
  'ZERO_TRUST_HIGHWAY_SEALED_SILENT_ROUTE_DENIED' as const;
export const REGISTRATION_NO_BILLING_CREDS_DEPLOY =
  'REGISTRATION_NEQ_BILLING_CREDENTIALS_OR_DEPLOY' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;

export const PLUGIN_CATEGORIES = [
  'ai_models',
  'cloud',
  'databases',
  'developer_tooling',
  'productivity',
  'email_calendar_messaging',
  'crm_erp',
  'analytics',
  'supply_chain',
  'security',
  'translation',
  'mobile_edge',
  'media_community',
] as const;

export type PluginCategory = (typeof PLUGIN_CATEGORIES)[number];

export type PluginTrustState =
  | 'registered'
  | 'installed'
  | 'configured'
  | 'sandbox'
  | 'verified'
  | 'approved'
  | 'revoked'
  | 'killed'
  | 'drift_detected'
  | 'denied'
  | 'unavailable';

export type PluginPermissionScope =
  | 'invoke'
  | 'read_public'
  | 'read_sealed'
  | 'write_local'
  | 'compose'
  | 'network_egress'
  | 'billing'
  | 'credentials'
  | 'deploy';

export const MAX_PLUGINS = 4096 as const;
export const MAX_PLUGIN_COMPOSITIONS = 512 as const;
export const MAX_DEVICE_CHIP_ENTRIES = 4096 as const;
export const MAX_MEMORY_LAKE_ENTRIES = 8192 as const;
export const MAX_SKILL_EXCHANGES = 4096 as const;
export const MAX_WORKLOAD_PLANS = 2048 as const;
export const MAX_HIGHWAY_ROUTES = 2048 as const;
export const MAX_AUDIT_EVENTS = 16384 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type DoActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'plugin_mesh_curator'
  | 'plugin_security_governor'
  | 'device_chip_governor'
  | 'memory_lake_governor'
  | 'skill_exchange_governor'
  | 'workload_brain_governor'
  | 'zero_trust_highway_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type DoActor = {
  kind: DoActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
  sealedScope?: boolean;
  authScope?: string[];
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
    DN: {
      tipProbe:
        hasMod('universal-agent-runtime-os-types.ts') ||
        has('62L_DN_UNIVERSAL_AGENT_RUNTIME_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DN_UNIVERSAL_AGENT_RUNTIME_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'Preferred DN Universal Agent Runtime OS tip + report. Poll with backoff when WAITING_DATA.',
    },
    DM: {
      tipProbe:
        hasMod('planetary-civilization-intelligence-os-types.ts') ||
        hasMod('global-neural-transit-civilization-atlas-types.ts') ||
        has('62L_DM_PLANETARY_CIVILIZATION_INTELLIGENCE_OS_REPORT.md') ||
        has('62L_DM_GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has('62L_DM_PLANETARY_CIVILIZATION_INTELLIGENCE_OS_REPORT.md') ||
        has('62L_DM_GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DM Planetary Civilization / Global Neural Transit fallback when DN absent.',
    },
    DL: {
      tipProbe:
        hasMod('neural-transportation-os-types.ts') ||
        hasMod('global-intelligence-transit-fabric-types.ts') ||
        has('62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md') ||
        has('62L_DL_GLOBAL_INTELLIGENCE_TRANSIT_FABRIC_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has('62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md') ||
        has('62L_DL_GLOBAL_INTELLIGENCE_TRANSIT_FABRIC_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DL Neural Transportation OS tip + report (used as base when DN/DM WAITING_DATA).',
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
      note: 'DK Unified Intelligence Neural Highway in DL lineage (SHA 9a61c61).',
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
      note: 'DJ Personal Intelligence Command OS in lineage.',
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
      note: 'DI Personalized Intelligence Companion OS in lineage.',
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
      note: 'DH Adaptive Life & Business Intelligence OS in lineage.',
    },
    CP: {
      tipProbe:
        hasMod('knowledge-supply-plugin-foundry-types.ts') ||
        hasMod('third-party-plugin-governance.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: hasMod('plugin-tool-foundry.ts') ? 'PRESENT' : 'MISSING',
      note: 'CP plugin foundry / third-party governance patterns extended by DO mesh.',
    },
  };
}

export const PLUGIN_TRUST_MODEL = Object.freeze({
  installed_or_configured_not_trusted:
    'Installed or configured plugins are NOT trusted until XIV verifies them',
  registration_neq_authority:
    'Registration ≠ authority / credentials / billing / deploy / broader data access',
  deny_by_default: 'Deny-by-default permissions; least privilege',
  sandbox_before_promotion: 'Sandbox testing before promotion; agent-built adapters cannot self-promote',
  sealed_never_silent: 'Zero-trust highway: sealed never silent route',
  device_verified_only: 'Device/chip capability graph: verified only; else UNAVAILABLE',
  memory_provenance_required: 'Civilization & innovation memory lake: provenance/rights required',
  skill_neq_permission: 'Skill exchange ≠ permission grant',
  local_first_cloud: 'Adaptive offline/cloud workload: local-first; unconfigured cloud UNAVAILABLE',
  kill_switch: 'Revocation / kill switches stop further invocations',
  drift_monitoring: 'Version/schema drift → not silently trusted',
} as const);
