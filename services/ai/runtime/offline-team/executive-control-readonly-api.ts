import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { OperationsMaterializedSnapshot } from './persistent-operations-views';
import {
  calculateVerifiedDeviceCoverage,
  decideExternalReplication,
  isVerifiedPartner,
  type DeviceVerificationRecord,
  type VendorVerificationRecord,
} from './vendor-device-verification-matrix';

export type ExecutiveOperationsView = {
  tenantId: string;
  generatedAt: string;
  measured: {
    views: number;
    uniqueUsers: number;
    sessions: number;
    featureUsage: Record<string, number>;
  };
  finance: {
    approvedEntries: number;
    pendingApprovals: number;
    rejectedEntries: number;
    approvedAmountMinorByCurrency: Record<string, number>;
    canMoveMoney: false;
    canOpenAccounts: false;
    canSignContracts: false;
  };
  operations: {
    openTasks: number;
    blockedTasks: number;
    blockedTaskIds: string[];
    unresolvedMeetingDissent: number;
    followUpTaskIds: string[];
  };
  runtime: OperationsMaterializedSnapshot['runtime'];
  vendors: {
    targets: number;
    research: number;
    apiReady: number;
    verifiedPartners: number;
  };
  deviceCoverage: ReturnType<typeof calculateVerifiedDeviceCoverage>;
  replication: {
    eligibleVendors: number;
    blockedVendors: number;
    ordinaryClassificationOnly: true;
  };
  evidenceRefs: string[];
};

function normalizedHost(host: string): string {
  const trimmed = host.trim().toLowerCase();
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    return end >= 0 ? trimmed.slice(1, end) : trimmed;
  }
  return trimmed.split(':')[0];
}

export function isLoopbackExecutiveHost(host: string): boolean {
  const normalized = normalizedHost(host);
  return normalized === '127.0.0.1' || normalized === '::1' || normalized === 'localhost';
}

export function buildExecutiveOperationsView(input: {
  snapshot: OperationsMaterializedSnapshot;
  vendors: VendorVerificationRecord[];
  devices: DeviceVerificationRecord[];
  now?: Date;
}): ExecutiveOperationsView {
  const now = input.now ?? new Date();
  const vendorCounts = { targets: 0, research: 0, apiReady: 0, verifiedPartners: 0 };
  let eligibleVendors = 0;
  let blockedVendors = 0;
  const localStatuses = Object.values(input.snapshot.runtime).map((entry) => entry.status);
  const localHealth = localStatuses.length === 0
    ? 'UNVERIFIED'
    : localStatuses.every((status) => status === 'HEALTHY')
      ? 'HEALTHY'
      : localStatuses.some((status) => status === 'OFFLINE')
        ? 'OFFLINE'
        : 'DEGRADED';

  for (const vendor of input.vendors) {
    if (vendor.status === 'TARGET') vendorCounts.targets += 1;
    else if (vendor.status === 'RESEARCH') vendorCounts.research += 1;
    else if (vendor.status === 'API_READY') vendorCounts.apiReady += 1;
    else if (isVerifiedPartner(vendor, now)) vendorCounts.verifiedPartners += 1;
    const replication = decideExternalReplication({
      classification: 'CONFIDENTIAL',
      vendor,
      localHealth,
      now,
    });
    if (replication.eligible) eligibleVendors += 1;
    else blockedVendors += 1;
  }

  return {
    tenantId: input.snapshot.tenantId,
    generatedAt: now.toISOString(),
    measured: {
      views: input.snapshot.usage.views,
      uniqueUsers: input.snapshot.usage.uniqueUsers,
      sessions: input.snapshot.usage.sessions,
      featureUsage: { ...input.snapshot.usage.featureUsage },
    },
    finance: {
      approvedEntries: input.snapshot.bookkeeping.approvedEntries,
      pendingApprovals: input.snapshot.bookkeeping.pendingApprovalEntries,
      rejectedEntries: input.snapshot.bookkeeping.rejectedEntries,
      approvedAmountMinorByCurrency: { ...input.snapshot.bookkeeping.approvedAmountMinorByCurrency },
      canMoveMoney: false,
      canOpenAccounts: false,
      canSignContracts: false,
    },
    operations: {
      openTasks: input.snapshot.tasks.open,
      blockedTasks: input.snapshot.tasks.blocked,
      blockedTaskIds: [...input.snapshot.tasks.blockedTaskIds],
      unresolvedMeetingDissent: input.snapshot.meetings.unresolvedDissent,
      followUpTaskIds: [...input.snapshot.meetings.followUpTaskIds],
    },
    runtime: { ...input.snapshot.runtime },
    vendors: vendorCounts,
    deviceCoverage: calculateVerifiedDeviceCoverage(input.devices, now),
    replication: { eligibleVendors, blockedVendors, ordinaryClassificationOnly: true },
    evidenceRefs: [...input.snapshot.sourceEvidenceRefs],
  };
}

export type ExecutiveControlResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

export type ExecutiveControlLookup = (tenantId: string) => Promise<ExecutiveOperationsView | undefined>;

export async function handleExecutiveControlRequest(input: {
  method: string;
  url: string;
  host: string;
  lookup: ExecutiveControlLookup;
}): Promise<ExecutiveControlResponse> {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  };
  if (!isLoopbackExecutiveHost(input.host)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'executive control API is loopback-only' }) };
  }
  if (input.method.toUpperCase() !== 'GET') {
    return { statusCode: 405, headers: { ...headers, allow: 'GET' }, body: JSON.stringify({ error: 'read-only API: GET required' }) };
  }
  const parsed = new URL(input.url, 'http://localhost');
  if (parsed.pathname === '/health') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'reachable', readOnly: true, productionMutation: false, universalDeviceSupportClaim: false }),
    };
  }
  const match = parsed.pathname.match(/^\/v1\/tenants\/([A-Za-z0-9._-]+)\/operations$/);
  if (!match) return { statusCode: 404, headers, body: JSON.stringify({ error: 'not found' }) };
  const view = await input.lookup(match[1]);
  if (!view) return { statusCode: 404, headers, body: JSON.stringify({ error: 'tenant operations view not found' }) };
  return { statusCode: 200, headers, body: JSON.stringify(view) };
}

export function createExecutiveControlReadonlyServer(input: {
  lookup: ExecutiveControlLookup;
  host?: '127.0.0.1' | '::1' | 'localhost';
}): Server {
  const bindHost = input.host ?? '127.0.0.1';
  if (!isLoopbackExecutiveHost(bindHost)) throw new Error('executive control server may bind only to loopback');
  return createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const result = await handleExecutiveControlRequest({
      method: request.method ?? 'GET',
      url: request.url ?? '/',
      host: request.headers.host ?? bindHost,
      lookup: input.lookup,
    });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.body);
  });
}
