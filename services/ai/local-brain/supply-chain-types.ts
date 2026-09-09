export const SUPPLY_CHAIN_CYCLE = [
  'business_need',
  'supply_demand_capacity_signals',
  'sharing_gate',
  'network_twin',
  'bottleneck_risk_analysis',
  'agent_council',
  'scenario',
  'human_gate',
  'recommendation',
  'outcome',
  'sla_cost_resilience_learning',
] as const;

export type SupplyChainHop = (typeof SUPPLY_CHAIN_CYCLE)[number];

export type EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export type EpistemicClass = 'VERIFIED_FACT' | 'SIMULATION' | 'FORECAST' | 'HYPOTHESIS' | 'UNKNOWN';

export const NETWORK_ENTITY_KINDS = [
  'supplier',
  'carrier',
  'warehouse',
  'plant',
  'inventory',
  'order',
  'shipment',
  'demand',
  'capacity',
  'exception',
  'lead_time',
  'service_level',
  'risk',
] as const;

export type NetworkEntityKind = (typeof NETWORK_ENTITY_KINDS)[number];

export const COLLUSION_PATTERNS = [
  'coordinated_pricing',
  'bid_rigging',
  'market_allocation',
  'csi_exchange',
] as const;

export type CollusionPattern = (typeof COLLUSION_PATTERNS)[number];

/** Fields that are competitively sensitive across enterprises. Sharing them is denied. */
export const CSI_FIELDS = [
  'price',
  'unit_price',
  'bid',
  'bid_amount',
  'cover_bid',
  'customer_list',
  'customer_allocation',
  'territory_split',
  'market_share_split',
  'competitor_cost',
  'unit_cost',
  'margin',
  'unused_capacity_detail',
  'contract_terms',
  'reserve_price',
] as const;

export type CsiField = (typeof CSI_FIELDS)[number];

/** Operational fields that may be shared across a grant — never prices, bids, or allocations. */
export const SHAREABLE_OPERATIONAL_FIELDS = [
  'shipment_status',
  'public_delay_reason',
  'public_exception_class',
  'node_kind',
] as const;

export type ShareableOperationalField = (typeof SHAREABLE_OPERATIONAL_FIELDS)[number];

export const SUPPLY_CHAIN_LOCKS = Object.freeze({
  l4AutonomyEnabled: false as const,
  autoPurchase: false as const,
  autoContract: false as const,
  autoTrade: false as const,
  autoProductionDeploy: false as const,
  productionDatabaseWrite: false as const,
  productionGitPush: false as const,
  autoPermissionExpansion: false as const,
  productionAuthorization: false as const,
  founderImpersonation: false as const,
  physicalDeviceControl: false as const,
  tipLand: false as const,
  inventedPass: false as const,
  inventedPartnership: false as const,
  simulationIsReality: false as const,
  forecastIsVerifiedFact: false as const,
  ceoSealedReplicating: false as const,
  rawPrivateDbMerge: false as const,
  collusionAllowed: false as const,
  coordinatedPricing: false as const,
  bidRigging: false as const,
  marketAllocation: false as const,
  csiExchange: false as const,
  guardianRlsWeaken: false as const,
});

export const ANTI_COLLUSION_BOUNDARY =
  'Inter-enterprise coordination must not become coordinated pricing, bid rigging, market allocation, or inappropriate exchange of competitively sensitive information.';

export const SIMULATION_IS_NOT_FACT =
  'Network twin, scenario, stress test, and cost-to-serve outputs are SIMULATION or FORECAST. They are not verified facts and not physical control.';
