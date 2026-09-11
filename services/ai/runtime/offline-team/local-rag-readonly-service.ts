import * as http from 'node:http';
import { RetrievalSyncTelemetry, RetrievalStrategy } from './retrieval-sync-telemetry';

export interface LocalRagResult {
  id: string;
  text: string;
  score: number;
  securityClass: 'ORDINARY';
  evidenceRefs: string[];
  provenance: { sourceId: string; sourceType: string };
}

export interface LocalRagProvider {
  query(input: { tenantId: string; query: string; limit: number }): Promise<{ strategy: RetrievalStrategy; results: LocalRagResult[] }>;
}

export interface LocalRagServiceConfig {
  host?: string;
  port?: number;
  provider: LocalRagProvider;
  telemetry: RetrievalSyncTelemetry;
}

export function assertLoopbackHost(host: string): void {
  if (!['127.0.0.1', '::1', 'localhost'].includes(host.toLowerCase())) {
    throw new Error('Local RAG service must bind to loopback only');
  }
}

export async function dispatchLocalRagRequest(config: LocalRagServiceConfig, request: {
  method: string;
  path: string;
  body?: unknown;
}): Promise<{ status: number; body: unknown }> {
  const method = request.method.toUpperCase();
  if (request.path === '/health' && method === 'GET') return { status: 200, body: { status: 'READY', scope: 'LOCAL_READ_ONLY' } };
  if (request.path === '/metrics' && method === 'GET') return { status: 200, body: config.telemetry.snapshot() };
  if (request.path !== '/v1/rag/query') return { status: 404, body: { error: 'NOT_FOUND' } };
  if (method !== 'POST') return { status: 405, body: { error: 'READ_ONLY_QUERY_SURFACE' } };

  const body = (request.body ?? {}) as { tenantId?: unknown; query?: unknown; limit?: unknown };
  if (typeof body.tenantId !== 'string' || !body.tenantId.trim() || body.tenantId.length > 128) return { status: 400, body: { error: 'INVALID_TENANT' } };
  if (typeof body.query !== 'string' || !body.query.trim() || body.query.length > 4000) return { status: 400, body: { error: 'INVALID_QUERY' } };
  const limit = typeof body.limit === 'number' && Number.isInteger(body.limit) ? Math.max(1, Math.min(50, body.limit)) : 10;
  const response = await config.provider.query({ tenantId: body.tenantId, query: body.query, limit });
  const safeResults = response.results.filter((result) => result.securityClass === 'ORDINARY').slice(0, limit);
  config.telemetry.recordRetrieval({ hit: safeResults.length > 0, strategy: response.strategy });
  return { status: 200, body: { strategy: response.strategy, results: safeResults } };
}

export function createLocalRagReadonlyService(config: LocalRagServiceConfig): http.Server {
  const host = config.host ?? '127.0.0.1';
  assertLoopbackHost(host);
  const server = http.createServer(async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > 64 * 1024) throw new Error('REQUEST_TOO_LARGE');
        chunks.push(buffer);
      }
      let body: unknown = undefined;
      if (chunks.length > 0) body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const response = await dispatchLocalRagRequest(config, {
        method: req.method ?? 'GET',
        path: (req.url ?? '/').split('?')[0],
        body,
      });
      res.writeHead(response.status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(response.body));
    } catch (error: unknown) {
      const tooLarge = (error as Error)?.message === 'REQUEST_TOO_LARGE';
      res.writeHead(tooLarge ? 413 : 400, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ error: tooLarge ? 'REQUEST_TOO_LARGE' : 'BAD_REQUEST' }));
    }
  });
  return server;
}

export async function listenLocalRagReadonlyService(server: http.Server, config: Pick<LocalRagServiceConfig, 'host' | 'port'> = {}): Promise<{ host: string; port: number }> {
  const host = config.host ?? '127.0.0.1';
  assertLoopbackHost(host);
  const port = config.port ?? 17764;
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => { server.off('listening', onListening); reject(error); };
    const onListening = () => { server.off('error', onError); resolve(); };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
  const address = server.address();
  return { host, port: typeof address === 'object' && address ? address.port : port };
}
