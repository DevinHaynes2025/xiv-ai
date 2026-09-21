import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { LocalDraftQueue, runDraftTick } from './local-draft-worker';

test('task IDs require strings without coercion or queue mutation', () => {
  const queue = new LocalDraftQueue(':memory:');
  let coerced = false;
  const coercible = { toString() { coerced = true; return 'looks-valid'; } };
  try {
    const before = queue.status();
    for (const value of [123, true, null, undefined, ['looks-valid'], coercible]) {
      assert.throws(() => queue.enqueue(value as unknown as string, 'Synthetic task'), { message: 'TASK_REFUSED' });
      assert.deepEqual(queue.status(), before);
    }
    assert.equal(coerced, false);
    queue.enqueue('123', 'Synthetic task');
    assert.equal(queue.claim(0)?.id, '123');
  } finally { queue.close(); }
});

test('invalid clocks refuse before heartbeat, claim, or settlement can mutate state', () => {
  const queue = new LocalDraftQueue(':memory:');
  const invalid = [NaN, Infinity, -Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 239_999];
  try {
    queue.enqueue('clock-task', 'Propose a clock regression test');
    queue.heartbeat(100);
    const ready = queue.status();
    for (const now of invalid) {
      assert.throws(() => queue.heartbeat(now), { message: 'INVALID_QUEUE_CLOCK' });
      assert.throws(() => queue.claim(now), { message: 'INVALID_QUEUE_CLOCK' });
      assert.deepEqual(queue.status(), ready);
    }
    const job = queue.claim(100)!;
    const running = queue.status();
    for (const now of invalid) {
      assert.throws(() => queue.settle(job, now, 'Proposed test'), { message: 'INVALID_QUEUE_CLOCK' });
      assert.deepEqual(queue.status(), running);
      assert.equal(queue.drafts().length, 0);
    }
    assert.equal(queue.settle(job, 101, 'Proposed test'), 'AWAITING_REVIEW');
  } finally { queue.close(); }
});

test('settlement refuses non-string output without invoking methods or consuming the lease', () => {
  const queue = new LocalDraftQueue(':memory:');
  let invoked = false;
  const unexpected = () => { invoked = true; throw new Error('must not execute'); };
  const object = { trim: unexpected, toString: unexpected, [Symbol.toPrimitive]: unexpected };
  try {
    queue.enqueue('output-type', 'Propose an output validation test');
    const job = queue.claim(0)!;
    const before = queue.status();
    for (const value of [undefined, 123, true, 1n, Symbol('output'), [], {}, new String('draft'), object]) {
      assert.throws(() => queue.settle(job, 1, value as unknown as string), { message: 'OUTPUT_REFUSED' });
      assert.deepEqual(queue.status(), before);
      assert.equal(queue.drafts().length, 0);
    }
    assert.equal(invoked, false);
    assert.equal(queue.settle(job, 1, 'Proposed test'), 'AWAITING_REVIEW');
    assert.equal(queue.drafts()[0].output, 'Proposed test');
  } finally { queue.close(); }
});

test('largest accepted clock leaves safe-integer room for every retry delay', () => {
  const queue = new LocalDraftQueue(':memory:');
  const now = Number.MAX_SAFE_INTEGER - 240_000;
  try {
    queue.enqueue('clock-boundary', 'Propose a boundary test');
    queue.heartbeat(now);
    assert.equal(queue.status().heartbeat, now);
    const job = queue.claim(now)!;
    assert.equal(queue.settle(job, now, null), 'READY');
  } finally { queue.close(); }
});

test('idle and pause consume no model calls; completed drafts do not run again', async () => {
  const queue = new LocalDraftQueue(':memory:');
  let calls = 0;
  const caller = async () => { calls++; return { model: 'qwen2.5:3b', response: 'A code proposal, not executed.' }; };
  try {
    assert.equal(await runDraftTick(queue, caller), 'IDLE');
    queue.enqueue('task-1', 'Propose one regression test.');
    queue.control('PAUSED');
    assert.equal(await runDraftTick(queue, caller), 'IDLE');
    assert.equal(calls, 0);
    queue.control('RUNNING');
    assert.equal(await runDraftTick(queue, caller), 'AWAITING_REVIEW');
    assert.equal(await runDraftTick(queue, caller), 'IDLE');
    assert.equal(calls, 1);
    assert.equal(queue.drafts().length, 1);
    assert.equal(queue.status().automaticCodeApplication, false);
  } finally { queue.close(); }
});

test('disk queue persists results and two connections cannot claim overlapping work', async () => {
  const root = mkdtempSync(join(tmpdir(), 'xvi-draft-worker-'));
  const path = join(root, 'queue.sqlite');
  const first = new LocalDraftQueue(path);
  const second = new LocalDraftQueue(path);
  try {
    first.enqueue('a', 'Propose a test'); first.enqueue('b', 'Propose another test');
    const job = first.claim(100)!;
    assert.equal(second.claim(101), null);
    first.settle(job, 102, 'Proposed test');
    assert.equal(second.drafts().length, 1);
    second.control('STOPPED');
    first.pauseForLowBattery();
    assert.equal(second.status().mode, 'STOPPED');
    assert.equal(await runDraftTick(first, async () => { throw new Error('must not be called'); }), 'IDLE');
  } finally { first.close(); second.close(); }
  const reopened = new LocalDraftQueue(path);
  try {
    assert.equal(reopened.status().mode, 'STOPPED');
    assert.equal(reopened.drafts()[0].output, 'Proposed test');
  } finally {
    reopened.close();
    assert.equal(resolve(root, '..'), resolve(tmpdir()));
    rmSync(root, { recursive: true, force: true });
  }
});

test('single lease, stale recovery, and old-owner settlement refusal', () => {
  const queue = new LocalDraftQueue(':memory:');
  try {
    queue.enqueue('a', 'First task'); queue.enqueue('b', 'Second task');
    const first = queue.claim(0)!;
    assert.equal(queue.claim(1), null);
    assert.equal(queue.claim(120_001)?.id, 'b');
    assert.throws(() => queue.settle(first, 120_002, 'late answer'), /LEASE_LOST/);
    assert.ok(queue.status().counts.some(item => item.state === 'FAILED' && item.count === 1));
  } finally { queue.close(); }
});

test('provider failure retries with backoff then stops at three attempts', async () => {
  const queue = new LocalDraftQueue(':memory:');
  let now = 0; let calls = 0;
  const caller = async () => { calls++; throw new Error('private provider details'); };
  try {
    queue.enqueue('a', 'First task');
    assert.equal(await runDraftTick(queue, caller, () => now), 'READY');
    assert.equal(await runDraftTick(queue, caller, () => now), 'IDLE');
    now = 60_000; assert.equal(await runDraftTick(queue, caller, () => now), 'READY');
    now = 180_000; assert.equal(await runDraftTick(queue, caller, () => now), 'FAILED');
    now = 999_999; assert.equal(await runDraftTick(queue, caller, () => now), 'IDLE');
    assert.equal(calls, 3);
    assert.ok(!JSON.stringify(queue.status()).includes('private'));
  } finally { queue.close(); }
});

test('input limits, conflicting IDs, wrong models and credential-shaped output refuse', async () => {
  // Deliberately credential-shaped, synthetic negative fixtures; never valid credentials.
  // Keep these visible to scanners: classification applies only to these test literals.
  const syntheticInput = 'api_key=XVI_SYNTHETIC_TEST_ONLY_NOT_A_CREDENTIAL';
  const syntheticOutput = 'password=XVI_SYNTHETIC_TEST_ONLY_NOT_A_CREDENTIAL';
  const queue = new LocalDraftQueue(':memory:');
  try {
    assert.throws(() => queue.enqueue('../file', 'task'));
    const before = queue.status();
    assert.throws(() => queue.enqueue('a', syntheticInput), { message: 'TASK_REFUSED' });
    assert.deepEqual(queue.status(), before);
    queue.enqueue('a', 'Task'); queue.enqueue('a', 'Task');
    assert.throws(() => queue.enqueue('a', 'Different task'), /CONFLICT/);
    assert.equal(await runDraftTick(queue, async () => ({ model: 'remote', response: 'draft' }), () => 0), 'READY');
    assert.equal(queue.drafts().length, 0);
    assert.equal(await runDraftTick(queue, async () => ({ model: 'qwen2.5:3b', response: syntheticOutput }), () => 60_000), 'READY');
    assert.equal(queue.drafts().length, 0);
  } finally { queue.close(); }
});
