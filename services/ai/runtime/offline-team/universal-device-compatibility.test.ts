import { TARGET_MATRIX, verifyCompatibility, UNIVERSAL_COMPATIBILITY_GUARDRAILS } from './universal-device-compatibility';
import { canUseCapability, CAPABILITY_BROKER_GUARDRAILS } from './device-capability-broker';

if (TARGET_MATRIX.length < 10) throw new Error('target matrix too small');
const android = TARGET_MATRIX.find(x => x.osFamily === 'ANDROID' && x.deviceFamily === 'PHONE');
if (!android) throw new Error('android phone target missing');
const verified = verifyCompatibility(android, ['device:android-emulator:receipt-1']);
if (verified.state !== 'VERIFIED') throw new Error('verification failed');
if (UNIVERSAL_COMPATIBILITY_GUARDRAILS.universalSupportClaimAllowedWithoutEvidence) throw new Error('unsupported universal claim allowed');
if (CAPABILITY_BROKER_GUARDRAILS.blanketDeviceAccessAllowed) throw new Error('blanket access allowed');
const grants = [{ userId:'u1', tenantId:'t1', deviceId:'d1', capability:'LOCAL_MODEL' as const, granted:true, grantedAt:new Date().toISOString(), evidenceRefs:['consent:1'] }];
if (!canUseCapability(grants, { userId:'u1', tenantId:'t1', deviceId:'d1', capability:'LOCAL_MODEL' })) throw new Error('valid capability grant rejected');
if (canUseCapability(grants, { userId:'u1', tenantId:'t2', deviceId:'d1', capability:'LOCAL_MODEL' })) throw new Error('cross-tenant grant leaked');
console.log('12D-46 universal device compatibility/capability broker contracts: OK');
