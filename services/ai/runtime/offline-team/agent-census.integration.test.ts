import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { listXivAgents } from '../agents';
import { DEFAULT_OFFLINE_TEAM } from './orchestrator';
import { buildAgentCensus } from './agent-census';

test('real core registry has a scoped census, not an invented running-agent count', () => {
  const c = buildAgentCensus(listXivAgents(), DEFAULT_OFFLINE_TEAM);
  assert.equal(c.coreDefinitionCount, 21);
  assert.deepEqual(c.declaredStatusCounts, { registered: 5, prototype: 15, available: 0, future: 1 });
  assert.equal(c.configuredOfflineSeatCount, 4);
  assert.equal(c.liveAgentCount, null);
  assert.equal(c.productionReadinessInferred, false);
  console.log(JSON.stringify({ coreDefinitions: c.coreDefinitionCount, statuses: c.declaredStatusCounts, configuredOfflineSeats: c.configuredOfflineSeatCount, liveAgentCount: c.liveAgentCount }));
});
