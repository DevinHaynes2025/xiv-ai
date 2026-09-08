import assert from 'node:assert/strict';

import { evaluateOfflineTask } from './offline-policy';

const base = {
  needsInternet: false,
  needsCloudProvider: false,
  needsExternalFreshness: false,
  needsProductionWrite: false,
  needsPermissionChange: false,
  classification: 'internal' as const,
};

assert.deepEqual(evaluateOfflineTask(base), {
  allowed: true,
  state: 'LOCAL_EXECUTABLE',
  reason: 'Task is eligible for bounded local execution.',
});

assert.equal(evaluateOfflineTask({ ...base, needsInternet: true }).state, 'WAITING_DATA');
assert.equal(evaluateOfflineTask({ ...base, needsExternalFreshness: true }).state, 'WAITING_DATA');
assert.equal(evaluateOfflineTask({ ...base, needsCloudProvider: true }).state, 'UNAVAILABLE');
assert.equal(evaluateOfflineTask({ ...base, needsProductionWrite: true }).state, 'DENIED');
assert.equal(evaluateOfflineTask({ ...base, needsPermissionChange: true }).state, 'DENIED');

console.log('offline-policy.test.ts PASS');
