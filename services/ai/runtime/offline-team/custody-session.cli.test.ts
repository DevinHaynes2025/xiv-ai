// 12D-238 tests — adversarial coverage for the custody operator CLI.
// Under test: strict arg parsing, explicit mode on mutating actions, the
// no-receipt-generation guardrail (no randomness, no key material), honest
// flags in every packet, and the full bootstrap → register → consume →
// resume-refuses lifecycle over a real file store. Nothing calls a network.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CUSTODY_CLI_POLICY, CUSTODY_CLI_HONEST_FLAGS,
  parseCustodyCliArgs, runCustodyCli, type CustodyCliPacket,
} from './custody-session.cli';

const T0 = 1_000_000_000;
const SEED = 'custody-cli-seed-0001';
const RECEIPT = 'a'.repeat(64);
const PURPOSE = 'xiv.sync.propose';

function cliDir(): { dir: string; journal: string } {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-custody-12d-238-'));
  return { dir, journal: join(dir, 'custody.journal') };
}

const resultOf = (p: CustodyCliPacket) => p.result as Record<string, unknown>;

test('12D-238 policy and honest flags match the charter and are frozen', () => {
  assert.equal(CUSTODY_CLI_POLICY.policyVersion, '12d-238-v1');
  assert.deepEqual(CUSTODY_CLI_POLICY.actions, ['open', 'register', 'consume', 'show']);
  assert.equal(CUSTODY_CLI_HONEST_FLAGS.humanDecision, 'REQUIRED');
  assert.equal(CUSTODY_CLI_HONEST_FLAGS.remoteCalls, 0);
  assert.equal(CUSTODY_CLI_HONEST_FLAGS.modelCalls, 0);
  assert.equal(CUSTODY_CLI_HONEST_FLAGS.learningPromoted, false);
  assert.equal(CUSTODY_CLI_HONEST_FLAGS.billionUsersProven, false);
  assert.equal(CUSTODY_CLI_HONEST_FLAGS.ciStatusClaimed, 'not claimed');
  assert.equal(Object.isFrozen(CUSTODY_CLI_POLICY), true);
  assert.equal(Object.isFrozen(CUSTODY_CLI_HONEST_FLAGS), true);
});

test('12D-238 arg parsing accepts only strict --key=value and refuses everything else', () => {
  assert.deepEqual(parseCustodyCliArgs(['--action=show']), { action: 'show' });
  assert.throws(() => parseCustodyCliArgs(['action=show']), /--key=value/);
  assert.throws(() => parseCustodyCliArgs(['--action']), /--key=value/);
  assert.throws(() => parseCustodyCliArgs(['--=v']), /--key=value/);
  assert.throws(() => parseCustodyCliArgs(['--bad key=v']), /malformed/);
  assert.throws(() => parseCustodyCliArgs(['--a=1', '--a=2']), /duplicate argument --a/);
  const frozen = parseCustodyCliArgs(['--a=1']);
  assert.equal(Object.isFrozen(frozen), true);
});

test('12D-238 bootstrap open on a fresh journal yields an honest packet', () => {
  const { dir, journal } = cliDir();
  try {
    const p = runCustodyCli([`--action=open`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=bootstrap']);
    assert.equal(resultOf(p).ok, true);
    assert.equal(resultOf(p).mode, 'bootstrap');
    assert.equal(resultOf(p).journalOps, 0);
    assert.equal(resultOf(p).ledgerVerifies, true);
    assert.deepEqual(p.flags, CUSTODY_CLI_HONEST_FLAGS);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12D-238 mutating actions require an explicit mode and refuse inference', () => {
  const { dir, journal } = cliDir();
  try {
    assert.throws(
      () => runCustodyCli([`--action=open`, `--journal=${journal}`, `--seed=${SEED}`]),
      /missing required argument --mode/,
    );
    assert.throws(
      () => runCustodyCli([`--action=open`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=auto']),
      /mode must be 'bootstrap' or 'resume'/,
    );
    assert.throws(
      () => runCustodyCli([`--action=show`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=bootstrap']),
      /no custody journal found to resume/, // show is resume-only regardless of --mode
    );
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12D-238 register journals the op and discloses registration-is-not-issuance', () => {
  const { dir, journal } = cliDir();
  try {
    const p = runCustodyCli([
      `--action=register`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=bootstrap',
      `--receipt-sha256=${RECEIPT}`, `--purpose=${PURPOSE}`, '--registered-by=devin',
      `--issued-at-ms=${T0}`, `--registered-at-ms=${T0}`,
    ]);
    const record = resultOf(p).registered as Record<string, unknown>;
    assert.equal(record.receiptSha256, RECEIPT);
    assert.equal(record.purpose, PURPOSE);
    assert.equal(resultOf(p).journalOps, 1);
    assert.match(String(resultOf(p).disclosure), /registration is not issuance proof/);
    // The journal file now exists on disk with one line.
    assert.equal(readFileSync(journal, 'utf8').split('\n').filter((l) => l.length > 0).length, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12D-238 malformed receipts and timestamps refuse before any journal write', () => {
  const { dir, journal } = cliDir();
  try {
    assert.throws(
      () => runCustodyCli([
        `--action=register`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=bootstrap',
        '--receipt-sha256=zz', `--purpose=${PURPOSE}`, '--registered-by=devin',
        `--issued-at-ms=${T0}`, `--registered-at-ms=${T0}`,
      ]),
      /receipt-sha256 must be 64 hex/,
    );
    assert.throws(
      () => runCustodyCli([
        `--action=register`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=bootstrap',
        `--receipt-sha256=${RECEIPT}`, `--purpose=${PURPOSE}`, '--registered-by=devin',
        '--issued-at-ms=not-a-number', `--registered-at-ms=${T0}`,
      ]),
      /must be an integer/,
    );
    assert.equal(existsSync(journal), false); // refused before any write
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12D-238 consume returns the consumption proof; a second consume refuses single-use', () => {
  const { dir, journal } = cliDir();
  try {
    runCustodyCli([
      `--action=register`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=bootstrap',
      `--receipt-sha256=${RECEIPT}`, `--purpose=${PURPOSE}`, '--registered-by=devin',
      `--issued-at-ms=${T0}`, `--registered-at-ms=${T0}`,
    ]);
    const c1 = runCustodyCli([
      `--action=consume`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=resume',
      `--receipt-sha256=${RECEIPT}`, `--purpose=${PURPOSE}`, `--now-ms=${T0 + 100}`,
    ]);
    const consumed = resultOf(c1).consumed as Record<string, unknown> | null;
    assert.equal(consumed?.consumedAtMs, T0 + 100);
    assert.equal(consumed?.purpose, PURPOSE);
    assert.throws(
      () => runCustodyCli([
        `--action=consume`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=resume',
        `--receipt-sha256=${RECEIPT}`, `--purpose=${PURPOSE}`, `--now-ms=${T0 + 200}`,
      ]),
      /already consumed/,
    );
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12D-238 show is resume-only and reports the journal without listing receipts', () => {
  const { dir, journal } = cliDir();
  try {
    runCustodyCli([
      `--action=register`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=bootstrap',
      `--receipt-sha256=${RECEIPT}`, `--purpose=${PURPOSE}`, '--registered-by=devin',
      `--issued-at-ms=${T0}`, `--registered-at-ms=${T0}`,
    ]);
    const p = runCustodyCli([`--action=show`, `--journal=${journal}`, `--seed=${SEED}`]);
    assert.equal(resultOf(p).mode, 'resume');
    assert.equal(resultOf(p).journalOps, 1);
    assert.equal(resultOf(p).ledgerVerifies, true);
    assert.equal(resultOf(p).registered, undefined); // intentionally not listed
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('12D-238 unknown actions and missing arguments refuse with the action list', () => {
  assert.throws(
    () => runCustodyCli(['--action=revoke', '--journal=x']),
    /unknown action "revoke"; use open \| register \| consume \| show/,
  );
  assert.throws(() => runCustodyCli([]), /missing required argument --action/);
  assert.throws(
    () => runCustodyCli(['--action=open', `--seed=${SEED}`, '--mode=bootstrap']),
    /missing required argument --journal/,
  );
  assert.throws(
    () => runCustodyCli(['--action=open', `--journal=j`, '--mode=bootstrap']),
    /missing required argument --seed/,
  );
});

test('12D-238 the CLI source contains no randomness or key material (never generates receipts)', () => {
  const src = readFileSync(new URL('./custody-session.cli.ts', import.meta.url), 'utf8');
  assert.equal(src.includes('randomBytes'), false);
  assert.equal(src.includes('generateKeyPair'), false);
  assert.equal(src.includes('createHash'), false); // digests are computed OUT OF BAND
  assert.equal(src.includes('--generate'), false);
});

test('12D-238 the full lifecycle works across CLI invocations (file store, real restarts)', () => {
  const { dir, journal } = cliDir();
  try {
    // Bootstrap + register two receipts.
    runCustodyCli([
      `--action=register`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=bootstrap',
      `--receipt-sha256=${RECEIPT}`, `--purpose=${PURPOSE}`, '--registered-by=devin',
      `--issued-at-ms=${T0}`, `--registered-at-ms=${T0}`,
    ]);
    const EXEC = 'b'.repeat(64);
    runCustodyCli([
      `--action=register`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=resume',
      `--receipt-sha256=${EXEC}`, '--purpose=xiv.sync.transport', '--registered-by=devin',
      `--issued-at-ms=${T0}`, `--registered-at-ms=${T0}`,
    ]);
    // Consume one; a resumed process sees it consumed.
    runCustodyCli([
      `--action=consume`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=resume',
      `--receipt-sha256=${RECEIPT}`, `--purpose=${PURPOSE}`, `--now-ms=${T0 + 100}`,
    ]);
    assert.throws(
      () => runCustodyCli([
        `--action=consume`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=resume',
        `--receipt-sha256=${RECEIPT}`, `--purpose=${PURPOSE}`, `--now-ms=${T0 + 300}`,
      ]),
      /already consumed/,
    );
    // The unconsumed one still works from a fresh process.
    const c2 = runCustodyCli([
      `--action=consume`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=resume',
      `--receipt-sha256=${EXEC}`, '--purpose=xiv.sync.transport', `--now-ms=${T0 + 300}`,
    ]);
    assert.equal((resultOf(c2).consumed as Record<string, unknown>).consumedAtMs, T0 + 300);
    // Bootstrap over the now-live journal refuses.
    assert.throws(
      () => runCustodyCli([`--action=open`, `--journal=${journal}`, `--seed=${SEED}`, '--mode=bootstrap']),
      /re-seeding a live custody chain is refused/,
    );
  } finally { rmSync(dir, { recursive: true, force: true }); }
});