import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BJ — Global Operations Brain root contracts.
 *
 * Architectural home connecting Memory Cortex → Knowledge Atlas → Offline World Model →
 * Agent Civilization → Agent University → Neural Bus → Research Civilization →
 * Discovery Foundry → Business/Industry Intelligence → Security & Guardian →
 * Executive Cortex → Local/Edge/Cloud Runtime.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Integration façade — not a license to merge the ~191K main-vs-xiv-v2 mega-delta.
 */

export const GLOBAL_OPERATIONS_BRAIN_CYCLE = [
  'subsystem_register',
  'memory_cortex_bind',
  'knowledge_atlas_bind',
  'offline_world_model_bind',
  'agent_civilization_bind',
  'agent_university_bind',
  'neural_bus_bind',
  'research_civilization_bind',
  'discovery_foundry_bind',
  'business_intelligence_bind',
  'security_guardian_bind',
  'executive_cortex_deliberate',
  'workforce_schedule',
  'world_twin_scenario',
  'decision_outcome_learn',
  'control_tower_observe',
  'runtime_local_edge_cloud',
  'authority_human_gate',
  'evidence',
  'honesty_locks',
] as const;

export type BjHop = (typeof GLOBAL_OPERATIONS_BRAIN_CYCLE)[number];

export type BjEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'ATTRIBUTION_UNSAFE';

export type BjHopRecord = {
  hop: BjHop;
  state: BjEvidenceState;
  summary: string;
  at: string;
};

export const BJ_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  AUTO_PERMISSION_EXPANSION: false as const,
  FOUNDER_IMPERSONATION: false as const,
  DIGITAL_TWIN_IS_FOUNDER: false as const,
  RECOMMENDATION_IS_CHARGE_OR_DEPLOY: false as const,
  LEARNING_IS_PERMISSION_GRANT: false as const,
  SIMULATION_IS_VERIFIED_FACT: false as const,
  FORECAST_IS_FACT: false as const,
  AUTHORITY_TRANSFER: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  UNIVERSE_ISOLATION: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-BK — Global Brain Synapse Engine + Continuous Offline Learning + Predictive Business Intelligence + Multi-Universe Strategy Simulator' as const;

/** Subsystem ids registered under the Global Operations Brain root. */
export const BRAIN_SUBSYSTEMS = [
  'memory_cortex',
  'knowledge_atlas',
  'offline_world_model',
  'agent_civilization',
  'agent_university',
  'neural_bus',
  'research_civilization',
  'discovery_foundry',
  'business_industry_intelligence',
  'security_guardian',
  'executive_cortex',
  'local_edge_cloud_runtime',
  'workforce_scheduler',
  'business_world_simulation',
  'decision_outcome_learning',
  'executive_control_tower',
] as const;

export type BrainSubsystemId = (typeof BRAIN_SUBSYSTEMS)[number];

export type BrainSubsystemStatus = {
  id: BrainSubsystemId;
  binding: 'wired' | 'probe_only' | 'waiting_data' | 'denied';
  moduleHint: string;
  productionAuthorization: false;
};

export type BjActor = {
  kind: 'human_founder' | 'human_executive' | 'specialized_agent' | 'digital_twin' | 'control_tower';
  id: string;
  tenantId: string;
  universeId: string;
  role?: string;
  authorityLevel?: number;
};

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()) {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  return {
    BI: {
      tipProbe: 'WAITING_DATA' as const,
      report: has('62L_BI_GOVERNED_DISCOVERY_FOUNDRY_REPORT.md') ? ('PRESENT' as const) : ('MISSING' as const),
      note: 'Preferred BI tip cursor/62l-bi-governed-discovery-foundry-4059 absent on origin after fetch.',
    },
    BH: {
      tipProbe: 'WAITING_DATA' as const,
      report: has('62L_BH_OFFLINE_RESEARCH_CIVILIZATION_REPORT.md') ? ('PRESENT' as const) : ('MISSING' as const),
      note: 'Preferred BH tip absent as distinct pushed work; local park tip equals BD.',
    },
    BG: {
      tipProbe: 'WAITING_DATA' as const,
      report: has('62L_BG_TRILLION_PATH_AGENT_UNIVERSITY_REPORT.md') ? ('PRESENT' as const) : ('MISSING' as const),
      note: 'Preferred BG tip absent as distinct pushed work; local park tip equals BA.',
    },
    BF: { tipProbe: 'WAITING_DATA' as const, report: 'MISSING' as const, note: 'BF tip not on origin.' },
    BE: { tipProbe: 'WAITING_DATA' as const, report: 'MISSING' as const, note: 'BE tip not on origin.' },
    BD: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md') ? ('PRESENT' as const) : ('MISSING' as const),
      note: 'Used as BJ base tip (latest pushed predecessor with report).',
    },
    BB: {
      tipProbe: 'WAITING_DATA' as const,
      report: has('62L_BB_ADAPTIVE_COMPUTE_FABRIC_SCHEDULER_REPORT.md') ? ('PRESENT' as const) : ('MISSING' as const),
      note: 'BB local park exists but not on origin; not merged into BJ tip.',
    },
    BA: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md') ? ('PRESENT' as const) : ('MISSING' as const),
      note: 'BA ancestor of BD.',
    },
    AY: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'AY ancestor.',
    },
    AX: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md') ? ('PRESENT' as const) : ('MISSING' as const),
      note: 'AX ancestor.',
    },
  };
}

export function githubIssueSot() {
  return {
    githubIssue: 74,
    githubRole: 'implementation_source_of_truth' as const,
    gitlabIssue: 8,
    gitlabRole: 'coordination_only' as const,
    note: 'GitHub #74 is SoT; GitLab #8 is coordination only. Issue API may be unreadable (403).',
  };
}
