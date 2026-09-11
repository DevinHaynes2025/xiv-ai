import { buildOllamaRuntimeReceipt, canUseOllamaForLocalBrain, selectPreferredOllamaModel } from './ollama-live-runtime-bridge';

if (selectPreferredOllamaModel(['gpt-oss:20b', 'qwen2.5-coder:7b']) !== 'qwen2.5-coder:7b') throw new Error('preferred model selection failed');

const live = buildOllamaRuntimeReceipt({
  reachable: true,
  verifiedAt: '2026-09-11T22:50:00.000Z',
  modelNames: ['qwen2.5-coder:7b', 'gpt-oss:20b'],
  evidenceRef: 'local:ollama-tags-receipt',
});
if (!canUseOllamaForLocalBrain(live)) throw new Error('reachable loopback Ollama should be eligible');
if (live.productionAuthority || live.cloudExecutionVerified || !live.localOnly) throw new Error('Ollama guardrails failed');

const offline = buildOllamaRuntimeReceipt({
  reachable: false,
  verifiedAt: '2026-09-11T22:50:00.000Z',
  modelNames: [],
  evidenceRef: 'local:ollama-offline-receipt',
});
if (canUseOllamaForLocalBrain(offline)) throw new Error('offline Ollama must not be eligible');

console.log('12D-90 Ollama live runtime bridge contracts: OK');
