import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { errorCodeOf, isRuntimeError, RuntimeError } from './errors';
import { NodeRegistry } from './nodes';
import { RUNTIME_CONTRACT_VERSION, RuntimePlane } from './plane';
import type { AuthenticatedPrincipal, ControlCommandKind, HardwareProfile, TenantRef, WorkloadSpec } from './types';

const MAX_BODY_BYTES = 64 * 1024;

export type RouteSpec = {
  method: 'GET' | 'POST';
  path: string;
  /** Whether a verified principal is required. Only health and contract are open. */
  authenticated: boolean;
  /** Capability the principal must hold, when the route requires one. */
  capability?: string;
  summary: string;
};

/**
 * The declared contract. The acceptance suite walks this inventory and calls
 * every route, so an undocumented route or an unimplemented documented route
 * both show up as a contract failure rather than passing unnoticed.
 */
export const RUNTIME_ROUTES: readonly RouteSpec[] = [
  { method: 'GET', path: '/healthz', authenticated: false, summary: 'Liveness and contract version' },
  { method: 'GET', path: '/v1/contract', authenticated: false, summary: 'Route inventory for this contract version' },
  {
    method: 'POST',
    path: '/v1/nodes/enroll',
    authenticated: true,
    capability: 'node.register',
    summary: 'Issue a single-use enrollment ticket for a runtime node',
  },
  {
    method: 'POST',
    path: '/v1/nodes/register',
    authenticated: true,
    capability: 'node.register',
    summary: 'Register a runtime node against an enrollment ticket',
  },
  { method: 'GET', path: '/v1/nodes', authenticated: true, summary: 'List runtime nodes in the caller tenant' },
  {
    method: 'POST',
    path: '/v1/nodes/attest',
    authenticated: true,
    capability: 'node.register',
    summary: 'Submit an attestation quote for a runtime node',
  },
  {
    method: 'POST',
    path: '/v1/workloads',
    authenticated: true,
    capability: 'workload.submit',
    summary: 'Submit a workload for authorization, routing and admission',
  },
  {
    method: 'POST',
    path: '/v1/workloads/run',
    authenticated: true,
    capability: 'workload.submit',
    summary: 'Execute an admitted workload',
  },
  { method: 'GET', path: '/v1/workloads', authenticated: true, summary: 'List workloads in the caller tenant' },
  {
    method: 'POST',
    path: '/v1/agents',
    authenticated: true,
    capability: 'agent.register',
    summary: 'Register a logical agent identity',
  },
  { method: 'GET', path: '/v1/agents', authenticated: true, summary: 'Agent registry statistics for the caller tenant' },
  {
    method: 'POST',
    path: '/v1/control/commands',
    authenticated: true,
    capability: 'node.control',
    summary: 'Issue a kill-switch command',
  },
  { method: 'GET', path: '/v1/audit', authenticated: true, summary: 'Tenant-scoped audit ledger view' },
  {
    method: 'GET',
    path: '/v1/fleet/health',
    authenticated: true,
    capability: 'node.control',
    summary: 'Cross-tenant fleet health through the documented privileged bypass path',
  },
];

export type HandlerResult = { status: number; body: unknown };

type Handler = (context: {
  principal: AuthenticatedPrincipal | null;
  tenant: TenantRef | null;
  body: Record<string, unknown>;
  query: URLSearchParams;
}) => HandlerResult;

function requireString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new RuntimeError('malformed', `The field \`${field}\` is required.`, { field }, 400);
  }
  return value;
}

function requireObject<T>(body: Record<string, unknown>, field: string): T {
  const value = body[field];
  if (!value || typeof value !== 'object') {
    throw new RuntimeError('malformed', `The field \`${field}\` is required.`, { field }, 400);
  }
  return value as T;
}

/**
 * The runtime control surface.
 *
 * Two properties hold for every authenticated route: the tenant comes from the
 * verified principal and never from the request body, and a caller-supplied
 * tenant that disagrees with the principal is refused rather than ignored. The
 * handler table is exported separately from the HTTP transport so both can be
 * exercised directly.
 */
export function createRuntimeHandlers(plane: RuntimePlane): Record<string, Handler> {
  const assertTenantMatch = (principal: AuthenticatedPrincipal, body: Record<string, unknown>) => {
    const claimed = body.tenant as TenantRef | undefined;
    if (!claimed) return;
    if (
      claimed.organizationId !== principal.tenant.organizationId ||
      claimed.universeId !== principal.tenant.universeId
    ) {
      plane.audit.append({
        tenant: principal.tenant,
        category: 'security',
        kind: 'api_tenant_claim_refused',
        subjectId: principal.principalId,
        principalId: principal.principalId,
        detail: { claimed },
      });
      throw new RuntimeError('isolation_violation', 'The requested tenant does not match the verified requester.', {
        claimed,
      });
    }
  };

  return {
    'GET /healthz': () => ({
      status: 200,
      body: { ok: true, version: plane.version, contractVersion: RUNTIME_CONTRACT_VERSION },
    }),

    'GET /v1/contract': () => ({
      status: 200,
      body: { contractVersion: RUNTIME_CONTRACT_VERSION, routes: RUNTIME_ROUTES },
    }),

    'POST /v1/nodes/enroll': ({ principal, body }) => {
      const verified = principal as AuthenticatedPrincipal;
      assertTenantMatch(verified, body);
      const serial = requireString(body, 'serial');
      const hardware = (body.hardware as HardwareProfile | undefined) ?? plane.hostHardware.profile;
      const ticket = plane.nodes.issueEnrollment({
        principal: verified,
        tenant: verified.tenant,
        fingerprint: NodeRegistry.nodeFingerprint({
          serial,
          platform: hardware.classId,
          publicKey: `pk_${serial}`,
        }),
        hardware,
        capacity:
          (body.capacity as { cpuMillis: number; gpuMillis: number; ramMb: number; concurrentWorkloads: number }) ?? {
            cpuMillis: 600_000,
            gpuMillis: 0,
            ramMb: 8_192,
            concurrentWorkloads: 32,
          },
      });
      return { status: 201, body: { ticket } };
    },

    'POST /v1/nodes/register': ({ principal, body }) => {
      const verified = principal as AuthenticatedPrincipal;
      assertTenantMatch(verified, body);
      const ticket = requireObject<Parameters<typeof plane.nodes.register>[0]>(body, 'ticket');
      if (
        ticket.tenant.organizationId !== verified.tenant.organizationId ||
        ticket.tenant.universeId !== verified.tenant.universeId
      ) {
        throw new RuntimeError('isolation_violation', 'This enrollment ticket belongs to another tenant.', {});
      }
      const result = plane.nodes.register(ticket, { fingerprint: requireString(body, 'fingerprint') });
      plane.telemetry.claimNodeOwner(result.node.nodeId, verified.principalId);
      return { status: result.created ? 201 : 200, body: { node: result.node, created: result.created } };
    },

    'GET /v1/nodes': ({ tenant }) => ({
      status: 200,
      body: {
        nodes: plane.nodes.list(tenant as TenantRef).map((node) => ({
          ...node,
          attestation: plane.attestation.evaluate(node.nodeId).status,
        })),
      },
    }),

    'POST /v1/nodes/attest': ({ principal, tenant, body }) => {
      const verified = principal as AuthenticatedPrincipal;
      assertTenantMatch(verified, body);
      const node = plane.nodes.require(tenant as TenantRef, requireString(body, 'nodeId'));
      const record = plane.attestation.submit({
        node,
        measurements: (body.measurements as Record<string, string>) ?? {},
        validForMs: typeof body.validForMs === 'number' ? body.validForMs : undefined,
      });
      return { status: 201, body: { attestation: { ...record, signature: undefined }, verdict: record.verdict } };
    },

    'POST /v1/workloads': ({ principal, body }) => {
      const verified = principal as AuthenticatedPrincipal;
      assertTenantMatch(verified, body);
      const spec = requireObject<WorkloadSpec>(body, 'spec');
      // The submitted spec is re-scoped to the verified principal's tenant so a
      // spec body cannot select a tenant the caller does not hold.
      const scoped: WorkloadSpec = { ...spec, tenant: verified.tenant };
      const outcome = plane.engine.submit({ token: requireString(body, '__token'), spec: scoped });
      return {
        status: outcome.rejection ? 422 : 202,
        body: {
          workloadId: outcome.record.workloadId,
          state: outcome.record.state,
          nodeId: outcome.record.nodeId,
          rejection: outcome.rejection,
          acceptanceMs: outcome.record.acceptanceMs,
          schedulingMs: outcome.record.schedulingMs,
        },
      };
    },

    'POST /v1/workloads/run': ({ tenant, body }) => {
      const workloadId = requireString(body, 'workloadId');
      // Resolving through the tenant store first means a foreign workload id is
      // a 404 for this caller rather than an execution.
      const record = plane.workloadStore.get(tenant as TenantRef, workloadId);
      if (!record) throw new RuntimeError('not_found', 'No such workload for this requester.', { workloadId }, 404);
      const outcome = plane.engine.run({
        workloadId,
        iterations: typeof body.iterations === 'number' ? Math.min(200_000, body.iterations) : undefined,
      });
      return {
        status: 200,
        body: {
          workloadId,
          state: outcome.record.state,
          startLatencyMs: outcome.record.startLatencyMs,
          usage: outcome.usage,
          error: outcome.error,
        },
      };
    },

    'GET /v1/workloads': ({ tenant }) => ({
      status: 200,
      body: {
        workloads: plane.workloadStore.list(tenant as TenantRef).map((record) => ({
          workloadId: record.workloadId,
          state: record.state,
          nodeId: record.nodeId,
          classification: record.spec.classification,
          acceptanceMs: record.acceptanceMs,
          schedulingMs: record.schedulingMs,
          startLatencyMs: record.startLatencyMs,
        })),
      },
    }),

    'POST /v1/agents': ({ principal, body }) => {
      const verified = principal as AuthenticatedPrincipal;
      assertTenantMatch(verified, body);
      const agent = plane.agents.register({
        tenant: verified.tenant,
        agentKey: requireString(body, 'agentKey'),
        classification: (body.classification as WorkloadSpec['classification']) ?? 'internal',
      });
      return { status: 201, body: { agent } };
    },

    'GET /v1/agents': ({ tenant }) => ({
      status: 200,
      body: {
        registeredForTenant: plane.agents.countForTenant(tenant as TenantRef),
        stats: plane.agents.stats(),
      },
    }),

    'POST /v1/control/commands': ({ principal, body }) => {
      const verified = principal as AuthenticatedPrincipal;
      assertTenantMatch(verified, body);
      const command = plane.control.issue({
        principal: verified,
        kind: requireString(body, 'kind') as ControlCommandKind,
        targetId: requireString(body, 'targetId'),
        tenant: verified.tenant,
        reason: requireString(body, 'reason'),
      });
      return { status: 200, body: { command } };
    },

    'GET /v1/audit': ({ tenant, query }) => {
      const limit = Math.min(500, Number(query.get('limit') ?? '50') || 50);
      const events = plane.audit.listForTenant(tenant as TenantRef).slice(-limit);
      return { status: 200, body: { events, chain: plane.audit.verifyChain() } };
    },

    'GET /v1/fleet/health': ({ principal }) => ({
      status: 200,
      body: { nodes: plane.fleetHealth((principal as AuthenticatedPrincipal).principalId) },
    }),
  };
}

export type RuntimeRequest = {
  method: string;
  path: string;
  query?: URLSearchParams;
  token?: string | null;
  body?: Record<string, unknown>;
};

export type RuntimeResponse = { status: number; body: unknown; headers: Record<string, string> };

/**
 * Transport-independent dispatch. HTTP and the contract tests both go through
 * this one function so there is no second, differently-behaved code path.
 */
export function dispatch(plane: RuntimePlane, handlers: Record<string, Handler>, request: RuntimeRequest): RuntimeResponse {
  const headers = {
    'content-type': 'application/json',
    'x-xiv-contract-version': RUNTIME_CONTRACT_VERSION,
    'cache-control': 'no-store',
  };
  const key = `${request.method} ${request.path}`;
  const route = RUNTIME_ROUTES.find((entry) => `${entry.method} ${entry.path}` === key);

  if (!route) {
    const pathExists = RUNTIME_ROUTES.some((entry) => entry.path === request.path);
    return {
      status: pathExists ? 405 : 404,
      headers,
      body: { error: pathExists ? 'method_not_allowed' : 'not_found', path: request.path },
    };
  }

  let principal: AuthenticatedPrincipal | null = null;
  if (route.authenticated) {
    try {
      principal = plane.principals.verify(request.token ?? null);
    } catch (error) {
      return { status: 401, headers, body: { error: errorCodeOf(error), message: 'A verified requester is required.' } };
    }
    if (route.capability && !principal.capabilities.includes(route.capability as never)) {
      plane.audit.append({
        tenant: principal.tenant,
        category: 'security',
        kind: 'api_capability_denied',
        subjectId: key,
        principalId: principal.principalId,
        detail: { capability: route.capability },
      });
      return {
        status: 403,
        headers,
        body: { error: 'unauthorized', message: `This requester lacks \`${route.capability}\`.` },
      };
    }
  }

  const handler = handlers[key];
  if (!handler) {
    // A documented route with no handler is a contract break, and is reported
    // as one instead of a generic 404.
    return { status: 501, headers, body: { error: 'route_not_implemented', route: key } };
  }

  try {
    const body = { ...(request.body ?? {}) };
    // The verified token is threaded to handlers internally. A caller-supplied
    // value is discarded first so a request body cannot smuggle one in.
    delete body.__token;
    if (principal && request.token) body.__token = request.token;
    const result = handler({
      principal,
      tenant: principal?.tenant ?? null,
      body,
      query: request.query ?? new URLSearchParams(),
    });
    return { status: result.status, headers, body: result.body };
  } catch (error) {
    if (isRuntimeError(error)) {
      return { status: error.status, headers, body: { error: error.code, message: error.message, detail: error.detail } };
    }
    return { status: 500, headers, body: { error: 'internal_error' } };
  }
}

function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        // The remainder is drained rather than the socket destroyed: killing the
        // connection mid-upload would surface as a transport error to the client
        // instead of the 413 the contract promises.
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (tooLarge) {
        reject(new RuntimeError('malformed', 'Request body too large.', { maxBytes: MAX_BODY_BYTES }, 413));
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(new RuntimeError('malformed', 'The request body must be a JSON object.', {}, 400));
          return;
        }
        resolve(parsed as Record<string, unknown>);
      } catch {
        reject(new RuntimeError('malformed', 'The request body is not valid JSON.', {}, 400));
      }
    });
    request.on('error', reject);
  });
}

export function createRuntimeServer(plane: RuntimePlane): Server {
  const handlers = createRuntimeHandlers(plane);
  return createServer((request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? '/', 'http://runtime.local');
    const send = (result: RuntimeResponse) => {
      response.writeHead(result.status, result.headers);
      response.end(JSON.stringify(result.body));
    };
    const authorization = request.headers.authorization ?? '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;

    void (async () => {
      let body: Record<string, unknown> = {};
      try {
        if (request.method === 'POST') body = await readBody(request);
      } catch (error) {
        send({
          status: isRuntimeError(error) ? error.status : 400,
          headers: { 'content-type': 'application/json', 'x-xiv-contract-version': RUNTIME_CONTRACT_VERSION },
          body: { error: errorCodeOf(error) },
        });
        return;
      }
      send(
        dispatch(plane, handlers, {
          method: request.method ?? 'GET',
          path: url.pathname,
          query: url.searchParams,
          token,
          body,
        }),
      );
    })();
  });
}

const invokedDirectly = process.argv[1]?.endsWith('server.ts') ?? false;

if (invokedDirectly) {
  const plane = new RuntimePlane();
  const port = Number(process.env.RUNTIME_PORT ?? 8788);
  createRuntimeServer(plane).listen(port, () => {
    console.info(`[runtime] control surface listening on :${port} contract ${RUNTIME_CONTRACT_VERSION}`);
  });
}
