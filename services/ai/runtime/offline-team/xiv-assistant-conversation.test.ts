// 12D-302 adversarial suite — assistant conversation seam.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  prepareAssistantConversationTurn, runAssistantConversationTurn,
  ASSISTANT_CONVERSATION_POLICY, ASSISTANT_CONVERSATION_GUARDRAILS,
  MAX_PRIOR_TURNS, COMPOSED_CONVERSATION_PROMPT_CHARS,
} from './xiv-assistant-conversation';
import { ASSISTANT_PERSONA_PREAMBLE, MAX_ASSISTANT_REPLY_CHARS } from './xiv-assistant-turn';

const MODEL = ASSISTANT_CONVERSATION_POLICY.modelName;
const goodCaller = async () => ({ model: MODEL, response: 'Continuing from what was said before, here is the next draft.' });

const pair = (userMessage: string, assistantReply: string) => ({ userMessage, assistantReply });

const isContinued = (v: Awaited<ReturnType<typeof runAssistantConversationTurn>>) => v.status === 'CONTINUED' ? v : null;

test('12d-302: a clean conversation turn drafts with prior context carried', async () => {
  const prepared = prepareAssistantConversationTurn({
    tenantId: 'xiv-os', conversationId: 'conv-1',
    userMessage: 'Given that, what comes next?',
    priorTurns: [pair('What can you draft locally?', 'I can draft bounded answers locally.'), pair('Summarize your scope.', 'Draft-only; the operator decides.')],
  });
  assert.ok(prepared.status === 'PREPARED');
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  assert.equal(prepared.priorTurnCount, 2);
  assert.ok(prepared.prompt.includes(ASSISTANT_PERSONA_PREAMBLE));
  assert.ok(prepared.prompt.includes('I can draft bounded answers locally.'));
  assert.ok(prepared.prompt.includes('Given that, what comes next?'));
  const vm = await runAssistantConversationTurn(prepared, goodCaller);
  assert.equal(vm.status, 'CONTINUED');
  const d = isContinued(vm);
  if (!d) return assert.fail('unreachable');
  assert.equal(d.model, MODEL);
  assert.equal(d.priorTurnCount, 2);
  assert.equal(d.draftSha256, createHash('sha256').update(d.replyDraft, 'utf8').digest('hex'));
  assert.equal(d.modelCalls, 1);
  assert.equal(d.remoteCalls, 0);
  assert.equal(d.activated, 0);
  assert.equal(d.learningPromoted, false);
  assert.equal(d.humanDecision, 'REQUIRED');
  assert.match(d.stoppedBefore, /operator decision/);
});

test('12d-302: a secret-shaped string ANYWHERE in history refuses pre-call', async () => {
  const cases = [
    { where: 'prior userMessage', priorTurns: [pair('token sk-abcdefghijklmnopqrstuvwx here', 'a reply')], userMessage: 'clean' },
    { where: 'prior assistantReply', priorTurns: [pair('a message', 'sure: ghp_' + 'a'.repeat(34))], userMessage: 'clean' },
    { where: 'new userMessage', priorTurns: [pair('a', 'b')], userMessage: 'aws AKIA1234567890ABCDEF' },
  ];
  for (const c of cases) {
    const input = { tenantId: 'xiv-os', conversationId: 'c', userMessage: c.userMessage, priorTurns: c.priorTurns };
    const vm = prepareAssistantConversationTurn(input);
    assert.equal(vm.status, 'REFUSED', `secret in ${c.where} must refuse`);
    assert.match((vm as { reason?: string }).reason ?? '', /secret-shaped/);
  }
});

test('12d-302: bounds refuse — 7 prior turns, over-size pair fields, bad shapes', () => {
  const seven = Array.from({ length: MAX_PRIOR_TURNS + 1 }, () => pair('m', 'r'));
  const vm = prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c', userMessage: 'hi', priorTurns: seven });
  assert.equal(vm.status, 'REFUSED');
  assert.match((vm as { reason?: string }).reason ?? '', /at most 6 pairs/);
  const bigReply = pair('m', 'y'.repeat(MAX_ASSISTANT_REPLY_CHARS + 1));
  const vm2 = prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c', userMessage: 'hi', priorTurns: [bigReply] });
  assert.equal(vm2.status, 'REFUSED');
  assert.match((vm2 as { reason?: string }).reason ?? '', /1..8,000 chars/);
  const badShape = { userMessage: 'm' } as unknown;
  const vm3 = prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c', userMessage: 'hi', priorTurns: [badShape] });
  assert.equal(vm3.status, 'REFUSED');
  assert.match((vm3 as { reason?: string }).reason ?? '', /exactly the keys \[userMessage, assistantReply\]/);
  const reordered = { tenantId: 'xiv-os', priorTurns: [], userMessage: 'hi', conversationId: 'c' };
  const vm4 = prepareAssistantConversationTurn(reordered);
  assert.equal(vm4.status, 'REFUSED');
  assert.match((vm4 as { reason?: string }).reason ?? '', /exactly the keys/);
});

test('12d-302: the composed prompt is bounded by a DERIVED ceiling — a boundary-packing attempt refuses', () => {
  // the ceiling is derived from the bounds, not a magic number:
  const expected = ASSISTANT_PERSONA_PREAMBLE.length + MAX_PRIOR_TURNS * (36 + 4_000 + MAX_ASSISTANT_REPLY_CHARS) + '\nNext operator message:\n'.length + 4_000;
  assert.equal(COMPOSED_CONVERSATION_PROMPT_CHARS, expected);
  assert.ok(COMPOSED_CONVERSATION_PROMPT_CHARS > 70_000, 'the ceiling must actually fit the documented capacity');
  // pack the history to the boundary with the LARGEST legal inputs:
  const filler = (n: number, ch: string) => ch.repeat(n);
  const packed = Array.from({ length: MAX_PRIOR_TURNS }, () => pair(filler(4_000, 'm'), filler(MAX_ASSISTANT_REPLY_CHARS, 'r')));
  const prepared = prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c', userMessage: filler(4_000, 'u'), priorTurns: packed });
  // maximal legal input must still prepare (the ceiling was derived to fit it):
  assert.ok(prepared.status === 'PREPARED');
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  assert.ok(prepared.prompt.length <= COMPOSED_CONVERSATION_PROMPT_CHARS);
  // and ONE extra char beyond the message bound refuses upstream:
  const vm = prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c', userMessage: filler(4_001, 'u'), priorTurns: [] });
  assert.equal(vm.status, 'REFUSED');
});

test('12d-302: caller failure refuses pre-call; foreign model refuses; post-call secret refuses', async () => {
  const prepared = prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c', userMessage: 'hi', priorTurns: [] });
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  const fail = await runAssistantConversationTurn(prepared, async () => { throw new Error('ollama returned HTTP 503'); });
  assert.equal(fail.status, 'REFUSED');
  assert.match((fail as { reason?: string }).reason ?? '', /pre-call/);
  assert.equal((fail as { modelCalls?: number }).modelCalls, 0);
  const foreign = await runAssistantConversationTurn(prepared, async () => ({ model: 'cloud-model-x', response: 'hi' }));
  assert.match((foreign as { reason?: string }).reason ?? '', /pinned local model/);
  const secretReply = await runAssistantConversationTurn(prepared, async () => ({ model: MODEL, response: 'sure: sk-abcdefghijklmnopqrstuvwx' }));
  assert.match((secretReply as { reason?: string }).reason ?? '', /post-call/);
});

test('12d-302: junk inputs refuse; never throws', () => {
  const junk: unknown[] = [null, undefined, 42, 'text', [], true, { tenantId: 'xiv-os' }, () => 1];
  for (const j of junk) {
    const vm = prepareAssistantConversationTurn(j);
    assert.equal(vm.status, 'REFUSED');
    assert.equal((vm as { modelCalls: number }).modelCalls, 0);
    assert.equal((vm as { humanDecision: string }).humanDecision, 'REQUIRED');
  }
  assert.match((prepareAssistantConversationTurn({ tenantId: '', conversationId: 'c', userMessage: 'm', priorTurns: [] }) as { reason?: string }).reason ?? '', /tenantId/);
  assert.match((prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c'.repeat(129), userMessage: 'm', priorTurns: [] }) as { reason?: string }).reason ?? '', /conversationId/);
  assert.match((prepareAssistantConversationTurn({ tenantId: 'xiv-os', conversationId: 'c', userMessage: 'm', priorTurns: 'nope' }) as { reason?: string }).reason ?? '', /priorTurns must be an array/);
});

test('12d-302: guardrails, policy, and bounds are pinned and frozen', () => {
  assert.ok(Object.isFrozen(ASSISTANT_CONVERSATION_POLICY));
  assert.ok(Object.isFrozen(ASSISTANT_CONVERSATION_GUARDRAILS));
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.boundedDisclosedMemory, true);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.historyRescreenedBothWays, true);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.composedPromptBounded, true);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.realTurnContractNotAReimplementation, true);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.noPersistencePath, true);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.noAgentMeetingPath, true);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.pureModule, true);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.modelCallsPerTurn, 1);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.collectsNothing, true);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.activated, 0);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.automaticRecovery, false);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.billionUsersProven, false);
  assert.equal(ASSISTANT_CONVERSATION_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ASSISTANT_CONVERSATION_POLICY.modelName, 'qwen2.5-coder:7b');
  assert.equal(ASSISTANT_CONVERSATION_POLICY.policyVersion, '12d-302-v1');
  assert.equal(MAX_PRIOR_TURNS, 6);
});

test('12d-302: source purity — no fs, no network, no clock, no randomness', () => {
  const text = readFileSync(new URL('./xiv-assistant-conversation.ts', import.meta.url), 'utf8');
  for (const forbidden of [
    'from \'node:fs\'', 'from "node:fs"', 'node:path', 'fetch(', 'http://', 'https://',
    '127.0.0.1', '11434', 'Date.now', 'Math.random', 'child_process', 'XMLHttpRequest',
    'WebSocket', 'require(',
  ]) {
    assert.ok(!text.includes(forbidden), `forbidden primitive in pure module: ${forbidden}`);
  }
});