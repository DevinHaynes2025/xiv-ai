// 12D-364 tests — the OS Status CLI is read-only, fail-closed, and
// honest-flags-pinned. These tests pin each of those properties.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import {
  OS_STATUS_CLI_POLICY,
  OS_STATUS_CLI_GUARDRAILS,
  parseOsStatusArgs,
  runOsStatusCommand,
  mainOsStatusCli,
} from './xiv-os-status.cli';

function withTempQueue(run: (queuePath: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-os-status-test-'));
  try {
    run(join(dir, 'queue.sqlite'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('guardrails pin the honest flags and forbid mutating flags', () => {
  assert.equal(OS_STATUS_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(OS_STATUS_CLI_GUARDRAILS.learningPromoted, false);
  assert.equal(OS_STATUS_CLI_GUARDRAILS.activated, 0);
  assert.equal(OS_STATUS_CLI_GUARDRAILS.collectsNothing, true);
  assert.equal(OS_STATUS_CLI_GUARDRAILS.automaticRecovery, false);
  assert.equal(OS_STATUS_CLI_GUARDRAILS.billionUsersProven, false);
  assert.equal(OS_STATUS_CLI_GUARDRAILS.readOnly, true);
  assert.equal(OS_STATUS_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(OS_STATUS_CLI_GUARDRAILS.modelCalls, 0);
  const flagText = JSON.stringify(OS_STATUS_CLI_POLICY);
  assert.ok(!flagText.includes('--apply'), 'a status CLI must never carry an --apply flag');
  assert.ok(!flagText.includes('--decision'), 'a status CLI must never carry a --decision flag');
  assert.ok(!flagText.includes('--out'), 'a status CLI must never carry an --out flag');
});

test('parser discipline: exactly two flags, each once, each valued', () => {
  assert.throws(() => parseOsStatusArgs([]), /expected exactly 2 flags/);
  assert.throws(() => parseOsStatusArgs(['--queue', 'q.sqlite']), /expected exactly 2 flags/);
  assert.throws(() => parseOsStatusArgs(['--queue', 'q.sqlite', '--tenant', 't', '--extra', 'x']), /expected exactly 2 flags/);
  assert.throws(() => parseOsStatusArgs(['--apply', 'yes', '--tenant', 't']), /unknown flag --apply/, 'a status CLI must refuse an --apply flag');
  assert.throws(() => parseOsStatusArgs(['--queue', 'q.sqlite', '--queue', 'q2.sqlite']), /duplicate flag --queue/);
  assert.throws(() => parseOsStatusArgs(['--queue', '', '--tenant', 't']), /requires a value/);
  const parsed = parseOsStatusArgs(['--queue', 'q.sqlite', '--tenant', 'xiv-os']);
  assert.deepEqual(parsed, { queue: 'q.sqlite', tenant: 'xiv-os' });
});

test('malformed tenant refuses', () => {
  assert.throws(() => parseOsStatusArgs(['--queue', 'q.sqlite', '--tenant', 'bad tenant!']), /malformed/);
});

test('missing queue file refuses before the queue is opened — never created', () => {
  withTempQueue((queuePath) => {
    const packet = runOsStatusCommand(['--queue', queuePath, '--tenant', 'xiv-os']);
    assert.equal(packet.kind, 'OS_STATUS_REFUSED');
    if (packet.kind !== 'OS_STATUS_REFUSED') return;
    assert.match(packet.reason, /never creates a queue by accident/);
    assert.equal(existsSync(queuePath), false, 'the CLI must never create the queue file');
  });
});

test('happy path: measured counts + pinned honest flags, queue bytes byte-identical', () => {
  withTempQueue((queuePath) => {
    const queue = new OfflineStoryQueue(queuePath);
    try { queue.summary('xiv-os'); } finally { queue.close(); }
    const before = readFileSync(queuePath);
    const packet = runOsStatusCommand(['--queue', queuePath, '--tenant', 'xiv-os']);
    const after = readFileSync(queuePath);
    assert.ok(after.equals(before), 'a status read must leave the queue byte-identical');
    assert.equal(packet.kind, 'OS_STATUS_PACKET');
    if (packet.kind !== 'OS_STATUS_PACKET') return;
    assert.equal(packet.tenantId, 'xiv-os');
    assert.deepEqual(packet.counts, []);
    assert.equal(packet.leaseHeld, false);
    assert.equal(packet.ceiling.rowsPerDatabase, 2000000);
    assert.equal(packet.ceiling.scope, 'measured');
    assert.match(packet.ceiling.note, /ONLY measured ceiling/);
    assert.equal(packet.humanDecision, 'REQUIRED');
    assert.equal(packet.learningPromoted, false);
    assert.equal(packet.activated, 0);
    assert.equal(packet.billionUsersProven, false);
    assert.equal(packet.automaticRecovery, false);
    assert.equal(packet.queueNeverWritten, true);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.remoteCalls, 0);
    assert.ok(packet.reviewPath.nextSteps.length >= 3);
  });
});

test('main entrypoint: refused packet sets exit code 2 and prints verbatim', () => {
  withTempQueue((queuePath) => {
    const chunks: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    const origExit = process.exitCode;
    (process.stdout as { write: typeof process.stdout.write }).write = ((chunk: unknown) => {
      chunks.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    try {
      mainOsStatusCli(['--queue', queuePath, '--tenant', 'xiv-os']);
      assert.equal(process.exitCode, 2);
      const printed = JSON.parse(chunks.join(''));
      assert.equal(printed.kind, 'OS_STATUS_REFUSED');
      assert.equal(printed.humanDecision, 'REQUIRED');
    } finally {
      (process.stdout as { write: typeof process.stdout.write }).write = origWrite;
      process.exitCode = origExit;
    }
  });
});