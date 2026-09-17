// 12D-315 — adversarial tests for the source staleness card. Central
// properties under attack:
//   1. THE PACKET IS RE-VERIFIED through the REAL 12D-306 gate — a
//      tampered packet refuses and echoes no memory content.
//   2. STALENESS IS DERIVED, never guessed: the recorded digest head is
//      re-parsed from the verified objectives (the 12D-287 record) and
//      compared against the operator-supplied hex64 digests; unchecked
//      is NEVER allowed to look like current.
//   3. VERIFICATION-ONLY: modelCalls 0 everywhere, the card never
//      fetches and never mutates memory; honest flags pinned.
//   4. Secret-shaped documentIds are refused before anything is derived.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  SOURCE_STALENESS_CARD_GUARDRAILS, SOURCE_STALENESS_CARD_POLICY,
  prepareSourceStalenessCard, buildSourceStalenessCardPacket,
  type SourceStalenessCardPrepared,
} from './xiv-source-staleness-card';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';

const TENANT = 'ssc-tenant';

function sourceDigest(n: number): string {
  return createHash('sha256').update(`source-bytes-${n}`).digest('hex');
}

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `ssc-story-${String(n).padStart(3, '0')}`,
    tenantId: TENANT,
    roleId: 'memory_curator',
    objective,
    acceptance: ['the fact is bounded and screened'],
    dependencies: [],
    sourceRevision: 'a'.repeat(40),
    masterPlanSha256: 'b'.repeat(64),
    securityClass: 'ORDINARY',
    kind: 'PRODUCT_STORY',
  };
}

function makeDone(q: OfflineStoryQueue, n: number, objective: string): void {
  const story = makeStory(n, objective);
  q.enqueue([story]);
  const lease = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash: createHash('sha256').update(`out-${n}`).digest('hex'), providerSettled: true });
  q.applyReviewDecision({
    tenantId: TENANT, storyId: story.id, reviewerId: 'secure_code_reviewer',
    expectedOutputHash: createHash('sha256').update(`out-${n}`).digest('hex'), decision: 'APPROVED', reviewRef: `review:${n}`,
  });
}

function docObjective(n: number): string {
  return `READ AND SUMMARIZE reviewed fact ${n} about the architecture Source: doc:ssc-doc-${n}:${sourceDigest(n).slice(0, 16)}`;
}

interface RealWorld {
  packet: Record<string, unknown>;
  docIds: string[];
  recordedFullDigests: Record<string, string>;
  storyIds: string[];
}

function realPacket(configs: Array<{ entries: number; bare?: boolean }>): RealWorld {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-315-'));
  const q = new OfflineStoryQueue(join(dir, 'queue.sqlite'));
  const docIds: string[] = [];
  const recordedFullDigests: Record<string, string> = {};
  const storyIds: string[] = [];
  try {
    let n = 0;
    for (const cfg of configs) {
      for (let i = 0; i < cfg.entries; i += 1) {
        n += 1;
        const objective = cfg.bare === true
          ? `READ AND SUMMARIZE reviewed fact ${n} with no source record`
          : docObjective(n);
        makeDone(q, n, objective);
        storyIds.push(makeStory(n, objective).id);
        if (cfg.bare !== true) {
          const docId = `ssc-doc-${n}`;
          docIds.push(docId);
          recordedFullDigests[docId] = sourceDigest(n);
        }
      }
    }
    const packet = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    return { packet: JSON.parse(JSON.stringify(packet)) as Record<string, unknown>, docIds, recordedFullDigests, storyIds };
  } finally {
    q.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function digestEntries(world: RealWorld, mutate?: (docId: string) => string): { documentId: string; digestSha256: string }[] {
  return world.docIds.map((documentId) => {
    const digest = mutate !== undefined ? mutate(documentId) : world.recordedFullDigests[documentId]!;
    return { documentId, digestSha256: digest };
  });
}

function cardFor(world: RealWorld, digests: { documentId: string; digestSha256: string }[]): SourceStalenessCardPrepared {
  const prepared = prepareSourceStalenessCard({ memoryPacket: world.packet, currentDigests: digests });
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') throw new Error('fixture refused');
  return prepared;
}

test('matching re-fetched digests yield ALL_CURRENT with a CURRENT row per carried document', () => {
  const world = realPacket([{ entries: 3 }]);
  const prepared = cardFor(world, digestEntries(world));
  assert.equal(prepared.verdict, 'ALL_CURRENT');
  assert.equal(prepared.tenantId, TENANT);
  assert.deepEqual(prepared.staleDocumentIds, []);
  assert.deepEqual(prepared.affectedStoryIds, []);
  assert.equal(prepared.assessed.length, 3);
  for (const row of prepared.assessed) {
    assert.equal(row.verdict, 'CURRENT');
    assert.equal(row.recordedDigestHead, sourceDigest(Number(row.documentId.split('-').pop())).slice(0, 16));
    assert.equal(row.currentDigestHead, row.recordedDigestHead);
  }
  const card = buildSourceStalenessCardPacket(prepared);
  assert.equal(card.status, 'VERIFIED');
  if (card.status !== 'VERIFIED') return;
  assert.equal(card.staleCount, 0);
  assert.equal(card.uncheckedCount, 0);
  assert.equal(card.modelCalls, 0);
  assert.equal(card.remoteCalls, 0);
  assert.equal(card.activated, 0);
  assert.equal(card.learningPromoted, false);
  assert.equal(card.humanDecision, 'REQUIRED');
  assert.ok(card.stoppedBefore.includes('the operator decides'));
  assert.ok(Object.isFrozen(card));
});

test('a changed digest yields STALE_SOURCES_PRESENT with the affected storyIds disclosed', () => {
  const world = realPacket([{ entries: 3 }]);
  const moved = 'd'.repeat(64);
  const prepared = cardFor(world, digestEntries(world, (docId) => (docId === 'ssc-doc-2' ? moved : world.recordedFullDigests[docId]!)));
  assert.equal(prepared.verdict, 'STALE_SOURCES_PRESENT');
  assert.deepEqual(prepared.staleDocumentIds, ['ssc-doc-2']);
  assert.deepEqual(prepared.affectedStoryIds, ['ssc-story-002'],
    'the reviewed fact citing the moved evidence is disclosed BY storyId');
  const row = prepared.assessed.find((a) => a.documentId === 'ssc-doc-2');
  assert.ok(row);
  assert.equal(row!.verdict, 'STALE');
  assert.equal(row!.currentDigestHead, moved.slice(0, 16));
});

test('a digest that differs only AFTER the recorded 16-char head renders CURRENT — the head-16 record is what 12D-287 binds to, and the card says so honestly', () => {
  const world = realPacket([{ entries: 1 }]);
  const tailChanged = world.recordedFullDigests['ssc-doc-1']!.slice(0, 16) + 'e'.repeat(48);
  const prepared = cardFor(world, digestEntries(world, () => tailChanged));
  assert.equal(prepared.verdict, 'ALL_CURRENT',
    'the recorded evidence version IS the head-16; a head match is a head match — the re-ingestion rung re-reads full bytes');
  assert.equal(prepared.assessed[0]!.currentDigestHead, prepared.assessed[0]!.recordedDigestHead);
});

test('a carried document with NO supplied digest renders UNCHECKED — undisclosed staleness is not currency', () => {
  const world = realPacket([{ entries: 2 }]);
  const digests = digestEntries(world).slice(0, 1); // only doc-1 supplied
  const prepared = cardFor(world, digests);
  assert.equal(prepared.verdict, 'UNCHECKED_SOURCES_PRESENT');
  const row = prepared.assessed.find((a) => a.documentId === 'ssc-doc-2');
  assert.ok(row);
  assert.equal(row!.verdict, 'UNCHECKED');
  assert.equal(row!.currentDigestHead, '', 'nothing was re-fetched — the row says so');
  assert.equal(row!.recordedDigestHead, sourceDigest(2).slice(0, 16));
});

test('a supplied digest for a NON-carried document is disclosed as an UNCHECKED row, never silently dropped', () => {
  const world = realPacket([{ entries: 1 }]);
  const prepared = cardFor(world, [...digestEntries(world), { documentId: 'unrelated-doc', digestSha256: 'c'.repeat(64) }]);
  assert.equal(prepared.verdict, 'UNCHECKED_SOURCES_PRESENT');
  const row = prepared.assessed.find((a) => a.documentId === 'unrelated-doc');
  assert.ok(row);
  assert.equal(row!.verdict, 'UNCHECKED');
  assert.equal(row!.recordedDigestHead, '');
});

test('an objective WITHOUT the doc: pattern yields a PATTERN_ABSENT row keyed by storyId', () => {
  const world = realPacket([{ entries: 1 }, { entries: 1, bare: true }]);
  const prepared = cardFor(world, digestEntries(world));
  assert.equal(prepared.verdict, 'UNCHECKED_SOURCES_PRESENT');
  const row = prepared.assessed.find((a) => a.documentId === 'ssc-story-002');
  assert.ok(row);
  assert.equal(row!.verdict, 'PATTERN_ABSENT');
  assert.equal(row!.recordedDigestHead, '');
});

test('a tampered memory packet refuses the card and echoes NO storyId and NO digest', () => {
  const world = realPacket([{ entries: 2 }]);
  const tampered = { ...world.packet, memoryDigest: 'f'.repeat(64) };
  const prepared = prepareSourceStalenessCard({
    memoryPacket: tampered,
    currentDigests: digestEntries(world),
  });
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status !== 'REFUSED') return;
  assert.ok(prepared.reason.includes('failed verification'));
  assert.ok(!prepared.reason.includes('ssc-doc'), 'no documentId echoed');
  assert.ok(!prepared.reason.includes('f'.repeat(64)), 'no digest echoed');
});

test('digest shape and identity are screened BEFORE any comparison', () => {
  const world = realPacket([{ entries: 1 }]);
  const bads: unknown[] = [
    { documentId: 'ssc-doc-1', digestSha256: 'Z'.repeat(64) },        // not lowercase hex
    { documentId: 'ssc-doc-1', digestSha256: 'a'.repeat(63) },        // short
    { documentId: 'ssc doc 1', digestSha256: 'a'.repeat(64) },        // not id-shaped
    { documentId: 'ssc-doc-1', digestSha256: 'a'.repeat(64), smuggled: 1 }, // extra key
    { digestSha256: 'a'.repeat(64) },                                  // missing key
    { documentId: 'ssc-doc-1', digestSha256: 'a'.repeat(64) , extra: 0},
  ];
  for (const bad of bads) {
    const prepared = prepareSourceStalenessCard({ memoryPacket: world.packet, currentDigests: [bad] });
    assert.equal(prepared.status, 'REFUSED', `expected refusal for ${JSON.stringify(bad)}`);
  }
  const dup = prepareSourceStalenessCard({
    memoryPacket: world.packet,
    currentDigests: [digestEntries(world)[0]!, digestEntries(world)[0]!],
  });
  assert.equal(dup.status, 'REFUSED');
  if (dup.status === 'REFUSED') assert.ok(dup.reason.includes('more than once'));
});

test('a secret-shaped documentId is refused and never echoed', () => {
  const world = realPacket([{ entries: 1 }]);
  const prepared = prepareSourceStalenessCard({
    memoryPacket: world.packet,
    currentDigests: [{ documentId: 'x-' + 'AKIA' + 'IOSFODNN7EXAMPLE', digestSha256: 'a'.repeat(64) }],
  });
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status === 'REFUSED') assert.ok(!prepared.reason.includes('AKIA'), 'never echoes the secret');
});

test('bounds, junk inputs, wrong keys and wrong ORDER all refuse', () => {
  const world = realPacket([{ entries: 1 }]);
  for (const junk of [null, undefined, 'nope', [], {}, { memoryPacket: world.packet }, { currentDigests: [] }, { memoryPacket: world.packet, currentDigests: digestEntries(world), smuggled: 1 }]) {
    assert.equal(prepareSourceStalenessCard(junk).status, 'REFUSED');
  }
  const reordered = { currentDigests: digestEntries(world), memoryPacket: world.packet };
  assert.equal(prepareSourceStalenessCard(reordered).status, 'REFUSED', 'exact keys IN ORDER');
  const tooMany = Array.from({ length: 25 }, (_, i) => ({ documentId: `d-${i}`, digestSha256: 'a'.repeat(64) }));
  assert.equal(prepareSourceStalenessCard({ memoryPacket: world.packet, currentDigests: tooMany }).status, 'REFUSED');
  const empty = prepareSourceStalenessCard({ memoryPacket: world.packet, currentDigests: [] });
  assert.equal(empty.status, 'REFUSED');
});

test('the packet is never built from a non-PREPARED card', () => {
  const world = realPacket([{ entries: 1 }]);
  const refused = prepareSourceStalenessCard({ memoryPacket: { ...world.packet, memoryDigest: 'e'.repeat(64) }, currentDigests: digestEntries(world) });
  assert.equal(refused.status, 'REFUSED');
  const card = buildSourceStalenessCardPacket(refused as never);
  assert.equal(card.status, 'REFUSED');
});

test('the guardrails are frozen and the honest flags are pinned', () => {
  assert.ok(Object.isFrozen(SOURCE_STALENESS_CARD_GUARDRAILS));
  assert.ok(Object.isFrozen(SOURCE_STALENESS_CARD_POLICY));
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.modelCalls, 0);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.remoteCalls, 0);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.learningPromoted, false);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.activated, 0);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.collectsNothing, true);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.automaticRecovery, false);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.billionUsersProven, false);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.cardNeverFetches, true);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.cardNeverMutatesMemory, true);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.theRealMemoryGate, true);
  assert.equal(SOURCE_STALENESS_CARD_GUARDRAILS.uncheckedIsNotCurrent, true);
  assert.equal(SOURCE_STALENESS_CARD_POLICY.policyVersion, '12d-315-v1');
});

test('source purity: the module imports no fs, no network primitives, no clock, no randomness', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-source-staleness-card.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/fetch\(/.test(src), 'no fetch — the operator supplies the re-fetched digests');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
  assert.ok(!/node:sqlite/.test(src), 'no direct sqlite import (the queue stays behind its doors)');
});