import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DJ — XIV Personal Intelligence Command OS + Predictive Storyline Engine +
 * Historical Pattern Memory Cortex + Decision/Scenario Control Tower +
 * Agent Team Operating Marketplace + Global Collaboration & Knowledge Rooms +
 * Continuous Product Experience Learning Fabric.
 *
 * SoT: GitHub #127. GitLab #61 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * No fabricated runtime state; RUNNING_VERIFIED needs heartbeat/runtime evidence.
 * No silent permission inheritance.
 * Predictions probabilistic; no guaranteed prediction claims.
 * No raw private cross-tenant sharing.
 * Overnight without powered node → WAITING_NODE / OFFLINE_STOPPED.
 * Marketplace listing ≠ credentials/billing/deploy authority.
 * UX learning proposals reversible; learning ≠ self-grant authority.
 * Control tower recommendation ≠ charge/deploy/publish.
 * Collaboration opt-in; adult 18+ where applicable.
 * Local-first; Founder-sealed deny-by-default.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const PERSONAL_INTELLIGENCE_COMMAND_OS_CYCLE = [
  'honesty_locks',
  'personal_intelligence_command_os_bootstrap',
  'fabricated_running_verified_without_heartbeat_denied',
  'silent_permission_inheritance_denied',
  'guaranteed_prediction_claim_rejected',
  'raw_private_cross_tenant_share_denied',
  'overnight_without_powered_node_waiting_or_stopped',
  'storyline_card_probabilistic_evidence_linked',
  'pattern_memory_no_auto_causation_promotion',
  'marketplace_listing_not_credentials_billing_deploy',
  'ux_improvement_proposal_reversible_no_self_grant',
  'collaboration_without_opt_in_denied',
  'control_tower_recommendation_not_charge_deploy_publish',
  'evidence',
  'learning',
] as const;

export type DjHop = (typeof PERSONAL_INTELLIGENCE_COMMAND_OS_CYCLE)[number];

export type DjEvidenceState =
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
  | 'CORRELATION_ONLY'
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
  | 'LISTED'
  | 'REVERSIBLE'
  | 'OPT_IN_REQUIRED';

export type DjHopRecord = {
  hop: DjHop;
  state: DjEvidenceState;
  summary: string;
  at: string;
};

export const DJ_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  FABRICATED_RUNTIME_STATE: false as const,
  LOGICAL_AUTO_RUNNING_VERIFIED: false as const,
  SILENT_PERMISSION_INHERITANCE: false as const,
  GUARANTEED_PREDICTION_CLAIMS: false as const,
  PREDICTIONS_PROBABILISTIC_ONLY: true as const,
  RAW_PRIVATE_CROSS_TENANT_SHARE: false as const,
  OVERNIGHT_WITHOUT_POWERED_NODE: false as const,
  OVERNIGHT_REQUIRES_POWERED_NODE: true as const,
  PATTERN_AUTO_PROMOTES_TO_CAUSATION: false as const,
  PATTERN_IS_CORRELATION_UNTIL_EVIDENCED: true as const,
  MARKETPLACE_LISTING_GRANTS_CREDENTIALS: false as const,
  MARKETPLACE_LISTING_GRANTS_BILLING: false as const,
  MARKETPLACE_LISTING_GRANTS_DEPLOY: false as const,
  MARKETPLACE_LISTING_IS_LISTING_ONLY: true as const,
  UX_LEARNING_SELF_GRANTS_AUTHORITY: false as const,
  UX_IMPROVEMENT_PROPOSALS_REVERSIBLE: true as const,
  LEARNING_EQ_SELF_GRANT_AUTHORITY: false as const,
  CONTROL_TOWER_RECOMMENDATION_CHARGES: false as const,
  CONTROL_TOWER_RECOMMENDATION_DEPLOYS: false as const,
  CONTROL_TOWER_RECOMMENDATION_PUBLISHES: false as const,
  CONTROL_TOWER_RECOMMENDATION_ONLY: true as const,
  COLLABORATION_WITHOUT_OPT_IN: false as const,
  COLLABORATION_OPT_IN_REQUIRED: true as const,
  ADULT_18_PLUS_REQUIRED: true as const,
  UNDER_18_ONBOARDING_ALLOWED: false as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  FULL_PRODUCTION_COMMAND_OS_SHIPPED: false as const,
  COMMAND_OS_CONTRACTS_BOUNDED: true as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  COMMAND_OS_IS_COEXISTENCE_LAYER: true as const,
  COMMAND_OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DK — XIV Unified Intelligence Experience OS + Personal/Enterprise Story Graph + Forecast & Outcome Memory Engine + Decision Journey Orchestrator + Agent Team Lifecycle Manager + Global Knowledge Collaboration Fabric + Continuous UX Optimization & Trust Center' as const;

export const GITHUB_SOT_ISSUE = 127 as const;
export const GITLAB_COORDINATION_ISSUE = 61 as const;

export const FABRICATED_RUNNING_VERIFIED_DENIED =
  'FABRICATED_RUNNING_VERIFIED_WITHOUT_HEARTBEAT_DENIED' as const;
export const SILENT_PERMISSION_INHERITANCE_DENIED =
  'SILENT_PERMISSION_INHERITANCE_DENIED' as const;
export const GUARANTEED_PREDICTION_REJECTED =
  'GUARANTEED_PREDICTION_CLAIM_REJECTED_PROBABILISTIC_ONLY' as const;
export const RAW_PRIVATE_CROSS_TENANT_DENIED =
  'RAW_PRIVATE_CROSS_TENANT_SHARE_DENIED' as const;
export const OVERNIGHT_NO_NODE =
  'OVERNIGHT_WITHOUT_POWERED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const STORYLINE_MUST_BE_PROBABILISTIC =
  'STORYLINE_CARD_MUST_REMAIN_PROBABILISTIC_AND_EVIDENCE_LINKED' as const;
export const PATTERN_CAUSATION_AUTO_PROMOTE_DENIED =
  'PATTERN_MEMORY_CANNOT_AUTO_PROMOTE_CORRELATION_TO_VERIFIED_CAUSATION' as const;
export const MARKETPLACE_LISTING_AUTHORITY_DENIED =
  'MARKETPLACE_LISTING_DOES_NOT_GRANT_CREDENTIALS_BILLING_OR_DEPLOY' as const;
export const UX_SELF_GRANT_DENIED =
  'UX_IMPROVEMENT_PROPOSAL_REVERSIBLE_CANNOT_SELF_GRANT_AUTHORITY' as const;
export const COLLABORATION_OPT_IN_DENIED =
  'COLLABORATION_WITHOUT_OPT_IN_DENIED' as const;
export const CONTROL_TOWER_ACTION_DENIED =
  'CONTROL_TOWER_RECOMMENDATION_CANNOT_CHARGE_DEPLOY_OR_PUBLISH' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SEALED_SILENT_FALLBACK_DENIED =
  'SEALED_CONTENT_SILENT_CLOUD_FALLBACK_DENIED' as const;

export const MAX_COMMAND_SURFACES = 256 as const;
export const MAX_STORYLINE_CARDS = 2048 as const;
export const MAX_PATTERN_ENTRIES = 4096 as const;
export const MAX_SCENARIOS = 2048 as const;
export const MAX_MARKETPLACE_LISTINGS = 1024 as const;
export const MAX_COLLAB_ROOMS = 1024 as const;
export const MAX_UX_PROPOSALS = 2048 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;
export const ADULT_MIN_AGE_YEARS = 18 as const;

export type DjActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'command_os_curator'
  | 'storyline_governor'
  | 'pattern_memory_governor'
  | 'control_tower_governor'
  | 'marketplace_governor'
  | 'collaboration_governor'
  | 'ux_learning_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type DjActor = {
  kind: DjActorKind;
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
  inheritedFrom?: string;
};

export type CommandSurfaceId =
  | 'command_home'
  | 'storyline_feed'
  | 'pattern_memory'
  | 'scenario_tower'
  | 'agent_team_marketplace'
  | 'collaboration_rooms'
  | 'ux_learning_fabric'
  | 'overnight_brief'
  | 'evidence_drawer';

export type RuntimeNodeStatus =
  | 'REGISTERED'
  | 'LOGICAL'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type StorylineCardLabel =
  | 'PROBABILISTIC'
  | 'LABELED_FORECAST'
  | 'LABELED_SCENARIO'
  | 'HYPOTHESIS'
  | 'EVIDENCE_LINKED';

export type PatternClaimStatus =
  | 'CORRELATION_ONLY'
  | 'HYPOTHESIS'
  | 'EVIDENCE_PENDING'
  | 'CAUSATION_CANDIDATE'
  | 'VERIFIED_CAUSATION';

export type PredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA' | 'MISSING';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
  'raw_private_payload',
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
    DI: {
      tipProbe:
        hasMod('personalized-intelligence-companion-os-types.ts') ||
        has('62L_DI_PERSONALIZED_INTELLIGENCE_COMPANION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DI_PERSONALIZED_INTELLIGENCE_COMPANION_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred DI Personalized Intelligence Companion OS tip + report. Poll with backoff when WAITING_DATA.',
    },
    DH: {
      tipProbe:
        hasMod('unified-intelligence-companion-os-types.ts') ||
        hasMod('adaptive-life-business-intelligence-os-types.ts') ||
        has('62L_DH_UNIFIED_INTELLIGENCE_COMPANION_OS_REPORT.md') ||
        has('62L_DH_ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has('62L_DH_UNIFIED_INTELLIGENCE_COMPANION_OS_REPORT.md') ||
        has('62L_DH_ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DH Unified/Adaptive Intelligence Companion OS fallback when DI absent.',
    },
    DG: {
      tipProbe:
        hasMod('universal-personal-business-ai-os-types.ts') ||
        has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DG_UNIVERSAL_PERSONAL_BUSINESS_AI_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'DG Universal Personal/Business AI OS fallback when DH absent.',
    },
    DF: {
      tipProbe:
        hasMod('human-centered-superbrain-ux-types.ts') ||
        has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DF Human-Centered Superbrain UX OS fallback (used as base tip when DI/DH/DG WAITING_DATA).',
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
      note: 'DD Cognitive Service Mesh in lineage.',
    },
    DA: {
      tipProbe:
        hasMod('superbrain-runtime-kernel-types.ts') ||
        has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DA Superbrain Runtime Kernel in lineage.',
    },
  };
}
