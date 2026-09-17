// 12D-314 — adversarial tests for the citation verify card. Central
// properties under attack:
//   1. THE PACKET IS RE-VERIFIED through the REAL 12D-306 gate — a
//      tampered packet refuses and echoes no memory content.
//   2. CITATIONS ARE EXTRACTED through the REAL 12D-310 extractor and
//      checked against the VERIFIED carried set — fabricated provenance
//      is disclosed by id, zero citations are disclosed as UNGROUNDED.
//   3. VERIFICATION-ONLY: modelCalls 0 everywhere, no caller exists,
//      nothing is written; honest flags pinned on every tamper.
//   4. Secret-shaped drafts are refused before anything is derived.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  CITATION_VERIFY_CARD_GUARDRAILS, CITATION_VERIFY_CARD_POLICY,
  prepareCitationVerifyCard, buildCitationVerifyCardPacket,
} from './xiv-citation-verify-card';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';
import { extractCitedStoryIds } from './xiv-assistant-memory-cited-turn';

const TENANT = 'cvc-tenant';

function hashOf(n: number): string {
  return createHash('sha256').update(`out-${n}`).digest('hex');
}

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `cvc-story-${String(n).padStart(3, '0')}`,
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
  q.settle(lease!, { outcome: 'DRAFT', outputHash: hashOf(n), providerSettled: true });
  q.applyReviewDecision({
    tenantId: TENANT, storyId: story.id, reviewerId: 'secure_code_reviewer',
    expectedOutputHash: hashOf(n), decision: 'APPROVED', reviewRef: `review:${n}`,
  });
}

function realPacket(entries: number): { packet: Record<string, unknown>; storyIds: string[] } {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-314-'));
  const q = new OfflineStoryQueue(join(dir, 'queue.sqlite'));
  const storyIds: string[] = [];
  try {
    for (let i = 1; i <= entries; i += 1) {
      const objective = `READ AND SUMMARIZE reviewed fact number ${i} about the architecture`;
      makeDone(q, i, objective);
      storyIds.push(makeStory(i, objective).id);
    }
    const packet = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    return { packet: JSON.parse(JSON.stringify(packet)) as Record<string, unknown>, storyIds };
  } finally {
    q.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

test('a draft citing ONLY carried ids yields ALL_CITATIONS_VERIFIED with the exact ids', () => {
  const { packet, storyIds } = realPacket(3);
  const draft = `Grounded in [mem:${storyIds[2]}] and [mem:${storyIds[0]}]; the rest is my own reasoning.`;
  const prepared = prepareCitationVerifyCard({ draft, memoryPacket: packet });
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') return;
  assert.equal(prepared.verdict, 'ALL_CITATIONS_VERIFIED');
  assert.deepEqual(prepared.citedStoryIds, [storyIds[2], storyIds[0]]);
  assert.deepEqual(prepared.fabricatedStoryIds, []);
  assert.equal(prepared.tenantId, TENANT);
  const card = buildCitationVerifyCardPacket(prepared);
  assert.equal(card.status, 'VERIFIED');
  if (card.status !== 'VERIFIED') return;
  assert.equal(card.carriedCount, 3);
  assert.equal(card.citedCount, 2);
  assert.equal(card.fabricatedCount, 0);
  assert.equal(card.draftSha256, createHash('sha256').update(draft, 'utf8').digest('hex'));
  assert.equal(card.modelCalls, 0);
  assert.equal(card.remoteCalls, 0);
  assert.equal(card.humanDecision, 'REQUIRED');
  assert.ok(Object.isFrozen(card));
});

test('a draft with NO citations yields UNGROUNDED_NO_CITATIONS — disclosed, not hidden', () => {
  const { packet } = realPacket(2);
  const prepared = prepareCitationVerifyCard({ draft: 'My own reasoning, no memory needed.', memoryPacket: packet });
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') return;
  assert.equal(prepared.verdict, 'UNGROUNDED_NO_CITATIONS');
  assert.deepEqual(prepared.citedStoryIds, []);
  assert.deepEqual(prepared.fabricatedStoryIds, []);
});

test('a draft citing an id outside the carried set yields FABRICATED_CITATIONS disclosed BY ID', () => {
  const { packet } = realPacket(2);
  const draft = 'Grounded in [mem:cvc-story-999] and [mem:cvc-story-001] supposedly.';
  const prepared = prepareCitationVerifyCard({ draft, memoryPacket: packet });
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') return;
  assert.equal(prepared.verdict, 'FABRICATED_CITATIONS');
  assert.deepEqual(prepared.citedStoryIds, ['cvc-story-999', 'cvc-story-001']);
  assert.deepEqual(prepared.fabricatedStoryIds, ['cvc-story-999'],
    'only the id outside the carried set is fabricated');
  const card = buildCitationVerifyCardPacket(prepared);
  assert.equal(card.status, 'VERIFIED');
  if (card.status !== 'VERIFIED') return;
  assert.equal(card.fabricatedCount, 1);
  assert.deepEqual([...card.fabricatedStoryIds], ['cvc-story-999']);
});

test('the extractor agreement: card citations equal a fresh REAL-extractor pass over the draft', () => {
  const { packet, storyIds } = realPacket(2);
  const draft = `A [mem:${storyIds[0]}] b [mem:${storyIds[1]}] c [mem:${storyIds[0]}] dedup.`;
  const prepared = prepareCitationVerifyCard({ draft, memoryPacket: packet });
  if (prepared.status !== 'PREPARED') throw new Error('fixture refused');
  assert.deepEqual(prepared.citedStoryIds, extractCitedStoryIds(draft),
    'the card never re-implements extraction — it IS the REAL extractor');
});

test('a tampered memory packet refuses the card and echoes NO storyId and NO digest', () => {
  const { packet } = realPacket(2);
  const tampered = { ...packet, memoryDigest: 'f'.repeat(64) };
  const prepared = prepareCitationVerifyCard({ draft: 'check me', memoryPacket: tampered });
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status !== 'REFUSED') return;
  assert.ok(prepared.reason.includes('failed verification'));
  assert.ok(!prepared.reason.includes('cvc-story'), 'no storyId echoed');
  assert.ok(!prepared.reason.includes('f'.repeat(64)), 'no digest echoed');
});

test('a secret-shaped draft is refused before anything is derived from it', () => {
  const { packet } = realPacket(2);
  const draft = 'key ghp_' + 'A'.repeat(36) + ' — check me';
  const prepared = prepareCitationVerifyCard({ draft, memoryPacket: packet });
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status === 'REFUSED') assert.ok(!prepared.reason.includes('ghp_'), 'never echoes the secret');
});

test('bounds and exact keys: oversized draft, junk inputs, and wrong keys all refuse', () => {
  const { packet } = realPacket(1);
  const oversized = 'x'.repeat(8_001);
  assert.equal(prepareCitationVerifyCard({ draft: oversized, memoryPacket: packet }).status, 'REFUSED');
  for (const junk of [null, undefined, 'nope', [], {}, { draft: 'a' }, { memoryPacket: packet }, { draft: 'a', memoryPacket: packet, smuggled: 1 }]) {
    assert.equal(prepareCitationVerifyCard(junk).status, 'REFUSED');
  }
  const reordered = { memoryPacket: packet, draft: 'check me' };
  assert.equal(prepareCitationVerifyCard(reordered).status, 'REFUSED');
});

test('the packet is never built from a non-PREPARED card', () => {
  const { packet } = realPacket(1);
  const refused = prepareCitationVerifyCard({ draft: 'a', memoryPacket: { ...packet, memoryDigest: 'e'.repeat(64) } });
  assert.equal(refused.status, 'REFUSED');
  const card = buildCitationVerifyCardPacket(refused as never);
  assert.equal(card.status, 'REFUSED');
});

test('the guardrails are frozen and the honest flags are pinned', () => {
  assert.ok(Object.isFrozen(CITATION_VERIFY_CARD_GUARDRAILS));
  assert.ok(Object.isFrozen(CITATION_VERIFY_CARD_POLICY));
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.modelCalls, 0);
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.remoteCalls, 0);
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.learningPromoted, false);
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.activated, 0);
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.collectsNothing, true);
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.automaticRecovery, false);
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.billionUsersProven, false);
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.verificationOnly, true);
  assert.equal(CITATION_VERIFY_CARD_GUARDRAILS.proseNeverJudged, true);
  assert.equal(CITATION_VERIFY_CARD_POLICY.policyVersion, '12d-314-v1');
});

test('source purity: the module imports no fs, no network primitives, no clock, no randomness', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-citation-verify-card.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/fetch\(/.test(src), 'no fetch');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
  assert.ok(!/node:sqlite/.test(src), 'no direct sqlite import (the queue stays behind its doors)');
});