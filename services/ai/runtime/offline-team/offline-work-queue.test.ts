import assert from 'node:assert/strict';
import { OfflineWorkQueue } from './work-queue';
import { RecoveryJournal } from './recovery-journal';
import { DEFAULT_OPENAI_LOCAL, OPENAI_LOCAL_GUARDRAILS, probeOpenAiLocal } from './openai-local';

const start = new Date('2026-09-10T10:00:00.000Z');
const queue = new OfflineWorkQueue();
queue.enqueue({ id: 'w1', storyId: '12D-20-001', objective: 'offline build', priority: 10, maxAttempts: 2 }, start);
const [leased] = queue.lease('OLLAMA_BUILDER', start, 1000, 1);
assert.equal(leased.status, 'LEASED');
assert.equal(leased.leaseOwner, 'OLLAMA_BUILDER');

const recovered = queue.recoverExpiredLeases(new Date(start.getTime() + 2000));
assert.equal(recovered.length, 1);
assert.equal(recovered[0].status, 'QUEUED');

const journal = new RecoveryJournal();
journal.append({ eventId: 'e1', workItemId: 'w1', kind: 'ENQUEUED', actor: 'LOCAL_RULES', at: start.toISOString() });
const serialized = journal.toJsonLines();
const restored = new RecoveryJournal();
restored.restoreJsonLines(serialized);
assert.equal(restored.list().length, 1);
assert.equal(restored.list()[0].sequence, 1);

assert.equal(OPENAI_LOCAL_GUARDRAILS.chatgptProductOfflineClaimAllowed, false);
assert.equal(DEFAULT_OPENAI_LOCAL.provider, 'OLLAMA');
const probe = await probeOpenAiLocal({ fetchImpl: async () => ({ ok: true }) });
assert.equal(probe.reachable, true);
assert.equal(probe.chatgptProduct, false);
assert.equal(probe.openWeightModel, true);

console.log('XIV 12D-20 offline work queue contracts hold.');
