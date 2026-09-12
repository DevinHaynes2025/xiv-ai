import { TARGET_MATRIX, type DeviceCompatibilityProfile } from './universal-device-compatibility';

export type DeviceEnrollmentState = 'ENROLLED_NOT_ACTIVE' | 'ELIGIBLE_FOR_LOCAL_TASKS' | 'PAUSED' | 'REVOKED' | 'EXPIRED' | 'UNVERIFIED_COMPATIBILITY';
export type DeviceParticipationPurpose = 'LOCAL_ASSISTANCE' | 'PERSONAL_REPRESENTATIVE' | 'EDUCATIONAL_PRACTICE';

export interface DeviceEnrollmentRequest {
  tenantId: string;
  userId: string;
  deviceId: string;
  deviceFamily: DeviceCompatibilityProfile['deviceFamily'];
  osFamily: DeviceCompatibilityProfile['osFamily'];
  cpuFamily: DeviceCompatibilityProfile['cpuFamily'];
  requestedSurfaces: readonly DeviceCompatibilityProfile['supportedSurfaces'][number][];
  purposes: readonly DeviceParticipationPurpose[];
  consentRefs: readonly string[];
  enrolledAtMs: number;
  expiresAtMs: number;
  computeSharingOptIn: boolean;
  backgroundWorkOptIn: boolean;
}

export interface DeviceEnrollmentRecord extends DeviceEnrollmentRequest {
  compatibility: Readonly<DeviceCompatibilityProfile>;
  state: DeviceEnrollmentState;
  localWorkerStarted: false;
  productionAuthorityGranted: false;
  remoteProviderAuthorized: false;
  biometricCloneAuthorized: false;
}

export interface DeviceActivationContext {
  nowMs: number;
  networkAvailable: boolean;
  batteryPercent: number;
  thermalState: 'NOMINAL' | 'WARM' | 'HOT' | 'CRITICAL';
  localModelAvailable: boolean;
  appForeground: boolean;
  userPaused: boolean;
  consentRevoked: boolean;
}

const id=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const refs=(v:readonly string[])=>Array.isArray(v)&&v.length>0&&v.length<=16&&v.every(r=>typeof r==='string'&&r.trim().length>0&&r.length<=256);
const unique=<T>(v:readonly T[])=>new Set(v).size===v.length;

function targetOf(req:DeviceEnrollmentRequest):DeviceCompatibilityProfile|undefined{
  return TARGET_MATRIX.find(p=>p.deviceFamily===req.deviceFamily&&p.osFamily===req.osFamily&&p.cpuFamily===req.cpuFamily);
}

export const DEVICE_FLEET_POLICY=Object.freeze({
  maxEnrollmentWindowMs:30*24*60*60*1000,
  minimumBatteryPercentForBackground:30,
  allowedThermalStates:Object.freeze(['NOMINAL','WARM'] as const),
  consentRequired:true,
  compatibilityEvidenceRequiredForActivation:true,
  computeSharingDefault:false,
  backgroundWorkDefault:false,
  localWorkerAutostart:false,
  productionAuthorityFromEnrollment:false,
  biometricOrIdentityCloneFromEnrollment:false,
  universalDeviceSupportClaimAllowed:false,
});

/** Enrollment is a consent record, not proof of compatibility and not permission to start work. */
export function enrollDevice(req:DeviceEnrollmentRequest):DeviceEnrollmentRecord{
  if(!req||![req.tenantId,req.userId,req.deviceId].every(id))throw new Error('scoped device identity required');
  if(!Number.isSafeInteger(req.enrolledAtMs)||!Number.isSafeInteger(req.expiresAtMs)||req.expiresAtMs<=req.enrolledAtMs)throw new Error('valid enrollment window required');
  if(req.expiresAtMs-req.enrolledAtMs>DEVICE_FLEET_POLICY.maxEnrollmentWindowMs)throw new Error('enrollment window exceeds policy');
  if(!refs(req.consentRefs)||!unique(req.consentRefs.map(r=>r.trim())))throw new Error('distinct consent evidence required');
  if(!Array.isArray(req.purposes)||req.purposes.length<1||!unique(req.purposes))throw new Error('at least one unique participation purpose required');
  if(!Array.isArray(req.requestedSurfaces)||req.requestedSurfaces.length<1||!unique(req.requestedSurfaces))throw new Error('requested surfaces required');
  const compatibility=targetOf(req);
  if(!compatibility)throw new Error('device class is not in the current target matrix');
  for(const s of req.requestedSurfaces)if(!compatibility.supportedSurfaces.includes(s))throw new Error(`unsupported requested surface: ${s}`);
  return Object.freeze({...req,requestedSurfaces:Object.freeze([...req.requestedSurfaces]),purposes:Object.freeze([...req.purposes]),consentRefs:Object.freeze([...req.consentRefs.map(r=>r.trim())]),compatibility:Object.freeze({...compatibility,evidenceRefs:Object.freeze([...compatibility.evidenceRefs]),supportedSurfaces:Object.freeze([...compatibility.supportedSurfaces])}) as Readonly<DeviceCompatibilityProfile>,state:compatibility.state==='VERIFIED'?'ENROLLED_NOT_ACTIVE':'UNVERIFIED_COMPATIBILITY',localWorkerStarted:false as const,productionAuthorityGranted:false as const,remoteProviderAuthorized:false as const,biometricCloneAuthorized:false as const});
}

/** Pure activation assessment. It starts no worker, opens no network connection, and changes no OS settings. */
export function assessDeviceActivation(record:DeviceEnrollmentRecord,ctx:DeviceActivationContext){
  if(!record||!ctx||!Number.isSafeInteger(ctx.nowMs)||ctx.nowMs<0||!Number.isFinite(ctx.batteryPercent)||ctx.batteryPercent<0||ctx.batteryPercent>100)throw new Error('valid activation context required');
  const reasons:string[]=[];
  let state:DeviceEnrollmentState=record.state;
  if(ctx.consentRevoked){state='REVOKED';reasons.push('user consent revoked');}
  else if(ctx.nowMs>=record.expiresAtMs){state='EXPIRED';reasons.push('enrollment expired');}
  else if(ctx.userPaused){state='PAUSED';reasons.push('user paused participation');}
  else if(record.compatibility.state!=='VERIFIED'){state='UNVERIFIED_COMPATIBILITY';reasons.push('device compatibility is targeted but not verified');}
  else{
    if(record.requestedSurfaces.includes('LOCAL_AGENT')&&!ctx.localModelAvailable)reasons.push('local model unavailable for requested LOCAL_AGENT surface');
    if(record.backgroundWorkOptIn){
      if(ctx.batteryPercent<DEVICE_FLEET_POLICY.minimumBatteryPercentForBackground)reasons.push('battery below background threshold');
      if(!DEVICE_FLEET_POLICY.allowedThermalStates.includes(ctx.thermalState as 'NOMINAL'|'WARM'))reasons.push('thermal state blocks background work');
    }
    if(!ctx.appForeground&&!record.backgroundWorkOptIn)reasons.push('background work not authorized');
    state=reasons.length===0?'ELIGIBLE_FOR_LOCAL_TASKS':'ENROLLED_NOT_ACTIVE';
  }
  return Object.freeze({tenantId:record.tenantId,userId:record.userId,deviceId:record.deviceId,state,reasons:Object.freeze(reasons),networkAvailable:ctx.networkAvailable,localWorkerStarted:false as const,remoteCallsMade:0,productionAuthorityGranted:false as const,biometricCloneAuthorized:false as const,humanDecision:'REQUIRED' as const});
}
