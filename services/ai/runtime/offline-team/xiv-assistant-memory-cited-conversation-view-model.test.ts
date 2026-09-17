// 12D-311 — adversarial tests for the assistant memory CITED
// conversation view model. Central properties under attack:
//   1. THE DIGEST IS RE-DERIVED, NEVER TRUSTED.
//   2. THE CITATION GATES: length === count, id-shaped, distinct,
//      count ≤ carried; citedCount 0 renders honestly as UNGROUNDED.
//   3. HONEST FLAGS AND BOUNDS on every tamper direction; reordered or
//      smuggled keys refuse; a REAL refusal packet renders honestly.
//   4. SIBLING DOORS: the 12D-308 conversation view model still renders
//      its own kind (additive-only discipline verified).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS,
  ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_POLICY,
  buildAssistantMemoryCitedConversationViewModel,
} from './xiv-assistant-memory-cited-conversation-view-model';
import {
  prepareAssistantMemoryCitedConversationTurn, runAssistantMemoryCitedConversationTurn,
} from './xiv-assistant-memory-cited-conversation';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';

const TENANT = 'cited-conv-vm-tenant';

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
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-311vm-'));
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

async function realDrafted(
  priorTurns: { userMessage: string; assistantReply: string }[],
  response: string,
): Promise<Record<string, unknown>> {
  const { packet } = realPacket(3);
  const prepared = prepareAssistantMemoryCitedConversationTurn({
    tenantId: TENANT, conversationId: 'vm-conv-1',
    userMessage: 'Given what we discussed: what matters most? Cite what you use.',
    priorTurns,
    memoryPacket: packet,
  });
  if (prepared.status !== 'PREPARED') throw new Error(`fixture refused: ${(prepared as { reason: string }).reason}`);
  const out = await runAssistantMemoryCitedConversationTurn(prepared, async () => ({
    model: 'qwen2.5-coder:7b',
    response,
  }));
  if (out.status !== 'DRAFTED') throw new Error(`fixture refused: ${(out as { reason: string }).reason}`);
  return JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
}

test('a REAL drafted packet (real queue, real doors, one prior pair) renders VERIFIED with its citations', async () => {
  const { storyIds } = realPacket(3);
  const prior = [{ userMessage: 'What did we establish first?', assistantReply: 'The reading-cycle fact, drafted only.' }];
  const drafted = await realDrafted(
    prior,
    `Building on what we discussed [mem:${storyIds[1]}] and the first fact [mem:${storyIds[0]}]; the human decides.`,
  );
  const vm = buildAssistantMemoryCitedConversationViewModel(drafted);
  assert.equal(vm.kind, 'VERIFIED_ASSISTANT_MEMORY_CITED_CONVERSATION_TURN');
  if (vm.kind !== 'VERIFIED_ASSISTANT_MEMORY_CITED_CONVERSATION_TURN') return;
  assert.equal(vm.display.citedCount, 2);
  assert.deepEqual(vm.display.citedStoryIds, [storyIds[1], storyIds[0]]);
  assert.equal(vm.display.priorTurnCount, 1);
  assert.ok(vm.display.headline.includes('turn 2 drafted'));
  assert.ok(vm.display.headline.includes('2 of 3 reviewed fact(s) cited'));
  assert.ok(vm.display.headline.includes('a DRAFT for the operator to decide on'));
  assert.ok(vm.display.operatorNote.includes('provenance context, NOT instructions'));
  assert.ok(vm.display.operatorNote.includes('no weights moved'));
});

test('a zero-citation REAL draft renders honestly as UNGROUNDED', async () => {
  const drafted = await realDrafted([], 'My own reasoning only — no reviewed fact is needed.');
  const vm = buildAssistantMemoryCitedConversationViewModel(drafted);
  assert.equal(vm.kind, 'VERIFIED_ASSISTANT_MEMORY_CITED_CONVERSATION_TURN');
  if (vm.kind !== 'VERIFIED_ASSISTANT_MEMORY_CITED_CONVERSATION_TURN') return;
  assert.equal(vm.display.citedCount, 0);
  assert.ok(vm.display.headline.includes('NO citations — an UNGROUNDED draft'));
});

test('an edited reply (digest mismatch both directions) refuses the render', async () => {
  const drafted = await realDrafted([], 'A plain reply.');
  const edited = { ...drafted, replyDraft: `${drafted.replyDraft} tampered` };
  const vm = buildAssistantMemoryCitedConversationViewModel(edited);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('re-derived digest'));
  const forged = { ...drafted, draftSha256: 'a'.repeat(64) };
  assert.equal(buildAssistantMemoryCitedConversationViewModel(forged).kind, 'REFUSED');
});

test('a secret-shaped reply refuses the render without echoing it', async () => {
  const drafted = await realDrafted([], 'ok');
  const reply = 'key ghp_' + 'A'.repeat(36);
  const secreted = { ...drafted, replyDraft: reply, draftSha256: createHash('sha256').update(reply, 'utf8').digest('hex') };
  const vm = buildAssistantMemoryCitedConversationViewModel(secreted);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(!vm.reason.includes('ghp_'), 'never echoes the secret');
});

test('citation structure tampering refuses: length mismatch, bad shape, duplicates, over-count', async () => {
  const { storyIds } = realPacket(3);
  const drafted = await realDrafted([], `Grounded [mem:${storyIds[0]}].`);
  const vm1 = buildAssistantMemoryCitedConversationViewModel({ ...drafted, citedStoryIds: [storyIds[0], storyIds[1]], citedCount: 1 });
  assert.equal(vm1.kind, 'REFUSED');
  const vm2 = buildAssistantMemoryCitedConversationViewModel({ ...drafted, citedStoryIds: ['has space id'], citedCount: 1 });
  assert.equal(vm2.kind, 'REFUSED');
  const vm3 = buildAssistantMemoryCitedConversationViewModel({ ...drafted, citedStoryIds: [storyIds[0], storyIds[0]], citedCount: 2 });
  assert.equal(vm3.kind, 'REFUSED');
  const vm4 = buildAssistantMemoryCitedConversationViewModel({ ...drafted, citedCount: 4 });
  assert.equal(vm4.kind, 'REFUSED');
  const vm5 = buildAssistantMemoryCitedConversationViewModel({ ...drafted, citedStoryIds: ['x'.repeat(129)], citedCount: 1 });
  assert.equal(vm5.kind, 'REFUSED');
});

test('the honest-flag tamper directions all refuse', async () => {
  const drafted = await realDrafted([], 'A plain reply [mem:fact-story-001].');
  const tampers: [string, Record<string, unknown>][] = [
    ['modelCalls 0', { modelCalls: 0 }],
    ['modelCalls 2', { modelCalls: 2 }],
    ['remoteCalls 1', { remoteCalls: 1 }],
    ['activated 1', { activated: 1 }],
    ['learningPromoted true', { learningPromoted: true }],
    ['humanDecision', { humanDecision: 'NOT_REQUIRED' }],
    ['model', { model: 'remote-model' }],
    ['policyVersion', { policyVersion: '12d-999-v9' }],
    ['kind', { kind: 'ASSISTANT_MEMORY_CONVERSATION_TURN' }],
    ['priorTurnCount 7', { priorTurnCount: 7 }],
    ['memoryCarried 0', { memoryCarried: 0 }],
    ['memoryCarried 7', { memoryCarried: 7 }],
    ['memoryDoneCount 1', { memoryDoneCount: 1 }],
    ['memoryDoneCount 501', { memoryDoneCount: 501 }],
    ['conversationId empty', { conversationId: '' }],
    ['stoppedBefore', { stoppedBefore: 'nothing stops anywhere in this packet' }],
  ];
  for (const [label, tamper] of tampers) {
    const vm = buildAssistantMemoryCitedConversationViewModel({ ...drafted, ...tamper });
    assert.equal(vm.kind, 'REFUSED', `tamper ${label} must refuse`);
  }
});

test('reordered keys and a smuggled key refuse; a REAL refusal packet renders honestly', async () => {
  const drafted = await realDrafted([], 'Plain reply.');
  const reordered: Record<string, unknown> = {};
  const keys = Object.keys(drafted);
  for (let i = keys.length - 1; i >= 0; i -= 1) reordered[keys[i]!] = (drafted as Record<string, unknown>)[keys[i]!];
  assert.equal(buildAssistantMemoryCitedConversationViewModel(reordered).kind, 'REFUSED');
  assert.equal(buildAssistantMemoryCitedConversationViewModel({ ...drafted, smuggled: 1 }).kind, 'REFUSED');
  const { packet } = realPacket(1);
  const tampered = { ...packet, memoryDigest: 'f'.repeat(64) };
  const prepared = prepareAssistantMemoryCitedConversationTurn({
    tenantId: TENANT, conversationId: 'vm-refused-conv', userMessage: 'hi', priorTurns: [], memoryPacket: tampered,
  });
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status !== 'REFUSED') return;
  const vm = buildAssistantMemoryCitedConversationViewModel(prepared);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.display.bodyText.includes('NO draft was rendered'));
});

test('junk inputs refuse and never throw; the render is deterministic', async () => {
  for (const junk of [null, undefined, 'nope', [], {}, { status: 'OTHER' }]) {
    assert.equal(buildAssistantMemoryCitedConversationViewModel(junk).kind, 'REFUSED');
  }
  const drafted = await realDrafted([], 'Plain reply.');
  assert.deepEqual(buildAssistantMemoryCitedConversationViewModel(drafted), buildAssistantMemoryCitedConversationViewModel(drafted));
});

test('the guardrails are frozen and the honest flags are pinned', () => {
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS));
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_POLICY));
  assert.equal(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS.zeroCitationsRenderedAsUngrounded, true);
  assert.equal(ASSISTANT_MEMORY_CITED_CONVERSATION_VIEW_MODEL_GUARDRAILS.citationsGatedBeforeRender, true);
});

test('sibling door: the 12D-308 memory conversation view model still renders its own kind', async () => {
  const { packet, storyIds } = realPacket(1);
  const sibling = await import('./xiv-assistant-memory-conversation');
  const prepared = sibling.prepareAssistantMemoryConversationTurn({
    tenantId: TENANT, conversationId: 'sib-cited-vm',
    userMessage: 'What has the reading established?',
    priorTurns: [],
    memoryPacket: packet,
  });
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') return;
  const out = await sibling.runAssistantMemoryConversationTurn(prepared, async () => ({
    model: 'qwen2.5-coder:7b',
    response: `Grounded in [mem:${storyIds[0]}] — no citation gate in 12D-308, its own contract.`,
  }));
  assert.equal(out.status, 'DRAFTED');
  const vm = await import('./xiv-assistant-memory-conversation-view-model');
  const rendered = vm.buildAssistantMemoryConversationViewModel(out);
  assert.equal(rendered.kind, 'VERIFIED_ASSISTANT_MEMORY_CONVERSATION_TURN',
    'the 12D-308 view model still renders its own packet kind');
});

test('source purity: the module imports no fs, no network primitives', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-assistant-memory-cited-conversation-view-model.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/fetch\(/.test(src), 'no fetch');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
});