import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BL — Organization AI Agent Universes + Department Agent Councils
 * + Hybrid Cloud/Offline Synapse Fabric + Elite Trust Protection.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * "Gravitational pull" in routing docs/code is a **software metaphor only** —
 * routing attractors/weights for trust, latency, locality, freshness, cost,
 * and resource availability. It is NOT literal astronomy or physics gravity.
 */

export const ORG_AGENT_UNIVERSE_CYCLE = [
  'org_universe_declare',
  'department_council_bind',
  'org_memory_allocate',
  'execution_profile_select',
  'knowledge_pack_attach',
  'authority_boundary_seal',
  'synapse_route_declare',
  'route_verification',
  'attractor_score',
  'trust_before_speed',
  'failover_verified_only',
  'zero_trust_identity',
  'impersonation_guard',
  'sealed_route_deny',
  'secret_redaction',
  'defensive_leak_monitor',
  'global_ops_synapse',
  'evidence',
  'learning',
] as const;

export type BlHop = (typeof ORG_AGENT_UNIVERSE_CYCLE)[number];

export type BlEvidenceState =
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
  | 'PRODUCTION_AUTHORIZED';

export type BlHopRecord = {
  hop: BlHop;
  state: BlEvidenceState;
  summary: string;
  at: string;
};

export const BL_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  INVENTED_PASS: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  SPEED_OVERRIDES_SECURITY: false as const,
  COST_OVERRIDES_SECURITY: false as const,
  LABEL_IS_ACCESS: false as const,
  LEARNING_IS_AUTHORITY: false as const,
  RECOMMENDATION_IS_CHARGE_OR_DEPLOY: false as const,
  ORG_UNIVERSE_ISOLATION: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  CROSS_ORG_ACCESS_DEFAULT: 'DENIED' as const,
  UNVERIFIED_ROUTE_STATE: 'UNAVAILABLE' as const,
  GRAVITATIONAL_PULL_IS_LITERAL: false as const,
  GRAVITATIONAL_PULL_IS_SOFTWARE_WEIGHTS: true as const,
  CONNECT_EQUALS_SWALLOW: false as const,
  CONNECT_EQUALS_LEAK_SEALED: false as const,
  SYNAPSE_TRANSFERS_ORG_AUTHORITY: false as const,
  OFFENSIVE_LEAKAGE_TOOLS: false as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
});

export const CROSS_ORG_ACCESS_DENIED = 'CROSS_ORG_UNIVERSE_ACCESS_DENIED';
export const SEALED_ROUTE_DENIED = 'SEALED_ROUTE_DENY_BY_DEFAULT';
export const UNVERIFIED_ROUTE_UNAVAILABLE = 'UNVERIFIED_CLOUD_ROUTE_UNAVAILABLE';
export const SPEED_LOSES_TO_TRUST = 'SPEED_NEVER_OVERRIDES_SECURITY';
export const IMPERSONATION_DENIED = 'IMPERSONATION_ATTEMPT_DENIED';
export const AUTHORITY_NON_TRANSFER = 'SYNAPSE_AUTHORITY_NON_TRANSFER';
export const SEALED_NON_LEAK = 'SEALED_FOUNDER_DATA_NON_LEAK';
export const ATTRACTOR_SOFTWARE_ONLY =
  'ROUTING_ATTRACTORS_ARE_SOFTWARE_WEIGHTS_NOT_LITERAL_GRAVITY';

export const NEXT_PHASE_TITLE =
  '62L-BM — Organization Neural Federation + Cross-Universe Knowledge Exchange + Multi-Layer Synapse Expansion + Global Business Intelligence Nervous System';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

/**
 * Explicit glossary lock: "gravitational pull" / attractors are software
 * routing weights only — never literal astronomical gravity.
 */
export const GRAVITATIONAL_PULL_GLOSSARY = Object.freeze({
  metaphor: 'gravitational_pull' as const,
  meaning: 'software_routing_attractors_and_weights' as const,
  literalAstronomy: false as const,
  factors: [
    'trust',
    'latency',
    'locality',
    'freshness',
    'cost',
    'resource_availability',
  ] as const,
  securityOverrideAllowed: false as const,
  note: ATTRACTOR_SOFTWARE_ONLY,
});

export type PredecessorId =
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
  | 'AX';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  BK: 'superbrain-coexistence-coding-mesh.ts',
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
};

const PREDECESSOR_REPORTS: Record<PredecessorId, string> = {
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
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): BlEvidenceState {
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
      report: BlEvidenceState;
      path: string;
      reportFile: string;
    }
  >;
}

export type BlActorKind =
  | 'ceo_principal'
  | 'org_admin'
  | 'department_agent'
  | 'ordinary_agent'
  | 'cloud_peer'
  | 'telemetry'
  | 'global_ops_brain'
  | 'impersonator'
  | 'human_operator';

export type BlActor = {
  kind: BlActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  departmentId?: string;
  role?: string;
  /** Claimed identity for impersonation probes — never grants access. */
  claimedPrincipalId?: string;
};

export type ExecutionProfile = 'local_only' | 'hybrid_verified' | 'cloud_verified';

export type DepartmentId =
  | 'engineering'
  | 'operations'
  | 'finance'
  | 'security'
  | 'research'
  | 'customer'
  | 'executive';
