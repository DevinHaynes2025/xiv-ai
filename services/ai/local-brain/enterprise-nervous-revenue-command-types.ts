import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DR — XIV Enterprise Nervous System OS + Revenue Command Center +
 * Negotiation & Sales Agent Corps + Executive AI Suite + Neural Node Expansion +
 * 30-Day Launch Readiness Program + Generative User Story Graph.
 *
 * SoT: GitHub #135. GitLab #69 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Extends DP Plugin Civilization OS when PRESENT (soft-wire); else DO → DN → DM → DL.
 * Consequential decisions remain human-controlled (founder approval gates).
 * Agents cannot charge, sign contracts, deploy production, or impersonate founder.
 * Recommendation ≠ close deal / spend / publish.
 * Negotiation cockpit advisory until founder approval.
 * LegalShield = potential future partner/integration target only until authorized → UNAVAILABLE if not configured.
 * Business Law agent: research/clause comparison/compliance spotting/questions for counsel — NOT attorney substitute.
 * 30-day launch = private beta/pilot or investor-ready MVP — not full XIV OS GA / PRODUCTION AUTHORIZED.
 * Million+ user stories = generative combinatorial graph — not 1M tickets; sprints stay bounded.
 * Neural node expansion: sparse logical; RUNNING_VERIFIED needs evidence.
 * Local-first; Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const ENTERPRISE_NERVOUS_REVENUE_COMMAND_CYCLE = [
  'honesty_locks',
  'enterprise_nervous_system_bootstrap',
  'sales_negotiation_cannot_sign_charge_deploy_without_founder_gate',
  'virtual_ceo_cannot_impersonate_founder_or_self_approve',
  'business_law_output_not_legal_advice',
  'legalshield_unconfigured_unavailable',
  'consequential_deal_action_without_founder_approval_denied',
  'launch_readiness_cannot_mark_full_os_production_authorized',
  'user_story_graph_enumerates_without_spawning_1m_tickets',
  'active_sprint_selection_bounded',
  'cfo_cannot_execute_live_bank_charge_mutations',
  'agent_without_heartbeat_not_running_verified',
  'sealed_founder_data_denied_to_sales_corps_by_label_alone',
  'evidence',
  'learning',
] as const;

export type DrHop = (typeof ENTERPRISE_NERVOUS_REVENUE_COMMAND_CYCLE)[number];

export type DrEvidenceState =
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
  | 'NOT_LEGAL_ADVICE';

export type DrHopRecord = {
  hop: DrHop;
  state: DrEvidenceState;
  summary: string;
  at: string;
};

export type SalesAgentRole =
  | 'cro'
  | 'sdr'
  | 'account_executive'
  | 'negotiation'
  | 'customer_success'
  | 'sales_ops';

export type ExecutiveAgentRole =
  | 'cfo'
  | 'coo'
  | 'devops'
  | 'ciso'
  | 'chief_of_staff'
  | 'product_ux'
  | 'partnerships'
  | 'data_quant'
  | 'virtual_ceo'
  | 'business_law';

export type DrActorKind =
  | 'enterprise_nervous_curator'
  | 'revenue_command_operator'
  | 'sales_corps_operator'
  | 'executive_suite_operator'
  | 'negotiation_cockpit_operator'
  | 'neural_node_curator'
  | 'launch_readiness_operator'
  | 'user_story_graph_curator'
  | 'human_approver'
  | 'founder'
  | 'agent'
  | SalesAgentRole
  | ExecutiveAgentRole;

export type DrActor = {
  kind: DrActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 135;
export const GITLAB_COORDINATION_ISSUE = 69;

export const NEXT_PHASE_TITLE =
  '62L-DS — XIV Revenue Intelligence OS + AI Sales War Room + Executive Operating Cadence + Deal Simulation & Negotiation Engine + Financial Command Brain + Launch Control Tower + Million-Story Coverage Graph + Customer Growth & Retention Nervous System';

export const DR_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_OS_PRODUCTION_AUTHORIZED_IN_30_DAYS: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  AGENTS_CAN_CHARGE: false as const,
  AGENTS_CAN_SIGN_CONTRACTS: false as const,
  AGENTS_CAN_DEPLOY_PRODUCTION: false as const,
  AGENTS_CAN_IMPERSONATE_FOUNDER: false as const,
  RECOMMENDATION_EQ_CLOSE_DEAL: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  NEGOTIATION_COCKPIT_AUTO_EXECUTE: false as const,
  VIRTUAL_CEO_EQ_FOUNDER: false as const,
  VIRTUAL_CEO_SELF_APPROVE_CONSEQUENTIAL: false as const,
  BUSINESS_LAW_EQ_ATTORNEY: false as const,
  BUSINESS_LAW_SUBSTITUTE_FOR_COUNSEL: false as const,
  LEGALSHIELD_CLAIMED_LIVE_WITHOUT_CONFIG: false as const,
  CONSEQUENTIAL_DEAL_WITHOUT_FOUNDER_APPROVAL: false as const,
  CFO_LIVE_BANK_MUTATIONS: false as const,
  CFO_LIVE_CHARGE_MUTATIONS: false as const,
  LOGICAL_NODE_EQ_RUNNING_VERIFIED: false as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  SEALED_ACCESS_BY_LABEL_ALONE: false as const,
  MILLION_STORY_EQ_MILLION_TICKETS: false as const,
  UNBOUNDED_SPRINT_SELECTION: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  THIRTY_DAY_EQ_FULL_GA: false as const,
});

export const SALES_SIGN_CHARGE_DEPLOY_DENIED =
  'SALES_NEGOTIATION_CANNOT_SIGN_CHARGE_DEPLOY_WITHOUT_FOUNDER_GATE' as const;
export const VIRTUAL_CEO_IMPERSONATION_DENIED =
  'VIRTUAL_CEO_CANNOT_IMPERSONATE_FOUNDER_OR_SELF_APPROVE' as const;
export const BUSINESS_LAW_NOT_LEGAL_ADVICE =
  'BUSINESS_LAW_OUTPUT_NOT_LEGAL_ADVICE_NOT_ATTORNEY_SUBSTITUTE' as const;
export const LEGALSHIELD_UNAVAILABLE =
  'LEGALSHIELD_UNCONFIGURED_UNAVAILABLE' as const;
export const CONSEQUENTIAL_DEAL_DENIED =
  'CONSEQUENTIAL_DEAL_ACTION_WITHOUT_FOUNDER_APPROVAL_DENIED' as const;
export const LAUNCH_NO_FULL_PROD_AUTH =
  'LAUNCH_READINESS_CANNOT_MARK_FULL_OS_PRODUCTION_AUTHORIZED' as const;
export const STORY_GRAPH_NO_1M_TICKETS =
  'USER_STORY_GRAPH_ENUMERATES_WITHOUT_SPAWNING_1M_TICKETS' as const;
export const SPRINT_SELECTION_BOUNDED = 'ACTIVE_SPRINT_SELECTION_BOUNDED' as const;
export const CFO_LIVE_MUTATION_DENIED =
  'CFO_CANNOT_EXECUTE_LIVE_BANK_CHARGE_MUTATIONS' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'AGENT_WITHOUT_HEARTBEAT_NOT_RUNNING_VERIFIED' as const;
export const SEALED_FOUNDER_DATA_DENIED =
  'SEALED_FOUNDER_DATA_DENIED_TO_SALES_CORPS_BY_LABEL_ALONE' as const;
export const ADVISORY_UNTIL_FOUNDER_APPROVAL =
  'NEGOTIATION_COCKPIT_ADVISORY_UNTIL_FOUNDER_APPROVAL' as const;

export const MAX_ACTIVE_SPRINT_STORIES = 32 as const;
export const MAX_NEURAL_NODES_MATERIALIZED = 64 as const;
export const MAX_AUDIT_EVENTS = 5000 as const;
export const HEARTBEAT_FRESH_MS = 60_000 as const;

export const BUSINESS_LAW_DISCLAIMER =
  'NOT LEGAL ADVICE. Not a substitute for a licensed attorney. Output is legal research, clause comparison, compliance issue spotting, and questions for counsel only.';

export const LAUNCH_TARGET_LABEL =
  'private beta / pilot / investor-ready MVP — not full XIV OS responsible GA' as const;

export type DealAction =
  | 'recommend_pricing'
  | 'draft_concession'
  | 'sign_contract'
  | 'charge_customer'
  | 'deploy_production'
  | 'close_deal'
  | 'bank_transfer'
  | 'live_charge'
  | 'publish_external';

export type NegotiationCockpitSurface =
  | 'batna'
  | 'target_walkaway'
  | 'give_get'
  | 'concession_history'
  | 'roi'
  | 'pricing_scenarios'
  | 'contract_term_comparison'
  | 'objection_intelligence';

export const NEGOTIATION_COCKPIT_SURFACES: readonly NegotiationCockpitSurface[] = [
  'batna',
  'target_walkaway',
  'give_get',
  'concession_history',
  'roi',
  'pricing_scenarios',
  'contract_term_comparison',
  'objection_intelligence',
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
  | 'failure';

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
] as const;

export function isFounderOrHumanApprover(actor: DrActor): boolean {
  return actor.kind === 'founder' || actor.kind === 'human_approver';
}

export function isSalesCorpsRole(kind: DrActorKind): boolean {
  return (
    kind === 'cro' ||
    kind === 'sdr' ||
    kind === 'account_executive' ||
    kind === 'negotiation' ||
    kind === 'customer_success' ||
    kind === 'sales_ops' ||
    kind === 'sales_corps_operator'
  );
}

export function isConsequentialDealAction(action: DealAction): boolean {
  return (
    action === 'sign_contract' ||
    action === 'charge_customer' ||
    action === 'deploy_production' ||
    action === 'close_deal' ||
    action === 'bank_transfer' ||
    action === 'live_charge' ||
    action === 'publish_external'
  );
}

export type DrPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(repoRoot?: string): Record<string, DrPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));

  return {
    DQ: {
      tipProbe:
        has(brain, 'universal-integration-brain-types.ts') ||
        has(ops, '62L_DQ_UNIVERSAL_INTEGRATION_BRAIN_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DQ_UNIVERSAL_INTEGRATION_BRAIN_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'Preferred DQ Universal Integration Brain tip + report.',
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
    DN: {
      tipProbe:
        has(brain, 'universal-agent-runtime-os-types.ts') ||
        has(ops, '62L_DN_UNIVERSAL_AGENT_RUNTIME_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DN_UNIVERSAL_AGENT_RUNTIME_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DN Universal Agent Runtime OS.',
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
      note: 'DM Global Neural Transit Civilization Atlas.',
    },
    DL: {
      tipProbe:
        has(brain, 'neural-transportation-os-types.ts') ||
        has(ops, '62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DL_NEURAL_TRANSPORTATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DL Neural Transportation OS.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DQ' | 'DP' | 'DO' | 'DN' | 'DM' | 'DL' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DQ', 'DP', 'DO', 'DN', 'DM', 'DL'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}
