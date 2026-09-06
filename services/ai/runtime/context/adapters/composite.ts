import type { AdapterCapabilities, AdapterDataset, BusinessDataAdapter, LiveSourceStatus } from './types';
import { emptyDomainCapabilities } from './session-records';

/**
 * Combines connection-health and authorized session records.
 * Never substitutes prototype sample rows.
 */
export function createCompositeBusinessAdapter(input: {
  health: BusinessDataAdapter;
  records?: BusinessDataAdapter;
}): BusinessDataAdapter {
  return {
    getCapabilities(): AdapterCapabilities {
      const health = input.health.getCapabilities();
      const records = input.records?.getCapabilities();
      return {
        read: true,
        write: false,
        metrics: Boolean(records?.metrics),
        records: Boolean(records?.records),
        connectionHealth: health.connectionHealth,
        domains: records?.domains ?? emptyDomainCapabilities(),
      };
    },
    getSourceMetadata() {
      return input.records?.getSourceMetadata() ?? input.health.getSourceMetadata();
    },
    async getConnectionStatus() {
      if (input.records) {
        const recordsStatus = await input.records.getConnectionStatus();
        if (recordsStatus === 'live') return 'live';
        if (recordsStatus === 'stale') return 'stale';
      }
      return input.health.getConnectionStatus();
    },
    getFreshness() {
      return input.records?.getFreshness() ?? input.health.getFreshness();
    },
    async fetchMetrics() {
      return merge(input);
    },
    async fetchRecords() {
      return merge(input);
    },
  };
}

async function merge(input: {
  health: BusinessDataAdapter;
  records?: BusinessDataAdapter;
}): Promise<AdapterDataset<Record<string, unknown>>> {
  const healthStatus = await input.health.getConnectionStatus();
  if (!input.records) {
    const health = await input.health.fetchMetrics();
    return health;
  }
  const records = await input.records.fetchRecords();
  const status: LiveSourceStatus =
    records.status === 'live' || records.status === 'stale'
      ? records.status
      : records.status === 'not_configured'
        ? healthStatus
        : records.status;
  return {
    ...records,
    status,
    message:
      healthStatus === 'unavailable'
        ? `${records.message} Connection-health probe unavailable.`
        : records.message,
  };
}
