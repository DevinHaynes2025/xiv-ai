export type RagRuntimeStatus = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';

export interface RagProbeReceipt {
  observedAt: string;
  endpoint: string;
  reachable: boolean;
  statusCode?: number;
  latencyMs?: number;
  queueDepth?: number;
  capacityUsed?: number;
  capacityTotal?: number;
  evidenceRefs: string[];
}

export interface RagSupervisorThresholds {
  p95LatencyMs: number;
  maxFailureRatio: number;
  maxCapacityRatio: number;
  maxQueueDepth: number;
}

export interface RagRuntimeSummary {
  status: RagRuntimeStatus;
  sampleCount: number;
  successCount: number;
  failureCount: number;
  uptimeRatio: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  latestQueueDepth: number | null;
  maxQueueDepth: number | null;
  latestCapacityRatio: number | null;
  lastObservedAt: string | null;
  reasons: string[];
}

const DEFAULT_THRESHOLDS: RagSupervisorThresholds = {
  p95LatencyMs: 1500,
  maxFailureRatio: 0.05,
  maxCapacityRatio: 0.9,
  maxQueueDepth: 100,
};

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

function isEvidenceBacked(receipt: RagProbeReceipt): boolean {
  return Array.isArray(receipt.evidenceRefs) && receipt.evidenceRefs.some((ref) => ref.trim().length > 0);
}

function isLoopbackEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function summarizeRagRuntime(
  receipts: RagProbeReceipt[],
  thresholds: Partial<RagSupervisorThresholds> = {},
): RagRuntimeSummary {
  const config = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const valid = receipts.filter(isEvidenceBacked).filter((r) => isLoopbackEndpoint(r.endpoint));
  if (valid.length === 0) {
    return {
      status: 'UNVERIFIED',
      sampleCount: 0,
      successCount: 0,
      failureCount: 0,
      uptimeRatio: null,
      p50LatencyMs: null,
      p95LatencyMs: null,
      latestQueueDepth: null,
      maxQueueDepth: null,
      latestCapacityRatio: null,
      lastObservedAt: null,
      reasons: ['NO_EVIDENCE_BACKED_LOOPBACK_PROBES'],
    };
  }

  const ordered = [...valid].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  const successes = ordered.filter((r) => r.reachable && (r.statusCode === undefined || (r.statusCode >= 200 && r.statusCode < 500)));
  const failures = ordered.length - successes.length;
  const latencies = successes.map((r) => r.latencyMs).filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0);
  const queues = ordered.map((r) => r.queueDepth).filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0);
  const latest = ordered[ordered.length - 1];
  const latestCapacityRatio =
    typeof latest.capacityUsed === 'number' && typeof latest.capacityTotal === 'number' && latest.capacityTotal > 0
      ? latest.capacityUsed / latest.capacityTotal
      : null;
  const failureRatio = failures / ordered.length;
  const p95 = percentile(latencies, 0.95);
  const reasons: string[] = [];

  if (!latest.reachable) {
    reasons.push('LATEST_PROBE_UNREACHABLE');
    return {
      status: successes.length === 0 ? 'OFFLINE' : 'DEGRADED',
      sampleCount: ordered.length,
      successCount: successes.length,
      failureCount: failures,
      uptimeRatio: successes.length / ordered.length,
      p50LatencyMs: percentile(latencies, 0.5),
      p95LatencyMs: p95,
      latestQueueDepth: typeof latest.queueDepth === 'number' ? latest.queueDepth : null,
      maxQueueDepth: queues.length ? Math.max(...queues) : null,
      latestCapacityRatio,
      lastObservedAt: latest.observedAt,
      reasons,
    };
  }

  if (failureRatio > config.maxFailureRatio) reasons.push('FAILURE_RATIO_THRESHOLD_EXCEEDED');
  if (p95 !== null && p95 > config.p95LatencyMs) reasons.push('P95_LATENCY_THRESHOLD_EXCEEDED');
  if (latestCapacityRatio !== null && latestCapacityRatio > config.maxCapacityRatio) reasons.push('CAPACITY_THRESHOLD_EXCEEDED');
  if (queues.length > 0 && Math.max(...queues) > config.maxQueueDepth) reasons.push('QUEUE_DEPTH_THRESHOLD_EXCEEDED');

  return {
    status: reasons.length > 0 ? 'DEGRADED' : 'HEALTHY',
    sampleCount: ordered.length,
    successCount: successes.length,
    failureCount: failures,
    uptimeRatio: successes.length / ordered.length,
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: p95,
    latestQueueDepth: typeof latest.queueDepth === 'number' ? latest.queueDepth : null,
    maxQueueDepth: queues.length ? Math.max(...queues) : null,
    latestCapacityRatio,
    lastObservedAt: latest.observedAt,
    reasons,
  };
}

export function buildRagSupervisorReceipt(summary: RagRuntimeSummary) {
  return {
    generatedAt: new Date().toISOString(),
    ...summary,
    claims: {
      ollamaRunning: false,
      gpuAvailable: false,
      cloudConnected: false,
      vendorIntegrated: false,
    },
    note: 'Claims remain false unless separately verified by dedicated evidence receipts.',
  };
}
