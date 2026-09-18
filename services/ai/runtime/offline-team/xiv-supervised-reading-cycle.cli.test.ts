// 12D-284 — adversarial tests for the supervised reading cycle CLI.
// Central properties under attack:
//   1. EXACT ARGS: every flag required, each exactly once, with a
//      value; unknown flags, duplicates, missing values, short
//      genesis, oversized title refuse.
//   2. LOCAL I/O ONLY: the register file round-trips; the command reads
//      the body from a LOCAL file path.
//   3. THE CYCLE NEVER THROWS: an unregistered source yields an honest
//      REFUSED packet (verbatim print, refused: true); the queue is
//      always closed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseSupervisedCycleArgs, FileReadingRegisterStore,
  SUPERVISED_READING_CYCLE_CLI_GUARDRAILS, runSupervisedCycleCommand,
} from './xiv-supervised-reading-cycle.cli';
import {
  registerReadingSource,
} from './xiv-reading-source-register';

const GENESIS = '12d-284-register-genesis';
const tenantId = 'reading-tenant';

const goodArgs = (dir: string): string[] => [
  '--register', join(dir, 'register.json'),
  '--queue', join(dir, 'q.sqlite'),
  '--genesis', GENESIS,
  '--tenant', tenantId,
  '--source', 'quantumlib-cirq',
  '--document', 'cli-doc-1',
  '--title', 'CLI cycle reading',
  '--body', join(dir, 'body.txt'),
];

test('12d-284: the exact-flags parser accepts a full valid argv', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-cycle-cli-'));
  try {
    const args = parseSupervisedCycleArgs(goodArgs(dir));
    assert.equal(args.registerGenesis, GENESIS);
    assert.equal(args.tenantId, tenantId);
    assert.equal(args.sourceId, 'quantumlib-cirq');
    assert.equal(args.documentId, 'cli-doc-1');
    assert.equal(args.title, 'CLI cycle reading');
    assert.equal(args.declaredFailover, false, 'the default is the single pinned primary — today\'s behavior');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12d-397: the optional --declaredFailover flag parses strictly', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-cycle-cli-397-'));
  try {
    const args = parseSupervisedCycleArgs([...goodArgs(dir), '--declaredFailover', 'true']);
    assert.equal(args.declaredFailover, true, 'the declared caller runs primary-first, then the declared local fallback once');
    assert.equal(parseSupervisedCycleArgs([...goodArgs(dir), '--declaredFailover', 'false']).declaredFailover, false);
    assert.throws(() => parseSupervisedCycleArgs([...goodArgs(dir), '--declaredFailover', 'yes']), /accepts exactly true or false/, 'a non-boolean value refuses');
    assert.throws(() => parseSupervisedCycleArgs([...goodArgs(dir), '--declaredFailover']), /exactly 8 flags/, 'a flag without a value is not the optional pair');
    assert.throws(() => parseSupervisedCycleArgs([...goodArgs(dir), '--extra', 'x', '--declaredFailover', 'true']), /exactly 8 flags/, 'an unknown flag still refuses even with the optional flag present');
    assert.throws(() => parseSupervisedCycleArgs([...goodArgs(dir), '--declaredFailover', 'true', '--declaredFailover', 'true']), /exactly 8 flags/, 'the optional flag may appear at most once');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12d-284: malformed argv refuses — unknown, duplicate, missing, short genesis, oversized title', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-cycle-cli-'));
  try {
    assert.throws(() => parseSupervisedCycleArgs([]), /exactly 8 flags/);
    // 12d-397: an 18-item argv with an unknown flag now passes the
    // length check (the optional pair's slot) and refuses as UNKNOWN —
    // still fail-closed, still zero side effects.
    assert.throws(() => parseSupervisedCycleArgs([...goodArgs(dir), '--extra', 'x']), /unknown flag --extra/);
    assert.throws(() => parseSupervisedCycleArgs(goodArgs(dir).slice(2)), /exactly 8 flags/);
    assert.throws(
      () => parseSupervisedCycleArgs(['--register', 'a', '--queue', 'q', '--register', 'dup', '--genesis', GENESIS, '--tenant', tenantId, '--source', 's', '--document', 'd', '--title', 't']),
      /more than once/,
    );
    assert.throws(
      () => parseSupervisedCycleArgs(['--register', 'a', '--queue', 'q', '--genesis', GENESIS, '--tenant', tenantId, '--source', 's', '--document', 'd', '--title', 't', '--wat', 'x']),
      /unknown flag/,
    );
    assert.throws(() => parseSupervisedCycleArgs(goodArgs(dir).map((v) => v === GENESIS ? 'short' : v)), /at least 8 chars/);
    assert.throws(() => parseSupervisedCycleArgs(goodArgs(dir).map((v) => v === 'CLI cycle reading' ? 'x'.repeat(257) : v)), /exceeds 256/);
    // A value that looks like a flag refuses (no silent swallowing).
    assert.throws(() => parseSupervisedCycleArgs(goodArgs(dir).map((v, i) => (i === 11) ? '--flag' : v)), /requires a value/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12d-284: the file register store round-trips through the REAL register contract', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-cycle-cli-'));
  try {
    const path = join(dir, 'register.json');
    const first = new FileReadingRegisterStore(path);
    registerReadingSource(first as never, GENESIS, {
      tenantId, sourceId: 'quantumlib-cirq',
      title: 'Cirq — open-source quantum circuit framework',
      sourceUrl: 'https://github.com/quantumlib/Cirq',
      sourceClass: 'OPEN_SOURCE_REPO',
      licenseNote: 'Apache 2.0 — public repository, cited verbatim',
    });
    const second = new FileReadingRegisterStore(path);
    const lines = second.load();
    assert.ok(Array.isArray(lines) && lines.length === 1, 'the register persisted to the operator file');
    assert.equal(JSON.parse(readFileSync(path, 'utf8')).length, 1);
    // A duplicate registration refuses through the REAL contract.
    assert.throws(() => registerReadingSource(second as never, GENESIS, {
      tenantId, sourceId: 'quantumlib-cirq',
      title: 'Cirq — open-source quantum circuit framework',
      sourceUrl: 'https://github.com/quantumlib/Cirq',
      sourceClass: 'OPEN_SOURCE_REPO',
      licenseNote: 'Apache 2.0 — public repository, cited verbatim',
    }), /already registered/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12d-284: the command runs one honest cycle against a LOCAL body file and always closes the queue', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-cycle-cli-'));
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (line: unknown) => { logs.push(String(line)); };
  try {
    const bodyPath = join(dir, 'body.txt');
    writeFileSync(bodyPath, 'A local document body for the CLI cycle. No credentials, no PII — just reading vocabulary.', 'utf8');
    const { refused } = await runSupervisedCycleCommand(goodArgs(dir));
    assert.equal(refused, true, 'an unregistered source refuses honestly (the register file is fresh)');
    assert.equal(logs.length, 1, 'the packet prints verbatim, nothing else');
    const packet = JSON.parse(logs[0]!) as { kind: string; reason: string; modelCalls: number; humanDecision: string };
    assert.equal(packet.kind, 'SUPERVISED_READING_CYCLE_REFUSED');
    assert.ok(packet.reason.includes('NO REGISTER, NO BINDING'));
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.humanDecision, 'REQUIRED');
    assert.ok(!logs[0]!.includes('A local document body'), 'refused packets carry ZERO document text');
  } finally {
    console.log = originalLog;
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-284: pinned CLI guardrails', () => {
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.localIoOnly, true);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.loopbackCallerOnly, true);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.modelCallsCountedNotPinnedZero, true);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.refusesWithExitTwo, true);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.printsPacketsVerbatim, true);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.collectsNothing, true);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.learningPromoted, false);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.activated, 0);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.automaticRecovery, false);
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(SUPERVISED_READING_CYCLE_CLI_GUARDRAILS.billionUsersProven, false);
});