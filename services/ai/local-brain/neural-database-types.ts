import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Operating loop for Neural Database OS + schema/index compiler + warehouse + UDA. */
export const NEURAL_DATABASE_CYCLE = [
  'workload_classify',
  'schema_compile',
  'index_compile',
  'partition_shard_sim',
  'cache_policy',
  'compression_policy',
  'locality_route',
  'query_plan',
  'universal_data_api',
  'adapter_sdk',
  'schema_evolution',
  'migration_dry_run',
  'rollback_candidate',
  'rls_abac_map',
  'sealed_placement',
  'leakage_detect',
  'lineage',
  'federated_query',
  'offline_reconcile',
  'replication_plan',
  'cost_optimize',
  'perf_benchmark',
  'info_model',
  'tier_ops',
  'warehouse_placement',
  'deny_auto_prod_ddl',
  'human_decision_gate',
  'evidence_states',
  'tenant_isolation',
  'sync_policy',
] as const;

export type BaHop = (typeof NEURAL_DATABASE_CYCLE)[number];

export type BaEvidenceState =
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

export type WorkloadClass =
  | 'oltp'
  | 'olap'
  | 'htap'
  | 'vector_search'
  | 'time_series'
  | 'document'
  | 'graph'
  | 'streaming'
  | 'mixed';

export type DataTier =
  | 'local_device'
  | 'enterprise_system'
  | 'edge_node'
  | 'cloud_storage';

export const DATA_TIERS: readonly DataTier[] = [
  'local_device',
  'enterprise_system',
  'edge_node',
  'cloud_storage',
] as const;

export type AdapterKind =
  | 'postgresql'
  | 'sqlite'
  | 'vector'
  | 'object_store'
  | 'document'
  | 'graph'
  | 'time_series'
  | 'cache'
  | 'search'
  | 'custom';

export type RecommendationKind =
  | 'schema'
  | 'index'
  | 'partition'
  | 'cache'
  | 'compression'
  | 'migration'
  | 'rollback'
  | 'replication'
  | 'cost'
  | 'sync'
  | 'placement';

export type RecommendationEvidence =
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'RECOMMENDED'
  | 'DRY_RUN_TESTED'
  | 'VERIFIED'
  | 'HUMAN_APPROVED'
  | 'PRODUCTION_AUTHORIZED';

export const BA_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  FOUNDER_IMPERSONATION: false as const,
  AUTO_PRODUCTION_DDL: false as const,
  AUTO_PRODUCTION_DML: false as const,
  AUTO_PRODUCTION_SCHEMA_CHANGE: false as const,
  RECOMMENDATION_IS_NOT_DEPLOY: true as const,
  LABEL_IS_NOT_ACCESS: true as const,
  SEALED_DATA_WEAKENING: false as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  TENANT_ISOLATION_WEAKENED: false as const,
  OFFENSIVE_LEAKAGE_TOOLS: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
});

export const PRODUCTION_DDL_DENIED = 'PRODUCTION_DDL_DENIED_AUTOMATIC_ALTER_FORBIDDEN';
export const PRODUCTION_DML_DENIED = 'PRODUCTION_DML_DENIED_AUTOMATIC_MUTATION_FORBIDDEN';
export const HUMAN_GATE_REQUIRED = 'HUMAN_DECISION_GATE_REQUIRED_BEFORE_PRODUCTION_ALTER';
export const SEALED_PLACEMENT_DENIED = 'SEALED_DATA_PLACEMENT_DENIED_BOUNDARY';
export const TENANT_ISOLATION_VIOLATION = 'TENANT_ISOLATION_VIOLATION_DENIED';
export const LABEL_ALONE_INSUFFICIENT = 'LABEL_ALONE_INSUFFICIENT_NOT_ACCESS';
export const UNVERIFIED_ADAPTER_UNAVAILABLE = 'UNVERIFIED_ADAPTER_UNAVAILABLE';
export const FEDERATION_PERMISSION_REQUIRED = 'FEDERATED_QUERY_REQUIRES_EXPLICIT_PERMISSION';

export const NEXT_PHASE_TITLE =
  '62L-BB — Adaptive Compute Fabric + Universal Model Runtime + CPU/GPU/NPU/Quantum Scheduler + Edge Intelligence Compiler';

export type PredecessorId = 'AZ' | 'AY' | 'AX' | 'AW' | 'AV' | 'AE' | 'AM';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  AZ: 'global-refinery-runtime.ts',
  AY: 'growth-media-engine.ts',
  AX: 'sovereign-sealed-runtime.ts',
  AW: 'business-os-runtime.ts',
  AV: 'universal-runtime.ts',
  AE: 'ceo-sealed-vault.ts',
  AM: 'polyglot-data-fabric.ts',
};

const PREDECESSOR_REPORTS: Record<PredecessorId, string> = {
  AZ: '62L_AZ_GLOBAL_REFINERY_MULTIBRAIN_FOUNDER_MEDIA_REPORT.md',
  AY: '62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md',
  AX: '62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md',
  AW: '62L_AW_UNIVERSAL_APP_RUNTIME_BUSINESS_OS_REPORT.md',
  AV: '62L_AV_UNIVERSAL_RUNTIME_ALGORITHM_FOUNDRY_CFO_REPORT.md',
  AE: '62L_AE_HYBRID_EDGE_CLOUD_CEO_VAULT_REPORT.md',
  AM: '62L_AM_INFORMATION_SUPPLY_CHAIN_DATA_FABRIC_REPORT.md',
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): BaEvidenceState {
  return existsSync(join(cwd, 'docs', 'operations', PREDECESSOR_REPORTS[id])) ? 'PASS' : 'WAITING_DATA';
}

export function predecessorMap(
  cwd = process.cwd(),
): Record<PredecessorId, { module: 'AVAILABLE' | 'WAITING_DATA'; report: BaEvidenceState }> {
  const ids = Object.keys(PREDECESSOR_MODULES) as PredecessorId[];
  return Object.fromEntries(
    ids.map((id) => [id, { module: predecessorModuleState(id), report: predecessorReportState(cwd, id) }]),
  ) as Record<PredecessorId, { module: 'AVAILABLE' | 'WAITING_DATA'; report: BaEvidenceState }>;
}

export type BaHopRecord = {
  hop: BaHop;
  state: BaEvidenceState;
  summary: string;
  at: string;
};

export type BaActor = {
  kind: 'ceo_principal' | 'human_operator' | 'ordinary_agent' | 'label_only_principal' | 'service';
  id: string;
  tenantId: string;
  universeId: string;
  role?: string;
  labelOnly?: boolean;
  impersonatingFounder?: boolean;
};

export type SchemaCandidate = {
  id: string;
  table: string;
  columns: Array<{ name: string; type: string; nullable?: boolean }>;
  primaryKey?: string[];
  evidence: RecommendationEvidence;
  productionApplied: false;
  automaticAlterAllowed: false;
};

export type IndexCandidate = {
  id: string;
  table: string;
  columns: string[];
  kind: 'btree' | 'hash' | 'gin' | 'vector' | 'covering';
  evidence: RecommendationEvidence;
  productionApplied: false;
  automaticAlterAllowed: false;
};

export type MigrationCandidate = {
  id: string;
  fromVersion: string;
  toVersion: string;
  steps: string[];
  dryRunOnly: true;
  productionApplied: false;
  automaticAlterAllowed: false;
  evidence: RecommendationEvidence;
};

export type RollbackCandidate = {
  id: string;
  migrationId: string;
  steps: string[];
  productionApplied: false;
  automaticAlterAllowed: false;
  evidence: RecommendationEvidence;
};
