import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { listXivAgents } from '../agents';
import { DEFAULT_OFFLINE_TEAM } from './orchestrator';
import { buildAgentWorkforceCensus } from './agent-workforce-census';
const census = () => buildAgentWorkforceCensus({ catalog: listXivAgents(), offlineSeats: DEFAULT_OFFLINE_TEAM,
  generatedAt: '2026-09-11T23:00:00.000Z' });
test('real primary registry contains 21 unique definitions with stated maturity', () => {
  const r = census(); assert.equal(r.primaryCatalog.definitionCount, 21);
  assert.deepEqual(r.primaryCatalog.byMaturity, { registered: 5, prototype: 15, available: 0, future: 1 });
  assert.equal(new Set(r.primaryCatalog.definitions.map(d => d.id)).size, 21);
});
test('real offline defaults configure four seats and six job slots, not six live agents', () => {
  const r = census(); assert.equal(r.defaultOfflineTeam.seatDefinitionCount, 4);
  assert.equal(r.defaultOfflineTeam.enabledInConfiguration, 4); assert.equal(r.defaultOfflineTeam.configuredJobSlots, 6);
  assert.equal(r.runtime.runningInstanceCount, null); assert.equal(r.ecosystemTotal, null);
});
