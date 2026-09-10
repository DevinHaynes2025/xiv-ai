import { strict as assert } from 'node:assert';
import { validateDevicePilotEnrollment } from './device-pilot-enrollment';
import { authorizeDevicePilotAction } from './device-pilot-policy';
import { stageLocalLearning } from './local-learning-sandbox';

const enrollment = {
  userId: 'u1', tenantId: 't1', deviceId: 'd1', enrolledAt: new Date(0).toISOString(), consentVersion: '1',
  capabilities: ['FILES_READ','LOCAL_MODELS'] as const,
  biometricOrPasskeyVerified: true, mfaVerified: true, recoveryConfigured: true, auditEnabled: true, killSwitchEnabled: true,
};
assert.equal(validateDevicePilotEnrollment(enrollment), true);
assert.equal(authorizeDevicePilotAction(enrollment, { actionId:'a1', tenantId:'t1', deviceId:'d1', capability:'FILES_READ', risk:'LOW', requiresNetwork:false, containsTopSecret:false }).allowed, true);
assert.equal(authorizeDevicePilotAction(enrollment, { actionId:'a2', tenantId:'t1', deviceId:'d1', capability:'FILES_READ', risk:'HIGH', requiresNetwork:false, containsTopSecret:false }).requiresHumanApproval, true);
assert.equal(authorizeDevicePilotAction(enrollment, { actionId:'a3', tenantId:'t1', deviceId:'d1', capability:'LOCAL_MODELS', risk:'LOW', requiresNetwork:true, containsTopSecret:true }).allowed, false);
assert.equal(stageLocalLearning({ tenantId:'t1', sourceRef:'receipt:1', content:'approved lesson', approved:true, classification:'INTERNAL' }).modelWeightsMutated, false);
console.log('12D-45 secure device pilot/local learning contracts: OK');
