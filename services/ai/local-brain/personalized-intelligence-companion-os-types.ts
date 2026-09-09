import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DI — XIV Personalized Intelligence Companion OS + Global Data Storytelling Engine +
 * Historical Forecast Memory Network + Decision Copilot Studio + Agent Workforce Marketplace +
 * Real-Time Collaboration Universe + Adaptive UI/UX Intelligence Graph.
 *
 * SoT: GitHub #126. GitLab #60 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No mega-delta. No PR / no prod deploy / no DB migration.
 */

export const PERSONALIZED_INTELLIGENCE_COMPANION_OS_CYCLE = [
  'honesty_locks',
  'personalized_intelligence_companion_os_bootstrap',
  'companion_cannot_impersonate_founder_or_approve_spend_deploy',
  'silent_private_data_share_denied',
  'forecast_memory_cannot_relabel_past_as_verified_fact',
  'prediction_surfaces_remain_probabilistic',
  'marketplace_listing_does_not_grant_credentials_billing_deploy',
  'collaboration_share_without_opt_in_denied',
  'ux_graph_change_reversible_cannot_self_grant_authority',
  'overnight_without_powered_node_waiting_or_offline',
  'agent_without_heartbeat_not_running_verified',
  'under_18_denied_where_applicable',
  'evidence',
  'learning',
] as const;

export type DiHop = (typeof PERSONALIZED_INTELLIGENCE_COMPANION_OS_CYCLE)[number];

export type DiEvidenceState =
  | 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'WAITING_NODE' | 'OFFLINE_STOPPED'
  | 'STALE' | 'UNKNOWN' | 'NOT_TESTED' | 'DENIED' | 'REJECTED' | 'SANDBOXED' | 'CANDIDATE'
  | 'DOCUMENTED' | 'IMPLEMENTED' | 'AVAILABLE' | 'VERIFIED' | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY' | 'PLAN_ONLY' | 'BOUNDED' | 'LABELED_SIMULATION' | 'LABELED_FORECAST'
  | 'PROBABILISTIC' | 'NOT_APPLIED' | 'ATTRIBUTION_UNSAFE' | 'LOCAL_PREFERRED' | 'APPROVED'
  | 'CONFIGURED' | 'AUTHORIZED' | 'REGISTERED' | 'RUNNING_VERIFIED' | 'HYPOTHESIS' | 'UNPROMOTED'
  | 'SIGNED' | 'UNSIGNED' | 'CONSENSUS_ONLY' | 'TEST_ONLY' | 'ACCOUNTING_ONLY' | 'LOGICAL'
  | 'ARCHITECTURE_TARGET' | 'CONTRACT_ONLY' | 'DEFENSIVE_ONLY' | 'REVERSIBLE' | 'EXPLAINABLE';

export type DiHopRecord = { hop: DiHop; state: DiEvidenceState; summary: string; at: string };

export const DI_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  LOGICAL_AUTO_RUNNING_VERIFIED: false as const,
  OFFLINE_DEVICES_PRETEND_RUNNING: false as const,
  UNDER_18_ONBOARDING_ALLOWED: false as const,
  ADULT_18_PLUS_REQUIRED: true as const,
  COMPANION_IMPERSONATES_FOUNDER: false as const,
  COMPANION_APPROVES_SPEND_ALONE: false as const,
  COMPANION_APPROVES_DEPLOY_ALONE: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  SILENT_PRIVATE_DATA_SHARE: false as const,
  PRIVATE_DATA_SHARE_REQUIRES_EXPLICIT_OPT_IN: true as const,
  FORECAST_MEMORY_REWRITES_HISTORY_AS_FACT: false as const,
  PAST_PROBABILISTIC_FORECAST_RELABEL_AS_VERIFIED_FACT: false as const,
  PREDICTIONS_REMAIN_PROBABILISTIC: true as const,
  FORECAST_LABELED_AS_VERIFIED_FACT: false as const,
  MARKETPLACE_LISTING_GRANTS_CREDENTIALS: false as const,
  MARKETPLACE_LISTING_GRANTS_BILLING: false as const,
  MARKETPLACE_LISTING_GRANTS_DEPLOY: false as const,
  MARKETPLACE_LISTING_EQ_AUTHORITY: false as const,
  COLLABORATION_SHARE_WITHOUT_OPT_IN: false as const,
  COMMUNITY_OPT_IN_REQUIRED: true as const,
  UX_GRAPH_SELF_GRANTS_AGENT_AUTHORITY: false as const,
  UX_GRAPH_MUST_BE_EXPLAINABLE: true as const,
  UX_GRAPH_MUST_BE_REVERSIBLE: true as const,
  LEARNING_GRANTS_PERMISSION: false as const,
  OVERNIGHT_WITHOUT_POWERED_NODE_ALLOWED: false as const,
  OVERNIGHT_REQUIRES_AUTHORIZED_POWERED_NODE: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  FULL_PRODUCTION_COMPANION_SHIPPED: false as const,
  COMPANION_CONTRACTS_BOUNDED_TYPESCRIPT_DOCS: true as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  DI_IS_COEXISTENCE_LAYER: true as const,
  DI_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER = 'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;
export const NEXT_PHASE_TITLE = '62L-DJ — XIV Personal Intelligence Command OS + Predictive Storyline Engine + Historical Pattern Memory Cortex + Decision/Scenario Control Tower + Agent Team Operating Marketplace + Global Collaboration & Knowledge Rooms + Continuous Product Experience Learning Fabric' as const;
export const GITHUB_SOT_ISSUE = 126 as const;
export const GITLAB_COORDINATION_ISSUE = 60 as const;

export const COMPANION_FOUNDER_IMPERSONATION_DENIED = 'COMPANION_CANNOT_IMPERSONATE_FOUNDER_OR_APPROVE_SPEND_DEPLOY_ALONE' as const;
export const SILENT_PRIVATE_DATA_SHARE_DENIED = 'SILENT_PRIVATE_DATA_SHARE_DENIED_EXPLICIT_OPT_IN_REQUIRED' as const;
export const FORECAST_MEMORY_RELABEL_DENIED = 'FORECAST_MEMORY_CANNOT_RELABEL_PAST_PROBABILISTIC_FORECAST_AS_VERIFIED_FACT' as const;
export const PREDICTION_MUST_REMAIN_PROBABILISTIC = 'PREDICTION_SURFACES_MUST_REMAIN_PROBABILISTIC_NOT_VERIFIED_FACT' as const;
export const MARKETPLACE_AUTHORITY_DENIED = 'MARKETPLACE_LISTING_DOES_NOT_GRANT_CREDENTIALS_BILLING_OR_DEPLOY' as const;
export const COLLABORATION_OPT_IN_REQUIRED_DENIED = 'COLLABORATION_SHARE_WITHOUT_OPT_IN_DENIED' as const;
export const UX_GRAPH_AUTHORITY_SELF_GRANT_DENIED = 'UX_GRAPH_CANNOT_SELF_GRANT_AGENT_AUTHORITY_MUST_BE_REVERSIBLE' as const;
export const OVERNIGHT_NO_POWERED_NODE = 'OVERNIGHT_WITHOUT_AUTHORIZED_POWERED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED = 'AGENT_WITHOUT_HEARTBEAT_NOT_RUNNING_VERIFIED_ON_WORKFORCE_SURFACE' as const;
export const UNDER_18_DENIED = 'UNDER_18_PERSONAL_COMPANION_DENIED' as const;

export const MAX_COMPANION_SURFACES = 256 as const;
export const MAX_STORY_DASHBOARDS = 1024 as const;
export const MAX_FORECAST_MEMORIES = 4096 as const;
export const MAX_COPILOT_SCENARIOS = 2048 as const;
export const MAX_MARKETPLACE_LISTINGS = 2048 as const;
export const MAX_COLLAB_ROOMS = 1024 as const;
export const MAX_UX_GRAPH_NODES = 4096 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;
export const ADULT_MIN_AGE_YEARS = 18 as const;

export type DiActorKind =
  | 'ceo_principal' | 'human_operator' | 'companion_os_curator' | 'storytelling_governor'
  | 'forecast_memory_governor' | 'decision_copilot_governor' | 'marketplace_governor'
  | 'collaboration_governor' | 'ux_graph_governor' | 'ordinary_agent' | 'impersonator' | 'founder';

export type DiActor = {
  kind: DiActorKind; id: string; orgId: string; tenantId: string; universeId: string;
  role: string; permissionLevel: number; authorityLevel: number;
  sealedScope?: boolean; authScope?: string[]; declaredAgeYears?: number; isFounder?: boolean;
};

export type CompanionSurfaceId =
  | 'companion_home' | 'recommendation_drawer' | 'evidence_drawer' | 'overnight_brief'
  | 'story_dashboard' | 'forecast_memory' | 'decision_copilot' | 'workforce_marketplace'
  | 'collaboration_room' | 'ux_intelligence_graph';

export type CompanionActionKind = 'recommend' | 'impersonate_founder' | 'approve_spend' | 'approve_deploy' | 'publish' | 'charge';

export type ForecastEpistemicLabel =
  | 'PROBABILISTIC' | 'LABELED_FORECAST' | 'LABELED_SCENARIO' | 'HYPOTHESIS'
  | 'CALIBRATION_PENDING' | 'ERROR_LEARNED' | 'VERIFIED_FACT';

export type WorkforceSurfaceStatus =
  | 'REGISTERED' | 'LOGICAL' | 'RUNNING_VERIFIED' | 'WAITING_NODE' | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE' | 'DENIED' | 'UNKNOWN';

export type PredecessorProbe = { tipProbe: 'PRESENT' | 'WAITING_DATA' | 'MISSING'; report: 'PRESENT' | 'MISSING'; note: string };

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace', 'private_chain_of_thought', 'private_cot', 'hidden_cot',
  'secret_reasoning', 'internal_monologue', 'private_user_payload', 'sealed_personal_data',
] as const);

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()): Record<string, PredecessorProbe> {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  const localBrain = join(root, 'services/ai/local-brain');
  const hasMod = (file: string) => existsSync(join(localBrain, file));
  return {
    DH: {
      tipProbe: hasMod('adaptive-life-business-intelligence-os-types.ts') || has('62L_DH_ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DH_ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'Preferred DH Adaptive Life/Business Intelligence OS tip + report.',
    },
    DG: {
      tipProbe: hasMod('universal-personal-business-ai-os-types.ts') || has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DG Universal Personal/Business AI OS fallback when DH absent.',
    },
    DF: {
      tipProbe: hasMod('human-centered-superbrain-ux-types.ts') || has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DF Human-Centered Superbrain UX when DH/DG WAITING_DATA.',
    },
    DE: {
      tipProbe: hasMod('knowledge-exchange-gateway-marketplace-types.ts') || has('62L_DE_KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DE_KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DE in DF lineage.',
    },
    DD: {
      tipProbe: hasMod('cognitive-service-mesh-types.ts') || has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DD Cognitive Service Mesh fallback.',
    },
    DA: {
      tipProbe: hasMod('superbrain-runtime-kernel-types.ts') || has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DA Superbrain Runtime Kernel fallback.',
    },
    CY: {
      tipProbe: hasMod('knowledge-colony-operating-system-types.ts') || has('62L_CY_KNOWLEDGE_COLONY_OPERATING_SYSTEM_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CY_KNOWLEDGE_COLONY_OPERATING_SYSTEM_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CY Knowledge Colony OS sealed tip.',
    },
  };
}
