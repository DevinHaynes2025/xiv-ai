import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DS — XIV Revenue Intelligence OS + AI Sales War Room +
 * Executive Operating Cadence + Deal Simulation & Negotiation Engine +
 * Financial Command Brain + Launch Control Tower + Million-Story Coverage Graph +
 * Customer Growth & Retention Nervous System.
 *
 * SoT: GitHub #136. GitLab #70 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire DR (preferred) → DQ → DP mesh when PRESENT.
 * Recommendation ≠ charge / deploy / spend / sign / publish / auto-price / auto-renew.
 * Deal sim ≠ verified outcome; GO/NO-GO ≠ auto-ship; BATNA/concessions need founder gates.
 * Million-story coverage = combinatorial User Story Graph, not 1M tickets.
 * Private Universes; deny-by-default; sealed deny; unenrolled UNAVAILABLE.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const REVENUE_INTELLIGENCE_OS_CYCLE = [
  'honesty_locks',
  'revenue_intelligence_os_bootstrap',
  'revenue_recommendation_neq_charge',
  'sales_war_room_story_before_dashboard',
  'executive_cadence_human_control',
  'deal_sim_neq_verified_fact',
  'negotiation_concession_needs_founder_gate',
  'financial_recommend_neq_apply_price',
  'launch_go_neq_auto_ship',
  'million_story_graph_not_mass_tickets',
  'retention_neq_auto_renew_charge',
  'sealed_founder_data_denied_by_label_alone',
  'unenrolled_provider_unavailable',
  'offline_waiting_node_when_no_powered_node',
  'evidence',
  'learning',
] as const;

export type DsHop = (typeof REVENUE_INTELLIGENCE_OS_CYCLE)[number];

export type DsEvidenceState =
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
  | 'ARCHITECTURE_TARGET'
  | 'ADVISORY'
  | 'GO'
  | 'NO_GO';

export type DsHopRecord = {
  hop: DsHop;
  state: DsEvidenceState;
  summary: string;
  at: string;
};

export type DsActorKind =
  | 'revenue_intelligence_curator'
  | 'sales_war_room_operator'
  | 'executive_cadence_operator'
  | 'deal_simulation_operator'
  | 'financial_command_operator'
  | 'launch_control_operator'
  | 'coverage_graph_curator'
  | 'retention_nervous_operator'
  | 'human_approver'
  | 'founder'
  | 'agent'
  | 'cro'
  | 'sdr'
  | 'account_executive'
  | 'customer_success'
  | 'cfo'
  | 'virtual_ceo';

export type DsActor = {
  kind: DsActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 136;
export const GITLAB_COORDINATION_ISSUE = 70;

export const NEXT_PHASE_TITLE =
  '62L-DT — XIV Growth Operating System + AI Revenue Factory + Customer Acquisition & Partnership Brain + Enterprise Deal Desk + Pricing Optimization Lab + Launch Mission Control + Retention/Expansion Intelligence + Executive Performance Nervous System';

export const DS_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_REVENUE_INTELLIGENCE_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  RECOMMENDATION_EQ_APPLY_PRICE: false as const,
  RECOMMENDATION_EQ_AUTO_RENEW: false as const,
  DEAL_SIM_EQ_VERIFIED_FACT: false as const,
  FORECAST_EQ_VERIFIED_FACT: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  LAUNCH_GO_EQ_AUTO_SHIP: false as const,
  NEGOTIATION_AUTO_ACCEPT: false as const,
  CONCESSION_WITHOUT_FOUNDER_GATE: false as const,
  BATNA_AUTO_COMMIT: false as const,
  MILLION_STORY_EQ_MILLION_TICKETS: false as const,
  RETENTION_AUTO_CHARGE: false as const,
  EXPANSION_AUTO_CHARGE: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  UNENROLLED_PROVIDER_AVAILABLE: false as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
});

export const REVENUE_RECOMMENDATION_NEQ_CHARGE =
  'REVENUE_RECOMMENDATION_NEQ_CHARGE' as const;
export const SALES_WAR_ROOM_STORY_BEFORE_DASHBOARD =
  'SALES_WAR_ROOM_STORY_BEFORE_DASHBOARD' as const;
export const EXECUTIVE_CADENCE_HUMAN_CONTROL =
  'EXECUTIVE_CADENCE_HUMAN_CONTROL' as const;
export const DEAL_SIM_NEQ_VERIFIED_FACT = 'DEAL_SIM_NEQ_VERIFIED_FACT' as const;
export const NEGOTIATION_CONCESSION_NEEDS_FOUNDER_GATE =
  'NEGOTIATION_CONCESSION_NEEDS_FOUNDER_GATE' as const;
export const FINANCIAL_RECOMMEND_NEQ_APPLY_PRICE =
  'FINANCIAL_RECOMMEND_NEQ_APPLY_PRICE' as const;
export const LAUNCH_GO_NEQ_AUTO_SHIP = 'LAUNCH_GO_NEQ_AUTO_SHIP' as const;
export const MILLION_STORY_GRAPH_NOT_MASS_TICKETS =
  'MILLION_STORY_GRAPH_NOT_MASS_TICKETS' as const;
export const RETENTION_NEQ_AUTO_RENEW_CHARGE =
  'RETENTION_NEQ_AUTO_RENEW_CHARGE' as const;
export const SEALED_FOUNDER_DATA_DENIED_BY_LABEL =
  'SEALED_FOUNDER_DATA_DENIED_BY_LABEL_ALONE' as const;
export const UNENROLLED_PROVIDER_UNAVAILABLE =
  'UNENROLLED_PROVIDER_UNAVAILABLE' as const;
export const OFFLINE_WAITING_NODE = 'WAITING_NODE' as const;
export const OFFLINE_STOPPED = 'OFFLINE_STOPPED' as const;

export const MAX_REVENUE_SIGNALS = 2000;
export const MAX_WAR_ROOM_SESSIONS = 200;
export const MAX_CADENCE_ITEMS = 500;
export const MAX_DEAL_SIMS = 500;
export const MAX_PRICE_RECOMMENDATIONS = 1000;
export const MAX_LAUNCH_GATES = 200;
export const MAX_STORY_ENUMERATION_SAMPLE = 256;
export const MAX_ACTIVE_SPRINT_STORIES = 32;
export const MAX_RETENTION_SIGNALS = 2000;
export const MAX_AUDIT_EVENTS = 5000;
export const HEARTBEAT_FRESH_MS = 60_000;

export type GovernedMetricKind =
  | 'path_to_cash'
  | 'retention'
  | 'sales_performance'
  | 'customer_roi'
  | 'plugin_adoption'
  | 'security_evidence';

export const GOVERNED_METRIC_KINDS: readonly GovernedMetricKind[] = [
  'path_to_cash',
  'retention',
  'sales_performance',
  'customer_roi',
  'plugin_adoption',
  'security_evidence',
] as const;

export type StoryDimension =
  | 'persona'
  | 'industry'
  | 'geography'
  | 'device'
  | 'agent'
  | 'integration'
  | 'security'
  | 'authority'
  | 'pricing'
  | 'offline_online'
  | 'failure'
  | 'retention'
  | 'expansion';

export const STORY_DIMENSIONS: readonly StoryDimension[] = [
  'persona',
  'industry',
  'geography',
  'device',
  'agent',
  'integration',
  'security',
  'authority',
  'pricing',
  'offline_online',
  'failure',
  'retention',
  'expansion',
] as const;

export type ConsequentialCommercialAction =
  | 'charge'
  | 'deploy'
  | 'spend'
  | 'sign'
  | 'publish'
  | 'apply_price'
  | 'auto_renew'
  | 'auto_accept_deal'
  | 'ship_launch';

export function isFounderOrHumanApprover(actor: DsActor): boolean {
  return actor.kind === 'founder' || actor.kind === 'human_approver';
}

export function isConsequentialCommercialAction(
  action: ConsequentialCommercialAction,
): boolean {
  void action;
  return true;
}

export type DsPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(repoRoot?: string): Record<string, DsPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));

  return {
    DR: {
      tipProbe:
        has(brain, 'enterprise-nervous-revenue-command-types.ts') ||
        has(ops, '62L_DR_ENTERPRISE_NERVOUS_REVENUE_COMMAND_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DR_ENTERPRISE_NERVOUS_REVENUE_COMMAND_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred DR Enterprise Nervous System + Revenue Command tip + report.',
    },
    DQ: {
      tipProbe:
        has(brain, 'universal-integration-brain-types.ts') ||
        has(ops, '62L_DQ_UNIVERSAL_INTEGRATION_BRAIN_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DQ_UNIVERSAL_INTEGRATION_BRAIN_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DQ Universal Integration Brain fallback when DR absent.',
    },
    DP: {
      tipProbe:
        has(brain, 'plugin-civilization-os-types.ts') ||
        has(ops, '62L_DP_PLUGIN_CIVILIZATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DP_PLUGIN_CIVILIZATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DP Plugin Civilization OS fallback when DQ absent.',
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
      note: 'DO Distributed Cognitive Runtime + Plugin Intelligence Mesh.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DR' | 'DQ' | 'DP' | 'DO' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DR', 'DQ', 'DP', 'DO'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}
