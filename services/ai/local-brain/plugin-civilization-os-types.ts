import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DP — XIV Plugin Civilization OS + Universal Connector Marketplace +
 * Agent Toolchain Federation + Offline Plugin Runtime + Cross-Cloud Data Adapter Fabric +
 * Enterprise Integration Highway + Plugin Security Operations Center +
 * Self-Expanding Capability Graph.
 *
 * SoT: GitHub #133. GitLab #67 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Extends DO Plugin Intelligence Mesh when PRESENT (soft-wire); else DK fallback.
 * Installed/configured ≠ trusted until XIV verifies (reuse DO).
 * Capability graph can grow without silently expanding authority.
 * Registration ≠ credentials/billing/deploy/broader data access.
 * Explicit permission diffs required on upgrades.
 * Action risk classes: READ_ONLY | DRAFT_ONLY | REVERSIBLE_WRITE | CONSEQUENTIAL_WRITE | EXTERNAL_ACTION.
 * CONSEQUENTIAL_WRITE / EXTERNAL_ACTION require human/founder gates; cannot self-approve.
 * Offline plugin runtime: offline fallbacks honest; no inventing live cloud.
 * Kill switches, schema-drift detection, incident response in Plugin SecOps.
 * Agent-built connector candidates sandbox-only until gates.
 * Local-first; sealed never silent plugin route; Founder-sealed deny-by-default.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const PLUGIN_CIVILIZATION_OS_CYCLE = [
  'honesty_locks',
  'plugin_civilization_os_bootstrap',
  'marketplace_listing_not_trusted_not_authority',
  'permission_upgrade_without_explicit_diff_denied',
  'consequential_write_without_human_gate_denied',
  'external_action_without_human_gate_denied',
  'read_only_cannot_escalate_silently_to_write',
  'kill_switch_stops_invocations',
  'schema_drift_not_silently_trusted',
  'agent_built_connector_remains_sandbox',
  'capability_graph_growth_no_auto_grant_permissions',
  'offline_runtime_no_live_cloud_when_unconfigured',
  'sealed_data_via_unverified_plugin_denied',
  'unenrolled_enterprise_connector_unavailable',
  'registration_neq_billing_credentials_deploy',
  'evidence',
  'learning',
] as const;

export type DpHop = (typeof PLUGIN_CIVILIZATION_OS_CYCLE)[number];

export type DpEvidenceState =
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
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'CONTRACT_ONLY'
  | 'TEST_ONLY'
  | 'LOGICAL'
  | 'ARCHITECTURE_TARGET';

export type DpHopRecord = {
  hop: DpHop;
  state: DpEvidenceState;
  summary: string;
  at: string;
};

/** Action risk classes (required cross-cutting). */
export const ACTION_RISK_CLASSES = [
  'READ_ONLY',
  'DRAFT_ONLY',
  'REVERSIBLE_WRITE',
  'CONSEQUENTIAL_WRITE',
  'EXTERNAL_ACTION',
] as const;

export type ActionRiskClass = (typeof ACTION_RISK_CLASSES)[number];

export const ACTION_RISK_MATRIX = Object.freeze({
  READ_ONLY: {
    humanGateRequired: false,
    founderGateRequired: false,
    selfApproveAllowed: true,
    approvalThreshold: 'none',
  },
  DRAFT_ONLY: {
    humanGateRequired: false,
    founderGateRequired: false,
    selfApproveAllowed: true,
    approvalThreshold: 'draft_review_optional',
  },
  REVERSIBLE_WRITE: {
    humanGateRequired: false,
    founderGateRequired: false,
    selfApproveAllowed: true,
    approvalThreshold: 'policy_allowlist',
  },
  CONSEQUENTIAL_WRITE: {
    humanGateRequired: true,
    founderGateRequired: true,
    selfApproveAllowed: false,
    approvalThreshold: 'human_or_founder',
  },
  EXTERNAL_ACTION: {
    humanGateRequired: true,
    founderGateRequired: true,
    selfApproveAllowed: false,
    approvalThreshold: 'human_or_founder',
  },
} as const);

export type DpActorKind =
  | 'plugin_civilization_curator'
  | 'marketplace_operator'
  | 'toolchain_federator'
  | 'offline_runtime_operator'
  | 'cloud_adapter_operator'
  | 'enterprise_highway_operator'
  | 'plugin_secops_analyst'
  | 'capability_graph_curator'
  | 'human_approver'
  | 'founder'
  | 'agent';

export type DpActor = {
  kind: DpActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 133;
export const GITLAB_COORDINATION_ISSUE = 67;

export const NEXT_PHASE_TITLE =
  '62L-DQ — XIV Universal Integration Brain + Agent API Gateway Civilization + Local/Edge Connector Runtime + Enterprise Data Translation Grid + Plugin Marketplace Intelligence + Security Trust Scoring Engine + Capability Discovery & Composition Brain + Global Business Systems Interoperability Layer';

export const DP_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_PLUGIN_CIVILIZATION_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  INSTALLED_EQ_TRUSTED: false as const,
  CONFIGURED_EQ_TRUSTED: false as const,
  MARKETPLACE_LISTING_EQ_TRUSTED: false as const,
  MARKETPLACE_LISTING_EQ_AUTHORITY: false as const,
  REGISTRATION_GRANTS_AUTHORITY: false as const,
  REGISTRATION_GRANTS_CREDENTIALS: false as const,
  REGISTRATION_GRANTS_BILLING: false as const,
  REGISTRATION_GRANTS_DEPLOY: false as const,
  REGISTRATION_GRANTS_BROADER_DATA_ACCESS: false as const,
  PERMISSION_UPGRADE_WITHOUT_EXPLICIT_DIFF: false as const,
  READ_ONLY_SILENT_ESCALATION_TO_WRITE: false as const,
  CONSEQUENTIAL_WRITE_SELF_APPROVE: false as const,
  EXTERNAL_ACTION_SELF_APPROVE: false as const,
  CAPABILITY_GRAPH_GROWTH_AUTO_GRANTS_PERMISSIONS: false as const,
  AGENT_BUILT_SELF_PROMOTE_PRODUCTION: false as const,
  DRIFT_SILENTLY_TRUSTED: false as const,
  OFFLINE_FALLBACK_INVENTS_CLOUD_AVAILABILITY: false as const,
  UNVERIFIED_PLUGIN_RECEIVES_SEALED_DATA: false as const,
  SEALED_SILENT_PLUGIN_ROUTE: false as const,
  UNENROLLED_ENTERPRISE_CONNECTOR_AVAILABLE: false as const,
  KILL_SWITCH_IGNORED: false as const,
});

export const MARKETPLACE_LISTING_NOT_TRUSTED = 'MARKETPLACE_LISTING_NOT_TRUSTED_NOT_AUTHORITY';
export const PERMISSION_UPGRADE_DIFF_REQUIRED = 'PERMISSION_UPGRADE_WITHOUT_EXPLICIT_DIFF_DENIED';
export const CONSEQUENTIAL_WRITE_GATE_REQUIRED = 'CONSEQUENTIAL_WRITE_WITHOUT_HUMAN_GATE_DENIED';
export const EXTERNAL_ACTION_GATE_REQUIRED = 'EXTERNAL_ACTION_WITHOUT_HUMAN_GATE_DENIED';
export const READ_ONLY_ESCALATION_DENIED = 'READ_ONLY_CANNOT_ESCALATE_SILENTLY_TO_WRITE';
export const KILL_SWITCH_INVOCATION_STOPPED = 'KILL_SWITCH_STOPS_INVOCATIONS';
export const DRIFT_NOT_SILENTLY_TRUSTED = 'SCHEMA_DRIFT_NOT_SILENTLY_TRUSTED';
export const AGENT_BUILT_SANDBOX_UNTIL_GATES = 'AGENT_BUILT_CONNECTOR_REMAINS_SANDBOX';
export const CAPABILITY_GROWTH_NO_AUTO_GRANT = 'CAPABILITY_GRAPH_GROWTH_NO_AUTO_GRANT_PERMISSIONS';
export const OFFLINE_NO_INVENTED_CLOUD = 'OFFLINE_RUNTIME_NO_LIVE_CLOUD_WHEN_UNCONFIGURED';
export const UNVERIFIED_SEALED_DATA_DENIED = 'SEALED_DATA_VIA_UNVERIFIED_PLUGIN_DENIED';
export const UNENROLLED_ENTERPRISE_UNAVAILABLE = 'UNENROLLED_ENTERPRISE_CONNECTOR_UNAVAILABLE';
export const REGISTRATION_NO_BILLING_CREDS_DEPLOY =
  'REGISTRATION_NEQ_BILLING_CREDENTIALS_DEPLOY';
export const PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED = 'PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED';
export const SELF_APPROVE_DENIED = 'SELF_APPROVE_DENIED_FOR_RISK_CLASS';

export const MAX_MARKETPLACE_LISTINGS = 500;
export const MAX_TOOLCHAINS = 200;
export const MAX_CAPABILITY_NODES = 2000;
export const MAX_AUDIT_EVENTS = 5000;
export const MAX_ADAPTERS = 300;
export const MAX_ENTERPRISE_CONNECTORS = 300;

export type ConnectorCategory =
  | 'crm'
  | 'erp'
  | 'productivity'
  | 'cloud_storage'
  | 'messaging'
  | 'analytics'
  | 'identity'
  | 'payments'
  | 'custom'
  | 'agent_built';

export type TrustState =
  | 'registered'
  | 'listed'
  | 'installed'
  | 'configured'
  | 'verified'
  | 'approved'
  | 'sandbox'
  | 'killed'
  | 'revoked'
  | 'drift_detected'
  | 'unenrolled';

export type PermissionScope =
  | 'read'
  | 'draft'
  | 'write_reversible'
  | 'write_consequential'
  | 'external_action'
  | 'read_sealed'
  | 'billing'
  | 'credentials'
  | 'deploy'
  | 'compose'
  | 'invoke';

export function riskClassForScope(scope: PermissionScope): ActionRiskClass {
  switch (scope) {
    case 'read':
    case 'read_sealed':
    case 'invoke':
    case 'compose':
      return 'READ_ONLY';
    case 'draft':
      return 'DRAFT_ONLY';
    case 'write_reversible':
      return 'REVERSIBLE_WRITE';
    case 'write_consequential':
    case 'billing':
    case 'credentials':
    case 'deploy':
      return 'CONSEQUENTIAL_WRITE';
    case 'external_action':
      return 'EXTERNAL_ACTION';
    default:
      return 'EXTERNAL_ACTION';
  }
}

export function isHumanOrFounder(actor: DpActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type DpPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(repoRoot?: string): Record<string, DpPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));

  return {
    DO: {
      tipProbe:
        has(brain, 'distributed-cognitive-runtime-plugin-mesh-types.ts') ||
        has(brain, 'plugin-intelligence-mesh.ts') ||
        has(ops, '62L_DO_DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DO_DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred DO Distributed Cognitive Runtime + Plugin Intelligence Mesh tip + report.',
    },
    DN: {
      tipProbe:
        has(brain, 'universal-agent-runtime-os-types.ts') ||
        has(ops, '62L_DN_UNIVERSAL_AGENT_RUNTIME_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DN_UNIVERSAL_AGENT_RUNTIME_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DN Universal Agent Runtime OS fallback when DO absent.',
    },
    DM: {
      tipProbe:
        has(brain, 'global-neural-transit-civilization-atlas-types.ts') ||
        has(ops, '62L_DM_GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DM_GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DM Global Neural Transit Civilization Atlas fallback when DN absent.',
    },
    DL: {
      tipProbe:
        has(brain, 'neural-transportation-os-types.ts') ||
        has(ops, '62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DL Neural Transportation OS fallback when DM absent.',
    },
    DK: {
      tipProbe:
        has(brain, 'unified-intelligence-experience-os-types.ts') ||
        has(ops, '62L_DK_UNIFIED_INTELLIGENCE_NEURAL_HIGHWAY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DK_UNIFIED_INTELLIGENCE_NEURAL_HIGHWAY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DK Unified Intelligence Neural Highway fallback @ 9a61c61 when DL–DO WAITING_DATA.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DO' | 'DN' | 'DM' | 'DL' | 'DK' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DO', 'DN', 'DM', 'DL', 'DK'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}
