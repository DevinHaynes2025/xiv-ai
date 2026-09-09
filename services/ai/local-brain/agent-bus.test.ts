import assert from 'node:assert/strict';

import {
  agentBusStats,
  inbox,
  publishAgentMessage,
  reapExpiredAgentMessages,
  resetAgentBus,
} from './agent-bus';

resetAgentBus();
const first = publishAgentMessage({
  fromRole: 'coder',
  toRole: 'tester',
  tenantId: 't1',
  universeId: 'u1',
  kind: 'task',
  body: 'hello',
  evidenceRefs: ['ev-1'],
  requiresHumanApproval: false,
  ttlMs: 5_000,
  now: 1_000,
});
assert.equal(first.expiresAt, new Date(6_000).toISOString());
assert.equal(agentBusStats(1_000).productionAuthorization, false);
assert.equal(agentBusStats(1_000).defaultTtlMs, 30 * 60_000);
assert.equal(inbox('tester', 't1', 'u1', 1_000).length, 1);
assert.equal(inbox('tester', 't1', 'u2', 1_000).length, 0);
assert.equal(reapExpiredAgentMessages(6_000), 1);
assert.equal(inbox('tester', 't1', 'u1', 6_000).length, 0);
assert.equal(agentBusStats(6_000).bufferedMessages, 0);

assert.throws(
  () => publishAgentMessage({
    fromRole: 'coder',
    toRole: 'tester',
    tenantId: 't1',
    universeId: 'u1',
    kind: 'task',
    body: 'x'.repeat(16_001),
    evidenceRefs: [],
    requiresHumanApproval: false,
  }),
  /too large/,
);

console.log('agent-bus.test.ts PASS');
