// 12D-320 — adversarial tests for the conversation summary card VIEW
// MODEL. Central properties under attack:
//   1. THE ENTIRE CARD IS RE-DERIVED from the packet's own inputs
//      through ONLY real contracts — a tampered row, verdict, digest,
//      excerpt, count or tenant renders NOTHING (honest refusal, no
//      partial render, no crash).
//   2. Fail closed for ANY unknown value — the VM never throws.
//   3. Honest flags are enforced inside the VERIFIED branch: a packet
//      claiming modelCalls 1 or learningPromoted true refuses.
//   4. Fabrications render with their ids; refusals never render
//      summary content.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  buildConversationSummaryCardPacket,
  prepareConversationSummaryCard,
  type ConversationSummaryCardPacket,
} from './xiv-conversation-summary-card';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';
import {
  buildConversationSummaryCardViewModel,
  CONVERSATION_SUMMARY_CARD_VIEW_MODEL_GUARDRAILS,
  CONVERSATION_SUMMARY_CARD_VIEW_MODEL_POLICY,
} from './xiv-conversation-summary-card-view-model';

const TENANT = 'summary-vm-tenant';

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

function realPacket(entries: number): { packet: Record<string, unknown>; storyIds: string[] } {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-320-vm-'));
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

/**
 * A REAL VERIFIED packet built through the REAL doors, carrying its own
 * inputs (the 12D-316 convention) so the VM can re-derive it.
 */
function realVerifiedPacket() {
  const { packet, storyIds } = realPacket(2);
  const turns = [
    {
      userMessage: 'What has the reading established?',
      assistantReply: `The reviewed fact covers the memory layer [mem:${storyIds[0]!}]; and per [mem:fact-story-999] that gate also hardens.`,
    },
    {
      userMessage: 'Anything else?',
      assistantReply: `Only the second reviewed fact remains relevant [mem:${storyIds[1]!}].`,
    },
  ];
  const prepared = prepareConversationSummaryCard({
    tenantId: TENANT, conversationId: 'conv-vm-1',
    userMessage: 'Summarize where this conversation stands.',
    priorTurns: turns, memoryPacket: packet,
  });
  assert.equal(prepared.status, 'PREPARED');
  const built = buildConversationSummaryCardPacket(prepared);
  if (built.status !== 'VERIFIED') { assert.fail('expected a VERIFIED packet'); }
  return built;
}

function tamper(p: ConversationSummaryCardPacket, patch: Record<string, unknown>): Record<string, unknown> {
  // Spread preserves the exact key ORDER while replacing values.
  return { ...p, ...patch } as Record<string, unknown>;
}

test('VM guardrails pinned; policy version matches the contract', () => {
  assert.equal(CONVERSATION_SUMMARY_CARD_VIEW_MODEL_POLICY.policyVersion, '12d-320-v1');
  assert.equal(CONVERSATION_SUMMARY_CARD_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(CONVERSATION_SUMMARY_CARD_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(CONVERSATION_SUMMARY_CARD_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(CONVERSATION_SUMMARY_CARD_VIEW_MODEL_GUARDRAILS.cardReDerivedFromTheInputs, true);
  assert.equal(CONVERSATION_SUMMARY_CARD_VIEW_MODEL_GUARDRAILS.onlyRealContractsReRun, true);
});

test('an honest VERIFIED packet renders a fully re-derived view — fabrications by id, honest counts', () => {
  const packet = realVerifiedPacket();
  const vm = buildConversationSummaryCardViewModel(packet);
  assert.equal(vm.kind, 'VERIFIED_CONVERSATION_SUMMARY');
  if (vm.kind !== 'VERIFIED_CONVERSATION_SUMMARY') return;
  assert.equal(vm.display.verdict, 'FABRICATED_CITATIONS_PRESENT');
  assert.deepEqual([...vm.display.rows[0]!.fabricatedStoryIds], ['fact-story-999']);
  assert.deepEqual([...vm.display.rows[1]!.fabricatedStoryIds], []);
  assert.equal(vm.display.totalFabricatedCount, 1);
  assert.equal(vm.display.totalGroundedCount, 2);
  assert.equal(vm.display.priorTurnCount, 2);
  assert.equal(vm.display.memoryDoneCount, 2);
  assert.ok(vm.display.headline.includes('fabricated citations present'));
  assert.match(vm.display.summaryDigestSha256, /^[a-f0-9]{64}$/);
  assert.match(vm.display.verdictNote, /disclosed BY ID/);
  // The VM never echoes a model call count other than zero.
  assert.ok(!JSON.stringify(vm).includes('"modelCalls":1'));
});

test('a tampered VERDICT renders NOTHING (the re-derived verdict wins)', () => {
  const packet = realVerifiedPacket();
  const vm = buildConversationSummaryCardViewModel(tamper(packet, { verdict: 'ALL_REPLIES_GROUNDED' }));
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.reason, /verdict/);
  assert.match(vm.display.bodyText, /NO summary was rendered/);
});

test('a tampered ROW (laundering the fabricated id) renders NOTHING', () => {
  const packet = realVerifiedPacket();
  const launderedRows = packet.rows.map((r, i) => (i === 0
    ? { ...r, fabricatedStoryIds: Object.freeze([] as string[]) }
    : r));
  const vm = buildConversationSummaryCardViewModel(tamper(packet, { rows: launderedRows }));
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.reason, /row 1 does not match/);
});

test('a tampered DIGEST renders NOTHING (the re-derived digest wins)', () => {
  const packet = realVerifiedPacket();
  const forged = 'f'.repeat(64);
  const vm = buildConversationSummaryCardViewModel(tamper(packet, { summaryDigestSha256: forged }));
  assert.equal(vm.kind, 'REFUSED');
  assert.match((vm as { reason: string }).reason, /digest/);
});

test('a tampered EXCERPT renders NOTHING', () => {
  const packet = realVerifiedPacket();
  const vm = buildConversationSummaryCardViewModel(
    tamper(packet, { lastReplyExcerpt: 'a completely different excerpt' }),
  );
  assert.equal(vm.kind, 'REFUSED');
  assert.match((vm as { reason: string }).reason, /excerpts/);
});

test('tampered counts (totals, memory counts, priorTurnCount, userMessageChars) all refuse', () => {
  const packet = realVerifiedPacket();
  for (const patch of [
    { totalCitedCount: 0 }, { totalGroundedCount: 0 }, { totalFabricatedCount: 0 },
    { memoryCarried: 0 }, { memoryDoneCount: 0 },
    { priorTurnCount: 5 }, { userMessageChars: 1 },
  ]) {
    const vm = buildConversationSummaryCardViewModel(tamper(packet, patch));
    assert.equal(vm.kind, 'REFUSED', `expected refusal for patch ${JSON.stringify(patch)}`);
  }
});

test('a swapped tenantId refuses (one tenant never measures another tenant)', () => {
  const packet = realVerifiedPacket();
  const vm = buildConversationSummaryCardViewModel(tamper(packet, { tenantId: 'other-tenant' }));
  assert.equal(vm.kind, 'REFUSED');
  assert.match((vm as { reason: string }).reason, /tenant/);
});

test('honest-flag violations refuse: modelCalls 1, learningPromoted true, wrong humanDecision', () => {
  const packet = realVerifiedPacket();
  const vm1 = buildConversationSummaryCardViewModel(tamper(packet, { modelCalls: 1 }));
  assert.equal(vm1.kind, 'REFUSED');
  const vm2 = buildConversationSummaryCardViewModel(tamper(packet, { learningPromoted: true }));
  assert.equal(vm2.kind, 'REFUSED');
  const vm3 = buildConversationSummaryCardViewModel(tamper(packet, { humanDecision: 'NOT_REQUIRED' }));
  assert.equal(vm3.kind, 'REFUSED');
});

test('wrong kind or policyVersion refuses; reordered keys refuse', () => {
  const packet = realVerifiedPacket();
  const vm = buildConversationSummaryCardViewModel(tamper(packet, { kind: 'SOMETHING_ELSE' }));
  assert.equal(vm.kind, 'REFUSED');
  const vm2 = buildConversationSummaryCardViewModel(tamper(packet, { policyVersion: '12d-319-v1' }));
  assert.equal(vm2.kind, 'REFUSED');
  // Reordered keys: build a fresh object with a different key order.
  const entries = Object.entries(packet as Record<string, unknown>).reverse();
  const reordered = Object.fromEntries(entries);
  const vm3 = buildConversationSummaryCardViewModel(reordered);
  assert.equal(vm3.kind, 'REFUSED');
});

test('a REFUSED packet renders the honest refusal — and nothing else', () => {
  const { packet } = realPacket(1);
  // Make the REAL doors refuse: swap the tenant.
  const refused2 = prepareConversationSummaryCard({
    tenantId: 'other-tenant', conversationId: 'conv-vm-2', userMessage: 'q',
    priorTurns: [], memoryPacket: packet,
  });
  assert.equal(refused2.status, 'REFUSED');
  const vm = buildConversationSummaryCardViewModel(refused2);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.display.bodyText, /NO summary was rendered/);
  assert.match(vm.display.headline, /HUMAN DECISION REQUIRED/);
  // The refusal must NOT carry summary rows or a digest.
  const vmJson = JSON.stringify(vm);
  assert.ok(!vmJson.includes('summaryDigestSha256'));
  assert.ok(!vmJson.includes('groundedStoryIds'));
});

test('fail closed for ANY unknown value — never throws', () => {
  const packet = realVerifiedPacket();
  for (const bad of [null, undefined, 'string', 42, [], true, {}, packet.rows]) {
    const vm = buildConversationSummaryCardViewModel(bad);
    assert.equal(vm.kind, 'REFUSED');
  }
});

test('a REFUSED-shaped packet with mutated flags refuses', () => {
  const { packet } = realPacket(1);
  const refused2 = prepareConversationSummaryCard({
    tenantId: 'other-tenant', conversationId: 'conv-vm-3', userMessage: 'q',
    priorTurns: [], memoryPacket: packet,
  });
  if (refused2.status !== 'REFUSED') { assert.fail('expected REFUSED'); return; }
  const bad = { ...refused2, modelCalls: 1 };
  const vm = buildConversationSummaryCardViewModel(bad);
  assert.equal(vm.kind, 'REFUSED');
  assert.match((vm as { reason: string }).reason, /honest flags/);
});