import { validateDevicePilotEnrollment, type DevicePilotEnrollment } from './device-pilot-enrollment';

/** A reviewable policy assessment, NOT authentication, an execution lease or device attestation. */
export const DEVICE_PARTICIPATION_LIMITS = Object.freeze({
  maxInputBytes: 16_384, maxEvidenceAgeMs: 300_000, maxOfflineConsentAgeMs: 300_000,
  maxAssessmentLifetimeMs: 60_000, maxConsentLifetimeMs: 86_400_000,
  maxOutputTokens: 512, maxTaskMs: 120_000, maxPilotConcurrency: 1,
});
const purposes = ['LOCAL_ASSISTANCE', 'PERSONAL_REPRESENTATIVE', 'EDUCATIONAL_PRACTICE'] as const;
const capabilities = ['FILES_READ','FILES_WRITE','CAMERA','MICROPHONE','SCREEN','NOTIFICATIONS','LOCAL_MODELS','LOCAL_DATABASES','AUTOMATION'];
export type ParticipationPurpose = typeof purposes[number];
export interface DeviceParticipationInput {
  schemaVersion: 1;
  actor: { userId: string; tenantId: string; deviceId: string };
  enrollment: DevicePilotEnrollment;
  consent: { recordId: string; userId: string; tenantId: string; deviceId: string; version: string;
    purposes: readonly ParticipationPurpose[]; issuedAtMs: number; checkedAtMs: number; expiresAtMs: number;
    revoked: boolean; paused: boolean; allowBackground: boolean };
  device: { observedAtMs: number; os: 'WINDOWS'|'LINUX'|'MACOS'|'ANDROID'|'IOS'|'BROWSER';
    network: 'ONLINE'|'OFFLINE'; executionClass: 'CPU'|'GPU'|'NPU'; localModelInstalled: boolean;
    modelExecution: 'LOCAL'|'CLOUD'; backendProbe: 'PASSED'|'FAILED'|'UNKNOWN';
    availableMemoryMiB: number; modelMemoryMiB: number; reserveMemoryMiB: number;
    batteryPercent: number; charging: boolean; thermal: 'NORMAL'|'HOT'|'UNKNOWN';
    backgroundExecutionPermitted: boolean };
  task: { taskId: string; tenantId: string; deviceId: string; purpose: ParticipationPurpose;
    subjectUserId: string; profileOwnerUserId: string; profileSha256: string;
    requestedDataClass: 'ORDINARY'; requestedRoute: 'LOCAL'|'CLOUD';
    background: boolean; maxOutputTokens: number; maxTaskMs: number; concurrency: number };
}
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const id = (v: unknown): v is string => typeof v === 'string' && v === v.trim() && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(v);
const time = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const number = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const oneOf = (v: unknown, values: readonly unknown[]) => values.includes(v);
const keys = (v: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []) =>
  required.every(k => Object.hasOwn(v,k)) && Object.keys(v).every(k => required.includes(k) || optional.includes(k));
const isoTime = (v: unknown): number | null => {
  if (typeof v !== 'string' || v.length !== 24) return null;
  const ms = Date.parse(v); return Number.isFinite(ms) && new Date(ms).toISOString() === v ? ms : null;
};
function valid(v: unknown): v is DeviceParticipationInput {
  if (!record(v) || !keys(v, ['schemaVersion','actor','enrollment','consent','device','task']) || v.schemaVersion !== 1) return false;
  const {actor:a,enrollment:e,consent:c,device:d,task:t}=v;
  if (![a,e,c,d,t].every(record) || !record(a) || !record(e) || !record(c) || !record(d) || !record(t)) return false;
  return keys(a,['userId','tenantId','deviceId']) && Object.values(a).every(id)
    && keys(e,['userId','tenantId','deviceId','enrolledAt','consentVersion','capabilities','biometricOrPasskeyVerified','mfaVerified','recoveryConfigured','auditEnabled','killSwitchEnabled'],['expiresAt'])
    && ['userId','tenantId','deviceId','consentVersion'].every(k=>id(e[k])) && isoTime(e.enrolledAt)!==null
    && (e.expiresAt===undefined || isoTime(e.expiresAt)!==null) && Array.isArray(e.capabilities)
    && e.capabilities.length<=capabilities.length && e.capabilities.every(x=>oneOf(x,capabilities))
    && ['biometricOrPasskeyVerified','mfaVerified','recoveryConfigured','auditEnabled','killSwitchEnabled'].every(k=>typeof e[k]==='boolean')
    && keys(c,['recordId','userId','tenantId','deviceId','version','purposes','issuedAtMs','checkedAtMs','expiresAtMs','revoked','paused','allowBackground'])
    && ['recordId','userId','tenantId','deviceId','version'].every(k=>id(c[k]))
    && ['issuedAtMs','checkedAtMs','expiresAtMs'].every(k=>time(c[k]))
    && ['revoked','paused','allowBackground'].every(k=>typeof c[k]==='boolean')
    && Array.isArray(c.purposes) && c.purposes.length<=3 && new Set(c.purposes).size===c.purposes.length && c.purposes.every(x=>oneOf(x,purposes))
    && keys(d,['observedAtMs','os','network','executionClass','localModelInstalled','modelExecution','backendProbe','availableMemoryMiB','modelMemoryMiB','reserveMemoryMiB','batteryPercent','charging','thermal','backgroundExecutionPermitted'])
    && time(d.observedAtMs) && oneOf(d.os,['WINDOWS','LINUX','MACOS','ANDROID','IOS','BROWSER'])
    && oneOf(d.network,['ONLINE','OFFLINE']) && oneOf(d.executionClass,['CPU','GPU','NPU'])
    && oneOf(d.modelExecution,['LOCAL','CLOUD']) && oneOf(d.backendProbe,['PASSED','FAILED','UNKNOWN'])
    && ['localModelInstalled','charging','backgroundExecutionPermitted'].every(k=>typeof d[k]==='boolean')
    && ['availableMemoryMiB','modelMemoryMiB','reserveMemoryMiB'].every(k=>number(d[k],0,1_048_576))
    && number(d.batteryPercent,0,100) && oneOf(d.thermal,['NORMAL','HOT','UNKNOWN'])
    && keys(t,['taskId','tenantId','deviceId','purpose','subjectUserId','profileOwnerUserId','profileSha256','requestedDataClass','requestedRoute','background','maxOutputTokens','maxTaskMs','concurrency'])
    && ['taskId','tenantId','deviceId','subjectUserId','profileOwnerUserId'].every(k=>id(t[k]))
    && oneOf(t.purpose,purposes) && typeof t.profileSha256==='string' && t.profileSha256.length===64 && /^[a-f0-9]+$/.test(t.profileSha256)
    && t.requestedDataClass==='ORDINARY' && oneOf(t.requestedRoute,['LOCAL','CLOUD']) && typeof t.background==='boolean'
    && ['maxOutputTokens','maxTaskMs','concurrency'].every(k=>time(t[k]));
}
/**
 * Accept only bounded JSON from a separately authenticated host/service boundary. Input claims are
 * not evidence of user consent, identity or hardware. A favorable result cannot start a worker.
 * Re-evaluate immediately before each bounded action; never reuse as a durable permission grant.
 */
export function assessDeviceParticipation(rawJson: string, nowMs: number) {
  const result = (reasons: string[], validUntilMs: number | null, representative: boolean) => Object.freeze({
    schemaVersion: 1, status: reasons.length ? 'BLOCKED' : 'POLICY_ELIGIBLE_NOT_STARTED',
    reasons: Object.freeze(reasons), validUntilMs, assessmentOnly: true,
    operationalAuthorizationGranted: false, consentAuthenticityVerified: false, masterPlanAlignmentCertified: false,
    hardwareAttested: false, connectionVerifiedByThisAssessment: false,
    modelCallsMade: 0, deviceWorkerStarted: false, cloudFallbackAllowed: false,
    userDataCopied: false, modelWeightsChanged: false, userCloneCreated: false,
    representativeKind: representative ? 'OPTIONAL_AI_ASSISTANT_NOT_A_COPY_OF_A_PERSON' : null,
    mustObtainBeforeExecution: Object.freeze(['authenticated user consent','current device evidence','shared host lease','isolated bounded executor','approved master-plan revision','enforced cancellation deadline']),
  });
  if (!time(nowMs) || typeof rawJson!=='string' || Buffer.byteLength(rawJson,'utf8')>DEVICE_PARTICIPATION_LIMITS.maxInputBytes) return result(['INVALID_INPUT'],null,false);
  let v: unknown; try { v=JSON.parse(rawJson); } catch { return result(['INVALID_JSON'],null,false); }
  if (!valid(v)) return result(['INVALID_SCHEMA'],null,false);
  const { actor:a,enrollment:e,consent:c,device:d,task:t }=v;
  const reasons:string[]=[];
  if (!validateDevicePilotEnrollment(e)) reasons.push('LEGACY_ENROLLMENT_REQUIREMENTS_NOT_MET');
  if (![e,c].every(s=>s.userId===a.userId && s.tenantId===a.tenantId && s.deviceId===a.deviceId)
    || t.tenantId!==a.tenantId || t.deviceId!==a.deviceId) reasons.push('IDENTITY_SCOPE_MISMATCH');
  if (t.subjectUserId!==a.userId || t.profileOwnerUserId!==a.userId) reasons.push('PERSONAL_PROFILE_OWNERSHIP_MISMATCH');
  if (!e.capabilities.includes('LOCAL_MODELS')) reasons.push('LOCAL_MODEL_CAPABILITY_NOT_CONSENTED');
  const enrollmentStart=isoTime(e.enrolledAt)!;
  const enrollmentEnd=isoTime(e.expiresAt);
  if (enrollmentStart>nowMs || enrollmentEnd===null || enrollmentEnd<=nowMs || enrollmentEnd<=enrollmentStart) reasons.push('ENROLLMENT_EXPIRED_OR_UNBOUNDED');
  if (c.version!==e.consentVersion || !c.purposes.includes(t.purpose)) reasons.push('PURPOSE_OR_CONSENT_VERSION_MISMATCH');
  if (c.revoked || c.paused) reasons.push(c.revoked?'CONSENT_REVOKED':'PARTICIPATION_PAUSED');
  if (c.issuedAtMs>nowMs || c.checkedAtMs>nowMs || c.checkedAtMs<c.issuedAtMs || c.expiresAtMs<=nowMs
    || c.expiresAtMs<=c.issuedAtMs || c.expiresAtMs-c.issuedAtMs>DEVICE_PARTICIPATION_LIMITS.maxConsentLifetimeMs) reasons.push('CONSENT_EXPIRED_OR_INVALID');
  if (nowMs-c.checkedAtMs>DEVICE_PARTICIPATION_LIMITS.maxOfflineConsentAgeMs) reasons.push('CONSENT_RECHECK_REQUIRED');
  if (d.observedAtMs>nowMs || nowMs-d.observedAtMs>DEVICE_PARTICIPATION_LIMITS.maxEvidenceAgeMs) reasons.push('DEVICE_EVIDENCE_STALE_OR_FUTURE');
  if (t.requestedRoute!=='LOCAL' || d.modelExecution!=='LOCAL') reasons.push('CLOUD_ROUTE_NOT_ALLOWED_IN_LOCAL_PILOT');
  if (!d.localModelInstalled || d.backendProbe!=='PASSED') reasons.push('LOCAL_RUNTIME_NOT_READY');
  if (d.modelMemoryMiB<=0 || d.reserveMemoryMiB<512 || d.availableMemoryMiB<d.modelMemoryMiB+d.reserveMemoryMiB) reasons.push('MEMORY_BUDGET_NOT_MET');
  if (d.thermal!=='NORMAL' || (!d.charging && d.batteryPercent<30)) reasons.push('DEVICE_POWER_OR_THERMAL_HOLD');
  if (t.background && (!c.allowBackground || !d.backgroundExecutionPermitted)) reasons.push('BACKGROUND_EXECUTION_NOT_PERMITTED');
  if (t.concurrency!==1 || t.maxOutputTokens<1 || t.maxOutputTokens>512 || t.maxTaskMs<1 || t.maxTaskMs>120_000) reasons.push('TASK_BUDGET_EXCEEDED');
  const validUntilMs=Math.min(nowMs+60_000,c.expiresAtMs,c.checkedAtMs+300_000,d.observedAtMs+300_000,enrollmentEnd??nowMs);
  if (validUntilMs<=nowMs) reasons.push('ASSESSMENT_WINDOW_EXHAUSTED');
  return result(reasons,reasons.length?null:validUntilMs,t.purpose==='PERSONAL_REPRESENTATIVE');
}
