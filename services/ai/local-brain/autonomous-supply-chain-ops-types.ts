import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DX — XIV Autonomous Supply Chain Operations Brain + Global Data Fabric &
 * Retrieval Engine + Digital Twin Experiment Laboratory + Edge/Chip Runtime
 * Federation + Personal/Enterprise Memory Cortex + Agent-to-Agent Knowledge Bus +
 * Industry Pack Marketplace + Launch Reliability Command Center.
 *
 * SoT: GitHub #141. GitLab #75 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire DW / DV / DU when PRESENT.
 * Autonomy boundary (hard): analyze / simulate / recommend / coordinate approved
 * workflows only — MUST NOT independently book freight, issue POs, sign contracts,
 * spend money, or change production systems.
 * Recommendation ≠ charge / deploy / spend / sign / publish.
 * Correlation ≠ causation; sim / forecast / chaos-sim ≠ verified fact; prototype ≠ invention.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Learning / skill ≠ permission; marketplace listing ≠ trust / authority / auto-grant.
 * Agent-to-agent knowledge exchange: signed / authorized only; sealed deny otherwise.
 * RUNNING_VERIFIED / hardware-support / offline-operation / compatibility / sim-accuracy
 * claims need real evidence — else NOT_VERIFIED / UNAVAILABLE.
 * Offline: WAITING_NODE / OFFLINE_STOPPED when no powered authorized node.
 * Authorized / public / licensed / customer-owned data only.
 * Wedge-first: broader industry packs behind supply-chain pilot.
 * Chaos-sim ≠ production incident authority.
 * Biometric / camera defaults remain OFF / opt-in / local-preferred / revocable.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR / no prod deploy / no public launch.
 */

export const AUTONOMOUS_SUPPLY_CHAIN_OPS_CYCLE = [
  'honesty_locks',
  'autonomous_supply_chain_ops_bootstrap',
  // A — Autonomous Supply Chain Operations Brain
  'exception_recovery_analyze_simulate_recommend_only',
  'freight_booking_denied',
  'purchase_order_denied',
  'contract_signing_denied',
  'spend_money_denied',
  'production_change_denied',
  // B — Global Data Fabric & Retrieval Engine
  'federated_retrieval_acl_deny_by_default',
  'label_alone_neq_fabric_access',
  'unauthorized_historical_coverage_denied',
  // C — Digital Twin Experiment Laboratory
  'twin_experiment_sim_neq_fact',
  'twin_experiment_neq_physical_control',
  'reproducible_experiment_labeled_simulation',
  // D — Edge/Chip Runtime Federation
  'chip_runtime_running_verified_needs_evidence',
  'unauthorized_chip_runtime_denied',
  'cross_device_routing_neq_fab_remote_control',
  // E — Personal/Enterprise Memory Cortex
  'memory_cortex_deny_unenrolled',
  'memory_cortex_governed_acl',
  // F — Agent-to-Agent Knowledge Bus
  'a2a_unsigned_exchange_denied',
  'a2a_unauthorized_exchange_denied',
  // G — Industry Pack Marketplace
  'marketplace_listing_neq_auto_grant',
  'wedge_first_non_supply_chain_pack_gated',
  // H — Launch Reliability Command Center
  'chaos_sim_neq_production_incident_authority',
  'reliability_claim_needs_evidence',
  'offline_without_powered_node_waiting_or_stopped',
  'digital_twin_neq_founder',
  'dw_dv_soft_wire_probe',
  'evidence',
  'learning',
] as const;

export type DxHop = (typeof AUTONOMOUS_SUPPLY_CHAIN_OPS_CYCLE)[number];

export type DxEvidenceState =
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
  | 'LABELED_CHAOS_SIM'
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
  | 'REVOKED'
  | 'SIGNED'
  | 'UNSIGNED'
  | 'WEDGE_GATED';

export type DxHopRecord = {
  hop: DxHop;
  state: DxEvidenceState;
  summary: string;
  at: string;
};

export type DxActorKind =
  | 'supply_chain_ops_analyst'
  | 'data_fabric_curator'
  | 'twin_experiment_lab_operator'
  | 'edge_chip_runtime_operator'
  | 'memory_cortex_steward'
  | 'a2a_knowledge_bus_operator'
  | 'industry_pack_marketplace_curator'
  | 'launch_reliability_commander'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type DxActor = {
  kind: DxActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 141;
export const GITLAB_COORDINATION_ISSUE = 75;

export const NEXT_PHASE_TITLE =
  '62L-DY — XIV Intelligent Supply Chain Command OS + Global Knowledge Retrieval Cortex + Autonomous Experiment & Optimization Lab + Universal Device/Chip Scheduler + Long-Term Memory Graph + Agent Collaboration Protocol + Industry Solution Factory + Launch Observability & Recovery Brain';

export const DX_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_SUPPLY_CHAIN_OPS_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  AUTONOMOUS_FREIGHT_BOOKING: false as const,
  AUTONOMOUS_PURCHASE_ORDER: false as const,
  AUTONOMOUS_CONTRACT_SIGNING: false as const,
  AUTONOMOUS_SPEND: false as const,
  AUTONOMOUS_PRODUCTION_CHANGE: false as const,
  ANALYZE_SIMULATE_RECOMMEND_ONLY: true as const,
  SIM_EQ_VERIFIED_FACT: false as const,
  CHAOS_SIM_EQ_PRODUCTION_INCIDENT_AUTHORITY: false as const,
  TWIN_EXPERIMENT_EQ_PHYSICAL_CONTROL: false as const,
  MARKETPLACE_LISTING_EQ_AUTO_GRANT: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  UNAUTHORIZED_DATA_USE: false as const,
  UNSIGNED_A2A_EXCHANGE_ALLOWED: false as const,
  UNAUTHORIZED_A2A_EXCHANGE_ALLOWED: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
  BIOMETRIC_DEFAULT_ENABLED: false as const,
  WEDGE_FIRST_SUPPLY_CHAIN_PILOT: true as const,
});

/** Hard autonomy boundary — independent execution of these actions is always denied. */
export const AUTONOMY_BOUNDARY_DENIED_ACTIONS = Object.freeze([
  'book_freight',
  'issue_purchase_order',
  'sign_contract',
  'spend_money',
  'change_production_system',
] as const);

export type AutonomyBoundaryAction =
  (typeof AUTONOMY_BOUNDARY_DENIED_ACTIONS)[number];

export const EXCEPTION_RECOVERY_ADVISORY_ONLY =
  'EXCEPTION_RECOVERY_ANALYZE_SIMULATE_RECOMMEND_ONLY';
export const FREIGHT_BOOKING_DENIED = 'FREIGHT_BOOKING_DENIED_AUTONOMY_BOUNDARY';
export const PURCHASE_ORDER_DENIED = 'PURCHASE_ORDER_DENIED_AUTONOMY_BOUNDARY';
export const CONTRACT_SIGNING_DENIED = 'CONTRACT_SIGNING_DENIED_AUTONOMY_BOUNDARY';
export const SPEND_MONEY_DENIED = 'SPEND_MONEY_DENIED_AUTONOMY_BOUNDARY';
export const PRODUCTION_CHANGE_DENIED =
  'PRODUCTION_CHANGE_DENIED_AUTONOMY_BOUNDARY';
export const FABRIC_ACL_DENIED = 'FEDERATED_RETRIEVAL_ACL_DENY_BY_DEFAULT';
export const LABEL_NEQ_FABRIC_ACCESS = 'LABEL_ALONE_NEQ_FABRIC_ACCESS';
export const UNAUTHORIZED_HISTORICAL = 'UNAUTHORIZED_HISTORICAL_COVERAGE_DENIED';
export const TWIN_SIM_NEQ_FACT = 'TWIN_EXPERIMENT_SIM_NEQ_FACT';
export const TWIN_NEQ_PHYSICAL = 'TWIN_EXPERIMENT_NEQ_PHYSICAL_CONTROL';
export const TWIN_LABELED_SIM = 'REPRODUCIBLE_EXPERIMENT_LABELED_SIMULATION';
export const CHIP_EVIDENCE_REQUIRED =
  'CHIP_RUNTIME_RUNNING_VERIFIED_NEEDS_EVIDENCE';
export const UNAUTHORIZED_CHIP_RUNTIME = 'UNAUTHORIZED_CHIP_RUNTIME_DENIED';
export const CHIP_NEQ_FAB_CONTROL =
  'CROSS_DEVICE_ROUTING_NEQ_FAB_REMOTE_CONTROL';
export const MEMORY_UNENROLLED_DENIED = 'MEMORY_CORTEX_DENY_UNENROLLED';
export const MEMORY_ACL_DENIED = 'MEMORY_CORTEX_GOVERNED_ACL';
export const A2A_UNSIGNED_DENIED = 'A2A_UNSIGNED_EXCHANGE_DENIED';
export const A2A_UNAUTHORIZED_DENIED = 'A2A_UNAUTHORIZED_EXCHANGE_DENIED';
export const LISTING_NEQ_AUTO_GRANT = 'MARKETPLACE_LISTING_NEQ_AUTO_GRANT';
export const WEDGE_FIRST_GATED = 'WEDGE_FIRST_NON_SUPPLY_CHAIN_PACK_GATED';
export const CHAOS_NEQ_PROD_AUTHORITY =
  'CHAOS_SIM_NEQ_PRODUCTION_INCIDENT_AUTHORITY';
export const RELIABILITY_EVIDENCE_REQUIRED =
  'RELIABILITY_CLAIM_NEEDS_EVIDENCE';
export const OFFLINE_WAITING_OR_STOPPED =
  'OFFLINE_WITHOUT_POWERED_NODE_WAITING_OR_STOPPED';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';

export const MAX_EXCEPTION_PLANS = 500;
export const MAX_FABRIC_QUERIES = 500;
export const MAX_TWIN_EXPERIMENTS = 500;
export const MAX_CHIP_RUNTIME_PROBES = 500;
export const MAX_MEMORY_EVENTS = 500;
export const MAX_A2A_EXCHANGES = 500;
export const MAX_MARKETPLACE_LISTINGS = 500;
export const MAX_RELIABILITY_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: DxActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type DxPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, DxPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));
  const hasPrefix = (dir: string, prefix: string) => {
    try {
      return readdirSync(dir).some((f) => f.startsWith(prefix));
    } catch {
      return false;
    }
  };

  return {
    DW: {
      tipProbe:
        has(brain, 'supply-chain-superbrain-types.ts') ||
        has(brain, 'supply-chain-superbrain.ts') ||
        has(ops, '62L_DW_SUPPLY_CHAIN_SUPERBRAIN_REPORT.md') ||
        hasPrefix(ops, '62L_DW_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DW_SUPPLY_CHAIN_SUPERBRAIN_REPORT.md') ||
        hasPrefix(ops, '62L_DW_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred DW Supply Chain Superbrain tip + report.',
    },
    DV: {
      tipProbe:
        has(brain, 'universal-data-industry-cortex-types.ts') ||
        has(brain, 'universal-data-industry-cortex.ts') ||
        has(ops, '62L_DV_UNIVERSAL_DATA_INDUSTRY_CORTEX_REPORT.md') ||
        hasPrefix(ops, '62L_DV_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DV_UNIVERSAL_DATA_INDUSTRY_CORTEX_REPORT.md') ||
        hasPrefix(ops, '62L_DV_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DV Universal Data & Industry Cortex fallback when DW absent.',
    },
    DU: {
      tipProbe:
        has(brain, 'universal-industry-intelligence-os-types.ts') ||
        has(brain, 'universal-industry-intelligence-os.ts') ||
        has(ops, '62L_DU_UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_REPORT.md') ||
        hasPrefix(ops, '62L_DU_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DU_UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_REPORT.md') ||
        hasPrefix(ops, '62L_DU_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DU Universal Industry Intelligence OS fallback when DV absent.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DW' | 'DV' | 'DU' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DW', 'DV', 'DU'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const AUTONOMY_BOUNDARY = Object.freeze({
  allowed: [
    'analyze',
    'simulate',
    'recommend',
    'coordinate_approved_workflows',
  ] as const,
  denied: AUTONOMY_BOUNDARY_DENIED_ACTIONS,
  humanFounderGateRequired: true as const,
  denyByDefault: true as const,
});

export const PRODUCT_PHILOSOPHY = Object.freeze({
  analyzeSimulateRecommendOnly: true,
  denyByDefaultAutonomyBoundary: true,
  founderHumanGatesRequired: true,
  federatedRetrievalAcl: true,
  twinExperimentSimLabeledOnly: true,
  chipRuntimeEvidenceGates: true,
  governedMemoryCortex: true,
  signedAuthorizedA2aOnly: true,
  marketplaceListingNeqAutoGrant: true,
  wedgeFirstSupplyChainPilot: true,
  chaosSimNeqProductionAuthority: true,
  offlineHonestWaitingOrStopped: true,
  biometricDefaultsOff: true,
});
