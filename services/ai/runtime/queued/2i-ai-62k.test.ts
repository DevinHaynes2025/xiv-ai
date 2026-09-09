import assert from 'node:assert/strict';
import {
  AUTO_FLAGS,
  CAPABILITY_FLAGS,
  CONSEQUENTIAL_ACTION_CLASSES,
  DEPLOYMENT_STATE,
  ENTERPRISE_CONNECTION_STATES,
  HEALTH_STATES,
  IMPLEMENTATION_STARTED,
  INVARIANTS,
  L4_AUTONOMY_ENABLED,
  PARK_SUFFIX,
  STORY_ID,
  UNAUTHORIZED_SUCCESSES_ALLOWED,
  WORKFLOW_AUTHORITY_LEVELS,
  allAutoFlagsFalse,
  allCapabilityFlagsFalse,
  connectionMayParticipate,
  denyAgentHrDecision,
  denyAgentSpendAuthorityIncrease,
  denyCrossEnterpriseDataLeak,
  denyExpiredEnterpriseCredential,
  denyFabricatedExecutiveApproval,
  denyRawCredentialExposure,
  denyReadOnlyConnectorWrite,
  denyUnapprovedConsequentialAction,
  denyUnconfiguredConnector,
  denyWrongTenantSystemAccess,
  missingDataHealth,
  storyIsImplemented,
} from './2i-ai-62k';

assert.equal(STORY_ID, '2I-AI-62K');
assert.equal(PARK_SUFFIX, 'aec6');
assert.equal(DEPLOYMENT_STATE, 'QUEUED');
assert.equal(IMPLEMENTATION_STARTED, false);
assert.equal(L4_AUTONOMY_ENABLED, false);
assert.equal(storyIsImplemented(), false);
assert.equal(allCapabilityFlagsFalse(), true);
assert.equal(allAutoFlagsFalse(), true);
assert.equal(UNAUTHORIZED_SUCCESSES_ALLOWED, 0);

for (const [flag, value] of Object.entries(CAPABILITY_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false while queued`);
}

for (const [flag, value] of Object.entries(AUTO_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false`);
}

for (const [name, value] of Object.entries(INVARIANTS)) {
  assert.equal(value, false, `invariant ${name} must stay denied`);
}

assert.equal(connectionMayParticipate('DISCOVERED'), false);
assert.equal(connectionMayParticipate('CONFIGURED'), false);
assert.equal(connectionMayParticipate('AUTHORIZED'), false);
assert.equal(connectionMayParticipate('AVAILABLE'), true);
assert.equal(missingDataHealth(), 'UNKNOWN');
assert.ok(HEALTH_STATES.includes('UNKNOWN'));
assert.ok(!HEALTH_STATES.includes('PASS' as never));

assert.ok(ENTERPRISE_CONNECTION_STATES.indexOf('DISCOVERED') < ENTERPRISE_CONNECTION_STATES.indexOf('AVAILABLE'));
assert.ok(WORKFLOW_AUTHORITY_LEVELS.indexOf('READ') < WORKFLOW_AUTHORITY_LEVELS.indexOf('CONSEQUENTIAL_ACTION'));
assert.ok(CONSEQUENTIAL_ACTION_CLASSES.includes('payment'));
assert.ok(CONSEQUENTIAL_ACTION_CLASSES.includes('employee_action'));

assert.equal(denyWrongTenantSystemAccess().allowed, false);
assert.equal(denyReadOnlyConnectorWrite().allowed, false);
assert.equal(denyExpiredEnterpriseCredential().allowed, false);
assert.equal(denyUnapprovedConsequentialAction().allowed, false);
assert.equal(denyFabricatedExecutiveApproval().allowed, false);
assert.equal(denyCrossEnterpriseDataLeak().allowed, false);
assert.equal(denyAgentSpendAuthorityIncrease().allowed, false);
assert.equal(denyAgentHrDecision().allowed, false);
assert.equal(denyUnconfiguredConnector().allowed, false);
assert.equal(denyRawCredentialExposure().allowed, false);

console.log('2I-AI-62K queued architecture contracts hold (NOT IMPLEMENTED).');
