import type { UsageSnapshot } from './usage-analytics-ledger';
import type { RuntimeReadiness } from './local-database-server-runtime';
import type { RecoveryReceipt } from './offline-replay-recovery';

export type MetricsApiMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ExecutiveMetricsSnapshot {
  tenantId: string;
  usage: UsageSnapshot;
  pendingBookkeepingApprovals: number;
  openTasks: number;
  blockedTasks: number;
  unresolvedDissent: number;
  runtime: RuntimeReadiness;
  recovery?: RecoveryReceipt;
  generatedAt: string;
}

export interface MetricsApiRequest {
  tenantId: string;
  method: MetricsApiMethod;
  path: '/metrics' | '/health' | '/recovery';
  scopes: string[];
}

export interface MetricsApiResponse {
  status: number;
  body: unknown;
  cacheControl: 'no-store';
}

export class ExecutiveMetricsApi {
  constructor(private readonly buildSnapshot: (tenantId: string) => ExecutiveMetricsSnapshot) {}

  handle(request: MetricsApiRequest): MetricsApiResponse {
    if (!request.tenantId) return { status: 400, body: { error: 'tenant required' }, cacheControl: 'no-store' };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return { status: 405, body: { error: 'read-only metrics API' }, cacheControl: 'no-store' };
    }
    if (!request.scopes.includes('xiv.metrics.read')) {
      return { status: 403, body: { error: 'xiv.metrics.read scope required' }, cacheControl: 'no-store' };
    }

    const snapshot = this.buildSnapshot(request.tenantId);
    if (snapshot.tenantId !== request.tenantId) {
      return { status: 403, body: { error: 'cross-tenant metrics response blocked' }, cacheControl: 'no-store' };
    }

    let body: unknown;
    if (request.path === '/health') body = { tenantId: snapshot.tenantId, runtime: snapshot.runtime, generatedAt: snapshot.generatedAt };
    else if (request.path === '/recovery') body = { tenantId: snapshot.tenantId, recovery: snapshot.recovery ?? null, generatedAt: snapshot.generatedAt };
    else body = snapshot;

    return { status: 200, body: request.method === 'HEAD' ? null : body, cacheControl: 'no-store' };
  }
}

export const EXECUTIVE_METRICS_API_GUARDRAILS = {
  readOnly: true,
  tenantScoped: true,
  topSecretPayloadRenderingAllowed: false,
  measuredUsageOnly: true,
  financialActionsAllowed: false,
};
