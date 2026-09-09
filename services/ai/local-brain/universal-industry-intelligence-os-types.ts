import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DU — XIV Universal Industry Intelligence OS + Supply Chain & Chip Knowledge Grid +
 * Data Control Tower + Consent-Based Identity/Voice Layer + Adult Community Universes +
 * Wellness/Wealth Copilot + Digital DNA Knowledge Graph +
 * Cross-Device Quantum-Inspired Agent Runtime.
 *
 * SoT: GitHub #138. GitLab #72 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire DT / DS / DR when PRESENT.
 * Recommendation ≠ charge / deploy / spend / sign / publish / diagnose / trade / transfer.
 * Biometric (face/voice identity/gaze) disabled by default; opt-in; local preferred; revocable.
 * Adult community Universes: lawful 18+ only; no minors; no non-consensual imagery.
 * Digital DNA = licensed reusable patterns — not unauthorized cloning of people/IP.
 * Parallel Universe = isolated workspace/simulation branches — not literal alternate realities.
 * Time travel = historical reconstruction + counterfactual analysis — not literal time travel.
 * Quantum-inspired ≠ physical quantum computer; classical baselines required.
 * Supply chain / WMS/TMS / hospital logistics = planning/intelligence with human gates.
 * Chip/capability mapping ≠ remote control of physical fabs/devices without authorized runtime.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Offline: WAITING_NODE / OFFLINE_STOPPED when no powered authorized node.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR / no prod deploy / no public launch.
 */

export const UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_CYCLE = [
  'honesty_locks',
  'universal_industry_intelligence_os_bootstrap',
  // A — Universal Industry Intelligence OS
  'industry_plan_neq_physical_control',
  'hospital_logistics_requires_human_gate',
  'unconfigured_industry_provider_unavailable',
  // B — Supply Chain & Chip Knowledge Grid
  'unauthorized_chip_source_denied',
  'chip_mapping_neq_fab_remote_control',
  // C — Data Control Tower
  'data_tower_deny_by_default',
  'label_alone_neq_data_access',
  // D — Consent-Based Identity/Voice Layer
  'biometric_defaults_off',
  'surveillance_profiling_denied',
  'voice_identity_requires_opt_in',
  // E — Adult Community Universes
  'minor_universe_access_denied',
  'non_consensual_imagery_denied',
  'adult_age_gate_required',
  // F — Wellness/Wealth Copilot
  'wellness_recommend_neq_diagnose',
  'wealth_recommend_neq_trade_or_transfer',
  // G — Digital DNA Knowledge Graph
  'digital_dna_neq_cloning',
  'learning_neq_permission_grant',
  // H — Cross-Device Quantum-Inspired Agent Runtime
  'sim_neq_verified_fact',
  'quantum_inspired_requires_classical_baseline',
  'parallel_universe_is_isolated_sim_branch',
  'time_travel_is_reconstruction_not_literal',
  'offline_without_powered_node_waiting_or_stopped',
  'digital_twin_neq_founder',
  'evidence',
  'learning',
] as const;

export type DuHop = (typeof UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_CYCLE)[number];

export type DuEvidenceState =
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
  | 'LABELED_COUNTERFACTUAL'
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
  | 'CORRELATION_ONLY'
  | 'OPT_IN_REQUIRED'
  | 'REVOKED';

export type DuHopRecord = {
  hop: DuHop;
  state: DuEvidenceState;
  summary: string;
  at: string;
};

export type DuActorKind =
  | 'industry_os_curator'
  | 'supply_chain_analyst'
  | 'chip_grid_analyst'
  | 'data_tower_operator'
  | 'identity_voice_steward'
  | 'adult_universe_moderator'
  | 'wellness_wealth_copilot'
  | 'digital_dna_curator'
  | 'quantum_inspired_runtime_operator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type DuActor = {
  kind: DuActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 138;
export const GITLAB_COORDINATION_ISSUE = 72;

export const NEXT_PHASE_TITLE =
  '62L-DV — XIV Universal Data & Industry Cortex + Supply Chain Digital Twin Network + Semiconductor Intelligence Brain + Personal Data Vault & Search OS + Multimodal Voice/Vision Command Center + Adult Trust-Circle Social Fabric + Historical Simulation Engine + Cross-Device Agent Superhighway';

export const DU_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_INDUSTRY_OS_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_PHYSICAL_CONTROL: false as const,
  RECOMMENDATION_EQ_DIAGNOSE: false as const,
  RECOMMENDATION_EQ_TRADE: false as const,
  RECOMMENDATION_EQ_TRANSFER: false as const,
  INDUSTRY_PLAN_EQ_PHYSICAL_CONTROL: false as const,
  CHIP_MAPPING_EQ_FAB_REMOTE_CONTROL: false as const,
  BIOMETRIC_DEFAULT_ENABLED: false as const,
  FACE_IDENTITY_DEFAULT_ON: false as const,
  VOICE_IDENTITY_DEFAULT_ON: false as const,
  GAZE_TRACKING_DEFAULT_ON: false as const,
  PUBLIC_SURVEILLANCE_ALLOWED: false as const,
  DEMOGRAPHIC_PROFILING_ALLOWED: false as const,
  COVERT_EMOTION_DETECTION_ALLOWED: false as const,
  CROSS_CONTEXT_BIOMETRIC_TRACKING: false as const,
  MINORS_IN_ADULT_UNIVERSES: false as const,
  NON_CONSENSUAL_IMAGERY_ALLOWED: false as const,
  DIGITAL_DNA_EQ_CLONING: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  SIM_EQ_VERIFIED_FACT: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM: false as const,
  QUANTUM_SUPREMACY_CLAIMED: false as const,
  PARALLEL_UNIVERSE_LITERAL: false as const,
  TIME_TRAVEL_LITERAL: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  UNAUTHORIZED_DATA_USE: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
});

export const INDUSTRY_PLAN_NEQ_CONTROL = 'INDUSTRY_PLAN_NEQ_PHYSICAL_CONTROL';
export const HOSPITAL_HUMAN_GATE_REQUIRED = 'HOSPITAL_LOGISTICS_REQUIRES_HUMAN_GATE';
export const UNCONFIGURED_INDUSTRY_PROVIDER = 'UNCONFIGURED_INDUSTRY_PROVIDER_UNAVAILABLE';
export const UNAUTHORIZED_CHIP_SOURCE = 'UNAUTHORIZED_CHIP_SOURCE_DENIED';
export const CHIP_NEQ_FAB_CONTROL = 'CHIP_MAPPING_NEQ_FAB_REMOTE_CONTROL';
export const DATA_TOWER_DENIED = 'DATA_TOWER_DENY_BY_DEFAULT';
export const LABEL_NEQ_DATA_ACCESS = 'LABEL_ALONE_NEQ_DATA_ACCESS';
export const BIOMETRIC_DEFAULTS_OFF = 'BIOMETRIC_DEFAULTS_OFF';
export const SURVEILLANCE_PROFILING_DENIED = 'SURVEILLANCE_PROFILING_DENIED';
export const VOICE_OPT_IN_REQUIRED = 'VOICE_IDENTITY_REQUIRES_OPT_IN';
export const MINOR_ACCESS_DENIED = 'MINOR_UNIVERSE_ACCESS_DENIED';
export const NON_CONSENSUAL_DENIED = 'NON_CONSENSUAL_IMAGERY_DENIED';
export const ADULT_AGE_GATE_REQUIRED = 'ADULT_AGE_GATE_REQUIRED';
export const WELLNESS_NEQ_DIAGNOSE = 'WELLNESS_RECOMMEND_NEQ_DIAGNOSE';
export const WEALTH_NEQ_TRADE_TRANSFER = 'WEALTH_RECOMMEND_NEQ_TRADE_OR_TRANSFER';
export const DIGITAL_DNA_NEQ_CLONING = 'DIGITAL_DNA_NEQ_CLONING';
export const LEARNING_NEQ_PERMISSION = 'LEARNING_NEQ_PERMISSION_GRANT';
export const SIM_NEQ_FACT = 'SIM_NEQ_VERIFIED_FACT';
export const QUANTUM_CLASSICAL_BASELINE = 'QUANTUM_INSPIRED_REQUIRES_CLASSICAL_BASELINE';
export const PARALLEL_UNIVERSE_SIM = 'PARALLEL_UNIVERSE_IS_ISOLATED_SIM_BRANCH';
export const TIME_TRAVEL_RECONSTRUCTION = 'TIME_TRAVEL_IS_RECONSTRUCTION_NOT_LITERAL';
export const OFFLINE_WAITING_OR_STOPPED = 'OFFLINE_WITHOUT_POWERED_NODE_WAITING_OR_STOPPED';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';

export const MAX_INDUSTRY_PLANS = 500;
export const MAX_CHIP_MAPPINGS = 500;
export const MAX_DATA_TOWER_NODES = 500;
export const MAX_IDENTITY_CONSENTS = 500;
export const MAX_ADULT_UNIVERSE_EVENTS = 500;
export const MAX_COPILOT_RECS = 500;
export const MAX_DNA_PATTERNS = 2000;
export const MAX_RUNTIME_SESSIONS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: DuActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type DuPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(repoRoot?: string): Record<string, DuPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));

  return {
    DT: {
      tipProbe:
        has(brain, 'growth-operating-system-types.ts') ||
        has(brain, 'growth-operating-system.ts') ||
        has(ops, '62L_DT_GROWTH_OPERATING_SYSTEM_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has(ops, '62L_DT_GROWTH_OPERATING_SYSTEM_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'Preferred DT Growth Operating System tip + report.',
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
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DT' | 'DS' | 'DR' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DT', 'DS', 'DR'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const ARCHITECTURE_TRANSLATIONS = Object.freeze({
  parallelUniverse:
    'Isolated workspace/simulation branches — not literal alternate realities.',
  timeTravel:
    'Historical reconstruction + counterfactual analysis — not literal time travel.',
  digitalDna:
    'Reusable licensed software/knowledge/workflow patterns — not unauthorized cloning of people/IP.',
  quantumInspired:
    'Classical algorithms inspired by quantum metaphors — not a physical quantum computer; no unverified quantum supremacy claims; classical baselines required.',
});

export const PRODUCT_PHILOSOPHY = Object.freeze({
  specializedGovernedAgents: true,
  humanGatesOnPhysicalLogistics: true,
  denyByDefaultDataAccess: true,
  biometricOptInLocalRevocable: true,
  adultUniversesLawfulConsentOnly: true,
  wellnessWealthRecommendOnly: true,
  licensedDigitalDnaOnly: true,
  classicalBaselinesForQuantumAdjacent: true,
  offlineHonestWaitingOrStopped: true,
});
