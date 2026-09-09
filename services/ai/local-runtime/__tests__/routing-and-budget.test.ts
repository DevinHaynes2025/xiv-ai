import test from 'node:test';
import assert from 'node:assert/strict';
import type { HardwareSnapshot } from '../types';
import { routeWorkload } from '../workload-router';
import { evaluateResourceRequest } from '../resource-governor';

const snapshot: HardwareSnapshot = {
  capturedAt: '2026-09-09T13:30:00.000Z',
  platform: 'win32',
  release: 'test',
  arch: 'x64',
  totalMemoryBytes: 16_000,
  freeMemoryBytes: 8_000,
  cpu: { kind: 'cpu', name: 'AMD Test CPU', vendor: 'AMD', state: 'DETECTED', evidence: [] },
  gpus: [{ kind: 'gpu', name: 'AMD Test GPU', vendor: 'AMD', state: 'DETECTED', evidence: [] }],
  npus: [],
  notes: [],
};

test('router does not treat DETECTED GPU as VERIFIED', () => {
  const decision = routeWorkload(snapshot, { preferLocal: true });
  assert.equal(decision.compute, 'cpu');
});

test('accelerator-required route does not select unverified GPU', () => {
  const decision = routeWorkload(snapshot, { requiresVerifiedAccelerator: true, allowCloud: false });
  assert.equal(decision.compute, 'cpu');
  assert.notEqual(decision.capabilityState, 'VERIFIED');
});

test('resource governor rejects requests above ceilings', () => {
  const result = evaluateResourceRequest(
    { concurrentTasks: 9, estimatedMemoryBytes: 9_000 },
    { maxConcurrentTasks: 4, maxMemoryBytes: 8_000 },
  );
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.length >= 2);
});
