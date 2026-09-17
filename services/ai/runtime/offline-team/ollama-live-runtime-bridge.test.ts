// 12D-90 — Ollama live runtime bridge contracts.
// 12D-291 paydown: converted from a bare tsx script (custom OK output, no
// node:test summary) to a REAL node:test suite — every original scenario
// preserved; the suite is now chain-measurable.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildOllamaRuntimeReceipt, canUseOllamaForLocalBrain, selectPreferredOllamaModel } from './ollama-live-runtime-bridge';

test('12d-90 the pinned local model is preferred over other candidates', () => {
  assert.equal(selectPreferredOllamaModel(['gpt-oss:20b', 'qwen2.5-coder:7b']), 'qwen2.5-coder:7b',
    'preferred model selection failed');
});

test('12d-90 a reachable loopback Ollama is eligible with guardrails held', () => {
  const live = buildOllamaRuntimeReceipt({
    reachable: true,
    verifiedAt: '2026-09-11T22:50:00.000Z',
    modelNames: ['qwen2.5-coder:7b', 'gpt-oss:20b'],
    evidenceRef: 'local:ollama-tags-receipt',
  });
  assert.equal(canUseOllamaForLocalBrain(live), true, 'reachable loopback Ollama should be eligible');
  assert.equal(live.productionAuthority, false);
  assert.equal(live.cloudExecutionVerified, false);
  assert.equal(live.localOnly, true);
});

test('12d-90 an unreachable Ollama is not eligible', () => {
  const offline = buildOllamaRuntimeReceipt({
    reachable: false,
    verifiedAt: '2026-09-11T22:50:00.000Z',
    modelNames: [],
    evidenceRef: 'local:ollama-offline-receipt',
  });
  assert.equal(canUseOllamaForLocalBrain(offline), false, 'offline Ollama must not be eligible');
});