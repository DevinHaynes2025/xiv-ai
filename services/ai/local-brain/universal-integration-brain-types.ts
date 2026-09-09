import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DQ — XIV Universal Integration Brain + Agent API Gateway Civilization +
 * Local/Edge Connector Runtime + Enterprise Data Translation Grid +
 * Plugin Marketplace Intelligence + Security Trust Scoring Engine +
 * Capability Discovery & Composition Brain + Global Business Systems Interoperability Layer.
 *
 * SoT: GitHub #134. GitLab #68 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Extends DP Plugin Civilization OS when PRESENT (soft-wire); else DO → DN → … .
 * Installed plugins not automatically trusted.
 * Offline capability must be tested; untested ≠ available.
 * Schema drift → quarantine (not silent continue).
 * Consequential actions require approval (reuse DP risk classes).
 * Sealed/local-only information cannot silently move across providers or Universes.
 * Per-call authorization for API gateway.
 * Trust scores explainable; score ≠ automatic broad authority.
 * Reuse-first capability composition; composition ≠ permission escalation.
 * Signed cross-system events; unsigned rejected.
 * Local/edge connector runtimes; unconfigured UNAVAILABLE.
 * Field-level data classification; data-movement previews before consequential moves.
 * Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export {
  ACTION_RISK_CLASSES,
  ACTION_RISK_MATRIX,
  type ActionRiskClass,
  CONSEQUENTIAL_WRITE_GATE_REQUIRED,
  EXTERNAL_ACTION_GATE_REQUIRED,
  isHumanOrFounder,
  riskClassForScope,
  type PermissionScope,
  SELF_APPROVE_DENIED,
} from './plugin-civilization-os-types';

export const UNIVERSAL_INTEGRATION_BRAIN_CYCLE = [
  'honesty_locks',
  'universal_integration_brain_bootstrap',
  'api_call_without_per_call_auth_denied',
  'untrusted_installed_only_plugin_invocation_denied',
  'untested_offline_capability_not_marked_available',
  'schema_drift_quarantine_not_trusted',
  'consequential_write_without_approval_denied',
  'external_action_without_approval_denied',
  'sealed_local_only_silent_cross_provider_universe_move_denied',
  'trust_score_alone_does_not_grant_broader_scopes',
  'composition_cannot_escalate_beyond_constituent_permissions',
  'unsigned_cross_system_event_rejected',
  'data_movement_preview_required_before_consequential_classified_move',
  'unconfigured_edge_connector_unavailable',
  'registration_neq_billing_credentials_deploy',
  'evidence',
  'learning',
] as const;

export type DqHop = (typeof UNIVERSAL_INTEGRATION_BRAIN_CYCLE)[number];

export type DqEvidenceState =
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
  | 'QUARANTINED'
  | 'CONTRACT_ONLY'
  | 'TEST_ONLY'
  | 'LOGICAL'
  | 'ARCHITECTURE_TARGET'
  | 'SIGNED'
  | 'UNSIGNED'
  | 'PREVIEW_REQUIRED';

export type DqHopRecord = {
  hop: DqHop;
  state: DqEvidenceState;
  summary: string;
  at: string;
};

export type DqActorKind =
  | 'integration_brain_curator'
  | 'api_gateway_operator'
  | 'edge_connector_operator'
  | 'translation_grid_operator'
  | 'marketplace_intelligence_analyst'
  | 'trust_scoring_analyst'
  | 'capability_composer'
  | 'interop_operator'
  | 'human_approver'
  | 'founder'
  | 'agent'
  | 'plugin';

export type DqActor = {
  kind: DqActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 134;
export const GITLAB_COORDINATION_ISSUE = 68;

export const NEXT_PHASE_TITLE =
  '62L-DR — XIV Enterprise Nervous System OS + Universal Business Object Graph + Agent Workflow Compiler + Local/Cloud Integration Runtime + Plugin Trust Federation + Cross-System Event Intelligence + Adaptive Connector Learning Network + Global Operations Control Tower';

export const DQ_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_UNIVERSAL_INTEGRATION_BRAIN_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  INSTALLED_EQ_TRUSTED: false as const,
  INSTALLED_ONLY_PLUGIN_MAY_INVOKE: false as const,
  API_CALL_WITHOUT_PER_CALL_AUTH: false as const,
  PER_CALL_AUTHORIZATION_REQUIRED: true as const,
  UNTESTED_OFFLINE_MARKED_AVAILABLE: false as const,
  OFFLINE_REQUIRES_TEST_EVIDENCE: true as const,
  SCHEMA_DRIFT_SILENT_CONTINUE: false as const,
  SCHEMA_DRIFT_QUARANTINES: true as const,
  CONSEQUENTIAL_WRITE_SELF_APPROVE: false as const,
  EXTERNAL_ACTION_SELF_APPROVE: false as const,
  SEALED_SILENT_CROSS_PROVIDER_MOVE: false as const,
  SEALED_SILENT_CROSS_UNIVERSE_MOVE: false as const,
  TRUST_SCORE_GRANTS_BROADER_SCOPES: false as const,
  TRUST_SCORE_EXPLAINABLE: true as const,
  COMPOSITION_ESCALATES_PERMISSIONS: false as const,
  COMPOSITION_REUSE_FIRST: true as const,
  UNSIGNED_CROSS_SYSTEM_EVENT_ACCEPTED: false as const,
  SIGNED_CROSS_SYSTEM_EVENTS_REQUIRED: true as const,
  DATA_MOVEMENT_WITHOUT_PREVIEW: false as const,
  CLASSIFIED_FIELD_MOVE_REQUIRES_PREVIEW: true as const,
  UNCONFIGURED_EDGE_CONNECTOR_AVAILABLE: false as const,
  UNCONFIGURED_EDGE_CONNECTOR_UNAVAILABLE: true as const,
  REGISTRATION_GRANTS_AUTHORITY: false as const,
  REGISTRATION_GRANTS_CREDENTIALS: false as const,
  REGISTRATION_GRANTS_BILLING: false as const,
  REGISTRATION_GRANTS_DEPLOY: false as const,
  LEARNING_EQ_PERMISSION: false as const,
});

export const API_CALL_WITHOUT_AUTH_DENIED = 'API_CALL_WITHOUT_PER_CALL_AUTH_DENIED';
export const UNTRUSTED_INSTALLED_ONLY_DENIED =
  'UNTRUSTED_INSTALLED_ONLY_PLUGIN_INVOCATION_DENIED';
export const UNTESTED_OFFLINE_NOT_AVAILABLE =
  'UNTESTED_OFFLINE_CAPABILITY_NOT_MARKED_AVAILABLE';
export const SCHEMA_DRIFT_QUARANTINED = 'SCHEMA_DRIFT_QUARANTINE_NOT_TRUSTED';
export const SEALED_CROSS_MOVE_DENIED =
  'SEALED_LOCAL_ONLY_SILENT_CROSS_PROVIDER_UNIVERSE_MOVE_DENIED';
export const TRUST_SCORE_NO_BROADER_SCOPES =
  'TRUST_SCORE_ALONE_DOES_NOT_GRANT_BROADER_SCOPES';
export const COMPOSITION_ESCALATION_DENIED =
  'COMPOSITION_CANNOT_ESCALATE_BEYOND_CONSTITUENT_PERMISSIONS';
export const UNSIGNED_EVENT_REJECTED = 'UNSIGNED_CROSS_SYSTEM_EVENT_REJECTED';
export const DATA_MOVEMENT_PREVIEW_REQUIRED =
  'DATA_MOVEMENT_PREVIEW_REQUIRED_BEFORE_CONSEQUENTIAL_CLASSIFIED_MOVE';
export const UNCONFIGURED_EDGE_UNAVAILABLE = 'UNCONFIGURED_EDGE_CONNECTOR_UNAVAILABLE';
export const REGISTRATION_NO_BILLING_CREDS_DEPLOY =
  'REGISTRATION_NEQ_BILLING_CREDENTIALS_DEPLOY';

export const MAX_API_CALLS = 5000;
export const MAX_EDGE_CONNECTORS = 500;
export const MAX_TRANSLATION_SCHEMAS = 500;
export const MAX_TRUST_SCORES = 2000;
export const MAX_COMPOSITIONS = 500;
export const MAX_CROSS_SYSTEM_EVENTS = 5000;
export const MAX_AUDIT_EVENTS = 5000;

export type FieldClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'sealed'
  | 'local_only'
  | 'pii'
  | 'regulated';

export type TrustScoreBreakdown = {
  verification: number;
  health: number;
  marketplaceReputation: number;
  incidentHistory: number;
  ageDays: number;
  explainers: string[];
};

export type DqPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(repoRoot?: string): Record<string, DqPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));

  return {
    DP: {
      tipProbe:
        has(brain, 'plugin-civilization-os-types.ts') ||
        has(ops, '62L_DP_PLUGIN_CIVILIZATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DP_PLUGIN_CIVILIZATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'Preferred DP Plugin Civilization OS tip + report.',
    },
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
      note: 'DO Distributed Cognitive Runtime + Plugin Intelligence Mesh fallback.',
    },
    DN: {
      tipProbe:
        has(brain, 'universal-agent-runtime-os-types.ts') ||
        has(ops, '62L_DN_UNIVERSAL_AGENT_RUNTIME_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DN_UNIVERSAL_AGENT_RUNTIME_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DN Universal Agent Runtime OS fallback.',
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
      note: 'DM Global Neural Transit Civilization Atlas fallback.',
    },
    DL: {
      tipProbe:
        has(brain, 'neural-transportation-os-types.ts') ||
        has(ops, '62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DL Neural Transportation OS fallback.',
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
      note: 'DK Unified Intelligence Neural Highway fallback.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DP' | 'DO' | 'DN' | 'DM' | 'DL' | 'DK' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DP', 'DO', 'DN', 'DM', 'DL', 'DK'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}
