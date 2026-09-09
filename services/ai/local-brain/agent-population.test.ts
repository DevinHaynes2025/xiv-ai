import assert from 'node:assert/strict';

import { requestAgentInstance, resetAgentPopulation, setAgentState, reapExpiredAgents, populationStats, listAgentInstances } from './agent-population';

resetAgentPopulation();
const missingScope = requestAgentInstance({ role: 'coder', tenantId: '', universeId: '', taskId: 'x' });
assert.equal(missingScope.created, false);
assert.match(missingScope.reason ?? '', /Tenant and Universe/);

resetAgentPopulation();
const first = requestAgentInstance({ role: 'coder', tenantId: 't1', universeId: 'u1', taskId: 'one', ttlMinutes: 5, now: 1_000_000 });
assert.equal(first.created, true);
if (!first.created) throw new Error('expected created agent');
assert.equal(first.instance.tenantId, 't1');
assert.equal(first.instance.universeId, 'u1');
assert.equal(first.instance.expiresAt, new Date(1_000_000 + 5 * 60_000).toISOString());

setAgentState(first.instance.id, 'HIBERNATING');
const reused = requestAgentInstance({ role: 'coder', tenantId: 't1', universeId: 'u1', taskId: 'two', ttlMinutes: 10, now: 1_100_000 });
assert.equal(reused.created, false);
assert.equal('reused' in reused && reused.reused, true);
if (!('instance' in reused) || !reused.instance) throw new Error('expected reused instance');
assert.equal(reused.instance.id, first.instance.id);
assert.equal(reused.instance.taskId, 'two');

const otherUniverse = requestAgentInstance({ role: 'coder', tenantId: 't1', universeId: 'u2', taskId: 'other-u', now: 1_100_000 });
assert.equal(otherUniverse.created, true);
const otherTenant = requestAgentInstance({ role: 'coder', tenantId: 't2', universeId: 'u1', taskId: 'other-t', now: 1_100_000 });
assert.equal(otherTenant.created, true);

resetAgentPopulation();
const ttlAgent = requestAgentInstance({ role: 'researcher', tenantId: 'ttl', universeId: 'ttl', ttlMinutes: 5, now: 5_000 });
assert.equal(ttlAgent.created, true);
assert.equal(reapExpiredAgents(5_000 + 5 * 60_000), 1);
const retired = listAgentInstances()[0];
assert.equal(retired?.state, 'RETIRED');
if (!retired) throw new Error('expected retired agent');
assert.throws(() => setAgentState(retired.id, 'READY'), /Invalid agent state transition/);

resetAgentPopulation();
const trans = requestAgentInstance({ role: 'security', tenantId: 'tr', universeId: 'tr' });
assert.equal(trans.created, true);
if (!trans.created) throw new Error('expected transition agent');
assert.equal(setAgentState(trans.instance.id, 'RUNNING').state, 'RUNNING');
assert.equal(setAgentState(trans.instance.id, 'READY').state, 'READY');
assert.throws(() => setAgentState(trans.instance.id, 'READY'), /Invalid agent state transition/);
setAgentState(trans.instance.id, 'BLOCKED');
assert.throws(() => setAgentState(trans.instance.id, 'RUNNING'), /Invalid agent state transition/);

resetAgentPopulation();
for (let i = 0; i < 4; i += 1) {
  const agent = requestAgentInstance({ role: 'tester', tenantId: 'lim', universeId: 'lim', taskId: `role-${i}` });
  assert.equal(agent.created, true);
}
const fifthRole = requestAgentInstance({ role: 'tester', tenantId: 'lim', universeId: 'lim', taskId: 'role-5' });
assert.equal(fifthRole.created, false);
assert.match(fifthRole.reason ?? '', /Per-role active budget/);

resetAgentPopulation();
for (let i = 0; i < 3; i += 1) {
  const agent = requestAgentInstance({ role: 'tester', tenantId: 'lim', universeId: 'lim', taskId: `a-${i}` });
  assert.equal(agent.created, true);
}
const spare = requestAgentInstance({ role: 'tester', tenantId: 'other', universeId: 'other', taskId: 'spare' });
assert.equal(spare.created, true);
if (spare.created) setAgentState(spare.instance.id, 'HIBERNATING');
const fourth = requestAgentInstance({ role: 'tester', tenantId: 'lim', universeId: 'lim', taskId: 'fourth' });
assert.equal(fourth.created, true);
const reuseDenied = requestAgentInstance({ role: 'tester', tenantId: 'other', universeId: 'other', taskId: 'wake-over-role' });
assert.equal(reuseDenied.created, false);
assert.match(reuseDenied.reason ?? '', /Per-role active budget/);

resetAgentPopulation();
const roles = ['architect', 'coder', 'tester', 'security', 'researcher', 'business_analyst', 'finance_analyst', 'supply_chain_analyst'] as const;
for (const role of roles) {
  for (let i = 0; i < 4; i += 1) {
    const agent = requestAgentInstance({ role, tenantId: 'active', universeId: 'active', taskId: `${role}-${i}` });
    assert.equal(agent.created, true);
  }
}
assert.equal(populationStats().active, 32);
const overflowActive = requestAgentInstance({ role: 'operations_analyst', tenantId: 'active', universeId: 'active', taskId: 'overflow' });
assert.equal(overflowActive.created, false);
assert.match(overflowActive.reason ?? '', /active budget/);

resetAgentPopulation();
for (let i = 0; i < 256; i += 1) {
  const agent = requestAgentInstance({ role: 'coder', tenantId: `t-${i}`, universeId: 'reg', taskId: `reg-${i}` });
  assert.equal(agent.created, true);
  if (agent.created) setAgentState(agent.instance.id, 'RETIRED');
}
const overflowRegistered = requestAgentInstance({ role: 'coder', tenantId: 't-new', universeId: 'reg', taskId: 'too-many' });
assert.equal(overflowRegistered.created, false);
assert.match(overflowRegistered.reason ?? '', /registered-agent budget/);

const recursive = requestAgentInstance({ role: 'coder', tenantId: 't1', universeId: 'u1', lineage: ['a', 'a'] });
assert.equal(recursive.created, false);

console.log('agent-population.test.ts PASS');
