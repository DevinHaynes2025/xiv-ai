import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyHeartbeat } from '../runtime-state';

test('fresh explicit running heartbeat is RUNNING_VERIFIED', () => {
  const now = new Date('2026-09-09T13:30:00.000Z');
  const result = classifyHeartbeat(
    { nodeId: 'asus-local', observedAt: '2026-09-09T13:29:30.000Z', running: true },
    now,
  );
  assert.equal(result.state, 'RUNNING_VERIFIED');
});

test('stale heartbeat cannot remain RUNNING_VERIFIED', () => {
  const now = new Date('2026-09-09T13:30:00.000Z');
  const result = classifyHeartbeat(
    { nodeId: 'asus-local', observedAt: '2026-09-09T13:20:00.000Z', running: true },
    now,
  );
  assert.equal(result.state, 'STALE');
});

test('explicit stopped node is OFFLINE_STOPPED', () => {
  const now = new Date('2026-09-09T13:30:00.000Z');
  const result = classifyHeartbeat(
    { nodeId: 'asus-local', observedAt: '2026-09-09T13:29:50.000Z', running: false },
    now,
  );
  assert.equal(result.state, 'OFFLINE_STOPPED');
});
