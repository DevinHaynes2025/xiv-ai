import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BM — Organization Neural Federation + Cross-Universe Knowledge Exchange
 * + Multi-Layer Synapse Expansion + Global Business Intelligence Nervous System.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Raw private company data is NOT globally pooled by default.
 * Exchange covers approved derived knowledge products / benchmarks / signals /
 * lessons only, via explicit synapse contracts.
 * More “neurons/layers” = sparse logical graph nodes, routes, indexes,
 * workcells, pathways with resource controls — NOT uncontrolled live process spawn.
 */

export const ORG_NEURAL_FEDERATION_CYCLE = [
  'federation_declare',
  'member_universe_bind',
  'private_boundary_seal',
  'authority_boundary_seal',
  'synapse_contract_declare',
  'derived_product_classify',
  'raw_private_deny',
  'knowledge_exchange',
  'layer_expand_sparse',
  'resource_bound_enforce',
  'bi_node_index',
  'pathway_route',
  'forecast_label',
  'anomaly_label',
  'executive_decision_support',
  'founder_sealed_deny',
  'evidence',
  'learning',
] as const;

export type BmHop = (typeof ORG_NEURAL_FEDERATION_CYCLE)[number];

export type BmEvidenceState =
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

export type BmHopRecord = {
  hop: BmHop;
  state: BmEvidenceState;
  summary: string;
  at: string;
};

export const BM_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  INVENTED_PASS: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  SPEED_OVERRIDES_SECURITY: false as const,
  RAW_PRIVATE_GLOBAL_POOL_DEFAULT: false as const,
  RAW_PRIVATE_EXCHANGE_DEFAULT: 'DENIED' as const,
  DERIVED_ONLY_VIA_EXPLICIT_CONTRACT: true as const,
  ORG_PRIVATE_DATA_PRESERVED: true as const,
  AUTHORITY_BOUNDARIES_PRESERVED: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FEDERATION_TRANSFERS_ORG_AUTHORITY: false as const,
  LEARNING_IS_AUTHORITY: false as const,
  RECOMMENDATION_IS_CHARGE_OR_DEPLOY: false as const,
  FORECAST_IS_VERIFIED_FACT: false as const,
  ANOMALY_IS_VERIFIED_FACT: false as const,
  NEURONS_ARE_LIVE_PROCESS_SPAWN: false as const,
  NEURONS_ARE_SPARSE_LOGICAL_NODES: true as const,
  UNBOUNDED_LAYER_EXPANSION: false as const,
  UNCONFIGURED_ROUTE_STATE: 'UNAVAILABLE' as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  DB_CANDIDATES_APPLIED: false as const,
});

export const RAW_PRIVATE_EXCHANGE_DENIED = 'RAW_PRIVATE_COMPANY_DATA_EXCHANGE_DENIED';
export const DERIVED_CONTRACT_REQUIRED = 'DERIVED_KNOWLEDGE_REQUIRES_EXPLICIT_SYNAPSE_CONTRACT';
export const AUTHORITY_NON_TRANSFER = 'FEDERATION_SYNAPSE_AUTHORITY_NON_TRANSFER';
export const FOUNDER_SEALED_DENIED = 'FOUNDER_SEALED_DENY_BY_DEFAULT_FROM_ORG_FEDERATION';
export const LAYER_RESOURCE_BOUND = 'SPARSE_LAYER_EXPANSION_RESOURCE_BOUNDS';
export const FORECAST_NON_VERIFIED = 'FORECAST_LABELED_NON_VERIFIED';
export const ANOMALY_NON_VERIFIED = 'ANOMALY_LABELED_NON_VERIFIED';
export const UNBOUNDED_SPAWN_DENIED = 'UNBOUNDED_PROCESS_SPAWN_DENIED';

export const NEXT_PHASE_TITLE =
  '62L-BN — Superbrain Neural Growth Engine + Organization Agent Factory + Dynamic Department Creation + Global Knowledge Circulation + Offline/Cloud Intelligence Metabolism';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

/** Approved derived knowledge product kinds — never raw private dumps. */
export const APPROVED_DERIVED_KINDS = [
  'derived_knowledge_product',
  'benchmark',
  'signal',
  'lesson',
  'aggregate_metric',
  'industry_insight',
] as const;

export type ApprovedDerivedKind = (typeof APPROVED_DERIVED_KINDS)[number];

export type DeniedExchangeKind =
  | 'raw_private_company_data'
  | 'raw_pool'
  | 'raw_export'
  | 'private_dump'
  | 'authority_transfer'
  | 'founder_sealed_export';

export type BiDomain =
  | 'supply_chain'
  | 'finance_operations'
  | 'security'
  | 'industry_intelligence'
  | 'opportunities'
  | 'risks'
  | 'anomalies'
  | 'forecasts'
  | 'executive_decision_support';

export const BI_DOMAINS: readonly BiDomain[] = [
  'supply_chain',
  'finance_operations',
  'security',
  'industry_intelligence',
  'opportunities',
  'risks',
  'anomalies',
  'forecasts',
  'executive_decision_support',
] as const;

/** Sparse resource bounds — logical nodes only, not OS process spawn. */
export const SPARSE_BOUNDS = Object.freeze({
  maxFederationMembers: 64,
  maxSynapseContracts: 256,
  maxLayers: 8,
  maxNodesPerLayer: 48,
  maxActiveWorkcells: 32,
  maxPathways: 128,
  maxLiveProcessSpawn: 0,
});

export type PredecessorId =
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
  | 'AX';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  BL: 'org-agent-universe-runtime.ts',
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
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): BmEvidenceState {
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
      report: BmEvidenceState;
      path: string;
      reportFile: string;
    }
  >;
}

export type BmActorKind =
  | 'ceo_principal'
  | 'org_admin'
  | 'federation_operator'
  | 'department_agent'
  | 'ordinary_agent'
  | 'cloud_peer'
  | 'telemetry'
  | 'global_ops_brain'
  | 'impersonator'
  | 'human_operator';

export type BmActor = {
  kind: BmActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  federationId?: string;
  departmentId?: string;
  role?: string;
  claimedPrincipalId?: string;
};
