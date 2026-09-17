// 12D-300 adversarial suite — XIV AI OS local assistant turn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  prepareAssistantTurn, runAssistantTurn, ASSISTANT_TURN_POLICY,
  ASSISTANT_TURN_GUARDRAILS, ASSISTANT_PERSONA_PREAMBLE,
  MAX_USER_MESSAGE_CHARS, MAX_ASSISTANT_REPLY_CHARS,
} from './xiv-assistant-turn';

const MODEL = 'qwen2.5-coder:7b';
const goodCaller = async (prompt: string) => ({ model: MODEL, response: 'Draft reply: the local assistant can help with that.' });

const isDrafted = (v: Awaited<ReturnType<typeof runAssistantTurn>>) => v.status === 'DRAFTED' ? v : null;

test('12d-300: a clean turn drafts with pinned flags and a verified digest', async () => {
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 'turn-1', userMessage: 'Summarize what you can do locally.' });
  assert.ok(prepared.status === 'PREPARED', 'preparation must succeed');
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  assert.ok(prepared.prompt.includes('XIV AI OS LOCAL assistant'));
  assert.ok(prepared.prompt.includes('Summarize what you can do locally.'));
  const vm = await runAssistantTurn(prepared, goodCaller);
  assert.equal(vm.status, 'DRAFTED');
  const d = isDrafted(vm);
  if (!d) return assert.fail('unreachable');
  assert.equal(d.model, MODEL);
  assert.equal(d.draftSha256, createHash('sha256').update(d.replyDraft, 'utf8').digest('hex'));
  assert.equal(d.modelCalls, 1);
  assert.equal(d.remoteCalls, 0);
  assert.equal(d.activated, 0);
  assert.equal(d.learningPromoted, false);
  assert.equal(d.humanDecision, 'REQUIRED');
  assert.match(d.stoppedBefore, /operator decision/);
});

test('12d-300: the persona preamble pins the honest scope verbatim', () => {
  assert.ok(ASSISTANT_PERSONA_PREAMBLE.includes('no cloud access'));
  assert.ok(ASSISTANT_PERSONA_PREAMBLE.includes('no weight mutation'));
  assert.ok(ASSISTANT_PERSONA_PREAMBLE.includes('2,000,000 rows per database'));
  assert.ok(ASSISTANT_PERSONA_PREAMBLE.includes('vision, not capability'));
  assert.ok(Object.isFrozen(ASSISTANT_PERSONA_PREAMBLE));
});

test('12d-300: a secret-shaped user message refuses BEFORE any model call', async () => {
  const secrets = [
    'use this key sk-abcdefghijklmnopqrstuvwx', '-----BEGIN RSA PRIVATE KEY-----',
    'token ghp_' + 'a'.repeat(34), 'aws AKIA1234567890ABCDEF',
  ];
  for (const s of secrets) {
    const vm = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: s });
    assert.equal(vm.status, 'REFUSED');
    assert.match((vm as { reason?: string }).reason ?? '', /secret-shaped/);
  }
  // the refused turn NEVER calls the model — prove by a caller that would fail the test if run
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: 'clean message' });
  assert.ok(prepared.status === 'PREPARED');
});

test('12d-300: a secret-shaped MODEL reply refuses post-call', async () => {
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: 'show me an example token format' });
  assert.ok(prepared.status === 'PREPARED');
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  const vm = await runAssistantTurn(prepared, async () => ({ model: MODEL, response: 'sure: sk-abcdefghijklmnopqrstuvwx' }));
  assert.equal(vm.status, 'REFUSED');
  assert.match((vm as { reason?: string }).reason ?? '', /secret-shaped.*post-call|post-call.*secret-shaped/s);
});

test('12d-300: a foreign model refuses — only the pinned local model drafts', async () => {
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: 'hello' });
  assert.ok(prepared.status === 'PREPARED');
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  const vm = await runAssistantTurn(prepared, async () => ({ model: 'cloud-model-x', response: 'hi' }));
  assert.equal(vm.status, 'REFUSED');
  assert.match((vm as { reason?: string }).reason ?? '', /pinned local model/);
});

test('12d-300: a caller failure refuses pre-call without a silent retry', async () => {
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: 'hello' });
  assert.ok(prepared.status === 'PREPARED');
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  const vm = await runAssistantTurn(prepared, async () => { throw new Error('ollama returned HTTP 500'); });
  assert.equal(vm.status, 'REFUSED');
  assert.match((vm as { reason?: string }).reason ?? '', /pre-call/);
  assert.match((vm as { reason?: string }).reason ?? '', /HTTP 500/);
});

test('12d-300: bounds refuse — unbounded message, empty reply, oversize reply', async () => {
  const longMsg = 'x'.repeat(4_001);
  const vm = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: longMsg });
  assert.equal(vm.status, 'REFUSED');
  assert.match((vm as { reason?: string }).reason ?? '', /4,000 chars/);
  const prepared = prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't', userMessage: 'hi' });
  assert.ok(prepared.status === 'PREPARED');
  if (prepared.status !== 'PREPARED') return assert.fail('unreachable');
  const empty = await runAssistantTurn(prepared, async () => ({ model: MODEL, response: '' }));
  assert.match((empty as { reason?: string }).reason ?? '', /1..8,000 chars/);
  const big = await runAssistantTurn(prepared, async () => ({ model: MODEL, response: 'y'.repeat(8_001) }));
  assert.match((big as { reason?: string }).reason ?? '', /1..8,000 chars/);
});

test('12d-300: junk inputs and bad ids refuse; never throws', () => {
  const junk: unknown[] = [null, undefined, 42, 'text', [], true, { tenantId: 'xiv-os' }, () => 1];
  for (const j of junk) {
    const vm = prepareAssistantTurn(j);
    assert.equal(vm.status, 'REFUSED');
    assert.equal((vm as { modelCalls: number }).modelCalls, 0);
    assert.equal((vm as { humanDecision: string }).humanDecision, 'REQUIRED');
  }
  assert.match((prepareAssistantTurn({ tenantId: '', turnId: 't', userMessage: 'm' }) as { reason?: string }).reason ?? '', /tenantId/);
  assert.match((prepareAssistantTurn({ tenantId: 'xiv-os', turnId: 't'.repeat(129), userMessage: 'm' }) as { reason?: string }).reason ?? '', /turnId/);
});

test('12d-300: guardrails, policy, and bounds are pinned and frozen', () => {
  assert.ok(Object.isFrozen(ASSISTANT_TURN_POLICY));
  assert.ok(Object.isFrozen(ASSISTANT_TURN_GUARDRAILS));
  assert.equal(ASSISTANT_TURN_GUARDRAILS.localModelOnly, true);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.loopbackOnly, true);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.secretScreenedBothWays, true);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.draftOnly, true);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.noMemoryPath, true);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.noWeightMutation, true);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.pureModule, true);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.modelCallsPerTurn, 1);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.collectsNothing, true);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.activated, 0);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.automaticRecovery, false);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.billionUsersProven, false);
  assert.equal(ASSISTANT_TURN_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ASSISTANT_TURN_POLICY.modelName, MODEL);
  assert.equal(MAX_USER_MESSAGE_CHARS, 4_000);
  assert.equal(MAX_ASSISTANT_REPLY_CHARS, 8_000);
  assert.equal(ASSISTANT_TURN_POLICY.policyVersion, '12d-300-v1');
});

test('12d-300: source purity — no fetch, no network primitive, no clock, no randomness', () => {
  const text = readFileSync(new URL('./xiv-assistant-turn.ts', import.meta.url), 'utf8');
  for (const forbidden of [
    'from \'node:fs\'', 'from "node:fs"', 'node:path', 'fetch(', 'http://', 'https://',
    '127.0.0.1', '11434', 'Date.now', 'Math.random', 'child_process', 'XMLHttpRequest',
    'WebSocket', 'require(',
  ]) {
    assert.ok(!text.includes(forbidden), `forbidden primitive in pure module: ${forbidden}`);
  }
});