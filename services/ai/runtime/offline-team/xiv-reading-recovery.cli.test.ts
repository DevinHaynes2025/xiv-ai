// 12D-292 — adversarial tests for the reading recovery CLI.
// Central properties under attack:
//   1. EXACT ARGS: every flag required, each exactly once, with a
//      value; unknown flags, duplicates, missing values, short
//      genesis, and any field over the recovery policy's bound refuse.
//   2. NO MODEL CALL, NO NETWORK: recovery only re-queues (modelCalls
//      0); the CLI source carries no fetch and no endpoint literal.
//   3. THE RECOVERY NEVER THROWS: an unregistered source yields an
//      honest REFUSED packet (verbatim print, refused: true); the
//      queue is always closed.
//   4. THE REAL LOOP: a REAL FAILED story (produced by the REAL cycle
//      with a failing caller) recovers through the CLI command to
//      READY, with the operator ref echoed and the output hash cleared.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseRecoveryArgs, runRecoveryCommand, READING_RECOVERY_CLI_GUARDRAILS,
} from './xiv-reading-recovery.cli';
import {
  FileReadingRegisterStore, runSupervisedCycleCommand,
} from './xiv-supervised-reading-cycle.cli';
import {
  registerReadingSource,
} from './xiv-reading-source-register';
import { OfflineStoryQueue } from './offline-story-queue';

const GENESIS = '12d-292-register-genesis';
const tenantId = 'reading-tenant';
const BODY = 'A local document body for the recovery CLI. No credentials, no PII — just reading vocabulary.';

const goodArgs = (dir: string, over: Record<string, string> = {}): string[] => [
  '--register', join(dir, 'register.json'),
  '--queue', join(dir, 'q.sqlite'),
  '--genesis', GENESIS,
  '--tenant', tenantId,
  '--source', 'arxiv-aldi-2403-12029',
  '--document', 'cli-recovery-doc-1',
  '--title', 'CLI recovery reading',
  '--body', join(dir, 'body.txt'),
  '--operator-ref', 'ceo:recovery-12d-292',
  ...Object.entries(over).flatMap(([k, v]) => [k, v]),
];

test('12d-292: the exact-flags parser accepts a full valid argv', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-recovery-cli-'));
  try {
    const args = parseRecoveryArgs(goodArgs(dir));
    assert.equal(args.registerGenesis, GENESIS);
    assert.equal(args.tenantId, tenantId);
    assert.equal(args.sourceId, 'arxiv-aldi-2403-12029');
    assert.equal(args.documentId, 'cli-recovery-doc-1');
    assert.equal(args.title, 'CLI recovery reading');
    assert.equal(args.operatorRef, 'ceo:recovery-12d-292');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12d-292: malformed argv refuses — count, unknown, duplicate, missing, short genesis, overlong fields', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-recovery-cli-'));
  try {
    const base = goodArgs(dir);
    assert.throws(() => parseRecoveryArgs([]), /exactly 9 flags/);
    assert.throws(() => parseRecoveryArgs([...base, '--extra', 'x']), /exactly 9 flags/);
    assert.throws(() => parseRecoveryArgs(base.slice(2)), /exactly 9 flags/);
    assert.throws(() => parseRecoveryArgs(base.map((v) => v === GENESIS ? 'short' : v)), /at least 8 chars/);
    assert.throws(() => parseRecoveryArgs(base.map((v) => v === 'CLI recovery reading' ? 'x'.repeat(257) : v)), /title exceeds 256/);
    assert.throws(() => parseRecoveryArgs(base.map((v) => v === 'ceo:recovery-12d-292' ? 'x'.repeat(257) : v)), /operator ref exceeds 256/);
    assert.throws(() => parseRecoveryArgs(base.map((v) => v === 'arxiv-aldi-2403-12029' ? 'x'.repeat(129) : v)), /source id exceeds 128/);
    assert.throws(() => parseRecoveryArgs(base.map((v) => v === 'cli-recovery-doc-1' ? 'x'.repeat(129) : v)), /document id exceeds 128/);
    // Unknown flag and duplicate flag (count still exactly 18).
    assert.throws(() => parseRecoveryArgs(base.map((v) => v === '--operator-ref' ? '--wat' : v)), /unknown flag/);
    assert.throws(() => parseRecoveryArgs(base.map((v) => v === '--title' ? '--tenant' : v)), /more than once/);
    assert.throws(() => parseRecoveryArgs(base.map((v, i) => (i === 17) ? '--flag' : v)), /requires a value/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12d-292: the command refuses honestly on a fresh register (no register, no binding) and closes the queue', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-recovery-cli-'));
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (line: unknown) => { logs.push(String(line)); };
  try {
    writeFileSync(join(dir, 'body.txt'), BODY, 'utf8');
    const { refused } = runRecoveryCommand(goodArgs(dir));
    assert.equal(refused, true, 'an unregistered source refuses honestly (the register file is fresh)');
    assert.equal(logs.length, 1, 'the packet prints verbatim, nothing else');
    const packet = JSON.parse(logs[0]!) as { kind: string; reason: string; modelCalls: number; humanDecision: string };
    assert.equal(packet.kind, 'READING_RECOVERY_REFUSED');
    assert.ok(packet.reason.includes('NO REGISTER, NO BINDING'));
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.humanDecision, 'REQUIRED');
    assert.ok(!logs[0]!.includes('A local document body'), 'refused packets carry ZERO document text');
    // The queue file was created and closed cleanly: a second command runs without a lock error.
    const again = runRecoveryCommand(goodArgs(dir));
    assert.equal(again.refused, true);
  } finally {
    console.log = originalLog;
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-292: the REAL loop — a REAL FAILED story recovers through the CLI command to READY', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-recovery-cli-'));
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (line: unknown) => { logs.push(String(line)); };
  try {
    const bodyPath = join(dir, 'body.txt');
    writeFileSync(bodyPath, BODY, 'utf8');
    const registerPath = join(dir, 'register.json');
    const register = new FileReadingRegisterStore(registerPath);
    registerReadingSource(register as never, GENESIS, {
      tenantId,
      sourceId: 'arxiv-aldi-2403-12029',
      title: 'Align and Distill (ALDI) — arXiv 2403.12029',
      sourceUrl: 'https://arxiv.org/abs/2403.12029',
      sourceClass: 'PUBLIC_WEB',
      licenseNote: 'arXiv CC BY 4.0 — public abstract page, cited verbatim',
    });
    // The REAL cycle (12D-283 contract) with a failing loopback caller
    // produces the durable FAILED story the recovery door exists for.
    // The CLI pins its caller, so the failure is produced via the
    // contract directly.
    // The default loopback caller would call REAL Ollama; inject a
    // failing caller instead by running the CONTRACT directly — the CLI
    // pins its caller, so the failure is produced via the contract.
    const { runSupervisedReadingCycle } = await import('./xiv-supervised-reading-cycle');
    const queue = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    const failingCaller = async () => { throw new Error('ollama returned HTTP 500'); };
    try {
      const failed = await runSupervisedReadingCycle(queue, register as never, GENESIS, {
        tenantId,
        sourceId: 'arxiv-aldi-2403-12029',
        documentId: 'cli-recovery-doc-1',
        title: 'CLI recovery reading',
        bodyText: BODY,
      }, failingCaller);
      assert.equal(failed.kind, 'SUPERVISED_READING_CYCLE_REFUSED', 'the failing caller settles the story FAILED');
      assert.equal((failed as { modelCalls: number }).modelCalls, 1);
      const story = queue.inspectStory(tenantId, 'doc-cli-recovery-doc-1-chunk-1');
      assert.equal(story?.state, 'FAILED', 'the story is durably FAILED');
    } finally {
      queue.close();
    }
    logs.length = 0;
    // THE RECOVERY: the same bytes, a real operator ref — the story goes READY.
    const { refused } = runRecoveryCommand(goodArgs(dir));
    assert.equal(refused, false, 'the FAILED story recovers through the real contracts');
    const packet = JSON.parse(logs[0]!) as {
      kind: string; storyState: string; priorState: string; operatorRef: string;
      modelCalls: number; remoteCalls: number; automaticRecovery: boolean; storyId: string;
    };
    assert.equal(packet.kind, 'READING_RECOVERY');
    assert.equal(packet.priorState, 'FAILED');
    assert.equal(packet.storyState, 'READY');
    assert.equal(packet.storyId, 'doc-cli-recovery-doc-1-chunk-1');
    assert.equal(packet.operatorRef, 'ceo:recovery-12d-292', 'the operator ref is echoed to the operator');
    assert.equal(packet.modelCalls, 0, 'recovery makes NO model call');
    assert.equal(packet.remoteCalls, 0);
    assert.equal(packet.automaticRecovery, false);
    // The queue truth: READY, and the failed output hash was cleared.
    const verify = new OfflineStoryQueue(join(dir, 'q.sqlite'));
    try {
      const story = verify.inspectStory(tenantId, 'doc-cli-recovery-doc-1-chunk-1');
      assert.equal(story?.state, 'READY');
      assert.equal(story?.outputHash ?? null, null, 'the failed output hash was cleared');
    } finally { verify.close(); }
  } finally {
    console.log = originalLog;
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-292: pinned CLI guardrails and no network primitive in the source', () => {
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.localIoOnly, true);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.noModelCallEver, true);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.noNetworkPrimitive, true);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.refusedWithExitTwo, true);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.printsPacketsVerbatim, true);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.oneStoryPerRecovery, true);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.collectsNothing, true);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.learningPromoted, false);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.activated, 0);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.automaticRecovery, false);
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(READING_RECOVERY_CLI_GUARDRAILS.billionUsersProven, false);
  // Source-level: this CLI carries NO network primitive — no fetch, no
  // endpoint literal, no caller import (the audit's guardrails-no-network).
  const source = readFileSync(new URL('./xiv-reading-recovery.cli.ts', import.meta.url), 'utf8');
  assert.ok(!source.includes('fetch('), 'no fetch in the recovery CLI');
  assert.ok(!source.includes('127.0.0.1'), 'no endpoint literal in the recovery CLI');
  assert.ok(!source.includes('buildLoopbackCaller'), 'no caller import in the recovery CLI');
});