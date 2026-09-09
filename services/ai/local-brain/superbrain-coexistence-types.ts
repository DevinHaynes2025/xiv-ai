import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BK — Superbrain Coexistence Fabric + Multi-Environment Coding Mesh
 * + Agent Branching Orchestrator + Cross-Platform Execution Contracts.
 *
 * SoT: GitHub #75. GitLab #9 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * Global Operations Brain / Superbrain is the root. Specialized systems coexist
 * as branches — they are not swallowed into one mega-blob.
 */

export const SUPERBRAIN_COEXISTENCE_CYCLE = [
  'superbrain_root_declare',
  'coexistence_registry_bind',
  'specialized_branch_register',
  'swallow_guard',
  'work_envelope_validate',
  'environment_mesh_probe',
  'founder_goal_gate',
  'agent_select',
  'file_conflict_detect',
  'dispatch_or_deny',
  'workcell_collect',
  'reconcile_before_integrate',
  'integration_candidate_gate',
  'authority_non_transfer',
  'universe_isolation',
  'execution_contract_seal',
  'evidence',
  'learning',
] as const;

export type BkHop = (typeof SUPERBRAIN_COEXISTENCE_CYCLE)[number];

export type BkEvidenceState =
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
  | 'AVAILABLE'
  | 'NOT_APPLIED';

export type BkHopRecord = {
  hop: BkHop;
  state: BkEvidenceState;
  summary: string;
  at: string;
};

export const BK_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  INVENTED_PASS: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  DRAFT_PR: false as const,
  SWALLOW_SPECIALIZED_BRANCHES: false as const,
  AUTHORITY_TRANSFER_BETWEEN_AGENTS: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  UNIVERSE_ISOLATION: true as const,
  UNCONFIGURED_ENV_IS_UNAVAILABLE: true as const,
  BRANCH_IS_NOT_PRODUCTION_DEPLOY: true as const,
  WORKCELL_IS_NOT_PRODUCTION_DEPLOY: true as const,
  RECOMMENDATION_IS_NOT_CHARGE: true as const,
  LEARNING_IS_NOT_PERMISSION_GRANT: true as const,
  INTEGRATION_WITHOUT_RECONCILE: false as const,
  DISPATCH_WITHOUT_CONFLICT_SCAN: false as const,
  DISPATCH_NON_FOUNDER_APPROVED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
});

/** Specialized systems that coexist under Superbrain root (not swallowed). */
export const SPECIALIZED_COEXISTENCE_BRANCHES = [
  'enterprise_operating_system',
  'development_control_plane',
  'distributed_runtime_fabric',
  'agent_civilization_foundation',
  'ai_engineering_civilization',
  'platform_intelligence_layer',
  'local_brain',
  'research_civilization',
  'future_environments',
] as const;

export type SpecializedBranchId = (typeof SPECIALIZED_COEXISTENCE_BRANCHES)[number];

export const CODING_MESH_ENVIRONMENTS = [
  'cursor_local_workcell',
  'github',
  'gitlab',
  'supabase_development_candidate',
  'local_models',
  'cloud_sandboxes',
  'future_ai_provider_adapters',
] as const;

export type CodingMeshEnvironmentId = (typeof CODING_MESH_ENVIRONMENTS)[number];

export type EnvironmentAvailability =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'DENIED';

export type EnvironmentProbe = {
  id: CodingMeshEnvironmentId;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  state: EnvironmentAvailability;
  reason: string;
};

export type ExecutionContractStatus =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'DENIED'
  | 'COLLECTED'
  | 'RECONCILED'
  | 'INTEGRATION_CANDIDATE'
  | 'NOT_INTEGRATION_CANDIDATE';

export const SWALLOW_DENIED = 'SPECIALIZED_BRANCH_SWALLOW_DENIED';
export const CONFLICT_DISPATCH_BLOCKED = 'FILE_CONFLICT_DISPATCH_BLOCKED';
export const NON_FOUNDER_GOAL_DENIED = 'NON_FOUNDER_APPROVED_GOAL_DENIED';
export const RECONCILE_REQUIRED = 'RECONCILE_REQUIRED_BEFORE_INTEGRATION_CANDIDATE';
export const UNAUTHORIZED_DISPATCH_DENIED = 'UNAUTHORIZED_DISPATCH_DENIED';
export const AUTHORITY_TRANSFER_DENIED = 'AUTHORITY_TRANSFER_BETWEEN_AGENTS_DENIED';
export const ENV_UNAVAILABLE_UNTIL_CAV = 'ENVIRONMENT_UNAVAILABLE_UNTIL_CONFIGURED_AUTHORIZED_VERIFIED';
export const DB_CANDIDATE_NOT_APPLIED = 'DB_CANDIDATE_NOT_APPLIED';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const NEXT_PHASE_TITLE =
  '62L-BL — Superbrain Synapse Network + Cross-Agent Shared Memory + Multi-Environment Continuous Learning + Global Coding Civilization';

export const GITHUB_SOT_ISSUE = 75 as const;
export const GITLAB_COORDINATION_ISSUE = 9 as const;

export type PredecessorId =
  | 'BJ'
  | 'BI'
  | 'BH'
  | 'BG'
  | 'BF'
  | 'BE'
  | 'BD'
  | 'BB'
  | 'BA'
  | 'AY'
  | 'AX'
  | 'AW'
  | 'AV';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  BJ: 'offline-intelligence-os-exec-cortex.ts',
  BI: 'enterprise-os-dev-control-plane.ts',
  BH: 'offline-research-civilization.ts',
  BG: 'trillion-path-runtime.ts',
  BF: 'agent-civilization-foundation.ts',
  BE: 'distributed-runtime-fabric.ts',
  BD: 'cognitive-memory-runtime.ts',
  BB: 'adaptive-compute-runtime.ts',
  BA: 'neural-database-runtime.ts',
  AY: 'growth-media-runtime.ts',
  AX: 'sovereign-sealed-runtime.ts',
  AW: 'universal-app-runtime.ts',
  AV: 'universal-runtime.ts',
};

const PREDECESSOR_REPORTS: Record<PredecessorId, string> = {
  BJ: '62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md',
  BI: '62L_BI_ENTERPRISE_OS_DEV_CONTROL_PLANE_REPORT.md',
  BH: '62L_BH_OFFLINE_RESEARCH_CIVILIZATION_REPORT.md',
  BG: '62L_BG_TRILLION_PATH_AGENT_UNIVERSITY_REPORT.md',
  BF: '62L_BF_AGENT_CIVILIZATION_FOUNDATION_REPORT.md',
  BE: '62L_BE_DISTRIBUTED_RUNTIME_FABRIC_REPORT.md',
  BD: '62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md',
  BB: '62L_BB_ADAPTIVE_COMPUTE_FABRIC_SCHEDULER_REPORT.md',
  BA: '62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md',
  AY: '62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md',
  AX: '62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md',
  AW: '62L_AW_UNIVERSAL_APP_RUNTIME_BUSINESS_OS_REPORT.md',
  AV: '62L_AV_UNIVERSAL_RUNTIME_ALGORITHM_FOUNDRY_CFO_REPORT.md',
};

/**
 * BJ ~191K Brain change-set gate: never swallow unsafe bulk.
 * Prefer coexistence adapters over mega-merges. Classify inherited deltas;
 * stop if attribution is unsafe.
 */
export const BJ_191K_GATE = Object.freeze({
  maxUnsafeBulkLines: 191_000,
  preferCoexistenceAdapters: true as const,
  megaMergeAllowed: false as const,
  swallowUnsafeBulk: false as const,
  stopIfAttributionUnsafe: true as const,
  statusWhenBjAbsent: 'WAITING_DATA' as const,
  note:
    'Respect BJ ~191K Brain change-set gate: do not swallow unsafe bulk; prefer coexistence adapters; classify large inherited deltas; stop if attribution unsafe.',
});

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): BkEvidenceState {
  return existsSync(join(cwd, 'docs', 'operations', PREDECESSOR_REPORTS[id]))
    ? 'PASS'
    : 'WAITING_DATA';
}

export function predecessorMap(cwd = process.cwd()) {
  const ids = Object.keys(PREDECESSOR_MODULES) as PredecessorId[];
  return Object.fromEntries(
    ids.map((id) => [
      id,
      {
        module: predecessorModuleState(id),
        report: predecessorReportState(cwd, id),
        path: PREDECESSOR_MODULES[id],
        reportFile: PREDECESSOR_REPORTS[id],
      },
    ]),
  ) as Record<
    PredecessorId,
    {
      module: 'AVAILABLE' | 'WAITING_DATA';
      report: BkEvidenceState;
      path: string;
      reportFile: string;
    }
  >;
}

export function bj191kGateStatus(cwd = process.cwd()): {
  bjReport: BkEvidenceState;
  bjModule: 'AVAILABLE' | 'WAITING_DATA';
  swallowUnsafeBulk: false;
  megaMergeAllowed: false;
  classification: string;
} {
  return {
    bjReport: predecessorReportState(cwd, 'BJ'),
    bjModule: predecessorModuleState('BJ'),
    swallowUnsafeBulk: false,
    megaMergeAllowed: false,
    classification:
      predecessorReportState(cwd, 'BJ') === 'WAITING_DATA'
        ? 'BJ tip/report absent — 191K gate WAITING_DATA; no bulk inherited; coexistence adapters only'
        : 'BJ present — classify inherited delta before any adapter; never mega-merge',
  };
}

export type BkActorKind =
  | 'founder'
  | 'ceo_principal'
  | 'ordinary_agent'
  | 'specialized_agent'
  | 'orchestrator'
  | 'human_operator'
  | 'cloud_peer'
  | 'tool';

export type BkActor = {
  kind: BkActorKind;
  id: string;
  tenantId: string;
  universeId: string;
  role?: string;
  authorityLevel?: number;
};

export type FounderGoal = {
  id: string;
  title: string;
  description: string;
  founderApproved: boolean;
  tenantId: string;
  universeId: string;
  requestedFiles?: string[];
  preferredEnvironments?: CodingMeshEnvironmentId[];
  preferredAgents?: string[];
};
