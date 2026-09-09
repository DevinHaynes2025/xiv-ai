import assert from 'node:assert/strict';

import { selectAvailableTargets, validateWorkEnvelope, type WorkEnvelope, type ProviderObservation } from './collaboration-protocol';

const base: WorkEnvelope = {
  id: 'env-1',
  tenantId: 't1',
  universeId: 'u1',
  storyId: '62L-N',
  objective: 'Coordinate a bounded local coding task.',
  requestedRoles: ['coder', 'tester', 'security'],
  sourceProvider: 'cursor',
  targetProviders: ['chatgpt', 'gemini', 'claude'],
  evidenceRefs: ['story:62L-N'],
  classification: 'internal',
  consequence: 'LOW',
  productionAuthorized: false,
  permissionExpansionAuthorized: false,
};

const ok = validateWorkEnvelope(base);
assert.equal(ok.accepted, true);
assert.equal(ok.state, 'AVAILABLE');

const high = validateWorkEnvelope({ ...base, consequence: 'HIGH' });
assert.equal(high.accepted, false);
assert.equal(high.state, 'HUMAN_APPROVAL_REQUIRED');

const critical = validateWorkEnvelope({ ...base, consequence: 'CRITICAL' });
assert.equal(critical.accepted, false);
assert.equal(critical.state, 'HUMAN_APPROVAL_REQUIRED');

assert.throws(() => validateWorkEnvelope({ ...base, targetProviders: [] }), /TARGET_PROVIDER_REQUIRED/);
assert.throws(() => validateWorkEnvelope({ ...base, objective: '  ' }), /INVALID_WORK_ENVELOPE/);

const observations: ProviderObservation[] = [
  { provider: 'chatgpt', state: 'UNAVAILABLE', evidenceRefs: [], notes: 'Not configured in this environment.' },
  { provider: 'gemini', state: 'AVAILABLE', evidenceRefs: [], notes: 'State claimed without evidence.' },
  { provider: 'claude', state: 'AVAILABLE', evidenceRefs: ['health:claude:verified'], notes: 'Verified in a different lab; included for routing math only.' },
];

const routed = selectAvailableTargets(base, observations);
assert.equal(routed.find((item) => item.provider === 'chatgpt')?.state, 'UNAVAILABLE');
assert.equal(routed.find((item) => item.provider === 'gemini')?.state, 'UNAVAILABLE');
assert.equal(routed.find((item) => item.provider === 'claude')?.state, 'AVAILABLE');

const missingObservation = selectAvailableTargets({ ...base, targetProviders: ['local_model'] }, observations);
assert.equal(missingObservation[0].state, 'UNAVAILABLE');

console.log('collaboration-protocol.test.ts PASS');
