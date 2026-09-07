export const EVENT_SCALE_MILESTONES = [
  { events: 1_000_000, label: '1 million' },
  { events: 100_000_000, label: '100 million' },
  { events: 1_000_000_000, label: '1 billion' },
  { events: 100_000_000_000, label: '100 billion' },
  { events: 1_000_000_000_000, label: '1 trillion+' },
] as const;

export const STORAGE_PLANE_SEPARATION = [
  'transactional_postgresql',
  'object_data_lake',
  'analytics_warehouse_lakehouse',
  'event_streaming',
  'vector_search',
  'graph_knowledge',
  'caches',
  'cold_archive',
] as const;

export function trillionEventCapacityIsLive() {
  return false;
}

export function trillionEventCapacityStatus() {
  return {
    status: 'DESIGNED' as const,
    live: false as const,
    currentStore: 'in_memory_ledger_not_hosted_postgres' as const,
    milestones: EVENT_SCALE_MILESTONES,
    planes: STORAGE_PLANE_SEPARATION,
  };
}
