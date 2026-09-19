// 12D-417 tests — the campaign census CLI is read-only, fail-closed,
// and honest-flags-pinned across a MULTI-queue campaign. These tests
// pin each of those properties with REAL OfflineStoryQueue files.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import {
  CAMPAIGN_CENSUS_CLI_POLICY,
  CAMPAIGN_CENSUS_CLI_GUARDRAILS,
  parseCampaignCensusArgs,
  runCampaignCensusCommand,
  mainCampaignCensusCli,
} from './xiv-reading-campaign-census.cli';

test('guardrails pin the honest flags and forbid mutating flags', () => {
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.learningPromoted, false);
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.activated, 0);
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.collectsNothing, true);
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.automaticRecovery, false);
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.billionUsersProven, false);
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.readOnly, true);
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.missingQueueFileRefuses, true);
  assert.equal(CAMPAIGN_CENSUS_CLI_GUARDRAILS.emptyCampaignRefuses, true);
  const flagText = JSON.stringify(CAMPAIGN_CENSUS_CLI_POLICY);
  assert.ok(!flagText.includes('--apply'), 'a census CLI must never carry an --apply flag');
  assert.ok(!flagText.includes('--decision'), 'a census CLI must never carry a --decision flag');
  assert.ok(!flagText.includes('--out'), 'a census CLI must never carry an --out flag');
});

test('parser discipline: exactly two flags, each once, each valued', () => {
  assert.throws(() => parseCampaignCensusArgs([]), /expected exactly 2 flags/);
  assert.throws(() => parseCampaignCensusArgs(['--dir', 'd']), /expected exactly 2 flags/);
  assert.throws(() => parseCampaignCensusArgs(['--dir', 'd', '--tenant', 't', '--extra', 'x']), /expected exactly 2 flags/);
  assert.throws(() => parseCampaignCensusArgs(['--apply', 'yes', '--tenant', 't']), /unknown flag --apply/);
  assert.throws(() => parseCampaignCensusArgs(['--dir', 'd', '--dir', 'd2']), /duplicate flag --dir/);
  assert.throws(() => parseCampaignCensusArgs(['--dir', '', '--tenant', 't']), /requires a value/);
  const parsed = parseCampaignCensusArgs(['--dir', 'd', '--tenant', 'xiv-os']);
  assert.deepEqual(parsed, { dir: 'd', tenant: 'xiv-os' });
});

test('malformed tenant refuses', () => {
  assert.throws(() => parseCampaignCensusArgs(['--dir', 'd', '--tenant', 'bad tenant!']), /malformed/);
});

test('a campaign dir with zero reading-* dirs refuses — silence is never success', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-census-test-'));
  try {
    const packet = runCampaignCensusCommand(['--dir', dir, '--tenant', 'xiv-os']);
    assert.equal(packet.kind, 'CAMPAIGN_CENSUS_REFUSED');
    if (packet.kind !== 'CAMPAIGN_CENSUS_REFUSED') return;
    assert.match(packet.reason, /silence is never success/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a matched reading-* dir WITHOUT queue.sqlite refuses — never created, never skipped', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-census-test-'));
  try {
    mkdirSync(join(dir, 'reading-broken'), { recursive: true });
    const packet = runCampaignCensusCommand(['--dir', dir, '--tenant', 'xiv-os']);
    assert.equal(packet.kind, 'CAMPAIGN_CENSUS_REFUSED');
    if (packet.kind !== 'CAMPAIGN_CENSUS_REFUSED') return;
    assert.match(packet.reason, /never creates a queue by accident/);
    assert.equal(existsSync(join(dir, 'reading-broken', 'queue.sqlite')), false, 'the census must never create the missing queue');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('happy path: real multi-queue aggregate, byte-identical queues, pinned flags', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-census-test-'));
  try {
    mkdirSync(join(dir, 'reading-alpha'), { recursive: true });
    mkdirSync(join(dir, 'reading-beta'), { recursive: true });
    mkdirSync(join(dir, 'not-a-campaign'), { recursive: true });
    const qAlpha = join(dir, 'reading-alpha', 'queue.sqlite');
    const qBeta = join(dir, 'reading-beta', 'queue.sqlite');
    const a = new OfflineStoryQueue(qAlpha);
    try { a.summary('xiv-os'); } finally { a.close(); }
    const b = new OfflineStoryQueue(qBeta);
    try { b.summary('xiv-os'); } finally { b.close(); }
    const beforeAlpha = readFileSync(qAlpha);
    const beforeBeta = readFileSync(qBeta);
    const packet = runCampaignCensusCommand(['--dir', dir, '--tenant', 'xiv-os']);
    assert.ok(readFileSync(qAlpha).equals(beforeAlpha), 'a census read must leave each queue byte-identical');
    assert.ok(readFileSync(qBeta).equals(beforeBeta), 'a census read must leave each queue byte-identical');
    assert.equal(packet.kind, 'CAMPAIGN_CENSUS_PACKET');
    if (packet.kind !== 'CAMPAIGN_CENSUS_PACKET') return;
    assert.equal(packet.tenantId, 'xiv-os');
    assert.equal(packet.queues.length, 2, 'only reading-* dirs count');
    assert.deepEqual(packet.queues.map((q) => q.queueDir), ['reading-alpha', 'reading-beta']);
    assert.deepEqual(packet.queues[0]!.counts, []);
    assert.equal(packet.aggregates.totalQueues, 2);
    assert.equal(packet.aggregates.awaitingReviewTotal, 0);
    assert.equal(packet.aggregates.readyTotal, 0);
    assert.equal(packet.aggregates.doneTotal, 0);
    assert.match(packet.aggregates.note, /never invented/);
    assert.equal(packet.ceiling.rowsPerDatabase, 2000000);
    assert.match(packet.ceiling.note, /ONLY measured ceiling/);
    assert.equal(packet.humanDecision, 'REQUIRED');
    assert.equal(packet.learningPromoted, false);
    assert.equal(packet.activated, 0);
    assert.equal(packet.billionUsersProven, false);
    assert.equal(packet.automaticRecovery, false);
    assert.equal(packet.queuesNeverWritten, true);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.remoteCalls, 0);
    assert.ok(packet.reviewPath.nextSteps.length >= 3);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('main entrypoint: refused packet sets exit code 2 and prints verbatim', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-census-test-'));
  try {
    const chunks: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    const origExit = process.exitCode;
    (process.stdout as { write: typeof process.stdout.write }).write = ((chunk: unknown) => {
      chunks.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    try {
      mainCampaignCensusCli(['--dir', dir, '--tenant', 'xiv-os']);
      assert.equal(process.exitCode, 2);
      const printed = JSON.parse(chunks.join(''));
      assert.equal(printed.kind, 'CAMPAIGN_CENSUS_REFUSED');
      assert.equal(printed.humanDecision, 'REQUIRED');
    } finally {
      (process.stdout as { write: typeof process.stdout.write }).write = origWrite;
      process.exitCode = origExit;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});