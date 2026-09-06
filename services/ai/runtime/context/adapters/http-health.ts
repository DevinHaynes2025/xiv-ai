import type { AdapterDataset, BusinessDataAdapter, DataProvenance, LiveSourceStatus, SourceMetadata } from './types';

export type HttpHealthAdapterOptions = {
  sourceId?: string;
  healthUrl?: string;
  organizationId?: string | null;
  universeId?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

function provenance(
  options: HttpHealthAdapterOptions,
  status: LiveSourceStatus,
  retrievedAt: string,
): DataProvenance {
  return {
    sourceId: options.sourceId ?? 'xiv-ai-health',
    sourceSystem: 'xiv_ai_http',
    sourceType: 'connection_health',
    sourceRecordId: null,
    organizationId: options.organizationId ?? null,
    universeId: options.universeId ?? null,
    retrievedAt,
    freshness: status === 'live' ? 'live' : status === 'stale' ? 'stale' : 'unknown',
    live: status === 'live',
    prototype: false,
    confidence: status === 'live' ? 'medium' : 'low',
  };
}

function emptyDataset(
  options: HttpHealthAdapterOptions,
  status: LiveSourceStatus,
  message: string,
): AdapterDataset<Record<string, unknown>> {
  return {
    status,
    records: [],
    provenance: provenance(options, status, new Date().toISOString()),
    message,
  };
}

/**
 * Real read-only adapter. Probes an existing HTTP health endpoint.
 * Does not invent enterprise records. Never falls back to prototype sample data.
 */
export function createHttpHealthAdapter(options: HttpHealthAdapterOptions = {}): BusinessDataAdapter {
  const healthUrl = options.healthUrl?.replace(/\/$/, '') ?? '';
  const timeoutMs = options.timeoutMs ?? 4_000;
  const fetchImpl = options.fetchImpl;

  async function probe(): Promise<LiveSourceStatus> {
    if (!healthUrl) return 'not_configured';
    if (!fetchImpl && typeof fetch !== 'function') return 'unavailable';
    const run = fetchImpl ?? fetch;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await run(`${healthUrl}/health`, {
        method: 'GET',
        signal: controller?.signal,
      });
      return response.ok ? 'live' : 'unavailable';
    } catch {
      return 'unavailable';
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return {
    getCapabilities() {
      return { read: true, write: false, metrics: false, records: false, connectionHealth: true };
    },
    getSourceMetadata(): SourceMetadata {
      return {
        sourceId: options.sourceId ?? 'xiv-ai-health',
        sourceSystem: 'xiv_ai_http',
        sourceType: 'connection_health',
        configured: Boolean(healthUrl),
        writeSupported: false,
      };
    },
    async getConnectionStatus() {
      return probe();
    },
    async getFreshness() {
      const status = await probe();
      return status === 'live' ? 'live' : 'unknown';
    },
    async fetchMetrics() {
      const status = await probe();
      if (status === 'not_configured') {
        return emptyDataset(options, status, 'Live source unavailable');
      }
      if (status !== 'live') {
        return emptyDataset(options, status, 'Live source unavailable');
      }
      return emptyDataset(
        options,
        status,
        'Live connection health is available. No authorized business metric records were returned.',
      );
    },
    async fetchRecords() {
      return this.fetchMetrics();
    },
  };
}

export function resolveConfiguredHealthUrl() {
  const fromExpo = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_XIV_AI_URL : undefined;
  const fromService = typeof process !== 'undefined' ? process.env.XIV_AI_URL : undefined;
  return (fromExpo || fromService || '').replace(/\/$/, '');
}
