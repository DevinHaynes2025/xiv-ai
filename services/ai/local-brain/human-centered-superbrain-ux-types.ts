import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DF — XIV Human-Centered Superbrain UX OS + Global Personal Agent Workforce +
 * Historical Data Atlas & Predictive Quant Engine + Ethical Security Discovery Lab +
 * Neural Growth Ledger + Agent Meeting/Communication Fabric.
 *
 * SoT: GitHub #123. GitLab #57 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * UX contracts/screens as bounded TypeScript + docs; not full production UX shipped.
 * “Trillions of data” = corpus-scale architecture target until measured — not claimed capacity.
 * “Wormholes” = fast authorized graph/retrieval pathways — no trust/auth bypass.
 * Quantum predictions evidence-based; classical quant baselines required; no guaranteed quantum predictions.
 * Ethical hacking = defensive testing on systems XIV owns or is explicitly authorized to assess.
 * Lawful historical pathway mining only; “hidden jewel” discovery governed/authorized.
 * Predictive scenarios labeled; forecast ≠ verified fact; calibration/outcome tracking.
 * Agent growth governed; neural change ledger auditable; learning ≠ permission.
 * Adult 18+ where personal onboarding applies; Founder-sealed deny-by-default.
 * Local-first; sealed never silent cloud fallback.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const HUMAN_CENTERED_SUPERBRAIN_UX_CYCLE = [
  'honesty_locks',
  'human_centered_superbrain_ux_bootstrap',
  'under_18_onboarding_denied',
  'wormhole_cannot_bypass_sealed_auth',
  'trillion_scale_unmeasured_not_verified',
  'quantum_without_classical_baseline_rejected',
  'offensive_unauthorized_ethical_hack_denied',
  'unauthorized_historical_hidden_jewel_mining_denied',
  'forecast_scenario_not_labeled_verified_fact',
  'neural_growth_cannot_self_expand_permissions',
  'meeting_cannot_transfer_production_authority',
  'leak_sentinel_offensive_harvest_denied',
  'agent_without_heartbeat_not_running_verified',
  'evidence',
  'learning',
] as const;

export type DfHop = (typeof HUMAN_CENTERED_SUPERBRAIN_UX_CYCLE)[number];

export type DfEvidenceState =
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
  | 'DEFENSIVE_ONLY';

export type DfHopRecord = {
  hop: DfHop;
  state: DfEvidenceState;
  summary: string;
  at: string;
};

export const DF_LOCKS = Object.freeze({
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
  WORMHOLE_BYPASS_SEALED_AUTH: false as const,
  WORMHOLE_IS_AUTHORIZED_FAST_PATH_ONLY: true as const,
  TRILLION_SCALE_CLAIMED_WITHOUT_MEASUREMENT: false as const,
  TRILLION_SCALE_IS_ARCHITECTURE_TARGET_UNTIL_MEASURED: true as const,
  QUANTUM_PREDICTION_WITHOUT_CLASSICAL_BASELINE: false as const,
  QUANTUM_PREDICTION_GUARANTEED: false as const,
  CLASSICAL_QUANT_BASELINE_REQUIRED: true as const,
  OFFENSIVE_UNAUTHORIZED_ETHICAL_HACK: false as const,
  ETHICAL_SECURITY_DEFENSIVE_AUTHORIZED_ONLY: true as const,
  UNAUTHORIZED_HISTORICAL_MINING: false as const,
  UNAUTHORIZED_HIDDEN_JEWEL_DISCOVERY: false as const,
  LAWFUL_HISTORICAL_PATHWAY_MINING_ONLY: true as const,
  FORECAST_LABELED_AS_VERIFIED_FACT: false as const,
  SCENARIO_MUST_BE_LABELED: true as const,
  NEURAL_GROWTH_SELF_EXPANDS_PERMISSIONS: false as const,
  LEARNING_GRANTS_PERMISSION: false as const,
  MEETING_TRANSFERS_PRODUCTION_AUTHORITY: false as const,
  COMMUNICATION_TRANSFERS_PRODUCTION_AUTHORITY: false as const,
  LEAK_SENTINEL_OFFENSIVE_HARVEST: false as const,
  LEAK_SENTINEL_DEFENSIVE_ONLY: true as const,
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
  UX_IS_COEXISTENCE_LAYER: true as const,
  UX_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DG — XIV Universal Personal/Business AI OS + Global Life & Enterprise Command Center UX + Historical World Simulation Engine + Predictive Decision Intelligence + Personal Agent Economy + Multilingual Community Intelligence Network + Continuous Agent Learning & Debrief System' as const;

export const GITHUB_SOT_ISSUE = 123 as const;
export const GITLAB_COORDINATION_ISSUE = 57 as const;

export const UNDER_18_ONBOARDING_DENIED = 'UNDER_18_PERSONAL_ONBOARDING_DENIED' as const;
export const WORMHOLE_BYPASS_DENIED =
  'WORMHOLE_FAST_PATH_CANNOT_BYPASS_SEALED_OR_AUTH' as const;
export const TRILLION_SCALE_NOT_VERIFIED =
  'TRILLION_SCALE_CAPACITY_UNMEASURED_ARCHITECTURE_TARGET_NOT_VERIFIED' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_PREDICTION_WITHOUT_CLASSICAL_BASELINE_REJECTED_NOT_GUARANTEED' as const;
export const OFFENSIVE_ETHICAL_HACK_DENIED =
  'OFFENSIVE_UNAUTHORIZED_ETHICAL_HACK_DENIED' as const;
export const UNAUTHORIZED_HISTORICAL_MINING_DENIED =
  'UNAUTHORIZED_HISTORICAL_OR_HIDDEN_JEWEL_MINING_DENIED' as const;
export const FORECAST_NOT_VERIFIED_FACT =
  'FORECAST_OR_SCENARIO_NOT_LABELED_VERIFIED_FACT' as const;
export const NEURAL_GROWTH_PERMISSION_EXPAND_DENIED =
  'NEURAL_GROWTH_CANNOT_SELF_EXPAND_PERMISSIONS' as const;
export const MEETING_PRODUCTION_AUTHORITY_DENIED =
  'MEETING_OR_COMMUNICATION_CANNOT_TRANSFER_PRODUCTION_AUTHORITY' as const;
export const OFFENSIVE_HARVEST_DENIED =
  'LEAK_SENTINEL_OFFENSIVE_HARVEST_DENIED_DEFENSIVE_ONLY' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'AGENT_WITHOUT_HEARTBEAT_NOT_RUNNING_VERIFIED_ON_UX_WORKFORCE_SURFACE' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SEALED_SILENT_FALLBACK_DENIED =
  'SEALED_CONTENT_SILENT_CLOUD_FALLBACK_DENIED' as const;

export const MAX_UX_SCREENS = 256 as const;
export const MAX_WORKFORCE_AGENTS = 1024 as const;
export const MAX_ATLAS_PATHWAYS = 2048 as const;
export const MAX_QUANT_FORECASTS = 2048 as const;
export const MAX_SECURITY_PROBES = 512 as const;
export const MAX_NEURAL_LEDGER_ENTRIES = 4096 as const;
export const MAX_MEETINGS = 1024 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;
export const ADULT_MIN_AGE_YEARS = 18 as const;

export type DfActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'ux_os_curator'
  | 'workforce_governor'
  | 'atlas_quant_governor'
  | 'ethical_security_governor'
  | 'neural_growth_governor'
  | 'meeting_fabric_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type DfActor = {
  kind: DfActorKind;
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
};

export type UxScreenId =
  | 'onboarding'
  | 'home_today'
  | 'agent_workforce'
  | 'overnight_brief'
  | 'evidence_drawer'
  | 'predictive_scenario'
  | 'community_expert'
  | 'agent_team_room'
  | 'localization';

export type UniverseKind = 'personal' | 'business';

export type WorkforceAgentStatus =
  | 'REGISTERED'
  | 'LOGICAL'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type ForecastLabel =
  | 'LABELED_FORECAST'
  | 'LABELED_SCENARIO'
  | 'LABELED_SIMULATION'
  | 'HYPOTHESIS'
  | 'CALIBRATION_PENDING';

export type SecurityProbeMode =
  | 'defensive_authorized'
  | 'offensive_unauthorized'
  | 'hidden_jewel_authorized'
  | 'hidden_jewel_unauthorized';

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
    DE: {
      tipProbe:
        hasMod('knowledge-exchange-gateway-marketplace-types.ts') ||
        has('62L_DE_KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DE_KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred DE Knowledge Exchange Gateway Marketplace tip + report. Poll with backoff when WAITING_DATA.',
    },
    DD: {
      tipProbe:
        hasMod('cognitive-service-mesh-types.ts') ||
        has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DD Cognitive Service Mesh fallback when DE absent.',
    },
    DC: {
      tipProbe:
        hasMod('superbrain-service-fabric-types.ts') ||
        has('62L_DC_SUPERBRAIN_SERVICE_FABRIC_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DC_SUPERBRAIN_SERVICE_FABRIC_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DC Superbrain Service Fabric fallback when DD absent.',
    },
    DB: {
      tipProbe:
        hasMod('superbrain-control-plane-types.ts') ||
        has('62L_DB_SUPERBRAIN_CONTROL_PLANE_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DB_SUPERBRAIN_CONTROL_PLANE_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DB Superbrain Control Plane fallback when DC absent.',
    },
    DA: {
      tipProbe:
        hasMod('superbrain-runtime-kernel-types.ts') ||
        has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DA Superbrain Runtime Kernel fallback when DB absent.',
    },
    CZ: {
      tipProbe:
        hasMod('intelligence-civilization-kernel-types.ts') ||
        has('62L_CZ_INTELLIGENCE_CIVILIZATION_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CZ_INTELLIGENCE_CIVILIZATION_KERNEL_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CZ Intelligence Civilization Kernel fallback when DA absent.',
    },
    CY: {
      tipProbe:
        hasMod('knowledge-colony-operating-system-types.ts') ||
        has('62L_CY_KNOWLEDGE_COLONY_OPERATING_SYSTEM_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CY_KNOWLEDGE_COLONY_OPERATING_SYSTEM_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CY Knowledge Colony OS sealed tip used when DE/DD/DC/DB/DA/CZ WAITING_DATA.',
    },
  };
}
