import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DV — XIV Universal Data & Industry Cortex + Supply Chain Digital Twin Network +
 * Semiconductor Intelligence Brain + Personal Data Vault & Search OS +
 * Multimodal Command Center + Adult Trust-Circle Social Fabric +
 * Historical Simulation Engine + Cross-Device Agent Superhighway.
 *
 * SoT: GitHub #139. GitLab #73 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire DU / DT / DS when PRESENT.
 * Recommendation ≠ charge / deploy / spend / sign / publish.
 * Personal data vault = encrypted, permission-aware; search respects ACL — no cross-context leakage.
 * Digital twin / historical simulation / backtesting / forecast calibration ≠ verified prediction or physical control.
 * Semiconductor / workload routing ≠ unauthorized remote control of fabs/hardware.
 * WMS/TMS/ERP adapters = authorized connectors only; bottleneck detection = advisory.
 * Adult Trust-Circle: 18+ consent/privacy/age/moderation; no minors; no non-consensual imagery;
 * biometric/camera defaults OFF / opt-in / preferably local / revocable;
 * no public surveillance, demographic profiling, covert emotion detection, or cross-context tracking.
 * Multimodal command ≠ covert capture.
 * Device-to-device agent handoffs must be secure/authenticated; sealed deny if peer unenrolled.
 * RUNNING_VERIFIED / “operational” claims require real evidence — else UNAVAILABLE / NOT_VERIFIED.
 * Offline: WAITING_NODE / OFFLINE_STOPPED when no powered authorized node.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR / no prod deploy / no public launch.
 */

export const UNIVERSAL_DATA_INDUSTRY_CORTEX_CYCLE = [
  'honesty_locks',
  'universal_data_industry_cortex_bootstrap',
  // A — Universal Data & Industry Cortex
  'cortex_deny_by_default',
  'label_alone_neq_cortex_access',
  'unconfigured_cortex_provider_unavailable',
  // B — Personal Data Vault & Search OS
  'vault_acl_cross_context_denied',
  'search_without_permission_denied',
  'warehouse_nav_deny_by_default',
  // C — Supply Chain Digital Twin Network
  'twin_neq_physical_control',
  'unauthorized_wms_tms_erp_adapter_denied',
  'bottleneck_advisory_neq_control',
  // D — Semiconductor Intelligence Brain
  'chip_workload_neq_fab_remote_control',
  'semiconductor_running_verified_needs_evidence',
  'unauthorized_chip_intel_source_denied',
  // E — Historical Simulation Engine
  'sim_neq_verified_fact',
  'backtest_neq_verified_prediction',
  'forecast_calibration_labeled_only',
  // F — Multimodal Command Center
  'multimodal_capture_defaults_off',
  'covert_capture_denied',
  // G — Adult Trust-Circle Social Fabric
  'minor_trust_circle_access_denied',
  'non_consensual_imagery_denied',
  'adult_age_gate_required',
  'trust_circle_surveillance_profiling_denied',
  // H — Cross-Device Agent Superhighway
  'unenrolled_peer_handoff_denied',
  'running_verified_requires_heartbeat',
  'offline_without_powered_node_waiting_or_stopped',
  'digital_twin_neq_founder',
  'neural_superhighway_sealed_deny_by_default',
  'evidence',
  'learning',
] as const;

export type DvHop = (typeof UNIVERSAL_DATA_INDUSTRY_CORTEX_CYCLE)[number];

export type DvEvidenceState =
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
  | 'LABELED_BACKTEST'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'NOT_VERIFIED'
  | 'CONTRACT_ONLY'
  | 'TEST_ONLY'
  | 'LOGICAL'
  | 'ARCHITECTURE_TARGET'
  | 'CORRELATION_ONLY'
  | 'ADVISORY_ONLY'
  | 'OPT_IN_REQUIRED'
  | 'REVOKED';

export type DvHopRecord = {
  hop: DvHop;
  state: DvEvidenceState;
  summary: string;
  at: string;
};

export type DvActorKind =
  | 'data_industry_cortex_curator'
  | 'vault_search_steward'
  | 'supply_chain_twin_analyst'
  | 'semiconductor_intel_analyst'
  | 'historical_sim_analyst'
  | 'multimodal_command_operator'
  | 'trust_circle_moderator'
  | 'agent_superhighway_operator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type DvActor = {
  kind: DvActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 139;
export const GITLAB_COORDINATION_ISSUE = 73;

export const NEXT_PHASE_TITLE =
  '62L-DW — XIV Supply Chain Superbrain + Universal Data Lakehouse OS + Digital Twin Simulation Factory + Semiconductor/Edge Compute Control Tower + Personal Knowledge Vault + Agent Memory Highway + Global Industry Knowledge Graph + Secure Multimodal Experience Layer';

export const DV_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_DATA_INDUSTRY_CORTEX_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_PHYSICAL_CONTROL: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  VAULT_CROSS_CONTEXT_LEAKAGE: false as const,
  SEARCH_WITHOUT_ACL: false as const,
  TWIN_EQ_PHYSICAL_CONTROL: false as const,
  BOTTLENECK_EQ_PHYSICAL_CONTROL: false as const,
  CHIP_ROUTING_EQ_FAB_REMOTE_CONTROL: false as const,
  SIM_EQ_VERIFIED_FACT: false as const,
  BACKTEST_EQ_VERIFIED_PREDICTION: false as const,
  FORECAST_EQ_VERIFIED_FACT: false as const,
  MULTIMODAL_CAPTURE_DEFAULT_ON: false as const,
  COVERT_CAPTURE_ALLOWED: false as const,
  CAMERA_DEFAULT_ON: false as const,
  MIC_DEFAULT_ON: false as const,
  BIOMETRIC_DEFAULT_ENABLED: false as const,
  MINORS_IN_TRUST_CIRCLE: false as const,
  NON_CONSENSUAL_IMAGERY_ALLOWED: false as const,
  PUBLIC_SURVEILLANCE_ALLOWED: false as const,
  DEMOGRAPHIC_PROFILING_ALLOWED: false as const,
  COVERT_EMOTION_DETECTION_ALLOWED: false as const,
  CROSS_CONTEXT_TRACKING_ALLOWED: false as const,
  UNENROLLED_PEER_HANDOFF_ALLOWED: false as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
});

export const CORTEX_DENIED = 'CORTEX_DENY_BY_DEFAULT';
export const LABEL_NEQ_CORTEX_ACCESS = 'LABEL_ALONE_NEQ_CORTEX_ACCESS';
export const UNCONFIGURED_CORTEX_PROVIDER = 'UNCONFIGURED_CORTEX_PROVIDER_UNAVAILABLE';
export const VAULT_ACL_CROSS_CONTEXT = 'VAULT_ACL_CROSS_CONTEXT_DENIED';
export const SEARCH_WITHOUT_PERMISSION = 'SEARCH_WITHOUT_PERMISSION_DENIED';
export const WAREHOUSE_NAV_DENIED = 'WAREHOUSE_NAV_DENY_BY_DEFAULT';
export const TWIN_NEQ_CONTROL = 'TWIN_NEQ_PHYSICAL_CONTROL';
export const UNAUTHORIZED_ADAPTER = 'UNAUTHORIZED_WMS_TMS_ERP_ADAPTER_DENIED';
export const BOTTLENECK_ADVISORY_ONLY = 'BOTTLENECK_ADVISORY_NEQ_CONTROL';
export const CHIP_NEQ_FAB_CONTROL = 'CHIP_WORKLOAD_NEQ_FAB_REMOTE_CONTROL';
export const SEMICONDUCTOR_EVIDENCE_REQUIRED =
  'SEMICONDUCTOR_RUNNING_VERIFIED_NEEDS_EVIDENCE';
export const UNAUTHORIZED_CHIP_SOURCE = 'UNAUTHORIZED_CHIP_INTEL_SOURCE_DENIED';
export const SIM_NEQ_FACT = 'SIM_NEQ_VERIFIED_FACT';
export const BACKTEST_NEQ_PREDICTION = 'BACKTEST_NEQ_VERIFIED_PREDICTION';
export const FORECAST_LABELED_ONLY = 'FORECAST_CALIBRATION_LABELED_ONLY';
export const MULTIMODAL_CAPTURE_OFF = 'MULTIMODAL_CAPTURE_DEFAULTS_OFF';
export const COVERT_CAPTURE_DENIED = 'COVERT_CAPTURE_DENIED';
export const MINOR_TRUST_DENIED = 'MINOR_TRUST_CIRCLE_ACCESS_DENIED';
export const NON_CONSENSUAL_DENIED = 'NON_CONSENSUAL_IMAGERY_DENIED';
export const ADULT_AGE_GATE_REQUIRED = 'ADULT_AGE_GATE_REQUIRED';
export const TRUST_SURVEILLANCE_DENIED = 'TRUST_CIRCLE_SURVEILLANCE_PROFILING_DENIED';
export const UNENROLLED_HANDOFF_DENIED = 'UNENROLLED_PEER_HANDOFF_DENIED';
export const HEARTBEAT_REQUIRED_FOR_RUNNING = 'RUNNING_VERIFIED_REQUIRES_HEARTBEAT';
export const OFFLINE_WAITING_OR_STOPPED = 'OFFLINE_WITHOUT_POWERED_NODE_WAITING_OR_STOPPED';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';
export const NEURAL_SUPERHIGHWAY_SEALED_DENIED =
  'NEURAL_SUPERHIGHWAY_SEALED_DENY_BY_DEFAULT';

export const MAX_CORTEX_NODES = 500;
export const MAX_VAULT_OBJECTS = 2000;
export const MAX_SEARCH_QUERIES = 2000;
export const MAX_TWINS = 500;
export const MAX_ADAPTERS = 300;
export const MAX_CHIP_ROUTES = 500;
export const MAX_SIMULATIONS = 500;
export const MAX_MULTIMODAL_SESSIONS = 500;
export const MAX_TRUST_CIRCLE_EVENTS = 500;
export const MAX_HANDOFFS = 500;
export const MAX_SUPERHIGHWAY_NODES = 2000;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: DvActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type DvPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(repoRoot?: string): Record<string, DvPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));

  return {
    DU: {
      tipProbe:
        has(brain, 'universal-industry-intelligence-os-types.ts') ||
        has(brain, 'universal-industry-intelligence.ts') ||
        has(ops, '62L_DU_UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_REPORT.md') ||
        has(ops, '62L_DU_COMMERCIAL_INTELLIGENCE_SUPERBRAIN_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DU_UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_REPORT.md') ||
        has(ops, '62L_DU_COMMERCIAL_INTELLIGENCE_SUPERBRAIN_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred DU tip + report when PRESENT (may still be landing).',
    },
    DT: {
      tipProbe:
        has(brain, 'growth-operating-system-types.ts') ||
        has(brain, 'growth-operating-system.ts') ||
        has(ops, '62L_DT_GROWTH_OPERATING_SYSTEM_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DT_GROWTH_OPERATING_SYSTEM_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DT Growth Operating System fallback when DU absent.',
    },
    DS: {
      tipProbe:
        has(brain, 'revenue-intelligence-os-types.ts') ||
        has(brain, 'revenue-intelligence-os.ts') ||
        has(ops, '62L_DS_REVENUE_INTELLIGENCE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DS_REVENUE_INTELLIGENCE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DS Revenue Intelligence OS fallback when DT absent.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DU' | 'DT' | 'DS' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DU', 'DT', 'DS'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const PRODUCT_PHILOSOPHY = Object.freeze({
  specializedGovernedAgents: true,
  denyByDefaultDataAccess: true,
  encryptedPermissionAwareVaults: true,
  searchRespectsAcl: true,
  twinAdvisoryNotPhysicalControl: true,
  authorizedConnectorsOnly: true,
  simForecastBacktestLabeledOnly: true,
  multimodalCaptureOptIn: true,
  adultTrustCircleConsentAgeModeration: true,
  secureAuthenticatedDeviceHandoffs: true,
  evidenceBeforeOperationalClaims: true,
  offlineHonestWaitingOrStopped: true,
});
