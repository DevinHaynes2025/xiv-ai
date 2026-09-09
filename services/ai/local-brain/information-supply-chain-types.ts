export const INFORMATION_SUPPLY_CHAIN = [
  'source',
  'intake',
  'quality',
  'classification',
  'transformation',
  'storage',
  'routing',
  'delivery',
  'decision',
  'outcome',
  'feedback',
] as const;

export type InformationSupplyChainHop = (typeof INFORMATION_SUPPLY_CHAIN)[number];

export const INFORMATION_SUPPLY_CHAIN_LOCKS = {
  L4_AUTONOMY_ENABLED: false,
  AUTO_PRODUCTION_DEPLOY: false,
  PRODUCTION_DATABASE_WRITE: false,
  PRODUCTION_GIT_PUSH: false,
  AUTO_PERMISSION_EXPANSION: false,
  PRODUCTION_AUTHORIZATION: false,
  FOUNDER_IMPERSONATION: false,
  TIP_LAND: false,
  BRUTE_FORCE_CENTRALIZATION: false,
  PARTNERSHIP_CLAIMED: false,
  EXPLOIT_OTHER_COMPANIES: false,
  GUARDIAN_RLS_WEAKENED: false,
} as const;

export type EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export const INTEGRATION_ADAPTER_IDS = [
  'aws',
  'azure',
  'google_cloud',
  'github',
  'gitlab',
  'supabase_postgres',
  'snowflake',
  'databricks',
  'local_agentic',
  'local_knowledge_lake',
] as const;

export type IntegrationAdapterId = (typeof INTEGRATION_ADAPTER_IDS)[number];

export const TYPED_HIGHWAY_RELATIONS = [
  'query_to_data',
  'a2a_interop',
  'mcp_tool_data',
  'provenance',
  'contradiction',
  'timeline',
  'freshness',
  'sealed_hold',
  'federated_in_place',
] as const;

export type TypedHighwayRelation = (typeof TYPED_HIGHWAY_RELATIONS)[number];

export const GAP_KINDS = [
  'data_silo',
  'stale_path',
  'brittle_api',
  'duplicate_movement',
  'disconnected_graph',
  'schema_fragmentation',
  'dead_route',
  'vendor_lock_in',
  'weak_provenance',
  'trust_boundary_mistake',
  'recursive_loop',
  'missing_root',
  'unverified_adapter_treated_as_available',
  'brute_force_centralization',
] as const;

export type GapKind = (typeof GAP_KINDS)[number];

export const GAP_POLICY = {
  loopholesAreSystemWeaknesses: true,
  exploitOtherCompanies: false,
  vulnerabilityBypass: false,
  redesignNotBypass: true,
  attackSteps: [] as const,
} as const;

export type RootIdentityKind =
  | 'data_root'
  | 'highway_root'
  | 'memory_root'
  | 'vault_root'
  | 'adapter_root'
  | 'graph_root'
  | 'timeline_root';

export type ControlTowerMetrics = {
  itemsInFlight: number;
  qualityFailures: number;
  bottlenecks: string[];
  movementBytes: number;
  sealedHolds: number;
  unavailableAdapters: number;
  loopsBlocked: number;
  slaBreaches: number;
  costUnits: number;
  feedbackEvents: number;
  copyAllToOnePlace: false;
  productionAuthorization: false;
};
