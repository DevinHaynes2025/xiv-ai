// 12D-329 — adversarial tests for the assistant MEMORY turn view model
// (the 12D-307 packet's fail-closed render, the 12D-310 view-model
// discipline minus the citation fields). Central properties under
// attack:
//   1. THE DIGEST IS RE-DERIVED, NEVER TRUSTED: an edited reply or a
//      forged digest refuses the render.
//   2. THE SECRET GATE: a secret-shaped reply never renders.
//   3. HONEST FLAGS AND BOUNDS on every tamper direction; reordered or
//      smuggled keys refuse; a REAL refusal packet renders honestly.
//   4. SIBLING DOORS: the 12D-310 cited view model still renders through
//      its own contract (additive-only discipline verified).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  ASSISTANT_MEMORY_TURN_VIEW_MODEL_GUARDRAILS,
  ASSISTANT_MEMORY_TURN_VIEW_MODEL_POLICY,
  buildAssistantMemoryTurnViewModel,
} from './xiv-assistant-memory-turn-view-model';
import {
  prepareAssistantMemoryTurn, runAssistantMemoryTurn,
} from './xiv-assistant-memory-turn';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';
import {
  buildAssistantMemoryCitedTurnViewModel,
} from './xiv-assistant-memory-cited-turn-view-model';
import {
  prepareAssistantMemoryCitedTurn, runAssistantMemoryCitedTurn,
} from './xiv-assistant-memory-cited-turn';

const TENANT = 'memturn-vm-tenant';

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

function realPacket(entries: number): Record<string, unknown> {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-329vm-'));
  const q = new OfflineStoryQueue(join(dir, 'queue.sqlite'));
  try {
    for (let i = 1; i <= entries; i += 1) {
      makeDone(q, i, `READ AND SUMMARIZE reviewed fact number ${i} about the architecture`);
    }
    const packet = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    return JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  } finally {
    q.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A REAL DRAFTED 12D-307 packet: real queue → real doors → fake caller. */
async function realDrafted(
  response: string,
): Promise<Record<string, unknown>> {
  const packet = realPacket(3);
  const prepared = prepareAssistantMemoryTurn({
    tenantId: TENANT, turnId: 'vm-turn-1',
    userMessage: 'Summarize the reviewed facts.',
    memoryPacket: packet,
  });
  if (prepared.status !== 'PREPARED') throw new Error(`fixture refused: ${(prepared as { reason: string }).reason}`);
  const out = await runAssistantMemoryTurn(prepared, async () => ({
    model: 'qwen2.5-coder:7b',
    response,
  }));
  if (out.status !== 'DRAFTED') throw new Error(`fixture refused: ${(out as { reason: string }).reason}`);
  return JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
}

test('guardrails pin the honest flags', () => {
  assert.equal(ASSISTANT_MEMORY_TURN_VIEW_MODEL_GUARDRAILS.digestReDerivedNeverTrusted, true);
  assert.equal(ASSISTANT_MEMORY_TURN_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(ASSISTANT_MEMORY_TURN_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_MEMORY_TURN_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_MEMORY_TURN_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ASSISTANT_MEMORY_TURN_VIEW_MODEL_POLICY.policyVersion, '12d-329-v1');
});

test('a REAL drafted packet (real queue, real doors) renders VERIFIED', async () => {
  const drafted = await realDrafted('The reviewed facts establish the local-first architecture; the operator decides.');
  const vm = buildAssistantMemoryTurnViewModel(drafted);
  assert.equal(vm.kind, 'VERIFIED_ASSISTANT_MEMORY_TURN');
  if (vm.kind !== 'VERIFIED_ASSISTANT_MEMORY_TURN') return;
  assert.equal(vm.display.tenantId, TENANT);
  assert.equal(vm.display.turnId, 'vm-turn-1');
  assert.equal(vm.display.model, 'qwen2.5-coder:7b');
  assert.equal(vm.display.memoryCarried, 3);
  assert.equal(vm.display.memoryDoneCount, 3);
  assert.equal(vm.display.draftSha256, drafted.draftSha256);
  assert.ok(vm.display.headline.includes('3 reviewed fact(s) of 3 DONE'));
  assert.ok(vm.display.operatorNote.includes('NOT instructions'));
});

test('a forged digest refuses (the digest is re-derived, never trusted)', async () => {
  const drafted = await realDrafted('A clean reply about the architecture.');
  const forged = { ...drafted, draftSha256: 'a'.repeat(64) };
  const vm = buildAssistantMemoryTurnViewModel(forged);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.reason, /re-derived digest/);
  assert.equal((vm.display as { replyDraft?: string }).replyDraft, undefined);
});

test('a secret-shaped reply never renders', async () => {
  const drafted = await realDrafted('A clean reply about the architecture.');
  const secretReply = 'key ghp_' + 'A'.repeat(36);
  const secreted = {
    ...drafted, replyDraft: secretReply,
    draftSha256: createHash('sha256').update(secretReply, 'utf8').digest('hex'),
  };
  const vm = buildAssistantMemoryTurnViewModel(secreted);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.reason, /secret-shaped/);
  assert.equal((vm.display as { replyDraft?: string }).replyDraft, undefined);
});

test('every single-field tamper direction refuses; reordered keys refuse', async () => {
  const drafted = await realDrafted('A clean reply about the architecture.');
  const tampers: [string, Record<string, unknown>][] = [
    ['model', { model: 'other-model:7b' }],
    ['policyVersion', { policyVersion: '9.9.9-v9' }],
    ['kind', { kind: 'SOMETHING_ELSE' }],
    ['tenantId-empty', { tenantId: '' }],
    ['tenantId-oversized', { tenantId: 'x'.repeat(65) }],
    ['turnId', { turnId: '' }],
    ['replyDraft-empty', { replyDraft: '', draftSha256: createHash('sha256').update('', 'utf8').digest('hex') }],
    ['memoryCarried', { memoryCarried: 0 }],
    ['memoryCarried-over', { memoryCarried: 7 }],
    ['memoryDoneCount', { memoryDoneCount: 0 }],
    ['memoryDoneCount-below-carried', { memoryDoneCount: 2 }],
    ['modelCalls', { modelCalls: 0 }],
    ['remoteCalls', { remoteCalls: 1 }],
    ['activated', { activated: 1 }],
    ['learningPromoted', { learningPromoted: true }],
    ['humanDecision', { humanDecision: 'NOT_REQUIRED' }],
    ['stoppedBefore', { stoppedBefore: 'nothing stops anywhere in this packet' }],
  ];
  for (const [label, patch] of tampers) {
    const vm = buildAssistantMemoryTurnViewModel({ ...drafted, ...patch });
    assert.equal(vm.kind, 'REFUSED', `tamper ${label} must refuse`);
  }
  // Reordered keys: same set, different order — refuse.
  const reordered: Record<string, unknown> = {};
  const keys = Object.keys(drafted);
  for (let i = keys.length - 1; i >= 0; i -= 1) reordered[keys[i]] = (drafted as Record<string, unknown>)[keys[i]];
  const vm = buildAssistantMemoryTurnViewModel(reordered);
  assert.equal(vm.kind, 'REFUSED');
});

test('a REAL refusal packet renders honestly with its reason', async () => {
  const packet = realPacket(2);
  const refusedTurn = prepareAssistantMemoryTurn({
    tenantId: 'other-tenant', turnId: 'vm-turn-2',
    userMessage: 'Answer the question.',
    memoryPacket: packet,
  });
  assert.equal(refusedTurn.status, 'REFUSED');
  const vm = buildAssistantMemoryTurnViewModel(JSON.parse(JSON.stringify(refusedTurn)));
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.match(vm.reason, /tenant/);
  assert.ok(vm.display.headline.includes('HUMAN DECISION REQUIRED'));
});

test('garbage inputs render REFUSED, never an empty success', () => {
  for (const bad of [null, undefined, 42, 'packet', [], {}, { status: 'DRAFTED' }]) {
    const vm = buildAssistantMemoryTurnViewModel(bad);
    assert.equal(vm.kind, 'REFUSED');
  }
});

test('the sibling 12D-310 cited view model is unchanged (additive-only)', async () => {
  const packet = realPacket(3);
  const prepared = prepareAssistantMemoryCitedTurn({
    tenantId: TENANT, turnId: 'vm-cited-1',
    userMessage: 'Cite the reviewed facts as you answer.',
    memoryPacket: packet,
  });
  if (prepared.status !== 'PREPARED') return assert.fail('expected PREPARED');
  const out = await runAssistantMemoryCitedTurn(prepared, async () => ({
    model: 'qwen2.5-coder:7b',
    response: 'No citation at all — UNGROUNDED by honesty.',
  }));
  assert.equal(out.status, 'DRAFTED');
  const vm = buildAssistantMemoryCitedTurnViewModel(JSON.parse(JSON.stringify(out)));
  assert.equal(vm.kind, 'VERIFIED_ASSISTANT_MEMORY_CITED_TURN');
  if (vm.kind !== 'VERIFIED_ASSISTANT_MEMORY_CITED_TURN') return;
  assert.equal(vm.display.citedCount, 0);
});