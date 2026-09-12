import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildAgentWorkforceCensus, type WorkforceCatalogEntry, type ConfiguredWorkerSeat } from './agent-workforce-census';
const generatedAt = '2026-09-11T23:00:00.000Z';
const catalog: WorkforceCatalogEntry[] = [
  { id: 'executive', name: 'Executive', status: 'prototype' },
  { id: 'finance', name: 'Finance', status: 'registered' },
  { id: 'innovation', name: 'Innovation', status: 'future' },
  { id: 'test-only', name: 'Test fixture', status: 'available' },
];
const offlineSeats: ConfiguredWorkerSeat[] = [
  { id: 'OLLAMA_BUILDER', enabled: true, maxConcurrentJobs: 2, requiresOllama: true, mayWriteProduction: false },
  { id: 'REVIEWER', enabled: false, maxConcurrentJobs: 1, requiresOllama: false, mayWriteProduction: false },
];
const report = () => buildAgentWorkforceCensus({ catalog, offlineSeats, generatedAt });
test('counts definition maturity, not instantiated workers', () => {
  const r = report(); assert.equal(r.primaryCatalog.definitionCount, 4);
  assert.deepEqual(r.primaryCatalog.byMaturity, { registered: 1, prototype: 1, available: 1, future: 1 });
  assert.equal(r.runtime.registeredInstanceCount, null); assert.equal(r.runtime.runningInstanceCount, null);
});
test('configured seats and job slots stay separate', () => {
  const r = report(); assert.equal(r.defaultOfflineTeam.seatDefinitionCount, 2);
  assert.equal(r.defaultOfflineTeam.enabledInConfiguration, 1); assert.equal(r.defaultOfflineTeam.configuredJobSlots, 2);
  assert.equal(r.inventoriesAdditive, false); assert.equal(r.ecosystemTotal, null);
});
test('even an empty catalog does not assert zero running agents', () => {
  const r = buildAgentWorkforceCensus({ catalog: [], offlineSeats: [], generatedAt });
  assert.equal(r.primaryCatalog.definitionCount, 0); assert.equal(r.runtime.runningInstanceCount, null);
});
test('duplicate identities in either inventory fail instead of inflating totals', () => {
  assert.throws(() => buildAgentWorkforceCensus({ catalog: [catalog[0], catalog[0]], offlineSeats, generatedAt }));
  assert.throws(() => buildAgentWorkforceCensus({ catalog, offlineSeats: [offlineSeats[0], offlineSeats[0]], generatedAt }));
});
test('overlap across different inventory scopes is not summed', () => {
  const r = buildAgentWorkforceCensus({ catalog: [{ ...catalog[0], id: offlineSeats[0].id }], offlineSeats, generatedAt });
  assert.equal(r.primaryCatalog.definitionCount, 1); assert.equal(r.defaultOfflineTeam.seatDefinitionCount, 2);
  assert.equal(r.ecosystemTotal, null);
});
test('blank identities, whitespace aliases and unknown maturity fail', () => {
  for (const patch of [{ id: '' }, { id: ' executive' }, { name: '' }, { status: 'running' as never }]) {
    assert.throws(() => buildAgentWorkforceCensus({ catalog: [{ ...catalog[0], ...patch }], offlineSeats, generatedAt }));
  }
});
test('finite integer and bounded concurrency configuration required', () => {
  for (const maxConcurrentJobs of [NaN, Infinity, 0, -1, 1.5, 65]) {
    assert.throws(() => buildAgentWorkforceCensus({ catalog, offlineSeats: [{ ...offlineSeats[0], maxConcurrentJobs }], generatedAt }));
  }
});
test('configuration booleans cannot be truthy strings or allow production writes', () => {
  for (const patch of [{ enabled: 'yes' as never }, { requiresOllama: 'yes' as never }, { mayWriteProduction: true as never }]) {
    assert.throws(() => buildAgentWorkforceCensus({ catalog, offlineSeats: [{ ...offlineSeats[0], ...patch }], generatedAt }));
  }
});
test('invalid dates and unbounded input fail', () => {
  for (const date of ['bad', '', '2026-02-30T00:00:00.000Z', '2026-09-11']) {
    assert.throws(() => buildAgentWorkforceCensus({ catalog, offlineSeats, generatedAt: date }));
  }
  assert.throws(() => buildAgentWorkforceCensus({ catalog: Array(10_001).fill(catalog[0]), offlineSeats, generatedAt }));
});
test('report is immutable and does not retain input objects', () => {
  const entries = [{ ...catalog[0] }];
  const r = buildAgentWorkforceCensus({ catalog: entries, offlineSeats, generatedAt });
  entries[0].name = 'changed'; assert.equal(r.primaryCatalog.definitions[0].name, 'Executive');
  assert.ok(Object.isFrozen(r.primaryCatalog.definitions[0])); assert.ok(Object.isFrozen(r.defaultOfflineTeam.seats[0]));
  assert.ok(Object.isFrozen(r.runtime)); assert.ok(Object.isFrozen(r.primaryCatalog.byMaturity));
});
test('untrusted runtime flags and incidental private fields are not promoted or copied', () => {
  const extra = { ...catalog[0], running: true, providerVerified: true, customerText: 'DO_NOT_COPY' };
  const r = buildAgentWorkforceCensus({ catalog: [extra], offlineSeats, generatedAt });
  assert.equal(r.runtime.runningInstanceCount, null); assert.equal(r.allAgentsAligned, null);
  assert.equal(JSON.stringify(r).includes('DO_NOT_COPY'), false); assert.equal(r.productionAuthorizationGranted, false);
});
test('a loaded model or enabled seat is never claimed as a verified agent', () => {
  const r = report(); assert.equal(r.modelCountIsAgentCount, false); assert.equal(r.evidenceKind, 'SOURCE_CONFIGURATION_ONLY');
  assert.equal(r.runtime.status, 'NOT_OBSERVED');
});
