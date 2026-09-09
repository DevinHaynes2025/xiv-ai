import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DG — XIV Universal Personal/Business AI OS + Global Life & Enterprise Command Center UX +
 * Historical World Simulation Engine + Predictive Decision Intelligence + Personal Agent Economy +
 * Multilingual Community Intelligence Network + Continuous Agent Learning & Debrief System.
 *
 * SoT: GitHub #124. GitLab #58 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Personal / Business / Dual modes with isolation boundaries.
 * Historical data: authorized + provenance-backed only.
 * Predictions remain probabilistic; forecast ≠ verified fact.
 * Quantum work needs classical baselines; no guaranteed quantum predictions.
 * Community sharing is opt-in.
 * Overnight agents require an authorized powered node; else WAITING_NODE/OFFLINE_STOPPED.
 * Agent learning cannot self-grant authority.
 * Adult 18+ where personal onboarding applies.
 * Local-first; Founder-sealed deny-by-default.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const UNIVERSAL_PERSONAL_BUSINESS_AI_OS_CYCLE = [
  'honesty_locks',
  'universal_personal_business_ai_os_bootstrap',
  'cross_mode_isolation_personal_to_business_denied',
  'cross_mode_isolation_business_to_personal_denied',
  'dual_mode_does_not_collapse_isolation',
  'under_18_personal_activation_denied',
  'unauthorized_historical_source_denied',
  'prediction_not_labeled_verified_fact',
  'quantum_without_classical_baseline_rejected',
  'community_share_without_opt_in_denied',
  'overnight_shift_without_powered_node_waiting_or_offline',
  'learning_debrief_cannot_self_grant_authority',
  'agent_economy_cannot_purchase_or_bill',
  'evidence',
  'learning',
] as const;

export type DgHop = (typeof UNIVERSAL_PERSONAL_BUSINESS_AI_OS_CYCLE)[number];

export type DgEvidenceState =
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
  | 'ISOLATION_HELD';

export type DgHopRecord = {
  hop: DgHop;
  state: DgEvidenceState;
  summary: string;
  at: string;
};

export const DG_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  UNDER_18_PERSONAL_ACTIVATION_ALLOWED: false as const,
  ADULT_18_PLUS_REQUIRED: true as const,
  CROSS_MODE_LEAK_PERSONAL_TO_BUSINESS: false as const,
  CROSS_MODE_LEAK_BUSINESS_TO_PERSONAL: false as const,
  DUAL_MODE_COLLAPSES_ISOLATION_WITHOUT_EXPLICIT_POLICY: false as const,
  MODE_ISOLATION_DEFAULT: true as const,
  UNAUTHORIZED_HISTORICAL_SOURCE: false as const,
  HISTORICAL_REQUIRES_AUTHORIZED_PROVENANCE: true as const,
  PREDICTION_LABELED_AS_VERIFIED_FACT: false as const,
  PREDICTIONS_REMAIN_PROBABILISTIC: true as const,
  FORECAST_EQ_VERIFIED_FACT: false as const,
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,
  QUANTUM_PREDICTION_GUARANTEED: false as const,
  CLASSICAL_BASELINE_REQUIRED_FOR_QUANTUM: true as const,
  COMMUNITY_SHARE_WITHOUT_OPT_IN: false as const,
  COMMUNITY_SHARING_OPT_IN_ONLY: true as const,
  OVERNIGHT_WITHOUT_POWERED_AUTHORIZED_NODE: false as const,
  OVERNIGHT_REQUIRES_AUTHORIZED_POWERED_NODE: true as const,
  LEARNING_SELF_GRANTS_AUTHORITY: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  DEBRIEF_SELF_GRANTS_AUTHORITY: false as const,
  AGENT_ECONOMY_CAN_PURCHASE: false as const,
  AGENT_ECONOMY_CAN_BILL: false as const,
  AGENT_ECONOMY_ACCOUNTING_ONLY: true as const,
  RESOURCE_ACCOUNTING_EQ_SPEND_AUTHORITY: false as const,
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
  '62L-DH — XIV Adaptive Life & Business Intelligence OS + Personalized AI Chief-of-Staff Network + Global Historical Knowledge Engine + Decision Simulation Studio + Autonomous Research/Workforce Planner + Community Collaboration Graph + Continuous UX Learning & Agent Evolution Fabric' as const;

export const GITHUB_SOT_ISSUE = 124 as const;
export const GITLAB_COORDINATION_ISSUE = 58 as const;

export const CROSS_MODE_LEAK_DENIED =
  'CROSS_MODE_PRIVATE_LEAK_DENIED_BY_DEFAULT' as const;
export const DUAL_MODE_ISOLATION_HELD =
  'DUAL_MODE_DOES_NOT_COLLAPSE_ISOLATION_WITHOUT_EXPLICIT_POLICY' as const;
export const UNDER_18_PERSONAL_ACTIVATION_DENIED =
  'UNDER_18_PERSONAL_ACTIVATION_DENIED' as const;
export const UNAUTHORIZED_HISTORICAL_SOURCE_DENIED =
  'UNAUTHORIZED_HISTORICAL_SOURCE_DENIED_PROVENANCE_REQUIRED' as const;
export const PREDICTION_NOT_VERIFIED_FACT =
  'PREDICTION_REMAINS_PROBABILISTIC_NOT_LABELED_VERIFIED_FACT' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_PATH_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const COMMUNITY_SHARE_OPT_IN_DENIED =
  'COMMUNITY_SHARE_WITHOUT_OPT_IN_DENIED' as const;
export const OVERNIGHT_WAITING_NODE = 'WAITING_NODE' as const;
export const OVERNIGHT_OFFLINE_STOPPED = 'OFFLINE_STOPPED' as const;
export const LEARNING_AUTHORITY_SELF_GRANT_DENIED =
  'LEARNING_OR_DEBRIEF_CANNOT_SELF_GRANT_AUTHORITY' as const;
export const AGENT_ECONOMY_PURCHASE_BILL_DENIED =
  'AGENT_ECONOMY_CANNOT_PURCHASE_OR_BILL_ACCOUNTING_ONLY' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;

export const MAX_COMMAND_CENTER_SURFACES = 256 as const;
export const MAX_SIMULATION_TIMELINES = 2048 as const;
export const MAX_PREDICTIVE_SCENARIOS = 2048 as const;
export const MAX_AGENT_TEAMS = 1024 as const;
export const MAX_OVERNIGHT_SHIFTS = 1024 as const;
export const MAX_COMMUNITY_SHARES = 2048 as const;
export const MAX_DEBRIEF_ENTRIES = 4096 as const;
export const ADULT_MIN_AGE_YEARS = 18 as const;

export type DgActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'universal_os_curator'
  | 'command_center_governor'
  | 'simulation_governor'
  | 'predictive_governor'
  | 'agent_economy_governor'
  | 'community_network_governor'
  | 'learning_debrief_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type DgActor = {
  kind: DgActorKind;
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
  mode?: OsMode;
};

export type OsMode = 'personal' | 'business' | 'dual';

export type IsolationBoundary = 'personal_private' | 'business_private' | 'shared_policy';

export type PredictionLabel =
  | 'LABELED_FORECAST'
  | 'LABELED_SCENARIO'
  | 'LABELED_SIMULATION'
  | 'PROBABILISTIC'
  | 'HYPOTHESIS'
  | 'CALIBRATION_PENDING';

export type OvernightShiftStatus =
  | 'SCHEDULED'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'DENIED'
  | 'COMPLETED';

export type CommandCenterSurfaceId =
  | 'life_command'
  | 'enterprise_command'
  | 'universal_search'
  | 'evidence_drawer'
  | 'mobile_first_shell'
  | 'mode_switcher'
  | 'overnight_planner'
  | 'community_discovery'
  | 'debrief_room';

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
    DF: {
      tipProbe:
        hasMod('human-centered-superbrain-ux-types.ts') ||
        has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DF_HUMAN_CENTERED_SUPERBRAIN_UX_REPORT.md') ? 'PRESENT' : 'MISSING',
      note:
        'Preferred DF Human-Centered Superbrain UX tip + report (includes DE/DD/DA lineage).',
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
      note:
        'DC Superbrain Service Fabric — parallel sibling lineage (DB→DC); not merged into DF tip.',
    },
    DB: {
      tipProbe:
        hasMod('superbrain-control-plane-types.ts') ||
        has('62L_DB_SUPERBRAIN_CONTROL_PLANE_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DB_SUPERBRAIN_CONTROL_PLANE_REPORT.md') ? 'PRESENT' : 'MISSING',
      note:
        'DB Superbrain Control Plane / Distributed Runtime Mesh — parallel sibling; prefer DF tip.',
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
