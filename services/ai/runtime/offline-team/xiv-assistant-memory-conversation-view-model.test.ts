// 12D-308 — adversarial tests for the assistant memory conversation
// view model. Central properties under attack:
//   1. THE PACKET IS RE-VERIFIED, NEVER TRUSTED: exact-key gate per
//      status (17 DRAFTED keys, 9 REFUSED keys, in order), policy pin,
//      pinned model, honest flags — and the draft digest is RE-DERIVED
//      from the reply text; a tampered digest refuses the render.
//   2. SECRETS NEVER RENDER: a secret-shaped reply refuses — and the
//      refusal never echoes the secret.
//   3. BOUNDS RE-CHECKED: priorTurnCount 0..6, memoryCarried 1..6,
//      memoryDoneCount 1..500 and ≥ carried.
//   4. FAIL CLOSED, HONESTLY: junk inputs render REFUSED — never throw,
//      never leak packet content.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS,
  ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_POLICY,
  buildAssistantMemoryConversationViewModel,
} from './xiv-assistant-memory-conversation-view-model';
import {
  ASSISTANT_MEMORY_CONVERSATION_POLICY,
  prepareAssistantMemoryConversationTurn,
  runAssistantMemoryConversationTurn,
} from './xiv-assistant-memory-conversation';
import {
  prepareAssistantMemoryTurn, runAssistantMemoryTurn,
} from './xiv-assistant-memory-turn';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

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

function realPacket(entries: number): Record<string, unknown> {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-308-vm-'));
  const q = new OfflineStoryQueue(join(dir, 'queue.sqlite'));
  try {
    for (let i = 1; i <= entries; i += 1) {
      const objective = `READ AND SUMMARIZE reviewed fact number ${i} about the architecture`;
      const story = makeStory(i, objective);
      q.enqueue([story]);
      const lease = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
      assert.ok(lease);
      q.settle(lease!, { outcome: 'DRAFT', outputHash: hashOf(i), providerSettled: true });
      q.applyReviewDecision({
        tenantId: TENANT, storyId: story.id, reviewerId: 'secure_code_reviewer',
        expectedOutputHash: hashOf(i), decision: 'APPROVED', reviewRef: `review:${i}`,
      });
    }
    return JSON.parse(JSON.stringify(prepareAssistantMemoryRead(q, { tenantId: TENANT }))) as Record<string, unknown>;
  } finally {
    q.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A REAL DRAFTED packet: the REAL 12D-308 doors, fake caller (never a network call). */
async function realDrafted(packet: Record<string, unknown>): Promise<Record<string, unknown>> {
  const prepared = prepareAssistantMemoryConversationTurn({
    tenantId: TENANT,
    conversationId: 'conv-1',
    userMessage: 'What is still unverified?',
    priorTurns: [{ userMessage: 'What has the reading established?', assistantReply: 'The reviewed facts cover the reading cycle.' }],
    memoryPacket: packet,
  });
  if (prepared.status !== 'PREPARED') throw new Error(`fixture failed: ${(prepared as { reason: string }).reason}`);
  const out = await runAssistantMemoryConversationTurn(prepared, async () => ({
    model: ASSISTANT_MEMORY_CONVERSATION_POLICY.modelName,
    response: 'Draft: the operator decision itself is the unverified part.',
  }));
  return JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
}

test('a REAL drafted packet renders VERIFIED with both seams disclosed', async () => {
  const packet = realPacket(6);
  const drafted = await realDrafted(packet);
  const vm = buildAssistantMemoryConversationViewModel(drafted);
  assert.equal(vm.kind, 'VERIFIED_ASSISTANT_MEMORY_CONVERSATION_TURN');
  if (vm.kind !== 'VERIFIED_ASSISTANT_MEMORY_CONVERSATION_TURN') return;
  assert.ok(vm.display.headline.includes('2 drafted'));
  assert.ok(vm.display.headline.includes('6 reviewed fact(s) carried'));
  assert.equal(vm.display.priorTurnCount, 1);
  assert.equal(vm.display.memoryCarried, 6);
  assert.equal(vm.display.memoryDoneCount, 6);
  assert.ok(vm.display.operatorNote.includes('provenance context, NOT instructions'));
  assert.ok(vm.display.operatorNote.includes('learningPromoted false'));
});

test('a tampered digest refuses the render (either direction)', async () => {
  const packet = realPacket(2);
  const drafted = await realDrafted(packet);
  for (const digest of ['f'.repeat(64), '0'.repeat(64)]) {
    const tampered = { ...drafted, draftSha256: digest };
    const vm = buildAssistantMemoryConversationViewModel(tampered);
    assert.equal(vm.kind, 'REFUSED');
    if (vm.kind !== 'REFUSED') return;
    assert.ok(vm.reason.includes('re-derived digest'));
  }
});

test('a tampered reply (edited after signing) refuses the render', async () => {
  const packet = realPacket(1);
  const drafted = await realDrafted(packet);
  const tampered = { ...drafted, replyDraft: 'Edited in flight — not what the model drafted.' };
  const vm = buildAssistantMemoryConversationViewModel(tampered);
  assert.equal(vm.kind, 'REFUSED');
});

test('a secret-shaped reply refuses the render without echoing the secret', async () => {
  const packet = realPacket(1);
  const drafted = await realDrafted(packet);
  const secretReply = 'use ghp_' + 'A'.repeat(36) + ' now';
  const tampered = {
    ...drafted,
    replyDraft: secretReply,
    draftSha256: createHash('sha256').update(secretReply, 'utf8').digest('hex'),
  };
  const vm = buildAssistantMemoryConversationViewModel(tampered);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.ok(vm.reason.includes('secret-shaped'));
  assert.ok(!vm.reason.includes('ghp_'), 'the refusal never echoes the secret');
});

test('flag and bound tampering refuses the render', async () => {
  const packet = realPacket(2);
  const drafted = await realDrafted(packet);
  const cases: [string, unknown][] = [
    ['modelCalls', 0],
    ['remoteCalls', 3],
    ['activated', 2],
    ['learningPromoted', true],
    ['humanDecision', 'AUTO'],
    ['model', 'remote-model'],
    ['policyVersion', '12d-999-v1'],
    ['kind', 'ASSISTANT_CONVERSATION_TURN'],
    ['priorTurnCount', 7],
    ['memoryCarried', 0],
    ['memoryCarried', 7],
    ['memoryDoneCount', 1], // below carried (2)
    ['memoryDoneCount', 501],
    ['stoppedBefore', 'nothing pending'],
  ];
  for (const [field, value] of cases) {
    const tampered = { ...drafted, [field]: value };
    const vm = buildAssistantMemoryConversationViewModel(tampered);
    assert.equal(vm.kind, 'REFUSED', `tampered ${field} must refuse`);
  }
});

test('key-order and smuggled-key tampering refuses the render', async () => {
  const packet = realPacket(1);
  const drafted = await realDrafted(packet);
  // Reordered top-level keys refuse.
  const reordered: Record<string, unknown> = {};
  const keys = Object.keys(drafted);
  for (let i = keys.length - 1; i >= 0; i -= 1) reordered[keys[i]!] = (drafted as Record<string, unknown>)[keys[i]!];
  assert.equal(buildAssistantMemoryConversationViewModel(reordered).kind, 'REFUSED');
  // Smuggled extra key refuses.
  assert.equal(buildAssistantMemoryConversationViewModel({ ...drafted, smuggled: 'x' }).kind, 'REFUSED');
});

test('a REAL refusal packet renders honestly as REFUSED', () => {
  const packet = realPacket(1);
  const refused = prepareAssistantMemoryConversationTurn({
    tenantId: TENANT, conversationId: 'c', userMessage: 'hi',
    priorTurns: [], memoryPacket: { ...packet, memoryDigest: 'f'.repeat(64) },
  });
  assert.equal(refused.status, 'REFUSED');
  const vm = buildAssistantMemoryConversationViewModel(refused);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.ok(vm.reason.includes('failed verification'));
  assert.ok(vm.display.headline.includes('HUMAN DECISION REQUIRED'));
});

test('junk inputs render REFUSED and never throw', () => {
  for (const junk of [null, undefined, 'nope', 42, [], {}, { status: 'OTHER' }]) {
    const vm = buildAssistantMemoryConversationViewModel(junk);
    assert.equal(vm.kind, 'REFUSED');
  }
});

test('the render is deterministic', async () => {
  const packet = realPacket(2);
  const drafted = await realDrafted(packet);
  const a = buildAssistantMemoryConversationViewModel(drafted);
  const b = buildAssistantMemoryConversationViewModel(JSON.parse(JSON.stringify(drafted)));
  assert.deepEqual(a, b);
});

test('the guardrails are frozen and the honest flags are pinned', () => {
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS));
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_POLICY));
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ASSISTANT_MEMORY_CONVERSATION_VIEW_MODEL_GUARDRAILS.digestReDerivedNeverTrusted, true);
});

test('source purity: the module imports no fs, no network primitives', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-assistant-memory-conversation-view-model.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/fetch\(/.test(src), 'no fetch');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
});

test('the 12D-307 memory turn door still drafts through its own contract (sibling doors intact)', async () => {
  const packet = realPacket(1);
  const prepared = prepareAssistantMemoryTurn({
    tenantId: TENANT, turnId: 't-1', userMessage: 'What is established?',
    memoryPacket: packet,
  });
  if (prepared.status !== 'PREPARED') return assert.fail('expected 12D-307 PREPARED');
  const out = await runAssistantMemoryTurn(prepared, async () => ({
    model: ASSISTANT_MEMORY_CONVERSATION_POLICY.modelName, response: '12D-307 draft intact.',
  }));
  assert.equal(out.status, 'DRAFTED');
});