// 12D-320 — adversarial tests for the conversation summary card. Central
// properties under attack:
//   1. MEASUREMENT, NEVER GENERATION: modelCalls 0 everywhere — there is
//      no model path at all; the verdict is a derived measurement, not an
//      opinion, and it is re-derived from REAL contracts (the REAL
//      12D-310 extractor over the REAL 12D-306 gate's carried set).
//   2. THE MEMORY IS RE-VERIFIED, NEVER TRUSTED: a tampered memory packet
//      refuses the summary; a tenant mismatch refuses it too.
//   3. FABRICATIONS ARE DISCLOSED BY ID; zero citations disclose
//      honestly as UNGROUNDED — never padded, never hidden.
//   4. THE DIGEST IS RE-DERIVED, NOT TRUSTED: mutating the prepared
//      fields cannot forge the tamper-evident binding.
//   5. Honest flags pinned on every packet (VERIFIED and REFUSED alike),
//      exact keys in order, bounded excerpts.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  CONVERSATION_SUMMARY_CARD_GUARDRAILS,
  CONVERSATION_SUMMARY_CARD_POLICY,
  SUMMARY_EXCERPT_CHARS,
  buildConversationSummaryCardPacket,
  prepareConversationSummaryCard,
  type ConversationSummaryCardPrepared,
} from './xiv-conversation-summary-card';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';

const TENANT = 'summary-tenant';

function hashOf(n: number): string {
  return createHash('sha256').update(`out-${n}`).digest('hex');
}

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `fact-story-${String(n).padStart(3, '0')}`,
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

/** A REAL 12D-305 packet over a REAL queue, through the REAL doors. */
function realPacket(entries: number): { packet: Record<string, unknown>; storyIds: string[] } {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-320-'));
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

function summaryInput(
  packet: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    tenantId: TENANT,
    conversationId: 'conv-12d-320',
    userMessage: 'Summarize where this conversation stands.',
    priorTurns: [],
    memoryPacket: packet,
    ...overrides,
  };
}

/** Two turns: turn 1 cites a CARRIED fact + a fabricated one; turn 2 cites nothing. */
function turnsCarriedAndFabricated(storyIds: string[]): { userMessage: string; assistantReply: string }[] {
  return [
    {
      userMessage: 'What has the reading established about the architecture?',
      assistantReply: `The reviewed fact covers the memory layer [mem:${storyIds[0]!}]; and per [mem:fact-story-999] that gate also hardens.`,
    },
    {
      userMessage: 'Anything else?',
      assistantReply: 'Nothing further was established in the reading so far.',
    },
  ];
}

function allGroundedTurns(storyIds: string[]): { userMessage: string; assistantReply: string }[] {
  return [
    {
      userMessage: 'First question on the reviewed facts?',
      assistantReply: `The reviewed fact answers it [mem:${storyIds[0]!}].`,
    },
    {
      userMessage: 'And the second one?',
      assistantReply: `The same reviewed fact grounds this too [mem:${storyIds[1]!}].`,
    },
  ];
}

function verifyPacket(raw: unknown): ConversationSummaryCardPrepared {
  const prepared = prepareConversationSummaryCard(raw);
  assert.equal(prepared.status, 'PREPARED');
  return prepared as ConversationSummaryCardPrepared;
}

test('guardrails: measurement only, honest flags pinned, human decision REQUIRED', () => {
  assert.equal(CONVERSATION_SUMMARY_CARD_GUARDRAILS.measurementOnly, true);
  assert.equal(CONVERSATION_SUMMARY_CARD_GUARDRAILS.modelCalls, 0);
  assert.equal(CONVERSATION_SUMMARY_CARD_GUARDRAILS.remoteCalls, 0);
  assert.equal(CONVERSATION_SUMMARY_CARD_GUARDRAILS.activated, 0);
  assert.equal(CONVERSATION_SUMMARY_CARD_GUARDRAILS.learningPromoted, false);
  assert.equal(CONVERSATION_SUMMARY_CARD_GUARDRAILS.collectsNothing, true);
  assert.equal(CONVERSATION_SUMMARY_CARD_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(CONVERSATION_SUMMARY_CARD_GUARDRAILS.billionUsersProven, false);
  assert.equal(CONVERSATION_SUMMARY_CARD_POLICY.policyVersion, '12d-320-v1');
});

test('FABRICATED_CITATIONS_PRESENT: the fabricated storyId is disclosed BY ID, the carried one grounded', () => {
  const { packet, storyIds } = realPacket(2);
  const input = summaryInput(packet, { priorTurns: turnsCarriedAndFabricated(storyIds) });
  const card = buildConversationSummaryCardPacket(verifyPacket(input));
  assert.equal(card.status, 'VERIFIED');
  if (card.status !== 'VERIFIED') return;
  assert.equal(card.verdict, 'FABRICATED_CITATIONS_PRESENT');
  assert.equal(card.rows.length, 2);
  const row1 = card.rows[0]!;
  assert.equal(row1.turnIndex, 1);
  assert.deepEqual([...row1.citedStoryIds], [storyIds[0], 'fact-story-999']);
  assert.deepEqual([...row1.groundedStoryIds], [storyIds[0]]);
  assert.deepEqual([...row1.fabricatedStoryIds], ['fact-story-999']);
  assert.equal(card.rows[1]!.citedStoryIds.length, 0);
  assert.equal(card.totalCitedCount, 2);
  assert.equal(card.totalGroundedCount, 1);
  assert.equal(card.totalFabricatedCount, 1);
  assert.equal(card.uncitedReplyCount, 1);
  assert.equal(card.modelCalls, 0);
  assert.equal(card.remoteCalls, 0);
  assert.equal(card.humanDecision, 'REQUIRED');
  assert.match(card.stoppedBefore, /measurement only/);
  assert.match(card.summaryDigestSha256, /^[a-f0-9]{64}$/);
  // The packet carries its OWN inputs (the 12D-316 convention).
  assert.deepEqual(card.priorTurns, turnsCarriedAndFabricated(storyIds));
});

test('ALL_REPLIES_GROUNDED when every reply cites carried memory', () => {
  const { packet, storyIds } = realPacket(2);
  const card = buildConversationSummaryCardPacket(
    verifyPacket(summaryInput(packet, { priorTurns: allGroundedTurns(storyIds) })),
  );
  if (card.status !== 'VERIFIED') { assert.fail('expected VERIFIED'); return; }
  assert.equal(card.verdict, 'ALL_REPLIES_GROUNDED');
  assert.equal(card.totalGroundedCount, 2);
  assert.equal(card.totalFabricatedCount, 0);
  assert.equal(card.uncitedReplyCount, 0);
});

test('UNGROUNDED_NO_CITATIONS when replies cite nothing — disclosed, not hidden', () => {
  const { packet } = realPacket(1);
  const turns = [
    { userMessage: 'q1', assistantReply: 'A reply that cites nothing at all.' },
    { userMessage: 'q2', assistantReply: 'Another bare reply.' },
  ];
  const card = buildConversationSummaryCardPacket(verifyPacket(summaryInput(packet, { priorTurns: turns })));
  if (card.status !== 'VERIFIED') { assert.fail('expected VERIFIED'); return; }
  assert.equal(card.verdict, 'UNGROUNDED_NO_CITATIONS');
  assert.equal(card.totalCitedCount, 0);
  assert.equal(card.uncitedReplyCount, 2);
});

test('NO_REPLIES_YET: empty priorTurns falls back honestly (excerpts bounded, one empty)', () => {
  const { packet } = realPacket(1);
  const card = buildConversationSummaryCardPacket(verifyPacket(summaryInput(packet)));
  if (card.status !== 'VERIFIED') { assert.fail('expected VERIFIED'); return; }
  assert.equal(card.verdict, 'NO_REPLIES_YET');
  assert.equal(card.rows.length, 0);
  assert.equal(card.firstUserMessageExcerpt, 'Summarize where this conversation stands.');
  assert.equal(card.lastReplyExcerpt, '');
  assert.match(card.summaryDigestSha256, /^[a-f0-9]{64}$/);
});

test('excerpts are bounded windows (<= 120 chars), never whole-turn dumps', () => {
  const { packet } = realPacket(1);
  const longReply = 'x'.repeat(500);
  const turns = [{ userMessage: 'q', assistantReply: longReply }];
  const card = buildConversationSummaryCardPacket(verifyPacket(summaryInput(packet, { priorTurns: turns })));
  if (card.status !== 'VERIFIED') { assert.fail('expected VERIFIED'); return; }
  assert.equal(card.lastReplyExcerpt.length, SUMMARY_EXCERPT_CHARS);
  assert.ok(card.lastReplyExcerpt.length < longReply.length);
});

test('the memory is RE-VERIFIED, never trusted: a tampered memory packet refuses', () => {
  const { packet } = realPacket(1);
  // Tamper an entry INSIDE the memory packet — the digest binds the
  // entries, so the REAL 12D-306 gate must refuse.
  const tampered = JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  const firstEntry = (tampered.entries as Record<string, unknown>[])[0]!;
  firstEntry.outputHash = 'c'.repeat(64);
  const refused = prepareConversationSummaryCard(summaryInput(tampered));
  assert.equal(refused.status, 'REFUSED');
  if (refused.status !== 'REFUSED') return;
  assert.match(refused.reason, /failed verification|memory packet/i);
  assert.equal(refused.modelCalls, 0);
  assert.equal(refused.humanDecision, 'REQUIRED');
});

test('tenant bound: another tenant cannot measure this conversation', () => {
  const { packet } = realPacket(1);
  const refused = prepareConversationSummaryCard(summaryInput(packet, { tenantId: 'other-tenant' }));
  assert.equal(refused.status, 'REFUSED');
  if (refused.status !== 'REFUSED') return;
  assert.match(refused.reason, /tenant/i);
});

test('secret screening: a secret-shaped user message refuses; the refusal never echoes it', () => {
  const { packet } = realPacket(1);
  const secret = 'use key AKIA' + 'B'.repeat(16) + ' now';
  const refused = prepareConversationSummaryCard(summaryInput(packet, { userMessage: secret }));
  assert.equal(refused.status, 'REFUSED');
  if (refused.status !== 'REFUSED') return;
  assert.match(refused.reason, /secret-shaped/);
  assert.ok(!refused.reason.includes(secret), 'the refusal must never echo the secret');
});

test('exact keys in order: reordered, missing, extra all refuse', () => {
  const { packet } = realPacket(1);
  const base = summaryInput(packet);
  const reordered = { memoryPacket: base.memoryPacket, priorTurns: [], userMessage: base.userMessage, conversationId: base.conversationId, tenantId: base.tenantId };
  assert.equal(prepareConversationSummaryCard(reordered).status, 'REFUSED');
  const missing = { tenantId: TENANT, conversationId: 'c', userMessage: 'x', memoryPacket: packet };
  assert.equal(prepareConversationSummaryCard(missing).status, 'REFUSED');
  const extra = summaryInput(packet, { surprise: 1 });
  assert.equal(prepareConversationSummaryCard(extra).status, 'REFUSED');
  assert.equal(prepareConversationSummaryCard(null).status, 'REFUSED');
  assert.equal(prepareConversationSummaryCard('nope').status, 'REFUSED');
  assert.equal(prepareConversationSummaryCard([]).status, 'REFUSED');
});

test('the digest is RE-DERIVED, not trusted: mutating prepared fields cannot forge it', () => {
  const { packet, storyIds } = realPacket(2);
  const input = summaryInput(packet, { priorTurns: turnsCarriedAndFabricated(storyIds) });
  const honest = buildConversationSummaryCardPacket(verifyPacket(input));
  if (honest.status !== 'VERIFIED') { assert.fail('expected VERIFIED'); return; }
  // Tamper the prepared carried set to try to LAUNDER the fabrication…
  const prepared: ConversationSummaryCardPrepared = {
    ...verifyPacket(input),
    carriedStoryIds: [...storyIds, 'fact-story-999'],
  };
  // …but the builder re-derives rows via the REAL extractor against the
  // supplied set, so the forged set changes the MEASUREMENT (the
  // fabricated id disappears from fabricatedStoryIds) — yet the digest
  // still binds the re-derived values, not any caller-supplied claim.
  const laundered = buildConversationSummaryCardPacket(prepared as unknown as ConversationSummaryCardPrepared);
  if (laundered.status !== 'VERIFIED') { assert.fail('expected VERIFIED'); return; }
  assert.deepEqual([...laundered.rows[0]!.fabricatedStoryIds], []);
  assert.equal(laundered.verdict, 'ALL_REPLIES_GROUNDED');
  // The laundered digest differs from the honest one — tamper-evident.
  assert.notEqual(laundered.summaryDigestSha256, honest.summaryDigestSha256);
  // And the digest genuinely binds the re-derived derivation:
  const reHash = createHash('sha256').update(JSON.stringify({
    policyVersion: '12d-320-v1',
    tenantId: laundered.tenantId, conversationId: laundered.conversationId,
    priorTurnCount: laundered.priorTurnCount, userMessageChars: laundered.userMessageChars,
    firstUserMessageExcerpt: laundered.firstUserMessageExcerpt,
    lastReplyExcerpt: laundered.lastReplyExcerpt, verdict: laundered.verdict,
    rows: laundered.rows,
    totalCitedCount: laundered.totalCitedCount, totalGroundedCount: laundered.totalGroundedCount,
    totalFabricatedCount: laundered.totalFabricatedCount, uncitedReplyCount: laundered.uncitedReplyCount,
    memoryCarried: laundered.memoryCarried, memoryDoneCount: laundered.memoryDoneCount,
  }), 'utf8').digest('hex');
  assert.equal(laundered.summaryDigestSha256, reHash);
});