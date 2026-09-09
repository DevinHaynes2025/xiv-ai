export const INFORMATION_ROUTING_LOOP = [
  'information_need',
  'intent_resolution',
  'candidate_roots',
  'policy_filter',
  'route_scoring',
  'semantic_translation',
  'authorized_query',
  'evidence_packet',
  'agent_workflow',
  'outcome',
  'route_learning',
  'control_tower',
] as const;

export type InformationRoutingHop = (typeof INFORMATION_ROUTING_LOOP)[number];

export const INFORMATION_CONTROL_TOWER_LOCKS = {
  L4_AUTONOMY_ENABLED: false,
  AUTO_PRODUCTION_DEPLOY: false,
  PRODUCTION_DATABASE_WRITE: false,
  PRODUCTION_GIT_PUSH: false,
  AUTO_PERMISSION_EXPANSION: false,
  PRODUCTION_AUTHORIZATION: false,
  FOUNDER_IMPERSONATION: false,
  RAW_CROSS_ENTERPRISE_POOLING: false,
  TIP_LAND: false,
  INVENT_PARTNERSHIPS: false,
} as const;

export type EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export const ROUTE_SCORE_DIMENSIONS = [
  'freshness',
  'provenance',
  'trust',
  'privacy',
  'latency',
  'cost',
  'offlineAvailability',
  'compatibility',
  'verifiedOutcomeQuality',
] as const;

export type RouteScoreDimension = (typeof ROUTE_SCORE_DIMENSIONS)[number];

/** Popularity is recorded only to prove it is ignored. It is not a scoring dimension. */
export type IgnoredRouteSignal = 'popularity';

export const DEFAULT_ROUTE_WEIGHTS: Record<RouteScoreDimension, number> = {
  freshness: 1,
  provenance: 1.2,
  trust: 1.2,
  privacy: 1.3,
  latency: 0.8,
  cost: 0.7,
  offlineAvailability: 1.1,
  compatibility: 0.9,
  verifiedOutcomeQuality: 1.4,
};

export type RouteMetrics = Partial<Record<RouteScoreDimension, number>> & {
  popularity?: number;
};

export type InformationRootKind =
  | 'knowledge_lake'
  | 'learning_ledger'
  | 'evidence_ledger'
  | 'neural_fabric'
  | 'local_graph'
  | 'provider'
  | 'enterprise_peer'
  | 'edge_sync'
  | 'data_fabric';

export type InformationRoot = {
  id: string;
  kind: InformationRootKind;
  namespaceId: string;
  tenantId: string;
  universeId: string;
  label: string;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  offlineAvailable: boolean;
  partnershipInvented: false;
  lastVerifiedAt?: string;
  maxStalenessMs?: number;
  metrics: RouteMetrics;
  vendorId?: string;
  hopPath?: string[];
  productionAuthorization: false;
};

export const APPROVED_EXCHANGE_KINDS = [
  'schema',
  'aggregate',
  'benchmark',
  'capability',
  'permissioned_intelligence',
] as const;

export type ApprovedExchangeKind = (typeof APPROVED_EXCHANGE_KINDS)[number];

export const DENIED_EXCHANGE_KINDS = [
  'raw_pool',
  'raw_cross_enterprise',
  'ceo_sealed_ordinary',
] as const;

export type DeniedExchangeKind = (typeof DENIED_EXCHANGE_KINDS)[number];

export type ExchangeKind = ApprovedExchangeKind | DeniedExchangeKind;

export type SemanticQuery = {
  need: string;
  namespaceIri: string;
  predicate?: string;
  industry?: string;
  partition?: 'world' | 'business' | 'personal' | 'company';
  aggregation?: 'count' | 'hash' | 'benchmark' | 'none';
  minimizeMovement: true;
};

export type ControlTowerObservation = {
  sourceId: string;
  fastest: boolean;
  usefulness: number;
  usefulnessIsPopularity: false;
  stale: boolean;
  contradictions: number;
  bottleneck: boolean;
  stockout: boolean;
  usefulnessIsTruth: false;
};
