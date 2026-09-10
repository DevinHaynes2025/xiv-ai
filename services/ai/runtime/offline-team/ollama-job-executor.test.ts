import assert from 'node:assert/strict';
import { OfflineWorkQueue } from './work-queue';
import { RecoveryJournal } from './recovery-journal';
import { executeOneOllamaJob } from './ollama-job-executor';

const queue = new OfflineWorkQueue();
queue.enqueue({
  id: 'job-12d26-001',
  storyId: '12D-26',
  objective: 'Generate a bounded local patch proposal',
  priority: 100,
  maxAttempts: 2,
});
const journal = new RecoveryJournal();
const now = new Date('2026-09-10T12:40:00.000Z');

const result = await executeOneOllamaJob({
  queue,
  journal,
  now,
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return { model: 'qwen2.5-coder:7b', done: true, response: 'Plan: inspect, patch, test, record evidence.' };
    },
  }),
});

assert.ok(result);
assert.equal(result?.ok, true);
assert.equal(result?.model, 'qwen2.5-coder:7b');
assert.equal(result?.evidence.includes('OLLAMA_LOCAL_GENERATE'), true);
assert.equal(queue.snapshot()[0]?.status, 'DONE');
assert.equal(journal.list().map((entry) => entry.kind).join(','), 'LEASED,COMPLETED');
assert.equal(result?.outputHash.length, 64);

console.log('12D-26 Ollama job executor contracts: OK');
