import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildSystemSnapshot } from '../ai/runtime/offline-team/offline-system-snapshot';
import { createConsoleHandler, isConsoleLoopback } from '../ai/runtime/offline-team/offline-system-console-http';
import { renderOfflineConsole, startOfflineConsole } from './offline-console';
import { loadLocalConsoleEvidence } from './offline-console-local';

const scope = { tenantId: 'tenant-a', universeId: 'universe-a', requesterId: 'operator-a' };
const evidence = () => ({ identity: { ...scope }, installedModels: [{ name: 'qwen2.5-coder:7b', sizeBytes: 42 }], pendingReviews: 3 });
const query = new URLSearchParams(scope).toString();

test('local startup discovers inventory only with the explicit flag', async () => {
  let calls = 0;
  const read = async () => { calls++; return [{ name: 'qwen2.5:3b', sizeBytes: 42 }]; };
  assert.equal((await loadLocalConsoleEvidence([], read)).installedModels, null);
  assert.equal(calls, 0);
  for (const args of [['--remote'], ['--ollama', '--ollama'], ['--ollama', 'http://example.com']]) {
    await assert.rejects(loadLocalConsoleEvidence(args, read), /Usage:/);
  }
  assert.equal(calls, 0);
  const input = await loadLocalConsoleEvidence(['--ollama'], read);
  assert.equal(calls, 1);
  assert.equal(input.pendingReviews, null);
  const snapshot = buildSystemSnapshot(input.identity, input.identity, input);
  assert.equal(snapshot.installedModels?.length, 1);
  assert.equal(snapshot.readiness, 'EVIDENCE_UNAVAILABLE');
  assert.ok(!renderOfflineConsole(snapshot).includes('qwen2.5'));
  assert.equal((await loadLocalConsoleEvidence(['--ollama'], async () => null)).installedModels, null);
});

test('canonical SHA-256, nested freezing, detached inputs, and honest flags', () => {
  const input = evidence();
  const snapshot = buildSystemSnapshot(scope, scope, input);
  const { receipt, ...payload } = snapshot;
  assert.equal(receipt.digest, createHash('sha256').update(JSON.stringify(payload)).digest('hex'));
  assert.equal(snapshot.mode, 'OFFLINE_ONLY');
  assert.equal(snapshot.ci, 'CI_UNVERIFIED');
  assert.equal(snapshot.readiness, 'METADATA_READY');
  for (const value of [snapshot, snapshot.identity, snapshot.installedModels, snapshot.installedModels![0], receipt]) assert.ok(Object.isFrozen(value));
  input.installedModels[0].sizeBytes = 9;
  assert.equal(snapshot.installedModels![0].sizeBytes, 42);
  const a = { ...evidence(), installedModels: [{ name: 'b', sizeBytes: 2 }, { name: 'a', sizeBytes: 1 }] };
  assert.equal(buildSystemSnapshot(scope, scope, a).receipt.digest, buildSystemSnapshot(scope, scope, { ...a, installedModels: [...a.installedModels].reverse() }).receipt.digest);
  assert.notEqual(snapshot.receipt.digest, buildSystemSnapshot(scope, scope, input).receipt.digest);
});

test('all identity dimensions are enforced against request and evidence', () => {
  for (const key of Object.keys(scope)) {
    assert.throws(() => buildSystemSnapshot(scope, { ...scope, [key]: 'other' }, evidence()), /SYSTEM_SNAPSHOT_REFUSED/);
    assert.throws(() => buildSystemSnapshot(scope, scope, { ...evidence(), identity: { ...scope, [key]: 'other' } }), /SYSTEM_SNAPSHOT_REFUSED/);
  }
  assert.throws(() => buildSystemSnapshot(scope, { ...scope, path: '/tmp' }, evidence()));
});

test('fail-closed bounds and redaction never echo raw values', () => {
  for (const value of [undefined, {}, null, { ...evidence(), secret: 'sensitive' },
    { ...evidence(), pendingReviews: -1 }, { ...evidence(), pendingReviews: 2_000_001 },
    { ...evidence(), pendingReviews: NaN }, { ...evidence(), pendingReviews: 0.5 },
    { ...evidence(), installedModels: Array(33).fill({ name: 'a', sizeBytes: 1 }) },
    { ...evidence(), installedModels: Array(2).fill({ name: 'a', sizeBytes: 1 }) },
    { ...evidence(), installedModels: [{ name: 'secret-token', sizeBytes: 1 }] },
    { ...evidence(), installedModels: [{ name: 'npm_abcdefghijklmnopqrstuvwxyz0123456789', sizeBytes: 1 }] },
    { ...evidence(), installedModels: [{ name: 'github_pat_abcdefghijklmnopqrstuvwxyz', sizeBytes: 1 }] },
    { ...evidence(), installedModels: [{ name: '../model', sizeBytes: 1 }] },
    { ...evidence(), installedModels: [{ name: 'model', sizeBytes: Infinity }] },
    { ...evidence(), installedModels: [{ name: 'model', sizeBytes: 1, path: '/private' }] },
    { ...evidence(), installedModels: Array(1) }]) {
    assert.throws(() => buildSystemSnapshot(scope, scope, value), { message: 'SYSTEM_SNAPSHOT_REFUSED' });
  }
  let invoked = false;
  assert.throws(() => buildSystemSnapshot(scope, scope, { ...evidence(), get pendingReviews() { invoked = true; return 0; } }));
  assert.equal(invoked, false);
  const accessorModels = [{ name: 'model', sizeBytes: 1 }];
  Object.defineProperty(accessorModels, '0', { get() { invoked = true; return { name: 'model', sizeBytes: 1 }; } });
  assert.throws(() => buildSystemSnapshot(scope, scope, { ...evidence(), installedModels: accessorModels }));
  assert.equal(invoked, false);
});

test('unknown evidence is distinct from a measured zero; largest response remains bounded', () => {
  const unknown = buildSystemSnapshot(scope, scope, { identity: scope, installedModels: null, pendingReviews: null });
  assert.equal(unknown.readiness, 'EVIDENCE_UNAVAILABLE');
  assert.equal(unknown.pendingReviews, null);
  const empty = buildSystemSnapshot(scope, scope, { identity: scope, installedModels: [], pendingReviews: 0 });
  assert.equal(empty.readiness, 'NO_INSTALLED_MODELS');
  assert.equal(empty.pendingReviews, 0);
  const max = buildSystemSnapshot(scope, scope, { identity: scope, pendingReviews: 2_000_000, installedModels: Array.from({ length: 32 }, (_, i) => ({ name: `model-${i}`, sizeBytes: 1_000_000_000_000 })) });
  assert.ok(Buffer.byteLength(JSON.stringify(max)) < 8192);
  assert.ok(Buffer.byteLength(renderOfflineConsole(max)) < 65_536);
});

function request(overrides: Record<string, unknown> = {}, localScope = scope, localEvidence = evidence()) {
  const handler = createConsoleHandler(localScope, localEvidence, renderOfflineConsole);
  let status = 0; let body = ''; const headers: Record<string, unknown> = {};
  const req = { method: 'GET', url: `/api/system/snapshot?${new URLSearchParams(localScope)}`, headers: { host: '127.0.0.1:6060' }, socket: { remoteAddress: '127.0.0.1', localAddress: '127.0.0.1' }, ...overrides };
  const res = { setHeader(key: string, value: unknown) { headers[key] = value; }, writeHead(code: number) { status = code; }, end(value: string) { body = value; } };
  handler(req as IncomingMessage, res as unknown as ServerResponse);
  return { status, body, headers };
}

test('transport refuses remote sockets, spoofed hosts, proxy headers, cross-origin and mutation requests', () => {
  for (const address of [undefined, '10.0.0.1', '127.0.0.1.evil', '::ffff:10.0.0.1']) assert.equal(isConsoleLoopback(address), false);
  for (const overrides of [
    { socket: { remoteAddress: '10.0.0.1', localAddress: '127.0.0.1' } },
    { socket: { remoteAddress: '127.0.0.1', localAddress: '10.0.0.1' } },
    { headers: { host: 'localhost.evil' } },
    { headers: { host: 'localhost:6060', 'x-forwarded-for': '127.0.0.1' } },
    { headers: { host: 'localhost:6060', origin: 'https://evil.invalid' } },
    { headers: { host: 'localhost:6060', 'sec-fetch-site': 'cross-site' } },
    { url: '/api/system/snapshot' }, { url: `/api/system/snapshot?${query}&tenantId=tenant-a` },
    { url: `/api/system/snapshot?${query}&path=/private` },
    { url: `/api/system/snapshot?${query.replace('operator-a', 'other')}` },
    { url: 'x'.repeat(513) }, { method: 'POST' }, { method: 'HEAD' }, { url: '/elsewhere' },
  ]) {
    const result = request(overrides);
    assert.ok(result.status >= 400);
    assert.equal(result.body, '{"error":"SYSTEM_SNAPSHOT_REFUSED"}');
    assert.equal(result.headers['Cache-Control'], 'no-store');
  }
});

test('API and blue-white frontend display the identical verified snapshot', () => {
  const api = request();
  assert.equal(api.status, 200);
  const html = request({ url: `/system?${query}` });
  assert.equal(html.status, 200);
  const snapshot = JSON.parse(api.body);
  for (const text of ['Offline System Console', 'OFFLINE_ONLY', 'CI_UNVERIFIED', 'Metadata ready', 'Pending reviews', 'LOCAL_MODEL', snapshot.receipt.digest]) assert.ok(html.body.includes(text), text);
  for (const raw of [...Object.values(scope), 'qwen2.5-coder:7b']) {
    assert.ok(!api.body.includes(raw));
    assert.ok(!html.body.includes(raw));
  }
  assert.ok(!html.body.includes('<script'));
  assert.ok(!html.body.includes('https://'));
  const unknownHtml = renderOfflineConsole(buildSystemSnapshot(scope, scope, { identity: scope, installedModels: null, pendingReviews: null }));
  assert.ok(unknownHtml.includes('Unknown'));
  assert.ok(unknownHtml.includes('Evidence unavailable'));
});

test('identity and model references are deterministic, domain-separated, and never raw', () => {
  const privateScope = { tenantId: 'alice', universeId: 'alice', requesterId: 'alice' };
  const input = { identity: privateScope, installedModels: [{ name: 'alice', sizeBytes: 1 }, { name: 'internal.example', sizeBytes: 2 }], pendingReviews: 0 };
  const snapshot = buildSystemSnapshot(privateScope, privateScope, input);
  assert.deepEqual(snapshot, buildSystemSnapshot(privateScope, privateScope, input));
  const expectedRef = (domain: string, value: string) => createHash('sha256').update(`xiv:${domain}:v1:${value}`).digest('hex');
  const refs = snapshot.identity;
  assert.deepEqual(refs, { tenantRef: expectedRef('tenant', 'alice'), universeRef: expectedRef('universe', 'alice'), requesterRef: expectedRef('requester', 'alice') });
  const aliceModel = snapshot.installedModels!.find(model => model.modelRef === expectedRef('model', 'alice'))!;
  assert.ok(aliceModel);
  assert.equal(new Set([...Object.values(refs), aliceModel.modelRef]).size, 4);
  for (const model of snapshot.installedModels!) {
    assert.deepEqual(Object.keys(model), ['label', 'modelRef', 'sizeBytes']);
    assert.equal(model.label, 'LOCAL_MODEL');
    assert.match(model.modelRef, /^[a-f0-9]{64}$/);
    assert.ok(Object.isFrozen(model));
  }
  const api = request({}, privateScope, input);
  const html = request({ url: `/system?${new URLSearchParams(privateScope)}` }, privateScope, input);
  assert.equal(api.status, 200);
  assert.equal(html.status, 200);
  for (const output of [JSON.stringify(snapshot), api.body, html.body]) {
    for (const raw of ['alice', 'internal.example', 'tenantId', 'universeId', 'requesterId']) assert.ok(!output.includes(raw), raw);
  }
  // Opaque references cannot substitute for the required raw requester identity.
  assert.equal(request({ url: `/api/system/snapshot?tenantId=alice&universeId=alice&requesterId=${refs.requesterRef}` }, privateScope, input).status, 403);
});

test('unsafe source values are refused without echo and unknown metadata cannot be serialized', () => {
  const unsafe = ['../private/model', 'C:\\private\\model', 'secret-token', 'sk-abcdefghijklmnopqrstuv', 'npm_abcdefghijklmnopqrstuvwxyz0123456789'];
  for (const raw of unsafe) {
    assert.throws(() => buildSystemSnapshot(scope, scope, { ...evidence(), installedModels: [{ name: raw, sizeBytes: 1 }] }), error => {
      assert.equal((error as Error).message, 'SYSTEM_SNAPSHOT_REFUSED');
      assert.ok(!JSON.stringify(error).includes(raw));
      return true;
    });
    const result = request({ url: `/api/system/snapshot?${new URLSearchParams({ ...scope, requesterId: raw })}` });
    assert.equal(result.status, 403);
    assert.equal(result.body, '{"error":"SYSTEM_SNAPSHOT_REFUSED"}');
    assert.ok(!result.body.includes(raw));
  }
  for (const key of ['hostname', 'username', 'path', 'endpoint', 'tags', 'source', 'prompt', 'environment', 'logs', 'commandLine']) {
    assert.throws(() => buildSystemSnapshot(scope, scope, { ...evidence(), installedModels: [{ name: 'model', sizeBytes: 1, [key]: 'private-value' }] }), { message: 'SYSTEM_SNAPSHOT_REFUSED' });
  }
  const generic = buildSystemSnapshot(scope, scope, { ...evidence(), installedModels: [{ name: 'unrecognized-private-value', sizeBytes: 1 }] });
  assert.equal(generic.installedModels![0].label, 'LOCAL_MODEL');
  assert.ok(!JSON.stringify(generic).includes('unrecognized-private-value'));
});

test('HTTP pins private scope and redacted evidence independently of caller mutation', () => {
  const privateScope = { ...scope };
  const input = evidence();
  const handler = createConsoleHandler(privateScope, input, renderOfflineConsole);
  privateScope.requesterId = 'other';
  input.identity.requesterId = 'other';
  input.installedModels[0].name = 'internal.example';
  let status = 0; let body = '';
  const res = { setHeader() {}, writeHead(value: number) { status = value; }, end(value: string) { body = value; } };
  const req = { method: 'GET', url: `/api/system/snapshot?${query}`, headers: { host: '127.0.0.1:6060' }, socket: { remoteAddress: '127.0.0.1', localAddress: '127.0.0.1' } };
  handler(req as IncomingMessage, res as unknown as ServerResponse);
  assert.equal(status, 200);
  assert.deepEqual(JSON.parse(body), buildSystemSnapshot(scope, scope, evidence()));
  assert.ok(!body.includes('internal.example'));
});

test('real loopback HTTP serves both routes without any provider access', async () => {
  const server = startOfflineConsole(scope, evidence(), 0);
  try {
    await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    assert.equal(address.address, '127.0.0.1');
    const base = `http://127.0.0.1:${address.port}`;
    const api = await fetch(`${base}/api/system/snapshot?${query}`);
    assert.equal(api.status, 200);
    const snapshot = await api.json();
    const html = await fetch(`${base}/system?${query}`);
    assert.equal(html.status, 200);
    assert.ok((await html.text()).includes(snapshot.receipt.digest));
    const denied = await fetch(`${base}/api/system/snapshot?${query}`, { method: 'POST' });
    assert.equal(denied.status, 405);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
