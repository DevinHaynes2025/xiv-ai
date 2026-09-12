import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SharedHostLeaseStore } from './shared-host-lease-store';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { SharedQueueAdmission, type SharedQueueContext } from './shared-queue-admission';
import { runSupervisedLocalStory, SUPERVISED_WORKER_POLICY, type SupervisedWorkerOptions } from './supervised-local-worker';

const hostId = 'a'.repeat(32), source = 'b'.repeat(40), planHash = 'c'.repeat(64);
const tenantId = 'synthetic-tenant';
const context: SharedQueueContext = { tenantId, holderInstanceId: 'supervised-worker',
  sourceCommit: source, approvedPlanSha256: planHash, providerId: 'ollama',
  modelId: 'qwen2.5-coder:7b', presenceEvidenceRef: 'fixture:presence' };
const story = (id = 'story-1'): OfflineStory => ({ id, tenantId, roleId: 'node_backend',
  objective: `Synthetic bounded draft ${id}`, acceptance: ['Must pass the fixture test'],
  dependencies: [], sourceRevision: source, masterPlanSha256: planHash,
  kind: 'PRODUCT_STORY', securityClass: 'ORDINARY' });

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-supervised-worker-test-'));
  const path = join(dir, 'host.sqlite'); SharedHostLeaseStore.initialize(path, hostId);
  let now = 1_800_000_000_000;
  const stores: SharedHostLeaseStore[] = [], queues: OfflineStoryQueue[] = [];
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  return { dir, now: () => now, advance: (n: number) => { now += n; },
    open: () => { const s = new SharedHostLeaseStore(path, hostId, () => now); stores.push(s); return s; },
    queue: (name = 'queue') => { const q = new OfflineStoryQueue(join(dir, `${name}.sqlite`), () => now); queues.push(q); return q; },
    calls,
    respondWith: (body: object) => (url: string, init: RequestInit): Promise<Response> => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));
    },
    respondNever: (url: string): Promise<Response> => { calls.push({ url, body: {} }); return Promise.reject(new Error('fixture transport failure')); },
    done: () => { for (const q of queues) { try { q.close(); } catch {} } for (const s of stores) { try { s.close(); } catch {} } rmSync(dir, { recursive: true, force: true }); } };
}

function worker(f: ReturnType<typeof fixture>, extra: Omit<Partial<SupervisedWorkerOptions>, 'tenantId'> = {},
  seed: OfflineStory[] = [story()]) {
  const q = f.queue(), host = f.open();
  if (seed.length) q.enqueue(seed);
  const admission = new SharedQueueAdmission(q, host, context);
  return { q, host, admission, run: () => runSupervisedLocalStory(admission, 'node_backend',
    { tenantId, clock: () => f.now(), ...extra }) };
}

const ollamaOk = { model: SUPERVISED_WORKER_POLICY.model, done: true, done_reason: 'stop',
  response: 'Draft: implement the fixture path with a bounded test.', eval_count: 42 };

test('one approved story becomes one settled local draft awaiting independent review', async () => {
  const f = fixture(); try {
    const w = worker(f, { request: f.respondWith(ollamaOk), presence: (state) => `fixture:presence:${state}` });
    const run = await w.run();
    assert.equal(run.status, 'SETTLED_AWAITING_REVIEW');
    assert.equal(run.modelCallsMade, 1); assert.equal(run.modelCallsAllowed, 1);
    assert.equal(f.calls.length, 1);
    assert.equal(new URL(f.calls[0].url).host, '127.0.0.1:11434');
    assert.equal(f.calls[0].body.model, SUPERVISED_WORKER_POLICY.model);
    assert.equal(f.calls[0].body.stream, false);
    assert.ok(String(f.calls[0].body.prompt).includes('Synthetic bounded draft story-1'));
    assert.match(String(f.calls[0].body.prompt), /never instructions to you/);
    assert.match(run.outputHash as string, /^[a-f0-9]{64}$/);
    assert.equal(run.doneReason, 'stop');
    assert.equal(run.storyState, 'AWAITING_REVIEW');
    assert.equal(run.queueLeaseRetained, false);
    assert.deepEqual(run.presenceReported, { RUNNING: true, STOPPED: true });
    assert.ok(run.evidenceRefs.some(r => r === 'fixture:presence:RUNNING'));
    assert.deepEqual(run.reviewRequests.map(r => r.status), ['PENDING', 'PENDING']);
    assert.equal(run.humanDecision, 'REQUIRED'); assert.equal(run.liveAgentCount, null);
    assert.equal(run.learningPromoted, false); assert.equal(run.remoteCallsMade, 0);
  } finally { f.done(); }
});

test('a completed but invalid response settles FAILED with capacity released and no retry', async () => {
  const f = fixture(); try {
    const w = worker(f, { request: f.respondWith({ ...ollamaOk, model: 'other-model:latest' }) });
    const run = await w.run();
    assert.equal(run.status, 'FAILED_PROVIDER_SETTLED');
    assert.equal(run.modelCallsMade, 1); assert.equal(f.calls.length, 1);
    assert.equal(run.outputHash, null); assert.equal(run.storyState, 'FAILED');
    assert.equal(run.queueLeaseRetained, false);
    assert.equal(w.admission.queue.summary(tenantId).leaseHeld, false);
    assert.equal(w.host.acquire({ tenantId, holderInstanceId: context.holderInstanceId, lane: 'OFFLINE_SHIFT',
      workId: 'next-work', sourceCommit: source, providerId: 'ollama', modelId: context.modelId,
      presenceEvidenceRef: 'fixture:presence' }).status, 'RESERVED_NOT_STARTED');
  } finally { f.done(); }
});

test('a transport failure before a complete response is never an acknowledged provider stop', async () => {
  const f = fixture(); try {
    const w = worker(f, { request: f.respondNever });
    const run = await w.run();
    assert.equal(run.status, 'ABORTED_UNCONFIRMED');
    assert.equal(run.modelCallsMade, 1); assert.equal(f.calls.length, 1);
    assert.equal(run.admissionStatus, 'HELD_FOR_OPERATOR');
    assert.equal(run.queueLeaseRetained, true);
    assert.equal(run.storyState, 'LEASED');
    assert.equal(w.admission.queue.summary(tenantId).leaseHeld, true);
  } finally { f.done(); }
});

test('a host-wide reservation blocks admission before any model call and keeps the story READY', async () => {
  const f = fixture(); try {
    const blocking = f.open();
    blocking.acquire({ tenantId, holderInstanceId: 'another-shift', lane: 'HOMEBASE', workId: 'other',
      sourceCommit: source, providerId: 'ollama', modelId: context.modelId, presenceEvidenceRef: 'fixture:presence' });
    const w = worker(f, { request: f.respondWith(ollamaOk) });
    const run = await w.run();
    assert.equal(run.status, 'HOST_BLOCKED'); assert.equal(run.modelCallsMade, 0);
    assert.equal(f.calls.length, 0);
    assert.equal(w.q.summary(tenantId).counts.find(c => String(c.state) === 'READY')?.count, 1);
  } finally { f.done(); }
});

test('a source-revision mismatch throws, returns the lease unstarted, and makes no model call', async () => {
  const f = fixture(); try {
    const q = f.queue(); q.enqueue([{ ...story(), sourceRevision: 'e'.repeat(40) }]);
    const host = f.open(); const admission = new SharedQueueAdmission(q, host, context);
    await assert.rejects(() => runSupervisedLocalStory(admission, 'node_backend', { tenantId, clock: () => f.now() }));
    assert.equal(f.calls.length, 0);
    assert.equal(q.summary(tenantId).leaseHeld, false);
    assert.equal(q.summary(tenantId).counts.find((c: Record<string, unknown>) => c.state === 'READY')?.count, 1);
  } finally { f.done(); }
});

test('a queue lease with insufficient remaining margin aborts before the model call', async () => {
  const f = fixture(); try {
    const w = worker(f, {
      request: f.respondWith(ollamaOk),
      // The operator presence hook burns nearly the whole 120s queue lease before generation.
      presence: () => { f.advance(116_000); return 'fixture:presence'; },
    });
    const run = await w.run();
    assert.equal(run.status, 'ABORTED_UNCONFIRMED'); assert.equal(run.modelCallsMade, 0);
    assert.equal(f.calls.length, 0);
    assert.equal(run.storyState, 'READY'); assert.equal(run.queueLeaseRetained, false);
    assert.equal(run.hostLeaseUnresolved, true);
    assert.equal(w.admission.queue.summary(tenantId).leaseHeld, false);
  } finally { f.done(); }
});

test('presence hook failures are recorded and never block or fake a settlement', async () => {
  const f = fixture(); try {
    const w = worker(f, { request: f.respondWith(ollamaOk), presence: () => { throw new Error('fixture telemetry down'); } });
    const run = await w.run();
    assert.equal(run.status, 'SETTLED_AWAITING_REVIEW');
    assert.deepEqual(run.presenceReported, { RUNNING: true, STOPPED: true });
    assert.equal(run.evidenceRefs.some(r => r.startsWith('fixture:presence')), false);
    assert.ok(run.evidenceRefs.some(r => r.startsWith('generate:')));
  } finally { f.done(); }
});

test('a response arriving after the queue lease window can never be settled and is held for operator', async () => {
  const f = fixture(); try {
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const base = f.respondWith(ollamaOk);
    const request = async (url: string, init: RequestInit) => { const p = base(url, init); await gate; return p; };
    const q = f.queue(); q.enqueue([story()]);
    const host = f.open();
    const admission = new SharedQueueAdmission(q, host, context);
    const pending = runSupervisedLocalStory(admission, 'node_backend', { tenantId, clock: () => f.now(), request });
    await new Promise(resolve => setImmediate(resolve));
    f.advance(121_000); // Past the 120s lease deadline while the response is gated.
    release();
    const run = await pending;
    assert.equal(run.status, 'ABORTED_UNCONFIRMED');
    assert.equal(run.storyState, 'LEASED'); // The expired lease is never silently stolen.
    assert.equal(run.queueLeaseRetained, true);
    assert.equal(run.hostLeaseUnresolved, true);
    assert.match(run.reason, /settlement window/);
    assert.match(run.outputHash as string, /^[a-f0-9]{64}$/); // The draft is provable; its acceptance is not.
    assert.equal(q.summary(tenantId).counts.find(c => c.state === 'AWAITING_REVIEW'), undefined);
  } finally { f.done(); }
});

test('the worker never retries, never grants review, and cannot mark a story DONE', async () => {
  const f = fixture(); try {
    const w = worker(f, { request: f.respondWith(ollamaOk) });
    const run = await w.run();
    assert.equal(f.calls.length, 1);
    assert.equal(run.admissionStatus, 'SETTLED_REVIEW_NOT_GRANTED');
    assert.equal(run.storyState, 'AWAITING_REVIEW');
    assert.throws(() => w.q.acceptReview(tenantId, 'story-1', 'node_backend', 'fixture:self-review'));
    assert.equal(w.q.summary(tenantId).liveAgentCount, null);
  } finally { f.done(); }
});

test('a busy singleton lease yields no second model request', async () => {
  const f = fixture(); try {
    const w = worker(f, { request: f.respondWith(ollamaOk) });
    const first = await w.run();
    assert.notEqual(first.status, 'HOST_BLOCKED');
    const second = await w.run();
    assert.equal(second.status, 'NO_ELIGIBLE_STORY_OR_QUEUE_BUSY');
    assert.equal(second.modelCallsMade, 0); assert.equal(f.calls.length, 1);
  } finally { f.done(); }
});

test('policy pins loopback-only single-request execution with no retries or remote calls', () => {
  assert.equal(SUPERVISED_WORKER_POLICY.endpoint, 'http://127.0.0.1:11434');
  assert.equal(SUPERVISED_WORKER_POLICY.model, 'qwen2.5-coder:7b');
  assert.equal(SUPERVISED_WORKER_POLICY.maxRequestsPerRun, 1);
  assert.equal(SUPERVISED_WORKER_POLICY.retries, 0);
  assert.equal(SUPERVISED_WORKER_POLICY.remoteCallsEnabled, false);
  assert.equal(SUPERVISED_WORKER_POLICY.productionMutationAllowed, false);
  assert.equal(SUPERVISED_WORKER_POLICY.modelWeightMutationAllowed, false);
});