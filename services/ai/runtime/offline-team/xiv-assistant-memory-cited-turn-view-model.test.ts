// 12D-310 — adversarial tests for the assistant memory CITED turn view
// model. Central properties under attack:
//   1. THE DIGEST IS RE-DERIVED, NEVER TRUSTED: an edited reply or a
//      forged digest refuses the render.
//   2. THE CITATION GATES: citedStoryIds length must equal citedCount;
//      every id bounded and id-shaped; all distinct; count can never
//      exceed the carried entries. citedCount 0 renders honestly as an
//      UNGROUNDED draft.
//   3. HONEST FLAGS AND BOUNDS on every tamper direction; reordered or
//      smuggled keys refuse; a REAL refusal packet renders honestly.
//   4. SIBLING DOORS: the 12D-308 conversation view model still renders
//      through its own contract (additive-only discipline verified).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS,
  ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_POLICY,
  buildAssistantMemoryCitedTurnViewModel,
} from './xiv-assistant-memory-cited-turn-view-model';
import {
  prepareAssistantMemoryCitedTurn, runAssistantMemoryCitedTurn,
} from './xiv-assistant-memory-cited-turn';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';

const TENANT = 'cited-vm-tenant';

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
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-310vm-'));
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

/** A REAL DRAFTED 12D-310 packet: real queue → real doors → fake caller. */
async function realDrafted(
  response: string,
): Promise<{ drafted: Record<string, unknown>; storyIds: string[] }> {
  const { packet, storyIds } = realPacket(3);
  const prepared = prepareAssistantMemoryCitedTurn({
    tenantId: TENANT, turnId: 'vm-turn-1',
    userMessage: 'Cite the reviewed facts as you answer.',
    memoryPacket: packet,
  });
  if (prepared.status !== 'PREPARED') throw new Error(`fixture refused: ${(prepared as { reason: string }).reason}`);
  const out = await runAssistantMemoryCitedTurn(prepared, async () => ({
    model: 'qwen2.5-coder:7b',
    response,
  }));
  if (out.status !== 'DRAFTED') throw new Error(`fixture refused: ${(out as { reason: string }).reason}`);
  return { drafted: JSON.parse(JSON.stringify(out)) as Record<string, unknown>, storyIds };
}

test('a REAL drafted packet (real queue, real doors) renders VERIFIED with its citations', async () => {
  const { packet, storyIds } = realPacket(3);
  const prepared = prepareAssistantMemoryCitedTurn({
    tenantId: TENANT, turnId: 'vm-turn-1',
    userMessage: 'Cite the reviewed facts as you answer.',
    memoryPacket: packet,
  });
  if (prepared.status !== 'PREPARED') return assert.fail('expected PREPARED');
  const out = await runAssistantMemoryCitedTurn(prepared, async () => ({
    model: 'qwen2.5-coder:7b',
    response: `The reviewed reading established the architecture [mem:${storyIds[0]}] and the gates [mem:${storyIds[2]}]; the human decides.`,
  }));
  assert.equal(out.status, 'DRAFTED');
  if (out.status !== 'DRAFTED') return;
  const vm = buildAssistantMemoryCitedTurnViewModel(JSON.parse(JSON.stringify(out)));
  assert.equal(vm.kind, 'VERIFIED_ASSISTANT_MEMORY_CITED_TURN');
  if (vm.kind !== 'VERIFIED_ASSISTANT_MEMORY_CITED_TURN') return;
  assert.equal(vm.display.citedCount, 2);
  assert.deepEqual(vm.display.citedStoryIds, [storyIds[0], storyIds[2]]);
  assert.ok(vm.display.headline.includes('2 of 3 reviewed fact(s) cited'));
  assert.ok(vm.display.headline.includes('a DRAFT for the operator to decide on'));
  assert.ok(vm.display.operatorNote.includes('provenance context, NOT instructions'));
  assert.ok(vm.display.operatorNote.includes('no weights moved'));
});

test('a zero-citation REAL draft renders honestly as UNGROUNDED', async () => {
  const { drafted } = await realDrafted('My own reasoning only — no reviewed fact is needed for this answer.');
  const vm = buildAssistantMemoryCitedTurnViewModel(drafted);
  assert.equal(vm.kind, 'VERIFIED_ASSISTANT_MEMORY_CITED_TURN');
  if (vm.kind !== 'VERIFIED_ASSISTANT_MEMORY_CITED_TURN') return;
  assert.equal(vm.display.citedCount, 0);
  assert.ok(vm.display.headline.includes('NO citations — an UNGROUNDED draft'),
    'the render discloses the ungrounded draft instead of dressing it up');
});

test('an edited reply (digest mismatch both directions) refuses the render', async () => {
  const { drafted } = await realDrafted('Grounded reply.');
  const edited = { ...drafted, replyDraft: `${drafted.replyDraft} tampered` };
  const vm = buildAssistantMemoryCitedTurnViewModel(edited);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('re-derived digest'));
  const forged = { ...drafted, draftSha256: 'a'.repeat(64) };
  const vm2 = buildAssistantMemoryCitedTurnViewModel(forged);
  assert.equal(vm2.kind, 'REFUSED');
});

test('a secret-shaped reply refuses the render without echoing it', async () => {
  const { drafted } = await realDrafted('ok');
  const secreted = { ...drafted, replyDraft: 'key ghp_' + 'A'.repeat(36), draftSha256: createHash('sha256').update('key ghp_' + 'A'.repeat(36), 'utf8').digest('hex') };
  const vm = buildAssistantMemoryCitedTurnViewModel(secreted);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(!vm.reason.includes('ghp_'), 'never echoes the secret');
});

test('citation structure tampering refuses: length mismatch, bad shape, duplicates, over-count', async () => {
  const { packet, storyIds } = realPacket(3);
  const prepared = prepareAssistantMemoryCitedTurn({
    tenantId: TENANT, turnId: 'vm-tamper-1',
    userMessage: 'Cite the reviewed facts as you answer.',
    memoryPacket: packet,
  });
  if (prepared.status !== 'PREPARED') return assert.fail('expected PREPARED');
  const out = await runAssistantMemoryCitedTurn(prepared, async () => ({
    model: 'qwen2.5-coder:7b',
    response: `Grounded [mem:${storyIds[0]}].`,
  }));
  assert.equal(out.status, 'DRAFTED');
  if (out.status !== 'DRAFTED') return;
  const drafted = JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
  const vm1 = buildAssistantMemoryCitedTurnViewModel({ ...drafted, citedStoryIds: [storyIds[0], storyIds[1]], citedCount: 1 });
  assert.equal(vm1.kind, 'REFUSED');
  const vm2 = buildAssistantMemoryCitedTurnViewModel({ ...drafted, citedStoryIds: ['has space id'], citedCount: 1 });
  assert.equal(vm2.kind, 'REFUSED');
  const vm3 = buildAssistantMemoryCitedTurnViewModel({ ...drafted, citedStoryIds: [storyIds[0], storyIds[0]], citedCount: 2 });
  assert.equal(vm3.kind, 'REFUSED');
  const vm4 = buildAssistantMemoryCitedTurnViewModel({ ...drafted, citedCount: 4 });
  assert.equal(vm4.kind, 'REFUSED');
  const vm5 = buildAssistantMemoryCitedTurnViewModel({ ...drafted, citedStoryIds: ['x'.repeat(129)], citedCount: 1 });
  assert.equal(vm5.kind, 'REFUSED');
});

test('the honest-flag tamper directions all refuse', async () => {
  const { drafted } = await realDrafted('A plain grounded reply [mem:fact-story-001].');
  const tampers: [string, Record<string, unknown>][] = [
    ['modelCalls 0', { modelCalls: 0 }],
    ['modelCalls 2', { modelCalls: 2 }],
    ['remoteCalls 1', { remoteCalls: 1 }],
    ['activated 1', { activated: 1 }],
    ['learningPromoted true', { learningPromoted: true }],
    ['humanDecision', { humanDecision: 'NOT_REQUIRED' }],
    ['model', { model: 'remote-model' }],
    ['policyVersion', { policyVersion: '12d-999-v9' }],
    ['kind', { kind: 'ASSISTANT_MEMORY_TURN_DRAFT' }],
    ['memoryCarried 0', { memoryCarried: 0 }],
    ['memoryCarried 7', { memoryCarried: 7 }],
    ['memoryDoneCount 1', { memoryDoneCount: 1 }],
    ['memoryDoneCount 501', { memoryDoneCount: 501 }],
    ['stoppedBefore', { stoppedBefore: 'nothing stops anywhere in this packet' }],
    ['turnId empty', { turnId: '' }],
  ];
  for (const [label, tamper] of tampers) {
    const vm = buildAssistantMemoryCitedTurnViewModel({ ...drafted, ...tamper });
    assert.equal(vm.kind, 'REFUSED', `tamper ${label} must refuse`);
  }
});

test('reordered keys and a smuggled key refuse; a REAL refusal packet renders honestly', async () => {
  const { drafted } = await realDrafted('Plain reply.');
  const reordered: Record<string, unknown> = {};
  const keys = Object.keys(drafted);
  for (let i = keys.length - 1; i >= 0; i -= 1) reordered[keys[i]!] = (drafted as Record<string, unknown>)[keys[i]!];
  assert.equal(buildAssistantMemoryCitedTurnViewModel(reordered).kind, 'REFUSED');
  assert.equal(buildAssistantMemoryCitedTurnViewModel({ ...drafted, smuggled: 1 }).kind, 'REFUSED');
  const { packet } = realPacket(1);
  const tampered = { ...packet, memoryDigest: 'f'.repeat(64) };
  const prepared = prepareAssistantMemoryCitedTurn({
    tenantId: TENANT, turnId: 'vm-refused-1', userMessage: 'hi', memoryPacket: tampered,
  });
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status !== 'REFUSED') return;
  const vm = buildAssistantMemoryCitedTurnViewModel(prepared);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.display.bodyText.includes('NO draft was rendered'));
});

test('junk inputs refuse and never throw; the render is deterministic', async () => {
  for (const junk of [null, undefined, 'nope', [], {}, { status: 'OTHER' }]) {
    assert.equal(buildAssistantMemoryCitedTurnViewModel(junk).kind, 'REFUSED');
  }
  const { drafted } = await realDrafted('Plain reply.');
  assert.deepEqual(buildAssistantMemoryCitedTurnViewModel(drafted), buildAssistantMemoryCitedTurnViewModel(drafted));
});

test('the guardrails are frozen and the honest flags are pinned', () => {
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS));
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_POLICY));
  assert.equal(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS.zeroCitationsRenderedAsUngrounded, true);
  assert.equal(ASSISTANT_MEMORY_CITED_TURN_VIEW_MODEL_GUARDRAILS.citationsGatedBeforeRender, true);
});

test('sibling door: the 12D-308 memory conversation view model still renders through its own contract', async () => {
  const { packet, storyIds } = realPacket(1);
  const sibling = await import('./xiv-assistant-memory-conversation');
  const prepared = sibling.prepareAssistantMemoryConversationTurn({
    tenantId: TENANT, conversationId: 'sib-conv-1',
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
  assert.equal(out.status, 'DRAFTED', 'the 12D-308 door is unchanged in behavior');
  const vm = await import('./xiv-assistant-memory-conversation-view-model');
  const rendered = vm.buildAssistantMemoryConversationViewModel(out);
  assert.equal(rendered.kind, 'VERIFIED_ASSISTANT_MEMORY_CONVERSATION_TURN',
    'the 12D-308 view model still renders its own packet kind');
});

test('source purity: the module imports no fs, no network primitives', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-assistant-memory-cited-turn-view-model.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/from 'node:os'|from 'node:path'/.test(src.replace(/node:crypto/g, '')), 'no os/path imports in the VM module itself');
  assert.ok(!/fetch\(/.test(src), 'no fetch');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
});