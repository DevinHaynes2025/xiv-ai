import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assessDeviceParticipation, type DeviceParticipationInput } from './device-participation-assessment';
import { validateDevicePilotEnrollment } from './device-pilot-enrollment';
const now = 1_000_000;
const fixture = (): DeviceParticipationInput => ({ schemaVersion:1,
  actor:{userId:'user-1',tenantId:'tenant-1',deviceId:'device-1'},
  enrollment:{userId:'user-1',tenantId:'tenant-1',deviceId:'device-1',enrolledAt:new Date(now-1000).toISOString(),expiresAt:new Date(now+600_000).toISOString(),consentVersion:'v1',capabilities:['LOCAL_MODELS'],biometricOrPasskeyVerified:true,mfaVerified:true,recoveryConfigured:true,auditEnabled:true,killSwitchEnabled:true},
  consent:{recordId:'consent-1',userId:'user-1',tenantId:'tenant-1',deviceId:'device-1',version:'v1',purposes:['LOCAL_ASSISTANCE'],issuedAtMs:now-1000,checkedAtMs:now,expiresAtMs:now+600_000,revoked:false,paused:false,allowBackground:false},
  device:{observedAtMs:now,os:'WINDOWS',network:'OFFLINE',executionClass:'CPU',localModelInstalled:true,modelExecution:'LOCAL',backendProbe:'PASSED',availableMemoryMiB:12000,modelMemoryMiB:5200,reserveMemoryMiB:2048,batteryPercent:80,charging:false,thermal:'NORMAL',backgroundExecutionPermitted:false},
  task:{taskId:'task-1',tenantId:'tenant-1',deviceId:'device-1',purpose:'LOCAL_ASSISTANCE',subjectUserId:'user-1',profileOwnerUserId:'user-1',profileSha256:'a'.repeat(64),requestedDataClass:'ORDINARY',requestedRoute:'LOCAL',background:false,maxOutputTokens:256,maxTaskMs:60000,concurrency:1},
});
const assess = (v = fixture(), at=now) => assessDeviceParticipation(JSON.stringify(v),at);
function denied(change:(v:DeviceParticipationInput)=>void, reason?:string) { const v=fixture(); change(v); const r=assess(v); assert.equal(r.status,'BLOCKED'); if(reason) assert.ok(r.reasons.includes(reason),JSON.stringify(r)); }

test('valid offline fixture is policy-eligible, never execution-authorized',()=>{
 const r=assess(); assert.equal(r.status,'POLICY_ELIGIBLE_NOT_STARTED'); assert.equal(r.validUntilMs,now+60000);
 assert.equal(r.operationalAuthorizationGranted,false); assert.equal(r.consentAuthenticityVerified,false);
 assert.equal(r.hardwareAttested,false); assert.equal(r.deviceWorkerStarted,false); assert.equal(r.modelCallsMade,0);
});
test('online local route stays local and never implies all tools are connected',()=>{
 const v=fixture(); v.device.network='ONLINE'; const r=assess(v); assert.equal(r.status,'POLICY_ELIGIBLE_NOT_STARTED');
 assert.equal(r.connectionVerifiedByThisAssessment,false); assert.equal(r.cloudFallbackAllowed,false);
});
test('malformed oversized and nonobject JSON is rejected',()=>{
 for(const s of ['{','null','[]','"hello"',' '.repeat(16385)]) assert.equal(assessDeviceParticipation(s,now).status,'BLOCKED');
});
test('invalid clock never creates a favorable result',()=>{
 for(const n of [NaN,Infinity,-1,1.5,Number.MAX_SAFE_INTEGER+1]) assert.equal(assess(fixture(),n).status,'BLOCKED');
});
test('unrecognized fields cannot request data copying or privilege',()=>{
 const v=fixture() as unknown as Record<string,unknown>; v.cloneEveryone=true;
 assert.equal(assessDeviceParticipation(JSON.stringify(v),now).status,'BLOCKED');
 denied(v=>{(v.consent as unknown as Record<string,unknown>).copyAllContacts=true;},'INVALID_SCHEMA');
});
test('strict identifiers reject whitespace and terminal newlines',()=>{
 for(const value of ['','user\n','user x','../user']) denied(v=>{v.actor.userId=value;},'INVALID_SCHEMA');
});
test('cross-tenant enrollment consent and task each fail',()=>{
 for(const part of ['enrollment','consent','task'] as const) denied(v=>{v[part].tenantId='other';},'IDENTITY_SCOPE_MISMATCH');
});
test('cross-device enrollment consent and task each fail',()=>{
 for(const part of ['enrollment','consent','task'] as const) denied(v=>{v[part].deviceId='other';},'IDENTITY_SCOPE_MISMATCH');
});
test('consenting for another user is rejected',()=>{
 denied(v=>{v.consent.userId='other';},'IDENTITY_SCOPE_MISMATCH');
 denied(v=>{v.enrollment.userId='other';},'IDENTITY_SCOPE_MISMATCH');
});
test('personal representative requires the subject and profile owner to match the user',()=>{
 denied(v=>{v.task.subjectUserId='other';},'PERSONAL_PROFILE_OWNERSHIP_MISMATCH');
 denied(v=>{v.task.profileOwnerUserId='other';},'PERSONAL_PROFILE_OWNERSHIP_MISMATCH');
});
test('legacy expired enrollment gap is closed on this new assessment path only',()=>{
 const v=fixture(); v.enrollment.expiresAt=new Date(now-1).toISOString();
 assert.equal(validateDevicePilotEnrollment(v.enrollment),true);
 assert.ok(assess(v).reasons.includes('ENROLLMENT_EXPIRED_OR_UNBOUNDED'));
});
test('missing future or malformed enrollment validity fails',()=>{
 denied(v=>{delete v.enrollment.expiresAt;},'ENROLLMENT_EXPIRED_OR_UNBOUNDED');
 denied(v=>{v.enrollment.enrolledAt=new Date(now+1).toISOString();},'ENROLLMENT_EXPIRED_OR_UNBOUNDED');
 denied(v=>{v.enrollment.expiresAt='tomorrow';},'INVALID_SCHEMA');
});
test('consent version and purpose are independently enforced',()=>{
 denied(v=>{v.consent.version='v2';},'PURPOSE_OR_CONSENT_VERSION_MISMATCH');
 denied(v=>{v.task.purpose='PERSONAL_REPRESENTATIVE';},'PURPOSE_OR_CONSENT_VERSION_MISMATCH');
 denied(v=>{v.consent.purposes=[];},'PURPOSE_OR_CONSENT_VERSION_MISMATCH');
});
test('revocation and pause block even while offline',()=>{
 denied(v=>{v.consent.revoked=true;},'CONSENT_REVOKED');
 denied(v=>{v.consent.paused=true;},'PARTICIPATION_PAUSED');
});
test('expired future and excessively long consent fail',()=>{
 denied(v=>{v.consent.expiresAtMs=now;},'CONSENT_EXPIRED_OR_INVALID');
 denied(v=>{v.consent.issuedAtMs=now+1;},'CONSENT_EXPIRED_OR_INVALID');
 denied(v=>{v.consent.checkedAtMs=now+1;},'CONSENT_EXPIRED_OR_INVALID');
 denied(v=>{v.consent.expiresAtMs=now+86_400_001;},'CONSENT_EXPIRED_OR_INVALID');
});
test('offline consent snapshot cannot be renewed forever without a fresh check',()=>{
 denied(v=>{v.consent.issuedAtMs=now-400000;v.consent.checkedAtMs=now-300001;},'CONSENT_RECHECK_REQUIRED');
});
test('stale future and exactly exhausted device evidence is blocked',()=>{
 denied(v=>{v.device.observedAtMs=now-300001;},'DEVICE_EVIDENCE_STALE_OR_FUTURE');
 denied(v=>{v.device.observedAtMs=now+1;},'DEVICE_EVIDENCE_STALE_OR_FUTURE');
 denied(v=>{v.device.observedAtMs=now-300000;},'ASSESSMENT_WINDOW_EXHAUSTED');
});
test('local model capability and enrollment safety requirements remain mandatory',()=>{
 denied(v=>{v.enrollment.capabilities=['FILES_READ'];},'LOCAL_MODEL_CAPABILITY_NOT_CONSENTED');
 for(const key of ['mfaVerified','biometricOrPasskeyVerified','recoveryConfigured','auditEnabled','killSwitchEnabled'] as const) denied(v=>{v.enrollment[key]=false;},'LEGACY_ENROLLMENT_REQUIREMENTS_NOT_MET');
});
test('invalid duplicate or unrecognized capabilities are rejected',()=>{
 denied(v=>{v.enrollment.capabilities=['LOCAL_MODELS','LOCAL_MODELS'];},'LEGACY_ENROLLMENT_REQUIREMENTS_NOT_MET');
 denied(v=>{v.enrollment.capabilities=['ROOT_ACCESS' as never];},'INVALID_SCHEMA');
});
test('cloud routes and cloud-hosted models cannot pass the offline pilot',()=>{
 denied(v=>{v.task.requestedRoute='CLOUD';},'CLOUD_ROUTE_NOT_ALLOWED_IN_LOCAL_PILOT');
 denied(v=>{v.device.modelExecution='CLOUD';},'CLOUD_ROUTE_NOT_ALLOWED_IN_LOCAL_PILOT');
});
test('missing models and failed unknown backend probes fail closed',()=>{
 denied(v=>{v.device.localModelInstalled=false;},'LOCAL_RUNTIME_NOT_READY');
 for(const p of ['UNKNOWN','FAILED'] as const) denied(v=>{v.device.backendProbe=p;},'LOCAL_RUNTIME_NOT_READY');
});
test('memory budget requires actual positive model estimate and explicit reserve',()=>{
 denied(v=>{v.device.availableMemoryMiB=6000;},'MEMORY_BUDGET_NOT_MET');
 denied(v=>{v.device.modelMemoryMiB=0;},'MEMORY_BUDGET_NOT_MET');
 denied(v=>{v.device.reserveMemoryMiB=511;},'MEMORY_BUDGET_NOT_MET');
 for(const n of [NaN,Infinity,-1]) denied(v=>{v.device.availableMemoryMiB=n;},'INVALID_SCHEMA');
});
test('battery and thermal holds prevent participation assessment',()=>{
 denied(v=>{v.device.batteryPercent=29;},'DEVICE_POWER_OR_THERMAL_HOLD');
 for(const thermal of ['HOT','UNKNOWN'] as const) denied(v=>{v.device.thermal=thermal;},'DEVICE_POWER_OR_THERMAL_HOLD');
 const v=fixture();v.device.batteryPercent=20;v.device.charging=true;assert.equal(assess(v).status,'POLICY_ELIGIBLE_NOT_STARTED');
});
test('background work needs both separate consent and an OS allowance',()=>{
 denied(v=>{v.task.background=true;},'BACKGROUND_EXECUTION_NOT_PERMITTED');
 denied(v=>{v.task.background=true;v.consent.allowBackground=true;},'BACKGROUND_EXECUTION_NOT_PERMITTED');
 const v=fixture();v.task.background=true;v.consent.allowBackground=true;v.device.backgroundExecutionPermitted=true;
 assert.equal(assess(v).status,'POLICY_ELIGIBLE_NOT_STARTED');assert.equal(assess(v).deviceWorkerStarted,false);
});
test('CPU GPU NPU and OS labels never become actual hardware attestation',()=>{
 for(const os of ['WINDOWS','LINUX','MACOS','ANDROID','IOS','BROWSER'] as const) for(const executionClass of ['CPU','GPU','NPU'] as const){
  const v=fixture();v.device.os=os;v.device.executionClass=executionClass;const r=assess(v);
  assert.equal(r.status,'POLICY_ELIGIBLE_NOT_STARTED');assert.equal(r.hardwareAttested,false);
 }
});
test('budgets stop trillion-way work and excessive per-task generation',()=>{
 for(const concurrency of [0,2,1e12]) denied(v=>{v.task.concurrency=concurrency;},'TASK_BUDGET_EXCEEDED');
 for(const maxOutputTokens of [0,513]) denied(v=>{v.task.maxOutputTokens=maxOutputTokens;},'TASK_BUDGET_EXCEEDED');
 for(const maxTaskMs of [0,120001]) denied(v=>{v.task.maxTaskMs=maxTaskMs;},'TASK_BUDGET_EXCEEDED');
});
test('personal representative opt-in describes an assistant and copies no person or data',()=>{
 const v=fixture();v.consent.purposes=['PERSONAL_REPRESENTATIVE'];v.task.purpose='PERSONAL_REPRESENTATIVE';
 const r=assess(v);assert.equal(r.status,'POLICY_ELIGIBLE_NOT_STARTED');
 assert.equal(r.representativeKind,'OPTIONAL_AI_ASSISTANT_NOT_A_COPY_OF_A_PERSON');assert.equal(r.userCloneCreated,false);assert.equal(r.userDataCopied,false);
});
test('educational practice does not authorize model-weight changes',()=>{
 const v=fixture();v.consent.purposes=['EDUCATIONAL_PRACTICE'];v.task.purpose='EDUCATIONAL_PRACTICE';
 assert.equal(assess(v).status,'POLICY_ELIGIBLE_NOT_STARTED');assert.equal(assess(v).modelWeightsChanged,false);
});
test('confidential requests and deceptive boolean strings are rejected',()=>{
 denied(v=>{v.task.requestedDataClass='CONFIDENTIAL' as never;},'INVALID_SCHEMA');
 denied(v=>{v.consent.revoked='false' as never;},'INVALID_SCHEMA');
});
test('assessment lifetime is capped by the earliest expiring dependency',()=>{
 const v=fixture();v.consent.expiresAtMs=now+1234;assert.equal(assess(v).validUntilMs,now+1234);
});
test('returned policy report is immutable and omits identities and raw profile hashes',()=>{
 const r=assess();assert.ok(Object.isFrozen(r));assert.ok(Object.isFrozen(r.reasons));
 const s=JSON.stringify(r);assert.equal(s.includes('user-1'),false);assert.equal(s.includes('a'.repeat(64)),false);
});
// ---------------------------------------------------------------------------
// Reconciliation (12D-96 queue lineage x 12D-97 consent assessment): the
// consent assessment RIDES the queue lineage. Policy eligibility here is one
// sequential gate; it is never admission, never a lease, never execution.
// ---------------------------------------------------------------------------
import { OfflineStoryQueue } from './offline-story-queue';
import { SharedHostLeaseStore } from './shared-host-lease-store';
import { SharedQueueAdmission, type SharedQueueContext } from './shared-queue-admission';
import { OFFLINE_QUEUE_GUARDRAILS } from './work-queue';
import { ENTERPRISE_WORKFORCE } from './enterprise-workforce';

const qHostId = 'a'.repeat(32), qSource = 'b'.repeat(40), qPlan = 'c'.repeat(64);
const qContext: SharedQueueContext = { tenantId: 'synthetic-tenant', holderInstanceId: 'synthetic-worker',
  sourceCommit: qSource, approvedPlanSha256: qPlan, providerId: 'ollama', modelId: 'qwen2.5-coder:7b',
  presenceEvidenceRef: 'fixture:presence' };
const qStory = (id = 'story-1') => ({ id, tenantId: qContext.tenantId, roleId: 'node_backend',
  objective: `Synthetic bounded draft ${id}`, acceptance: ['Must pass the fixture test'], dependencies: [],
  sourceRevision: qSource, masterPlanSha256: qPlan, kind: 'PRODUCT_STORY' as const, securityClass: 'ORDINARY' as const });

test('reconciliation: the queue-lineage invariants hold beneath the consent assessment',()=>{
 assert.equal(OFFLINE_QUEUE_GUARDRAILS.productionWritesAllowed, false);
 assert.equal(OFFLINE_QUEUE_GUARDRAILS.policyGateBypassAllowed, false);
 assert.equal(OFFLINE_QUEUE_GUARDRAILS.humanDecision, 'REQUIRED');
 // The consent assessment rode the 12D-96 queue lineage without forking the catalog.
 assert.equal(ENTERPRISE_WORKFORCE.length, 100);
});

test('reconciliation: eligibility here is never admission there, and admission grants no execution either',()=>{
 const r = assess();
 assert.equal(r.status, 'POLICY_ELIGIBLE_NOT_STARTED');
 assert.ok(r.mustObtainBeforeExecution.includes('shared host lease'), 'the assessment itself names the shared host lease as still required');
 // The assessment result carries no lease, ticket or admission handle it could substitute.
 for (const key of Object.keys(r)) assert.equal(/lease|ticket|admis|handle/i.test(key), false, `assessment carries authority-shaped field ${key}`);
 // And even the queue lineage's own admission path — with a real queue and host —
 // grants no execution authority; the two gates compose sequentially, neither suffices.
 const dir = mkdtempSync(join(tmpdir(), 'xiv-dpa-recon-'));
 try {
  SharedHostLeaseStore.initialize(join(dir, 'host.sqlite'), qHostId);
  const host = new SharedHostLeaseStore(join(dir, 'host.sqlite'), qHostId, () => now);
  const queue = new OfflineStoryQueue(join(dir, 'queue.sqlite'), () => now);
  queue.enqueue([qStory()]);
  const admission = new SharedQueueAdmission(queue, host, qContext);
  const admitted = admission.claimNext('node_backend');
  assert.equal(admitted.status, 'ADMITTED_NOT_STARTED');
  assert.equal(admitted.executionAuthorityGranted, false);
  assert.equal(admitted.humanReviewRequired, true);
  assert.equal(admitted.modelCallsMade, 0);
  // Consent assessment on the admitted story's device remains assessment-only:
  // the same POLICY_ELIGIBLE_NOT_STARTED result with zero authority either way.
  const still = assess();
  assert.equal(still.status, 'POLICY_ELIGIBLE_NOT_STARTED');
  assert.equal(still.operationalAuthorizationGranted, false);
  queue.close(); host.close();
 } finally { rmSync(dir, { recursive: true, force: true }); }
});
