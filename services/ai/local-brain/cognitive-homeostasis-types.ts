import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BP — Superbrain Cognitive Homeostasis + Organization Digital Genome
 * Replication + Multi-Agent Skill Exchange + Resilient Edge/Cloud Brain Mesh
 * + Global Intelligence Recovery Fabric.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Homeostasis stabilizes (throttle / rebalance / quarantine / hibernate /
 * recover) — it does **not** unbounded-expand capacity or permissions.
 * Genome replication copies **approved templates only** — never secrets,
 * private data, sealed information, or authority. Skill exchange ≠ permission.
 * Offline island mode is bounded; rejoin does not auto-trust remote state.
 * DR simulation ≠ real disaster authorization.
 */

export const COGNITIVE_HOMEOSTASIS_CYCLE = [
  'metrics_sample',
  'pressure_evaluate',
  'stabilize_prefer',
  'throttle_or_hibernate',
  'rebalance_bounded',
  'quarantine_unsafe',
  'recover_verified',
  'genome_template_select',
  'genome_strip_forbidden',
  'genome_clone_isolated',
  'skill_exchange_governed',
  'skill_not_permission',
  'island_mode_enter',
  'bounded_offline_op',
  'freshness_gate',
  'mesh_failover',
  'mesh_rejoin_reconcile',
  'recovery_snapshot',
  'dr_simulation_only',
  'evidence',
  'learning',
] as const;

export type BpHop = (typeof COGNITIVE_HOMEOSTASIS_CYCLE)[number];

export type BpEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'STALE'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED';

export type BpHopRecord = {
  hop: BpHop;
  state: BpEvidenceState;
  summary: string;
  at: string;
};

export const BP_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  INVENTED_PASS: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  HOMEOSTASIS_UNBOUNDED_EXPAND: false as const,
  HOMEOSTASIS_CAN_EXPAND_L4: false as const,
  HOMEOSTASIS_CAN_EXPAND_PERMISSIONS: false as const,
  PREFER_STABILIZE_OVER_EXPAND: true as const,
  GENOME_APPROVED_TEMPLATES_ONLY: true as const,
  GENOME_SILENT_SECRET_COPY: false as const,
  GENOME_SILENT_PRIVATE_COPY: false as const,
  GENOME_SILENT_SEALED_COPY: false as const,
  GENOME_SILENT_AUTHORITY_COPY: false as const,
  CLONE_CREATES_ISOLATED_UNIVERSE: true as const,
  LABEL_IS_ACCESS: false as const,
  SKILL_EXCHANGE_IS_PERMISSION_GRANT: false as const,
  LEARNING_IS_AUTHORITY: false as const,
  OFFLINE_ISLAND_UNBOUNDED: false as const,
  REJOIN_AUTO_TRUST_REMOTE: false as const,
  DR_SIM_IS_REAL_DISASTER_AUTH: false as const,
  UNCONFIGURED_MESH_STATE: 'UNAVAILABLE' as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  PRIVACY_ABOVE_SPEED_PRICE: true as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
  MEGA_PR_SWALLOW: false as const,
});

export const HIGH_PRESSURE_THROTTLE = 'HIGH_QUEUE_PRESSURE_THROTTLE_NOT_SPAWN';
export const HIGH_PRESSURE_HIBERNATE = 'HIGH_QUEUE_PRESSURE_HIBERNATE_NOT_SPAWN';
export const HOMEOSTASIS_L4_EXPAND_DENIED = 'HOMEOSTASIS_CANNOT_EXPAND_L4';
export const HOMEOSTASIS_PERM_EXPAND_DENIED = 'HOMEOSTASIS_CANNOT_EXPAND_PERMISSIONS';
export const GENOME_SECRET_DENIED = 'GENOME_SECRET_COPY_DENIED';
export const GENOME_PRIVATE_DENIED = 'GENOME_PRIVATE_DATA_COPY_DENIED';
export const GENOME_SEALED_DENIED = 'GENOME_SEALED_INFO_COPY_DENIED';
export const GENOME_AUTHORITY_DENIED = 'GENOME_AUTHORITY_SILENT_COPY_DENIED';
export const GENOME_UNAPPROVED_DENIED = 'GENOME_UNAPPROVED_TEMPLATE_DENIED';
export const CLONE_ISOLATION = 'CLONED_UNIVERSE_ISOLATED_FROM_SOURCE_PRIVATE_MEMORY';
export const SKILL_NOT_PERMISSION = 'SKILL_EXCHANGE_IS_NOT_PERMISSION_GRANT';
export const LEARNING_NOT_AUTHORITY = 'LEARNING_IS_NOT_AUTHORITY';
export const ISLAND_BOUNDED = 'OFFLINE_ISLAND_BOUNDED_OPERATION';
export const FRESHNESS_STALE = 'FRESHNESS_SENSITIVE_STALE_OR_WAITING_DATA';
export const REJOIN_NO_AUTO_TRUST = 'REJOIN_DOES_NOT_AUTO_TRUST_UNVERIFIED_REMOTE';
export const CLOUD_MESH_UNAVAILABLE = 'UNCONFIGURED_CLOUD_MESH_ROUTE_UNAVAILABLE';
export const DR_SIM_ONLY = 'DISASTER_RECOVERY_SIMULATION_NOT_REAL_AUTHORIZATION';

export const NEXT_PHASE_TITLE =
  '62L-BQ — Superbrain Self-Healing Architecture + Organization Intelligence Cloning Lab + Multi-Agent Apprenticeship Network + Global Edge Intelligence Grid + Continuous Recovery & Resilience Engine';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export type HomeostasisMetricKey =
  | 'queuePressure'
  | 'activeAgents'
  | 'memory'
  | 'modelCalls'
  | 'network'
  | 'latency'
  | 'storage'
  | 'cost'
  | 'staleKnowledge'
  | 'conflicts'
  | 'policyIncidents';

export type HomeostasisAction =
  | 'throttle'
  | 'rebalance'
  | 'quarantine'
  | 'hibernate'
  | 'recover'
  | 'deny_expand';

export type GenomeTemplateKind =
  | 'policies'
  | 'workflows'
  | 'roles'
  | 'skills'
  | 'schemas'
  | 'knowledge_references'
  | 'operating_patterns';

export type GenomeForbiddenKind =
  | 'secrets'
  | 'private_data'
  | 'sealed_information'
  | 'authority';

export type PredecessorId =
  | 'BO'
  | 'BN'
  | 'BM'
  | 'BL'
  | 'BK'
  | 'BJ'
  | 'BI'
  | 'BH'
  | 'BG'
  | 'BF'
  | 'BE'
  | 'BD'
  | 'BB'
  | 'BA'
  | 'AZ'
  | 'AY'
  | 'AX'
  | 'AW'
  | 'AV';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  BO: 'superbrain-neuroplasticity-runtime.ts',
  BN: 'superbrain-neural-growth-runtime.ts',
  BM: 'org-neural-federation-runtime.ts',
  BL: 'org-agent-universe-runtime.ts',
  BK: 'superbrain-coexistence-runtime.ts',
  BJ: 'global-operations-brain-runtime.ts',
  BI: 'superbrain-global-ops-brain-root.ts',
  BH: 'offline-research-civilization.ts',
  BG: 'trillion-path-agent-university.ts',
  BF: 'offline-first-superintelligence-os.ts',
  BE: 'offline-superintelligence-fabric.ts',
  BD: 'cognitive-memory-runtime.ts',
  BB: 'adaptive-compute-fabric.ts',
  BA: 'neural-database-runtime.ts',
  AZ: 'sovereign-identity-kernel.ts',
  AY: 'growth-media-runtime.ts',
  AX: 'sovereign-sealed-runtime.ts',
  AW: 'universal-app-runtime.ts',
  AV: 'universal-runtime-cfo.ts',
};

const PREDECESSOR_REPORTS: Record<PredecessorId, string> = {
  BO: '62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md',
  BN: '62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md',
  BM: '62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md',
  BL: '62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md',
  BK: '62L_BK_SUPERBRAIN_COEXISTENCE_CODING_MESH_REPORT.md',
  BJ: '62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md',
  BI: '62L_BI_SUPERBRAIN_GLOBAL_OPS_BRAIN_ROOT_REPORT.md',
  BH: '62L_BH_OFFLINE_RESEARCH_CIVILIZATION_REPORT.md',
  BG: '62L_BG_TRILLION_PATH_AGENT_UNIVERSITY_REPORT.md',
  BF: '62L_BF_OFFLINE_FIRST_SUPERINTELLIGENCE_OS_REPORT.md',
  BE: '62L_BE_OFFLINE_SUPERINTELLIGENCE_FABRIC_REPORT.md',
  BD: '62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md',
  BB: '62L_BB_ADAPTIVE_COMPUTE_FABRIC_SCHEDULER_REPORT.md',
  BA: '62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md',
  AZ: '62L_AZ_SOVEREIGN_IDENTITY_KERNEL_REPORT.md',
  AY: '62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md',
  AX: '62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md',
  AW: '62L_AW_UNIVERSAL_APP_RUNTIME_BUSINESS_OS_REPORT.md',
  AV: '62L_AV_UNIVERSAL_RUNTIME_ALGORITHM_FOUNDRY_CFO_REPORT.md',
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): BpEvidenceState {
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
      report: BpEvidenceState;
      path: string;
      reportFile: string;
    }
  >;
}

export type BpActorKind =
  | 'ceo_principal'
  | 'org_admin'
  | 'department_agent'
  | 'ordinary_agent'
  | 'mesh_node'
  | 'cloud_peer'
  | 'human_operator'
  | 'recovery_operator';

export type BpActor = {
  kind: BpActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role?: string;
  permissionLevel?: number;
  authorityLevel?: number;
};
