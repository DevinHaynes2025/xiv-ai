import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { assertConsoleIdentity, buildSystemSnapshot, type ConsoleEvidence, type ConsoleIdentity, type SystemSnapshot } from './offline-system-snapshot';

export function isConsoleLoopback(address: string | undefined): boolean {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

/** Scope is supplied by the local host, never selected by the request. Local OS access is the trust boundary. */
export function createConsoleHandler(scope: ConsoleIdentity, evidence: ConsoleEvidence, render: (snapshot: SystemSnapshot) => string) {
  // Validate and detach host evidence once; later caller mutations cannot change the console.
  const pinned = buildSystemSnapshot(scope, scope, evidence);
  const privateScope = Object.freeze({ tenantId: scope.tenantId, universeId: scope.universeId, requesterId: scope.requesterId });
  return (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const deny = (status: number) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end('{"error":"SYSTEM_SNAPSHOT_REFUSED"}'); };
    try {
      if (!isConsoleLoopback(req.socket.remoteAddress) || !isConsoleLoopback(req.socket.localAddress)) return deny(403);
      const host = req.headers.host;
      if (!host || !/^(127\.0\.0\.1|localhost|\[::1\])(?::[0-9]{1,5})?$/.test(host)) return deny(403);
      if (Object.keys(req.headers).some(key => key === 'forwarded' || key.startsWith('x-forwarded-')) ||
          (req.headers.origin && req.headers.origin !== `http://${host}`) ||
          (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(String(req.headers['sec-fetch-site'])))) return deny(403);
      if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return deny(405); }
      if (!req.url || req.url.length > 512 || !req.url.startsWith('/') || req.url.startsWith('//')) return deny(400);
      const url = new URL(req.url, `http://${host}`);
      if (!['/system', '/api/system/snapshot'].includes(url.pathname)) return deny(404);
      const keys = [...url.searchParams.keys()];
      if (keys.length !== 3 || new Set(keys).size !== 3 || keys.some(key => !['tenantId', 'universeId', 'requesterId'].includes(key))) return deny(403);
      const requested = Object.fromEntries(url.searchParams);
      assertConsoleIdentity(privateScope, requested);
      const snapshot = pinned;
      const html = url.pathname === '/system';
      const body = html ? render(snapshot) : JSON.stringify(snapshot);
      if (Buffer.byteLength(body) > 65_536) return deny(500);
      res.writeHead(200, { 'Content-Type': html ? 'text/html; charset=utf-8' : 'application/json' });
      res.end(body);
    } catch { deny(403); }
  };
}

/** No caller-controlled bind address. Does not listen until explicitly called by a local host. */
export function listenOfflineConsole(scope: ConsoleIdentity, evidence: ConsoleEvidence, render: (snapshot: SystemSnapshot) => string, port = 6060) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('SYSTEM_SNAPSHOT_REFUSED');
  const server = createServer({ maxHeaderSize: 4096 }, createConsoleHandler(scope, evidence, render));
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.listen(port, '127.0.0.1');
  return server;
}
