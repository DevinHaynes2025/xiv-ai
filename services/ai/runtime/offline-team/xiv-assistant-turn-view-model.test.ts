// 12D-301 adversarial suite — assistant turn view model.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  prepareAssistantTurn, runAssistantTurn, ASSISTANT_TURN_POLICY,
  type AssistantTurnPacket,
} from './xiv-assistant-turn';
import { buildAssistantTurnViewModel, ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS } from './xiv-assistant-turn-view-model';

const MODEL = ASSISTANT_TURN_POLICY.modelName;

async function draftedPacket(reply: string, caller?: (p: string) => Promise<{ model: string; response: string }>): Promise<AssistantTurnPacket> {
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: 'introduce yourself' });
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  return runAssistantTurn(prepared, caller ?? (async () => ({ model: MODEL, response: reply })));
}

const isDraftView = (v: ReturnType<typeof buildAssistantTurnViewModel>) => v.kind === 'VERIFIED_ASSISTANT_TURN_DRAFT' ? v : null;
const reasonOf = (v: ReturnType<typeof buildAssistantTurnViewModel>) => v.kind === 'REFUSED' ? v.reason : '';

test('12d-301: a real drafted packet renders the reply with re-verified digest and pinned flags', async () => {
  const packet = await draftedPacket('Here is the draft answer about the local assistant.');
  assert.equal(packet.status, 'DRAFTED');
  const vm = buildAssistantTurnViewModel(packet);
  const d = isDraftView(vm);
  if (!d) return assert.fail('unreachable');
  assert.ok(d.display.replyDraft.includes('draft answer'));
  assert.equal(d.display.model, MODEL);
  assert.equal(d.display.draftSha256, (packet as { draftSha256: string }).draftSha256);
  assert.match(d.display.headline, /DRAFT for the operator/);
  assert.match(d.display.operatorNote, /never trusted/);
  assert.match(d.display.operatorNote, /humanDecision REQUIRED/);
});

test('12d-301: the digest is re-derived — a tampered draftSha256 refuses', async () => {
  const packet = await draftedPacket('A clean reply to render.');
  const tampered = { ...(packet as unknown as Record<string, unknown>), draftSha256: '0'.repeat(64) };
  const vm = buildAssistantTurnViewModel(tampered);
  assert.equal(vm.kind, 'REFUSED');
  assert.match(reasonOf(vm), /re-derived digest/);
  // and a tampered reply with a matching digest for THOSE bytes still refuses:
  // swap the reply text but keep the original digest.
  const swapped = { ...(packet as unknown as Record<string, unknown>), replyDraft: 'Different text entirely.' };
  const vm2 = buildAssistantTurnViewModel(swapped);
  assert.equal(vm2.kind, 'REFUSED');
  assert.match(reasonOf(vm2), /re-derived digest/);
});

test('12d-301: a secret-shaped reply never renders even if the digest matches it', async () => {
  const secretReply = 'sure: sk-abcdefghijklmnopqrstuvwx';
  const digest = createHash('sha256').update(secretReply, 'utf8').digest('hex');
  const forged = {
    status: 'DRAFTED', kind: 'ASSISTANT_TURN_DRAFT', policyVersion: '12d-300-v1',
    tenantId: 'xiv-os', turnId: 't', model: MODEL, replyDraft: secretReply, draftSha256: digest,
    modelCalls: 1, remoteCalls: 0, activated: 0, learningPromoted: false,
    stoppedBefore: 'the operator decision — a draft is text, never an action', humanDecision: 'REQUIRED',
  };
  const vm = buildAssistantTurnViewModel(forged);
  assert.equal(vm.kind, 'REFUSED');
  assert.match(reasonOf(vm), /secret-shaped/);
  // the REAL contract refuses this before the view model ever runs:
  assert.equal((await draftedPacket(secretReply)).status, 'REFUSED');
});

test('12d-301: a foreign model label refuses render', async () => {
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: 'hello' });
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  const packet = await runAssistantTurn(prepared, async () => ({ model: 'cloud-model-x', response: 'hi' }));
  assert.equal(packet.status, 'REFUSED');
  const vm = buildAssistantTurnViewModel(packet);
  assert.equal(vm.kind, 'REFUSED');
  assert.match(reasonOf(vm), /pinned local model/);
  // a FORGED packet with a foreign model label refuses the render too
  const forged = {
    status: 'DRAFTED', kind: 'ASSISTANT_TURN_DRAFT', policyVersion: '12d-300-v1',
    tenantId: 'xiv-os', turnId: 't', model: 'cloud-model-x', replyDraft: 'hi',
    draftSha256: createHash('sha256').update('hi', 'utf8').digest('hex'),
    modelCalls: 1, remoteCalls: 0, activated: 0, learningPromoted: false,
    stoppedBefore: 'the operator decision', humanDecision: 'REQUIRED',
  };
  assert.match(reasonOf(buildAssistantTurnViewModel(forged)), /pinned local model/);
});

test('12d-301: flag tampering refuses — modelCalls, humanDecision, stoppedBefore', async () => {
  const packet = await draftedPacket('A reply.');
  const base = packet as unknown as Record<string, unknown>;
  const digest = base.draftSha256 as string;
  const reply = base.replyDraft as string;
  const cases: Record<string, unknown>[] = [
    { ...base, modelCalls: 7 },
    { ...base, humanDecision: 'AUTO' },
    { ...base, stoppedBefore: 'nothing — this ran' },
    { ...base, remoteCalls: 1 },
    { ...base, learningPromoted: true },
    { ...base, policyVersion: '12d-999-v1' },
    { ...base, kind: 'SOMETHING_ELSE' },
  ];
  for (const c of cases) {
    const vm = buildAssistantTurnViewModel(c);
    assert.equal(vm.kind, 'REFUSED', `flag tamper must refuse: ${JSON.stringify(Object.keys(c))}`);
  }
  void digest; void reply;
});

test('12d-301: a real refusal packet renders as an honest refusal', async () => {
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: 'sk-abcdefghijklmnopqrstuvwx' });
  assert.ok(prepared.status === 'REFUSED');
  const vm = buildAssistantTurnViewModel(prepared);
  assert.equal(vm.kind, 'REFUSED');
  assert.match(reasonOf(vm), /secret-shaped/);
  assert.match(vm.display.bodyText, /NO draft was rendered/);
});

test('12d-301: junk inputs refuse; oversized reason refuses; wrong status refuses', () => {
  const junk: unknown[] = [null, undefined, 42, 'text', [], true, {}, () => 1];
  for (const j of junk) {
    const vm = buildAssistantTurnViewModel(j);
    assert.equal(vm.kind, 'REFUSED');
  }
  assert.match(reasonOf(buildAssistantTurnViewModel({ status: 'MAYBE' })), /DRAFTED or REFUSED/);
  // a refusal packet with an over-500-char reason refuses
  const longReason = { status: 'REFUSED', kind: 'ASSISTANT_TURN_DRAFT', policyVersion: '12d-300-v1', reason: 'r'.repeat(501), modelCalls: 0, remoteCalls: 0, activated: 0, learningPromoted: false, humanDecision: 'REQUIRED' };
  assert.match(reasonOf(buildAssistantTurnViewModel(longReason)), /1..500 chars/);
  // key reordering refuses (exact keys in order)
  const packet = { status: 'REFUSED', kind: 'ASSISTANT_TURN_DRAFT', policyVersion: '12d-300-v1', reason: 'r', modelCalls: 0, remoteCalls: 0, activated: 0, humanDecision: 'REQUIRED', learningPromoted: false };
  assert.match(reasonOf(buildAssistantTurnViewModel(packet)), /exactly the keys/);
});

test('12d-301: refusals render an operator note that carries the full gate list', () => {
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: 'x'.repeat(4_001) });
  const vm = buildAssistantTurnViewModel(prepared);
  assert.equal(vm.kind, 'REFUSED');
  assert.match(vm.display.operatorNote, /1..4,000 chars/);
  assert.match(vm.display.operatorNote, /1..8,000 chars/);
  assert.match(vm.display.operatorNote, /secret-free BEFORE any model call/);
  // and junk inputs refuse with the outer-catch note instead:
  assert.match((buildAssistantTurnViewModel(null) as { display: { operatorNote: string } }).display.operatorNote, /REAL 12D-300 contract/);
});

test('12d-301: guardrails are pinned and frozen', () => {
  assert.ok(Object.isFrozen(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS));
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.theRealContractNotAReimplementation, true);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.digestReDerivedNeverTrusted, true);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.secretReScreenedBeforeRender, true);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.pinnedModelOnly, true);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.draftNeverAction, true);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.pureModule, true);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(ASSISTANT_TURN_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('12d-301: source purity — no fs, no network, no clock, no randomness', () => {
  const text = readFileSync(new URL('./xiv-assistant-turn-view-model.ts', import.meta.url), 'utf8');
  for (const forbidden of [
    'from \'node:fs\'', 'from "node:fs"', 'node:path', 'fetch(', 'http://', 'https://',
    '127.0.0.1', '11434', 'Date.now', 'Math.random', 'child_process', 'XMLHttpRequest',
    'WebSocket', 'require(',
  ]) {
    assert.ok(!text.includes(forbidden), `forbidden primitive in pure module: ${forbidden}`);
  }
});