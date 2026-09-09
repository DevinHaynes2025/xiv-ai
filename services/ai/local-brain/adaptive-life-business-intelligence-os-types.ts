import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DH — XIV Adaptive Life & Business Intelligence OS + Personalized AI Chief-of-Staff Network +
 * Global Historical Knowledge Engine + Decision Simulation Studio + Autonomous Research/Workforce Planner +
 * Community Collaboration Graph + Continuous UX Learning & Agent Evolution Fabric.
 *
 * SoT: GitHub #125. GitLab #59 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Historical ingestion provenance- and rights-aware; unauthorized DENIED.
 * Predictions remain probabilistic; sim/forecast ≠ verified fact.
 * Overnight agents require authorized powered node; else WAITING_NODE/OFFLINE_STOPPED.
 * Community sharing opt-in.
 * Agent/UX learning explainable and reversible; cannot self-grant authority.
 * Chief-of-Staff = recommendation/coordination surface; Digital Twin ≠ founder; recommendation ≠ charge/deploy.
 * Personal/Business isolation preserved; adult 18+ where applicable.
 * Local-first; Founder-sealed deny-by-default.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_CYCLE = [
  'honesty_locks',
  'adaptive_life_business_intelligence_os_bootstrap',
  'cross_personal_business_private_leak_denied',
  'under_18_denied_where_applicable',
  'unauthorized_historical_ingestion_denied',
  'decision_sim_not_labeled_verified_fact',
  'quantum_adjacent_without_classical_baseline_rejected',
  'overnight_plan_without_powered_node_waiting_or_offline',
  'community_share_without_opt_in_denied',
  'ux_agent_evolution_reversible_rollback',
  'learning_cannot_self_grant_authority',
  'chief_of_staff_cannot_approve_spend_deploy_publish_alone',
  'evidence',
  'learning',
] as const;

export type DhHop = (typeof ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_CYCLE)[number];

export type DhEvidenceState =
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
  | 'DEFENSIVE_ONLY'
  | 'OPT_IN_REQUIRED'
  | 'ISOLATION_HELD'
  | 'REVERSIBLE'
  | 'ROLLED_BACK';

export type DhHopRecord = {
  hop: DhHop;
  state: DhEvidenceState;
  summary: string;
  at: string;
};

export const DH_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  UNDER_18_ACTIVATION_ALLOWED: false as const,
  ADULT_18_PLUS_REQUIRED: true as const,
  CROSS_PERSONAL_BUSINESS_PRIVATE_LEAK: false as const,
  PERSONAL_BUSINESS_ISOLATION_DEFAULT: true as const,
  UNAUTHORIZED_HISTORICAL_INGESTION: false as const,
  HISTORICAL_REQUIRES_PROVENANCE_AND_RIGHTS: true as const,
  DECISION_SIM_LABELED_AS_VERIFIED_FACT: false as const,
  PREDICTIONS_REMAIN_PROBABILISTIC: true as const,
  SIM_FORECAST_EQ_VERIFIED_FACT: false as const,
  QUANTUM_ADJACENT_WITHOUT_CLASSICAL_BASELINE: false as const,
  QUANTUM_PREDICTION_GUARANTEED: false as const,
  CLASSICAL_BASELINE_REQUIRED_FOR_QUANTUM_ADJACENT: true as const,
  COMMUNITY_SHARE_WITHOUT_OPT_IN: false as const,
  COMMUNITY_SHARING_OPT_IN_ONLY: true as const,
  OVERNIGHT_WITHOUT_POWERED_AUTHORIZED_NODE: false as const,
  OVERNIGHT_REQUIRES_AUTHORIZED_POWERED_NODE: true as const,
  LEARNING_SELF_GRANTS_AUTHORITY: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  UX_AGENT_EVOLUTION_IRREVERSIBLE: false as const,
  UX_AGENT_EVOLUTION_EXPLAINABLE_REVERSIBLE: true as const,
  AGENT_CANNOT_SELF_GRANT_AUTHORITY: true as const,
  CHIEF_OF_STAFF_CAN_APPROVE_SPEND: false as const,
  CHIEF_OF_STAFF_CAN_APPROVE_DEPLOY: false as const,
  CHIEF_OF_STAFF_CAN_APPROVE_PUBLISH: false as const,
  CHIEF_OF_STAFF_RECOMMENDATION_ONLY: true as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  RECOMMENDATION_EQ_CHARGE_OR_DEPLOY: false as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  FULL_PRODUCTION_UX_SHIPPED: false as const,
  UX_CONTRACTS_BOUNDED_TYPESCRIPT_DOCS: true as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  OS_IS_COEXISTENCE_LAYER: true as const,
  OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DI — XIV Personalized Intelligence Companion OS + Global Data Storytelling Engine + Historical Forecast Memory Network + Decision Copilot Studio + Agent Workforce Marketplace + Real-Time Collaboration Universe + Adaptive UI/UX Intelligence Graph' as const;

export const GITHUB_SOT_ISSUE = 125 as const;
export const GITLAB_COORDINATION_ISSUE = 59 as const;

export const CROSS_PERSONAL_BUSINESS_LEAK_DENIED =
  'CROSS_PERSONAL_BUSINESS_PRIVATE_LEAK_DENIED_BY_DEFAULT' as const;
export const UNDER_18_DENIED = 'UNDER_18_DENIED_WHERE_APPLICABLE' as const;
export const UNAUTHORIZED_HISTORICAL_INGESTION_DENIED =
  'UNAUTHORIZED_HISTORICAL_INGESTION_DENIED_PROVENANCE_AND_RIGHTS_REQUIRED' as const;
export const DECISION_SIM_NOT_VERIFIED_FACT =
  'DECISION_SIMULATION_NOT_LABELED_VERIFIED_OUTCOME_OR_FACT' as const;
export const QUANTUM_ADJACENT_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_ADJACENT_PREDICTION_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const OVERNIGHT_WAITING_NODE = 'WAITING_NODE' as const;
export const OVERNIGHT_OFFLINE_STOPPED = 'OFFLINE_STOPPED' as const;
export const COMMUNITY_SHARE_OPT_IN_DENIED =
  'COMMUNITY_SHARE_WITHOUT_OPT_IN_DENIED' as const;
export const LEARNING_AUTHORITY_SELF_GRANT_DENIED =
  'LEARNING_CANNOT_SELF_GRANT_AUTHORITY' as const;
export const CHIEF_OF_STAFF_SPEND_DEPLOY_PUBLISH_DENIED =
  'CHIEF_OF_STAFF_CANNOT_APPROVE_SPEND_DEPLOY_PUBLISH_ALONE' as const;
export const EVOLUTION_ROLLBACK_OK =
  'UX_AGENT_EVOLUTION_CHANGE_REVERSIBLE_TRUSTED_STATUS_ROLLED_BACK' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;

export const MAX_COMMAND_CENTERS = 256 as const;
export const MAX_COS_RECOMMENDATIONS = 2048 as const;
export const MAX_HISTORICAL_COVERAGE_MAPS = 2048 as const;
export const MAX_DECISION_SIMS = 2048 as const;
export const MAX_RESEARCH_CAMPAIGNS = 1024 as const;
export const MAX_OVERNIGHT_PLANS = 1024 as const;
export const MAX_COMMUNITY_EDGES = 4096 as const;
export const MAX_EVOLUTION_ENTRIES = 4096 as const;
export const ADULT_MIN_AGE_YEARS = 18 as const;

export type DhActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'adaptive_os_curator'
  | 'chief_of_staff_governor'
  | 'historical_knowledge_governor'
  | 'decision_sim_governor'
  | 'research_planner_governor'
  | 'community_graph_governor'
  | 'ux_evolution_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type DhActor = {
  kind: DhActorKind;
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
  mode?: IntelligenceMode;
};

export type IntelligenceMode = 'personal' | 'business' | 'dual';

export type IsolationBoundary = 'personal_private' | 'business_private' | 'shared_policy';

export type SimulationLabel =
  | 'LABELED_SIMULATION'
  | 'LABELED_FORECAST'
  | 'LABELED_SCENARIO'
  | 'PROBABILISTIC'
  | 'HYPOTHESIS'
  | 'CALIBRATION_PENDING';

export type OvernightPlanStatus =
  | 'SCHEDULED'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'DENIED'
  | 'COMPLETED'
  | 'PLAN_ONLY';

export type CosActionKind =
  | 'recommend'
  | 'coordinate'
  | 'approve_spend'
  | 'approve_deploy'
  | 'approve_publish'
  | 'charge'
  | 'impersonate_founder';

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
    DG: {
      tipProbe:
        hasMod('universal-personal-business-ai-os-types.ts') ||
        has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred DG Universal Personal/Business AI OS tip + report. Poll with backoff when WAITING_DATA; soft-wire when modules present.',
    },
    DF: {
      tipProbe:
        hasMod('human-centered-superbrain-ux-types.ts') ||
        has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DF Human-Centered Superbrain UX fallback when DG tip/report absent (f9491b6 lineage).',
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
      note: 'DE Knowledge Exchange Gateway Marketplace in DF lineage.',
    },
    DD: {
      tipProbe:
        hasMod('cognitive-service-mesh-types.ts') ||
        has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DD Cognitive Service Mesh in DF←DE lineage.',
    },
    DC: {
      tipProbe:
        hasMod('superbrain-service-fabric-types.ts') ||
        has('62L_DC_SUPERBRAIN_SERVICE_FABRIC_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DC_SUPERBRAIN_SERVICE_FABRIC_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DC Superbrain Service Fabric — parallel sibling lineage; may be WAITING_DATA.',
    },
    DB: {
      tipProbe:
        hasMod('superbrain-control-plane-types.ts') ||
        has('62L_DB_SUPERBRAIN_CONTROL_PLANE_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DB_SUPERBRAIN_CONTROL_PLANE_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DB Superbrain Control Plane — parallel sibling; may be WAITING_DATA.',
    },
    DA: {
      tipProbe:
        hasMod('superbrain-runtime-kernel-types.ts') ||
        has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DA Superbrain Runtime Kernel present in DF←DE←DD lineage.',
    },
  };
}
