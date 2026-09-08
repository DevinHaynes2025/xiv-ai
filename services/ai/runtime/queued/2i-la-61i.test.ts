import assert from 'node:assert/strict';
import {
  AGENT_STATES,
  AUTO_FLAGS,
  CAPABILITY_FLAGS,
  CAUSAL_STATES,
  DEPLOYMENT_STATE,
  FOUNDER_TWIN_LABEL,
  HARDWARE_STATES,
  IMPLEMENTATION_STARTED,
  INVARIANTS,
  L4_AUTONOMY_ENABLED,
  PROVIDER_STATES,
  STORY_ID,
  STORY_VERSION,
  allAutoFlagsFalse,
  allCapabilityFlagsFalse,
  storyIsImplemented,
} from './2i-la-61i';

assert.equal(STORY_ID, '2I-LA-61I');
assert.equal(STORY_VERSION, 'V735');
assert.equal(DEPLOYMENT_STATE, 'QUEUED');
assert.equal(IMPLEMENTATION_STARTED, false);
assert.equal(L4_AUTONOMY_ENABLED, false);
assert.equal(storyIsImplemented(), false);
assert.equal(allCapabilityFlagsFalse(), true);
assert.equal(allAutoFlagsFalse(), true);

for (const [flag, value] of Object.entries(CAPABILITY_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false while queued`);
}

for (const [flag, value] of Object.entries(AUTO_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false`);
}

assert.deepEqual(CAUSAL_STATES, [
  'CORRELATED',
  'POSSIBLE_CAUSE',
  'SUPPORTED_CAUSE',
  'DISPUTED_CAUSE',
  'UNKNOWN',
]);
assert.ok(CAUSAL_STATES.includes('UNKNOWN'));
assert.ok(!CAUSAL_STATES.includes('PROVEN_CAUSE' as never));

assert.ok(AGENT_STATES.includes('QUARANTINED'));
assert.ok(AGENT_STATES.includes('RETIRED'));
assert.equal(PROVIDER_STATES[0], 'NOT_CONFIGURED');
assert.ok(!PROVIDER_STATES.includes('LIVE' as never));
assert.equal(HARDWARE_STATES[0], 'UNKNOWN');
assert.ok(HARDWARE_STATES.indexOf('DETECTED') < HARDWARE_STATES.indexOf('SUPPORTED'));
assert.ok(HARDWARE_STATES.indexOf('SUPPORTED') < HARDWARE_STATES.indexOf('OPTIMIZED'));

assert.equal(
  FOUNDER_TWIN_LABEL,
  'XIV Founder Twin — AI representation of Devin Xavier Haynes',
);

for (const [name, value] of Object.entries(INVARIANTS)) {
  assert.equal(value, false, `invariant ${name} must stay denied`);
}

console.log('2I-LA-61I queued architecture contracts hold (NOT IMPLEMENTED).');
