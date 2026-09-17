// 12D-303 adversarial suite — assistant conversation view model.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  prepareAssistantConversationTurn, runAssistantConversationTurn,
  ASSISTANT_CONVERSATION_POLICY, type AssistantConversationPacket,
} from './xiv-assistant-conversation';
import { buildAssistantConversationViewModel, ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS } from './xiv-assistant-conversation-view-model';

const MODEL = ASSISTANT_CONVERSATION_POLICY.modelName;
const pair = (userMessage: string, assistantReply: string) => ({ userMessage, assistantReply });

async function continuedPacket(priorTurns: { userMessage: string; assistantReply: string }[] = [], reply = 'Here is the next draft in our conversation.'): Promise<AssistantConversationPacket> {
  const prepared = prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c', userMessage: 'and now?', priorTurns });
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  return runAssistantConversationTurn(prepared, async () => ({ model: MODEL, response: reply }));
}

const isTurnView = (v: ReturnType<typeof buildAssistantConversationViewModel>) => v.kind === 'VERIFIED_ASSISTANT_CONVERSATION_TURN' ? v : null;
const reasonOf = (v: ReturnType<typeof buildAssistantConversationViewModel>) => v.kind === 'REFUSED' ? v.reason : '';

test('12d-303: a real CONTINUED packet renders the reply with disclosed prior context', async () => {
  const packet = await continuedPacket([pair('first question', 'first draft answer')]);
  assert.equal(packet.status, 'CONTINUED');
  const vm = buildAssistantConversationViewModel(packet);
  const t = isTurnView(vm);
  if (!t) return assert.fail('unreachable');
  assert.ok(t.display.replyDraft.includes('next draft'));
  assert.equal(t.display.priorTurnCount, 1);
  assert.equal(t.display.conversationId, 'c');
  assert.equal(t.display.draftSha256, (packet as { draftSha256: string }).draftSha256);
  assert.match(t.display.headline, /Conversation turn 2 drafted/);
  assert.match(t.display.operatorNote, /1 disclosed prior pair/);
  assert.match(t.display.operatorNote, /never trusted/);
});

test('12d-303: the digest is re-derived — tampered digest or swapped reply refuses', async () => {
  const packet = await continuedPacket();
  const tampered = { ...(packet as unknown as Record<string, unknown>), draftSha256: 'f'.repeat(64) };
  assert.match((buildAssistantConversationViewModel(tampered) as { reason?: string }).reason ?? '', /re-derived digest/);
  const swapped = { ...(packet as unknown as Record<string, unknown>), replyDraft: 'Different words entirely.' };
  assert.match((buildAssistantConversationViewModel(swapped) as { reason?: string }).reason ?? '', /re-derived digest/);
});

test('12d-303: a secret-shaped reply never renders even digest-matched', () => {
  const secretReply = 'key: AKIA1234567890ABCDEF';
  const forged = {
    status: 'CONTINUED', kind: 'ASSISTANT_CONVERSATION_TURN', policyVersion: '12d-302-v1',
    tenantId: 'xiv-os', conversationId: 'c', model: MODEL, replyDraft: secretReply,
    draftSha256: createHash('sha256').update(secretReply, 'utf8').digest('hex'),
    priorTurnCount: 0, modelCalls: 1, remoteCalls: 0, activated: 0, learningPromoted: false,
    stoppedBefore: 'the operator decision — a draft is text, never an action', humanDecision: 'REQUIRED',
  };
  assert.match((buildAssistantConversationViewModel(forged) as { reason?: string }).reason ?? '', /secret-shaped/);
});

test('12d-303: foreign model, bad priorTurnCount, flag tampering, reordered keys all refuse', () => {
  const base = {
    status: 'CONTINUED', kind: 'ASSISTANT_CONVERSATION_TURN', policyVersion: '12d-302-v1',
    tenantId: 'xiv-os', conversationId: 'c', model: 'cloud-model-x', replyDraft: 'hi',
    draftSha256: createHash('sha256').update('hi', 'utf8').digest('hex'),
    priorTurnCount: 0, modelCalls: 1, remoteCalls: 0, activated: 0, learningPromoted: false,
    stoppedBefore: 'the operator decision', humanDecision: 'REQUIRED',
  };
  assert.match((buildAssistantConversationViewModel(base) as { reason?: string }).reason ?? '', /pinned local model/);
  const flagCases: Record<string, unknown>[] = [
    { ...base, model: MODEL, priorTurnCount: 7 },
    { ...base, model: MODEL, priorTurnCount: -1 },
    { ...base, model: MODEL, priorTurnCount: 2.5 },
    { ...base, model: MODEL, modelCalls: 5 },
    { ...base, model: MODEL, humanDecision: 'AUTO' },
    { ...base, model: MODEL, stoppedBefore: 'nothing' },
    { ...base, model: MODEL, learningPromoted: true },
    { ...base, model: MODEL, remoteCalls: 2 },
    { ...base, model: MODEL, policyVersion: '12d-999-v1' },
    { ...base, model: MODEL, kind: 'OTHER' },
  ];
  for (const c of flagCases) {
    const vm = buildAssistantConversationViewModel(c);
    assert.equal(vm.kind, 'REFUSED', 'flag tamper must refuse');
  }
  // reordered keys refuse
  const reordered = { status: 'CONTINUED', kind: 'ASSISTANT_CONVERSATION_TURN', policyVersion: '12d-302-v1', model: MODEL, tenantId: 'xiv-os', conversationId: 'c', replyDraft: 'hi', draftSha256: base.draftSha256, priorTurnCount: 0, modelCalls: 1, remoteCalls: 0, activated: 0, learningPromoted: false, stoppedBefore: 'the operator decision', humanDecision: 'REQUIRED' };
  assert.match((buildAssistantConversationViewModel(reordered) as { reason?: string }).reason ?? '', /exactly the keys/);
});

test('12d-303: a real refusal packet renders honestly; over-500-char reason refuses', async () => {
  const vm = prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c', userMessage: 'x'.repeat(4_001), priorTurns: [] });
  assert.equal(vm.status, 'REFUSED');
  const rendered = buildAssistantConversationViewModel(vm);
  assert.equal(rendered.kind, 'REFUSED');
  assert.match((rendered as { reason?: string }).reason ?? '', /4,000 chars/);
  const longReason = { status: 'REFUSED', kind: 'ASSISTANT_CONVERSATION_TURN', policyVersion: '12d-302-v1', reason: 'r'.repeat(501), modelCalls: 0, remoteCalls: 0, activated: 0, learningPromoted: false, humanDecision: 'REQUIRED' };
  assert.match((buildAssistantConversationViewModel(longReason) as { reason?: string }).reason ?? '', /1..500 chars/);
});

test('12d-303: junk inputs refuse; never throws', () => {
  const junk: unknown[] = [null, undefined, 42, 'text', [], true, {}, () => 1];
  for (const j of junk) {
    const vm = buildAssistantConversationViewModel(j);
    assert.equal(vm.kind, 'REFUSED');
  }
  assert.match((buildAssistantConversationViewModel({ status: 'MAYBE' }) as { reason?: string }).reason ?? '', /CONTINUED or REFUSED/);
});

test('12d-303: guardrails pinned and frozen', () => {
  assert.ok(Object.isFrozen(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS));
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.theRealContractNotAReimplementation, true);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.digestReDerivedNeverTrusted, true);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.secretReScreenedBeforeRender, true);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.disclosedStateRendered, true);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.pinnedModelOnly, true);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.draftNeverAction, true);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.pureModule, true);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(ASSISTANT_CONVERSATION_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('12d-303: source purity — no fs, no network, no clock, no randomness', () => {
  const text = readFileSync(new URL('./xiv-assistant-conversation-view-model.ts', import.meta.url), 'utf8');
  for (const forbidden of [
    'from \'node:fs\'', 'from "node:fs"', 'node:path', 'fetch(', 'http://', 'https://',
    '127.0.0.1', '11434', 'Date.now', 'Math.random', 'child_process', 'XMLHttpRequest',
    'WebSocket', 'require(',
  ]) {
    assert.ok(!text.includes(forbidden), `forbidden primitive in pure module: ${forbidden}`);
  }
});