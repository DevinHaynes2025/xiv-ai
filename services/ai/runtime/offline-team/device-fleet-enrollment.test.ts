import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { enrollDevice, assessDeviceActivation, DEVICE_FLEET_POLICY } from './device-fleet-enrollment';
import { verifyCompatibility, TARGET_MATRIX } from './universal-device-compatibility';

const now=1_800_000_000_000;
const base=()=>({tenantId:'tenant-a',userId:'user-a',deviceId:'phone-a',deviceFamily:'PHONE' as const,osFamily:'ANDROID' as const,cpuFamily:'ARM64' as const,requestedSurfaces:['REACT_NATIVE','LOCAL_AGENT'] as const,purposes:['LOCAL_ASSISTANCE'] as const,consentRefs:['consent:user-a:1'],enrolledAtMs:now,expiresAtMs:now+86_400_000,computeSharingOptIn:false,backgroundWorkOptIn:false});
const ctx=()=>({nowMs:now+1000,networkAvailable:false,batteryPercent:80,thermalState:'NOMINAL' as const,localModelAvailable:true,appForeground:true,userPaused:false,consentRevoked:false});

test('targeted Android enrollment stays unverified and starts nothing',()=>{const r=enrollDevice(base());assert.equal(r.state,'UNVERIFIED_COMPATIBILITY');assert.equal(r.localWorkerStarted,false);assert.equal(r.productionAuthorityGranted,false);assert.equal(r.remoteProviderAuthorized,false);assert.equal(r.biometricCloneAuthorized,false);const a=assessDeviceActivation(r,ctx());assert.equal(a.state,'UNVERIFIED_COMPATIBILITY');assert.equal(a.localWorkerStarted,false);});

test('verified compatibility can become eligible but assessment still starts no work',()=>{const target=TARGET_MATRIX.find(p=>p.deviceFamily==='PHONE'&&p.osFamily==='ANDROID'&&p.cpuFamily==='ARM64')!;const verified=verifyCompatibility(target,['device-lab:android-arm64']);const r={...enrollDevice(base()),compatibility:verified,state:'ENROLLED_NOT_ACTIVE' as const};const a=assessDeviceActivation(r,ctx());assert.equal(a.state,'ELIGIBLE_FOR_LOCAL_TASKS');assert.equal(a.localWorkerStarted,false);assert.equal(a.remoteCallsMade,0);});

test('iOS enrollment rejects LOCAL_AGENT because current target matrix does not claim that surface',()=>{assert.throws(()=>enrollDevice({...base(),deviceId:'iphone-a',osFamily:'IOS' as const,requestedSurfaces:['LOCAL_AGENT'] as const}),/unsupported requested surface/);const r=enrollDevice({...base(),deviceId:'iphone-a',osFamily:'IOS' as const,requestedSurfaces:['REACT_NATIVE'] as const});assert.equal(r.compatibility.osFamily,'IOS');});

test('expired, paused, and revoked states fail closed',()=>{const r=enrollDevice(base());assert.equal(assessDeviceActivation(r,{...ctx(),nowMs:r.expiresAtMs}).state,'EXPIRED');assert.equal(assessDeviceActivation(r,{...ctx(),userPaused:true}).state,'PAUSED');assert.equal(assessDeviceActivation(r,{...ctx(),consentRevoked:true}).state,'REVOKED');});

test('background participation respects battery and thermal constraints',()=>{const target=verifyCompatibility(TARGET_MATRIX.find(p=>p.osFamily==='ANDROID'&&p.deviceFamily==='PHONE')!,['lab:android']);const r={...enrollDevice({...base(),backgroundWorkOptIn:true}),compatibility:target,state:'ENROLLED_NOT_ACTIVE' as const};assert.equal(assessDeviceActivation(r,{...ctx(),appForeground:false,batteryPercent:DEVICE_FLEET_POLICY.minimumBatteryPercentForBackground-1}).state,'ENROLLED_NOT_ACTIVE');assert.equal(assessDeviceActivation(r,{...ctx(),appForeground:false,thermalState:'HOT'}).state,'ENROLLED_NOT_ACTIVE');assert.equal(assessDeviceActivation(r,{...ctx(),appForeground:false,batteryPercent:80,thermalState:'WARM'}).state,'ELIGIBLE_FOR_LOCAL_TASKS');});

test('consent evidence, enrollment bounds, and unsupported device classes are validated',()=>{assert.throws(()=>enrollDevice({...base(),consentRefs:[]}),/consent/);assert.throws(()=>enrollDevice({...base(),expiresAtMs:now+DEVICE_FLEET_POLICY.maxEnrollmentWindowMs+1}),/window exceeds/);assert.throws(()=>enrollDevice({...base(),cpuFamily:'RISCV' as const}),/target matrix/);});
