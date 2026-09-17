// 12D-308 — adversarial tests for the assistant memory conversation
// turn (memory seam + conversation seam in one door). Central
// properties under attack:
//   1. THE MEMORY IS RE-VERIFIED, NEVER TRUSTED, through the REAL
//      12D-306 gate; a tampered packet refuses pre-call (modelCalls 0).
//   2. THE HISTORY IS RE-SCREENED (12D-302 discipline): a secret-shaped
//      string ANYWHERE in the prior pairs refuses pre-call.
//   3. THE CEILING IS DERIVED FROM REAL EXPORTED CONSTANTS, and every
//      bound refuses rather than truncates.
//   4. TENANT BOUND: another tenant's memory never drafts this reply.
//   5. DRAFT-ONLY, HONEST FLAGS: modelCalls 1, remoteCalls 0, the
//      composed prompt is the ONLY thing sent to the model.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS,
  ASSISTANT_MEMORY_CONVERSATION_POLICY,
  COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS,
  prepareAssistantMemoryConversationTurn,
  runAssistantMemoryConversationTurn,
} from './xiv-assistant-memory-conversation';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';
import {
  ASSISTANT_PERSONA_PREAMBLE, MAX_ASSISTANT_REPLY_CHARS,
} from './xiv-assistant-turn';
import {
  COMPOSED_CONVERSATION_PROMPT_CHARS,
  ASSISTANT_CONVERSATION_USER_LABEL, ASSISTANT_CONVERSATION_REPLY_LABEL, ASSISTANT_CONVERSATION_TURN_LABEL,
} from './xiv-assistant-conversation';
import {
  ASSISTANT_MEMORY_BLOCK_LABEL, ASSISTANT_MEMORY_MAX_ENTRIES,
  ASSISTANT_MEMORY_OBJECTIVE_CAP, ASSISTANT_MEMORY_ENTRY_OVERHEAD,
} from './xiv-assistant-memory-turn';

const TENANT = 'memory-tenant';

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
function realPacket(entries: number): Record<string, unknown> {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-308-'));
  const q = new OfflineStoryQueue(join(dir, 'queue.sqlite'));
  try {
    for (let i = 1; i <= entries; i += 1) {
      const objective = `READ AND SUMMARIZE reviewed fact number ${i} about the architecture`;
      makeDone(q, i, objective);
    }
    return JSON.parse(JSON.stringify(prepareAssistantMemoryRead(q, { tenantId: TENANT }))) as Record<string, unknown>;
  } finally {
    q.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function turnInput(packet: Record<string, unknown>, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    tenantId: TENANT,
    conversationId: 'conv-1',
    userMessage: 'Building on the conversation and the reviewed facts, what is still unverified?',
    priorTurns: [
      { userMessage: 'What has the reading established?', assistantReply: 'The reviewed facts cover the reading cycle; the human decides.' },
    ],
    memoryPacket: packet,
    ...overrides,
  };
}

test('the composed-prompt ceiling is DERIVED from the REAL exported constants, never guessed', () => {
  const expected = COMPOSED_CONVERSATION_PROMPT_CHARS
    + ASSISTANT_MEMORY_BLOCK_LABEL.length
    + ASSISTANT_MEMORY_MAX_ENTRIES * (ASSISTANT_MEMORY_ENTRY_OVERHEAD + ASSISTANT_MEMORY_OBJECTIVE_CAP);
  assert.equal(COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS, expected);
  // The ceiling must accommodate the worst case: full history AND full memory.
  const worstCase = ASSISTANT_PERSONA_PREAMBLE.length
    + ASSISTANT_MEMORY_BLOCK_LABEL.length
    + ASSISTANT_MEMORY_MAX_ENTRIES * (ASSISTANT_MEMORY_ENTRY_OVERHEAD + ASSISTANT_MEMORY_OBJECTIVE_CAP)
    + 6 * (ASSISTANT_CONVERSATION_USER_LABEL.length + 4_000 + ASSISTANT_CONVERSATION_REPLY_LABEL.length + MAX_ASSISTANT_REPLY_CHARS)
    + ASSISTANT_CONVERSATION_TURN_LABEL.length + 4_000;
  assert.ok(COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS >= worstCase);
});

test('a REAL memory packet + REAL history prepares a turn whose prompt carries both seams', () => {
  const packet = realPacket(6);
  const prepared = prepareAssistantMemoryConversationTurn(turnInput(packet));
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') return;
  assert.equal(prepared.memoryCarried, 6);
  assert.equal(prepared.memoryDoneCount, 6);
  assert.equal(prepared.priorTurnCount, 1);
  assert.ok(prepared.prompt.startsWith(ASSISTANT_PERSONA_PREAMBLE));
  assert.ok(prepared.prompt.includes(ASSISTANT_MEMORY_BLOCK_LABEL.trim()));
  assert.ok(prepared.prompt.includes('Operator said:'));
  assert.ok(prepared.prompt.includes('Assistant drafted:'));
  assert.ok(prepared.prompt.endsWith(ASSISTANT_CONVERSATION_TURN_LABEL
    + 'Building on the conversation and the reviewed facts, what is still unverified?'));
  assert.ok(prepared.prompt.length <= COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS);
});

test('a tampered memory packet (forged digest) refuses the turn pre-call with modelCalls 0', () => {
  const packet = realPacket(3);
  const tampered = { ...packet, memoryDigest: 'f'.repeat(64) };
  const refused = prepareAssistantMemoryConversationTurn(turnInput(tampered));
  assert.equal(refused.status, 'REFUSED');
  if (refused.status !== 'REFUSED') return;
  assert.equal(refused.modelCalls, 0);
  assert.ok(refused.reason.includes('failed verification'));
  assert.ok(!refused.reason.includes('fact-story'), 'the refusal never echoes memory content');
});

test('a secret-shaped string ANYWHERE in the prior history refuses pre-call', () => {
  const packet = realPacket(1);
  for (const [field, value] of [
    ['userMessage', 'use key ghp_' + 'A'.repeat(36)],
    ['assistantReply', 'here: sk-' + 'a'.repeat(30) + ' ok'],
  ] as const) {
    // The secret sits IN the declared pair field — no smuggled keys.
    const priorTurns = [field === 'userMessage'
      ? { userMessage: value, assistantReply: 'normal draft' }
      : { userMessage: 'normal question', assistantReply: value }];
    const refused = prepareAssistantMemoryConversationTurn(turnInput(packet, { priorTurns }));
    assert.equal(refused.status, 'REFUSED');
    if (refused.status !== 'REFUSED') return;
    assert.equal(refused.modelCalls, 0);
    assert.ok(refused.reason.includes('secret-shaped'));
  }
});

test('a memory packet from another tenant refuses (tenant bound)', () => {
  const packet = realPacket(2);
  const refused = prepareAssistantMemoryConversationTurn(turnInput(packet, { tenantId: 'other-tenant' }));
  assert.equal(refused.status, 'REFUSED');
  if (refused.status !== 'REFUSED') return;
  assert.equal(refused.modelCalls, 0);
  assert.ok(refused.reason.includes('tenant does not match'));
});

test('a secret-shaped operator message refuses before ANY model call', () => {
  const packet = realPacket(1);
  const refused = prepareAssistantMemoryConversationTurn(turnInput(packet, { userMessage: 'token AKIA' + '0123456789ABCDEF' + 'aa' }));
  assert.equal(refused.status, 'REFUSED');
  if (refused.status !== 'REFUSED') return;
  assert.equal(refused.modelCalls, 0);
  assert.ok(refused.reason.includes('secret-shaped'));
});

test('junk inputs and shape violations refuse honestly and never throw', () => {
  assert.equal(prepareAssistantMemoryConversationTurn(null).status, 'REFUSED');
  assert.equal(prepareAssistantMemoryConversationTurn('nope').status, 'REFUSED');
  assert.equal(prepareAssistantMemoryConversationTurn([]).status, 'REFUSED');
  const packet = realPacket(1);
  // Reordered keys refuse.
  const reordered = { memoryPacket: packet, tenantId: TENANT, conversationId: 'c', userMessage: 'hi', priorTurns: [] };
  assert.equal(prepareAssistantMemoryConversationTurn(reordered).status, 'REFUSED');
  // Extra key refuses.
  assert.equal(prepareAssistantMemoryConversationTurn(turnInput(packet, { extra: 1 })).status, 'REFUSED');
  // Bounded-string violations refuse.
  assert.equal(prepareAssistantMemoryConversationTurn(turnInput(packet, { conversationId: '' })).status, 'REFUSED');
  assert.equal(prepareAssistantMemoryConversationTurn(turnInput(packet, { userMessage: 'x'.repeat(4_001) })).status, 'REFUSED');
  // More than 6 prior pairs refuses.
  const seven = Array.from({ length: 7 }, (_, i) => ({ userMessage: `q${i}`, assistantReply: `a${i}` }));
  assert.equal(prepareAssistantMemoryConversationTurn(turnInput(packet, { priorTurns: seven })).status, 'REFUSED');
  // A prior pair with a smuggled key refuses.
  assert.equal(prepareAssistantMemoryConversationTurn(turnInput(packet, {
    priorTurns: [{ userMessage: 'q', assistantReply: 'a', smuggled: 'x' }],
  })).status, 'REFUSED');
});

test('the run drafts through the injected caller with honest counted flags', async () => {
  const packet = realPacket(2);
  const prepared = prepareAssistantMemoryConversationTurn(turnInput(packet));
  if (prepared.status !== 'PREPARED') return assert.fail('expected PREPARED');
  let calledWith: string | null = null;
  const packetOut = await runAssistantMemoryConversationTurn(prepared, async (prompt) => {
    calledWith = prompt;
    return { model: ASSISTANT_MEMORY_CONVERSATION_POLICY.modelName, response: 'Draft: given the reviewed facts and our exchange, the unverified part is the operator decision itself.' };
  });
  assert.equal(packetOut.status, 'DRAFTED');
  if (packetOut.status !== 'DRAFTED') return;
  assert.equal(calledWith, prepared.prompt, 'the composed prompt is the ONLY thing sent to the model');
  assert.equal(packetOut.modelCalls, 1);
  assert.equal(packetOut.remoteCalls, 0);
  assert.equal(packetOut.learningPromoted, false);
  assert.equal(packetOut.activated, 0);
  assert.equal(packetOut.humanDecision, 'REQUIRED');
  assert.equal(packetOut.memoryCarried, 2);
  assert.equal(packetOut.priorTurnCount, 1);
  assert.equal(packetOut.draftSha256, createHash('sha256').update(packetOut.replyDraft, 'utf8').digest('hex'));
});

test('the run refuses a caller reporting a non-pinned model (post-call, disclosed)', async () => {
  const packet = realPacket(1);
  const prepared = prepareAssistantMemoryConversationTurn(turnInput(packet));
  if (prepared.status !== 'PREPARED') return assert.fail('expected PREPARED');
  const refused = await runAssistantMemoryConversationTurn(prepared, async () => ({ model: 'remote-model', response: 'hi' }));
  assert.equal(refused.status, 'REFUSED');
  if (refused.status !== 'REFUSED') return;
  assert.ok(refused.reason.includes('pinned local model'));
});

test('the run refuses a secret-shaped reply post-call without echoing the secret', async () => {
  const packet = realPacket(1);
  const prepared = prepareAssistantMemoryConversationTurn(turnInput(packet));
  if (prepared.status !== 'PREPARED') return assert.fail('expected PREPARED');
  const refused = await runAssistantMemoryConversationTurn(prepared, async () => ({
    model: ASSISTANT_MEMORY_CONVERSATION_POLICY.modelName,
    response: 'your key is ghp_' + 'A'.repeat(36) + ' regards',
  }));
  assert.equal(refused.status, 'REFUSED');
  if (refused.status !== 'REFUSED') return;
  assert.ok(refused.reason.includes('secret-shaped'));
  assert.ok(!refused.reason.includes('ghp_'), 'the refusal never echoes the secret');
});

test('the run refuses a caller failure pre-call with modelCalls 0', async () => {
  const packet = realPacket(1);
  const prepared = prepareAssistantMemoryConversationTurn(turnInput(packet));
  if (prepared.status !== 'PREPARED') return assert.fail('expected PREPARED');
  const refused = await runAssistantMemoryConversationTurn(prepared, async () => {
    throw new Error('ECONNREFUSED 127.0.0.1:11434');
  });
  assert.equal(refused.status, 'REFUSED');
  if (refused.status !== 'REFUSED') return;
  assert.equal(refused.modelCalls, 0);
  assert.ok(refused.reason.includes('pre-call'));
});

test('the prepared turn is deterministic and bounded', () => {
  const packet = realPacket(2);
  const a = prepareAssistantMemoryConversationTurn(turnInput(packet));
  const b = prepareAssistantMemoryConversationTurn(turnInput(packet));
  assert.deepEqual(a, b);
  if (a.status !== 'PREPARED') return;
  assert.ok(a.prompt.length <= COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS);
});

test('the guardrails are frozen and the honest flags are pinned', () => {
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS));
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_CONVERSATION_POLICY));
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.modelCallsPerTurn, 1);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.activated, 0);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.automaticRecovery, false);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.billionUsersProven, false);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.theRealBlockComposer, true);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.memoryIsProvenanceNotInstructions, true);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_GUARDRAILS.derivedCeilingNeverGuessed, true);
});

test('source purity: the module imports no fs, no network primitives', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-assistant-memory-conversation.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/fetch\(/.test(src), 'no fetch');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
});