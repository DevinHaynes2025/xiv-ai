import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DT — XIV Growth Operating System + AI Revenue Factory +
 * Customer Acquisition & Partnership Brain + Enterprise Deal Desk +
 * Pricing Optimization Lab + Launch Mission Control +
 * Retention/Expansion Intelligence + Executive Performance Nervous System.
 *
 * SoT: GitHub #137. GitLab #71 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire DS / DR / DQ when PRESENT; else DP Plugin Civilization OS base.
 * Recommendation ≠ charge / deploy / spend / sign / publish / contract / payment.
 * Pricing experiments / bundle design ≠ auto-price or auto-bill.
 * Enterprise deal approval / negotiation memory ≠ auto-sign.
 * Launch countdown / pilot ops ≠ public launch or auto-ship.
 * Retention / renewal risk / expansion ≠ auto-renew or auto-charge.
 * Decision-to-outcome learning ≠ guaranteed causation (correlation ≠ causation).
 * Design partners / partnership discovery = authorized outreach intel only.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Offline: WAITING_NODE / OFFLINE_STOPPED when no powered authorized node.
 * Wedge-first: prove measurable supply-chain/SMB wedge before broader network.
 * tip-land=NO. No PR / no prod deploy / no DB migration / no public launch.
 */

export const GROWTH_OPERATING_SYSTEM_CYCLE = [
  'honesty_locks',
  'growth_operating_system_bootstrap',
  // A — Growth OS / AI Revenue Factory
  'acquisition_pipeline_recommend_neq_charge',
  'unconfigured_revenue_provider_unavailable',
  // B — Customer Acquisition & Partnership Brain
  'unauthorized_partnership_discovery_denied',
  'design_partner_requires_authorized_data_only',
  'private_universe_deny_by_default',
  // C — Enterprise Deal Desk
  'deal_approval_without_human_founder_gate_denied',
  'negotiation_memory_neq_auto_sign',
  // D — Pricing Optimization Lab
  'pricing_experiment_neq_auto_price',
  'bundle_design_neq_auto_bill',
  // E — Launch Mission Control
  'launch_countdown_neq_public_launch',
  'pilot_ops_neq_auto_ship',
  'running_verified_requires_heartbeat',
  // F — Retention / Expansion Intelligence
  'renewal_risk_neq_auto_renew',
  'expansion_signal_neq_auto_charge',
  // G — Executive Performance Nervous System
  'decision_outcome_correlation_neq_causation',
  'digital_twin_neq_founder',
  // H — Neural growth nodes
  'neural_growth_node_sealed_deny_by_default',
  'offline_without_powered_node_waiting_or_stopped',
  'wedge_first_broader_network_gated',
  'evidence',
  'learning',
] as const;

export type DtHop = (typeof GROWTH_OPERATING_SYSTEM_CYCLE)[number];

export type DtEvidenceState =
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
  | 'ARCHITECTURE_TARGET'
  | 'CORRELATION_ONLY';

export type DtHopRecord = {
  hop: DtHop;
  state: DtEvidenceState;
  summary: string;
  at: string;
};

export type DtActorKind =
  | 'growth_os_curator'
  | 'revenue_factory_operator'
  | 'acquisition_partner_analyst'
  | 'deal_desk_operator'
  | 'pricing_lab_analyst'
  | 'launch_mission_controller'
  | 'retention_expansion_analyst'
  | 'executive_performance_analyst'
  | 'neural_growth_curator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type DtActor = {
  kind: DtActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 137;
export const GITLAB_COORDINATION_ISSUE = 71;

export const NEXT_PHASE_TITLE =
  '62L-DU — XIV Commercial Intelligence Superbrain + Autonomous Sales Department Network + Global Partner Ecosystem Graph + Deal/Contract Intelligence Cortex + Dynamic Pricing & Packaging Brain + Launch Readiness Digital Twin + Customer Lifetime Value Engine + Executive Strategy Simulation Center';

export const DT_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_GROWTH_OS_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_CONTRACT: false as const,
  RECOMMENDATION_EQ_PAYMENT: false as const,
  RECOMMENDATION_EQ_PUBLIC_LAUNCH: false as const,
  PRICING_EXPERIMENT_AUTO_PRICE: false as const,
  BUNDLE_DESIGN_AUTO_BILL: false as const,
  DEAL_APPROVAL_AUTO_SIGN: false as const,
  NEGOTIATION_MEMORY_AUTO_SIGN: false as const,
  LAUNCH_COUNTDOWN_EQ_PUBLIC_LAUNCH: false as const,
  PILOT_OPS_AUTO_SHIP: false as const,
  RENEWAL_RISK_AUTO_RENEW: false as const,
  EXPANSION_SIGNAL_AUTO_CHARGE: false as const,
  DECISION_OUTCOME_GUARANTEED_CAUSATION: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  UNAUTHORIZED_PARTNERSHIP_OUTREACH: false as const,
  UNAUTHORIZED_DATA_USE: false as const,
  BROADER_NETWORK_BEFORE_WEDGE_PROOF: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
});

export const RECOMMEND_NEQ_CHARGE = 'ACQUISITION_PIPELINE_RECOMMEND_NEQ_CHARGE';
export const UNCONFIGURED_PROVIDER_UNAVAILABLE = 'UNCONFIGURED_REVENUE_PROVIDER_UNAVAILABLE';
export const UNAUTHORIZED_PARTNERSHIP_DENIED = 'UNAUTHORIZED_PARTNERSHIP_DISCOVERY_DENIED';
export const DESIGN_PARTNER_AUTHORIZED_ONLY = 'DESIGN_PARTNER_REQUIRES_AUTHORIZED_DATA_ONLY';
export const PRIVATE_UNIVERSE_DENIED = 'PRIVATE_UNIVERSE_DENY_BY_DEFAULT';
export const DEAL_GATE_REQUIRED = 'DEAL_APPROVAL_WITHOUT_HUMAN_FOUNDER_GATE_DENIED';
export const NEGOTIATION_NEQ_AUTO_SIGN = 'NEGOTIATION_MEMORY_NEQ_AUTO_SIGN';
export const PRICING_NEQ_AUTO_PRICE = 'PRICING_EXPERIMENT_NEQ_AUTO_PRICE';
export const BUNDLE_NEQ_AUTO_BILL = 'BUNDLE_DESIGN_NEQ_AUTO_BILL';
export const COUNTDOWN_NEQ_PUBLIC_LAUNCH = 'LAUNCH_COUNTDOWN_NEQ_PUBLIC_LAUNCH';
export const PILOT_NEQ_AUTO_SHIP = 'PILOT_OPS_NEQ_AUTO_SHIP';
export const HEARTBEAT_REQUIRED_FOR_RUNNING = 'RUNNING_VERIFIED_REQUIRES_HEARTBEAT';
export const RENEWAL_NEQ_AUTO_RENEW = 'RENEWAL_RISK_NEQ_AUTO_RENEW';
export const EXPANSION_NEQ_AUTO_CHARGE = 'EXPANSION_SIGNAL_NEQ_AUTO_CHARGE';
export const CORRELATION_NEQ_CAUSATION = 'DECISION_OUTCOME_CORRELATION_NEQ_CAUSATION';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';
export const NEURAL_GROWTH_SEALED_DENIED = 'NEURAL_GROWTH_NODE_SEALED_DENY_BY_DEFAULT';
export const OFFLINE_WAITING_OR_STOPPED = 'OFFLINE_WITHOUT_POWERED_NODE_WAITING_OR_STOPPED';
export const WEDGE_FIRST_GATED = 'WEDGE_FIRST_BROADER_NETWORK_GATED';

export const MAX_PIPELINE_ITEMS = 500;
export const MAX_PARTNERS = 300;
export const MAX_DEALS = 300;
export const MAX_PRICING_EXPERIMENTS = 200;
export const MAX_LAUNCH_MISSIONS = 100;
export const MAX_RETENTION_SIGNALS = 500;
export const MAX_EXEC_DECISIONS = 500;
export const MAX_NEURAL_GROWTH_NODES = 2000;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: DtActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type DtPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(repoRoot?: string): Record<string, DtPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));

  return {
    DS: {
      tipProbe:
        has(brain, 'revenue-intelligence-os-types.ts') ||
        has(brain, 'revenue-intelligence-os.ts') ||
        has(ops, '62L_DS_REVENUE_INTELLIGENCE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DS_REVENUE_INTELLIGENCE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'Preferred DS Revenue Intelligence OS tip + report.',
    },
    DR: {
      tipProbe:
        has(brain, 'enterprise-nervous-revenue-command-types.ts') ||
        has(brain, 'enterprise-nervous-revenue-command-os.ts') ||
        has(ops, '62L_DR_ENTERPRISE_NERVOUS_REVENUE_COMMAND_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DR_ENTERPRISE_NERVOUS_REVENUE_COMMAND_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DR Enterprise Nervous Revenue Command fallback when DS absent.',
    },
    DQ: {
      tipProbe:
        has(brain, 'universal-integration-brain-types.ts') ||
        has(brain, 'universal-integration-brain.ts') ||
        has(ops, '62L_DQ_UNIVERSAL_INTEGRATION_BRAIN_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DQ_UNIVERSAL_INTEGRATION_BRAIN_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DQ Universal Integration Brain fallback when DR absent.',
    },
    DP: {
      tipProbe:
        has(brain, 'plugin-civilization-os-types.ts') ||
        has(brain, 'plugin-civilization-os.ts') ||
        has(ops, '62L_DP_PLUGIN_CIVILIZATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DP_PLUGIN_CIVILIZATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DP Plugin Civilization OS base @ 08078d1 when DS/DR/DQ WAITING_DATA.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DS' | 'DR' | 'DQ' | 'DP' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DS', 'DR', 'DQ', 'DP'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const PRODUCT_PHILOSOPHY = Object.freeze({
  specializedGovernedAgents: true,
  storyBeforeDashboard: true,
  measurableOutcomes: true,
  privateUniverses: true,
  humanControl: true,
  wedgeFirstSupplyChainSmb: true,
  broaderNetworkRequiresWedgeProof: true,
  integrateWithCustomerExistingSystems: true,
});
