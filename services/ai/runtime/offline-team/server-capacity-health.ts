export type ServerHealthState = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';

export interface ServerCapacityProbe {
  probeId: string;
  nodeId: string;
  measuredAt: string;
  reachable: boolean;
  latencyMs?: number;
  storageUsedBytes?: number;
  storageCapacityBytes?: number;
  queueDepth?: number;
  evidenceRef: string;
}

export interface ServerCapacityHealthReceipt {
  nodeId: string;
  state: ServerHealthState;
  sampleCount: number;
  successfulSamples: number;
  p95LatencyMs: number | null;
  storageUtilization: number | null;
  maxQueueDepth: number | null;
  evidenceRefs: string[];
  measuredAt: string;
}

function percentile95(values: number[]) {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * 0.95) - 1)];
}

export function buildServerCapacityHealthReceipt(
  nodeId: string,
  probes: ServerCapacityProbe[],
  thresholds: { maxP95LatencyMs: number; maxStorageUtilization: number; maxQueueDepth: number },
): ServerCapacityHealthReceipt {
  const rows = probes.filter(probe => probe.nodeId === nodeId && !!probe.evidenceRef);
  if (!rows.length) {
    return {
      nodeId,
      state: 'UNVERIFIED',
      sampleCount: 0,
      successfulSamples: 0,
      p95LatencyMs: null,
      storageUtilization: null,
      maxQueueDepth: null,
      evidenceRefs: [],
      measuredAt: new Date().toISOString(),
    };
  }

  const successful = rows.filter(probe => probe.reachable);
  const latencies = successful.flatMap(probe => typeof probe.latencyMs === 'number' ? [probe.latencyMs] : []);
  const p95LatencyMs = percentile95(latencies);
  const utilizationSamples = successful.flatMap(probe => {
    if (typeof probe.storageUsedBytes !== 'number' || typeof probe.storageCapacityBytes !== 'number' || probe.storageCapacityBytes <= 0) return [];
    return [probe.storageUsedBytes / probe.storageCapacityBytes];
  });
  const storageUtilization = utilizationSamples.length ? Math.max(...utilizationSamples) : null;
  const queueSamples = successful.flatMap(probe => typeof probe.queueDepth === 'number' ? [probe.queueDepth] : []);
  const maxQueueDepth = queueSamples.length ? Math.max(...queueSamples) : null;

  let state: ServerHealthState = successful.length ? 'HEALTHY' : 'OFFLINE';
  if (state === 'HEALTHY' && successful.length !== rows.length) state = 'DEGRADED';
  if (state === 'HEALTHY' && p95LatencyMs !== null && p95LatencyMs > thresholds.maxP95LatencyMs) state = 'DEGRADED';
  if (state === 'HEALTHY' && storageUtilization !== null && storageUtilization > thresholds.maxStorageUtilization) state = 'DEGRADED';
  if (state === 'HEALTHY' && maxQueueDepth !== null && maxQueueDepth > thresholds.maxQueueDepth) state = 'DEGRADED';

  return {
    nodeId,
    state,
    sampleCount: rows.length,
    successfulSamples: successful.length,
    p95LatencyMs,
    storageUtilization,
    maxQueueDepth,
    evidenceRefs: [...new Set(rows.map(row => row.evidenceRef))],
    measuredAt: new Date().toISOString(),
  };
}

export const SERVER_CAPACITY_GUARDRAILS = {
  configuredDoesNotMeanHealthy: true,
  healthClaimsRequireProbeEvidence: true,
  noEvidenceMeansUnverified: true,
  unreachableMeansOfflineOrDegraded: true,
};
