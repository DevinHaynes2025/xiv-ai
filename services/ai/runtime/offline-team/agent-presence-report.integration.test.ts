import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { listXivAgents } from '../agents';
import { DEFAULT_OFFLINE_TEAM } from './orchestrator';
import { AuthenticatedAgentReport } from './agent-presence-report';

test('real registries retain 21 definitions and four seats without implying any live worker', () => {
  const monitor = new AuthenticatedAgentReport({ tenantId: 'xiv-dev-pilot', definitions: listXivAgents(),
    seats: DEFAULT_OFFLINE_TEAM, enrollments: [] });
  const r = monitor.snapshot();
  assert.equal(r.sourceInventory.coreDefinitionCount, 21);
  assert.deepEqual(r.sourceInventory.declaredStatusCounts, { registered: 5, prototype: 15, available: 0, future: 1 });
  assert.equal(r.sourceInventory.configuredOfflineSeatCount, 4);
  assert.equal(r.instancePresence.catalogDefinitionCount, 21);
  assert.equal(r.instancePresence.enrolledInstanceCount, 0);
  assert.equal(r.instancePresence.scopedRunningInstanceCount, null);
  assert.equal(r.globalLiveAgentCount, null);
});
