export type ScaleHorizon = 'current' | 'next' | 'future';

export type ScaleCapability = {
  id: string;
  name: string;
  horizon: ScaleHorizon;
  proven: false;
};

export const SCALE_CAPABILITIES: readonly ScaleCapability[] = [
  { id: 'stateless_api', name: 'Stateless API services', horizon: 'current', proven: false },
  { id: 'regional_gateways', name: 'Regional API gateways', horizon: 'future', proven: false },
  { id: 'cdn', name: 'CDN', horizon: 'next', proven: false },
  { id: 'edge_cache', name: 'Edge caching', horizon: 'future', proven: false },
  { id: 'distributed_rate_limit', name: 'Distributed rate limiting', horizon: 'next', proven: false },
  { id: 'message_queues', name: 'Message queues', horizon: 'next', proven: false },
  { id: 'event_streaming', name: 'Event streaming', horizon: 'future', proven: false },
  { id: 'background_workers', name: 'Background workers', horizon: 'next', proven: false },
  { id: 'read_replicas', name: 'Read replicas', horizon: 'future', proven: false },
  { id: 'db_partitioning', name: 'Database partitioning', horizon: 'future', proven: false },
  { id: 'object_storage', name: 'Object storage', horizon: 'next', proven: false },
  { id: 'search_clusters', name: 'Search clusters', horizon: 'future', proven: false },
  { id: 'vector_storage', name: 'Vector storage strategy', horizon: 'future', proven: false },
  { id: 'multi_region_failover', name: 'Multi-region failover', horizon: 'future', proven: false },
  { id: 'tenant_partitioning', name: 'Tenant partitioning', horizon: 'future', proven: false },
  { id: 'connection_pooling', name: 'Connection pooling', horizon: 'next', proven: false },
  { id: 'async_workflows', name: 'Async workflows', horizon: 'next', proven: false },
  { id: 'idempotency', name: 'Idempotency keys', horizon: 'next', proven: false },
  { id: 'backpressure', name: 'Backpressure', horizon: 'current', proven: false },
  { id: 'load_shedding', name: 'Load shedding', horizon: 'next', proven: false },
  { id: 'circuit_breakers', name: 'Circuit breakers', horizon: 'current', proven: false },
];

export function billionUserReady() {
  return false;
}

export function billionUserClaim() {
  return {
    designedForHorizontalScale: true,
    billionUserReady: false,
    proven: false,
    requiredProof: [
      'load testing',
      'capacity testing',
      'chaos testing',
      'security testing',
      'regional failover testing',
      'database scale testing',
      'real customer traffic',
    ] as const,
  };
}
