export const INFORMATION_ECONOMY_LOOP = [
  'information_demand',
  'source',
  'inventory',
  'qualification',
  'routing',
  'minimum_necessary_transformation',
  'delivery',
  'quality_check',
  'decision',
  'outcome',
  'learning',
] as const;

export type InformationEconomyHop = (typeof INFORMATION_ECONOMY_LOOP)[number];

export type EconomyEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED';

export const INFORMATION_ECONOMY_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  RAW_CROSS_ENTERPRISE_POOLING: false as const,
  CEO_SEALED_ORDINARY_MOVEMENT: false as const,
  FOUNDER_IMPERSONATION: false as const,
  TIP_LAND: false as const,
  INVENT_PARTNERSHIPS: false as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  BRUTE_FORCE_CENTRALIZATION: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
  ANTI_COLLUSION_INTER_ENTERPRISE: true as const,
  QUERY_TO_DATA_DEFAULT: true as const,
  INVENTED_PASS: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
});

export type InformationClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'sealed_founder_priority';

export type EpistemicClass = 'VERIFIED_FACT' | 'SIMULATION' | 'FORECAST' | 'HYPOTHESIS' | 'UNKNOWN';

export const LEAN_WASTE_KINDS = [
  'repeated_searches',
  'duplicated_context',
  'unnecessary_model_calls',
  'duplicate_storage',
  'excessive_traffic',
  'overprocessing_full_copy',
  'waiting_queue',
] as const;

export type LeanWasteKind = (typeof LEAN_WASTE_KINDS)[number];

export const GIEP_APPROVED_KINDS = [
  'schema',
  'aggregate',
  'benchmark',
  'capability',
  'permissioned_intelligence',
] as const;

export type GiepApprovedKind = (typeof GIEP_APPROVED_KINDS)[number];

export const GIEP_DENIED_KINDS = ['raw_pool', 'raw_cross_enterprise', 'ceo_sealed_ordinary'] as const;

export type GiepDeniedKind = (typeof GIEP_DENIED_KINDS)[number];

export const GIEP_CSI_FIELDS = [
  'price',
  'unit_price',
  'bid',
  'bid_amount',
  'customer_list',
  'customer_allocation',
  'territory_split',
  'margin',
  'unit_cost',
] as const;

export const PREDECESSOR_REPORTS = {
  AT: '62L_AT_KNOWLEDGE_DISCOVERY_INVENTION_LAB_REPORT.md',
  AS: '62L_AS_REPORT.md',
  AR: '62L_AR_DISTRIBUTED_MEMORY_NEURAL_HIGHWAY_COMPILER_REPORT.md',
  AQ: '62L_AQ_ENTERPRISE_NERVOUS_SYSTEM_ETHICAL_SENTINEL_REPORT.md',
  AM: '62L_AM_INFORMATION_SUPPLY_CHAIN_DATA_FABRIC_REPORT.md',
  AN: '62L_AN_INFORMATION_CONTROL_TOWER_SEMANTIC_ROUTER_REPORT.md',
  AO: '62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md',
  AL: '62L_AL_DISTRIBUTED_APP_NETWORK_EDGE_SYNC_REPORT.md',
  AB: '62L_AB_KNOWLEDGE_LAKE_INDUSTRY_MEMORY_REPORT.md',
} as const;

export const HASH_REF_BYTES = 64;

export const ANTI_COLLUSION_DENY = 'ANTI_COLLUSION_INTER_ENTERPRISE_DENIED';
export const RAW_POOL_DENY = 'RAW_CROSS_ENTERPRISE_POOLING_DENIED';
export const SEALED_NON_MOVEMENT = 'CEO_SEALED_NON_MOVEMENT';
export const QUERY_TO_DATA = 'QUERY_TO_DATA_MINIMIZE_MOVEMENT';
export const FOUNDER_IMPERSONATION_DENY = 'FOUNDER_IMPERSONATION_DENIED';
export const CENTRALIZATION_DENY = 'BRUTE_FORCE_CENTRALIZATION_DENIED';

export type EconomyHopRecord = {
  hop: InformationEconomyHop;
  state: EconomyEvidenceState;
  summary: string;
  at: string;
  movementBytes: number;
};
